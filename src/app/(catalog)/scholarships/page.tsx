import Link from 'next/link';
import { after } from 'next/server';
import { listScholarships } from '@/server/services/catalog';
import { ensureCatalogFresh } from '@/server/services/catalog-sync';
import { VerificationBadge, LastVerified } from '@/components/catalog/VerificationBadge';
import { Pagination } from '@/components/catalog/Pagination';

export const dynamic = 'force-dynamic';

const PAGE_SIZE = 50;

export default async function ScholarshipsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; country?: string; page?: string }>;
}) {
  if (process.env.DATABASE_URL_UNPOOLED) {
    after(() => ensureCatalogFresh().catch(() => undefined));
  }

  const { q, country, page: pageParam } = await searchParams;
  const page = Math.max(1, Number(pageParam) || 1);
  let rows: Awaited<ReturnType<typeof listScholarships>> = [];
  let error: string | null = null;
  try {
    const fetched = await listScholarships(
      q,
      country,
      PAGE_SIZE + 1,
      (page - 1) * PAGE_SIZE,
    );
    rows = fetched.slice(0, PAGE_SIZE);
  } catch (e: any) {
    error = String(e?.message ?? e);
  }

  return (
    <div className="container">
      <h1>Scholarships</h1>
      <p className="muted">
        Every record shows its source and verification state. Records marked
        &quot;Needs review&quot; have not been independently verified yet.
      </p>

      <form method="get" style={{ display: 'flex', gap: '0.5rem', margin: '1rem 0', flexWrap: 'wrap' }}>
        <input
          className="input"
          type="search"
          name="q"
          placeholder="Search scholarships or providers"
          defaultValue={q ?? ''}
          aria-label="Search scholarships"
        />
        <button className="button" type="submit">
          Search
        </button>
      </form>

      {error && (
        <div className="card" role="alert">
          <strong>Could not load scholarships.</strong>
          <p className="muted">{error}</p>
          <p className="muted">
            Run the catalog sync or check that the database is configured.
          </p>
        </div>
      )}

      {!error && rows.length === 0 && (
        <div className="card">
          <h2>No scholarships yet</h2>
          <p className="muted">
            The catalog is empty or the database has not been synced. An admin can
            run the catalog sync to import available records. We do not invent
            scholarship data.
          </p>
        </div>
      )}

      <div className="grid">
        {rows.map((s) => (
          <article className="card" key={s.id}>
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: '0.5rem' }}>
              <h3 style={{ margin: 0 }}>
                <Link href={`/scholarships/${s.slug}`}>{s.name}</Link>
              </h3>
              <VerificationBadge status={s.verification_status} />
            </div>
            <p className="muted" style={{ margin: '0.35rem 0' }}>
              {s.provider ?? 'Provider not listed'} · {s.country ?? 'Country not listed'}
            </p>
            {s.description && <p style={{ fontSize: '0.9rem' }}>{s.description.slice(0, 180)}…</p>}
            <p className="muted">
              {s.funding_type ?? 'Funding type not listed'}
              {s.deadline ? ` · Deadline ${s.deadline.toISOString().slice(0, 10)}` : ' · Deadline not listed'}
            </p>
            <LastVerified date={s.last_verified_at} />
          </article>
        ))}
      </div>

      <Pagination
        basePath="/scholarships"
        params={{ q, country }}
        page={page}
        hasNext={rows.length === PAGE_SIZE}
      />
    </div>
  );
}
