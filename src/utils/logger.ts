import { pino } from 'pino'

export function logger (name: string) {
  return pino({ name })
}
