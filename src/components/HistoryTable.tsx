"use client";

import { useMemo, useState } from "react";
import { OCCASIONS, giversText, occasionText } from "@/lib/format";
import type { Gift } from "@/lib/types";
import { Avatar } from "./Avatar";

type PersonLite = { id: string; name: string };

export function HistoryTable({ gifts, people }: { gifts: Gift[]; people: PersonLite[] }) {
  const [person, setPerson] = useState("");
  const [occasion, setOccasion] = useState("");
  const [year, setYear] = useState("");
  const names = useMemo(() => Object.fromEntries(people.map((p) => [p.id, p.name])), [people]);

  const years = useMemo(
    () =>
      Array.from(new Set(gifts.map((g) => g.occasion_year).filter((y): y is number => !!y))).sort(
        (a, b) => b - a,
      ),
    [gifts],
  );

  const rows = gifts.filter(
    (g) =>
      (!person || g.recipient_id === person) &&
      (!occasion || g.occasion === occasion) &&
      (!year || String(g.occasion_year) === year),
  );

  const filtered = person || occasion || year;

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-3 gap-2">
        <select className="input input-compact" value={person} onChange={(e) => setPerson(e.target.value)} aria-label="Filtra per persona">
          <option value="">Persone</option>
          {people.map((p) => (
            <option key={p.id} value={p.id}>{p.name}</option>
          ))}
        </select>
        <select className="input input-compact" value={occasion} onChange={(e) => setOccasion(e.target.value)} aria-label="Filtra per occasione">
          <option value="">Occasioni</option>
          {OCCASIONS.map((o) => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>
        <select className="input input-compact" value={year} onChange={(e) => setYear(e.target.value)} aria-label="Filtra per anno">
          <option value="">Anni</option>
          {years.map((y) => (
            <option key={y} value={y}>{y}</option>
          ))}
        </select>
      </div>

      <div className="flex items-center justify-between px-1">
        <p className="t-caption">
          {rows.length} {rows.length === 1 ? "regalo" : "regali"}
        </p>
        {filtered && (
          <button
            type="button"
            className="t-caption !text-[var(--accent)] font-medium"
            onClick={() => {
              setPerson("");
              setOccasion("");
              setYear("");
            }}
          >
            Azzera filtri
          </button>
        )}
      </div>

      {rows.length === 0 ? (
        <div className="card px-4 py-8 text-center t-sub">
          {gifts.length === 0
            ? "Ancora nessun regalo segnato come fatto. Quando ne segni uno, comparirà qui."
            : "Nessun regalo con questi filtri."}
        </div>
      ) : (
        <>
          {/* Tabella (schermi larghi) */}
          <div className="card hidden sm:block">
            <table className="history-table">
              <thead>
                <tr>
                  <th>Chi l&apos;ha ricevuto</th>
                  <th>Regalo</th>
                  <th>Da parte di</th>
                  <th>Occasione</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((g) => (
                  <tr key={g.id}>
                    <td>
                      <span className="flex items-center gap-2.5 font-medium whitespace-nowrap">
                        <Avatar id={g.recipient_id} name={g.recipient_name} size={1.75} />
                        {g.recipient_name}
                      </span>
                    </td>
                    <td className="font-medium">{g.title}</td>
                    <td className="text-[var(--text-2)]">{giversText(g, names)}</td>
                    <td className="text-[var(--text-2)] whitespace-nowrap">{occasionText(g)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Elenco (telefono) */}
          <ul className="card list sm:hidden" style={{ "--inset": "4.375rem" } as React.CSSProperties}>
            {rows.map((g) => (
              <li key={g.id} className="row items-start">
                <Avatar id={g.recipient_id} name={g.recipient_name} />
                <div className="min-w-0 flex-1">
                  <div className="flex items-baseline justify-between gap-3">
                    <span className="t-headline truncate">{g.recipient_name}</span>
                    <span className="t-caption whitespace-nowrap">{occasionText(g)}</span>
                  </div>
                  <p className="t-body">{g.title}</p>
                  <p className="t-caption">da {giversText(g, names)}</p>
                </div>
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  );
}
