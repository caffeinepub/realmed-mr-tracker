/** Convert JS timestamp (ms) to nanoseconds BigInt */
export function msToNs(ms: number): bigint {
  return BigInt(Math.floor(ms)) * 1_000_000n;
}

/** Convert nanoseconds BigInt to JS Date */
export function nsToDate(ns: bigint): Date {
  return new Date(Number(ns / 1_000_000n));
}

/** Format a nanosecond timestamp to a readable date string */
export function formatNsDate(ns: bigint): string {
  return nsToDate(ns).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

/** Format a nanosecond timestamp to date + time */
export function formatNsDateTime(ns: bigint): string {
  return nsToDate(ns).toLocaleString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

/** Convert an HTML date input value (YYYY-MM-DD) to nanoseconds BigInt */
export function dateInputToNs(value: string): bigint {
  return msToNs(new Date(value).getTime());
}

/** Convert nanoseconds BigInt to HTML date input value (YYYY-MM-DD) */
export function nsToDateInput(ns: bigint): string {
  const d = nsToDate(ns);
  return d.toISOString().slice(0, 10);
}

/** Convert HTML datetime-local input value to nanoseconds BigInt */
export function datetimeInputToNs(value: string): bigint {
  return msToNs(new Date(value).getTime());
}

/** Convert nanoseconds BigInt to datetime-local input value */
export function nsToDatetimeInput(ns: bigint): string {
  const d = nsToDate(ns);
  const local = new Date(d.getTime() - d.getTimezoneOffset() * 60000);
  return local.toISOString().slice(0, 16);
}

/** Check if a date is today */
export function isToday(ns: bigint): boolean {
  const d = nsToDate(ns);
  const now = new Date();
  return (
    d.getDate() === now.getDate() &&
    d.getMonth() === now.getMonth() &&
    d.getFullYear() === now.getFullYear()
  );
}

/** Get relative time label */
export function relativeDate(ns: bigint): string {
  const d = nsToDate(ns);
  const now = new Date();
  const diff = d.getTime() - now.getTime();
  const days = Math.round(diff / (1000 * 60 * 60 * 24));

  if (days === 0) return "Today";
  if (days === 1) return "Tomorrow";
  if (days === -1) return "Yesterday";
  if (days > 0 && days < 7) return `In ${days} days`;
  if (days < 0 && days > -7) return `${Math.abs(days)} days ago`;
  return formatNsDate(ns);
}
