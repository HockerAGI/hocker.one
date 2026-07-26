import Link from "next/link";
import { cn } from "@/lib/cn";

export type SidebarItem = {
  label: string;
  href: string;
  active?: boolean;
};

type Props = {
  items: SidebarItem[];
  className?: string;
};

export function Sidebar({ items, className }: Props) {
  return (
    <aside
      className={cn(
        "rounded-[28px] border border-white/10 bg-white/[0.03] p-4 backdrop-blur-xl",
        className,
      )}
    >
      <nav className="space-y-2">
        {items.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "flex rounded-xl px-4 py-3 text-sm transition",
              item.active
                ? "bg-cyan-400/10 text-cyan-300"
                : "text-slate-300 hover:bg-white/5 hover:text-white",
            )}
          >
            {item.label}
          </Link>
        ))}
      </nav>
    </aside>
  );
}
