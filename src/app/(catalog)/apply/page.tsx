import Link from 'next/link';
import { after } from 'next/server';
import { listUniversities } from '@/server/services/catalog';
import { ensureCatalogFresh } from '@/server/services/catalog-sync';
import { VerificationBadge } from '@/components/catalog/VerificationBadge';
import { Pagination } from '@/components/catalog/Pagination';

export const dynamic = 'force-dynamic';

const PAGE_SIZE = 50;

export default async function ApplyIndexPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; page?: string }>;
}) {
  if (process.env.DATABASE_URL_UNPOOLED) {
    after(() => ensureCatalogFresh().catch(() => undefined));
  }

  const { q, page: pageParam } = await searchParams;
  const page = Math.max(1, Number(pageParam) || 1);
  let rows: Awaited<ReturnType<typeof listUniversities>> = [];
  let error: string | null = null;
  try {
    const fetched = await listUniversities(q, undefined, PAGE_SIZE + 1, (page - 1) * PAGE_SIZE);
    rows = fetched.slice(0, PAGE_SIZE);
  } catch (e: any) {
    error = String(e?.message ?? e);
  }

  return (
    <div className="container">
      <h1>How to apply to university</h1>
      <p className="muted">
        Pick a university to see where to apply, what documents you need, and a
        backwards-planned timeline. Every section shows whether it is verified or
        still needs review.
      </p>

      <form method="get" style={{ display: 'flex', gap: '0.5rem', margin: '1rem 0', flexWrap: 'wrap' }}>
        <input
          className="input"
          type="search"
          name="q"
          placeholder="Search universities"
          defaultValue={q ?? ''}
          aria-label="Search universities"
        />
        <button className="button" type="submit">
          Search
        </button>
      </form>

      {error && (
        <div className="card" role="alert">
          <strong>Could not load universities.</strong>
          <p className="muted">{error}</p>
        </div>
      )}

      {!error && rows.length === 0 && (
        <div className="card">
          <h2>No universities yet</h2>
          <p className="muted">
            The catalog is empty or has not been synced. Run the catalog sync to
            import available records; we do not fabricate university data.
          </p>
        </div>
      )}

      <div className="grid">
        {rows.map((u) => (
          <article className="card" key={u.id}>
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: '0.5rem' }}>
              <h3 style={{ margin: 0 }}>
                <Link href={`/apply/${u.slug}`}>{u.name}</Link>
              </h3>
              <VerificationBadge status={u.verification_status} />
            </div>
            <p className="muted" style={{ margin: '0.35rem 0' }}>
              {u.city ? `${u.city}, ` : ''}
              {u.country}
            </p>
            {u.website && (
              <p className="muted">
                <a href={u.website} target="_blank" rel="noopener noreferrer">
                  Official website
                </a>
              </p>
            )}
          </article>
        ))}
      </div>

      <Pagination
        basePath="/apply"
        params={{ q }}
        page={page}
        hasNext={rows.length === PAGE_SIZE}
      />
    </div>
  );
}
