export const IST_OFFSET_MS = 19800000; // 5 hours 30 mins in ms
export const IST_TIMEZONE = "Asia/Kolkata";

/** Returns a synthetic Date where its UTC methods (getUTCFullYear, etc.) return IST values */
export function getNowIST() {
  return new Date(Date.now() + IST_OFFSET_MS);
}

/** Given a real UTC Date, return a synthetic Date where UTC methods return IST values */
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
