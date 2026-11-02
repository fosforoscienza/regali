import type { CSSProperties } from "react";
import { avatarHue, initials } from "@/lib/format";

export function Avatar({ id, name, size = 2.5 }: { id: string; name: string; size?: number }) {
  return (
    <span
      className="avatar"
      style={{ "--h": avatarHue(id), "--size": `${size}rem` } as CSSProperties}
      aria-hidden="true"
    >
      {initials(name)}
    </span>
  );
}
