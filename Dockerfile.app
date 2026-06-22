# syntax=docker/dockerfile:1.7
#
# Production image for the web server (TanStack Start + Nitro).
# `vite build` emits a self-contained Nitro node-server bundle under `.output`,
# so the runtime stage carries no node_modules — only `.output`.
#
# Build (set the public, build-time vars — they are baked into the client bundle):
#   docker build -f Dockerfile.app \
#     --build-arg VITE_API_URL=https://app.example.com \
#     -t aluverse-app .
# For a non-host target arch add `--platform linux/amd64`.

# ---- Build stage ----
FROM oven/bun:1-slim AS builder
WORKDIR /app

# Public env baked into the client bundle at build time (Vite inlines VITE_*).
# Unset -> the corresponding feature is simply disabled at runtime.
ARG VITE_API_URL
ENV VITE_API_URL=$VITE_API_URL

# Install deps first so the (slow) install layer is cached across source edits.
COPY package.json bun.lock ./
RUN bun install --frozen-lockfile

# Build the Nitro output.
COPY . .
RUN bun run build

# ---- Runtime stage ----
FROM oven/bun:1-slim AS runner
WORKDIR /app
ENV NODE_ENV=production \
    PORT=3000

# Nitro's node-server output bundles its own dependencies — copy nothing else.
COPY --from=builder /app/.output ./.output

USER bun
EXPOSE 3000
CMD ["bun", "run", ".output/server/index.mjs"]
