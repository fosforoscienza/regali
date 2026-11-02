import { requireUser } from "@/lib/auth";
import { TabBar } from "@/components/TabBar";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  await requireUser();
  return (
    <>
      <main className="page">{children}</main>
      <TabBar />
    </>
  );
}
