export const normalizeDate = (date: Date | string | null): Date => {
  if (!date) return new Date(0);
  const d = new Date(date);
  return isNaN(d.getTime()) ? new Date(0) : d;
};

export const isSameDay = (date1: Date, date2: Date): boolean => {
  return (
    date1.getFullYear() === date2.getFullYear() &&
    date1.getMonth() === date2.getMonth() &&
    date1.getDate() === date2.getDate()
  );
};

export const isWithinLastNDays = (date: Date, n: number, fromDate: Date = new Date()): boolean => {
  const startDate = new Date(fromDate);
  startDate.setDate(startDate.getDate() - n);
  startDate.setHours(0, 0, 0, 0);
  
  const endDate = new Date(fromDate);
  endDate.setHours(23, 59, 59, 999);
  
  const testDate = new Date(date);
  return testDate >= startDate && testDate <= endDate;
};