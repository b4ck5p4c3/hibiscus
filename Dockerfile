FROM node:22-slim
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
ENV OUT_DIR="/data"

# Enable corepack, install deps via pnpm
RUN corepack enable
COPY package.json pnpm-lock.yaml /app/
WORKDIR /app
RUN pnpm install --prod --frozen-lockfile

# Copy the rest of the app
COPY . /app
CMD ["npm", "start"]
