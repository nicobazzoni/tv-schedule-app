// ScheduleContainer.jsx
import React, { useState, useEffect } from 'react';
import NowNext from './NowNext';
import SpecialsToday from './SpecialsToday';

const POST_URL = 'https://us-central1-tv-schedule-app-nico.cloudfunctions.net/receiveSchedule';

export default function ScheduleContainer() {
  const [schedule, setSchedule] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    fetch(POST_URL)
      .then(res => {
        if (!res.ok) throw new Error('Failed to fetch');
        return res.json();
      })
      .then(data => {
        console.log('📺 Schedule fetched:', data);
        setSchedule(data);
        setLoading(false);
      })
      .catch(err => {
        console.error('❌ Fetch error:', err);
        setError(true);
        setLoading(false);
      });
  }, []);

  return (
    <div className="overflow-hidden min-h-screen items-center flex flex-col border-t-5 p-2 mb-2 border-b-5 border-red-700 mt-5 w-full "><img src="/fox news logo.png" className='max-w-3xl h-10' alt="Network Logo" />
      <NowNext schedule={schedule} loading={loading} error={error} />
      {/* <SpecialsToday schedule={schedule} loading={loading} error={error} /> */}
    </div>
  );
}