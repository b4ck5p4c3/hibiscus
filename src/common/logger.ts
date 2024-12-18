import pino from 'pino'

export function createLogger (name: string): pino.Logger {
  return pino({ level: process.env['LOG_LEVEL'] ?? 'info', name })
}
