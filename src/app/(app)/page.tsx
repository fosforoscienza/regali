import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { listPeople } from "@/lib/data";
import { daysToChristmas, formatBirthday, inDays, nextBirthday } from "@/lib/format";
import { Avatar } from "@/components/Avatar";
import { CreateAccountButton } from "@/components/AccountForms";
import { ShareButton } from "@/components/ShareButton";
import { IconCake, IconChevron, IconHeart, IconKey, IconSparkle, IconTree } from "@/components/icons";

export default async function HomePage() {
  const me = await requireUser();
  const people = await listPeople();
  const others = people.filter((p) => p.id !== me.id);
  const mine = people.find((p) => p.id === me.id);

  const events = [
    { key: "xmas", label: "Natale", sub: null as string | null, days: daysToChristmas(), href: null as string | null, icon: "tree" as const },
    ...people.map((p) => {
      const b = nextBirthday(p.birth_date);
      return {
        key: p.id,
        label: p.id === me.id ? "Il tuo compleanno" : p.name,
        sub: `${b.age} anni`,
        days: b.days,
        href: p.id === me.id ? "/wishlist" : `/persone/${p.id}`,
        icon: "cake" as const,
      };
    }),
  ]
    .sort((a, b) => a.days - b.days)
    .slice(0, 3);

  return (
    <>
      <header className="page-header">
        <div>
          <p className="t-sub">Ciao, {me.name}</p>
          <h1 className="t-large">Regali</h1>
        </div>
        <ShareButton />
      </header>

      <div className="stack">
        {!me.password_changed && (
          <Link href="/account" className="card row pressable">
            <span className="thumb !w-9 !h-9 !rounded-lg !bg-[var(--accent-soft)] text-[var(--accent)]">
              <IconKey size={18} />
            </span>
            <span className="flex-1 min-w-0">
              <span className="t-headline block">Scegli la tua password</span>
              <span className="t-caption block">Stai usando quella iniziale: cambiala in un attimo.</span>
            </span>
            <IconChevron className="chevron" />
          </Link>
        )}

        <div className="grid grid-cols-2 gap-3">
          <Link href="/wishlist" className="action-tile is-primary">
            <span className="tile-icon"><IconHeart size={22} /></span>
            <span>
              <span className="t-headline block">La mia wishlist</span>
              <span className="text-[0.8125rem] opacity-80">
                {mine?.wishes ? `${mine.wishes} ${mine.wishes === 1 ? "desiderio" : "desideri"}` : "Aggiungi un desiderio"}
              </span>
            </span>
          </Link>
          <Link href="/suggerisci" className="action-tile">
            <span className="tile-icon"><IconSparkle size={22} /></span>
            <span>
              <span className="t-headline block">Suggerisci un regalo</span>
              <span className="t-caption">Per qualcun altro</span>
            </span>
          </Link>
        </div>

        <section>
          <h2 className="t-section">In arrivo</h2>
          <ul className="card list" style={{ "--inset": "3.875rem" } as React.CSSProperties}>
            {events.map((e) => {
              const content = (
                <>
                  <span className="thumb !w-9 !h-9 !rounded-full text-[var(--text-2)]">
                    {e.icon === "tree" ? <IconTree size={18} /> : <IconCake size={18} />}
                  </span>
                  <span className="flex-1 min-w-0">
                    <span className="t-body block truncate">{e.label}</span>
                    {e.sub && <span className="t-caption block">{e.sub}</span>}
                  </span>
                  <span className={`t-sub whitespace-nowrap ${e.days <= 14 ? "!text-[var(--accent)] font-medium" : ""}`}>
                    {inDays(e.days)}
                  </span>
                </>
              );
              return (
                <li key={e.key}>
                  {e.href ? <Link href={e.href} className="row">{content}</Link> : <div className="row">{content}</div>}
                </li>
              );
            })}
          </ul>
        </section>

        <section>
          <h2 className="t-section">Persone</h2>
          <ul className="card list" style={{ "--inset": "4.375rem" } as React.CSSProperties}>
            {others.map((p) => (
              <li key={p.id}>
                <Link href={`/persone/${p.id}`} className="row">
                  <Avatar id={p.id} name={p.name} />
                  <span className="flex-1 min-w-0">
                    <span className="t-headline block truncate">{p.name}</span>
                    <span className="t-caption block truncate">
                      {[
                        formatBirthday(p.birth_date),
                        p.wishes ? `${p.wishes} ${p.wishes === 1 ? "desiderio" : "desideri"}` : null,
                        p.suggestions ? `${p.suggestions} ${p.suggestions === 1 ? "suggerimento" : "suggerimenti"}` : null,
                      ]
                        .filter(Boolean)
                        .join(" · ")}
                    </span>
                  </span>
                  <IconChevron className="chevron" />
                </Link>
              </li>
            ))}
            <li>
              <CreateAccountButton />
            </li>
          </ul>
        </section>
      </div>
    </>
  );
}
