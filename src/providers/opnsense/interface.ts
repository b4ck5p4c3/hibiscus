/**
 * Opnsense API response for the searchLease endpoint.
 */
export interface Dhcpv4SearchLeaseResponse {
  readonly current: number;
  readonly interfaces: Dhcpv4SearchLeaseInterfaces;
  readonly rowCount: number;
  readonly rows: OpnsenseLease[];
  readonly total: number;
}

/**
 * Physical interface name.
 */
export type PhysicalInterface = string

/**
 * Firewall interface name.
 */
export type FirewallInterface = string

/**
 * Mapping of "physical" interface name to "firewall" interface name.
 */
export type Dhcpv4SearchLeaseInterfaces = Record<PhysicalInterface, FirewallInterface>

/**
 * Connection status of a client for a DHCP lease.
 */
export enum OpnsenseLeaseStatus {
  Offline = 'offline',
  Online = 'online',
}

/**
 * Type of a DHCP lease.
 */
export enum OpnsenseLeaseType {
  Dynamic = 'dynamic',
  Static = 'static',
}

/**
 * DHCP lease information.
 */
export interface OpnsenseLease {
  readonly address: string;
  readonly binding?: string;
  readonly 'client-hostname'?: string;
  readonly cltt?: number;
  readonly descr: string;
  readonly ends: string;
  readonly hostname?: string;
  readonly if: PhysicalInterface;
  readonly if_descr: FirewallInterface;
  readonly mac: string;
  readonly man: string;
  readonly starts: string;
  readonly status: OpnsenseLeaseStatus;
  readonly tstp?: number;
  readonly type: OpnsenseLeaseType;
  readonly uid?: string;
}
