import { writeFile } from 'fs/promises'
import pino from 'pino'

import { parseZoneConfigurations } from './parser'
import { OpnsenseProvider } from './providers/opnsense'
import { Zonefile } from './zonefile'

const log = pino({ name: 'main' })
log.info('@bksp/hibiscus version: %s', process.env['npm_package_version'] ?? 'unknown')

// Parse zones from the environment configuration
const zones = parseZoneConfigurations()
log.info('Loaded zones: %O', zones.map(z => z.key))

// Spin up the provider
const provider = new OpnsenseProvider()
await provider.init()

/**
 * Main execution function
 */
async function execute (): Promise<void> {
  const promises = zones.map(async zone => {
    const leases = await provider.getLeases(zone.key)
    const zonefile = new Zonefile(zone)
    zonefile.setLeases(leases)

    await writeFile(zone.outFile, zonefile.toString(), 'utf8')
    log.debug('Updated zonefile for %s', zone.key)
  })

  await Promise.all(promises)
}

if (!process.env['REFRESH_INTERVAL']) {
  log.info('REFRESH_INTERVAL not set, performing a single run')
  await execute()
} else {
  const interval = Number(process.env['REFRESH_INTERVAL'])
  if (Number.isNaN(interval)) {
    log.error('Incorrect REFRESH_INTERVAL value: %s', process.env['REFRESH_INTERVAL'])
    process.exit(1)
  }

  log.info('Running in daemon mode, refreshing each %d seconds', interval)
  setInterval(() => {
    return execute()
  }, interval * 1000)
}
