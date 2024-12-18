export interface ZoneRecord {
  /**
   * Record name
   */
  name: string

  /**
   * Record type
   */
  type: 'A'

  /**
   * Record value
   */
  value: string
}

/**
 * Zonefile write/commit status (either changed on disk or not)
 */
export enum ZoneCommitStatus {
  Changed = 'changed',
  Unchanged = 'unchanged',
}
