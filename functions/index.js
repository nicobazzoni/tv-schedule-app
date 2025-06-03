import { onRequest } from 'firebase-functions/v2/https';
import * as logger from 'firebase-functions/logger';
import admin from 'firebase-admin';
import corsLib from 'cors';
import puppeteer from 'puppeteer';
import fetch from 'node-fetch';

// ✅ Initialize Firebase Admin SDK
if (!admin.apps.length) {
  admin.initializeApp();
}

// ✅ Setup CORS
const cors = corsLib({ origin: true });

export const getSchedule = onRequest({ cors: true }, async (req, res) => {
  try {
    const snapshot = await admin.firestore().collection('tvSchedule').get();
    const schedule = snapshot.docs.map(doc => doc.data());
    res.status(200).json(schedule);
  } catch (err) {
    console.error('Failed to fetch schedule:', err);
    res.status(500).send('Internal server error');
  }
});
// ✅ PUBLIC: Schedule Receiver
export const receiveSchedule = onRequest((req, res) => {
  cors(req, res, async () => {
    if (req.method !== 'POST') {
      return res.status(405).send('Only POST allowed');
    }

    const events = req.body;

    try {
      const batch = admin.firestore().batch();
      const ref = admin.firestore().collection('tvSchedule');

      events.forEach(event => {
        const docRef = ref.doc();
        batch.set(docRef, event);
      });

      await batch.commit();

      // ✅ CORS success response
      res.set('Access-Control-Allow-Origin', '*'); // Or restrict to 'https://tv-schedule-app.vercel.app'
      res.status(200).send('Schedule received');
    } catch (err) {
      logger.error('Firestore write error:', err);
      res.status(500).send('Failed to store schedule');
    }
  });
});

// ✅ PUBLIC: Scrape and Send
export const triggerScrape = onRequest(
  { cors: true, allowAny: true },
  async (req, res) => {
    logger.log('🟢 Scrape triggered');
    if (req.method !== 'POST') {
      return res.status(405).send('Only POST allowed');
    }

    const today = new Date().toISOString().split('T')[0];
    const TARGET_URL = `https://jira.news.apps.fox/plugins/servlet/embedded-calendar?id=f5e8cadf-69d0-43b1-9e48-f8cae4ffc76c&view=listDay&date=${today}`;
    const POST_URL = 'https://receiveschedule-6t5x7ecxxq-uc.a.run.app';

    let browser;
    try {
      browser = await puppeteer.launch({
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox'],
      });

      const page = await browser.newPage();
      await page.setUserAgent(
        'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/88.0.4324.96 Safari/537.36'
      );

      logger.log('🌐 Navigating to', TARGET_URL);
      await page.goto(TARGET_URL, { waitUntil: 'domcontentloaded', timeout: 60000 });
      await page.waitForSelector('table.fc-list-table, .fc-no-events', { timeout: 60000 });

      const events = await page.evaluate((todayStr) => {
        const rows = Array.from(document.querySelectorAll('table.fc-list-table tbody tr'));
        const data = [];

        for (const row of rows) {
          const timeCell = row.querySelector('.fc-list-event-time');
          const titleCell = row.querySelector('.fc-list-event-title');
          if (!timeCell || !titleCell) continue;

          const timeText = timeCell.innerText.trim();
          const [startStr, endStr] = timeText.split(' - ').map(s => s.trim());
          let title = titleCell.innerText.trim();
          title = title.replace(/^REQ-\d+\s*-\s*/, '');

          const parseTime = (t) => {
            const match = t.match(/(\d{1,2}):(\d{2})\s*([ap]m)/i);
            if (!match) return null;
            let [_, hour, min, period] = match;
            hour = parseInt(hour, 10);
            if (period.toLowerCase() === 'pm' && hour !== 12) hour += 12;
            if (period.toLowerCase() === 'am' && hour === 12) hour = 0;
            return `${todayStr}T${hour.toString().padStart(2, '0')}:${min}:00`;
          };

          const start = parseTime(startStr);
          const end = parseTime(endStr);

          const isValidShow = (title) => {
            const t = title.toLowerCase();
            return (
              t.includes('studio') &&
              !t.includes('maintenance') &&
              !t.includes('standby') &&
              !t.includes('demolished') &&
              !t.includes('no control room') &&
              !t.includes('out of commission')
            );
          };

          if (start && end && isValidShow(title)) {
            data.push({ title, start, end });
          }
        }

        return data;
      }, today);

      logger.log(`📦 Extracted ${events.length} events`);

      const response = await fetch(POST_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(events),
      });

      const text = await response.text();
      logger.log('📬 POST response', response.status, text);

      if (!response.ok) throw new Error(`POST failed with ${response.status}`);

      res.status(200).send('Scrape complete');
    } catch (err) {
      logger.error('❌ Scrape error:', err);
      res.status(500).send('Scrape error');
    } finally {
      if (browser) await browser.close();
    }
  }
);