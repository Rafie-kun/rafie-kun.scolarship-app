import Link from 'next/link';

export function Pagination({
  basePath,
  params,
  page,
  hasNext,
}: {
  basePath: string;
  params: Record<string, string | undefined>;
  page: number;
  hasNext: boolean;
}) {
  const hrefFor = (target: number) => {
    const search = new URLSearchParams();
    for (const [key, value] of Object.entries(params)) {
      if (value) search.set(key, value);
    }
    if (target > 1) search.set('page', String(target));
    const qs = search.toString();
    return qs ? `${basePath}?${qs}` : basePath;
  };

  if (page === 1 && !hasNext) return null;

  return (
    <nav
      aria-label="Pagination"
      style={{ display: 'flex', gap: '1rem', alignItems: 'center', marginTop: '1.5rem' }}
    >
      {page > 1 ? <Link href={hrefFor(page - 1)}>← Previous</Link> : <span />}
      <span className="muted">Page {page}</span>
      {hasNext ? <Link href={hrefFor(page + 1)}>Next →</Link> : <span />}
    </nav>
  );
}
