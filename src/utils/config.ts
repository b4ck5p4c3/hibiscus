import { config as dotenv } from 'dotenv'
import { pino } from 'pino'
import { z } from 'zod'
dotenv()

const configSchema = z.object({
  DATABASE_URL: z.string().refine(
    value => {
      return URL.canParse(value)
    },
    { message: 'Must be a valid URL' }
  ),
  OIDC_WELL_KNOWN_URL: z.string().url().optional(),
  PORT: z.number({ coerce: true }).min(1).max(65535).default(3000),
})

const parsed = configSchema.safeParse(process.env)
if (!parsed.success) {
  const logger = pino({ name: 'config' })
  for (const error of parsed.error.errors) {
    logger.error(
      'Config Error: variable %s %s (%s)',
      error.path.join('.'),
      error.message,
      error.code
    )
  }
  process.exit(1)
}

export const config = parsed.data
