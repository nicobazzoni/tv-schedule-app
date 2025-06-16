import * as functions from 'firebase-functions';
import admin from 'firebase-admin';
import cors from 'cors';
import fetch from 'node-fetch';
import { DateTime } from 'luxon';

admin.initializeApp();
const db = admin.firestore();
const corsHandler = cors({ origin: true });

// ========== scrape logic reused ==========
const handler = async () => {
  const JIRA_API = 'https://jira.news.apps.fox/rest/api/2/search?jql=filter%3D22719&fields=customfield_18703,customfield_18822,customfield_17902,customfield_18751,customfield_16811';
  const POST_URL = 'https://us-central1-tv-schedule-app-nico.cloudfunctions.net/receiveSchedule';
  const API_TOKEN = process.env.JIRA_API_TOKEN;
  const email = process.env.JIRA_EMAIL;


console.log('🔐 Using Bearer token:', API_TOKEN ? '✅ present' : '❌ missing');
  
const res = await fetch(JIRA_API, {
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${API_TOKEN}`,
      'Accept': 'application/json'
    }
  });

  if (!res.ok) throw new Error(`JIRA API error: ${res.status}`);

  const json = await res.json();

  const items = json.issues.map(issue => {
    const fields = issue.fields;
    const show = Array.isArray(fields.customfield_18703) ? fields.customfield_18703[0] : fields.customfield_18703 || 'Untitled';
    const start = fields.customfield_18822;
    const end = fields.customfield_17902;
    const studio = Array.isArray(fields.customfield_18751) ? fields.customfield_18751[0] : fields.customfield_18751 || '';
    const ctrl = Array.isArray(fields.customfield_16811) ? fields.customfield_16811[0] : fields.customfield_16811 || '';
  
    const startET = DateTime.fromISO(start, { zone: 'utc' }).setZone('America/New_York').toISO();
    const endET = DateTime.fromISO(end, { zone: 'utc' }).setZone('America/New_York').toISO();
  
    return {
      title: `  ${show}`,
      studio:`${studio}`,
      start: startET,
      end: endET,
      controlRoom: ctrl
    };
  });

  const todayKey = DateTime.now().setZone('America/New_York').toFormat('yyyy-MM-dd');
  const postRes = await fetch(`${POST_URL}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(items)
  });

  if (!res.ok) {
    const msg = await res.text();
    console.error(`🧨 Full response from JIRA:\n${msg}`);
    throw new Error(`JIRA API error: ${res.status}`);
  }

  if (!postRes.ok) {
    const msg = await postRes.text();
    throw new Error(`POST failed: ${postRes.status} – ${msg}`);
  }

  console.log(`📤 Posted ${items.length} events to Firestore for ${todayKey}`);
};

// ========== Schedule Firestore Ingest ==========
export const scrapeNow = functions
  .runWith({ secrets: ['JIRA_API_TOKEN', 'JIRA_EMAIL'] })
  .https.onRequest(async (req, res) => {
    try {
      await handler();
      res.status(200).send('Scrape completed');
    } catch (err) {
      console.error('🔥 Scrape error:', err.message);
      res.status(500).send('Scrape failed');
    }
  });

export const scheduledScrape = functions
  .runWith({ secrets: ['JIRA_API_TOKEN', 'JIRA_EMAIL'] })
  .pubsub.schedule('0 3,16 * * *') // 3am & 4pm Eastern
  .timeZone('America/New_York')
  .onRun(async () => {
    await handler();
  });

// ========== Schedule API Endpoint ==========
export const receiveSchedule = functions.https.onRequest((req, res) => {
  corsHandler(req, res, async () => {
    const todayKey = new Date().toLocaleDateString('en-CA', {
      timeZone: 'America/New_York'
    });

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