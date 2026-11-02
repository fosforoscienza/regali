import { requireUser } from "@/lib/auth";
import { getHistory, listPeople } from "@/lib/data";
import { HistoryTable } from "@/components/HistoryTable";

export const metadata = { title: "Storico · Regali" };

export default async function HistoryPage() {
  await requireUser();
  const [gifts, people] = await Promise.all([getHistory(), listPeople()]);
  return (
    <>
      <header className="page-header">
        <div>
          <h1 className="t-large">Storico</h1>
          <p className="t-sub mt-1">Chi ha ricevuto cosa, da chi e quando.</p>
        </div>
      </header>
      <HistoryTable gifts={gifts} people={people.map((p) => ({ id: p.id, name: p.name }))} />
    </>
  );
}
