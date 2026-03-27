import { useState } from "react";
import { generateShiftsForGrid } from "../generateShifts";
import staff from "../data/staff";

export default function CalendarMonth() {
  const today = new Date();

  const [currentMonth, setCurrentMonth] = useState(today.getMonth());
  const [currentYear, setCurrentYear] = useState(today.getFullYear());

  // NEW: coverage setting (how many staff per day)
  const [coverage, setCoverage] = useState(5);

  // NEW: editable staff availability
  const [availability, setAvailability] = useState(
    staff.reduce((acc, s) => {
      acc[s.id] = s.unavailable || [];
      return acc;
    }, {})
  );

  // Store shifts as an array of objects
  const [shifts, setShifts] = useState([]);

  const monthNames = [
    "January","February","March","April","May","June",
    "July","August","September","October","November","December"
  ];

  const firstDay = new Date(currentYear, currentMonth, 1).getDay();
  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();

  const prevMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear(currentYear - 1);
    } else {
      setCurrentMonth(currentMonth - 1);
    }
  };

  const nextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear(currentYear + 1);
    } else {
      setCurrentMonth(currentMonth + 1);
    }
  };

  const isToday = (date) => {
    if (!date) return false;

    return (
      date.getDate() === today.getDate() &&
      date.getMonth() === today.getMonth() &&
      date.getFullYear() === today.getFullYear()
    );
  };

  // Build array of Date objects for the grid
  const daysArray = [];
  for (let i = 0; i < firstDay; i++) daysArray.push(null);

  for (let d = 1; d <= daysInMonth; d++) {
    daysArray.push(new Date(currentYear, currentMonth, d));
  }

  // Generate shifts for the whole month
  const handleGenerateShifts = () => {
    const newShifts = generateShiftsForGrid(daysArray, coverage, availability);
    setShifts(newShifts);
  };

  // --- WEEKLY TOTALS LOGIC ---
  function getWeekKey(date) {
    const year = date.getFullYear();
    const week = Math.ceil(
      ((date - new Date(year, 0, 1)) / 86400000 + new Date(year, 0, 1).getDay() + 1) / 7
    );
    return `${year}-W${week}`;
  }

  const weeklyTotals = {};

  shifts.forEach(shift => {
    const date = new Date(shift.date);
    const weekKey = getWeekKey(date);

    if (!weeklyTotals[weekKey]) weeklyTotals[weekKey] = {};
    if (!weeklyTotals[weekKey][shift.staffId]) {
      weeklyTotals[weekKey][shift.staffId] = 0;
    }

    weeklyTotals[weekKey][shift.staffId]++;
  });

  // --- FAIRNESS SCORE ---
  function fairnessScore(totals) {
    const counts = Object.values(totals);
    const avg = counts.reduce((a,b) => a+b, 0) / counts.length;
    const variance = counts.reduce((a,b) => a + Math.pow(b - avg, 2), 0) / counts.length;
    return Math.max(0, 100 - variance * 20);
  }

  const daysOfWeek = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];

  const toggleAvailability = (staffId, day) => {
    setAvailability(prev => {
      const current = prev[staffId] || [];
      const updated = current.includes(day)
        ? current.filter(d => d !== day)
        : [...current, day];

      return { ...prev, [staffId]: updated };
    });
  };

  return (
    <div
      className="calendar-container"
      style={{ width: "100%", maxWidth: "900px", margin: "20px auto" }}
    >
      {/* Month navigation */}
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "10px" }}>
        <button onClick={prevMonth}>◀</button>
        <h2>{monthNames[currentMonth]} {currentYear}</h2>
        <button onClick={nextMonth}>▶</button>
      </div>

      {/* Coverage selector */}
      <div style={{ marginBottom: "10px" }}>
        <label>Staff per day: </label>
        <select value={coverage} onChange={(e) => setCoverage(Number(e.target.value))}>
          <option value={3}>3</option>
          <option value={4}>4</option>
          <option value={5}>5</option>
          <option value={6}>6</option>
        </select>
      </div>

      {/* Generate button */}
      <button onClick={handleGenerateShifts} style={{ marginBottom: "10px" }}>
        Generate Shifts
      </button>

      {/* Calendar grid */}
      <div className="calendar-grid">
        {["Sun","Mon","Tue","Wed","Thu","Fri","Sat"].map((d) => (
          <div key={d} className="calendar-day-label">{d}</div>
        ))}

        {daysArray.map((date, index) => {
          const weekend = date && (date.getDay() === 0 || date.getDay() === 6);

          const dateStr = date ? date.toISOString().slice(0, 10) : null;

          const dayShifts = date
            ? shifts.filter(s => s.date === dateStr)
            : [];

          return (
            <div
              key={index}
              className={[
                "calendar-cell",
                date ? "" : "faded",
                isToday(date) ? "today" : "",
                weekend ? "weekend" : ""
              ].join(" ")}
            >
              <div className="date-number">
                {date ? date.getDate() : ""}
              </div>

              <div className="shift-badges">
                {dayShifts.map((shift, i) => (
                  <span key={shift.id} className="shift-badge">
                    {shift.initials}
                    {i < dayShifts.length - 1 && (
                      <span className="separator"> • </span>
                    )}
                  </span>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {/* WEEKLY TOTALS PANEL */}
      <div style={{ marginTop: "25px" }}>
        <h3>Weekly Shift Totals</h3>

        {Object.entries(weeklyTotals).map(([weekKey, totals]) => (
          <div
            key={weekKey}
            style={{
              marginBottom: "12px",
              padding: "12px",
              border: "1px solid #ccc",
              borderRadius: "6px",
              background: "#fafafa"
            }}
          >
            <strong>{weekKey}</strong> — Fairness: {fairnessScore(totals).toFixed(0)} / 100

            <ul style={{ listStyle: "none", paddingLeft: 0, marginTop: "8px" }}>
              {Object.entries(totals).map(([staffId, count]) => {
                const person = staff.find(s => String(s.id) === String(staffId));
                return (
                  <li
                    key={staffId}
                    style={{
                      color:
                        count === 5 ? "green" :
                        count === 4 ? "orange" :
                        "red"
                    }}
                  >
                    {person?.name || "Unknown"} — {count} shifts
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </div>

      {/* STAFF AVAILABILITY EDITOR */}
      <div style={{ marginTop: "30px" }}>
        <h3>Staff Availability</h3>
        <p>Click to toggle days off.</p>

        {staff.map(person => (
          <div
            key={person.id}
            style={{
              marginBottom: "10px",
              padding: "10px",
              border: "1px solid #ddd",
              borderRadius: "6px"
            }}
          >
            <strong>{person.name}</strong>

            <div style={{ marginTop: "6px", display: "flex", gap: "6px" }}>
              {daysOfWeek.map(day => (
                <button
                  key={day}
                  onClick={() => toggleAvailability(person.id, day)}
                  style={{
                    padding: "4px 8px",
                    borderRadius: "4px",
                    border: "1px solid #ccc",
                    background: availability[person.id]?.includes(day)
                      ? "#ffdddd"
                      : "#ddffdd"
                  }}
                >
                  {day}
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
