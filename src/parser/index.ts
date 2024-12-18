import { createLogger } from '@/common/logger'
import { resolve } from 'path'
import { z } from 'zod'
import { fromError } from 'zod-validation-error'

import { type Zone, ZoneType } from './interface'

const log = createLogger('zone-parser')

/**
 * Declare a RecordName type with simple sanity check
 * for a record name.
 */
export const RecordName = z.string().refine(value => {
  // Should not be empty
  // Should contain at least one dot
  // Should not contain any whitespaces
  return value.length > 0 && value.includes('.') && !value.includes(' ')
})

/**
 * Declare a comma-separated list of RecordName strings.
 */
export const CommaSeparatedRecordNames = z
  .string()
  .transform(value => value.split(',').filter(v => v.length > 0))
  .pipe(RecordName.array())

/**
 * Parse zone configuration from environment variables
 * @param key Zone identifier
 * @returns Zone configuration
 * @throws Error if parsing fails
 */
function parseZoneConfiguration (key: string): Zone {
  const shape: Record<string, any> = {}
  shape['OUT_DIR'] = z.string()
  shape[`ZONE_${key}_IFACE`] = z.string()
  shape[`ZONE_${key}_DOMAIN`] = RecordName
  shape[`ZONE_${key}_SOA_PRIMARY`] = RecordName
  shape[`ZONE_${key}_SOA_RESPONSIBLE`] = RecordName
  shape[`ZONE_${key}_NS`] = CommaSeparatedRecordNames
  shape[`ZONE_${key}_TYPE`] = z.nativeEnum(ZoneType)

  const { data: result, error } = z.object(shape).safeParse(process.env)
  if (error) {
    log.error('Failed to parse zone configuration for "%s": %s', key, fromError(error))
    process.exit(1)
  }

  const outFile = resolve(
    result['OUT_DIR'],
    `db.${result[`ZONE_${key}_DOMAIN`].replace(/\.$/, '')}` // Remove trailing dot
  )

  return {
    domain: result[`ZONE_${key}_DOMAIN`],
    interface: result[`ZONE_${key}_IFACE`],
    key,
    outFile,
    soa: {
      nameServers: result[`ZONE_${key}_NS`],
      person: result[`ZONE_${key}_SOA_RESPONSIBLE`],
      primaryNs: result[`ZONE_${key}_SOA_PRIMARY`]
    },
    ttl: process.env['ZONE_TTL'] ? parseInt(process.env['ZONE_TTL']) : 300,
    type: result[`ZONE_${key}_TYPE`],
  }
}

/**
 * Parse all zone configurations from environment variables
 * @returns Zone configurations
 */
export function parseZoneConfigurations (): Zone[] {
  // Determine unique zones identifiers
  const keys = new Set<string>()
  Object
    // Get all environment variables keys
    .keys(process.env)

    // Coarse filter for zone keys
    .filter(key => key.startsWith('ZONE_'))
    .forEach(key => {
      // Fine parse zone keys
      const result = key.match(/^ZONE_(?<ID>[A-Z0-9]+)_(?<KEY>[A-Z0-9_]+)$/)
      if (typeof result?.groups?.['ID'] === 'string') keys.add(result.groups['ID'])
    })

  return Array.from(keys).map(parseZoneConfiguration)
}
