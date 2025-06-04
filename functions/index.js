const { onRequest } = require('firebase-functions/v2/https');
const { onSchedule } = require('firebase-functions/v2/scheduler');
const cors = require('cors')({ origin: true });
const cheerio = require('cheerio');
const { initializeApp } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');

initializeApp();
const db = getFirestore();

// === Helper: CORS wrapper ===
function withCORS(handler) {
  return (req, res) => {
    res.set('Access-Control-Allow-Origin', '*');
    res.set('Access-Control-Allow-Headers', 'Content-Type');
    if (req.method === 'OPTIONS') {
      res.status(204).send('');
      return;
    }
    return handler(req, res);
  };
}

// === GET schedule from Firestore ===
exports.getSchedule = onRequest(
  withCORS(async (req, res) => {
    try {
      const snapshot = await db.collection('schedule').get();
      const data = snapshot.docs.map(doc => doc.data());
      res.status(200).json(data);
    } catch (err) {
      console.error('❌ Error fetching schedule:', err);
      res.status(500).json({ error: 'Failed to fetch schedule' });
    }
  })
);

// === Manual trigger of scrape ===
exports.triggerScrape = onRequest(
  withCORS(async (req, res) => {
    await scrapeAndStore();
    res.status(200).send('Scrape triggered');
  })
);

// === External POST receiver (e.g., cloud task or webhook) ===
exports.receiveSchedule = onRequest((req, res) => {
  cors(req, res, async () => {
    try {
      if (req.method !== 'POST') {
        res.status(405).send('Method Not Allowed');
        return;
      }

      const events = req.body;
      console.log('🔍 Incoming payload:', JSON.stringify(events));

      if (!Array.isArray(events) || events.length === 0) {
        console.error('❌ Invalid or empty event payload');
        res.status(400).send('Invalid payload');
        return;
      }

      const batch = db.batch();
      const col = db.collection('schedule');

      events.forEach(event => {
        const doc = col.doc();
        batch.set(doc, event);
      });

      await batch.commit();
      console.log(`✅ Saved ${events.length} events`);
      res.status(200).send(`Saved ${events.length} events`);
    } catch (err) {
      console.error('❌ Failed to receive schedule:', err);
      res.status(500).send('Server error');
    }
  });
});

// === Scheduled scrape at 3 AM ===
exports.scheduledScrape = onSchedule('every day 03:00', async () => {
  await scrapeAndStore();
});

// === Shared scraper logic ===
async function scrapeAndStore() {
  const today = new Date().toISOString().split('T')[0];
  const TARGET_URL = `https://jira.news.apps.fox/plugins/servlet/embedded-calendar?id=f5e8cadf-69d0-43b1-9e48-f8cae4ffc76c&view=listDay&date=${today}`;

  const fetch = (...args) => import('node-fetch').then(({ default: fetch }) => fetch(...args));
  const res = await fetch(TARGET_URL);
  const html = await res.text();
  const $ = cheerio.load(html);

  const events = [];

  $('table.fc-list-table tbody tr').each((i, row) => {
    const timeCell = $(row).find('.fc-list-event-time').text().trim();
    const titleCell = $(row).find('.fc-list-event-title').text().trim();

    if (!timeCell || !titleCell) return;

    const [startStr, endStr] = timeCell.split(' - ').map(s => s.trim());
    const title = titleCell.replace(/^REQ-\d+\s*-\s*/, '');

    const parseTime = (t) => {
      const match = t.match(/(\d{1,2}):(\d{2})\s*([ap]m)/i);
      if (!match) return null;
      let [_, hour, min, period] = match;
      hour = parseInt(hour, 10);
      if (period.toLowerCase() === 'pm' && hour !== 12) hour += 12;
      if (period.toLowerCase() === 'am' && hour === 12) hour = 0;
      return `${today}T${hour.toString().padStart(2, '0')}:${min}:00`;
    };

    const start = parseTime(startStr);
    const end = parseTime(endStr);

    const isValidShow = (t) => {
      const lower = t.toLowerCase();
      return (
        lower.includes('studio') &&
        !lower.includes('maintenance') &&
        !lower.includes('standby') &&
        !lower.includes('demolished') &&
        !lower.includes('no control room') &&
        !lower.includes('out of commission')
      );
    };

    if (start && end && isValidShow(title)) {
      events.push({ title, start, end });
    }
  });

  const col = db.collection('schedule');
  const batch = db.batch();
  const old = await col.get();
  old.forEach(doc => batch.delete(doc.ref));
  events.forEach(event => {
    const ref = col.doc();
    batch.set(ref, event);
  });

  await batch.commit();
  console.log(`✅ Scraped and saved ${events.length} events`);
}