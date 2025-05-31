import React, { useEffect, useState } from 'react';
import { DateTime } from 'luxon';

export default function SpecialsToday() {
  const [schedule, setSchedule] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchSchedule = async () => {
    try {
      const res = await fetch('https://us-central1-tv-schedule-app-nico.cloudfunctions.net/receiveSchedule');
      if (!res.ok) throw new Error('Failed to fetch schedule');
      const data = await res.json();
      setSchedule(data);
      setError(null);
    } catch (err) {
      console.error(err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSchedule();
    const interval = setInterval(fetchSchedule, 300000); // Every 5 min
    return () => clearInterval(interval);
  }, []);

  if (loading) return <div className="p-4">Loading…</div>;
  if (error) return <div className="p-4 text-red-600">Error loading specials.</div>;
  if (!Array.isArray(schedule)) return <div className="p-4 text-gray-500">No schedule available.</div>;

  const today = DateTime.local().setZone('America/New_York').toISODate();

  const specials = schedule.filter(show => {
    const title = show.title.toLowerCase();
    const isSpecial = title.includes('special');
    const isLooksee = title.includes('looksee');
    const isToday = show.start.startsWith(today);
    return (isSpecial || isLooksee) && isToday;
  });

  if (specials.length === 0) {
    return <div className="p-4 text-gray-500">No specials or looksees today.</div>;
  }

  return (
    <div className="p-4 bg-yellow-100 rounded-xl mt-6 shadow">
      <h2 className="text-lg font-bold mb-3">✨ Specials & Looksees</h2>
      {specials.map((show, index) => (
        <div key={index} className="mb-2">
          <p className="text-xl bg-white font-semibold p-1 rounded">
            {show.title.replace(/^REQ-\d+\s*-\s*/, '').trim()}
          </p>
          <p className="text-sm text-gray-600">
            {DateTime.fromISO(show.start).toLocaleString(DateTime.TIME_SIMPLE)} –{' '}
            {DateTime.fromISO(show.end).toLocaleString(DateTime.TIME_SIMPLE)}
          </p>
        </div>
      ))}
    </div>
  );
}