import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { getGiftsFor, getPerson, listPeople } from "@/lib/data";
import { formatDateLong, inDays, nextBirthday } from "@/lib/format";
import { Avatar } from "@/components/Avatar";
import { AdminActions } from "@/components/AccountForms";
import { GiftBoard } from "@/components/GiftBoard";

export default async function PersonPage(props: PageProps<"/persone/[id]">) {
  const me = await requireUser();
  const { id } = await props.params;
  if (id === me.id) redirect("/wishlist");
  const person = await getPerson(id);
  if (!person) notFound();
  const [gifts, people] = await Promise.all([getGiftsFor(person.id), listPeople()]);
  const b = nextBirthday(person.birth_date);

  return (
    <>
      <nav className="mb-2 -ml-2">
        <Link href="/" className="btn btn-plain">
          <span aria-hidden="true" className="text-xl leading-none -mt-0.5">‹</span> Persone
        </Link>
      </nav>
      <header className="flex flex-col items-center text-center mb-7 appear">
        <Avatar id={person.id} name={person.name} size={5.5} />
        <h1 className="t-large mt-4">{person.name}</h1>
        <p className="t-sub mt-1">
          {formatDateLong(person.birth_date)} · compie {b.age} anni {inDays(b.days)}
        </p>
      </header>

      <GiftBoard
        gifts={gifts}
        me={{ id: me.id, is_admin: me.is_admin }}
        people={people.map((p) => ({ id: p.id, name: p.name }))}
        recipient={{ id: person.id, name: person.name, birth_date: person.birth_date }}
        variant="person"
      />

      {me.is_admin && !person.is_admin && (
        <section className="mt-10">
          <h2 className="t-section">Amministrazione</h2>
          <div className="card p-4">
            <AdminActions id={person.id} name={person.name} canDelete />
          </div>
        </section>
      )}
    </>
  );
}
