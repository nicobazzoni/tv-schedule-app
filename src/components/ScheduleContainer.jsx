import React, { useState, useEffect } from 'react';
import NowNext from './NowNext';

export default function ScheduleContainer() {
  const [schedule, setSchedule] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  return (
    <div className="relative min-h-screen w-full ">
      {/* Animated gradient background */}
      <div className="fixed inset-0 z-0 bg-gradient-to-br from-slate-100 via-white to-blue-400 bg-[length:200%_200%] bg-[position:0%_20%] animate-gradient" />
      <div className="fixed inset-0 z-10 bg-white opacity-10 blur-lg animate-pulse" />

      {/* Foreground content */}
      <div className="relative z-20 overflow-hidden min-h-screen items-center flex flex-col border-t-5 p-2 mb-10 border-b-5 border-red-700 mt-5 w-full">
        <img src="/fox news logo.png" className="max-w-3xl h-10" alt="Network Logo" />
        <NowNext schedule={schedule} loading={loading} error={error} />
      </div>

   
    </div>
  );
}