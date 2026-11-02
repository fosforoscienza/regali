"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { IconClock, IconHeart, IconPeople, IconPerson } from "./icons";

const TABS = [
  { href: "/", label: "Persone", Icon: IconPeople, match: (p: string) => p === "/" || p.startsWith("/persone") || p.startsWith("/suggerisci") },
  { href: "/wishlist", label: "Wishlist", Icon: IconHeart, match: (p: string) => p.startsWith("/wishlist") },
  { href: "/storico", label: "Storico", Icon: IconClock, match: (p: string) => p.startsWith("/storico") },
  { href: "/account", label: "Account", Icon: IconPerson, match: (p: string) => p.startsWith("/account") },
];

export function TabBar() {
  const pathname = usePathname();
  return (
    <>
      <div className="scroll-edge" aria-hidden="true" />
      <nav className="tabbar" aria-label="Navigazione principale">
        {TABS.map(({ href, label, Icon, match }) => (
          <Link
            key={href}
            href={href}
            className="tab"
            aria-current={match(pathname) ? "page" : undefined}
          >
            <Icon size={22} />
            {label}
          </Link>
        ))}
      </nav>
    </>
  );
}
