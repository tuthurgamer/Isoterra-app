#!/usr/bin/env bash
# Setup of Isoterra on a Raspberry Pi (Raspberry Pi OS, 64-bit), run from the
# cloned repository by the user who owns it (safe to run again):
#
#   bash deploy/install-pi.sh
#
# Installs Node.js 24 when needed and the app's dependencies, then:
#   - isoterra.service: the app, started at boot and restarted if it stops;
#   - isoterra-update.timer: pulls new commits from GitHub every 5 minutes;
#   - isoterra-backup.timer: database backup every night;
#   - isoterra-health.timer: checks network, app and Tailscale every minute
#     and repairs them (see deploy/healthcheck.sh);
#   - the hardware watchdog and an automatic reboot after a kernel panic;
#   - Wi-Fi without power saving, reconnecting forever after an outage;
#   - automatic security updates for the system and Tailscale.
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
chmod +x deploy/update.sh deploy/healthcheck.sh

# --- The app and its timers -------------------------------------------------

sudo tee /etc/systemd/system/isoterra.service >/dev/null <<EOF
[Unit]
Description=Isoterra, carnet d'élevage
After=network-online.target
Wants=network-online.target
# Never give up restarting it.
StartLimitIntervalSec=0

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

sudo tee /etc/systemd/system/isoterra-health.service >/dev/null <<EOF
[Unit]
Description=Isoterra, contrôle du réseau, de l'appli et de Tailscale

[Service]
Type=oneshot
ExecStart=/bin/bash $APP_DIR/deploy/healthcheck.sh
# Routine runs stay out of the journal; repairs are logged as warnings.
LogLevelMax=notice
EOF

sudo tee /etc/systemd/system/isoterra-health.timer >/dev/null <<EOF
[Unit]
Description=Isoterra, contrôle chaque minute

[Timer]
OnBootSec=4min
OnUnitActiveSec=1min
AccuracySec=10s

[Install]
WantedBy=timers.target
EOF

# --- The Pi itself ------------------------------------------------------------

# Hardware watchdog: if the system freezes, the Pi reboots by itself
# (the Pi's watchdog can't wait longer than about 15 s).
sudo mkdir -p /etc/systemd/system.conf.d
sudo tee /etc/systemd/system.conf.d/isoterra-watchdog.conf >/dev/null <<EOF
[Manager]
RuntimeWatchdogSec=14s
RebootWatchdogSec=2min
EOF

# Reboot 10 s after a kernel panic instead of staying stuck.
echo "kernel.panic = 10" | sudo tee /etc/sysctl.d/90-isoterra.conf >/dev/null
sudo sysctl -q -p /etc/sysctl.d/90-isoterra.conf

# Wi-Fi: no power saving (a frequent cause of drop-outs on the Pi), and every
# network connection keeps trying to reconnect, however long the box is off.
sudo mkdir -p /etc/NetworkManager/conf.d
sudo tee /etc/NetworkManager/conf.d/90-isoterra-wifi.conf >/dev/null <<EOF
[connection]
wifi.powersave=2
EOF
while IFS=: read -r name type; do
  case "$type" in
    802-11-wireless) sudo nmcli connection modify "$name" connection.autoconnect-retries 0 802-11-wireless.powersave 2 ;;
    802-3-ethernet) sudo nmcli connection modify "$name" connection.autoconnect-retries 0 ;;
  esac
done < <(nmcli -t -f NAME,TYPE connection show)

# Logs capped so they never fill the SD card.
sudo mkdir -p /etc/systemd/journald.conf.d
sudo tee /etc/systemd/journald.conf.d/90-isoterra.conf >/dev/null <<EOF
[Journal]
SystemMaxUse=100M
EOF
sudo systemctl restart systemd-journald

# Security updates installed automatically (system and Tailscale).
sudo DEBIAN_FRONTEND=noninteractive apt-get install -y -qq -o DPkg::Lock::Timeout=600 unattended-upgrades >/dev/null
sudo tee /etc/apt/apt.conf.d/20auto-upgrades >/dev/null <<EOF
APT::Periodic::Update-Package-Lists "1";
APT::Periodic::Unattended-Upgrade "1";
EOF
if command -v tailscale >/dev/null; then sudo tailscale set --auto-update; fi

sudo systemctl daemon-reexec
sudo systemctl daemon-reload
sudo systemctl enable --now isoterra.service isoterra-update.timer isoterra-backup.timer isoterra-health.timer

echo "Isoterra tourne sur le port 3000 : mises à jour toutes les 5 minutes, contrôle chaque minute, sauvegardes dans $BACKUP_DIR."
throttled="$(vcgencmd get_throttled 2>/dev/null | cut -d= -f2 || true)"
if [ -n "$throttled" ] && [ $(( throttled & 0x50005 )) -ne 0 ]; then
  echo "ATTENTION : le Pi manque de courant ($throttled). Utilise une alimentation officielle 5,1 V / 2,5 A et un câble court."
fi
