

/**
 * Returns the start of the week (Monday) for a given date.
 * @param date - The input date.
 * @returns A new Date object set to the preceding Monday at midnight.
 */
export const getStartOfWeek = (date: Date): Date => {
    const d = new Date(date);
    const day = d.getDay(); // 0 for Sunday, 1 for Monday, etc.
    // Calculate difference to get to Monday.
    // If today is Sunday (0), we want to go back 6 days.
    // If today is Monday (1), we want to go back 0 days.
    const diff = (day + 6) % 7;
    d.setDate(d.getDate() - diff);
    d.setHours(0, 0, 0, 0);
    return d;
};


/**
 * Returns an array of weeks for a given month.
 * Each week starts on a Monday and ends on a Sunday.
 * @param year - The full year (e.g., 2024).
 * @param month - The month index (0-11).
 * @returns An array of objects, each with a `start` and `end` Date object.
 */
export const getWeeksInMonth = (year: number, month: number): { start: Date; end: Date }[] => {
  const weeks = [];
  const firstDayOfMonth = new Date(year, month, 1);
  let date = getStartOfWeek(firstDayOfMonth);

  // Iterate through the weeks of the month.
  while (date.getMonth() <= month && date.getFullYear() <= year) {
    const startDate = new Date(date);
    // startDate is already at midnight because getStartOfWeek sets it.

    const endDate = new Date(startDate);
    endDate.setDate(startDate.getDate() + 6);
    endDate.setHours(23, 59, 59, 999);
    
    // Only add weeks that have at least one day in the target month
    if (startDate.getMonth() === month || endDate.getMonth() === month) {
       weeks.push({ start: startDate, end: endDate });
    }

    date.setDate(date.getDate() + 7);

    // Break if we've moved into the next year completely
    if(date.getFullYear() > year) break;
  }
  
  // Special case for December to not loop into the next year's January weeks
  if (month === 11) {
    const finalWeek = weeks[weeks.length - 1];
    if (finalWeek && finalWeek.start.getFullYear() > year) {
        return weeks.slice(0, weeks.length - 1);
    }
  }

  return weeks;
};

/**
 * Formats a date range into a readable string like "July 29 - Aug 4".
 * @param start - The start date of the range.
 * @param end - The end date of the range.
 * @returns A formatted string.
 */
export const formatDateRange = (start: Date, end: Date): string => {
  const startMonth = start.toLocaleDateString('en-US', { month: 'short' });
  const endMonth = end.toLocaleDateString('en-US', { month: 'short' });
  const startDay = start.getDate();
  const endDay = end.getDate();

  if (startMonth === endMonth) {
    return `${startMonth} ${startDay} - ${endDay}`;
  } else {
    return `${startMonth} ${startDay} - ${endMonth} ${endDay}`;
  }
};

/**
 * Converts a Date object to a 'YYYY-MM-DD' string based on local timezone.
 * This avoids timezone conversion issues associated with `toISOString()`.
 * @param date - The input date.
 * @returns A string in 'YYYY-MM-DD' format.
 */
export const toLocalDateString = (date: Date): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};