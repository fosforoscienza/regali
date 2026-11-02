"use client";

import { useActionState, useState, useTransition } from "react";
import { changePassword, createAccount, deleteAccount, resetPassword } from "@/app/actions";
import type { ActionState } from "@/lib/types";
import { IconPlus } from "./icons";
import { Sheet } from "./Sheet";

export function CreateAccountForm({ onCreated }: { onCreated?: () => void }) {
  const [state, action, pending] = useActionState<ActionState, FormData>(async (prev, fd) => {
    const res = await createAccount(prev, fd);
    return res;
  }, {});

  if (state.ok) {
    return (
      <div className="space-y-4 appear">
        <p className="form-ok" role="status">{state.message}</p>
        <p className="t-sub px-1">
          Condividi il link dell&apos;app: al primo accesso potrà cambiare la password.
        </p>
        <button type="button" className="btn btn-gray btn-block" onClick={onCreated}>
          Fine
        </button>
      </div>
    );
  }

  return (
    <form action={action} className="space-y-4">
      {state.error && <p className="form-error" role="alert">{state.error}</p>}
      <label className="field">
        <span className="field-label">Nome</span>
        <input className="input" name="name" required maxLength={40} autoComplete="off" placeholder="Es. Marta" />
      </label>
      <label className="field">
        <span className="field-label">Data di nascita</span>
        <input className="input" name="birth_date" type="date" required max="2100-12-31" />
      </label>
      <p className="t-caption px-1">
        La password iniziale sarà il nome, tutto in minuscolo.
      </p>
      <button type="submit" className="btn btn-primary btn-block" disabled={pending}>
        {pending ? "Creazione…" : "Crea account"}
      </button>
    </form>
  );
}

export function CreateAccountButton({ variant = "row" }: { variant?: "row" | "button" }) {
  const [open, setOpen] = useState(false);
  const [round, setRound] = useState(0);
  const close = () => {
    setOpen(false);
    setTimeout(() => setRound((r) => r + 1), 350);
  };
  return (
    <>
      {variant === "row" ? (
        <button type="button" className="row" onClick={() => setOpen(true)}>
          <span className="avatar !bg-[var(--accent-soft)] !text-[var(--accent)]" style={{ "--size": "2.5rem" } as React.CSSProperties}>
            <IconPlus size={20} />
          </span>
          <span className="flex-1 t-body text-[var(--accent)]">Aggiungi una persona</span>
        </button>
      ) : (
        <button type="button" className="btn btn-tinted btn-block" onClick={() => setOpen(true)}>
          <IconPlus size={20} /> Nuovo account
        </button>
      )}
      <Sheet
        open={open}
        onClose={close}
        title="Nuovo account"
        leading={<button type="button" className="btn btn-plain" onClick={close}>Annulla</button>}
      >
        <CreateAccountForm key={round} onCreated={close} />
      </Sheet>
    </>
  );
}

export function PasswordForm() {
  const [state, action, pending] = useActionState(changePassword, {});
  return (
    <form action={action} className="space-y-4" key={state.ok ? "done" : "form"}>
      {state.error && <p className="form-error" role="alert">{state.error}</p>}
      {state.ok && <p className="form-ok" role="status">{state.message}</p>}
      <label className="field">
        <span className="field-label">Password attuale</span>
        <input className="input" name="current" type="password" required autoComplete="current-password" />
      </label>
      <label className="field">
        <span className="field-label">Nuova password</span>
        <input className="input" name="next" type="password" required minLength={4} autoComplete="new-password" />
      </label>
      <label className="field">
        <span className="field-label">Ripeti la nuova password</span>
        <input className="input" name="confirm" type="password" required minLength={4} autoComplete="new-password" />
      </label>
      <button type="submit" className="btn btn-primary btn-block" disabled={pending}>
        {pending ? "Salvataggio…" : "Cambia password"}
      </button>
    </form>
  );
}

export function AdminActions({ id, name, canDelete }: { id: string; name: string; canDelete: boolean }) {
  const [confirming, setConfirming] = useState<"delete" | "reset" | null>(null);
  const [pending, start] = useTransition();
  const [msg, setMsg] = useState<ActionState | null>(null);

  return (
    <div className="space-y-2.5">
      {msg?.error && <p className="form-error">{msg.error}</p>}
      {msg?.message && <p className="form-ok">{msg.message}</p>}
      <div className={`grid gap-2.5 ${canDelete ? "grid-cols-2" : "grid-cols-1"}`}>
        <button
          type="button"
          className="btn btn-gray btn-sm"
          disabled={pending}
          onClick={() => {
            if (confirming !== "reset") return setConfirming("reset");
            start(async () => {
              setMsg(await resetPassword(id));
              setConfirming(null);
            });
          }}
        >
          {confirming === "reset" ? "Conferma reimpostazione" : "Reimposta password"}
        </button>
        {canDelete && (
          <button
            type="button"
            className="btn btn-danger btn-sm"
            disabled={pending}
            aria-label={`Elimina l'account di ${name}`}
            onClick={() => {
              if (confirming !== "delete") return setConfirming("delete");
              start(async () => {
                const r = await deleteAccount(id);
                if (r.error) setMsg(r);
                setConfirming(null);
              });
            }}
          >
            {confirming === "delete" ? `Elimina ${name}?` : "Elimina account"}
          </button>
        )}
      </div>
      {confirming === "delete" && (
        <p className="t-caption px-1">
          Verranno eliminati anche la sua wishlist e i suggerimenti per {name}. L&apos;operazione non si può annullare.
        </p>
      )}
    </div>
  );
}
