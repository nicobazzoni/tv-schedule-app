import functions from 'firebase-functions';
import admin from 'firebase-admin';
import puppeteer from 'puppeteer';
import { DateTime } from 'luxon';
import cors from 'cors';

admin.initializeApp();
const db = admin.firestore();
const corsHandler = cors({ origin: true });

export const scrapeSchedule = functions.https.onRequest((req, res) => {
  corsHandler(req, res, async () => {
    try {
      const today = DateTime.now().setZone('America/New_York').toFormat('yyyy-MM-dd');
      const TARGET_URL = `https://jira.news.apps.fox/plugins/servlet/embedded-calendar?id=f5e8cadf-69d0-43b1-9e48-f8cae4ffc76c&view=listDay&date=${today}`;

      const browser = await puppeteer.launch({
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox'],
      });

      const page = await browser.newPage();
      await page.goto(TARGET_URL, { waitUntil: 'domcontentloaded', timeout: 60000 });
      await page.waitForSelector('table.fc-list-table, .fc-no-events', { timeout: 60000 });

      const events = await page.evaluate((todayStr) => {
        const rows = Array.from(document.querySelectorAll('table.fc-list-table tbody tr'));
        const data = [];

        for (const row of rows) {
          const timeCell = row.querySelector('.fc-list-event-time');
          const titleCell = row.querySelector('.fc-list-event-title');
          if (!timeCell || !titleCell) continue;

          const [startStr, endStr] = timeCell.innerText.trim().split(' - ');
          let title = titleCell.innerText.trim().replace(/^REQ-\d+\s*-\s*/, '');

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

          const isValid = (t) =>
            t.toLowerCase().includes('studio') &&
            !t.toLowerCase().includes('maintenance') &&
            !t.toLowerCase().includes('standby') &&
            !t.toLowerCase().includes('demolished') &&
            !t.toLowerCase().includes('no control room') &&
            !t.toLowerCase().includes('out of commission');

          if (start && end && isValid(title)) {
            data.push({ title, start, end });
          }
        }

        return data;
      }, today);

      await browser.close();

      // Save to Firestore
      await db.collection('schedule').doc(today).set({ events });

      return res.status(200).json(events);
    } catch (err) {
      console.error('Scrape error:', err);
      return res.status(500).json({ error: 'Failed to scrape schedule' });
    }
  });
});

// 🔁 Cloud Scheduler hits this to trigger scrape
export const triggerScrape = functions.https.onRequest(async (req, res) => {
  const fetch = await import('node-fetch').then(mod => mod.default);
  try {
    const scrapeRes = await fetch('https://us-central1-tv-schedule-app-nico.cloudfunctions.net/scrapeSchedule');
    const data = await scrapeRes.json();
    return res.status(200).json({ ok: true, data });
  } catch (err) {
    console.error('Trigger scrape failed:', err);
    return res.status(500).json({ error: 'Failed to trigger scrape' });
  }
});

// 📡 Frontend fetches from here

export const receiveSchedule = functions.https.onRequest((req, res) => {
  corsHandler(req, res, async () => {
    try {
      const today = DateTime.now().setZone('America/New_York').toFormat('yyyy-MM-dd');

      if (req.method === 'POST') {
        // Handle POST from scraper
        const events = req.body;
        await db.collection('schedule').doc(today).set({ events });
        return res.status(200).json({ success: true });
      }

      if (req.method === 'GET') {
        // Handle GET from frontend
        const doc = await db.collection('schedule').doc(today).get();
        if (!doc.exists) {
          return res.status(404).json({ error: 'No schedule found' });
        }
        return res.status(200).json(doc.data().events || []);
      }

      // Method not allowed
      return res.status(405).send('Method Not Allowed');
    } catch (err) {
      console.error('receiveSchedule error:', err);
      return res.status(500).json({ error: 'Internal server error' });
    }
  });
});