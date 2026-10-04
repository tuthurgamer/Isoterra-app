#!/usr/bin/env bash
# One-time setup of Isoterra on a Raspberry Pi (Raspberry Pi OS, 64-bit), run
# from the cloned repository by the user who owns it:
#
#   bash deploy/install-pi.sh
#
# Installs Node.js 24 when needed and the app's dependencies, then three
# systemd units: the app itself (started at boot, restarted if it stops), an
# update check against GitHub every five minutes, and a daily database backup.
set -euo pipefail

APP_DIR="$(cd "$(dirname "$0")/.." && pwd)"
APP_USER="$(id -un)"
BACKUP_DIR="$HOME/isoterra-sauvegardes"

if ! command -v node >/dev/null || [ "$(node -p 'process.versions.node.split(".")[0]')" -lt 22 ]; then
  echo "Installation de Node.js 24…"
  curl -fsSL https://deb.nodesource.com/setup_24.x | sudo -E bash -
  sudo apt-get install -y nodejs
fi
NODE_BIN="$(command -v node)"

cd "$APP_DIR"
npm ci --omit=dev --no-audit --no-fund
mkdir -p data public/uploads "$BACKUP_DIR"
chmod +x deploy/update.sh

sudo tee /etc/systemd/system/isoterra.service >/dev/null <<EOF
[Unit]
Description=Isoterra, carnet d'élevage
After=network-online.target
Wants=network-online.target

[Service]
User=$APP_USER
WorkingDirectory=$APP_DIR
Environment=NODE_ENV=production
Environment=PORT=3000
ExecStart=$NODE_BIN server.js
Restart=always
RestartSec=5

[Install]
WantedBy=multi-user.target
EOF

sudo tee /etc/systemd/system/isoterra-update.service >/dev/null <<EOF
[Unit]
Description=Isoterra, mise à jour depuis GitHub
After=network-online.target
Wants=network-online.target

[Service]
Type=oneshot
ExecStart=/bin/bash $APP_DIR/deploy/update.sh
EOF

sudo tee /etc/systemd/system/isoterra-update.timer >/dev/null <<EOF
[Unit]
Description=Isoterra, vérifie GitHub toutes les 5 minutes

[Timer]
OnBootSec=2min
OnUnitActiveSec=5min

[Install]
WantedBy=timers.target
EOF

sudo tee /etc/systemd/system/isoterra-backup.service >/dev/null <<EOF
[Unit]
Description=Isoterra, sauvegarde de la base

[Service]
Type=oneshot
User=$APP_USER
WorkingDirectory=$APP_DIR
ExecStart=$NODE_BIN deploy/backup.js $BACKUP_DIR
EOF

sudo tee /etc/systemd/system/isoterra-backup.timer >/dev/null <<EOF
[Unit]
Description=Isoterra, sauvegarde chaque nuit

[Timer]
OnCalendar=*-*-* 03:30:00
Persistent=true

[Install]
WantedBy=timers.target
EOF

sudo systemctl daemon-reload
sudo systemctl enable --now isoterra.service isoterra-update.timer isoterra-backup.timer
echo "Isoterra tourne sur le port 3000 ; mises à jour toutes les 5 minutes, sauvegardes dans $BACKUP_DIR."
