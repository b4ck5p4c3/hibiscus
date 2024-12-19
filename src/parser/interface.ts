/**
 * Type of this zone
 */
export enum ZoneType {
  /**
   * Generates various records for leases
   */
  Default = 'default',

  /**
   * Generates only PTR records for a given subnet
   */
  RDNS = 'rdns',
}

/**
 * Configuration of a DNS zone.
 */
export interface AbstractZone {
  /**
   * Zone linked to this configuration.
   */
  domain: string;

  /**
   * Identifier of the zone in the firewall settings.
   */
  interface: string;

  /**
   * Unique identifier of this zone in the configuration.
   */
  key: string;

  /**
   * Zone file origin
   */
  origin: string;

  /**
   * Path to the output file for this zone.
   */
  outFile: string;

  /**
   * Configuration of the SOA record.
   */
  soa: {
    /**
     * List of name servers for this zone.
     */
    nameServers: string[];

    /**
     * Email address of the person responsible for this zone.
     */
    person: string;

    /**
     * Primary Name Server (MPRIMARY) for this zone.
     */
    primaryNs: string;
  }

  /**
   * Whether to include only static leases in this zone.
   */
  staticOnly: boolean;

  /**
   * Default zone TTL
   */
  ttl: number;

  /**
   * Type of this zone.
   */
  type: ZoneType;
}

/**
 * Configuration of a DNS zone.
 */
export interface DefaultZone extends AbstractZone {
  /**
   * What to include as records names in the zone file.
   */
  records: {
    /**
     * Create records for hostnames.
     * Example: `myserver IN A 10.20.30.40`
     */
    hostname: boolean;

    /**
     * Create records for MAC addresses.
     * Example: `de-ad-be-ef-ed IN A 10.20.30.40`
     */
    mac: boolean;
  }

  type: ZoneType.Default;
}

/**
 * Configuration of a reverse DNS zone.
 */
export interface ReverseZone extends AbstractZone {
  /**
   * Subnet to generate PTR records for.
   * Note that it should NOT be reversed.
   * @example `10.20.30`
   */
  ptrSubnet: string;

  type: ZoneType.RDNS;
}

/**
 * Higher-order interface for a zone configuration.
 */
export type Zone = DefaultZone | ReverseZone

/**
 * Zone configuration indexed by the configuration key.
 */
export type ZoneConfiguration = Map<Zone['key'], Zone>
