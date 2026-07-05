import ky, { type KyInstance } from 'ky'
import { z } from 'zod'
import { fromError } from 'zod-validation-error'

import { createLogger } from '@/common/logger'

import { type Dhcpv4SearchLeaseResponse, Dhcpv4SearchLeaseResponseSchema } from './interface'

const log = createLogger('opnsense')

const configSchema = z.object({
  OPNSENSE_API_KEY: z.string(),
  OPNSENSE_API_SECRET: z.string(),
  OPNSENSE_URL: z
    .url()
    .transform(url => url.replace(/\/$/, '')) // Remove trailing slash
})

export class OpnsenseApiClient {
  private client: KyInstance
  private config: z.infer<typeof configSchema>

  constructor () {
    const { data: config, error } = configSchema.safeParse(process.env)
    if (error) {
      log.error('Failed to parse configuration: %s', fromError(error))
      process.exit(1)
    }

    this.config = config
    const credentials = new TextEncoder()
      .encode(`${this.config.OPNSENSE_API_KEY}:${this.config.OPNSENSE_API_SECRET}`)
      .toBase64()

    this.client = ky.create({
      baseUrl: this.config.OPNSENSE_URL,
      headers: {
        Accept: 'application/json',
        Authorization: `Basic ${credentials}`,
      },
    })
  }

  async checkCredentials (): Promise<void> {
    const response = await this.client.get('dhcpv4/leases/searchLease')

    // Why checking for Content-Type? Well, the API returns a 200 status code even if the credentials are invalid.
    // Most obvious way to check if the credentials are valid is to check if the response is JSON.
    if (!response.ok || !response.headers.get('content-type')?.includes('application/json')) {
      throw new Error('Failed to verify Opnsense credentials')
    }
  }

  async getLeases (): Promise<Dhcpv4SearchLeaseResponse> {
    const response = await this.client.get('dhcpv4/leases/searchLease').json()
    return Dhcpv4SearchLeaseResponseSchema.parse(response)
  }
}
