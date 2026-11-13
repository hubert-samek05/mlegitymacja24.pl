export function Pagination({ page, totalPages, onChange }: { page: number; totalPages: number; onChange: (page: number) => void }) {
  if (totalPages <= 1) return null;
  const numbers = Array.from({ length: totalPages }, (_, i) => i + 1).filter((n) => n === 1 || n === totalPages || Math.abs(n - page) <= 1);
  const base = "rounded-md border border-ink/15 bg-white px-3 py-1.5 text-sm font-semibold text-ink transition-colors hover:bg-ink/5 disabled:opacity-40";
  return (
    <nav aria-label="Paginacja" className="mt-4 flex flex-wrap items-center justify-center gap-1.5">
      <button onClick={() => onChange(page - 1)} disabled={page === 1} aria-label="Poprzednia strona" className={base}>&larr;</button>
      {numbers.map((n, i) => (
        <span key={n} className="flex items-center gap-1.5">
          {i > 0 && n - numbers[i - 1] > 1 && <span className="px-1 text-ink-mute">…</span>}
          <button
            onClick={() => onChange(n)}
            aria-current={n === page ? "page" : undefined}
            className={`min-w-[2.25rem] rounded-md px-3 py-1.5 text-sm font-semibold transition-colors ${n === page ? "bg-brand-900 text-white" : "border border-ink/15 bg-white text-ink hover:bg-ink/5"}`}
          >
            {n}
          </button>
        </span>
      ))}
      <button onClick={() => onChange(page + 1)} disabled={page === totalPages} aria-label="Następna strona" className={base}>&rarr;</button>
    </nav>
  );
}
