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
      .catch((e: unknown) => this.log.error('failed to report: %O', e))
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
      .catch((e: unknown) => this.log.error('failed to report start: %O', e))
  }

  /**
   * Wraps a Promise with healthcheck reporting
   * @param fn - promise to wrap
   * @returns the result of the function
   */
  public async with<T> (fn: Promise<T>): Promise<T> {
    if (!this.endpoint) {
      return fn
    }

    await this.start()
    try {
      const result = await fn
      await this.end()
      return result
    } catch (e: unknown) {
      await this.end(false, e instanceof Error ? e.stack : String(e))
      throw e
    }
  }
}
