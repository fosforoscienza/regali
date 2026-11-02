export type User = {
  id: string;
  name: string;
  username: string;
  birth_date: string; // YYYY-MM-DD
  is_admin: boolean;
  password_changed: boolean;
};

export type Person = {
  id: string;
  name: string;
  birth_date: string;
  is_admin: boolean;
  wishes: number;
  suggestions: number;
};

export type Occasion = "natale" | "compleanno" | "altro";

export type Gift = {
  id: string;
  recipient_id: string;
  recipient_name: string;
  author_id: string | null;
  author_name: string | null;
  title: string;
  notes: string | null;
  link: string | null;
  price: number | null;
  has_photo: boolean;
  version: number; // per invalidare la cache della foto
  done_at: string | null;
  done_by: string[];
  done_by_other: string | null;
  occasion: Occasion | null;
  occasion_label: string | null;
  occasion_year: number | null;
  done_marked_by: string | null;
};

export type ActionState = { ok?: boolean; error?: string; message?: string; id?: string };
