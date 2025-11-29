import { 
  format, 
  startOfWeek, 
  endOfWeek, 
  addDays, 
  addWeeks,
  subWeeks,
  isSameDay,
  parseISO,
  setHours,
  setMinutes,
} from 'date-fns';
import { formatInTimeZone, toZonedTime, fromZonedTime } from 'date-fns-tz';

// Get the current week's date range
export function getWeekRange(date: Date, timezone: string): { start: Date; end: Date } {
  const zonedDate = toZonedTime(date, timezone);
  const start = startOfWeek(zonedDate, { weekStartsOn: 0 }); // Sunday
  const end = endOfWeek(zonedDate, { weekStartsOn: 0 }); // Saturday
  return { start, end };
}

// Get array of days for the week
export function getWeekDays(date: Date, timezone: string): Date[] {
  const { start } = getWeekRange(date, timezone);
  return Array.from({ length: 7 }, (_, i) => addDays(start, i));
}

// Navigate weeks
export function getNextWeek(date: Date): Date {
  return addWeeks(date, 1);
}

export function getPreviousWeek(date: Date): Date {
  return subWeeks(date, 1);
}

// Format for display
export function formatDate(date: Date | string, formatStr: string, timezone: string): string {
  const d = typeof date === 'string' ? parseISO(date) : date;
  return formatInTimeZone(d, timezone, formatStr);
}

export function formatTimeSlot(startTime: string, endTime: string, timezone: string): string {
  const start = formatInTimeZone(parseISO(startTime), timezone, 'h:mm a');
  const end = formatInTimeZone(parseISO(endTime), timezone, 'h:mm a');
  return `${start} - ${end}`;
}

export function formatDayHeader(date: Date, timezone: string): { day: string; date: string } {
  return {
    day: formatInTimeZone(date, timezone, 'EEE'),
    date: formatInTimeZone(date, timezone, 'MMM d'),
  };
}

// Convert local time to UTC for storage
export function localToUTC(date: Date, timezone: string): Date {
  return fromZonedTime(date, timezone);
}

// Convert UTC to local time for display
export function utcToLocal(date: Date | string, timezone: string): Date {
  const d = typeof date === 'string' ? parseISO(date) : date;
  return toZonedTime(d, timezone);
}

// Create a date with specific hour and minute in a timezone
export function createDateWithTime(
  date: Date,
  hours: number,
  minutes: number,
  timezone: string
): Date {
  const zonedDate = toZonedTime(date, timezone);
  const withTime = setMinutes(setHours(zonedDate, hours), minutes);
  return fromZonedTime(withTime, timezone);
}

// Check if two dates are the same day in a timezone
export function isSameDayInTimezone(date1: Date | string, date2: Date, timezone: string): boolean {
  const d1 = typeof date1 === 'string' ? parseISO(date1) : date1;
  const zoned1 = toZonedTime(d1, timezone);
  const zoned2 = toZonedTime(date2, timezone);
  return isSameDay(zoned1, zoned2);
}

// Get hours array for calendar (6 AM to 10 PM)
export function getCalendarHours(): number[] {
  return Array.from({ length: 17 }, (_, i) => i + 6); // 6 AM to 10 PM
}

// Format hour for display
export function formatHour(hour: number): string {
  if (hour === 0) return '12 AM';
  if (hour === 12) return '12 PM';
  if (hour < 12) return `${hour} AM`;
  return `${hour - 12} PM`;
}

// Generate time options for select (in 15-minute increments)
export function getTimeOptions(): { value: string; label: string }[] {
  const options: { value: string; label: string }[] = [];
  for (let hour = 6; hour <= 22; hour++) {
    for (let minute = 0; minute < 60; minute += 15) {
      const value = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
      const label = formatHour(hour) + (minute > 0 ? `:${minute.toString().padStart(2, '0')}` : '');
      options.push({ value, label });
    }
  }
  return options;
}

// Parse time string (HH:MM) to hours and minutes
export function parseTimeString(time: string): { hours: number; minutes: number } {
  const [hours, minutes] = time.split(':').map(Number);
  return { hours, minutes };
}

// Common timezones
export const TIMEZONES = [
  { value: 'America/New_York', label: 'Eastern Time (ET)' },
  { value: 'America/Chicago', label: 'Central Time (CT)' },
  { value: 'America/Denver', label: 'Mountain Time (MT)' },
  { value: 'America/Los_Angeles', label: 'Pacific Time (PT)' },
  { value: 'America/Anchorage', label: 'Alaska Time (AKT)' },
  { value: 'Pacific/Honolulu', label: 'Hawaii Time (HST)' },
  { value: 'Europe/London', label: 'London (GMT/BST)' },
  { value: 'Europe/Paris', label: 'Paris (CET/CEST)' },
  { value: 'Europe/Berlin', label: 'Berlin (CET/CEST)' },
  { value: 'Asia/Tokyo', label: 'Tokyo (JST)' },
  { value: 'Asia/Shanghai', label: 'Shanghai (CST)' },
  { value: 'Australia/Sydney', label: 'Sydney (AEST/AEDT)' },
];
