import { createLogger } from '@/common/logger'
import { accessSync, constants } from 'node:fs'
import path from 'node:path'
import { z, type ZodRawShape } from 'zod'
import { fromError } from 'zod-validation-error'

import { type DefaultZone, type ReverseZone, type Zone, ZoneType } from './interface'

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
 * @param zoneOutputPath Output directory
 * @param key Zone identifier
 * @returns Zone configuration
 */
function parseZoneConfiguration (zoneOutputPath: string, key: string): Zone {
  const shape: ZodRawShape = {}

  // Abstract zone shape
  shape[`ZONE_${key}_IFACE`] = z.string()
  shape[`ZONE_${key}_DOMAIN`] = RecordName
  shape[`ZONE_${key}_SOA_PRIMARY`] = RecordName
  shape[`ZONE_${key}_SOA_RESPONSIBLE`] = RecordName
  shape[`ZONE_${key}_NS`] = CommaSeparatedRecordNames
  shape[`ZONE_${key}_TYPE`] = z.nativeEnum(ZoneType).default(ZoneType.Default)
  shape[`ZONE_${key}_STATIC_ONLY`] = z.string().optional().transform<boolean>(s => s === 'true')
  shape['RECORD_TTL'] = z.coerce.number().default(300)

  // Parse zone type to determine what other fields are required
  const zoneType = z
    .nativeEnum(ZoneType)
    .default(ZoneType.Default)
    .parse(process.env[`ZONE_${key}_TYPE`])

  switch (zoneType) {
    case ZoneType.Default: {
      shape[`ZONE_${key}_INCLUDE`] = z
        .string()
        .default('hostname,mac')
        .transform<DefaultZone['records']>(raw => {
          const values = new Set(raw.split(',').map(v => v.trim().toLowerCase()))
          return {
            hostname: values.has('hostname'),
            mac: values.has('mac')
          }
        })
      break
    }
    case ZoneType.RDNS: {
      shape[`ZONE_${key}_PREFIX`] = z.string().regex(/^(\d{1,3}\.){1,3}$/)
      break
    }
  }

  const { data: result, error } = z.object(shape).safeParse(process.env)
  if (error) {
    log.error('Failed to parse zone configuration for "%s": %s', key, fromError(error))
    process.exit(1)
  }

  if (zoneType === ZoneType.Default) {
    const fqdn = result[`ZONE_${key}_DOMAIN`].replace(/\.$/, '')
    return {
      domain: result[`ZONE_${key}_DOMAIN`],
      interface: result[`ZONE_${key}_IFACE`],
      key,
      origin: `${fqdn}.`,
      outFile: path.resolve(zoneOutputPath, `db.${fqdn}`),
      records: result[`ZONE_${key}_INCLUDE`],
      soa: {
        nameServers: result[`ZONE_${key}_NS`],
        person: result[`ZONE_${key}_SOA_RESPONSIBLE`],
        primaryNs: result[`ZONE_${key}_SOA_PRIMARY`]
      },
      staticOnly: result[`ZONE_${key}_STATIC_ONLY`],
      ttl: result['RECORD_TTL'],
      type: result[`ZONE_${key}_TYPE`],
    } satisfies DefaultZone
  }

  const fqdn = result[`ZONE_${key}_PREFIX`].replace(/\.$/, '').split('.').reverse().join('.').concat('.in-addr.arpa')
  return {
    domain: result[`ZONE_${key}_DOMAIN`],
    interface: result[`ZONE_${key}_IFACE`],
    key,
    origin: `${fqdn}.`,
    outFile: path.resolve(zoneOutputPath, `db.${fqdn}`),
    ptrSubnet: result[`ZONE_${key}_PREFIX`],
    soa: {
      nameServers: result[`ZONE_${key}_NS`],
      person: result[`ZONE_${key}_SOA_RESPONSIBLE`],
      primaryNs: result[`ZONE_${key}_SOA_PRIMARY`]
    },
    staticOnly: result[`ZONE_${key}_STATIC_ONLY`],
    ttl: result['RECORD_TTL'],
    type: result[`ZONE_${key}_TYPE`],
  } satisfies ReverseZone
}

/**
 * Parse all zone configurations from environment variables
 * @returns Zone configurations
 */
export function parseZoneConfigurations (): Zone[] {
  // Determine unique zones identifiers
  const keys = new Set<string>()
  for (const key of Object
    // Get all environment variables keys
    .keys(process.env)

    // Coarse filter for zone keys
    .filter(key => key.startsWith('ZONE_'))) {
    // Fine parse zone keys
    const result = key.match(/^ZONE_(?<ID>[A-Z0-9]+)_(?<KEY>[A-Z0-9_]+)$/)
    if (typeof result?.groups?.['ID'] === 'string') keys.add(result.groups['ID'])
  }

  // Parse output directory
  const zoneOutputPath = process.env['OUT_DIR']
  if (!zoneOutputPath) {
    log.error('Required OUT_DIR environment variable is not set')
    process.exit(1)
  }

  // Check whether output directory is writable
  try {
    accessSync(path.resolve(zoneOutputPath), constants.R_OK | constants.W_OK)
  } catch (error) {
    log.error('Output directory "%s" is not readable or writable: %O', zoneOutputPath, error)
    process.exit(1)
  }

  return [...keys]
    .map(parseZoneConfiguration.bind(null, zoneOutputPath))
}
