import Link from "next/link";

export type OwnerSimpleItem = {
  title: string;
  description: string;
  href?: string;
  status?: string;
};

export function OwnerSimplePage({ items }: { items: OwnerSimpleItem[] }) {
  return (
    <section className="grid gap-4 md:grid-cols-2">
      {items.map((item) => {
        const content = (
          <>
            <div className="flex items-start justify-between gap-3">
              <h2 className="text-xl font-semibold text-white">{item.title}</h2>
              {item.status ? (
                <span className="rounded-full border border-cyan-300/20 bg-cyan-300/10 px-3 py-1 text-xs text-cyan-100">
                  {item.status}
                </span>
              ) : null}
            </div>
            <p className="mt-3 text-sm leading-6 text-[var(--hocker-text-soft)]">{item.description}</p>
          </>
        );

        if (item.href) {
          return (
            <Link key={item.title} href={item.href} className="hocker-card block p-5">
              {content}
            </Link>
          );
        }

        return (
          <article key={item.title} className="hocker-card p-5">
            {content}
          </article>
        );
      })}
    </section>
  );
}
