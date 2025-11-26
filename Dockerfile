FROM node:18

WORKDIR /app

# Enable PNPM via Corepack
RUN corepack enable

# Copy hanya file dependency dulu (cache-able layer)
COPY package.json pnpm-lock.yaml ./

# Install deps (layer cached)
RUN pnpm install --frozen-lockfile

# Copy seluruh project
COPY . .

EXPOSE 8080
CMD ["pnpm", "start"]
