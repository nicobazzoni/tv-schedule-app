// ScheduleContainer.jsx
import React, { useState, useEffect } from 'react';
import NowNext from './NowNext';

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

  return <NowNext schedule={schedule} loading={loading} error={error} />;
}