# syntax=docker/dockerfile:1
# PICO web: prerendered static site (ADR-0096) served by unprivileged nginx (ADR-0104).
#
# The build needs the LIVE API (kabupaten snapshot, home snapshot, downloads, prerender), so the build stage needs network.
#   docker build -t pico-web --build-arg VITE_API_BASE_URL=https://pico-api.banuacoder.com/api/v1 .
#
# RELEASE BUILDS MUST FAIL WHILE REVIEW MARKERS REMAIN. `pnpm check:dist` below fails on any data-todo marker.
# PICO_ALLOW_TODO is therefore NOT set here by default. Only a throwaway local/dry-run build may pass
#   --build-arg PICO_ALLOW_TODO=1
# and the release workflow never does (see docs/deploy.md).

FROM node:22-slim AS build
ARG VITE_API_BASE_URL=https://pico-api.banuacoder.com/api/v1
ARG VITE_SITE_URL=https://pico.banuacoder.com
ARG VITE_LIVE_MODE=
ARG PICO_ALLOW_TODO=
# The version baked into the image, served as /version.txt so the deploy health gate can tell which image answers.
ARG APP_VERSION=dev
ENV VITE_API_BASE_URL=$VITE_API_BASE_URL \
    VITE_SITE_URL=$VITE_SITE_URL \
    VITE_LIVE_MODE=$VITE_LIVE_MODE \
    CI=true
WORKDIR /app
RUN corepack enable
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
RUN --mount=type=cache,id=pnpm,target=/root/.local/share/pnpm/store pnpm install --frozen-lockfile
COPY . .
RUN pnpm build
# gates: 114 pages, titles, sitemap, links, review markers (fails the image build), size budget
RUN PICO_ALLOW_TODO=$PICO_ALLOW_TODO pnpm check:dist && pnpm check:budget
RUN printf '%s\n' "$APP_VERSION" > dist/version.txt

FROM nginxinc/nginx-unprivileged:1.29-alpine-slim
COPY deploy/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html
EXPOSE 8080
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 CMD wget -qO- http://127.0.0.1:8080/healthz || exit 1
