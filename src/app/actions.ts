"use server";

import bcrypt from "bcryptjs";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createSession, destroySession, normalizeUsername, requireUser } from "@/lib/auth";
import { query } from "@/lib/db";
import { canSee, getGift, getPerson, isUuid } from "@/lib/data";
import type { ActionState, Occasion } from "@/lib/types";

const str = (fd: FormData, key: string) => {
  const v = fd.get(key);
  return typeof v === "string" ? v.trim() : "";
};

function refreshAll() {
  revalidatePath("/", "layout");
}

/* ---------- Accesso ---------- */

export async function login(_: ActionState, fd: FormData): Promise<ActionState> {
  const username = normalizeUsername(str(fd, "name"));
  const password = str(fd, "password");
  if (!username || !password) return { error: "Inserisci nome e password." };

  const rows = await query<{ id: string; password_hash: string }>(
    "select id, password_hash from users where username = $1",
    [username],
  );
  const user = rows[0];
  const ok = user ? await bcrypt.compare(password, user.password_hash) : false;
  if (!user || !ok) return { error: "Nome o password non corretti." };

  await createSession(user.id);
  const next = str(fd, "next");
  redirect(next.startsWith("/") && !next.startsWith("//") ? next : "/");
}

export async function logout() {
  await destroySession();
  redirect("/login");
}

export async function changePassword(_: ActionState, fd: FormData): Promise<ActionState> {
  const me = await requireUser();
  const current = str(fd, "current");
  const next = str(fd, "next");
  const confirm = str(fd, "confirm");

  const [row] = await query<{ password_hash: string }>(
    "select password_hash from users where id = $1",
    [me.id],
  );
  if (!row || !(await bcrypt.compare(current, row.password_hash)))
    return { error: "La password attuale non è corretta." };
  if (next.length < 4) return { error: "La nuova password deve avere almeno 4 caratteri." };
  if (next !== confirm) return { error: "Le due password non coincidono." };

  const hash = await bcrypt.hash(next, 10);
  await query("update users set password_hash = $1, password_changed = true where id = $2", [
    hash,
    me.id,
  ]);
  refreshAll();
  return { ok: true, message: "Password aggiornata." };
}

/* ---------- Account ---------- */

export async function createAccount(_: ActionState, fd: FormData): Promise<ActionState> {
  const me = await requireUser();
  const name = str(fd, "name").replace(/\s+/g, " ");
  const birth = str(fd, "birth_date");
  if (!name) return { error: "Inserisci il nome." };
  if (name.length > 40) return { error: "Il nome è troppo lungo." };
  if (!/^\d{4}-\d{2}-\d{2}$/.test(birth)) return { error: "Inserisci la data di nascita." };

  const username = normalizeUsername(name);
  const exists = await query("select 1 from users where username = $1", [username]);
  if (exists.length) return { error: `Esiste già un account “${name}”.` };

  const displayName = name.replace(/(^|[\s'-])\p{L}/gu, (c) => c.toUpperCase());
  const hash = await bcrypt.hash(username, 10);
  const [created] = await query<{ id: string }>(
    `insert into users (name, username, password_hash, birth_date, created_by)
     values ($1, $2, $3, $4, $5) returning id`,
    [displayName, username, hash, birth, me.id],
  );
  refreshAll();
  return {
    ok: true,
    id: created.id,
    message: `Account creato. ${displayName} può accedere con la password “${username}”.`,
  };
}

export async function deleteAccount(id: string): Promise<ActionState> {
  const me = await requireUser();
  if (!me.is_admin) return { error: "Solo gli amministratori possono eliminare account." };
  const target = await getPerson(id);
  if (!target) return { error: "Account non trovato." };
  if (target.is_admin) return { error: "Gli account amministratore non si possono eliminare." };
  await query("delete from users where id = $1 and is_admin = false", [id]);
  refreshAll();
  return { ok: true };
}

export async function resetPassword(id: string): Promise<ActionState> {
  const me = await requireUser();
  if (!me.is_admin) return { error: "Non autorizzato." };
  const [target] = await query<{ username: string; is_admin: boolean }>(
    "select username, is_admin from users where id = $1",
    [isUuid(id) ? id : null],
  );
  if (!target) return { error: "Account non trovato." };
  if (target.is_admin && id !== me.id)
    return { error: "Non puoi reimpostare la password di un altro amministratore." };
  const hash = await bcrypt.hash(target.username, 10);
  await query("update users set password_hash = $1, password_changed = false where id = $2", [
    hash,
    id,
  ]);
  refreshAll();
  return { ok: true, message: `Password reimpostata a “${target.username}”.` };
}

/* ---------- Regali ---------- */

function parsePrice(raw: string): number | null | "invalid" {
  if (!raw) return null;
  const cleaned = raw.replace(/[€\s]/g, "").replace(/\.(?=\d{3}(\D|$))/g, "").replace(",", ".");
  const n = Number(cleaned);
  if (!Number.isFinite(n) || n < 0 || n > 99_999_999) return "invalid";
  return Math.round(n * 100) / 100;
}

function parseLink(raw: string): string | null | "invalid" {
  if (!raw) return null;
  const withProto = /^https?:\/\//i.test(raw) ? raw : `https://${raw}`;
  try {
    const u = new URL(withProto);
    if (!u.hostname.includes(".")) return "invalid";
    return u.toString();
  } catch {
    return "invalid";
  }
}

const MAX_PHOTO = 3 * 1024 * 1024;

export async function saveGift(_: ActionState, fd: FormData): Promise<ActionState> {
  const me = await requireUser();
  const id = str(fd, "id");
  const title = str(fd, "title");
  const notes = str(fd, "notes") || null;
  const price = parsePrice(str(fd, "price"));
  const link = parseLink(str(fd, "link"));
  const removePhoto = str(fd, "remove_photo") === "1";
  const photo = fd.get("photo");

  if (!title) return { error: "Dai un nome al regalo." };
  if (title.length > 120) return { error: "Il nome è troppo lungo." };
  if (price === "invalid") return { error: "Il prezzo non è valido." };
  if (link === "invalid") return { error: "Il link non è valido." };

  let photoBuf: Buffer | null = null;
  let photoType: string | null = null;
  if (photo instanceof File && photo.size > 0) {
    if (!photo.type.startsWith("image/")) return { error: "Il file deve essere un'immagine." };
    if (photo.size > MAX_PHOTO) return { error: "La foto è troppo grande (max 3 MB)." };
    photoBuf = Buffer.from(await photo.arrayBuffer());
    photoType = photo.type;
  }

  if (id) {
    const gift = await getGift(id);
    if (!gift) return { error: "Regalo non trovato." };
    if (gift.author_id !== me.id) return { error: "Puoi modificare solo ciò che hai aggiunto tu." };
    await query(
      `update gifts set title = $1, notes = $2, link = $3, price = $4,
         photo = case when $5::bytea is not null then $5::bytea when $7 then null else photo end,
         photo_type = case when $5::bytea is not null then $6 when $7 then null else photo_type end,
         updated_at = now()
       where id = $8`,
      [title, notes, link, price, photoBuf, photoType, removePhoto, id],
    );
    refreshAll();
    return { ok: true, id };
  }

  const recipientId = str(fd, "recipient_id") || me.id;
  const recipient = await getPerson(recipientId);
  if (!recipient) return { error: "Scegli per chi è il regalo." };

  const [row] = await query<{ id: string }>(
    `insert into gifts (recipient_id, author_id, title, notes, link, price, photo, photo_type)
     values ($1, $2, $3, $4, $5, $6, $7, $8) returning id`,
    [recipient.id, me.id, title, notes, link, price, photoBuf, photoType],
  );
  refreshAll();
  return { ok: true, id: row.id };
}

export async function deleteGift(id: string): Promise<ActionState> {
  const me = await requireUser();
  const gift = await getGift(id);
  if (!gift) return { error: "Regalo non trovato." };
  if (gift.author_id !== me.id) return { error: "Puoi eliminare solo ciò che hai aggiunto tu." };
  await query("delete from gifts where id = $1", [id]);
  refreshAll();
  return { ok: true };
}

const OCCASION_VALUES: Occasion[] = ["natale", "compleanno", "altro"];

export async function markDone(_: ActionState, fd: FormData): Promise<ActionState> {
  const me = await requireUser();
  const gift = await getGift(str(fd, "id"));
  if (!gift || !canSee(me, gift)) return { error: "Regalo non trovato." };

  const givers = fd
    .getAll("done_by")
    .filter((v): v is string => typeof v === "string" && isUuid(v));
  const other = str(fd, "done_by_other") || null;
  const occasion = str(fd, "occasion") as Occasion;
  const label = occasion === "altro" ? str(fd, "occasion_label") || null : null;
  const year = Number(str(fd, "occasion_year"));

  if (givers.length === 0 && !other) return { error: "Indica chi ha fatto il regalo." };
  if (!OCCASION_VALUES.includes(occasion)) return { error: "Scegli l'occasione." };
  if (!Number.isInteger(year) || year < 1900 || year > 2200) return { error: "Anno non valido." };

  if (givers.length) {
    const known = await query<{ id: string }>("select id from users where id = any($1::uuid[])", [
      givers,
    ]);
    if (known.length !== new Set(givers).size) return { error: "Persona non trovata." };
  }

  await query(
    `update gifts set done_at = coalesce(done_at, now()), done_by = $1::uuid[], done_by_other = $2,
       occasion = $3, occasion_label = $4, occasion_year = $5, done_marked_by = $6
     where id = $7`,
    [Array.from(new Set(givers)), other, occasion, label, year, me.id, gift.id],
  );
  refreshAll();
  return { ok: true };
}

export async function undoDone(id: string): Promise<ActionState> {
  const me = await requireUser();
  const gift = await getGift(id);
  if (!gift || !canSee(me, gift)) return { error: "Regalo non trovato." };
  const allowed =
    me.is_admin || gift.author_id === me.id || gift.done_marked_by === me.id ||
    gift.done_by.includes(me.id);
  if (!allowed) return { error: "Non puoi modificare questo regalo." };
  await query(
    `update gifts set done_at = null, done_by = '{}', done_by_other = null, occasion = null,
       occasion_label = null, occasion_year = null, done_marked_by = null
     where id = $1`,
    [id],
  );
  refreshAll();
  return { ok: true };
}
