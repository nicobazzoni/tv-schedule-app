import puppeteer from 'puppeteer';
import fetch from 'node-fetch';
import { DateTime } from 'luxon';

const today = DateTime.now().setZone('America/New_York').toFormat('yyyy-MM-dd');

const TARGET_URL = `https://jira.news.apps.fox/plugins/servlet/embedded-calendar?id=f5e8cadf-69d0-43b1-9e48-f8cae4ffc76c&view=listDay&date=${today}`;
const POST_URL = 'https://us-central1-tv-schedule-app-nico.cloudfunctions.net/receiveSchedule';

console.log(`🧠 Launching Puppeteer for ${today}...`);
const browser = await puppeteer.launch({ headless: 'new' });
const page = await browser.newPage();

try {
  console.log('🌍 Navigating to calendar URL...');
  await page.goto(TARGET_URL, {
    waitUntil: 'domcontentloaded', // faster and more reliable than networkidle on some intranet apps
    timeout: 60000,
  });

  console.log('⏳ Waiting for table OR no-events message...');
  await page.waitForSelector('table.fc-list-table, .fc-no-events', { timeout: 60000 });

  const tableExists = await page.$('table.fc-list-table') !== null;
  const noEvents = await page.$('.fc-no-events') !== null;

  console.log('📊 Table exists:', tableExists);
  console.log('🚫 No events message exists:', noEvents);

  if (!tableExists) {
    console.log('⚠️ No events to process today.');
    await browser.close();
    process.exit(0);
  }

  console.log('📸 Capturing screenshot...');
  await page.screenshot({ path: `listview-${today}.png`, fullPage: true });

  console.log('🔍 Scraping events...');
  const events = await page.evaluate((todayStr) => {
    const rows = Array.from(document.querySelectorAll('table.fc-list-table tbody tr'));
    const data = [];

    for (const row of rows) {
      const timeCell = row.querySelector('.fc-list-event-time');
      const titleCell = row.querySelector('.fc-list-event-title');
      if (!timeCell || !titleCell) continue;

      const timeText = timeCell.innerText.trim(); // "5:00am - 9:00am"
      const [startStr, endStr] = timeText.split(' - ').map(s => s.trim());
      let title = titleCell.innerText.trim();
      title = title.replace(/^REQ-\d+\s*-\s*/, ''); // strip REQ number

      const parseTime = (t) => {
        const match = t.match(/(\d{1,2}):(\d{2})\s*([ap]m)/i);
        if (!match) return null;
        let [_, hour, min, period] = match;
        hour = parseInt(hour, 10);
        if (period.toLowerCase() === 'pm' && hour !== 12) hour += 12;
        if (period.toLowerCase() === 'am' && hour === 12) hour = 0;
        const hStr = hour.toString().padStart(2, '0');
        return `${todayStr}T${hStr}:${min}:00`;
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

  console.log(`✅ Scraped ${events.length} filtered events:`);
  console.log(events.slice(0, 5));

  console.log('📤 Sending events to backend...');
  const response = await fetch(POST_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(events),
  });

  if (response.ok) {
    console.log('✅ Successfully sent to Firestore');
  } else {
    console.error(`❌ Firestore POST failed: ${response.status}`);
  }

} catch (err) {
  console.error('🔥 Error during scrape:', err);
  await page.screenshot({ path: `error-${today}.png`, fullPage: true });
} finally {
  await browser.close();
  console.log('🛑 Browser closed');
  console.log(`📅 Scraping completed for ${today}`);
}