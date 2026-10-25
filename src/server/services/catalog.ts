import { eq, ilike, or, and, sql, asc } from 'drizzle-orm';
import { db, schema } from '../db/index.js';

export async function listUniversities(
  query?: string,
  country?: string,
  limit = 50,
  offset = 0,
) {
  const conditions = [];
  if (query) {
    conditions.push(
      or(
        ilike(schema.universities.name, `%${query}%`),
        ilike(schema.universities.city, `%${query}%`),
      ),
    );
  }
  if (country) conditions.push(eq(schema.universities.country, country));

  return db()
    .select()
    .from(schema.universities)
    .where(conditions.length ? and(...conditions) : undefined)
    .orderBy(
      sql`${schema.universities.ranking} asc nulls last`,
      asc(schema.universities.name),
    )
    .limit(Math.min(limit, 100))
    .offset(Math.max(0, offset));
}

export async function getUniversityBySlug(slug: string) {
  return db()
    .select()
    .from(schema.universities)
    .where(eq(schema.universities.slug, slug))
    .limit(1)
    .then((rows) => rows[0] ?? null);
}

export async function getAdmissionsGuide(universityId: string) {
  return db()
    .select()
    .from(schema.admissionsGuides)
    .where(eq(schema.admissionsGuides.university_id, universityId))
    .limit(1)
    .then((rows) => rows[0] ?? null);
}

export async function listScholarships(
  query?: string,
  country?: string,
  limit = 50,
  offset = 0,
) {
  const conditions = [];
  if (query) {
    conditions.push(
      or(
        ilike(schema.scholarships.name, `%${query}%`),
        ilike(schema.scholarships.provider, `%${query}%`),
      ),
    );
  }
  if (country) conditions.push(eq(schema.scholarships.country, country));

  return db()
    .select()
    .from(schema.scholarships)
    .where(conditions.length ? and(...conditions) : undefined)
    .orderBy(
      sql`${schema.scholarships.deadline} asc nulls last`,
      asc(schema.scholarships.name),
    )
    .limit(Math.min(limit, 100))
    .offset(Math.max(0, offset));
}

export async function getScholarshipBySlug(slug: string) {
  return db()
    .select()
    .from(schema.scholarships)
    .where(eq(schema.scholarships.slug, slug))
    .limit(1)
    .then((rows) => rows[0] ?? null);
}

export async function listOpportunities(query?: string, limit = 50, offset = 0) {
  const conditions = [];
  if (query) {
    conditions.push(
      or(
        ilike(schema.opportunities.title, `%${query}%`),
        ilike(schema.opportunities.organization, `%${query}%`),
      ),
    );
  }

  return db()
    .select()
    .from(schema.opportunities)
    .where(conditions.length ? and(...conditions) : undefined)
    .orderBy(
      sql`${schema.opportunities.deadline} asc nulls last`,
      asc(schema.opportunities.title),
    )
    .limit(Math.min(limit, 100))
    .offset(Math.max(0, offset));;
}

export async function catalogCounts() {
  const [u] = await db().select({ n: sql<number>`count(*)::int` }).from(schema.universities);
  const [s] = await db().select({ n: sql<number>`count(*)::int` }).from(schema.scholarships);
  const [o] = await db().select({ n: sql<number>`count(*)::int` }).from(schema.opportunities);
  return { universities: u?.n ?? 0, scholarships: s?.n ?? 0, opportunities: o?.n ?? 0 };
}
