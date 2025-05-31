import React from 'react';
import { DateTime } from 'luxon';

export default function NowNext({ schedule, loading, error }) {
  if (loading) return <div className="p-4">Loading…</div>;
  if (error) return <div className="p-4 text-red-600">Error loading schedule.</div>;
  if (!Array.isArray(schedule)) return <div className="p-4 text-gray-500">No schedule available.</div>;

  const now = DateTime.local().setZone('America/New_York');
  const formattedNow = now.toLocaleString(DateTime.DATETIME_SHORT);

  // Filter and de-duplicate by title + start time
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

  // Current shows
  const current = shows.filter(show => {
    const start = DateTime.fromISO(show.start, { zone: 'America/New_York' });
    const end = DateTime.fromISO(show.end, { zone: 'America/New_York' });
    return now >= start && now <= end;
  });

  // Upcoming
  const upcoming = shows
    .filter(show => DateTime.fromISO(show.start, { zone: 'America/New_York' }) > now)
    .sort((a, b) => DateTime.fromISO(a.start).ts - DateTime.fromISO(b.start).ts)
    .slice(0, 3);

  // Last aired
  const lastAired = shows
    .filter(show => DateTime.fromISO(show.start, { zone: 'America/New_York' }) < now)
    .sort((a, b) => DateTime.fromISO(b.start).ts - DateTime.fromISO(a.start).ts)
    .slice(0, 3);

  return (
    
    <div className="p-4 rounded-xl shadow mb-4">
        <div className="text-sm text-gray-700 mb-4">
  🗓️ {formattedNow}
   </div>
        <div className="bg-red-100">
            
      <h2 className="text-lg font-bold mb-2">🎬 Now Airing</h2>
      {current.length > 0 ? (
        current.map((show, index) => (
          <div key={index} className="mb-2">
          
            <p className="text-xl bg-gray-50 font-semibold">  {show.title.replace(/^REQ-\d+\s*-\s*/, '').trim()}</p>
            
            <p className="text-sm text-gray-600">
              {DateTime.fromISO(show.start).toLocaleString(DateTime.TIME_SIMPLE)} –{' '}
              {DateTime.fromISO(show.end).toLocaleString(DateTime.TIME_SIMPLE)}
            </p>
            
          </div>
          
          
        ))
        
      ) : (
        <p className="text-gray-500">No show airing right now.</p>
      )}
      </div>
      <div className='bg-blue-100'>

      <h2 className="text-lg font-bold mt-4 mb-2">📺 Upcoming Shows</h2>
      {upcoming.length > 0 ? (
        upcoming.map((show, index) => (
          <div key={index} className="mb-2">
            <p className="text-xl bg-gray-50 font-semibold">  {show.title.replace(/^REQ-\d+\s*-\s*/, '').trim()}</p>
            <p className="text-sm text-gray-600">
              Starts at {DateTime.fromISO(show.start).toLocaleString(DateTime.TIME_SIMPLE)}
            </p>
          </div>
        ))
      ) : (
        <p className="text-gray-500">No upcoming shows.</p>
      )}
      </div>

      <h2 className="text-lg font-bold mt-4 mb-2">📼 Last Aired Shows</h2>
      {lastAired.length > 0 ? (
        lastAired.map((show, index) => (
          <div key={index} className="mb-2">
            <p className="text-xl bg-gray-50 font-semibold">  {show.title.replace(/^REQ-\d+\s*-\s*/, '').trim()}</p>
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