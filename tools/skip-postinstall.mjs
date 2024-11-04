/**
 * This script is used to skip postinstall scripts when needed (e.g. in CI).
 * It can be used like this:
 *
 * ```package.json
 * scripts: {
 *   "postinstall": "node tools/skip-in-ci.mjs || husky",
 * }
 * ```
 */
process.exit((process.env.CI || process.env.SKIP_POSTINSTALL) ? 0 : 1)
