import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { and, desc, eq, inArray, ne, notInArray } from 'drizzle-orm';

import { db, schema } from '../db/index.js';
import universitiesJson from '../../../public/data/universities.json';
import scholarshipsJson from '../../../public/data/scholarships.json';
import internshipsJson from '../../../public/data/internships.json';

const BUNDLED = {
  universities: universitiesJson as unknown as any[],
  scholarships: scholarshipsJson as unknown as any[],
  internships: internshipsJson as unknown as any[],
};

type SyncCounts = {
  universities_added: number;
  universities_updated: number;
  scholarships_added: number;
  scholarships_updated: number;
  opportunities_added: number;
  opportunities_updated: number;
  admissions_guides_added: number;
  admissions_guides_updated: number;
  errors: string[];
  skipped?: boolean;
};

// In a Next.js/Vercel deployment the JSON is bundled, so no fs access is needed.
// The fs fallback only matters for raw-node runs where the bundle is absent.
async function readJson<T>(name: string, fallback: T): Promise<T> {
  const bundled =
    name === 'universities.json'
      ? BUNDLED.universities
      : name === 'scholarships.json'
        ? BUNDLED.scholarships
        : name === 'internships.json'
          ? BUNDLED.internships
          : undefined;

  if (bundled) return bundled as T;

  for (const dir of [
    join(process.cwd(), 'public', 'data'),
    join(process.cwd(), 'dist', 'data'),
  ]) {
    try {
      const raw = await readFile(join(dir, name), 'utf8');
      return JSON.parse(raw) as T;
    } catch {
      // try next location
    }
  }
  return fallback;
}

const toDate = (value: unknown): Date | null => {
  if (!value) return null;
  const d = new Date(String(value));
  return Number.isNaN(d.getTime()) ? null : d;
};

const toNum = (value: unknown): string | null => {
  if (value === null || value === undefined || value === '') return null;
  const n = Number(value);
  return Number.isFinite(n) ? String(n) : null;
};

const slugify = (value: string) =>
  value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 200);

/**
 * The legacy catalog contains many rows that describe the same program under
 * different ids. Collapse them to one record per natural key (first row wins).
 */
function dedupeBy<T>(rows: T[], keyFn: (row: T) => string): T[] {
  const seen = new Set<string>();
  const out: T[] = [];
  for (const row of rows) {
    const key = keyFn(row);
    if (!key || seen.has(key)) continue;
    seen.add(key);
    out.push(row);
  }
  return out;
}

export async function syncCatalog(): Promise<SyncCounts> {
  const counts: SyncCounts = {
    universities_added: 0,
    universities_updated: 0,
    scholarships_added: 0,
    scholarships_updated: 0,
    opportunities_added: 0,
    opportunities_updated: 0,
    admissions_guides_added: 0,
    admissions_guides_updated: 0,
    errors: [],
  };

  const run = await db()
    .insert(schema.catalogSyncRuns)
    .values({ status: 'running' })
    .returning({ id: schema.catalogSyncRuns.id })
    .then((rows) => rows[0]);

  try {
    // --- Universities ---
    const universities = dedupeBy(
      await readJson<any[]>('universities.json', []),
      (u) => slugify(String(u.name ?? u.id ?? '')),
    );
    const uniSlugs = universities
      .map((u) => slugify(String(u.name ?? u.id ?? '')))
      .filter(Boolean);

    const existingUnis = uniSlugs.length
      ? new Set(
          await db()
            .select({ slug: schema.universities.slug })
            .from(schema.universities)
            .where(inArray(schema.universities.slug, uniSlugs))
            .then((rows) => rows.map((r) => r.slug)),
        )
      : new Set<string>();

    // Which universities already have a starter admissions guide row?
    const existingGuideUnis = uniSlugs.length
      ? new Set(
          await db()
            .select({ university_id: schema.admissionsGuides.university_id })
            .from(schema.admissionsGuides)
            .innerJoin(
              schema.universities,
              eq(schema.admissionsGuides.university_id, schema.universities.id),
            )
            .where(inArray(schema.universities.slug, uniSlugs))
            .then((rows) => rows.map((r) => r.university_id)),
        )
      : new Set<string>();

    for (const u of universities) {
      const slug = slugify(String(u.name ?? u.id ?? ''));
      if (!slug) continue;
      const values = {
        slug,
        name: String(u.name ?? slug),
        country: String(u.country ?? 'Unknown'),
        city: u.city ? String(u.city) : null,
        website: u.website ? String(u.website) : null,
        admissions_url: u.applicationUrl ? String(u.applicationUrl) : null,
        application_portal_url: u.applicationUrl ? String(u.applicationUrl) : null,
        description: u.description ? String(u.description) : null,
        type: u.type ? String(u.type) : null,
        ranking: Number.isFinite(Number(u.ranking)) ? Number(u.ranking) : null,
        acceptance_rate: u.acceptanceRate
          ? toNum(String(u.acceptanceRate).replace('%', ''))
          : null,
        tuition_min: toNum(u.tuitionMin),
        tuition_max: toNum(u.tuitionMax),
        tuition_currency: u.tuitionCurrency ? String(u.tuitionCurrency) : 'USD',
        has_on_campus_housing: Boolean(u.hasOnCampusHousing),
        source_url: u.website ? String(u.website) : null,
        last_verified_at: toDate(u.lastVerified),
        verification_status: 'needs_review' as const,
        verification_notes: 'Imported from legacy catalog; official source not independently verified.',
        data_origin: 'import',
        is_demo: false,
        updated_at: new Date(),
      };

      const [saved] = await db()
        .insert(schema.universities)
        .values(values)
        .onConflictDoUpdate({
          target: schema.universities.slug,
          set: {
            name: values.name,
            country: values.country,
            city: values.city,
            website: values.website,
            admissions_url: values.admissions_url,
            application_portal_url: values.application_portal_url,
            description: values.description,
            type: values.type,
            ranking: values.ranking,
            acceptance_rate: values.acceptance_rate,
            tuition_min: values.tuition_min,
            tuition_max: values.tuition_max,
            tuition_currency: values.tuition_currency,
            has_on_campus_housing: values.has_on_campus_housing,
            source_url: values.source_url,
            last_verified_at: values.last_verified_at,
            updated_at: values.updated_at,
          },
          // Never overwrite a record an editor has verified.
          setWhere: ne(schema.universities.verification_status, 'verified'),
        })
        .returning({ id: schema.universities.id });

      if (existingUnis.has(slug)) counts.universities_updated += 1;
      else counts.universities_added += 1;

      if (saved?.id) {
        const applicationUrl =
          (u.applicationUrl ? String(u.applicationUrl) : null) ??
          (u.website ? String(u.website) : null);

        const guide = {
          university_id: saved.id,
          where_to_apply: applicationUrl
            ? `Submit your application through the university's official application portal: ${applicationUrl}`
            : null,
          application_platform: null,
          application_fee: null,
          application_fee_currency: null,
          deadlines_text: null,
          requirements_text: null,
          documents_text: null,
          personal_statement_text: null,
          recommendations_text: null,
          tests_text: null,
          interview_text: null,
          portfolio_text: null,
          timeline: null,
          source_url: applicationUrl,
          last_verified_at: null,
          verification_status: 'needs_review' as const,
          updated_at: new Date(),
        };

        await db()
          .insert(schema.admissionsGuides)
          .values(guide)
          .onConflictDoUpdate({
            target: schema.admissionsGuides.university_id,
            set: {
              where_to_apply: guide.where_to_apply,
              source_url: guide.source_url,
              updated_at: guide.updated_at,
            },
            // Preserve guides that have been verified by a human.
            setWhere: ne(schema.admissionsGuides.verification_status, 'verified'),
          });

        if (existingGuideUnis.has(saved.id)) counts.admissions_guides_updated += 1;
        else counts.admissions_guides_added += 1;
      }
    }

    // Mirror, don't accumulate: drop imported rows that are no longer in the source.
    // Records verified by a human are always preserved.
    if (uniSlugs.length > 0) {
      await db()
        .delete(schema.universities)
        .where(
          and(
            notInArray(schema.universities.slug, uniSlugs),
            eq(schema.universities.data_origin, 'import'),
            ne(schema.universities.verification_status, 'verified'),
          ),
        );
    }

    // --- Scholarships ---
    const scholarships = dedupeBy(
      await readJson<any[]>('scholarships.json', []),
      (s) => slugify(String(s.name ?? s.id ?? '')),
    );
    const schSlugs = scholarships
      .map((s) => slugify(String(s.name ?? s.id ?? '')))
      .filter(Boolean);
    const existingSch = schSlugs.length
      ? new Set(
          await db()
            .select({ slug: schema.scholarships.slug })
            .from(schema.scholarships)
            .where(inArray(schema.scholarships.slug, schSlugs))
            .then((rows) => rows.map((r) => r.slug)),
        )
      : new Set<string>();

    for (const s of scholarships) {
      const slug = slugify(String(s.name ?? s.id ?? ''));
      if (!slug) continue;
      const values = {
        slug,
        name: String(s.name ?? slug),
        provider: s.provider ? String(s.provider) : null,
        country: s.country ? String(s.country) : null,
        description: s.description ? String(s.description) : null,
        degree_level: s.targetDegree ? String(s.targetDegree) : null,
        funding_type: s.fundingCoverage ? String(s.fundingCoverage) : null,
        funding_amount_min: toNum(s.amountMin),
        funding_amount_max: toNum(s.amountMax),
        funding_currency: s.currency ? String(s.currency) : 'USD',
        deadline: toDate(s.applicationDeadline),
        official_url: s.officialWebsite ? String(s.officialWebsite) : null,
        application_url: s.applicationUrl ? String(s.applicationUrl) : null,
        eligibility_text: Array.isArray(s.eligibilityCriteria)
          ? s.eligibilityCriteria.join('\n')
          : s.eligibilityCriteria
            ? String(s.eligibilityCriteria)
            : null,
        documents_text: Array.isArray(s.applicationSteps)
          ? s.applicationSteps.join('\n')
          : null,
        source_url: s.officialWebsite ? String(s.officialWebsite) : null,
        last_verified_at: toDate(s.lastVerified),
        verification_status: 'needs_review' as const,
        verification_notes: 'Imported from legacy catalog; official source not independently verified.',
        data_origin: 'import',
        is_demo: false,
        updated_at: new Date(),
      };

      await db()
        .insert(schema.scholarships)
        .values(values)
        .onConflictDoUpdate({
          target: schema.scholarships.slug,
          set: {
            name: values.name,
            provider: values.provider,
            country: values.country,
            description: values.description,
            degree_level: values.degree_level,
            funding_type: values.funding_type,
            funding_amount_min: values.funding_amount_min,
            funding_amount_max: values.funding_amount_max,
            funding_currency: values.funding_currency,
            deadline: values.deadline,
            official_url: values.official_url,
            application_url: values.application_url,
            eligibility_text: values.eligibility_text,
            documents_text: values.documents_text,
            source_url: values.source_url,
            last_verified_at: values.last_verified_at,
            updated_at: values.updated_at,
          },
          // Never overwrite a record an editor has verified.
          setWhere: ne(schema.scholarships.verification_status, 'verified'),
        });

      if (existingSch.has(slug)) counts.scholarships_updated += 1;
      else counts.scholarships_added += 1;
    }

    if (schSlugs.length > 0) {
      await db()
        .delete(schema.scholarships)
        .where(
          and(
            notInArray(schema.scholarships.slug, schSlugs),
            eq(schema.scholarships.data_origin, 'import'),
            ne(schema.scholarships.verification_status, 'verified'),
          ),
        );
    }

    // --- Opportunities (internships + more) ---
    const opportunities = dedupeBy(
      await readJson<any[]>('internships.json', []),
      (o) => slugify(String(o.name ?? o.id ?? '')),
    );
    const oppSlugs = opportunities
      .map((o) => slugify(String(o.name ?? o.id ?? '')))
      .filter(Boolean);
    const existingOpp = oppSlugs.length
      ? new Set(
          await db()
            .select({ slug: schema.opportunities.slug })
            .from(schema.opportunities)
            .where(inArray(schema.opportunities.slug, oppSlugs))
            .then((rows) => rows.map((r) => r.slug)),
        )
      : new Set<string>();

    for (const o of opportunities) {
      const slug = slugify(String(o.name ?? o.id ?? ''));
      if (!slug) continue;
      const values = {
        slug,
        title: String(o.name ?? slug),
        type: 'internship' as const,
        organization: o.provider ? String(o.provider) : null,
        country: o.country ? String(o.country) : null,
        is_remote: Boolean(o.isRemote),
        description: o.description ? String(o.description) : null,
        stipend: o.stipend ? String(o.stipend) : null,
        duration: o.duration ? String(o.duration) : null,
        deadline: toDate(o.applicationDeadline),
        official_url: o.officialWebsite ? String(o.officialWebsite) : null,
        application_url: o.applicationUrl ? String(o.applicationUrl) : null,
        eligibility_text: Array.isArray(o.eligibleMajors)
          ? o.eligibleMajors.join(', ')
          : null,
        source_url: o.officialWebsite ? String(o.officialWebsite) : null,
        last_verified_at: toDate(o.lastVerified),
        verification_status: 'needs_review' as const,
        verification_notes: 'Imported from legacy catalog; official source not independently verified.',
        data_origin: 'import',
        is_demo: false,
        updated_at: new Date(),
      };

      await db()
        .insert(schema.opportunities)
        .values(values)
        .onConflictDoUpdate({
          target: schema.opportunities.slug,
          set: {
            title: values.title,
            organization: values.organization,
            country: values.country,
            is_remote: values.is_remote,
            description: values.description,
            stipend: values.stipend,
            duration: values.duration,
            deadline: values.deadline,
            official_url: values.official_url,
            application_url: values.application_url,
            eligibility_text: values.eligibility_text,
            source_url: values.source_url,
            last_verified_at: values.last_verified_at,
            updated_at: values.updated_at,
          },
          // Never overwrite a record an editor has verified.
          setWhere: ne(schema.opportunities.verification_status, 'verified'),
        });

      if (existingOpp.has(slug)) counts.opportunities_updated += 1;
      else counts.opportunities_added += 1;
    }

    if (oppSlugs.length > 0) {
      await db()
        .delete(schema.opportunities)
        .where(
          and(
            notInArray(schema.opportunities.slug, oppSlugs),
            eq(schema.opportunities.data_origin, 'import'),
            ne(schema.opportunities.verification_status, 'verified'),
          ),
        );
    }

    await db()
      .update(schema.catalogSyncRuns)
      .set({
        status: 'completed',
        finished_at: new Date(),
        universities_added: counts.universities_added,
        universities_updated: counts.universities_updated,
        scholarships_added: counts.scholarships_added,
        scholarships_updated: counts.scholarships_updated,
        opportunities_added: counts.opportunities_added,
        opportunities_updated: counts.opportunities_updated,
        admissions_guides_added: counts.admissions_guides_added,
        admissions_guides_updated: counts.admissions_guides_updated,
        errors: counts.errors,
      })
      .where(eq(schema.catalogSyncRuns.id, run.id));

    return counts;
  } catch (error: any) {
    counts.errors.push(String(error?.message ?? error));
    await db()
      .update(schema.catalogSyncRuns)
      .set({
        status: 'failed',
        finished_at: new Date(),
        errors: counts.errors,
      })
      .where(eq(schema.catalogSyncRuns.id, run.id));
    return counts;
  }
}

export type FreshnessResult =
  | { skipped: true; reason: string }
  | { skipped: false; counts: SyncCounts };

let inflight: Promise<SyncCounts> | null = null;

/**
 * Best-effort self-healing sync used by catalog pages.
 * Runs at most once per `maxAgeHours` so pages stay fast, and de-duplicates
 * concurrent calls within a single server instance.
 */
export async function ensureCatalogFresh(maxAgeHours = 6): Promise<FreshnessResult> {
  if (!process.env.DATABASE_URL_UNPOOLED) {
    return { skipped: true, reason: 'DATABASE_URL_UNPOOLED is not set' };
  }

  try {
    const [last] = await db()
      .select({ started_at: schema.catalogSyncRuns.started_at })
      .from(schema.catalogSyncRuns)
      .where(eq(schema.catalogSyncRuns.status, 'completed'))
      .orderBy(desc(schema.catalogSyncRuns.started_at))
      .limit(1);

    if (last && Date.now() - last.started_at.getTime() < maxAgeHours * 3600_000) {
      return { skipped: true, reason: 'Catalog is fresh' };
    }

    if (!inflight) {
      inflight = syncCatalog().finally(() => {
        inflight = null;
      });
    }

    return { skipped: false, counts: await inflight };
  } catch (error: any) {
    return { skipped: true, reason: String(error?.message ?? error) };
  }
}
