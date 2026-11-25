"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { RefreshCw } from "lucide-react";

export default function RefreshDataButton() {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  return (
    <button type="button" disabled={pending} aria-busy={pending}
      onClick={() => startTransition(() => router.refresh())}
      className="hko-action-secondary inline-flex min-h-11 items-center gap-2 disabled:opacity-50">
      <RefreshCw className={pending ? "h-4 w-4 animate-spin" : "h-4 w-4"} aria-hidden="true" />
      {pending ? "Actualizando…" : "Actualizar"}
    </button>
  );
}
