// Reminders on the phone: once a day, at the time chosen on the "Rappels"
// page, the phones that asked for them get a notification listing the bacs
// to feed or mist today (Web Push, so it arrives with the app closed).
// Nothing is sent on a day with nothing to do.

const webpush = require('web-push');
const db = require('../db/db');
const { getSettings, setSetting } = require('./settings');
const { careStatuses, bacStatusOf } = require('./care');
const { numTag } = require('../views/helpers/format');

const DEFAULT_TIME = '08:00';
// After a restart, a reminder whose time has passed is still sent if it is
// no more than this late; later, it waits for the next day.
const LATE_WINDOW_MINUTES = 180;

// The keys that sign our messages to the phones' push services, made once.
function vapidKeys() {
  const settings = getSettings();
  if (settings.vapid_public && settings.vapid_private) {
    return { publicKey: settings.vapid_public, privateKey: settings.vapid_private };
  }
  const keys = webpush.generateVAPIDKeys();
  setSetting('vapid_public', keys.publicKey);
  setSetting('vapid_private', keys.privateKey);
  return keys;
}

function publicKey() {
  return vapidKeys().publicKey;
}

function reminderTime() {
  const time = getSettings().rappels_heure;
  return /^\d{2}:\d{2}$/.test(time || '') ? time : DEFAULT_TIME;
}

function localDate(now) {
  const pad = (n) => String(n).padStart(2, '0');
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
}

// A care is due once as many days as its rhythm have passed (or it was
// never logged); "late" once the care page would say "En retard" or worse.
const isDue = (item) => Boolean(item.every) && (item.days === null || item.days >= item.every);
const isLate = (item) => item.level === 'retard' || item.level === 'alerte';

// Today's list, bac by bac, or null when there is nothing to do.
function todaysCare(now = new Date()) {
  const byBac = new Map();
  for (const status of careStatuses({}, now).values()) {
    if (!byBac.has(status.bac)) byBac.set(status.bac, []);
    byBac.get(status.bac).push(status);
  }
  const names = new Map(db.prepare(`
    SELECT b.id, b.name, GROUP_CONCAT(s.scientific_name, ', ') AS residents
    FROM bacs b JOIN bac_species bs ON bs.bac_id = b.id JOIN species s ON s.id = bs.species_id
    GROUP BY b.id
  `).all().map((r) => [r.id, r]));

  const feed = [];
  const mist = [];
  for (const [bacId, fiches] of byBac) {
    const bac = bacStatusOf(fiches);
    const row = names.get(bacId) || {};
    const entry = { bac: bacId, label: numTag(bacId) + (row.name ? ` « ${row.name} »` : ''), residents: row.residents || '' };
    if (isDue(bac.feed)) feed.push({ ...entry, late: isLate(bac.feed) });
    if (isDue(bac.mist)) mist.push({ ...entry, late: isLate(bac.mist) });
  }
  const order = (a, b) => (b.late - a.late) || (a.bac - b.bac);
  feed.sort(order);
  mist.sort(order);
  const bacs = new Set([...feed, ...mist].map((e) => e.bac));
  if (!bacs.size) return null;
  return { feed, mist, bacCount: bacs.size };
}

// "n° 003, n° 012 (en retard) et 4 autres"
function listText(entries, max = 6) {
  const shown = entries.slice(0, max).map((e) => e.label + (e.late ? ' (en retard)' : ''));
  const more = entries.length - shown.length;
  return shown.join(', ') + (more > 0 ? ` et ${more} autre${more > 1 ? 's' : ''}` : '');
}

// The notification itself, as the service worker shows it.
function messageFor(care) {
  const lines = [];
  if (care.feed.length) lines.push('Nourrir : ' + listText(care.feed));
  if (care.mist.length) lines.push('Pulvériser : ' + listText(care.mist));
  return {
    title: `${care.bacCount} bac${care.bacCount > 1 ? 's' : ''} à soigner aujourd'hui`,
    body: lines.join('\n'),
    url: '/',
    tag: 'soins-du-jour'
  };
}

function subscriptions() {
  return db.prepare('SELECT * FROM push_subscriptions ORDER BY id').all();
}

function saveSubscription(sub, label) {
  if (!sub || typeof sub.endpoint !== 'string' || !/^https:\/\//.test(sub.endpoint)) return null;
  const keys = sub.keys || {};
  if (typeof keys.p256dh !== 'string' || typeof keys.auth !== 'string') return null;
  db.prepare(`
    INSERT INTO push_subscriptions (endpoint, p256dh, auth, label) VALUES (?, ?, ?, ?)
    ON CONFLICT(endpoint) DO UPDATE SET p256dh = excluded.p256dh, auth = excluded.auth, label = excluded.label
  `).run(sub.endpoint, keys.p256dh, keys.auth, String(label || '').slice(0, 80) || null);
  return db.prepare('SELECT id FROM push_subscriptions WHERE endpoint = ?').get(sub.endpoint).id;
}

function removeSubscription({ id, endpoint }) {
  if (id) db.prepare('DELETE FROM push_subscriptions WHERE id = ?').run(id);
  if (endpoint) db.prepare('DELETE FROM push_subscriptions WHERE endpoint = ?').run(endpoint);
}

// Sends one message to the given phones. A phone whose subscription is gone
// (app uninstalled, notifications turned off) is forgotten.
async function send(message, targets = subscriptions()) {
  const keys = vapidKeys();
  const options = {
    vapidDetails: { subject: 'https://github.com/tuthurgamer/Isoterra-app', publicKey: keys.publicKey, privateKey: keys.privateKey },
    TTL: 6 * 3600,
    urgency: 'high'
  };
  let sent = 0;
  for (const sub of targets) {
    try {
      await webpush.sendNotification({ endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } }, JSON.stringify(message), options);
      db.prepare("UPDATE push_subscriptions SET last_sent_at = datetime('now', 'localtime') WHERE id = ?").run(sub.id);
      sent++;
    } catch (err) {
      if (err.statusCode === 404 || err.statusCode === 410) removeSubscription({ id: sub.id });
      else console.warn(`Rappel non envoyé au téléphone ${sub.id} : ${err.statusCode || ''} ${err.body || err.message}`);
    }
  }
  return sent;
}

// Checked every minute: once the chosen time has come (and not too long
// ago), today's reminder goes out, once.
async function tick(now = new Date()) {
  const today = localDate(now);
  if (getSettings().rappels_envoye_le === today) return;
  if (!subscriptions().length) return;
  const [h, m] = reminderTime().split(':').map(Number);
  const late = now.getHours() * 60 + now.getMinutes() - (h * 60 + m);
  if (late < 0 || late > LATE_WINDOW_MINUTES) return;
  // Marked first: a failing push service mustn't mean a message every minute.
  setSetting('rappels_envoye_le', today);
  const care = todaysCare(now);
  if (care) await send(messageFor(care));
}

function startReminderClock() {
  const run = () => tick().catch((err) => console.warn('Rappels :', err.message));
  setTimeout(run, 20 * 1000);
  setInterval(run, 60 * 1000).unref();
}

module.exports = {
  publicKey, reminderTime, todaysCare, messageFor, subscriptions, saveSubscription, removeSubscription,
  send, tick, startReminderClock, DEFAULT_TIME
};
