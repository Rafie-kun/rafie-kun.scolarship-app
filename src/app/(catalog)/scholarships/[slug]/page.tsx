import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getScholarshipBySlug } from '@/server/services/catalog';
import { VerificationBadge, LastVerified } from '@/components/catalog/VerificationBadge';

export const dynamic = 'force-dynamic';

export default async function ScholarshipDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const s = await getScholarshipBySlug(slug);
  if (!s) notFound();

  return (
    <div className="container">
      <Link href="/scholarships" className="navlink">
        ← All scholarships
      </Link>
      <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', margin: '0.75rem 0' }}>
        <h1 style={{ margin: 0 }}>{s.name}</h1>
        <VerificationBadge status={s.verification_status} />
      </div>
      <p className="muted">
        {s.provider ?? 'Provider not listed'} · {s.country ?? 'Country not listed'}
      </p>

      <div className="grid" style={{ gridTemplateColumns: '2fr 1fr', marginTop: '1rem' }}>
        <section className="card">
          <h2>Overview</h2>
          <p>{s.description ?? 'No description has been verified yet.'}</p>

          <h2>Eligibility</h2>
          <p style={{ whiteSpace: 'pre-line' }}>
            {s.eligibility_text ?? 'Eligibility has not been verified yet.'}
          </p>

          <h2>How to apply</h2>
          <p style={{ whiteSpace: 'pre-line' }}>
            {s.documents_text ?? 'Application steps have not been verified yet.'}
          </p>
        </section>

        <aside className="card">
          <h2>Key facts</h2>
          <dl className="kv">
            <dt>Degree level</dt>
            <dd>{s.degree_level ?? 'Not listed'}</dd>
            <dt>Funding</dt>
            <dd>{s.funding_type ?? 'Not listed'}</dd>
            <dt>Amount</dt>
            <dd>
              {s.funding_amount_min || s.funding_amount_max
                ? `${s.funding_currency ?? ''} ${s.funding_amount_min ?? '?'} – ${s.funding_amount_max ?? '?'}`
                : 'Not listed'}
            </dd>
            <dt>Deadline</dt>
            <dd>{s.deadline ? s.deadline.toISOString().slice(0, 10) : 'Not listed'}</dd>
          </dl>

          <div style={{ marginTop: '1rem' }}>
            <LastVerified date={s.last_verified_at} />
          </div>

          {s.application_url && s.verification_status === 'verified' ? (
            <p style={{ marginTop: '1rem' }}>
              <a className="button" href={s.application_url} target="_blank" rel="noopener noreferrer">
                Apply officially
              </a>
            </p>
          ) : (
            <p className="muted" style={{ marginTop: '1rem' }}>
              Official application URL not verified yet.
              {s.official_url ? (
                <>
                  {' '}
                  <a href={s.official_url} target="_blank" rel="noopener noreferrer">
                    Visit official website
                  </a>
                </>
              ) : null}
            </p>
          )}
        </aside>
      </div>
    </div>
  );
}
