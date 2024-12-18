import { createLogger } from './common/logger'
import { parseZoneConfigurations } from './parser'
import { OpnsenseProvider } from './providers/opnsense'
import { Zonefile } from './zonefile'
import { ZoneCommitStatus } from './zonefile/interface'

const log = createLogger('main')

// Spin up the provider
const provider = new OpnsenseProvider()
await provider.init()

// Parse zones from the environment configuration
const zones = parseZoneConfigurations()
log.info('@bksp/hibiscus version: %s', process.env['npm_package_version'] ?? 'unknown')
log.info('Loaded zones: %O', zones.map(z => z.key))

/**
 * Main execution function
 */
async function execute (): Promise<void> {
  // Fetch all leases from the provider
  const leases = await provider.getLeases()

  // Set up promises for each configured zone
  const promises = zones.map(async zone => {
    const zonefile = new Zonefile(zone)
    const zoneLeases = leases.filter(l => l.zoneKey === zone.key)
    zonefile.setLeases(zoneLeases)

    const status = await zonefile.commit()
    if (status === ZoneCommitStatus.Changed) {
      log.debug('Updated zonefile for "%s"', zone.key)
    } else {
      log.debug('Zonefile for "%s" is up-to-date', zone.key)
    }
  })

  // Update all zonefiles in parallel
  await Promise.all(promises)
}

// Exit immediately if no zones are configured
if (zones.length === 0) {
  log.error('No zones configured, exiting')
  process.exit(1)
}

// Spin up scheduler if REFRESH_INTERVAL is set
if (process.env['REFRESH_INTERVAL']) {
  const interval = Number(process.env['REFRESH_INTERVAL'])
  if (Number.isNaN(interval) || interval <= 0) {
    log.error('Incorrect REFRESH_INTERVAL value: %s', process.env['REFRESH_INTERVAL'])
    process.exit(1)
  }

  log.info('Running in daemon mode, refreshing each %d seconds', interval)

  let lock = false
  setInterval(() => {
    if (lock) { return }
    lock = true

    execute().finally(() => { lock = false })
  }, interval * 1000)
} else {
  // Run once and exit
  log.info('No REFRESH_INTERVAL set, performing a one-shot run')
  await execute()
}
