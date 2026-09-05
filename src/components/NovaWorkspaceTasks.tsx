"use client";

import { useState } from "react";
import { ListTodo, X } from "lucide-react";
import VerifiableWorkersConsole from "@/components/workers/VerifiableWorkersConsole";

export default function NovaWorkspaceTasks() {
  const [open, setOpen] = useState(false);

  return (
    <div className="pointer-events-none absolute inset-x-3 bottom-[27rem] z-30 flex justify-center sm:inset-x-5">
      <div className="pointer-events-auto flex w-full max-w-[860px] justify-end">
        {open ? (
          <section
            aria-label="Tareas y operaciones de NOVA"
            className="mb-2 max-h-[78vh] w-full overflow-auto rounded-2xl border border-white/[0.10] bg-[#07101d]/98 p-3 shadow-2xl backdrop-blur-xl"
          >
            <div className="mb-2 flex items-center justify-between gap-3 px-1">
              <div>
                <p className="text-sm font-semibold text-white">Tareas y operaciones</p>
                <p className="text-xs text-slate-500">Cola AGI canónica: ejecución verificable, locks, recuperación y evidencia.</p>
              </div>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="grid h-9 w-9 place-items-center rounded-lg text-slate-400 hover:bg-white/[0.06] hover:text-white"
                aria-label="Cerrar tareas"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <VerifiableWorkersConsole />
          </section>
        ) : null}

        <button
          type="button"
          onClick={() => setOpen((value) => !value)}
          className="grid h-11 w-11 place-items-center rounded-xl border border-white/[0.10] bg-[#07101d]/96 text-slate-300 shadow-xl backdrop-blur-xl hover:bg-white/[0.07] hover:text-white"
          aria-expanded={open}
          aria-label={open ? "Cerrar tareas" : "Abrir tareas"}
          title="Tareas y operaciones"
        >
          {open ? <X className="h-5 w-5" /> : <ListTodo className="h-5 w-5" />}
        </button>
      </div>
    </div>
  );
}
