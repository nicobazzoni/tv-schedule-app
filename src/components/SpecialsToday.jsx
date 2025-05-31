import React from 'react';

export default function SpecialsToday({ schedule, loading, error }) {
  if (loading) return <div className="p-4">Loading specials…</div>;
  if (error) return <div className="p-4 text-red-600">Error fetching schedule.</div>;

  const specials = schedule.filter(show =>
    show.title.toLowerCase().includes('special')
  );

  return (
    <div className="bg-yellow-100 p-4 rounded shadow mt-4">
      <h2 className="text-xl font-bold mb-2">Specials Today</h2>
      {specials.length ? (
        <ul className="space-y-2">
          {specials.map((show, idx) => (
            <li key={idx}>
              <strong>{show.title}</strong> at {new Date(show.start).toLocaleTimeString()}
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-gray-500">No specials scheduled for today.</p>
      )}
    </div>
  );
}