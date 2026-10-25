import Link from 'next/link';
import { catalogCounts } from '@/server/services/catalog';

export const dynamic = 'force-dynamic';

export default async function HomePage() {
  let counts: { universities: number; scholarships: number; opportunities: number } | null = null;
  let error: string | null = null;

  try {
    if (process.env.DATABASE_URL_UNPOOLED) {
      counts = await catalogCounts();
    }
  } catch (e: any) {
    error = String(e?.message ?? e);
  }

  return (
    <div className="container">
      <div className="topbar" style={{ position: 'static', marginBottom: '1.5rem' }}>
        <div className="topbar-inner" style={{ paddingLeft: 0, paddingRight: 0 }}>
          <span className="brand">Somnia</span>
          <Link href="/scholarships" className="navlink">
            Scholarships
          </Link>
          <Link href="/opportunities" className="navlink">
            Opportunities
          </Link>
          <Link href="/apply" className="navlink">
            How to Apply
          </Link>
        </div>
      </div>

      <h1>Plan your study abroad without guessing</h1>
      <p className="muted" style={{ maxWidth: '60ch' }}>
        Find universities, scholarships, and internships, see how to apply step by
        step, and know exactly how trustworthy each record is. Nothing is shown as
        verified unless a human has checked the official source.
      </p>

      <div className="grid" style={{ marginTop: '1.5rem' }}>
        <article className="card">
          <h2>Universities &amp; how to apply</h2>
          <p className="muted">
            Where to apply, fees, deadlines, documents, tests, essays, and a
            backwards-planned timeline.
          </p>
          <Link href="/apply" className="button">
            Open admissions guides
          </Link>
        </article>

        <article className="card">
          <h2>Scholarships</h2>
          <p className="muted">
            Funding opportunities with eligibility, deadlines, and official links.
          </p>
          <Link href="/scholarships" className="button">
            Browse scholarships
          </Link>
        </article>

        <article className="card">
          <h2>Internships &amp; programs</h2>
          <p className="muted">
            Internships, research, summer programs, fellowships, and competitions.
          </p>
          <Link href="/opportunities" className="button">
            Browse opportunities
          </Link>
        </article>
      </div>

      <section className="card" style={{ marginTop: '1.5rem' }}>
        <h2>Catalog status</h2>
        {counts ? (
          <dl className="kv">
            <dt>Universities</dt>
            <dd>{counts.universities}</dd>
            <dt>Scholarships</dt>
            <dd>{counts.scholarships}</dd>
            <dt>Opportunities</dt>
            <dd>{counts.opportunities}</dd>
          </dl>
        ) : (
          <p className="muted">
            {error
              ? `The catalog is not reachable right now (${error}).`
              : 'The database is not configured yet. Set DATABASE_URL_UNPOOLED and run the catalog sync.'}
          </p>
        )}
      </section>
    </div>
  );
}
