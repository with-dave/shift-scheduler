import staff from "./data/staff";

export function generateShiftsForGrid(daysArray, coverage = 5, availability = {}) {
  const shifts = [];

  const managers = staff.filter(s => s.role === "Manager");
  const regularStaff = staff.filter(s => s.role !== "Manager");

  const weeklyCounts = {};
  let weekendRotationIndex = 0;

  function getWeekKey(date) {
    const year = date.getFullYear();
    const week = Math.ceil(
      ((date - new Date(year, 0, 1)) / 86400000 + new Date(year, 0, 1).getDay() + 1) / 7
    );
    return `${year}-W${week}`;
  }

  function isAvailable(person, date) {
    const days = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];
    const unavailable = availability[person.id] || [];

    // If unavailable all week, treat as fully available
    if (unavailable.length === 7) return true;

    const day = days[date.getDay()];
    return !unavailable.includes(day);
  }

  function canWork(person, date, requiredCount, peopleAvailable) {
    const weekKey = getWeekKey(date);

    if (!weeklyCounts[person.id]) weeklyCounts[person.id] = {};
    if (!weeklyCounts[person.id][weekKey]) weeklyCounts[person.id][weekKey] = 0;

    // HARD CAP: once someone hits 5 shifts, they cannot work again this week
    if (weeklyCounts[person.id][weekKey] >= 5) {
      return false;
    }

    // Availability
    if (!isAvailable(person, date)) return false;

    // Weekend rotation (soft)
    const isWeekend = date.getDay() === 0 || date.getDay() === 6;
    if (isWeekend) {
      const index = staff.findIndex(s => s.id === person.id);
      const rotated = index % staff.length === weekendRotationIndex % staff.length;

      // Only skip if enough people remain
      if (rotated && peopleAvailable > requiredCount) {
        return false;
      }
    }

    return true;
  }

  function pickLeastWorked(people, date) {
    const weekKey = getWeekKey(date);

    return people
      .map(p => ({
        person: p,
        count: weeklyCounts[p.id]?.[weekKey] || 0
      }))
      .sort((a, b) => a.count - b.count)[0].person;
  }

  daysArray.forEach(date => {
    if (!date) return;

    const dateStr = date.toISOString().slice(0, 10);
    const weekKey = getWeekKey(date);

    // Rotate weekend index at the start of each week
    if (date.getDay() === 1) {
      weekendRotationIndex++;
    }

    // --- MANAGER SELECTION ---
    let availableManagers = managers.filter(m =>
      canWork(m, date, 1, managers.length)
    );

    // If no manager passes filters, fallback to all managers EXCEPT those with 5 shifts
    if (availableManagers.length === 0) {
      availableManagers = managers.filter(m => weeklyCounts[m.id]?.[weekKey] < 5);
    }

    const manager = pickLeastWorked(availableManagers, date);

    // --- STAFF SELECTION ---
    const staffNeeded = coverage - 1; // 1 manager + X staff

    let availableStaff = regularStaff.filter(s =>
      canWork(s, date, staffNeeded, regularStaff.length)
    );

    // If too few staff pass filters, fallback to all staff EXCEPT those with 5 shifts
    if (availableStaff.length < staffNeeded) {
      availableStaff = regularStaff.filter(s => weeklyCounts[s.id]?.[weekKey] < 5);
    }

    const selectedStaff = [];

    for (let i = 0; i < staffNeeded; i++) {
      if (availableStaff.length === 0) break;

      const chosen = pickLeastWorked(availableStaff, date);
      selectedStaff.push(chosen);

      // Remove chosen from pool
      availableStaff = availableStaff.filter(s => s.id !== chosen.id);
    }

    const dayShifts = [manager, ...selectedStaff];

    // --- ADD SHIFTS ---
    dayShifts.forEach(person => {
      const exists = shifts.some(
        s => s.date === dateStr && String(s.staffId) === String(person.id)
      );

      if (!exists) {
        shifts.push({
          id: crypto.randomUUID(),
          date: dateStr,
          initials: person.name.slice(0, 2).toUpperCase(),
          staffId: person.id,
          role: person.role
        });

        // Increment weekly count
        if (!weeklyCounts[person.id][weekKey]) {
          weeklyCounts[person.id][weekKey] = 0;
        }
        weeklyCounts[person.id][weekKey]++;
      }
    });
  });

  return shifts;
}
