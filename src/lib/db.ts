import "server-only";
import { Pool, types, type PoolClient, type QueryResultRow } from "pg";
import bcrypt from "bcryptjs";

// DATE -> "YYYY-MM-DD" string (avoid timezone shifts), NUMERIC -> number
types.setTypeParser(1082, (v) => v);
types.setTypeParser(1700, (v) => (v === null ? null : parseFloat(v)));

const connectionString =
  process.env.DATABASE_URL ?? "postgres://postgres:postgres@localhost:5432/regali";

function isLocal(url: string) {
  return /@(localhost|127\.0\.0\.1)(:|\/)/.test(url);
}

const globalForDb = globalThis as unknown as {
  __regaliPool?: Pool;
  __regaliReady?: Promise<void>;
};

const pool =
  globalForDb.__regaliPool ??
  new Pool({
    connectionString,
    ssl: isLocal(connectionString) ? undefined : { rejectUnauthorized: false },
    max: 5,
  });
globalForDb.__regaliPool = pool;

const SCHEMA = `
create table if not exists users (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  username text not null unique,
  password_hash text not null,
  birth_date date not null,
  is_admin boolean not null default false,
  password_changed boolean not null default false,
  created_by uuid references users(id) on delete set null,
  created_at timestamptz not null default now()
);

create table if not exists gifts (
  id uuid primary key default gen_random_uuid(),
  recipient_id uuid not null references users(id) on delete cascade,
  author_id uuid references users(id) on delete set null,
  title text not null,
  notes text,
  link text,
  price numeric(10, 2),
  photo bytea,
  photo_type text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  done_at timestamptz,
  done_by uuid[] not null default '{}',
  done_by_other text,
  occasion text check (occasion in ('natale', 'compleanno', 'altro')),
  occasion_label text,
  occasion_year int,
  done_marked_by uuid references users(id) on delete set null
);

create index if not exists gifts_recipient_idx on gifts (recipient_id);
create index if not exists gifts_done_idx on gifts (done_at) where done_at is not null;

-- Su Supabase le tabelle sono esposte dall'API pubblica: la RLS senza policy la chiude.
-- L'app si collega come proprietaria delle tabelle, quindi non ne è limitata.
alter table users enable row level security;
alter table gifts enable row level security;
`;

const SEED = [
  { name: "Lorenzo", birth: "1992-10-07" },
  { name: "Enrica", birth: "1993-07-03" },
];

async function setup() {
  const client = await pool.connect();
  try {
    await client.query("begin");
    // Serialize concurrent cold starts
    await client.query("select pg_advisory_xact_lock(724519)");
    await client.query(SCHEMA);
    for (const s of SEED) {
      const username = s.name.toLowerCase();
      const exists = await client.query("select 1 from users where username = $1", [username]);
      if (exists.rowCount === 0) {
        const hash = await bcrypt.hash(username, 10);
        await client.query(
          `insert into users (name, username, password_hash, birth_date, is_admin)
           values ($1, $2, $3, $4, true)`,
          [s.name, username, hash, s.birth],
        );
      }
    }
    await client.query("commit");
  } catch (e) {
    await client.query("rollback").catch(() => {});
    throw e;
  } finally {
    client.release();
  }
}

function ready() {
  if (!globalForDb.__regaliReady) {
    globalForDb.__regaliReady = setup().catch((e) => {
      globalForDb.__regaliReady = undefined;
      throw e;
    });
  }
  return globalForDb.__regaliReady;
}

export async function query<T extends QueryResultRow = QueryResultRow>(
  text: string,
  params: unknown[] = [],
): Promise<T[]> {
  await ready();
  const res = await pool.query<T>(text, params);
  return res.rows;
}

export async function withClient<T>(fn: (c: PoolClient) => Promise<T>): Promise<T> {
  await ready();
  const client = await pool.connect();
  try {
    return await fn(client);
  } finally {
    client.release();
  }
}
