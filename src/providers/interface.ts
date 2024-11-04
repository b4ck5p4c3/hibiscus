/**
 * Represents a lease of an IP address.
 */
export interface Lease {
  /**
   * The hostname set for the lease.
   */
  hostname: string

  /**
   * The IP address that was leased.
   */
  ipv4: string
}

/**
 * Represents a provider of IP address leases.
 */
export abstract class Provider {
  /**
   * Fetch the leases for a given zone.
   * @param zoneKey Unique identifier for the zone supplied in the configuration.
   */
  abstract getLeases (zoneKey: string): Promise<Lease[]>

  /**
   * Initialize the provider.
   * Use this method to perform any setup actions required by the provider,
   * such as validating configuration options, checking API connectivity, etc.
   */
  abstract init (): Promise<void>

  /**
   * Release any resources held by the provider.
   * Use this method to perform any cleanup actions required.
   */
  abstract release (): Promise<void>
}
