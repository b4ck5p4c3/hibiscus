import { type Lease, LeaseType, Provider } from '../interface'
import { OpnsenseApiClient } from './client'
import { OpnsenseLeaseType } from './interface'

export class OpnsenseProvider extends Provider {
  private api = new OpnsenseApiClient()

  async getLeases (): Promise<Lease[]> {
    const leases = await this.api.getLeases()
    return leases.rows
      .map<Lease>(lease => ({
        hostname: lease.hostname ?? null,
        interface: lease.if_descr,
        ipv4: lease.address,
        mac: lease.mac,
        type: lease.type === OpnsenseLeaseType.Static ? LeaseType.Static : LeaseType.Dynamic,
      }))
  }

  async init () {
    // Check API credentials
    await this.api.checkCredentials()
  }

  async release () {
    /* Nothing to clean-up */
  }
}
