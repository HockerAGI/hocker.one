import AuthBox from "@/components/AuthBox";

export default function HomePage() {
  return (
    <main className="mx-auto max-w-3xl px-6 py-12">
      <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
        <h1 className="text-2xl font-semibold tracking-tight">HOCKER.ONE</h1>
        <p className="mt-2 text-slate-600">
          Entra con tu correo. Te mando un link y listo. Luego vas al dashboard y hablas con NOVA.
        </p>

        <div className="mt-6">
          <AuthBox />
        </div>

        <div className="mt-6 text-sm text-slate-500">
          Tip: si el link no te redirige bien, revisa en Supabase el <span className="font-medium">Site URL</span> y el
          redirect <span className="font-medium">/auth/callback</span>.
        </div>
      </div>
    </main>
  );
}