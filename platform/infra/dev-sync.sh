#!/bin/sh
# Install Linux dependencies into the container volumes when pnpm-lock.yaml
# changes. The platform tree is bind-mounted from the host; node_modules is not,
# because the host install is macOS. An image rebuild is only needed when the
# Dockerfile or the base image changes.
set -eu
cd /app

if [ "${1:-}" = "--install" ]; then
  hash=$(sha256sum pnpm-lock.yaml | awk '{print $1}')
  stamp=/pnpm/lock-hash
  current=$(cat "$stamp" 2>/dev/null || true)
  if [ "$current" = "$hash" ]; then
    echo "dev-sync: dependencies match the lockfile"
    exit 0
  fi
  echo "dev-sync: installing dependencies"
  attempt=1
  while [ "$attempt" -le 3 ]; do
    # Large linux binaries (Next SWC, Prisma) can take well over a minute.
    if pnpm install --frozen-lockfile --store-dir /pnpm/store --fetch-timeout 3600000 --config.minimum-release-age=0 --config.minimum-release-age-strict=false; then
      echo "$hash" > "$stamp"
      exit 0
    fi
    echo "dev-sync: install failed (attempt $attempt)" >&2
    attempt=$((attempt + 1))
    sleep 10
  done
  echo "dev-sync: giving up on pnpm install" >&2
  exit 1
fi

export COREPACK_ENABLE_DOWNLOAD_PROMPT=0
corepack enable >/dev/null 2>&1 || true

# The first call may download the native pnpm binary. Leave its progress on stderr.
attempt=1
while ! pnpm --version; do
  if [ "$attempt" -ge 5 ]; then
    echo "dev-sync: pnpm is not available" >&2
    exit 1
  fi
  echo "dev-sync: waiting for pnpm (attempt $attempt)" >&2
  attempt=$((attempt + 1))
  sleep 5
done

mkdir -p /pnpm/store
# mkdir is the lock. flock on a Docker Desktop volume can block forever.
# A dead holder in this container is cleared; another container is waited out.
lockdir=/pnpm/install.lockdir
host=$(cat /etc/hostname)
while ! mkdir "$lockdir" 2>/dev/null; do
  owner_host=$(cat "$lockdir/host" 2>/dev/null || true)
  owner_pid=$(cat "$lockdir/pid" 2>/dev/null || true)
  if [ "$owner_host" = "$host" ] && [ -n "$owner_pid" ] && ! kill -0 "$owner_pid" 2>/dev/null; then
    rm -rf "$lockdir"
    continue
  fi
  if [ -z "$owner_host" ]; then
    rm -rf "$lockdir"
    continue
  fi
  now=$(date +%s)
  mtime=$(stat -c %Y "$lockdir" 2>/dev/null || echo "$now")
  if [ $((now - mtime)) -gt 1800 ]; then
    rm -rf "$lockdir"
    continue
  fi
  echo "dev-sync: waiting for another install to finish"
  sleep 2
done
echo "$host" > "$lockdir/host"
echo $$ > "$lockdir/pid"
status=0
sh "$0" --install || status=$?
rm -rf "$lockdir"
if [ "$status" -ne 0 ]; then
  exit "$status"
fi

if [ "$#" -gt 0 ]; then
  exec "$@"
fi
