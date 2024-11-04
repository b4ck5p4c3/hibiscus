import ky, { KyInstance } from 'ky'
import { z } from 'zod'

import { Lease } from '../interface'
import { Dhcpv4SearchLeaseResponse, OpnsenseLeaseType } from './interface'

const configSchema = z.object({
  OPNSENSE_API_KEY: z.string(),
  OPNSENSE_API_SECRET: z.string(),
  OPNSENSE_URL: z
    .string()
    .url()
    .transform(url => url.replace(/\/$/, '')) // Remove trailing slash
})

export class OpnsenseApiClient {
  private client: KyInstance
  private config: z.infer<typeof configSchema>

  constructor () {
    this.config = configSchema.parse(process.env)
    const credentials = Buffer
      .from(`${this.config.OPNSENSE_API_KEY}:${this.config.OPNSENSE_API_SECRET}`, 'utf8')
      .toString('base64')

    this.client = ky.create({
      headers: {
        Accept: 'application/json',
        Authorization: `Basic ${credentials}`,
      },
      prefixUrl: this.config.OPNSENSE_URL
    })
  }

  async checkCredentials (): Promise<void> {
    const res = await this.client.get('dhcpv4/leases/searchLease')

    // Why checking for Content-Type? Well, the API returns a 200 status code even if the credentials are invalid.
    // Most obvious way to check if the credentials are valid is to check if the response is JSON.
    if (!res.ok || !res.headers.get('content-type')?.includes('application/json')) {
      throw new Error('Failed to verify Opnsense credentials')
    }
  }

  async getLeases (zone: string): Promise<Lease[]> {
    const res = await this.client
      .get('dhcpv4/leases/searchLease')
      .json<Dhcpv4SearchLeaseResponse>()

    // Filter out: static leases for a given interface, which do have a hostname set
    const leases = res.rows
      .filter(lease =>
        lease.if_descr === zone &&
        lease.type === OpnsenseLeaseType.Static &&
        lease.hostname.length > 0
      )
      .map<Lease>(lease => ({ hostname: lease.hostname, ipv4: lease.address }))

    return leases
  }
}
