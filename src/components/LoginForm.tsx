"use client";

import { useActionState } from "react";
import { login } from "@/app/actions";

export function LoginForm({ next }: { next?: string }) {
  const [state, action, pending] = useActionState(login, {});
  return (
    <form action={action} className="space-y-4">
      {next && <input type="hidden" name="next" value={next} />}
      {state.error && (
        <p className="form-error" role="alert">
          {state.error}
        </p>
      )}
      <label className="field">
        <span className="field-label">Nome</span>
        <input
          className="input"
          name="name"
          required
          autoComplete="username"
          autoCapitalize="words"
          placeholder="Il tuo nome"
        />
      </label>
      <label className="field">
        <span className="field-label">Password</span>
        <input
          className="input"
          name="password"
          type="password"
          required
          autoComplete="current-password"
          placeholder="Password"
        />
      </label>
      <button type="submit" className="btn btn-primary btn-block !mt-6" disabled={pending}>
        {pending ? "Accesso…" : "Accedi"}
      </button>
    </form>
  );
}
