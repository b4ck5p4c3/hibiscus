import { type ReverseZone, type Zone, ZoneType } from '@/parser/interface'
import { type Lease, LeaseType, type LeaseWithHostname } from '@/providers/interface'
import { Eta } from 'eta'

import { ZoneCommitStatus, type ZoneRecord } from './interface'
import templateBody from './template.eta'

const eta = new Eta()

export class Zonefile {
  /**
   * Zone records
   */
  public readonly records: ZoneRecord[] = []

  /**
   * Initialize a new Zonefile provider
   * @param zone Zone configuration
   */
  constructor (private zone: Zone) {}

  /**
   * Replace the serial in the zonefile contents
   * @param contents Zonefile
   * @param serial New serial
   * @returns Updated zonefile
   */
  private static replaceSerial (contents: string, serial: string): string {
    return contents.replace(/(\d+)\s+;\s+Serial/, `${serial}  ; Serial`)
  }

  /**
   * Resolves leases based on predefined selection criteria
   * @param leases Array of lease objects to resolve
   * @returns Selected lease or null
   */
  private static resolveLeases (leases: Lease[]): Lease | null {
    // If no leases available, return null
    if (leases.length === 0) return null

    // If only one lease available, return it
    if (leases.length === 1) return leases[0] as Lease

    // If more than one lease available, filter only static leases
    const staticLeases = leases.filter(lease => lease.type === LeaseType.Static)

    // If there is no OR more than one static lease, return null
    if (staticLeases.length !== 1) return null

    return staticLeases[0] as Lease
  }

  /**
   * Parses hostnames into records referencing the IP address
   * @param index Map of Leases indexed by hostname
   */
  private addHostnameRecords (index: Map<string, Lease[]>): void {
    for (const [hostname, leases] of index) {
      const lease = Zonefile.resolveLeases(leases)
      if (lease) {
        this.records.push({
          name: hostname,
          type: 'A',
          value: lease.ipv4,
        })
      }
    }
  }

  /**
   * Parses MAC addresses into records referencing the IP address
   * @param index Map of Leases indexed by MAC address
   */
  private addMacRecords (index: Map<string, Lease[]>): void {
    // We allow one MAC address to have multiple IP addresses
    // But if one of leases is static, we record only static ones
    for (const [mac, input] of index) {
      const staticLeases = input.filter(lease => lease.type === LeaseType.Static)
      for (const lease of staticLeases.length > 0 ? staticLeases : input) {
        this.records.push({
          name: mac.toLowerCase().replaceAll(':', '-'),
          type: 'A',
          value: lease.ipv4,
        })
      }
    }
  }

  /**
   * Parses leases into PTR records for this zonefile
   * @param index Map of Leases indexed by IP address
   */
  private addPtrRecords (index: Map<string, LeaseWithHostname[]>): void {
    const prefix = (this.zone as ReverseZone).ptrSubnet

    for (const [, leases] of index) {
      const lease = Zonefile.resolveLeases(leases)
      if (lease) {
        this.records.push({
          name: `${lease.ipv4.replace(prefix, '').split('.').reverse().join('.')}`,
          type: 'PTR',
          value: `${lease.hostname}.${this.zone.domain}`,
        })
      }
    }
  }

  /**
   * Indexes leases by a specific key
   * @param leases - Leases to index
   * @param indexKey - Key to index by
   * @returns Indexed map
   */
  private index<K extends keyof T, T = Lease> (leases: T[], indexKey: K): Map<T[K], T[]> {
    const index = new Map<T[K], T[]>()
    for (const lease of leases) {
      const key = lease[indexKey]
      const array = index.get(key) ?? [] as T[]
      array.push(lease)
      index.set(key, array)
    }

    return index
  }

  /**
   * Commit the zonefile to the filesystem
   * @returns Commit status
   */
  async commit (): Promise<ZoneCommitStatus> {
    const serial = Math.floor(Date.now() / 1000).toString()
    const newContents = this.toString(serial)

    const existingContents = await Bun.file(this.zone.outFile).text().catch(() => null)

    // Write file if it doesn't exist
    if (!existingContents) {
      await Bun.write(this.zone.outFile, newContents)
      return ZoneCommitStatus.Changed
    }

    // Make sure to match the serial and compare the contents
    if (Zonefile.replaceSerial(existingContents, serial) === newContents) {
      return ZoneCommitStatus.Unchanged
    }

    await Bun.write(this.zone.outFile, newContents)
    return ZoneCommitStatus.Changed
  }

  /**
   * Set leases for this zonefile
   * @param input Leases to set
   */
  setLeases (input: Lease[]) {
    // Clear records array
    this.records.length = 0

    const leases = this.zone.staticOnly
      ? input.filter(l => l.type === LeaseType.Static)
      : input

    // Prepare RDNS zone
    if (this.zone.type === ZoneType.RDNS) {
      const leasesWithHostname = leases.filter((lease): lease is LeaseWithHostname => {
        return !!lease.hostname && lease.ipv4.startsWith((this.zone as ReverseZone).ptrSubnet)
      })
      const index = this.index(leasesWithHostname, 'hostname')
      this.addPtrRecords(index)
      return
    }

    if (this.zone.records.hostname) {
      const leasesWithHostname = leases.filter((lease): lease is LeaseWithHostname => !!lease.hostname)
      const index = this.index(leasesWithHostname, 'hostname')
      this.addHostnameRecords(index)
    }

    if (this.zone.records.mac) {
      const index = this.index(leases, 'mac')
      this.addMacRecords(index)
    }
  }

  /**
   * Renders this zonefile into string
   * @param serial Serial number
   * @returns Zonefile content
   */
  toString (serial: string): string {
    const longestNameLength = Math.max(...this.records.map(r => r.name.length))

    // @todo: this is suboptimal to render every time, but there is some bug
    // with Bun bundling and Eta rendering. Will investigate later.
    return eta.renderString(templateBody, {
      domain: this.zone.origin,
      records: this.records.map(r => ({
        ...r,
        name: r.name.padEnd(longestNameLength),
      })),
      serial,
      soa: this.zone.soa,
    })
  }
}
