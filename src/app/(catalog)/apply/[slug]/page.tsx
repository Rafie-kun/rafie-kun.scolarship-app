import Link from 'next/link';
import { notFound } from 'next/navigation';

import { getAdmissionsGuide, getUniversityBySlug } from '@/server/services/catalog';
import { VerificationBadge, LastVerified } from '@/components/catalog/VerificationBadge';

export const dynamic = 'force-dynamic';

type TimelineStep = {
  label?: string;
  date?: string;
  note?: string;
};

function GuideSection({
  title,
  body,
  empty,
}: {
  title: string;
  body?: string | null;
  empty: string;
}) {
  return (
    <section style={{ marginTop: '1.25rem' }}>
      <h3>{title}</h3>
      {body ? (
        <p style={{ whiteSpace: 'pre-line', margin: 0 }}>{body}</p>
      ) : (
        <p className="muted" style={{ margin: 0 }}>
          {empty}
        </p>
      )}
    </section>
  );
}

function asTimeline(value: unknown): TimelineStep[] {
  if (!Array.isArray(value)) return [];
  return value
    .filter((step): step is TimelineStep => !!step && typeof step === 'object')
    .map((step) => ({
      label: typeof step.label === 'string' ? step.label : undefined,
      date: typeof step.date === 'string' ? step.date : undefined,
      note: typeof step.note === 'string' ? step.note : undefined,
    }));
}

function money(amount: string | null, currency: string | null) {
  if (!amount) return null;
  const value = Number(amount);
  if (!Number.isFinite(value)) return null;
  const formatted = value.toLocaleString('en-US', { maximumFractionDigits: 2 });
  return `${currency ?? ''} ${formatted}`.trim();
}

export default async function ApplyGuidePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const university = await getUniversityBySlug(slug);
  if (!university) notFound();

  const guide = await getAdmissionsGuide(university.id);
  const timeline = asTimeline(guide?.timeline);
  const verified = guide?.verification_status === 'verified';

  const applyUrl =
    university.application_portal_url ?? university.admissions_url ?? guide?.source_url ?? null;

  return (
    <div className="container">
      <Link href="/apply" className="navlink">
        ← All universities
      </Link>

      <div
        style={{
          display: 'flex',
          gap: '0.75rem',
          alignItems: 'center',
          flexWrap: 'wrap',
          margin: '0.75rem 0',
        }}
      >
        <h1 style={{ margin: 0 }}>How to apply to {university.name}</h1>
        <VerificationBadge status={guide?.verification_status ?? university.verification_status} />
      </div>

      <p className="muted">
        {university.city ? `${university.city}, ` : ''}
        {university.country}
        {university.type ? ` · ${university.type}` : ''}
      </p>

      {!verified && (
        <div className="card" role="note" style={{ borderColor: 'var(--amber)' }}>
          <strong>This guide is not fully verified yet.</strong>
          <p className="muted" style={{ marginBottom: 0 }}>
            University-specific sections below come from our imported catalog and still
            need review against the official admissions website. The general guidance
            marked “General guidance” is not university-specific. Always confirm on the
            official site before you pay a fee or submit documents.
          </p>
        </div>
      )}

      <div className="grid" style={{ gridTemplateColumns: '2fr 1fr', marginTop: '1.25rem' }}>
        <div>
          <section className="card">
            <h2>Where to apply</h2>
            {guide?.where_to_apply ? (
              <p style={{ whiteSpace: 'pre-line' }}>{guide.where_to_apply}</p>
            ) : (
              <p className="muted">
                The official application portal has not been verified yet.
              </p>
            )}

            <dl className="kv" style={{ marginTop: '0.75rem' }}>
              <dt>Application platform</dt>
              <dd>{guide?.application_platform ?? 'Not verified yet'}</dd>
              <dt>Application fee</dt>
              <dd>
                {money(guide?.application_fee ?? null, guide?.application_fee_currency ?? null) ??
                  'Not verified yet'}
              </dd>
              <dt>Deadlines</dt>
              <dd>{guide?.deadlines_text ?? 'Not verified yet'}</dd>
            </dl>

            {applyUrl && (
              <p style={{ marginTop: '1rem' }}>
                <a
                  className="button"
                  href={applyUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Open official application site
                </a>
              </p>
            )}
          </section>

          <section className="card" style={{ marginTop: '1rem' }}>
            <h2>What the application needs</h2>

            <GuideSection
              title="Academic requirements"
              body={guide?.requirements_text}
              empty="Entry requirements (GPA, curriculum, subject prerequisites) have not been verified yet."
            />
            <GuideSection
              title="Documents"
              body={guide?.documents_text}
              empty="The official document list has not been verified yet."
            />
            <GuideSection
              title="Personal statement / essays"
              body={guide?.personal_statement_text}
              empty="Essay prompts and word limits have not been verified yet."
            />
            <GuideSection
              title="Recommendations"
              body={guide?.recommendations_text}
              empty="The number and type of recommendation letters have not been verified yet."
            />
            <GuideSection
              title="Tests"
              body={guide?.tests_text}
              empty="Required tests and minimum scores have not been verified yet."
            />
            <GuideSection
              title="Interview"
              body={guide?.interview_text}
              empty="Interview format and timing have not been verified yet."
            />
            <GuideSection
              title="Portfolio / auditions"
              body={guide?.portfolio_text}
              empty="Portfolio or audition requirements have not been verified yet (many programs do not require one)."
            />
          </section>

          <section className="card" style={{ marginTop: '1rem' }}>
            <h2>Timeline</h2>
            {timeline.length > 0 ? (
              <ol style={{ margin: 0, paddingLeft: '1.25rem' }}>
                {timeline.map((step, index) => (
                  <li key={index} style={{ marginBottom: '0.5rem' }}>
                    <strong>{step.label ?? 'Step'}</strong>
                    {step.date ? ` — ${step.date}` : ''}
                    {step.note ? <div className="muted">{step.note}</div> : null}
                  </li>
                ))}
              </ol>
            ) : (
              <p className="muted">
                University-specific dates have not been verified yet. Use the official
                deadlines above once available.
              </p>
            )}

            <h3 style={{ marginTop: '1.25rem' }}>General guidance: work backwards from the deadline</h3>
            <p className="muted">
              General guidance — not university-specific. Adjust each step to the official
              deadline you confirm on the admissions website.
            </p>
            <ol style={{ margin: 0, paddingLeft: '1.25rem' }}>
              <li>12+ months before: shortlist programs and check eligibility and funding.</li>
              <li>10–12 months before: register for required tests and book test dates.</li>
              <li>8–10 months before: ask recommenders early and share your CV and goals.</li>
              <li>6–8 months before: draft essays, then revise with feedback from a teacher or mentor.</li>
              <li>3–4 months before: request official transcripts and translations.</li>
              <li>1–2 months before: proofread every document, pay the fee, and submit ahead of the deadline.</li>
              <li>After submitting: track your portal, prepare for interviews, and apply for scholarships and visas.</li>
            </ol>
          </section>
        </div>

        <aside>
          <section className="card">
            <h2>University facts</h2>
            <dl className="kv">
              <dt>Country</dt>
              <dd>{university.country}</dd>
              <dt>City</dt>
              <dd>{university.city ?? 'Not listed'}</dd>
              <dt>Type</dt>
              <dd>{university.type ?? 'Not listed'}</dd>
              <dt>Ranking</dt>
              <dd>{university.ranking ?? 'Not listed'}</dd>
              <dt>Acceptance rate</dt>
              <dd>{university.acceptance_rate ? `${university.acceptance_rate}%` : 'Not listed'}</dd>
              <dt>Tuition</dt>
              <dd>
                {university.tuition_min || university.tuition_max
                  ? `${university.tuition_currency ?? ''} ${university.tuition_min ?? '?'} – ${university.tuition_max ?? '?'}`
                  : 'Not listed'}
              </dd>
              <dt>On-campus housing</dt>
              <dd>
                {university.has_on_campus_housing === null
                  ? 'Not listed'
                  : university.has_on_campus_housing
                    ? 'Yes'
                    : 'No'}
              </dd>
            </dl>

            <div style={{ marginTop: '1rem' }}>
              <LastVerified date={guide?.last_verified_at ?? university.last_verified_at} />
            </div>

            {university.website && (
              <p className="muted" style={{ marginTop: '0.5rem' }}>
                <a href={university.website} target="_blank" rel="noopener noreferrer">
                  Official university website
                </a>
              </p>
            )}
          </section>

          <section className="card" style={{ marginTop: '1rem' }}>
            <h2>Helpful next steps</h2>
            <ul style={{ margin: 0, paddingLeft: '1.25rem' }} className="muted">
              <li>
                <Link href="/scholarships">Find scholarships</Link> you can use at this university.
              </li>
              <li>
                <Link href="/opportunities">Find internships and programs</Link> that strengthen your application.
              </li>
              <li>Email the admissions office if any requirement is unclear — ask for the answer in writing.</li>
              <li>Never pay a fee through a third-party site; use the official portal only.</li>
            </ul>
          </section>

          {guide?.source_url && (
            <p className="muted" style={{ marginTop: '0.75rem' }}>
              Source:{' '}
              <a href={guide.source_url} target="_blank" rel="noopener noreferrer">
                official admissions page
              </a>
            </p>
          )}
        </aside>
      </div>
    </div>
  );
}
