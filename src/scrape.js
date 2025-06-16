// scrape.js
import fetch from 'node-fetch';
import { DateTime } from 'luxon';
import 'dotenv/config'

const JIRA_API = 'https://jira.news.apps.fox/rest/api/2/search?jql=filter%3D22719&fields=customfield_18703,customfield_18822,customfield_17902,customfield_18752,customfield_16811';
const POST_URL = 'https://us-central1-tv-schedule-app-nico.cloudfunctions.net/receiveSchedule';
const API_TOKEN = process.env.JIRA_API_TOKEN;
const email = process.env.JIRA_EMAIL;
const authString = Buffer.from(`${email}:${API_TOKEN}`).toString('base64');

(async () => {
  try {
    const res = await fetch(JIRA_API, {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${API_TOKEN}`,
        'Accept': 'application/json'
      }
    });

    if (!res.ok) throw new Error(`JIRA API error: ${res.status}`);
   
    const json = await res.json();
console.log("🪵 Raw JSON from JIRA:", JSON.stringify(json, null, 2));
    

    const items = json.issues.map(issue => {
      const fields = issue.fields;
      const show = fields.customfield_18703 || 'Untitled';
      const start = fields.customfield_18822;
      const end = fields.customfield_17902;
      const studio = fields.customfield_18752 || '';
      const ctrl = fields.customfield_16811 || '';

      // Convert times from UTC to ET
      const startET = DateTime.fromISO(start, { zone: 'utc' }).setZone('America/New_York').toISO();
      const endET = DateTime.fromISO(end, { zone: 'utc' }).setZone('America/New_York').toISO();

      return {
        title: `${studio}  ${show}`,
        start: startET,
        end: endET,
        controlRoom: ctrl
      };
    });

    console.log(`✅ Got ${items.length} events from JIRA`);

    const todayKey = DateTime.now().setZone('America/New_York').toFormat('yyyy-MM-dd');
    const postRes = await fetch(`${POST_URL}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(items)
    });

    if (!postRes.ok) {
      const msg = await postRes.text();
      throw new Error(`POST failed: ${postRes.status} – ${msg}`);
    }

    console.log(`📤 Posted ${items.length} events to Firestore for ${todayKey}`);
  } catch (err) {
    console.error('🔥 Error:', err.message);
  }
})();