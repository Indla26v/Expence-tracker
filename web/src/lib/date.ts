import { formatInTimeZone, toDate } from "date-fns-tz";

export const IST_TIMEZONE = "Asia/Kolkata";
export const IST_OFFSET_MS = 19800000; // 5 hours 30 mins in ms

/** Current date in IST */
export function getNowIST() {
  return toDate(new Date(), { timeZone: IST_TIMEZONE });
}

/** Formats a UTC date object directly into an IST string representation */
export function formatIST(date: Date | string | number, fmt: string) {
  return formatInTimeZone(date, IST_TIMEZONE, fmt);
}

/** Parses a local HTML datetime-local string (like "2024-10-15T14:30") as IST and returns the actual UTC Date. */
export function parseIST(localString: string) {
  return toDate(localString, { timeZone: IST_TIMEZONE });
}

/** Returns a synthetic Date where its UTC methods (getUTCFullYear, etc.) return IST values */
export function toIST(date: Date) {
  return new Date(date.getTime() + IST_OFFSET_MS);
}

/** Given a synthetic IST Date (where UTC methods return IST), return the real absolute UTC Date */
export function fromIST(istSyntheticDate: Date) {
  return new Date(istSyntheticDate.getTime() - IST_OFFSET_MS);
}

export function startOfDayIST(date: Date) {
  const ist = toIST(date);
  return fromIST(new Date(Date.UTC(ist.getUTCFullYear(), ist.getUTCMonth(), ist.getUTCDate(), 0, 0, 0, 0)));
}

export function startOfMonthIST(date: Date) {
  const ist = toIST(date);
  return fromIST(new Date(Date.UTC(ist.getUTCFullYear(), ist.getUTCMonth(), 1, 0, 0, 0, 0)));
}

export function startOfYearIST(date: Date) {
  const ist = toIST(date);
  return fromIST(new Date(Date.UTC(ist.getUTCFullYear(), 0, 1, 0, 0, 0, 0)));
}
