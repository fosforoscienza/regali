"use client";

import { useEffect, useState } from "react";
import { IconShare } from "./icons";

export function ShareButton({ variant = "icon" }: { variant?: "icon" | "row" }) {
  const [toast, setToast] = useState<string | null>(null);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 2200);
    return () => clearTimeout(t);
  }, [toast]);

  async function share() {
    const url = window.location.origin;
    const data = {
      title: "Regali",
      text: "Ti invito su Regali: la nostra lista dei desideri condivisa. Accedi con il tuo nome!",
      url,
    };
    try {
      if (navigator.share) {
        await navigator.share(data);
        return;
      }
    } catch (e) {
      if ((e as Error).name === "AbortError") return;
    }
    try {
      await navigator.clipboard.writeText(url);
      setToast("Link copiato");
    } catch {
      setToast(url);
    }
  }

  return (
    <>
      {variant === "icon" ? (
        <button type="button" className="icon-btn" onClick={share} aria-label="Condividi l'app">
          <IconShare size={20} />
        </button>
      ) : (
        <button type="button" className="row" onClick={share}>
          <span className="thumb !w-9 !h-9 !rounded-lg !bg-[var(--accent-soft)] text-[var(--accent)]">
            <IconShare size={18} />
          </span>
          <span className="flex-1 t-body">Condividi l&apos;app</span>
        </button>
      )}
      {toast && (
        <div className="toast" role="status">
          {toast}
        </div>
      )}
    </>
  );
}
