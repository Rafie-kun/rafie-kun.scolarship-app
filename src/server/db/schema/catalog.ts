// Catalog schema (universities, programs, scholarships, opportunities, admissions guides)
// Extended in Phase 6/7/15; kept minimal-but-honest for the auto-sync pipeline.
// Every record carries source + verification metadata (SPEC §36).

import {
  pgTable,
  uuid,
  varchar,
  text,
  timestamp,
  pgEnum,
  boolean,
  integer,
  numeric,
  jsonb,
  index,
  unique,
} from 'drizzle-orm/pg-core';

export const verificationStatus = pgEnum('catalog_verification_status', [
  'verified',
  'needs_review',
  'expired',
  'estimated',
]);

export const opportunityType = pgEnum('opportunity_type', [
  'internship',
  'research',
  'summer_program',
  'fellowship',
  'competition',
  'volunteer',
  'academic',
  'student_program',
]);

export const universities = pgTable(
  'universities',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    slug: varchar('slug', { length: 255 }).notNull().unique(),
    name: varchar('name', { length: 255 }).notNull(),
    country: varchar('country', { length: 128 }).notNull(),
    city: varchar('city', { length: 128 }),
    website: varchar('website', { length: 512 }),
    admissions_url: varchar('admissions_url', { length: 512 }),
    application_portal_url: varchar('application_portal_url', { length: 512 }),
    description: text('description'),
    type: varchar('type', { length: 64 }),
    ranking: integer('ranking'),
    acceptance_rate: numeric('acceptance_rate', { precision: 5, scale: 2 }),
    tuition_min: numeric('tuition_min', { precision: 14, scale: 2 }),
    tuition_max: numeric('tuition_max', { precision: 14, scale: 2 }),
    tuition_currency: varchar('tuition_currency', { length: 3 }),
    has_on_campus_housing: boolean('has_on_campus_housing'),
    // verification
    source_id: uuid('source_id'),
    source_url: varchar('source_url', { length: 512 }),
    last_verified_at: timestamp('last_verified_at', { withTimezone: true }),
    verification_status: verificationStatus('verification_status')
      .notNull()
      .default('needs_review'),
    verification_notes: text('verification_notes'),
    data_origin: varchar('data_origin', { length: 32 }).notNull().default('import'),
    is_demo: boolean('is_demo').notNull().default(false),
    created_at: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updated_at: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({
    nameIdx: index('universities_name_idx').on(t.name),
    countryIdx: index('universities_country_idx').on(t.country),
    statusIdx: index('universities_status_idx').on(t.verification_status),
  }),
);

export const scholarships = pgTable(
  'scholarships',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    slug: varchar('slug', { length: 255 }).notNull().unique(),
    name: varchar('name', { length: 255 }).notNull(),
    provider: varchar('provider', { length: 255 }),
    country: varchar('country', { length: 128 }),
    university_id: uuid('university_id').references(() => universities.id, {
      onDelete: 'set null',
    }),
    description: text('description'),
    degree_level: varchar('degree_level', { length: 64 }),
    funding_type: varchar('funding_type', { length: 64 }),
    funding_amount_min: numeric('funding_amount_min', { precision: 14, scale: 2 }),
    funding_amount_max: numeric('funding_amount_max', { precision: 14, scale: 2 }),
    funding_currency: varchar('funding_currency', { length: 3 }),
    deadline: timestamp('deadline', { withTimezone: true }),
    official_url: varchar('official_url', { length: 512 }),
    application_url: varchar('application_url', { length: 512 }),
    eligibility_text: text('eligibility_text'),
    documents_text: text('documents_text'),
    // verification
    source_id: uuid('source_id'),
    source_url: varchar('source_url', { length: 512 }),
    last_verified_at: timestamp('last_verified_at', { withTimezone: true }),
    verification_status: verificationStatus('verification_status')
      .notNull()
      .default('needs_review'),
    verification_notes: text('verification_notes'),
    data_origin: varchar('data_origin', { length: 32 }).notNull().default('import'),
    is_demo: boolean('is_demo').notNull().default(false),
    created_at: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updated_at: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({
    nameIdx: index('scholarships_name_idx').on(t.name),
    countryIdx: index('scholarships_country_idx').on(t.country),
    deadlineIdx: index('scholarships_deadline_idx').on(t.deadline),
    statusIdx: index('scholarships_status_idx').on(t.verification_status),
  }),
);

export const opportunities = pgTable(
  'opportunities',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    slug: varchar('slug', { length: 255 }).notNull().unique(),
    title: varchar('title', { length: 255 }).notNull(),
    type: opportunityType('type').notNull().default('internship'),
    organization: varchar('organization', { length: 255 }),
    country: varchar('country', { length: 128 }),
    is_remote: boolean('is_remote').notNull().default(false),
    description: text('description'),
    stipend: varchar('stipend', { length: 128 }),
    duration: varchar('duration', { length: 128 }),
    deadline: timestamp('deadline', { withTimezone: true }),
    official_url: varchar('official_url', { length: 512 }),
    application_url: varchar('application_url', { length: 512 }),
    eligibility_text: text('eligibility_text'),
    // verification
    source_id: uuid('source_id'),
    source_url: varchar('source_url', { length: 512 }),
    last_verified_at: timestamp('last_verified_at', { withTimezone: true }),
    verification_status: verificationStatus('verification_status')
      .notNull()
      .default('needs_review'),
    verification_notes: text('verification_notes'),
    data_origin: varchar('data_origin', { length: 32 }).notNull().default('import'),
    is_demo: boolean('is_demo').notNull().default(false),
    created_at: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updated_at: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({
    titleIdx: index('opportunities_title_idx').on(t.title),
    typeIdx: index('opportunities_type_idx').on(t.type),
    statusIdx: index('opportunities_status_idx').on(t.verification_status),
  }),
);

// "How to apply to university" content, one row per university (or program later).
export const admissionsGuides = pgTable(
  'admissions_guides',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    university_id: uuid('university_id')
      .notNull()
      .unique()
      .references(() => universities.id, { onDelete: 'cascade' }),
    where_to_apply: text('where_to_apply'),
    application_platform: varchar('application_platform', { length: 128 }),
    application_fee: numeric('application_fee', { precision: 14, scale: 2 }),
    application_fee_currency: varchar('application_fee_currency', { length: 3 }),
    deadlines_text: text('deadlines_text'),
    requirements_text: text('requirements_text'),
    documents_text: text('documents_text'),
    personal_statement_text: text('personal_statement_text'),
    recommendations_text: text('recommendations_text'),
    tests_text: text('tests_text'),
    interview_text: text('interview_text'),
    portfolio_text: text('portfolio_text'),
    timeline: jsonb('timeline'),
    source_url: varchar('source_url', { length: 512 }),
    last_verified_at: timestamp('last_verified_at', { withTimezone: true }),
    verification_status: verificationStatus('verification_status')
      .notNull()
      .default('needs_review'),
    created_at: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updated_at: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({
    universityIdx: index('admissions_guides_university_idx').on(t.university_id),
  }),
);

// Sync run log so "did the DB auto-update?" is answerable and idempotent.
export const catalogSyncRuns = pgTable(
  'catalog_sync_runs',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    started_at: timestamp('started_at', { withTimezone: true }).notNull().defaultNow(),
    finished_at: timestamp('finished_at', { withTimezone: true }),
    status: varchar('status', { length: 32 }).notNull().default('running'),
    universities_added: integer('universities_added').notNull().default(0),
    universities_updated: integer('universities_updated').notNull().default(0),
    scholarships_added: integer('scholarships_added').notNull().default(0),
    scholarships_updated: integer('scholarships_updated').notNull().default(0),
    opportunities_added: integer('opportunities_added').notNull().default(0),
    opportunities_updated: integer('opportunities_updated').notNull().default(0),
    admissions_guides_added: integer('admissions_guides_added').notNull().default(0),
    admissions_guides_updated: integer('admissions_guides_updated').notNull().default(0),
    errors: jsonb('errors'),
  },
  (t) => ({
    startedIdx: index('catalog_sync_runs_started_idx').on(t.started_at),
  }),
);
