import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { LoginForm } from "@/components/LoginForm";
import { IconGift } from "@/components/icons";

export const metadata = { title: "Accedi · Regali" };

export default async function LoginPage(props: PageProps<"/login">) {
  if (await getCurrentUser()) redirect("/");
  const { next } = await props.searchParams;
  return (
    <main className="min-h-dvh grid place-items-center px-4 py-10">
      <div className="w-full max-w-sm appear">
        <div className="flex flex-col items-center text-center mb-8">
          <span className="grid place-items-center w-16 h-16 rounded-[1.25rem] bg-[var(--accent)] text-white mb-5 shadow-[0_8px_24px_color-mix(in_srgb,var(--accent)_35%,transparent)]">
            <IconGift size={34} strokeWidth={1.6} />
          </span>
          <h1 className="t-large">Regali</h1>
          <p className="t-sub mt-2">Desideri e idee regalo, tutti in un posto.</p>
        </div>
        <div className="card p-5">
          <LoginForm next={typeof next === "string" ? next : undefined} />
        </div>
        <p className="t-caption text-center mt-5 px-6">
          Al primo accesso la password è il tuo nome, scritto tutto in minuscolo.
        </p>
      </div>
    </main>
  );
}
