#!/usr/bin/env bash
# Runs ON the VPS, fed through `ssh host bash -s` by the release workflow. The workflow puts two shell-quoted assignments
# in front of this file (VERSION=... and DEPLOY_PATH=...), so nothing from the tag or the secrets is ever part of a command line.
set -euo pipefail
: "${VERSION:?}" "${DEPLOY_PATH:?}"
[[ "$VERSION" =~ ^[0-9]+\.[0-9]+\.[0-9]+$ ]] || { echo "bad version: $VERSION"; exit 1; }
cd "$DEPLOY_PATH"
current=$(sed -n 's/^PICO_WEB_VERSION=//p' .env 2>/dev/null | head -n1 || true)
# remember the running version for the rollback, but only when this deploy really changes it (a re-run keeps the real previous one)
if [ -n "$current" ] && [ "$current" != "$VERSION" ]; then printf 'PICO_WEB_VERSION=%s\n' "$current" > .env.previous; fi
printf 'PICO_WEB_VERSION=%s\n' "$VERSION" > .env
docker compose pull
docker compose up -d
docker ps --filter name=pico-web
