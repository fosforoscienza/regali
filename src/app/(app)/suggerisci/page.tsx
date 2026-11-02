import { requireUser } from "@/lib/auth";
import { listPeople } from "@/lib/data";
import { SuggestFlow } from "@/components/SuggestFlow";

export const metadata = { title: "Suggerisci un regalo · Regali" };

export default async function SuggestPage(props: PageProps<"/suggerisci">) {
  const me = await requireUser();
  const { per } = await props.searchParams;
  const people = (await listPeople()).filter((p) => p.id !== me.id);
  return (
    <>
      <header className="page-header">
        <div>
          <h1 className="t-large">Suggerisci un regalo</h1>
          <p className="t-sub mt-1">Scegli una persona e annota un&apos;idea.</p>
        </div>
      </header>
      <SuggestFlow
        people={people.map((p) => ({ id: p.id, name: p.name }))}
        initial={typeof per === "string" ? per : undefined}
      />
    </>
  );
}
