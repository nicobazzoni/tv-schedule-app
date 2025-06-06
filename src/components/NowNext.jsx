import { DateTime } from 'luxon';
import React, { useEffect, useState } from 'react';
import '../index.css'

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
    <div className="h-screen w-full mb-3  mx-auto px-4 py-4 flex flex-col text-center text-white">
      <div className="bg-blue-700 p-2 mb-2">
        <h1 className="text-sm font-bold">{currentTime.toFormat('cccc, LLLL d, yyyy')}</h1>
        <p className="text-lg">{currentTime.toFormat('hh:mm:ss a')}</p>
      </div>
  
      {/* Now Playing */}
      <div className="flex-1 flex flex-col rounded-xl bg-red-600 p-1">
        <h2 className="text-xl font-bold mb-4">Now Playing</h2>
        <div className="flex-1 flex flex-col w-full gap-2 justify-around">
          {nowAiring.length > 0 ? (
            nowAiring.map((item, i) => (
              <div
                key={i}
                className="bg-white text-black shadow-lg  rounded-2xl px-10 py-10 border border-gray-300 w-full "
              >
                <p className="text-5xl font-semibold">{item.title}</p>
                <p className="text-xl text-gray-600 mt-1">
                  {item.start.toFormat('h:mm a')} – {item.end.toFormat('h:mm a')}
                </p>
              </div>
            ))
          ) : (
            <p className="text-white">No show airing right now.</p>
          )}
        </div>
      </div>
  
      {/* Up Next */}
      <div className="flex-1 flex flex-col mt-3 bg-blue-700 rounded-xl shadow-md shadow-black p-4 overflow-y-auto">
        <h2 className="text-3xl font-bold mb-1">Up Next</h2>
        <div className="flex-1 flex flex-col gap-6 justify-around">
          {upNext.length > 0 ? (
            upNext.map((item, i) => (
              <div
                key={i}
                  className="bg-white text-black shadow-lg rounded-2xl px-10 py-10 border border-gray-300 w-full "
              >
                <p className="text-5xl font-semibold">{item.title}</p>
                <p className="text-xl text-gray-600 mt-1">
                  {item.start.toFormat('h:mm a')} – {item.end.toFormat('h:mm a')}
                </p>
              </div>
            ))
          ) : (
            <p className="text-white">No upcoming shows.</p>
          )}
        </div>
      </div>
    </div>
  );
}