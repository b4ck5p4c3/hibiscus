import { createLogger } from '@/common/logger'

export class Healthchecks {
  private readonly log = createLogger('healthchecks')
  public readonly endpoint?: string

  constructor () {
    const endpoint = process.env['HEALTHCHECKS_URL']
    if (!endpoint) {
      this.log.debug('no HEALTHCHECKS_URL set, reporting is disabled')
      return
    }

    // Validate the URL and protocol
    const url = new URL(endpoint)
    if (!['http:', 'https:'].includes(url.protocol)) {
      this.log.error('invalid protocol in HEALTHCHECKS_URL: %s', url.protocol)
      process.exit(1)
    }

    // Remove trailing slash
    this.endpoint = endpoint.replace(/\/$/, '')
  }

  /**
   * Reports a task completion
   * @param success - whether the task was successful or not
   * @param body - optional body to send with the report
   */
  public async end (success = true, body?: string | string[]): Promise<void> {
    if (!this.endpoint) {
      return
    }

    return fetch(`${this.endpoint}/${success ? '' : 'fail'}`, {
      body: body ? (Array.isArray(body) ? body.join('\n') : body) : '',
      headers: {
        'Content-Type': 'text/plain'
      },
      method: 'POST'
    })
      .then(() => this.log.debug('report sent'))
      .catch((error: unknown) => this.log.error('failed to report: %O', error))
  }

  /**
   * Reports the start of a task
   */
  public async start (): Promise<void> {
    if (!this.endpoint) {
      return
    }

    return fetch(`${this.endpoint}/start`, { method: 'POST' })
      .then(() => this.log.debug('start report sent'))
      .catch((error: unknown) => this.log.error('failed to report start: %O', error))
  }

  /**
   * Creates higher-order function to wrap a task with start and end reports
   * @param task - function to wrap
   * @returns wrapped function
   */
  with<T, D> (task: (...taskArguments: D[]) => Promise<T>): (...taskArguments: D[]) => Promise<T> {
    if (!this.endpoint) {
      return () => task()
    }

    return async (...taskArguments) => {
      await this.start()
      try {
        const result = await task(...taskArguments)
        await this.end()
        return result
      } catch (error: unknown) {
        await this.end(false, error instanceof Error ? error.stack : String(error))
        throw error
      }
    }
  }
}
