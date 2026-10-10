/**
 * The device's IANA time zone, e.g. "Asia/Kolkata". Read at call time so it follows the user if the device's zone
 * changes. Returns undefined if the runtime can't tell (the header is then simply not sent).
 */
export const getTimeZone = (): string | undefined => {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || undefined;
  } catch {
    return undefined;
  }
};

export const TIMEZONE_HEADER = 'X-Timezone';
