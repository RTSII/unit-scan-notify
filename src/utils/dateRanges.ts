export function getThisWeekRange(): { start: Date; end: Date } {
  const now = new Date();
  const end = new Date(now);
  end.setHours(23, 59, 59, 999); // End of today

  const start = new Date(now);
  start.setDate(now.getDate() - 6); // Past 6 days + today = 7 days total
  start.setHours(0, 0, 0, 0); // Start of that day

  return { start, end };
}

export function getThisMonthRange(): { start: Date; end: Date } {
  const now = new Date();
  const end = new Date(now);
  end.setHours(23, 59, 59, 999); // End of today

  const start = new Date(now.getFullYear(), now.getMonth(), 1);
  start.setHours(0, 0, 0, 0); // Start of month

  return { start, end };
}

export function isDateInRange(date: string | Date | null, range: { start: Date; end: Date }): boolean {
  if (!date) return false;
  const testDate = new Date(date);
  if (isNaN(testDate.getTime())) return false;
  return testDate >= range.start && testDate <= range.end;
}