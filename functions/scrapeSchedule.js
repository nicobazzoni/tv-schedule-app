import puppeteer from 'puppeteer-core';
import chromium from 'chrome-aws-lambda';
import admin from 'firebase-admin';
import { DateTime } from 'luxon';

const TARGET_URL = `https://jira.news.apps.fox/plugins/servlet/embedded-calendar?id=f5e8cadf-69d0-43b1-9e48-f8cae4ffc76c&view=listDay&date=${DateTime.now().setZone('America/New_York').toFormat('yyyy-MM-dd')}`;

if (!admin.apps.length) {
  admin.initializeApp();
}
const db = admin.firestore();

export const scrapeSchedule = async (req, res) => {
  let browser;
  try {
    browser = await puppeteer.launch({
      args: chromium.args,
      executablePath: await chromium.executablePath,
      headless: true,
    });

    const page = await browser.newPage();

    // Set cookies if needed (optional)
    // await page.setCookie({
    //   name: 'YOUR_COOKIE_NAME',
    //   value: 'YOUR_COOKIE_VALUE',
    //   domain: 'jira.news.apps.fox',
    //   path: '/',
    //   secure: true,
    //   httpOnly: true
    // });

    await page.goto(TARGET_URL, { waitUntil: 'networkidle2', timeout: 60000 });

    // Wait for actual content, not just selector, with debugging info on failure
    try {
      await page.waitForFunction(() => {
        return document.querySelectorAll('table.fc-list-table tbody tr').length > 0;
      }, { timeout: 60000 });
    } catch (e) {
      const html = await page.content();
      console.error('Failed to find table rows. HTML snapshot:', html.slice(0, 2000));
      await page.screenshot({ path: '/tmp/scrape-error.png', fullPage: true });
      throw new Error('Timeout waiting for table.fc-list-table tbody tr');
    }

    const events = await page.$$eval('table.fc-list-table tbody tr', rows => {
      return rows.map(row => {
        const time = row.querySelector('td.fc-list-event-time')?.textContent.trim();
        const title = row.querySelector('td.fc-list-event-title')?.textContent.trim();
        return { time, title };
      });
    });

    const today = DateTime.now().setZone('America/New_York').toFormat('yyyy-MM-dd');
    await db.collection('schedule').doc(today).set({ events });

    res.status(200).json({ success: true, count: events.length });

  } catch (err) {
    console.error('Scrape failed:', err);

    // Optional: capture HTML if selector fails
    if (browser) {
      const pages = await browser.pages();
      if (pages[0]) {
        const html = await pages[0].content();
        console.error('HTML Snapshot:', html.slice(0, 2000)); // limit size
      }
    }

    res.status(500).json({ error: 'Scrape failed', details: err.message });
  } finally {
    if (browser) await browser.close();
  }
};