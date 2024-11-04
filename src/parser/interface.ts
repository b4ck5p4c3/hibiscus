/**
 * Configuration of a DNS zone.
 */
export interface Zone {
  /**
   * DNS zone linked to this configuration.
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
   * Default zone TTL
   */
  ttl: number;
}

/**
 * Zone configuration indexed by the configuration key.
 */
export type ZoneConfiguration = Map<Zone['key'], Zone>
