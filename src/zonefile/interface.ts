export const DefaultPriority = 0

export interface ZoneRecord {
  /**
   * Record name
   */
  name: string

  /**
   * Record priority to determine which record to keep in case of conflicts
   */
  priority: number

  /**
   * Record type
   */
  type: 'A' | 'PTR'

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
