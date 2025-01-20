import type { ZoneRecord } from './interface'

export class ZoneRecordMap {
  private records: Map<string, ZoneRecord> = new Map()

  /**
   * Non-cryptographic hash function joining composite keys
   * @param keys - Keys to join
   * @returns Composite key
   */
  private static getCompositeKey (...keys: string[]): string {
    return Bun.hash(keys.join(':')).toString(36)
  }

  /**
   * Adds a record to the map
   * @param record - Record to add
   * @returns True if the record was added, false if it was not
   */
  public add (record: ZoneRecord): boolean {
    const key = ZoneRecordMap.getCompositeKey(record.name, record.type)

    const existing = this.records.get(key)
    if (existing && existing.priority > record.priority) return false

    this.records.set(key, record)
    return true
  }

  /**
   * Clears all records from the map
   */
  public clear (): void {
    this.records.clear()
  }

  /**
   * Retrives all records from the map
   * @returns Array of ZoneRecord objects
   */
  public toArray (): ZoneRecord[] {
    return [...this.records.values()]
  }
}
