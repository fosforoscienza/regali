import Link from "next/link";
import { logout } from "@/app/actions";
import { requireUser } from "@/lib/auth";
import { listPeople } from "@/lib/data";
import { formatDateLong } from "@/lib/format";
import { Avatar } from "@/components/Avatar";
import { CreateAccountButton, PasswordForm } from "@/components/AccountForms";
import { ShareButton } from "@/components/ShareButton";
import { IconChevron } from "@/components/icons";

export const metadata = { title: "Account · Regali" };

export default async function AccountPage() {
  const me = await requireUser();
  const people = await listPeople();

  return (
    <>
      <header className="page-header">
        <h1 className="t-large">Account</h1>
      </header>

      <div className="stack">
        <div className="card row !py-4">
          <Avatar id={me.id} name={me.name} size={3.5} />
          <div className="flex-1 min-w-0">
            <p className="t-title">{me.name}</p>
            <p className="t-sub">
              Nato/a il {formatDateLong(me.birth_date)}
              {me.is_admin && " · Amministratore"}
            </p>
          </div>
        </div>

        <section>
          <h2 className="t-section">Password</h2>
          <div className="card p-4">
            {!me.password_changed && (
              <p className="t-sub mb-4 px-1">
                Stai usando la password iniziale (il tuo nome). Scegline una nuova.
              </p>
            )}
            <PasswordForm />
          </div>
        </section>

        <section>
          <h2 className="t-section">Tutti gli account</h2>
          <ul className="card list" style={{ "--inset": "4.375rem" } as React.CSSProperties}>
            {people.map((p) => (
              <li key={p.id}>
                <Link href={p.id === me.id ? "/wishlist" : `/persone/${p.id}`} className="row">
                  <Avatar id={p.id} name={p.name} />
                  <span className="flex-1 min-w-0">
                    <span className="t-body block truncate">
                      {p.name}
                      {p.id === me.id && <span className="t-sub"> (tu)</span>}
                    </span>
                    {p.is_admin && <span className="t-caption block">Amministratore</span>}
                  </span>
                  <IconChevron className="chevron" />
                </Link>
              </li>
            ))}
            <li>
              <CreateAccountButton />
            </li>
          </ul>
          {me.is_admin && (
            <p className="t-caption px-4 mt-2">
              Come amministratore puoi eliminare un account o reimpostarne la password dalla sua pagina.
            </p>
          )}
        </section>

        <section>
          <ul className="card list" style={{ "--inset": "3.875rem" } as React.CSSProperties}>
            <li>
              <ShareButton variant="row" />
            </li>
          </ul>
        </section>

        <form action={logout}>
          <button type="submit" className="btn btn-gray btn-block !text-[var(--danger)]">
            Esci
          </button>
        </form>
      </div>
    </>
  );
}
