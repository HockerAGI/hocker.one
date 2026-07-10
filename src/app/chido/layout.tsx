import type { ReactNode } from "react";
import Link from "next/link";
import { requirePrivateSession } from "@/lib/require-private-session";
import {
  Activity,
  CheckSquare,
  Dices,
  LayoutDashboard,
  Settings,
  ShieldAlert,
  Users,
  CircleDot,
  FileSignature,
} from "lucide-react";

export const dynamic = "force-dynamic";

const CHIDO_NAV = [
  { href: "/chido", label: "Resumen", icon: Dices, exact: true },
  { href: "/chido/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/chido/approvals", label: "Aprobaciones", icon: CheckSquare },
  { href: "/chido/actions", label: "Acciones", icon: Activity },
  { href: "/chido/signatures", label: "Firmas", icon: FileSignature },
  { href: "/chido/preflight", label: "Preflight", icon: CircleDot },
  { href: "/chido/ops", label: "Operaciones", icon: Settings },
  { href: "/chido/admin", label: "Admin", icon: Users },
  { href: "/chido/research-gate", label: "Research", icon: ShieldAlert },
];

export default async function ChidoLayout({ children }: { children: ReactNode }) {
  await requirePrivateSession();

  return (
    <div className="flex flex-col gap-4">
      {/* Sub-nav horizontal — no cambia de sección, todo dentro del mismo layout */}
      <nav
        className="flex items-center gap-1 overflow-x-auto rounded-[16px] border border-white/[0.07] bg-[#07101f] p-1.5"
        aria-label="Navegación Chido Casino"
      >
        {CHIDO_NAV.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className="chido-nav-link flex shrink-0 items-center gap-2 rounded-[10px] px-3.5 py-2 text-[11px] font-semibold text-slate-500 transition-colors hover:bg-white/[0.04] hover:text-slate-200"
            data-exact={item.exact ? "true" : undefined}
          >
            <item.icon className="h-3.5 w-3.5" />
            {item.label}
          </Link>
        ))}
      </nav>

      {/* Page content */}
      <div className="flex-1">
        {children}
      </div>
    </div>
  );
}
