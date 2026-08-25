# syntax=docker/dockerfile:1
#
# Mainly for local docker-compose parity — a Vite SPA will most likely
# deploy via a platform's static hosting rather than this container in
# practice (Platform Blueprint, Section 20), but this keeps `docker compose
# up` identical for every contributor regardless of what's installed
# locally.

FROM node:20-slim AS build
WORKDIR /repo
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml turbo.json ./
COPY apps/web/package.json apps/web/package.json
COPY packages/types/package.json packages/types/package.json
COPY packages/design-tokens/package.json packages/design-tokens/package.json
COPY packages/ui/package.json packages/ui/package.json
COPY packages/config/package.json packages/config/package.json
RUN corepack enable && COREPACK_INTEGRITY_KEYS=0 corepack prepare pnpm@9.15.9 --activate
RUN pnpm install --frozen-lockfile
COPY . .
RUN pnpm --filter @agriflow/web run build

FROM nginx:1.31-alpine AS runtime
COPY --from=build /repo/apps/web/dist /usr/share/nginx/html
EXPOSE 80
