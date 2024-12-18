export enum LeaseType {
  Dynamic = 'dynamic',
  Static = 'static'
}

/**
 * Represents a lease of an IP address.
 */
export interface Lease {
  /**
   * The hostname set for the lease.
   */
  hostname: null | string

  /**
   * Firewall zone associated with the lease.
   */
  interface: string

  /**
   * The IP address that was leased.
   */
  ipv4: string

  /**
   * The MAC address of the device that was leased the IP address.
   */
  mac: string

  /**
   * The type of the lease (either Dynamic or Static).
   */
  type: LeaseType
}

/**
 * Represents a lease with known hostname.
 */
export interface LeaseWithHostname extends Lease {
  hostname: string
}

/**
 * Represents a provider of IP address leases.
 */
export abstract class Provider {
  /**
   * Fetch the leases for a given zone.
   */
  abstract getLeases (): Promise<Lease[]>

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
