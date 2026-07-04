# Build
FROM oven/bun@sha256:092f84d69e989d2dc86ccb89445dac701ed9d9d381676e8ee4b5a2a7c5c9d38e AS builder
WORKDIR /usr/src/app
ENV NODE_ENV=production

## Install deps
COPY package.json bun.lockb ./
RUN bun install --frozen-lockfile

## Test & compile
COPY . .
RUN bun test && bun typecheck && bun run build

# Release
FROM gcr.io/distroless/base-debian13:latest AS release
COPY --from=builder /usr/src/app/dist/hibiscus /
ENTRYPOINT [ "/hibiscus" ]
