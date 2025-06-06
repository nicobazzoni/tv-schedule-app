// functions/index.js
import functions from 'firebase-functions';
import admin from 'firebase-admin';
import cors from 'cors';
import { scrapeSchedule as handleScrapeSchedule } from './scrapeSchedule.js';

admin.initializeApp();
const db = admin.firestore();
const corsHandler = cors({ origin: true });

// 🔄 SCRAPE FUNCTION — Scrapes JIRA + POSTS to receiveSchedule
export const scrapeSchedule = functions.https.onRequest(handleScrapeSchedule);

// 📥 RECEIVE + SERVE SCHEDULE
export const receiveSchedule = functions.https.onRequest((req, res) => {
  corsHandler(req, res, async () => {
    try {
      const today = new Date().toLocaleDateString('en-CA', { timeZone: 'America/New_York' }); // format: yyyy-mm-dd

      if (req.method === 'POST') {
        const events = req.body;
        await db.collection('schedule').doc(today).set({ events });
        return res.status(200).json({ success: true });
      }

      if (req.method === 'GET') {
        const doc = await db.collection('schedule').doc(today).get();
        if (!doc.exists) return res.status(404).json({ error: 'No schedule found' });
        return res.status(200).json(doc.data().events || []);
      }

      return res.status(405).send('Method Not Allowed');
    } catch (err) {
      console.error('receiveSchedule error:', err);
      return res.status(500).json({ error: 'Internal server error' });
    }
  });
});