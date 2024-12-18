import { type Zone, ZoneType } from '@/parser/interface'
import { type Lease, LeaseType } from '@/providers/interface'
import { Eta } from 'eta'

import { ZoneCommitStatus, type ZoneRecord } from './interface'
import templateBody from './template.eta'

const eta = new Eta()

export class Zonefile {
  /**
   * Zone records
   */
  private records: ZoneRecord[] = []

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
   * @param leases Leases to set
   */
  setLeases (leases: Lease[]) {
    // Clear records array
    this.records.length = 0

    for (const lease of leases) {
      // Static Zone: only static leases with hostname
      if (this.zone.type === ZoneType.Static) {
        if (lease.type === LeaseType.Static && lease.hostname) {
          this.records.push({
            name: lease.hostname,
            type: 'A',
            value: lease.ipv4,
          })
        }

        // Skip if the lease is dynamic or doesn't have a hostname
        continue
      }

      // Dynamic Zone: all leases with hostname
      if (lease.hostname) {
        this.records.push({
          name: lease.hostname,
          type: 'A',
          value: lease.ipv4,
        })
      }

      // Dynamic Zone with MAC: include also MAC addresses as records
      if (this.zone.type === ZoneType.DynamicWithMac) {
        this.records.push({
          name: lease.mac.replace(/:/g, '').toLowerCase(),
          type: 'A',
          value: lease.ipv4,
        })
      }
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
      domain: this.zone.domain,
      records: this.records.map(r => ({
        ...r,
        name: r.name.padEnd(longestNameLength),
      })),
      serial,
      soa: this.zone.soa,
    })
  }
}
