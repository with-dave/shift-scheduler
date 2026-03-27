import React from 'react';

function ShiftCard({ day, employee, role }) {
  return (
    <div className="border p-2 mb-2 rounded">
      <strong>{day}</strong>: {employee} — {role}
    </div>
  );
}

export default ShiftCard;
