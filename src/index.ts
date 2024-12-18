import pino from 'pino'

import { parseZoneConfigurations } from './parser'
import { OpnsenseProvider } from './providers/opnsense'
import { Zonefile } from './zonefile'
import { ZoneCommitStatus } from './zonefile/interface'

const log = pino({ level: process.env['LOG_LEVEL'] ?? 'info', name: 'main' })
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
  const leases = await provider.getLeases()

  const promises = zones.map(async zone => {
    const zonefile = new Zonefile(zone)
    const zoneLeases = leases.filter(l => l.zoneKey === zone.key)
    zonefile.setLeases(zoneLeases)

    const status = await zonefile.commit()
    if (status === ZoneCommitStatus.Changed) {
      log.debug('Updated zonefile for %s', zone.key)
    } else {
      log.debug('Zonefile for %s is up-to-date', zone.key)
    }
  })

  await Promise.all(promises)
}

if (!process.env['REFRESH_INTERVAL']) {
  log.info('REFRESH_INTERVAL not set, performing a one-shot run')
  await execute()
} else {
  const interval = Number(process.env['REFRESH_INTERVAL'])
  if (Number.isNaN(interval) || interval <= 0) {
    log.error('Incorrect REFRESH_INTERVAL value: %s', process.env['REFRESH_INTERVAL'])
    process.exit(1)
  }

  log.info('Running in daemon mode, refreshing each %d seconds', interval)
  let lock = false

  setInterval(() => {
    if (lock) {
      return
    }

    lock = true
    execute().finally(() => { lock = false })
  }, interval * 1000)
}
