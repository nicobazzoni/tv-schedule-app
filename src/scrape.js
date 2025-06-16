// scrape.js
import fetch from 'node-fetch';
import { DateTime } from 'luxon';
import dotenv from 'dotenv';

dotenv.config();

const API_TOKEN = process.env.JIRA_API_TOKEN;
const email = process.env.JIRA_EMAIL;

const JIRA_API = 'https://jira.news.apps.fox/rest/api/2/search?jql=filter%3D22719&fields=customfield_18703,customfield_18822,customfield_17902,customfield_18751,customfield_16811';

const scrape = async () => {
  const res = await fetch(JIRA_API, {
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${API_TOKEN}`,
      'Accept': 'application/json',
    },
  });

  const json = await res.json();
  const issues = json.issues || [];

  const items = issues.map((issue) => {
    const fields = issue.fields;

    const show = Array.isArray(fields.customfield_18703)
      ? fields.customfield_18703[0]
      : fields.customfield_18703;

    const studio = Array.isArray(fields.customfield_18751)
      ? fields.customfield_18751[0]
      : fields.customfield_18751;

    const ctrl = Array.isArray(fields.customfield_16811)
      ? fields.customfield_16811[0]
      : fields.customfield_16811;

    const start = DateTime.fromISO(fields.customfield_18822, { zone: 'utc' }).setZone('America/New_York').toISO();
    const end = DateTime.fromISO(fields.customfield_17902, { zone: 'utc' }).setZone('America/New_York').toISO();

    return {
      title: show?.replace(/\s*\(.*?\)/g, '').trim(),
      studio: studio?.replace(/\s*\(.*?\)/g, '').trim(),
      controlRoom: ctrl?.replace(/\s*\(.*?\)/g, '').trim(),
      start,
      end,
    };
  });

  console.log(`🎯 Parsed ${items.length} items:`);
  console.dir(items, { depth: null });
};

scrape().catch(console.error);