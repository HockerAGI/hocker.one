import Link from "next/link";
import type { ReactNode } from "react";
import { HOCKER_HUMAN_COPY } from "@/lib/hocker-human-copy";
import { HOCKER_NAV_ITEMS_2C } from "@/lib/hocker-role-navigation";
import { HOCKER_OWNER_ROUTE_HARDENING_2C } from "@/lib/hocker-owner-routes-2c";
import { HOCKER_PRODUCT_BLUEPRINT_2C } from "@/lib/hocker-product-blueprint-2c";
import { WorkspaceLayout, WorkspaceHeader, Sidebar, GlassCard, Topbar } from "@/components/system";
import { OwnerErrorBoundary } from "./fusion/OwnerErrorBoundary";

type OwnerShellProps = {
  eyebrow?: string;
  title: string;
  description: string;
  children: ReactNode;
  rightPanel?: ReactNode;
};

export function OwnerShell({
  eyebrow = "Owner Mode",
  title,
  description,
  children,
  rightPanel,
}: OwnerShellProps) {
  const nav = HOCKER_NAV_ITEMS_2C.owner;

  return (
    <WorkspaceLayout
      topbar={
        <Topbar
          title="Hocker ONE"
          right={
            <div className="flex items-center gap-2">
              <span className="rounded-full border border-emerald-300/25 bg-emerald-300/10 px-3 py-1 text-xs text-emerald-100">
                Sistema activo
              </span>
              <span className="rounded-full border border-[var(--hocker-gold)]/30 bg-[var(--hocker-gold)]/10 px-3 py-1 text-xs text-amber-100">
                Acciones protegidas
              </span>
            </div>
          }
        />
      }
      sidebar={
        <div className="space-y-4">
          <div className="space-y-1">
            {nav.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="block rounded-2xl px-3 py-3 text-sm text-[var(--hocker-text-soft)] transition hover:bg-white/10 hover:text-white"
              >
                <span className="font-medium">{item.label}</span>
                <span className="mt-1 block text-xs leading-5 text-[var(--hocker-text-muted)]">
                  {item.description}
                </span>
              </Link>
            ))}
          </div>

          <GlassCard
            eyebrow="NOVA"
            title="Modo privado"
            description={HOCKER_HUMAN_COPY.private_tagline}
          />
        </div>
      }
      rightRail={
        rightPanel ?? (
          <div className="space-y-4">
            <GlassCard
              eyebrow="Contexto"
              title="NOVA muestra sólo lo importante"
              description="Los detalles técnicos quedan bajo control owner."
            />
            <GlassCard
              eyebrow="Política owner 2C"
              title={HOCKER_PRODUCT_BLUEPRINT_2C.category}
              description={HOCKER_OWNER_ROUTE_HARDENING_2C.robots}
            />
          </div>
        )
      }
    >
      <OwnerErrorBoundary>
        <div className="space-y-5">
          <WorkspaceHeader
            eyebrow={eyebrow}
            title={title}
            description={description}
          />
          <div className="min-w-0">{children}</div>
        </div>
      </OwnerErrorBoundary>
    </WorkspaceLayout>
  );
}
