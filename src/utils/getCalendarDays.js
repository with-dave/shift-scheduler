export function getCalendarDays(year, month) {
  const firstDay = new Date(year, month, 1)
  const startDay = firstDay.getDay()
  const daysInMonth = new Date(year, month + 1, 0).getDate()

  const days = []

  // Days from previous month
  for (let i = 0; i < startDay; i++) {
    days.push({
      date: new Date(year, month, i - startDay + 1),
      currentMonth: false
    })
  }

  // Days in current month
  for (let i = 1; i <= daysInMonth; i++) {
    days.push({
      date: new Date(year, month, i),
      currentMonth: true
    })
  }

  // Fill remaining cells to reach 42 (6 weeks)
  while (days.length < 42) {
    const nextDate = new Date(year, month, days.length - startDay + 1)
    days.push({
      date: nextDate,
      currentMonth: false
    })
  }

  return days
}