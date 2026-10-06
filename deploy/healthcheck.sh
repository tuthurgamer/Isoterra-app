#!/usr/bin/env bash
# Run every minute by isoterra-health.timer (as root) to keep Isoterra
# reachable, from the mildest remedy to the strongest:
#   - the box out of reach 3 minutes in a row: Wi-Fi and network restarted;
#   - the app not answering 3 minutes in a row: the app is restarted;
#   - Tailscale disconnected 3 minutes in a row: Tailscale is restarted;
#   - the box or the app still out after 10 minutes: the Pi reboots, once per
#     incident (no reboot loop while the box itself is off).
# Remedies are retried every 10 minutes while the problem lasts. A frozen
# system is the hardware watchdog's job (see install-pi.sh).
set -uo pipefail

RUN=/run/isoterra-health        # consecutive failures, reset at each boot
KEEP=/var/lib/isoterra-health   # "already rebooted for this", kept across reboots
mkdir -p "$RUN" "$KEEP"

# "<4>" makes journald log the line as a warning (routine runs stay quiet).
say() { echo "<4>$*"; }

# Consecutive failures of a check, printed after counting this run (0 = ok).
tally() {
  local name="$1" ok="$2" file="$RUN/$1"
  if [ "$ok" = 1 ]; then
    rm -f "$file" "$KEEP/$name-reboot"
    echo 0
    return
  fi
  local n=$(( $(cat "$file" 2>/dev/null || echo 0) + 1 ))
  echo "$n" > "$file"
  echo "$n"
}

# True at the 3rd failure, then every 10 minutes.
remedy_due() { [ "$1" -ge 3 ] && [ $(( ($1 - 3) % 10 )) -eq 0 ]; }

reboot_once() {
  [ -f "$KEEP/$1-reboot" ] && return 0
  touch "$KEEP/$1-reboot"
  say "$2 : redémarrage du Pi."
  systemctl reboot
  exit 0
}

# Leave the Pi alone right after boot and while an update restarts the app.
[ "$(cut -d. -f1 /proc/uptime)" -lt 240 ] && exit 0
systemctl is-active --quiet isoterra-update.service && exit 0

gateway="$(ip -4 route show default | awk '{print $3; exit}')"
ok=0; [ -n "$gateway" ] && ping -c1 -W3 "$gateway" >/dev/null 2>&1 && ok=1
n="$(tally network "$ok")"
[ "$n" -ge 10 ] && reboot_once network "La box est injoignable depuis 10 minutes"
if remedy_due "$n"; then
  say "La box est injoignable : relance du Wi-Fi et du réseau."
  nmcli radio wifi off; sleep 2; nmcli radio wifi on
  systemctl restart NetworkManager
fi

ok=0; curl -fs -o /dev/null --max-time 10 http://127.0.0.1:3000/ && ok=1
n="$(tally app "$ok")"
[ "$n" -ge 10 ] && reboot_once app "L'appli ne répond plus depuis 10 minutes"
if remedy_due "$n"; then
  say "L'appli ne répond plus : redémarrage de l'appli."
  systemctl restart isoterra.service
fi

ok=0; tailscale status --json 2>/dev/null | grep -q '"BackendState": *"Running"' && ok=1
n="$(tally tailscale "$ok")"
if remedy_due "$n"; then
  say "Tailscale est déconnecté : redémarrage de Tailscale."
  systemctl restart tailscaled
fi

exit 0
