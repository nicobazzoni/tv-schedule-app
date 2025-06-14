// ScheduleContainer.jsx
import React, { useState, useEffect } from 'react';
import NowNext from './NowNext';




export default function ScheduleContainer() {
  const [schedule, setSchedule] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

 

  return (
    <div className="overflow-hidden min-h-screen items-center flex flex-col border-t-5 p-2 mb-10 border-b-5 border-red-700 mt-5 w-full "><img src="/fox news logo.png" className='max-w-3xl h-10' alt="Network Logo" />
      <NowNext schedule={schedule} loading={loading} error={error} />
  
    </div>
  );
}