"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Avatar } from "./Avatar";
import { GiftForm } from "./GiftForm";
import { IconCheck } from "./icons";

type PersonLite = { id: string; name: string };

export function SuggestFlow({ people, initial }: { people: PersonLite[]; initial?: string }) {
  const router = useRouter();
  const [selected, setSelected] = useState<string | null>(
    initial && people.some((p) => p.id === initial) ? initial : null,
  );
  const person = people.find((p) => p.id === selected);

  if (people.length === 0) {
    return (
      <div className="card px-4 py-6 text-center t-sub">
        Non ci sono ancora altre persone. Crea un account dalla scheda Account.
      </div>
    );
  }

  return (
    <div className="stack">
      <section>
        <h2 className="t-section">Per chi è?</h2>
        <ul className="card list" role="radiogroup" style={{ "--inset": "4.375rem" } as React.CSSProperties}>
          {people.map((p) => {
            const checked = p.id === selected;
            return (
              <li key={p.id}>
                <button
                  type="button"
                  role="radio"
                  aria-checked={checked}
                  className="row"
                  onClick={() => setSelected(p.id)}
                >
                  <Avatar id={p.id} name={p.name} />
                  <span className="flex-1 t-body">{p.name}</span>
                  <span
                    className={`grid place-items-center w-6 h-6 rounded-full transition-colors ${
                      checked ? "bg-[var(--accent)] text-white" : "border-[1.5px] border-[var(--fill-strong)]"
                    }`}
                  >
                    {checked && <IconCheck size={14} strokeWidth={2.6} />}
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      </section>

      {person && (
        <section className="appear" key={person.id}>
          <h2 className="t-section">Il regalo per {person.name}</h2>
          <div className="card p-4">
            <GiftForm
              formId="suggest"
              recipientId={person.id}
              onSaved={() => router.push(`/persone/${person.id}`)}
            />
          </div>
          <p className="t-caption px-4 mt-2">
            {person.name} non vedrà questo suggerimento: è visibile solo agli altri.
          </p>
        </section>
      )}
    </div>
  );
}
