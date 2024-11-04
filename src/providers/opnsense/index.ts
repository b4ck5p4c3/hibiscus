import type { Zone, ZoneConfiguration } from '@/parser/interface'

import { parseZoneConfigurations } from '@/parser'

import { type Lease, Provider } from '../interface'
import { OpnsenseApiClient } from './client'

export class OpnsenseProvider extends Provider {
  private api = new OpnsenseApiClient()
  private zones: ZoneConfiguration = new Map()

  async getLeases (zoneKey: string): Promise<Lease[]> {
    const zone = this.zones.get(zoneKey)
    if (!zone) {
      throw new Error(`Zone ${zoneKey} not found`)
    }

    return this.api.getLeases(zone.interface)
  }

  async init () {
    // Parse zones from the configuration
    const zones = parseZoneConfigurations()
      .map<[string, Zone]>(zone => [zone.key, zone])

    this.zones = new Map<string, Zone>(zones)

    // Check API credentials
    await this.api.checkCredentials()
  }

  async release () {
    /* Nothing to clean-up */
  }
}
