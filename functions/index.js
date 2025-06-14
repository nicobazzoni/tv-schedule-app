import * as functions from 'firebase-functions';
import admin from 'firebase-admin';
import cors from 'cors';

admin.initializeApp();
const db = admin.firestore();
const corsHandler = cors({ origin: true });

export const receiveSchedule = functions.https.onRequest((req, res) => {
  corsHandler(req, res, async () => {
    const todayKey = new Date().toLocaleDateString('en-CA', {
      timeZone: 'America/New_York'
    }); // yyyy-MM-dd

    if (req.method === 'POST') {
      const events = req.body;
      if (!Array.isArray(events)) {
        return res.status(400).json({ error: 'Invalid format — expected an array of events.' });
      }

      await db.collection('schedule').doc(todayKey).set({ events });
      return res.status(200).json({ success: true, count: events.length });
    }

    if (req.method === 'GET') {
      const date = req.query.date || todayKey;
      const doc = await db.collection('schedule').doc(date).get();

      if (!doc.exists) {
        return res.status(404).json({ error: `No schedule found for ${date}` });
      }

      return res.status(200).json(doc.data());
    }

    return res.status(405).json({ error: 'Method not allowed' });
  });
});