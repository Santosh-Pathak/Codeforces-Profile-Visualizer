import { format, differenceInDays } from 'date-fns';

const MINUS = '\u2212'; // proper minus sign (−)

/** Returns "+N" for n > 0 and "−N" for n <= 0. */
export function formatDelta(n: number): string {
  if (n > 0) return `+${n}`;
  return `${MINUS}${Math.abs(n)}`;
}

/** Wraps date-fns format() for a unix timestamp in seconds. */
export function formatDate(timestampSeconds: number, pattern: string): string {
  return format(new Date(timestampSeconds * 1000), pattern);
}

/** Whole days between now and the given unix timestamp (seconds). */
export function daysAgo(timestampSeconds: number): number {
  return differenceInDays(new Date(), new Date(timestampSeconds * 1000));
}

/** "MMM yyyy" — used for contest chart x-axis. */
export function formatContestDate(timestampSeconds: number): string {
  return formatDate(timestampSeconds, 'MMM yyyy');
}

/** "MMM d, yyyy" — used for full dates. */
export function formatFullDate(timestampSeconds: number): string {
  return formatDate(timestampSeconds, 'MMM d, yyyy');
}

/** Human readable "X days ago" string. */
export function lastOnlineLabel(timestampSeconds: number): string {
  const d = daysAgo(timestampSeconds);
  if (d <= 0) return 'today';
  if (d === 1) return '1 day ago';
  return `${d} days ago`;
}

/** Convert an ISO country name to a flag emoji where possible. */
const COUNTRY_CODE: Record<string, string> = {
  India: 'IN',
  'United States': 'US',
  'United States of America': 'US',
  Russia: 'RU',
  China: 'CN',
  Japan: 'JP',
  Germany: 'DE',
  France: 'FR',
  'United Kingdom': 'GB',
  Canada: 'CA',
  Bangladesh: 'BD',
  Egypt: 'EG',
  Ukraine: 'UA',
  Poland: 'PL',
  Brazil: 'BR',
  Vietnam: 'VN',
  'South Korea': 'KR',
  Korea: 'KR',
  Indonesia: 'ID',
  Italy: 'IT',
  Spain: 'ES',
  Iran: 'IR',
  Turkey: 'TR',
  Australia: 'AU',
  Netherlands: 'NL',
  Switzerland: 'CH',
  Singapore: 'SG',
  Pakistan: 'PK',
  'Sri Lanka': 'LK',
  Israel: 'IL',
  Belarus: 'BY',
  Kazakhstan: 'KZ',
};

export function countryFlag(country?: string): string | null {
  if (!country) return null;
  const code = COUNTRY_CODE[country];
  if (!code) return null;
  const codePoints = code
    .toUpperCase()
    .split('')
    .map((c) => 127397 + c.charCodeAt(0));
  return String.fromCodePoint(...codePoints);
}
