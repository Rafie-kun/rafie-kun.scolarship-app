import Link from 'next/link';
import { after } from 'next/server';
import { listOpportunities } from '@/server/services/catalog';
import { ensureCatalogFresh } from '@/server/services/catalog-sync';
import { VerificationBadge, LastVerified } from '@/components/catalog/VerificationBadge';
import { Pagination } from '@/components/catalog/Pagination';

export const dynamic = 'force-dynamic';

const PAGE_SIZE = 50;

export default async function OpportunitiesPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; page?: string }>;
}) {
  if (process.env.DATABASE_URL_UNPOOLED) {
    after(() => ensureCatalogFresh().catch(() => undefined));
  }

  const { q, page: pageParam } = await searchParams;
  const page = Math.max(1, Number(pageParam) || 1);
  let rows: Awaited<ReturnType<typeof listOpportunities>> = [];
  let error: string | null = null;
  try {
    const fetched = await listOpportunities(q, PAGE_SIZE + 1, (page - 1) * PAGE_SIZE);
    rows = fetched.slice(0, PAGE_SIZE);
  } catch (e: any) {
    error = String(e?.message ?? e);
  }

  return (
    <div className="container">
      <h1>Opportunities</h1>
      <p className="muted">
        Internships, research, summer programs, fellowships, competitions and
        volunteering. Records are labeled with their verification state.
      </p>

      <form method="get" style={{ display: 'flex', gap: '0.5rem', margin: '1rem 0', flexWrap: 'wrap' }}>
        <input
          className="input"
          type="search"
          name="q"
          placeholder="Search opportunities or organizations"
          defaultValue={q ?? ''}
          aria-label="Search opportunities"
        />
        <button className="button" type="submit">
          Search
        </button>
      </form>

      {error && (
        <div className="card" role="alert">
          <strong>Could not load opportunities.</strong>
          <p className="muted">{error}</p>
        </div>
      )}

      {!error && rows.length === 0 && (
        <div className="card">
          <h2>No opportunities yet</h2>
          <p className="muted">
            The catalog is empty or has not been synced. We show an honest empty
            state instead of inventing listings.
          </p>
        </div>
      )}

      <div className="grid">
        {rows.map((o) => (
          <article className="card" key={o.id}>
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: '0.5rem' }}>
              <h3 style={{ margin: 0 }}>{o.title}</h3>
              <VerificationBadge status={o.verification_status} />
            </div>
            <p className="muted" style={{ margin: '0.35rem 0' }}>
              {o.organization ?? 'Organization not listed'} · {o.country ?? 'Location not listed'}
              {o.is_remote ? ' · Remote' : ''}
            </p>
            {o.description && <p style={{ fontSize: '0.9rem' }}>{o.description.slice(0, 180)}…</p>}
            <p className="muted">
              {o.stipend ? `Stipend: ${o.stipend}` : 'Stipend not listed'}
              {o.deadline ? ` · Deadline ${o.deadline.toISOString().slice(0, 10)}` : ''}
            </p>
            <LastVerified date={o.last_verified_at} />
            {o.application_url && (
              <p style={{ marginTop: '0.5rem' }}>
                <a href={o.application_url} target="_blank" rel="noopener noreferrer">
                  View official listing
                </a>
              </p>
            )}
          </article>
        ))}
      </div>

      <Pagination
        basePath="/opportunities"
        params={{ q }}
        page={page}
        hasNext={rows.length === PAGE_SIZE}
      />
    </div>
  );
}
