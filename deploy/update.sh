#!/usr/bin/env bash
# Run by isoterra-update.timer every five minutes (as root). When main has a
# newer commit on GitHub: fetch it, reinstall the dependencies if they
# changed, restart the app, and go back to the previous version if the new
# one doesn't answer. A version that failed is not retried until a newer
# commit arrives.
set -euo pipefail

APP_DIR="$(cd "$(dirname "$0")/.." && pwd)"
APP_USER="$(stat -c %U "$APP_DIR")"
FAILED_FILE="$APP_DIR/.git/isoterra-failed-commit"
as_app() { runuser -u "$APP_USER" -- "$@"; }

cd "$APP_DIR"
as_app git fetch --quiet origin main
OLD="$(as_app git rev-parse HEAD)"
NEW="$(as_app git rev-parse origin/main)"
[ "$OLD" = "$NEW" ] && exit 0
[ -f "$FAILED_FILE" ] && [ "$(cat "$FAILED_FILE")" = "$NEW" ] && exit 0

switch_to() {
  local from="$1" to="$2"
  as_app git reset --hard --quiet "$to"
  if ! as_app git diff --quiet "$from" "$to" -- package-lock.json; then
    as_app npm ci --omit=dev --no-audit --no-fund
  fi
  systemctl restart isoterra.service
}

answers() {
  for _ in $(seq 1 20); do
    curl -fs -o /dev/null http://127.0.0.1:3000/ && return 0
    sleep 2
  done
  return 1
}

echo "Mise à jour ${OLD:0:7} -> ${NEW:0:7}"
switch_to "$OLD" "$NEW"
if answers; then
  rm -f "$FAILED_FILE"
  echo "Version ${NEW:0:7} en service."
  exit 0
fi

echo "La version ${NEW:0:7} ne répond pas : retour à ${OLD:0:7}." >&2
echo "$NEW" > "$FAILED_FILE"
switch_to "$NEW" "$OLD"
exit 1
