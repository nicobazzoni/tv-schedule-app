import { DateTime } from 'luxon';
import React, { useEffect, useState } from 'react';
import '../index.css'
import { getShowImageSrc } from '../helpers/showImages.js';

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
    const todayKey = DateTime.local().setZone('America/New_York').toFormat('yyyy-MM-dd');

    const res = await fetch(`https://us-central1-tv-schedule-app-nico.cloudfunctions.net/receiveSchedule?date=${todayKey}`);
    if (!res.ok) throw new Error('Failed to fetch');
    
    const doc = await res.json(); // ← Your Firestore doc
    const data = doc.events || [];
    
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
  
    console.log('Fetched schedule:', schedule); // ✅ this was wrong before
  
    const now = DateTime.local().setZone('America/New_York');
  
    const deduped = schedule.filter(
      (event, index, self) =>
        index === self.findIndex(
          e => e.title === event.title && e.start === event.start
        )
    );

    const blacklistWords = ['maintenance', 'req-', 'no studio'];

const cleaned = deduped.filter(item => {
  const title = item.title.toLowerCase();
  
  const matchesBlacklist = blacklistWords.some(word => title.includes(word));


  if (matchesBlacklist ) {
    console.log('❌ Filtered out:', title);
    return false; // exclude
  }

  return true; // keep
});
const parsed = cleaned.map(item => ({
  ...item,
  title: item.title.replace(/\s*\(network-\d+\)/i, ''), 
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
    <div className=" w-full min-h-screen mb-3  shadow-2xl rounded-md items-center  mx-auto px-4 py-4 flex flex-col text-center text-white">
      <div className="bg-blue-700 p-2  mb-2 shadow-2xl max-w-fit  rounded-md">
        <h1 className="text-sm font-bold">{currentTime.toFormat('cccc, LLLL d, yyyy')}</h1>
        <p className="text-lg">{currentTime.toFormat('h:mm:ss a')}</p>
      </div>
  
      {/* Now Playing */}
      <div className="flex-1 flex flex-col animate-float shadow-2xl debug w-full rounded-xl bg-red-600 p-4">
        <h2 className="text-3xl font-bold mb-1">Now Playing</h2>
        <div className="flex-1 flex  flex-col  w-full gap-2 justify-around">
          {nowAiring.length > 0 ? (
            nowAiring.map((item, i) => (
              <div
              key={i}
className="bg-white text-black shadow-lg min-h-[260px] rounded-2xl p-6 border border-gray-300 w-full flex items-center gap-4"
            >
              <img
                src={getShowImageSrc(item.title)}
                alt={item.title}
                onError={(e) => {
                  e.target.onerror = null;
                  e.target.src = getShowImageSrc(""); // fallback to default
                }}
                className="w-28 h-28 object-contain rounded-md flex-shrink-0"
              />
            
            <div className="flex-1 flex flex-col items-center text-center">
                <p className="text-4xl font-bold">{item.title}</p>
                <p className="text-xl text-gray-500 mt-1">{item.controlRoom}</p>
                <p className="text-4xl text-gray-600 mt-2">
                  {item.start.toFormat('h:mm a')} – {item.end.toFormat('h:mm a')}
                </p>
              </div>
            </div>
            ))
          ) : (
            <p className="text-white">No show airing right now.</p>
          )}
        </div>
      </div>
  
      {/* Up Next */}
      <div className="flex-1 flex flex-col mt-3 bg-blue-700  w-full rounded-xl shadow-md shadow-black p-4 overflow-y-auto">
        <h2 className="text-3xl font-bold mb-1">Up Next</h2>
        <div className="flex-1 flex flex-col gap-6 justify-around">
        {upNext.length > 0 ? (
  upNext.map((item, i) => (
    <div
      key={i}
className="bg-white text-black shadow-lg min-h-[260px] rounded-2xl p-6 border border-gray-300 w-full flex items-center gap-4"
    >
      <img
        src={getShowImageSrc(item.title)}
        alt={item.title}
        onError={(e) => {
          e.target.onerror = null;
          e.target.src = getShowImageSrc(""); // fallback
        }}
        className="w-28 h-28 object-contain rounded-md flex-shrink-0"
      />
     <div className="flex-1 flex flex-col items-center text-center">
     <p className="text-4xl font-bold">{item.title}</p>
                <p className="text-xl text-gray-500 mt-1">{item.controlRoom}</p>
                <p className="text-4xl text-gray-600 mt-2">
          {item.start.toFormat('h:mm a')} – {item.end.toFormat('h:mm a')}
        </p>
      </div>
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