"use client";

import { useActionState, useState } from "react";
import { markDone } from "@/app/actions";
import { OCCASIONS, nextBirthday, today } from "@/lib/format";
import type { ActionState, Gift, Occasion } from "@/lib/types";

type PersonLite = { id: string; name: string };

function guessOccasion(birthDate: string | null): { occasion: Occasion; year: number } {
  const [y, m, d] = today();
  // Fino a metà gennaio si parla ancora del Natale appena passato
  if (m === 1 && d <= 15) return { occasion: "natale", year: y - 1 };
  if (m === 12) return { occasion: "natale", year: y };
  if (birthDate) {
    const { days } = nextBirthday(birthDate);
    const bm = Number(birthDate.slice(5, 7));
    if (days <= 30) return { occasion: "compleanno", year: bm < m ? y + 1 : y };
    if (days >= 335) return { occasion: "compleanno", year: bm > m ? y - 1 : y };
  }
  return { occasion: "natale", year: y };
}

type Props = {
  gift: Gift;
  meId: string;
  people: PersonLite[];
  recipientBirthDate: string | null;
  onSaved: () => void;
};

export function DoneForm({ gift, meId, people, recipientBirthDate, onSaved }: Props) {
  const guess = guessOccasion(recipientBirthDate);
  const [occasion, setOccasion] = useState<Occasion>(gift.occasion ?? guess.occasion);
  const givers = gift.done_at ? gift.done_by : meId !== gift.recipient_id ? [meId] : [];

  const [state, action, pending] = useActionState<ActionState, FormData>(async (prev, fd) => {
    const res = await markDone(prev, fd);
    if (res.ok) onSaved();
    return res;
  }, {});

  const candidates = people.filter((p) => p.id !== gift.recipient_id);

  return (
    <form action={action} className="space-y-5">
      <input type="hidden" name="id" value={gift.id} />
      {state.error && (
        <p className="form-error" role="alert">
          {state.error}
        </p>
      )}

      <fieldset>
        <legend className="field-label">Chi l&apos;ha fatto</legend>
        <div className="flex flex-wrap gap-2">
          {candidates.map((p) => (
            <label key={p.id} className="chip relative">
              <input
                type="checkbox"
                name="done_by"
                value={p.id}
                defaultChecked={givers.includes(p.id)}
              />
              {p.id === meId ? "Io" : p.name}
            </label>
          ))}
        </div>
        <input
          className="input mt-3"
          name="done_by_other"
          placeholder="Altri (es. i nonni)"
          defaultValue={gift.done_by_other ?? ""}
          autoComplete="off"
        />
      </fieldset>

      <fieldset>
        <legend className="field-label">Occasione</legend>
        <div className="segmented" role="radiogroup">
          {OCCASIONS.map((o) => (
            <label key={o.value}>
              <input
                type="radio"
                name="occasion"
                value={o.value}
                checked={occasion === o.value}
                onChange={() => setOccasion(o.value)}
              />
              {o.label}
            </label>
          ))}
        </div>
        {occasion === "altro" && (
          <input
            className="input mt-3"
            name="occasion_label"
            placeholder="Es. Laurea, Anniversario…"
            defaultValue={gift.occasion_label ?? ""}
            autoComplete="off"
          />
        )}
      </fieldset>

      <label className="field">
        <span className="field-label">Anno</span>
        <input
          className="input"
          name="occasion_year"
          type="number"
          inputMode="numeric"
          min={1900}
          max={2200}
          required
          defaultValue={gift.occasion_year ?? guess.year}
        />
      </label>

      <button type="submit" className="btn btn-primary btn-block" disabled={pending}>
        {pending ? "Salvataggio…" : "Segna come regalato"}
      </button>
    </form>
  );
}
