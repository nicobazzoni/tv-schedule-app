import React, { useEffect, useState } from 'react';
import { DateTime } from 'luxon';

export default function NowNext() {
  const [schedule, setSchedule] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [now, setNow] = useState(DateTime.local().setZone('America/New_York'));
  const currentDate = DateTime.local().setZone('America/New_York').toFormat('cccc, DDD');
  // Example: "Saturday, May 31, 2025"
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
  
    const scheduleInterval = setInterval(fetchSchedule, 300000); // 5 min
    const timeInterval = setInterval(() => {
        setNow(DateTime.local().setZone('America/New_York'));
      }, 1000); // update every second
  
    return () => {
      clearInterval(scheduleInterval);
      clearInterval(timeInterval);
    };
  }, []);

  if (loading) return <div className="p-4">Loading…</div>;
  if (error) return <div className="p-4 text-red-600">Error loading schedule.</div>;
  if (!Array.isArray(schedule)) return <div className="p-4 text-gray-500">No schedule available.</div>;

  
  const formattedNow = now.toFormat('hh:mm:ss a');

  const validShows = schedule.filter(show =>
    show.title.toLowerCase().includes('studio') &&
    show.start && show.end
  );

  const uniqueMap = new Map();
  validShows.forEach(show => {
    const key = `${show.title}|${show.start}`;
    if (!uniqueMap.has(key)) {
      uniqueMap.set(key, show);
    }
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

  return (
    <div className="p-4 rounded-xl shadow  mb-4">
         <div className="text-sm text-gray-700 mb-4">🗓️ {currentDate}</div>

      <div className="text-sm font-bold text-gray-700 mb-4">🗓️ {formattedNow}</div>

      <div className="bg-red-100 rounded-2xl p-1 mb-2">
        <h2 className="text-lg bg-red-200 p-2 rounded-2xl font-bold mb-2">🎬 Now Airing</h2>
        {current.length > 0 ? (
          current.map((show, index) => (
            <div key={index} className="mb-2">
              <p className="text-xl bg-gray-50 rounded-xl p-1 font-semibold">
                {show.title.replace(/^REQ-\d+\s*-\s*/, '').trim()}
              </p>
              <p className="text-sm font-bold mt-1 text-gray-800">
                {DateTime.fromISO(show.start).toLocaleString(DateTime.TIME_SIMPLE)} –{' '}
                {DateTime.fromISO(show.end).toLocaleString(DateTime.TIME_SIMPLE)}
              </p>
            </div>
          ))
        ) : (
          <p className="text-gray-500">No show airing right now.</p>
        )}
      </div>

      <div className="bg-blue-100 rounded-2xl p-1 mb-2">
        <h2 className="text-lg font-bold bg-blue-200 rounded-2xl mt-4 p-1 mb-2">📺 Upcoming Shows</h2>
        {upcoming.length > 0 ? (
          upcoming.map((show, index) => (
            <div key={index} className="mb-2">
              <p className="text-xl bg-gray-50 rounded-xl p-1 font-semibold">
                {show.title.replace(/^REQ-\d+\s*-\s*/, '').trim()}
              </p>
              <p className="text-sm font-bold mt-1 text-gray-600">
                 {DateTime.fromISO(show.start).toLocaleString(DateTime.TIME_SIMPLE)}
              </p>
            </div>
          ))
        ) : (
          <p className="text-gray-500">No upcoming shows.</p>
        )}
      </div>

      <h2 className="text-lg font-bold p-1 rounded-2xl bg-gray-100 mb-2">📼 Last Aired Shows</h2>
      {lastAired.length > 0 ? (
        lastAired.map((show, index) => (
          <div key={index} className="mb-2 p-1 m-1 bg-gray-100 ">
            <p className="text-xl bg-gray-50 rounded-xl p-1 font-semibold">
              {show.title.replace(/^REQ-\d+\s*-\s*/, '').trim()}
            </p>
            <p className="text-sm text-gray-600">
              Started at {DateTime.fromISO(show.start).toLocaleString(DateTime.TIME_SIMPLE)}
            </p>
          </div>
        ))
      ) : (
        <p className="text-gray-500">No past shows found.</p>
      )}
    </div>
  );
}