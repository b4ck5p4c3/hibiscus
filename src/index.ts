import { config } from './utils/config'
import { logger } from './utils/logger'

const log = logger('name')

log.info('Hi there!')
log.info(config, 'Configuration')
