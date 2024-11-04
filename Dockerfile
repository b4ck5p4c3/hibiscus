FROM node:22-slim

ENV PNPM_HOME="/pnpm" \
    PATH="/pnpm:$PATH" \
    OUT_DIR="/data" \
    SKIP_POSTINSTALL=1

# Enable corepack, install deps via pnpm
WORKDIR /app
COPY tools ./tools 
COPY package.json pnpm-lock.yaml ./
RUN corepack enable && pnpm install --prod --frozen-lockfile

# Copy the rest of the app
COPY . /app
CMD ["npm", "start"]
