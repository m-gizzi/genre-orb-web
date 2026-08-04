export function toNumber(value: string): number | undefined {
  const parsed = Number(value);
  return value === "" || Number.isNaN(parsed) ? undefined : parsed;
}

export function msToMinutes(ms: number | undefined): string {
  return ms == null ? "" : String(ms / 60000);
}

export function minutesToMs(value: string): number | undefined {
  const minutes = toNumber(value);
  return minutes == null ? undefined : Math.round(minutes) * 60000;
}
