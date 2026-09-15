export function toISODate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export function todayISO(): string {
  return toISODate(new Date());
}

export function fromISODate(iso: string): Date {
  const [y, m, d] = iso.split('-').map(Number);
  return new Date(y, m - 1, d);
}

export function addDays(iso: string, delta: number): string {
  const d = fromISODate(iso);
  d.setDate(d.getDate() + delta);
  return toISODate(d);
}

// Monday-start week key, e.g. "2026-W37"-ish but we just use the ISO date of that week's Monday.
export function startOfWeek(iso: string): string {
  const d = fromISODate(iso);
  const dow = d.getDay(); // 0 Sun .. 6 Sat
  const diffToMonday = dow === 0 ? -6 : 1 - dow;
  d.setDate(d.getDate() + diffToMonday);
  return toISODate(d);
}

export function weekdayOf(iso: string): number {
  return fromISODate(iso).getDay();
}

export function formatDateShort(iso: string): string {
  return fromISODate(iso).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

export function formatDateLong(iso: string): string {
  return fromISODate(iso).toLocaleDateString(undefined, {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  });
}

export function daysBetween(fromIso: string, toIso: string): number {
  const a = fromISODate(fromIso).getTime();
  const b = fromISODate(toIso).getTime();
  return Math.round((b - a) / 86_400_000);
}

export function isPastDate(iso: string): boolean {
  return daysBetween(todayISO(), iso) < 0;
}
