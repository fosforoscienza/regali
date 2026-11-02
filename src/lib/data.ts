import "server-only";
import { query } from "./db";
import type { Gift, Person, User } from "./types";

const GIFT_COLUMNS = `
  g.id, g.recipient_id, r.name as recipient_name, g.author_id, a.name as author_name,
  g.title, g.notes, g.link, g.price, (g.photo is not null) as has_photo,
  floor(extract(epoch from g.updated_at))::int as version,
  g.done_at::text as done_at, g.done_by::text[] as done_by, g.done_by_other, g.occasion, g.occasion_label, g.occasion_year,
  g.done_marked_by
`;

const GIFT_FROM = `
  from gifts g
  join users r on r.id = g.recipient_id
  left join users a on a.id = g.author_id
`;

export async function listPeople(): Promise<Person[]> {
  return query<Person>(`
    select u.id, u.name, u.birth_date, u.is_admin,
      (select count(*)::int from gifts g
         where g.recipient_id = u.id and g.author_id = u.id and g.done_at is null) as wishes,
      (select count(*)::int from gifts g
         where g.recipient_id = u.id and g.author_id is distinct from u.id and g.done_at is null) as suggestions
    from users u
    order by lower(u.name)
  `);
}

export async function getPerson(id: string): Promise<Person | null> {
  if (!isUuid(id)) return null;
  const people = await query<Person>(
    `select id, name, birth_date, is_admin, 0 as wishes, 0 as suggestions from users where id = $1`,
    [id],
  );
  return people[0] ?? null;
}

/** Solo i regali aggiunti da me per me stesso. */
export async function getMyWishlist(me: User): Promise<Gift[]> {
  return query<Gift>(
    `select ${GIFT_COLUMNS} ${GIFT_FROM}
     where g.recipient_id = $1 and g.author_id = $1
     order by g.done_at nulls first, g.created_at desc`,
    [me.id],
  );
}

/** Tutto ciò che riguarda un'altra persona: desideri + suggerimenti di tutti. */
export async function getGiftsFor(personId: string): Promise<Gift[]> {
  return query<Gift>(
    `select ${GIFT_COLUMNS} ${GIFT_FROM}
     where g.recipient_id = $1
     order by g.done_at nulls first, g.created_at desc`,
    [personId],
  );
}

export async function getHistory(): Promise<Gift[]> {
  return query<Gift>(
    `select ${GIFT_COLUMNS} ${GIFT_FROM}
     where g.done_at is not null
     order by g.occasion_year desc nulls last, g.done_at desc`,
  );
}

export async function getGift(id: string) {
  if (!isUuid(id)) return null;
  const rows = await query<Gift>(`select ${GIFT_COLUMNS} ${GIFT_FROM} where g.id = $1`, [id]);
  return rows[0] ?? null;
}

/** Un regalo è visibile a tutti, tranne i suggerimenti altrui destinati a me (ancora da fare). */
export function canSee(me: User, g: Pick<Gift, "recipient_id" | "author_id" | "done_at">) {
  if (g.recipient_id !== me.id) return true;
  if (g.author_id === me.id) return true;
  return g.done_at !== null; // nello storico si vede tutto
}

export function isUuid(s: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(s);
}
