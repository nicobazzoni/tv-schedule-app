import React, { useEffect, useState } from 'react';
import { DateTime } from 'luxon';

export default function NowNext() {
  const [schedule, setSchedule] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [now, setNow] = useState(DateTime.local().setZone('America/New_York'));

  useEffect(() => {
    const fetchSchedule = async () => {
      try {
        const res = await fetch('https://us-central1-tv-schedule-app-nico.cloudfunctions.net/getSchedule');
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

    fetchSchedule();
    const interval = setInterval(fetchSchedule, 300000); // refresh every 5 minutes
    const timeInterval = setInterval(() => {
      setNow(DateTime.local().setZone('America/New_York'));
    }, 1000);

    return () => {
      clearInterval(interval);
      clearInterval(timeInterval);
    };
  }, []);

  const currentDate = now.toFormat('cccc, LLLL d, yyyy');
  const formattedNow = now.toFormat('hh:mm:ss a');

  const validShows = schedule.filter(show =>
    show.title?.toLowerCase().includes('studio') && show.start && show.end
  );

  const uniqueMap = new Map();
  validShows.forEach(show => {
    const key = `${show.title}|${show.start}`;
    if (!uniqueMap.has(key)) uniqueMap.set(key, show);
  });

  const shows = Array.from(uniqueMap.values());

  const current = shows.filter(show => {
    const start = DateTime.fromISO(show.start, { zone: 'America/New_York' });
    const end = DateTime.fromISO(show.end, { zone: 'America/New_York' });
    return now >= start && now <= end;
  });

  const upcoming = shows
    .filter(show => DateTime.fromISO(show.start, { zone: 'America/New_York' }) > now)
    .sort((a, b) => DateTime.fromISO(a.start).ts - DateTime.fromISO(b.start).ts)
    .slice(0, 3);

  const lastAired = shows
    .filter(show => DateTime.fromISO(show.start, { zone: 'America/New_York' }) < now)
    .sort((a, b) => DateTime.fromISO(b.start).ts - DateTime.fromISO(a.start).ts)
    .slice(0, 3);

  const renderTitleRow = (title) => {
    const parts = title.replace(/^REQ-\d+\s*-\s*/, '').trim().split(' - ');
    return (
      <div className="flex justify-between items-center bg-white p-2 rounded-xl text-xl font-semibold">
        <span className="flex-1 text-left truncate">{parts[0]}</span>
        <span className="w-21 text-center">{parts[1] || ''}</span>
        <span className="w-20 text-right">{parts[2] || ''}</span>
      </div>
    );
  };

  if (loading) return <div className="p-6 text-lg">Loading…</div>;
  if (error) return <div className="p-6 text-red-600">Error loading schedule.</div>;
  if (!Array.isArray(schedule)) return <div className="p-6 text-gray-500">No schedule available.</div>;

  return (
    <div className="w-full px-4 mx-auto">
      <div className="flex w-full justify-between items-center mb-6 text-lg font-mono tracking-wide">
        <div>🗓️ {currentDate}</div>
        <div className="text-right">⏱️ {formattedNow}</div>
      </div>

      <div className="grid-cols-1 space-y-2 min-w-96 px-4">
        <div className="bg-red-400 rounded-2xl p-4 shadow">
          <h2 className="text-2xl font-bold text-red-900 mb-4">🎬 Now Airing</h2>
          {current.length > 0 ? current.map((show, index) => (
            <div key={index} className="mb-4">
              {renderTitleRow(show.title)}
              <p className="text-sm mt-1 font-bold text-gray-700">
                {DateTime.fromISO(show.start).toLocaleString(DateTime.TIME_SIMPLE)} –{' '}
                {DateTime.fromISO(show.end).toLocaleString(DateTime.TIME_SIMPLE)}
              </p>
            </div>
          )) : <p className="text-gray-700">No show airing right now.</p>}
        </div>

        <div className="bg-blue-100 rounded-2xl p-4 shadow">
          <h2 className="text-2xl font-bold text-blue-900 mb-4">📺 Upcoming Shows</h2>
          {upcoming.length > 0 ? upcoming.map((show, index) => (
            <div key={index} className="mb-4">
              {renderTitleRow(show.title)}
              <p className="text-sm mt-1 font-bold text-gray-700">
                {DateTime.fromISO(show.start).toLocaleString(DateTime.TIME_SIMPLE)}
              </p>
            </div>
          )) : <p className="text-gray-700">No upcoming shows.</p>}
        </div>

        <div className="bg-gray-100 rounded-2xl p-4 shadow">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">📼 Last Aired Shows</h2>
          {lastAired.length > 0 ? lastAired.map((show, index) => (
            <div key={index} className="mb-4">
              {renderTitleRow(show.title)}
              <p className="text-sm mt-1 font-bold text-gray-700">
                Started at {DateTime.fromISO(show.start).toLocaleString(DateTime.TIME_SIMPLE)}
              </p>
            </div>
          )) : <p className="text-gray-700">No past shows found.</p>}
        </div>
      </div>
    </div>
  );
}