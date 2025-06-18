import React, { useEffect, useState } from 'react';
import { DateTime } from 'luxon';

export default function SpecialsToday() {
  const [schedule, setSchedule] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchSchedule = async () => {
    try {
      const todayKey = DateTime.local().setZone('America/New_York').toFormat('yyyy-MM-dd');
      const res = await fetch(`https://us-central1-tv-schedule-app-nico.cloudfunctions.net/receiveSchedule?date=${todayKey}`);
      if (!res.ok) throw new Error('Failed to fetch schedule');
      const data = await res.json();
      setSchedule(data.events || []);
      console.log(data)
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
    const interval = setInterval(fetchSchedule, 300000); // every 5 min
    return () => clearInterval(interval);
  }, []);

  if (loading) return <div className="p-4 text-white">Loading…</div>;
  if (error) return <div className="p-4 text-red-600">Error: {error}</div>;
  if (!Array.isArray(schedule)) return <div className="p-4 text-gray-500">No schedule data.</div>;

  const today = DateTime.local().setZone('America/New_York').toISODate();

  const specials = schedule
    .filter(show => {
      const title = show.title?.toLowerCase() || '';
      const isSpecial = /special/i.test(title);
      const isLooksee = /looksee/i.test(title);
      const isToday = show.start && show.start.startsWith(today);
      return (isSpecial || isLooksee) && isToday;
    })
    .sort((a, b) => DateTime.fromISO(a.start) - DateTime.fromISO(b.start));

  if (specials.length === 0) {
    return <div className="p-4 text-gray-400">No specials or looksees today.</div>;
  }

  return (
    <div className="p-4 bg-yellow-100 rounded-xl mt-6 shadow max-w-3xl mx-auto">
      <h2 className="text-xl font-bold mb-4 text-gray-800">✨ Specials & Looksees</h2>
      <div className="space-y-4">
        {specials.map((show, index) => (
          <div key={index} className="bg-white p-4 rounded-lg shadow border border-gray-300">
            <p className="text-xl font-semibold text-black">
              {show.title.replace(/^REQ-\d+\s*-\s*/, '').trim()}
            </p>
            <p className="text-sm text-gray-600 mt-1">
              {DateTime.fromISO(show.start).toLocaleString(DateTime.TIME_SIMPLE)} –{' '}
              {DateTime.fromISO(show.end).toLocaleString(DateTime.TIME_SIMPLE)}
            </p>
            {(show.studio || show.controlRoom) && (
              <p className="text-sm text-gray-500 mt-1">
                {show.studio?.replace(/\(REM-\d+\)/, '').trim()} &nbsp;•&nbsp;
                {show.controlRoom?.replace(/\(REM-\d+\)/, '').trim()}
              </p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}