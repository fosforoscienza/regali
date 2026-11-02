import type { Gift, Occasion } from "./types";

const TZ = "Europe/Rome";
const MONTHS = [
  "gennaio", "febbraio", "marzo", "aprile", "maggio", "giugno",
  "luglio", "agosto", "settembre", "ottobre", "novembre", "dicembre",
];

/** Oggi (Europa/Roma) come [anno, mese 1-12, giorno]. */
export function today(): [number, number, number] {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: TZ,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
  const [y, m, d] = parts.split("-").map(Number);
  return [y, m, d];
}

function parseDate(iso: string): [number, number, number] {
  const [y, m, d] = iso.slice(0, 10).split("-").map(Number);
  return [y, m, d];
}

function utc(y: number, m: number, d: number) {
  return Date.UTC(y, m - 1, d);
}

export function formatBirthday(iso: string) {
  const [, m, d] = parseDate(iso);
  return `${d} ${MONTHS[m - 1]}`;
}

export function formatDateLong(iso: string) {
  const [y, m, d] = parseDate(iso);
  return `${d} ${MONTHS[m - 1]} ${y}`;
}

/** Giorni al prossimo compleanno e età che si compirà. */
export function nextBirthday(iso: string) {
  const [by, bm, bd] = parseDate(iso);
  const [ty, tm, td] = today();
  const now = utc(ty, tm, td);
  let year = ty;
  // 29 febbraio -> 28 negli anni non bisestili
  const dayFor = (y: number) =>
    bm === 2 && bd === 29 && new Date(Date.UTC(y, 1, 29)).getUTCMonth() !== 1 ? 28 : bd;
  let next = utc(year, bm, dayFor(year));
  if (next < now) {
    year += 1;
    next = utc(year, bm, dayFor(year));
  }
  return { days: Math.round((next - now) / 86400000), age: year - by };
}

export function daysToChristmas() {
  const [ty, tm, td] = today();
  const now = utc(ty, tm, td);
  let xmas = utc(ty, 12, 25);
  if (xmas < now) xmas = utc(ty + 1, 12, 25);
  return Math.round((xmas - now) / 86400000);
}

export function inDays(days: number) {
  if (days === 0) return "oggi";
  if (days === 1) return "domani";
  return `tra ${days} giorni`;
}

export function formatPrice(p: number | null) {
  if (p === null || p === undefined) return null;
  return new Intl.NumberFormat("it-IT", {
    style: "currency",
    currency: "EUR",
    minimumFractionDigits: Number.isInteger(p) ? 0 : 2,
  }).format(p);
}

export function linkHost(link: string | null) {
  if (!link) return null;
  try {
    return new URL(link).hostname.replace(/^www\./, "");
  } catch {
    return link;
  }
}

export const OCCASIONS: { value: Occasion; label: string }[] = [
  { value: "natale", label: "Natale" },
  { value: "compleanno", label: "Compleanno" },
  { value: "altro", label: "Altro" },
];

export function occasionText(g: Pick<Gift, "occasion" | "occasion_label" | "occasion_year">) {
  const base =
    g.occasion === "altro"
      ? g.occasion_label || "Altro"
      : OCCASIONS.find((o) => o.value === g.occasion)?.label ?? "";
  return [base, g.occasion_year].filter(Boolean).join(" ");
}

export function giversText(
  g: Pick<Gift, "done_by" | "done_by_other">,
  names: Record<string, string>,
) {
  const list = g.done_by.map((id) => names[id]).filter(Boolean);
  if (g.done_by_other) list.push(g.done_by_other);
  if (list.length === 0) return "—";
  if (list.length === 1) return list[0];
  return `${list.slice(0, -1).join(", ")} e ${list[list.length - 1]}`;
}

export function initials(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]!.toUpperCase())
    .join("");
}

const AVATAR_HUES = [8, 28, 145, 175, 205, 230, 262, 290, 330];
export function avatarHue(id: string) {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) >>> 0;
  return AVATAR_HUES[h % AVATAR_HUES.length];
}
