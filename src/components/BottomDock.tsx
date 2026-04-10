"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Brain,
  Command,
  Cpu,
  LayoutDashboard,
  Sparkles,
  Workflow,
} from "lucide-react";
import { useWorkspace } from "@/components/WorkspaceContext";

type DockItem = {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
};

const ITEMS: DockItem[] = [
  { href: "/dashboard", label: "Core", icon: LayoutDashboard },
  { href: "/chat", label: "NOVA", icon: Brain },
  { href: "/commands", label: "Órdenes", icon: Command },
  { href: "/nodes", label: "Nodos", icon: Cpu },
  { href: "/supply", label: "Supply", icon: Workflow },
];

export default function BottomDock() {
  const pathname = usePathname() || "/";
  const { projectId } = useWorkspace();

  return (
    <div className="fixed inset-x-0 bottom-0 z-50 lg:hidden pb-safe px-3 pb-3">
      <div className="rounded-[30px] border border-white/5 bg-slate-950/78 px-3 py-3 shadow-[0_24px_90px_rgba(2,6,23,0.55)] backdrop-blur-3xl">
        <div className="mb-3 flex items-center justify-between gap-3 px-1">
          <div className="flex items-center gap-2 rounded-full border border-white/5 bg-white/[0.03] px-3 py-1.5">
            <span className="relative flex h-2.5 w-2.5">
              <span className="absolute inline-flex h-full w-full rounded-full bg-sky-400 opacity-70 animate-ping" />
              <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-sky-400" />
            </span>
            <span className="text-[9px] font-black uppercase tracking-[0.34em] text-slate-300">
              {projectId}
            </span>
          </div>

          <Link
            href="/chat"
            className="inline-flex items-center gap-2 rounded-full border border-sky-400/15 bg-sky-400/10 px-3 py-1.5 text-[9px] font-black uppercase tracking-[0.34em] text-sky-200"
          >
            <Sparkles className="h-3.5 w-3.5" />
            NOVA
          </Link>
        </div>

        <div className="grid grid-cols-5 gap-2">
          {ITEMS.map((item) => {
            const active =
              item.href === "/" ? pathname === "/" : pathname === item.href || pathname.startsWith(`${item.href}/`);
            const Icon = item.icon;

            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={[
                  "flex flex-col items-center gap-1.5 rounded-[22px] border px-2 py-2.5 transition-all duration-300",
                  active
                    ? "border-sky-400/20 bg-sky-400/10 text-white shadow-[0_0_18px_rgba(14,165,233,0.12)]"
                    : "border-white/5 bg-white/[0.03] text-slate-400 hover:border-white/10 hover:bg-white/[0.05] hover:text-white",
                ].join(" ")}
              >
                <Icon className={["h-4.5 w-4.5", active ? "text-sky-300" : ""].join(" ")} />
                <span className="text-[9px] font-black uppercase tracking-[0.28em]">
                  {item.label}
                </span>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}
