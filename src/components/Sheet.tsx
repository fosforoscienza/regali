"use client";

import { useEffect, useId, useRef, useState, type ReactNode } from "react";

/** Mantiene l'ultimo valore non nullo: il contenuto resta visibile durante l'uscita del sheet. */
export function useSticky<T>(value: T | null): T | null {
  const [sticky, setSticky] = useState<T | null>(value);
  if (value != null && value !== sticky) setSticky(value);
  return value ?? sticky;
}

// Proiezione del momento (Apple, "Designing Fluid Interfaces")
function project(velocity: number, decelerationRate = 0.998) {
  return ((velocity / 1000) * decelerationRate) / (1 - decelerationRate);
}

function rubberband(overshoot: number, dimension: number, constant = 0.55) {
  return (overshoot * dimension * constant) / (dimension + constant * Math.abs(overshoot));
}

type Props = {
  open: boolean;
  onClose: () => void;
  title?: ReactNode;
  leading?: ReactNode;
  trailing?: ReactNode;
  children: ReactNode;
};

export function Sheet({ open, onClose, title, leading, trailing, children }: Props) {
  const ref = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  const drag = useRef<{
    startY: number;
    pointerId: number;
    samples: { y: number; t: number }[];
  } | null>(null);

  useEffect(() => {
    const d = ref.current;
    if (!d) return;
    let timer: ReturnType<typeof setTimeout> | undefined;
    if (open && !d.open) {
      d.classList.remove("is-closing");
      d.style.transform = "";
      d.style.transition = "";
      d.showModal();
    } else if (!open && d.open) {
      d.classList.add("is-closing");
      const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      timer = setTimeout(
        () => {
          d.close();
          d.classList.remove("is-closing");
          d.style.transform = "";
          d.style.transition = "";
        },
        reduce ? 200 : 300,
      );
    }
    return () => clearTimeout(timer);
  }, [open]);

  const isTouchLayout = () => window.matchMedia("(max-width: 639px)").matches;

  function onPointerDown(e: React.PointerEvent) {
    if (!isTouchLayout()) return;
    if ((e.target as HTMLElement).closest("button, a, input")) return;
    const d = ref.current!;
    e.currentTarget.setPointerCapture(e.pointerId);
    drag.current = {
      startY: e.clientY,
      pointerId: e.pointerId,
      samples: [{ y: e.clientY, t: e.timeStamp }],
    };
    d.style.transition = "none";
  }

  function onPointerMove(e: React.PointerEvent) {
    const s = drag.current;
    if (!s || s.pointerId !== e.pointerId) return;
    const d = ref.current!;
    const dy = e.clientY - s.startY;
    // In basso segue il dito 1:1, verso l'alto resiste progressivamente
    const offset = dy >= 0 ? dy : rubberband(dy, d.offsetHeight);
    d.style.transform = `translateY(${offset}px)`;
    s.samples.push({ y: e.clientY, t: e.timeStamp });
    if (s.samples.length > 6) s.samples.shift();
  }

  function onPointerUp(e: React.PointerEvent) {
    const s = drag.current;
    if (!s || s.pointerId !== e.pointerId) return;
    drag.current = null;
    const d = ref.current!;
    const first = s.samples[0];
    const last = s.samples[s.samples.length - 1];
    const dt = Math.max(1, last.t - first.t);
    const velocity = ((last.y - first.y) / dt) * 1000; // px/s
    const dy = e.clientY - s.startY;
    const projected = Math.max(0, dy) + project(velocity);
    if (projected > d.offsetHeight * 0.45 && velocity > -100) {
      d.style.transition = "transform 260ms cubic-bezier(0.2, 0.8, 0.2, 1)";
      d.style.transform = "translateY(100%)";
      onClose();
    } else {
      d.style.transition = "transform 420ms cubic-bezier(0.22, 1, 0.36, 1)";
      d.style.transform = "translateY(0)";
      const reset = () => {
        d.style.transition = "";
        d.style.transform = "";
        d.removeEventListener("transitionend", reset);
      };
      d.addEventListener("transitionend", reset);
    }
  }

  return (
    <dialog
      ref={ref}
      className="sheet"
      aria-labelledby={title ? titleId : undefined}
      onCancel={(e) => {
        e.preventDefault();
        onClose();
      }}
      onClick={(e) => {
        if (e.target === ref.current) onClose();
      }}
    >
      <div
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
      >
        <div className="sheet-grabber" />
        <div className="sheet-head">
          <div className="justify-self-start">{leading}</div>
          <h2 id={titleId} className="t-headline text-center px-2 truncate">
            {title}
          </h2>
          <div className="justify-self-end">{trailing}</div>
        </div>
      </div>
      <div className="sheet-body">{children}</div>
    </dialog>
  );
}
