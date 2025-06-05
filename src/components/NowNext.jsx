import { DateTime } from 'luxon';
import React, { useEffect, useState } from 'react';

export default function NowNext({ schedule, loading, error }) {
  const [nowAiring, setNowAiring] = useState([]);
  const [upNext, setUpNext] = useState([]);

  useEffect(() => {
    if (!schedule || !schedule.length) return;
  
    const now = DateTime.local().setZone('America/New_York');
  
    // Deduplicate before parsing
    const deduped = schedule.filter(
      (event, index, self) =>
        index === self.findIndex(
          e => e.title === event.title && e.start === event.start
        )
    );
  
    const parsed = deduped.map(item => ({
      ...item,
      start: DateTime.fromISO(item.start, { zone: 'America/New_York' }),
      end: DateTime.fromISO(item.end, { zone: 'America/New_York' }),
    }));
  
    const airing = parsed.filter(item => now >= item.start && now <= item.end);
    const upcoming = parsed
      .filter(item => item.start > now)
      .sort((a, b) => a.start - b.start)
      .slice(0, 3);
  
    setNowAiring(airing);
    setUpNext(upcoming);
  }, [schedule]);

  if (loading) return <p className="text-white text-lg">Loading...</p>;
  if (error) return <p className="text-red-500 text-lg">Error fetching schedule.</p>;

  return (
    <div className="p-4 space-y-6">
      <div className='bg-red-400 p-1'>
        <h2 className="text-2xl font-semibold text-center text-white mb-2">📺 Now Playing</h2>
        {nowAiring.length > 0 ? (
          <div className="grid gap-2">
            {nowAiring.map((item, i) => (
              <div key={i} className="bg-white shadow rounded-xl p-4 border border-gray-200">
                <p className="text-lg font-medium">{item.title}</p>
                <p className="text-sm text-gray-600">
                  {item.start.toFormat('h:mm a')} - {item.end.toFormat('h:mm a')}
                </p>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-500">No show airing right now.</p>
        )}
      </div>

      <div>
        <h2 className="text-2xl text-center font-semibold text-green-600 mb-2">🔜 Up Next</h2>
        {upNext.length > 0 ? (
          <div className="grid gap-2">
            {upNext.map((item, i) => (
              <div key={i} className="bg-white shadow rounded-xl p-4 border border-gray-200">
                <p className="text-lg font-medium">{item.title}</p>
                <p className="text-sm text-gray-600">
                  {item.start.toFormat('h:mm a')} - {item.end.toFormat('h:mm a')}
                </p>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-500">No upcoming show found.</p>
        )}
      </div>
    </div>
  );
}