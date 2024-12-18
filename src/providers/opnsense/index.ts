import type { Zone, ZoneConfiguration } from '@/parser/interface'

import { parseZoneConfigurations } from '@/parser'

import { type Lease, LeaseType, Provider } from '../interface'
import { OpnsenseApiClient } from './client'
import { OpnsenseLeaseType } from './interface'

export class OpnsenseProvider extends Provider {
  private api = new OpnsenseApiClient()
  private zones: ZoneConfiguration = new Map()

  async getLeases (): Promise<Lease[]> {
    const leases = await this.api.getLeases()
    return leases.rows
      .filter(lease => this.zones.has(lease.if_descr))
      .map<Lease>(lease => ({
        hostname: lease.hostname ?? null,
        ipv4: lease.address,
        mac: lease.mac,
        type: lease.type === OpnsenseLeaseType.Static ? LeaseType.Static : LeaseType.Dynamic,
        zoneKey: this.zones.get(lease.if_descr)!.key
      }))
  }

  async init () {
    // Parse zones from the configuration
    const zones = parseZoneConfigurations()
      .map<[string, Zone]>(zone => [zone.interface, zone])

    this.zones = new Map<string, Zone>(zones)

    // Check API credentials
    await this.api.checkCredentials()
  }

  async release () {
    /* Nothing to clean-up */
  }
}
