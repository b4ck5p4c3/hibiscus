import type { Zone } from '@/parser/interface'
import type { Lease } from '@/providers/interface'

import { Eta } from 'eta'
import { join } from 'path'

import type { ZoneRecord } from './interface'

const eta = new Eta({ views: join(import.meta.dirname, 'templates') })

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
   * Set leases for this zonefile
   * @param leases Leases to set
   */
  setLeases (leases: Lease[]) {
    for (const lease of leases) {
      if (lease.ipv4) {
        this.records.push({
          name: lease.hostname,
          type: 'A',
          value: lease.ipv4,
        })
      }
    }
  }

  /**
   * Renders this zonefile into string
   * @returns Zonefile content
   */
  toString (): string {
    return eta.render('zone', {
      domain: this.zone.domain,
      records: this.records,
      serial: Math.floor(Date.now() / 1000).toString(),
      soa: this.zone.soa,
    })
  }
}
