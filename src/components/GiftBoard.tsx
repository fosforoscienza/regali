"use client";

import { useState, useTransition } from "react";
import { deleteGift, undoDone } from "@/app/actions";
import { formatPrice, giversText, linkHost, occasionText } from "@/lib/format";
import type { Gift } from "@/lib/types";
import { DoneForm } from "./DoneForm";
import { GiftForm } from "./GiftForm";
import { IconCheck, IconChevron, IconGift, IconLink, IconPlus } from "./icons";
import { Sheet, useSticky } from "./Sheet";

type PersonLite = { id: string; name: string };
type Recipient = { id: string; name: string; birth_date: string };
type Mode = "detail" | "edit" | "new" | "done";

type Props = {
  gifts: Gift[];
  me: { id: string; is_admin: boolean };
  people: PersonLite[];
  recipient: Recipient;
  variant: "mine" | "person";
};

export function GiftBoard({ gifts, me, people, recipient, variant }: Props) {
  const [sheet, setSheet] = useState<{ mode: Mode; id?: string } | null>(null);
  const shown = useSticky(sheet);
  const names = Object.fromEntries(people.map((p) => [p.id, p.name]));
  const current = useSticky(shown?.id ? gifts.find((g) => g.id === shown.id) ?? null : null);
  const close = () => setSheet(null);

  const active = gifts.filter((g) => !g.done_at);
  const done = gifts.filter((g) => g.done_at);
  const wishes = active.filter((g) => g.author_id === recipient.id);
  const suggestions = active.filter((g) => g.author_id !== recipient.id);

  const open = (id: string) => setSheet({ mode: "detail", id });

  return (
    <>
      <button
        type="button"
        className="btn btn-tinted btn-block mb-7"
        onClick={() => setSheet({ mode: "new" })}
      >
        <IconPlus size={20} />
        {variant === "mine" ? "Aggiungi un desiderio" : `Suggerisci un regalo per ${recipient.name}`}
      </button>

      <div className="stack">
        {variant === "mine" ? (
          <Section title="Desideri" gifts={wishes} names={names} onOpen={open} meId={me.id}
            empty="La tua wishlist è vuota. Aggiungi qualcosa che ti piacerebbe ricevere." />
        ) : (
          <>
            <Section title={`Desideri di ${recipient.name}`} gifts={wishes} names={names}
              onOpen={open} meId={me.id} empty={`${recipient.name} non ha ancora aggiunto desideri.`} />
            <Section title="Suggerimenti" gifts={suggestions} names={names} onOpen={open}
              meId={me.id} showAuthor empty="Nessun suggerimento, per ora." />
          </>
        )}
        {done.length > 0 && (
          <Section title={variant === "mine" ? "Ricevuti" : "Già regalati"} gifts={done}
            names={names} onOpen={open} meId={me.id} showAuthor={variant === "person"} />
        )}
      </div>

      {/* Dettaglio */}
      <Sheet
        open={sheet?.mode === "detail"}
        onClose={close}
        title=""
        trailing={<button type="button" className="btn btn-plain" onClick={close}>Fine</button>}
      >
        {current && (
          <GiftDetail
            gift={current}
            me={me}
            names={names}
            onEdit={() => setSheet({ mode: "edit", id: current.id })}
            onDone={() => setSheet({ mode: "done", id: current.id })}
            onClosed={close}
          />
        )}
      </Sheet>

      {/* Nuovo / modifica */}
      <Sheet
        open={sheet?.mode === "new" || sheet?.mode === "edit"}
        onClose={close}
        title={shown?.mode === "edit" ? "Modifica" : variant === "mine" ? "Nuovo desiderio" : `Per ${recipient.name}`}
        leading={<button type="button" className="btn btn-plain" onClick={close}>Annulla</button>}
      >
        {(shown?.mode === "new" || shown?.mode === "edit") && (
          <GiftForm
            key={shown.mode === "edit" ? `edit-${current?.id}` : `new-${sheet ? "open" : "closed"}`}
            formId={shown.mode === "edit" ? "edit-gift" : "new-gift"}
            gift={shown.mode === "edit" ? current : null}
            recipientId={recipient.id}
            onSaved={close}
          />
        )}
      </Sheet>

      {/* Segna come regalato */}
      <Sheet
        open={sheet?.mode === "done"}
        onClose={close}
        title="Regalato"
        leading={<button type="button" className="btn btn-plain" onClick={close}>Annulla</button>}
      >
        {shown?.mode === "done" && current && (
          <DoneForm
            key={current.id}
            gift={current}
            meId={me.id}
            people={people}
            recipientBirthDate={recipient.birth_date}
            onSaved={close}
          />
        )}
      </Sheet>
    </>
  );
}

function Section({
  title, gifts, names, onOpen, meId, showAuthor, empty,
}: {
  title: string;
  gifts: Gift[];
  names: Record<string, string>;
  onOpen: (id: string) => void;
  meId: string;
  showAuthor?: boolean;
  empty?: string;
}) {
  return (
    <section>
      <h2 className="t-section">{title}</h2>
      {gifts.length === 0 ? (
        <div className="card px-4 py-6 text-center t-sub">{empty}</div>
      ) : (
        <ul className="card list" style={{ "--inset": "5.375rem" } as React.CSSProperties}>
          {gifts.map((g) => (
            <li key={g.id}>
              <GiftRow gift={g} names={names} meId={meId} showAuthor={showAuthor} onOpen={onOpen} />
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

function Thumb({ gift, size }: { gift: Gift; size?: string }) {
  return (
    <span className="thumb" style={size ? { width: size, height: size } : undefined}>
      {gift.has_photo ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={`/api/foto/${gift.id}?v=${gift.version}`} alt="" loading="lazy" />
      ) : (
        <IconGift size={24} />
      )}
    </span>
  );
}

function GiftRow({
  gift, names, meId, showAuthor, onOpen,
}: {
  gift: Gift;
  names: Record<string, string>;
  meId: string;
  showAuthor?: boolean;
  onOpen: (id: string) => void;
}) {
  const price = formatPrice(gift.price);
  const host = linkHost(gift.link);
  const author =
    gift.author_id === meId ? "te" : gift.author_name ?? "account eliminato";
  const meta = gift.done_at
    ? [occasionText(gift), `da ${giversText(gift, names)}`]
    : [price, host];

  return (
    <button type="button" className="row" onClick={() => onOpen(gift.id)}>
      <Thumb gift={gift} />
      <span className="min-w-0 flex-1">
        <span className="t-headline block truncate">{gift.title}</span>
        <span className="t-caption block truncate">
          {meta.filter(Boolean).join(" · ") || (gift.notes ?? "")}
        </span>
        {showAuthor && gift.author_id !== gift.recipient_id && (
          <span className="badge mt-1.5">Suggerito da {author}</span>
        )}
      </span>
      {gift.done_at ? (
        <span className="badge badge-success"><IconCheck size={14} strokeWidth={2.4} /></span>
      ) : null}
      <IconChevron className="chevron" />
    </button>
  );
}

function GiftDetail({
  gift, me, names, onEdit, onDone, onClosed,
}: {
  gift: Gift;
  me: { id: string; is_admin: boolean };
  names: Record<string, string>;
  onEdit: () => void;
  onDone: () => void;
  onClosed: () => void;
}) {
  const [confirming, setConfirming] = useState(false);
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const isAuthor = gift.author_id === me.id;
  const canUndo =
    me.is_admin || isAuthor || gift.done_marked_by === me.id || gift.done_by.includes(me.id);
  const price = formatPrice(gift.price);
  const isSuggestion = gift.author_id !== gift.recipient_id;

  return (
    <div className="space-y-5 appear">
      {gift.has_photo && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={`/api/foto/${gift.id}?v=${gift.version}`}
          alt={gift.title}
          className="w-full max-h-80 object-contain rounded-2xl bg-[var(--surface)]"
        />
      )}

      <div className="px-1">
        <h3 className="t-title">{gift.title}</h3>
        <p className="t-sub mt-1">
          {[
            price,
            isSuggestion
              ? `Suggerito da ${gift.author_id === me.id ? "te" : gift.author_name ?? "account eliminato"}`
              : gift.recipient_id === me.id
                ? "Un tuo desiderio"
                : `Desiderio di ${gift.recipient_name}`,
          ]
            .filter(Boolean)
            .join(" · ")}
        </p>
      </div>

      {gift.done_at && (
        <div className="card p-4 flex items-start gap-3">
          <span className="badge badge-success mt-0.5"><IconCheck size={14} strokeWidth={2.4} /> Regalato</span>
          <p className="t-sub">
            {occasionText(gift)} · da {giversText(gift, names)}
          </p>
        </div>
      )}

      {gift.notes && <p className="t-body whitespace-pre-wrap px-1">{gift.notes}</p>}

      {gift.link && (
        <a
          href={gift.link}
          target="_blank"
          rel="noopener noreferrer"
          className="card row pressable"
        >
          <span className="thumb !w-9 !h-9 !rounded-lg text-[var(--accent)]"><IconLink size={18} /></span>
          <span className="min-w-0 flex-1">
            <span className="t-headline block">Apri il link</span>
            <span className="t-caption block truncate">{linkHost(gift.link)}</span>
          </span>
          <IconChevron className="chevron" />
        </a>
      )}

      {error && <p className="form-error">{error}</p>}

      <div className="space-y-2.5 pt-1">
        {!gift.done_at && (
          <button type="button" className="btn btn-primary btn-block" onClick={onDone}>
            <IconCheck size={20} /> Segna come regalato
          </button>
        )}
        {gift.done_at && canUndo && (
          <div className="grid grid-cols-2 gap-2.5">
            <button type="button" className="btn btn-gray" onClick={onDone}>
              Cambia dettagli
            </button>
            <button
              type="button"
              className="btn btn-gray"
              disabled={pending}
              onClick={() =>
                start(async () => {
                  const r = await undoDone(gift.id);
                  if (r.error) setError(r.error);
                })
              }
            >
              Non più regalato
            </button>
          </div>
        )}
        {isAuthor && (
          <div className="grid grid-cols-2 gap-2.5">
            <button type="button" className="btn btn-gray" onClick={onEdit}>
              Modifica
            </button>
            <button
              type="button"
              className="btn btn-danger"
              disabled={pending}
              onClick={() => {
                if (!confirming) return setConfirming(true);
                start(async () => {
                  const r = await deleteGift(gift.id);
                  if (r.error) setError(r.error);
                  else onClosed();
                });
              }}
            >
              {confirming ? "Conferma" : "Elimina"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
