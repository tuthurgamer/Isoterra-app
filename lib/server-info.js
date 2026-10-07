// What the "Serveur" page shows: the Pi (temperature, power, memory, card),
// its network, the app (version, updates, data) and the backups. Each figure
// is read on its own and shows "—" when it can't be (on the PC, say), so one
// missing tool never breaks the page.

const os = require('node:os');
const fs = require('node:fs');
const path = require('node:path');
const { execFile } = require('node:child_process');
const db = require('../db/db');

const ROOT = path.join(__dirname, '..');
const DB_FILE = process.env.ISOTERRA_DB || path.join(ROOT, 'data', 'isoterra.db');
const UPLOADS_DIR = path.join(ROOT, 'public', 'uploads');
const BACKUP_DIR = process.env.ISOTERRA_BACKUPS || path.join(os.homedir(), 'isoterra-sauvegardes');
// Running as the Pi's service (systemd sets INVOCATION_ID): restarting,
// updating or switching off only make sense there.
const ON_PI = process.platform === 'linux' && Boolean(process.env.INVOCATION_ID);
const STARTED_AT = new Date(Date.now() - process.uptime() * 1000).toISOString();

function run(cmd, args, timeout = 5000) {
  return new Promise((resolve) => {
    execFile(cmd, args, { timeout, encoding: 'utf8', windowsHide: true }, (err, stdout) => resolve(err ? null : stdout.trim()));
  });
}

function read(file) {
  try {
    return fs.readFileSync(file, 'utf8').trim();
  } catch {
    return null;
  }
}

const decimal = new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 1 });

function size(bytes) {
  if (bytes == null) return '—';
  const units = ['o', 'Ko', 'Mo', 'Go', 'To'];
  let n = bytes, i = 0;
  while (n >= 1024 && i < units.length - 1) { n /= 1024; i++; }
  return `${decimal.format(n)} ${units[i]}`;
}

function duration(seconds) {
  const m = Math.floor(seconds / 60), h = Math.floor(m / 60), d = Math.floor(h / 24);
  if (d) return `${d} j ${h % 24} h`;
  if (h) return `${h} h ${m % 60} min`;
  if (m) return `${m} min`;
  return "moins d'une minute";
}

// "aujourd'hui à 03:30", "hier à 22:15", "demain à 03:30", "le 5 octobre à 03:30".
function when(date) {
  if (!date || Number.isNaN(date.getTime())) return '—';
  const now = new Date();
  const days = Math.round((Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()) - Date.UTC(now.getFullYear(), now.getMonth(), now.getDate())) / 86400000);
  const time = date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
  const day = { 0: "aujourd'hui", '-1': 'hier', 1: 'demain' }[days] || 'le ' + date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long' });
  return `${day} à ${time}`;
}

// systemctl prints "Thu 2026-10-08 03:30:00 CEST", in the Pi's local time.
function systemdDate(text) {
  const m = text && text.match(/(\d{4}-\d\d-\d\d) (\d\d:\d\d:\d\d)/);
  return m ? new Date(`${m[1]}T${m[2]}`) : null;
}

function folderSize(dir) {
  let total = 0;
  let entries = [];
  try { entries = fs.readdirSync(dir, { withFileTypes: true }); } catch { return null; }
  for (const e of entries) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) total += folderSize(p) || 0;
    else try { total += fs.statSync(p).size; } catch { /* vanished meanwhile */ }
  }
  return total;
}

let version = null;
async function appVersion() {
  if (!version) {
    const out = await run('git', ['-C', ROOT, 'log', '-1', '--format=%h%x09%cI%x09%s']);
    if (out) {
      const [hash, date, subject] = out.split('\t');
      version = { hash, date: new Date(date), subject };
    }
  }
  return version;
}

// vcgencmd get_throttled: bit 0 under-voltage now, bit 2 slowed down now,
// bit 16 under-voltage since boot, bit 18 slowed down since boot.
function powerRow(raw) {
  const m = raw && raw.match(/0x([0-9a-f]+)/i);
  const row = { key: 'alimentation', label: 'Alimentation', value: '—', level: null };
  if (!m) return row;
  const bits = parseInt(m[1], 16);
  const fix = "Il lui faut l'alimentation officielle 5,1 V / 2,5 A : une tension trop faible le ralentit et peut abîmer la carte SD.";
  if (bits & 0x1) return { ...row, value: 'Trop faible en ce moment', level: 'alert', note: fix };
  if (bits & 0x4) return { ...row, value: 'Pi ralenti en ce moment', level: 'alert', note: fix };
  if (bits & 0x10000) return { ...row, value: 'Trop faible par moments', level: 'warn', note: 'Des chutes de tension depuis le dernier démarrage. ' + fix };
  return { ...row, value: 'Correcte', level: 'ok' };
}

function wifiRow(ip) {
  const line = (read('/proc/net/wireless') || '').split('\n').find((l) => l.includes('wlan0'));
  const m = line && line.match(/wlan0:\s+\S+\s+[\d.]+\s+(-?\d+)/);
  if (!m) return { key: 'wifi', label: 'Wi-Fi', value: ip ? ip : '—', level: null };
  const dbm = Number(m[1]);
  const [quality, level] = dbm >= -60 ? ['bon', 'ok'] : dbm >= -70 ? ['moyen', 'ok'] : ['faible', 'warn'];
  return {
    key: 'wifi', label: 'Wi-Fi', level,
    value: `Signal ${quality} (${dbm} dBm)${ip ? ' · ' + ip : ''}`,
    note: level === 'warn' ? 'Le Pi capte mal la box : rapproche-les, ou branche-le en câble.' : null
  };
}

function ipv4(name) {
  const found = (os.networkInterfaces()[name] || []).find((a) => a.family === 'IPv4' && !a.internal);
  return found ? found.address : null;
}

function tailscaleRows(json) {
  let status = null;
  try { status = JSON.parse(json); } catch { /* not installed here */ }
  if (!status) return [{ key: 'tailscale', label: 'Tailscale', value: '—', level: null }];
  const online = status.BackendState === 'Running';
  const rows = [{
    key: 'tailscale', label: 'Tailscale', level: online ? 'ok' : 'alert',
    value: online ? `Connecté · ${(status.Self.TailscaleIPs || [])[0] || ''}` : `Déconnecté (${status.BackendState})`
  }];
  const expiry = status.Self && status.Self.KeyExpiry ? new Date(status.Self.KeyExpiry) : null;
  if (expiry && expiry.getFullYear() > 2000) {
    const daysLeft = Math.round((expiry - Date.now()) / 86400000);
    rows.push({
      key: 'cle', label: 'Clé Tailscale', level: daysLeft < 30 ? 'alert' : daysLeft < 60 ? 'warn' : null,
      value: `Expire ${when(expiry).replace(/ à .*/, '')}${expiry.getFullYear() !== new Date().getFullYear() ? ' ' + expiry.getFullYear() : ''}`,
      note: "Ce jour-là le Pi se déconnecte. Pour l'éviter : console Tailscale › Machines › isoterra › « Disable key expiry »."
    });
  } else {
    rows.push({ key: 'cle', label: 'Clé Tailscale', value: "N'expire jamais", level: 'ok' });
  }
  return rows;
}

function backupFiles() {
  try {
    return fs.readdirSync(BACKUP_DIR).filter((f) => f.endsWith('.db'))
      .map((f) => ({ name: f, stat: fs.statSync(path.join(BACKUP_DIR, f)) }))
      .sort((a, b) => b.stat.mtimeMs - a.stat.mtimeMs);
  } catch {
    return [];
  }
}

const plural = (n, word) => `${n} ${word}${n > 1 ? 's' : ''}`;

function worst(rows) {
  const rank = { alert: 2, warn: 1 };
  return rows.reduce((w, r) => ((rank[r.level] || 0) > (rank[w] || 0) ? r.level : w), 'ok');
}

async function collect() {
  const [throttled, tailscale, backupNext, updateLast, repairs, appLog, ver] = await Promise.all([
    run('vcgencmd', ['get_throttled']),
    run('tailscale', ['status', '--json']),
    run('systemctl', ['show', 'isoterra-backup.timer', '-p', 'NextElapseUSecRealtime', '--value']),
    run('systemctl', ['show', 'isoterra-update.timer', '-p', 'LastTriggerUSec', '--value']),
    run('journalctl', ['-u', 'isoterra-health', '-p', 'warning', '-n', '8', '--no-pager', '-o', 'short-iso']),
    run('journalctl', ['-u', 'isoterra', '-n', '40', '--no-pager', '-o', 'short-iso']),
    appVersion()
  ]);

  const tempRaw = read('/sys/class/thermal/thermal_zone0/temp');
  const temp = tempRaw ? Number(tempRaw) / 1000 : null;
  const freq = read('/sys/devices/system/cpu/cpu0/cpufreq/scaling_cur_freq');
  const memAvailable = (read('/proc/meminfo') || '').match(/MemAvailable:\s+(\d+)/);
  const memUsed = os.totalmem() - (memAvailable ? Number(memAvailable[1]) * 1024 : os.freemem());
  let disk = null;
  try {
    const s = fs.statfsSync(ROOT);
    disk = { total: s.blocks * s.bsize, used: (s.blocks - s.bavail) * s.bsize };
  } catch { /* unknown */ }
  const diskShare = disk ? Math.round(disk.used / disk.total * 100) : null;
  const load = os.loadavg()[0];

  const pi = [
    { key: 'modele', label: 'Modèle', value: (read('/proc/device-tree/model') || os.hostname()).replace(/\0/g, '') },
    { key: 'systeme', label: 'Système', value: ((read('/etc/os-release') || '').match(/PRETTY_NAME="([^"]+)"/) || [])[1] || `${os.type()} ${os.release()}` },
    { key: 'allume', label: 'Allumé depuis', value: duration(os.uptime()), note: `Démarré ${when(new Date(Date.now() - os.uptime() * 1000))}` },
    {
      key: 'temperature', label: 'Température', value: temp == null ? '—' : `${Math.round(temp)} °C`,
      level: temp == null ? null : temp >= 80 ? 'alert' : temp >= 70 ? 'warn' : 'ok',
      note: temp >= 70 ? 'Il chauffe : laisse-le à l\'air libre, loin d\'une source de chaleur.' : null
    },
    powerRow(throttled),
    {
      key: 'processeur', label: 'Processeur',
      value: process.platform === 'win32' ? '—' : `${Math.min(100, Math.round(load / os.cpus().length * 100))} % utilisé${freq ? ' · ' + decimal.format(Number(freq) / 1e6) + ' GHz' : ''}`
    },
    { key: 'memoire', label: 'Mémoire', value: `${size(memUsed)} sur ${size(os.totalmem())}` },
    {
      key: 'carte', label: 'Carte SD', value: disk ? `${size(disk.used)} sur ${size(disk.total)} (${diskShare} %)` : '—',
      level: diskShare == null ? null : diskShare >= 90 ? 'alert' : diskShare >= 80 ? 'warn' : 'ok'
    }
  ];

  const network = [
    wifiRow(ipv4('wlan0')),
    { key: 'cable', label: 'Câble réseau', value: ipv4('eth0') || 'Non branché' },
    ...tailscaleRows(tailscale)
  ];

  const failed = read(path.join(ROOT, '.git', 'isoterra-failed-commit'));
  const counts = db.prepare(`
    SELECT (SELECT COUNT(*) FROM bacs) AS bacs, (SELECT COUNT(*) FROM bac_species) AS fiches,
           (SELECT COUNT(*) FROM log_entries) AS entries,
           (SELECT COUNT(DISTINCT photo_path) FROM log_entries WHERE photo_path IS NOT NULL) AS photos,
           (SELECT COUNT(*) FROM species WHERE icon_path IS NOT NULL) AS icons
  `).get();
  let dbSize = null;
  try { dbSize = fs.statSync(DB_FILE).size + (fs.existsSync(DB_FILE + '-wal') ? fs.statSync(DB_FILE + '-wal').size : 0); } catch { /* unknown */ }
  const lastCheck = systemdDate(updateLast);

  const app = [
    { key: 'version', label: 'Version', value: ver ? `${ver.hash} · ${when(ver.date)}` : '—', note: ver ? ver.subject : null },
    { key: 'enService', label: 'En service depuis', value: duration(process.uptime()), note: 'Redémarre à chaque nouvelle version.' },
    {
      key: 'majAuto', label: 'Mises à jour', level: failed ? 'warn' : null,
      value: ON_PI ? `Vérifiées toutes les 5 min${lastCheck ? ' · dernière ' + when(lastCheck) : ''}` : '— (pas sur le Pi)',
      note: failed ? `La version ${failed.slice(0, 7)} n'a pas réussi à démarrer : le Pi est resté sur celle-ci.` : null
    },
    { key: 'node', label: 'Node.js', value: process.version },
    { key: 'base', label: 'Base de données', value: `${size(dbSize)} · ${plural(counts.bacs, 'bac')}, ${plural(counts.fiches, 'fiche')}, ${plural(counts.entries, 'entrée')}` },
    { key: 'photos', label: 'Photos et icônes', value: `${size(folderSize(UPLOADS_DIR))} · ${plural(counts.icons, 'icône')}, ${plural(counts.photos, 'photo')}` }
  ];

  const files = backupFiles();
  const latest = files[0];
  const latestAge = latest ? (Date.now() - latest.stat.mtimeMs) / 3600000 : null;
  const backups = [
    {
      key: 'derniere', label: 'Dernière', level: !latest || latestAge > 48 ? 'warn' : 'ok',
      value: latest ? `${when(latest.stat.mtime)} · ${size(latest.stat.size)}` : 'Aucune',
      note: !latest || latestAge > 48 ? 'Pas de sauvegarde récente : fais-en une maintenant.' : null
    },
    { key: 'gardees', label: 'Gardées sur le Pi', value: `${files.length} (les 30 dernières nuits)`, note: 'Elles sont sur la même carte SD que l\'app : télécharge une copie de temps en temps.' },
    { key: 'prochaine', label: 'Prochaine', value: ON_PI ? when(systemdDate(backupNext)) : '—' }
  ];

  const sections = [
    { key: 'pi', title: 'Le Pi', rows: pi },
    { key: 'reseau', title: 'Réseau', rows: network },
    { key: 'app', title: "L'app", rows: app },
    { key: 'sauvegardes', title: 'Sauvegardes', rows: backups }
  ];
  const all = sections.flatMap((s) => s.rows);
  const level = worst(all);
  const concerned = all.filter((r) => r.level === level && level !== 'ok').map((r) => r.label.toLowerCase());

  return {
    startedAt: STARTED_AT,
    onPi: ON_PI,
    summary: {
      level,
      text: level === 'ok' ? 'Tout va bien' : (level === 'alert' ? 'Problème : ' : 'À surveiller : ') + concerned.join(', ')
    },
    sections,
    // The health check's repairs (deploy/healthcheck.sh), most recent first.
    repairs: (repairs || '').split('\n').map((l) => l.match(/^(\S+) \S+ [^:]+: (.*)$/)).filter(Boolean)
      .map((m) => ({ when: when(new Date(m[1])), text: m[2] })).reverse(),
    log: appLog || ''
  };
}

module.exports = { collect, ON_PI, ROOT, BACKUP_DIR };
