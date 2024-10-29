# node-template

Template for Node.js projects.

## Setup

1. Read this README once, and then delete everything.
2. Write your own README describing your project and its specific details.
3. In `package.json`, update the name, description, version, repository, and license details.
4. Install dependencies with `pnpm install`.
5. You're good to go! 🚀
6. Check the `src/` directory to find useful basic utilities you might want to use.

## Summary

1. We use TypeScript because it's cool. And [we don't transpile it](#why-not-transpile-typescript) unless necessary.
2. We use ESLint with [neostandard](https://github.com/neostandard/neostandard) code style without exceptions.
3. We don't use Prettier, as ESLint already does the job.
4. We follow the [12 Factor App](https://12factor.net/) methodology.
5. We use [pnpm](https://pnpm.io/) as package manager.

## License

Every piece of software made at B4CKSP4CE should be licensed appropriately.
Every repository should contain a `LICENSE` file with the full text of the license.

As a rule of thumb, we use the:

1. Software: [Mozilla Public License 2.0](https://www.mozilla.org/en-US/MPL/2.0/)
2. Hardware: [CERN Open Hardware Licence Version 2 - Strongly Reciprocal](https://ohwr.org/project/cernohl/-/wikis/Documents/CERN-OHL-version-2)
3. Documentation: [Creative Commons Attribution-ShareAlike 4.0 International](https://creativecommons.org/licenses/by-sa/4.0/)

All three licenses are copyleft licenses, meaning any derivative work must be licensed under the same license.

## FAQ

### Why not transpile TypeScript?

#### We don't have to

Starting from Node.js 23, it [supports running TypeScript](https://nodejs.org/api/typescript.html) directly via type stripping.

While native implementation is in early development with significant caveats, we use [tsx](https://github.com/privatenumber/tsx) instead.

#### It adds complexity

Transpiling TypeScript adds complexity and more opinionated decisions to the project.
We don't bother ourselves with additional configurations. We don't want to introduce more opinionated choices, like what bundler to use.

#### Overhead is negligible

From the computing perspective, type stripping is astoundingly cheap. It's not even worth mentioning.
It adds some overhead to the startup time, but it's not significant enough **for us** to be concerned.
