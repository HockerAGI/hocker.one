"use client";

import { useState } from "react";
import { cn } from "@/lib/cn";

type Props = {
  placeholder?: string;
  onSend?: (message: string) => void;
  className?: string;
};

export function Composer({
  placeholder = "Escribe una instrucción para NOVA...",
  onSend,
  className,
}: Props) {
  const [value, setValue] = useState("");

  function submit() {
    const text = value.trim();

    if (!text) return;

    onSend?.(text);

    setValue("");
  }

  return (
    <div
      className={cn(
        "rounded-[28px] border border-white/10 bg-[#09131f]/90 p-4 backdrop-blur-xl",
        className,
      )}
    >
      <textarea
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder={placeholder}
        rows={3}
        className="w-full resize-none bg-transparent text-white placeholder:text-slate-500 focus:outline-none"
      />

      <div className="mt-4 flex items-center justify-between">

        <div className="flex gap-2">

          <button
            className="rounded-lg border border-white/10 px-3 py-2 text-sm text-slate-300 hover:border-cyan-400/40 hover:text-cyan-300"
          >
            📎
          </button>

          <button
            className="rounded-lg border border-white/10 px-3 py-2 text-sm text-slate-300 hover:border-cyan-400/40 hover:text-cyan-300"
          >
            🎤
          </button>

        </div>

        <button
          onClick={submit}
          className="rounded-xl bg-cyan-400 px-5 py-2 font-medium text-slate-950 transition hover:bg-cyan-300"
        >
          Pedir a NOVA
        </button>

      </div>
    </div>
  );
}
