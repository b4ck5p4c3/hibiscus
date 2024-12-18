# Build
FROM oven/bun:1 AS builder
WORKDIR /usr/src/app
ENV NODE_ENV=production

## Install deps
COPY package.json bun.lockb ./
RUN bun install --frozen-lockfile

## Test & compile
COPY . .
RUN bun test && bun typecheck && bun run build

# Release
FROM gcr.io/distroless/base-debian12 AS release
COPY --from=builder /usr/src/app/dist/hibiscus /
ENTRYPOINT [ "/hibiscus" ]
