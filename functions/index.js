import express from 'express';
import fs from 'fs';
import ical from 'ical';
import cors from 'cors';

const app = express();
const PORT = process.env.PORT || 8080;

app.use(cors()); // allow frontend access

app.get('/', (req, res) => {
  try {
    const data = fs.readFileSync('./calendar.ics', 'utf-8');
    const events = ical.parseICS(data);

    const formatted = Object.values(events)
      .filter(e => e.type === 'VEVENT')
      .map(e => ({
        title: e.summary,
        start: e.start,
        end: e.end,
        location: e.location || '',
        description: e.description || ''
      }));

    res.json(formatted);
  } catch (err) {
    console.error('Failed to read .ics:', err);
    res.status(500).json({ error: 'Failed to parse calendar file' });
  }
});

app.listen(PORT, () => {
  console.log(`📅 Calendar API running on port ${PORT}`);
});