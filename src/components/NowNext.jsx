import { DateTime } from 'luxon';
import React, { useEffect, useState } from 'react';

export default function NowNext() {
  const [schedule, setSchedule] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [nowAiring, setNowAiring] = useState([]);
  const [upNext, setUpNext] = useState([]);
  const [currentTime, setCurrentTime] = useState(DateTime.local().setZone('America/New_York'));

useEffect(() => {
  const interval = setInterval(() => {
    setCurrentTime(DateTime.local().setZone('America/New_York'));
  }, 1000); // update every second

  return () => clearInterval(interval);
}, []);

  const fetchSchedule = async () => {
    try {
      setLoading(true);
      const res = await fetch('https://us-central1-tv-schedule-app-nico.cloudfunctions.net/receiveSchedule');
      if (!res.ok) throw new Error('Failed to fetch');
      const data = await res.json();
      setSchedule(data);
      setError(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSchedule();
    const interval = setInterval(fetchSchedule, 5 * 60 * 1000); // every 5 minutes
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (!schedule || !schedule.length) return;

    const now = DateTime.local().setZone('America/New_York');

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
  if (error) return <p className="text-red-600 text-lg">Error: {error}</p>;

  return (
<div className="px-4 py-6 space-y-6 w-full max-w-4xl mx-auto flex border-blue-700 border-22 flex-col items-center text-center">
<div className="text-white bg-blue-700 p-2 mb-4">
      <h1 className="text-sm text-center font-bold">{currentTime.toFormat('cccc, LLLL d, yyyy')}</h1>
      <p className="text-lg">{currentTime.toFormat('hh:mm:ss a')}</p>
    </div>
      <div className='bg-red-600 p-2 mb-2 '>
        <h2 className="text-2xl font-semibold text-white mb-2"> Now Playing</h2>
        {nowAiring.length > 0 ? (
          <div className="grid gap-2">
            {nowAiring.map((item, i) => (
              <div key={i} className="bg-white shadow-xl rounded-xl p-4 border border-gray-200">
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

      <div className='bg-whitesmoke'>
        <h2 className="text-md font-semibold text-black mb-4"> Up Next</h2>
        {upNext.length > 0 ? (
          <div className="grid gap-2 bg-blue-500 p-1">
            {upNext.map((item, i) => (
              <div key={i} className="shadow-xl bg-white rounded-xl p-4 border  border-gray-200">
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