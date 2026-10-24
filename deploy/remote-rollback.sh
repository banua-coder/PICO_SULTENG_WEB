#!/usr/bin/env bash
# Runs ON the VPS (see remote-deploy.sh). Puts the previous version back.
set -euo pipefail
: "${DEPLOY_PATH:?}"
cd "$DEPLOY_PATH"
[ -s .env.previous ] || { echo "no previous version recorded; redeploy a known tag by hand"; exit 1; }
cp .env.previous .env
docker compose up -d
