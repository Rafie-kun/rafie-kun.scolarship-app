// Identity & governance schema (Phase 2, SPEC §37)
// Tables: users, accounts, sessions, verification_tokens, admin_users, audit_logs,
// sources, field_sources, verification_records, record_revisions, user_reports,
// data_imports, data_import_rows, import_schedules.
// Catalog/planning tables are added in later phases (6, 7, etc.).

import {
  pgTable,
  uuid,
  varchar,
  text,
  timestamp,
  pgEnum,
  boolean,
  integer,
  jsonb,
  primaryKey,
  foreignKey,
  unique,
  index,
} from 'drizzle-orm/pg-core';
import { eq } from 'drizzle-orm';

export const userStatusEnum = pgEnum('user_status', ['active', 'disabled', 'deleted']);
export const userRoleEnum = pgEnum('user_role', ['user', 'editor', 'admin']);
export const verificationStatusEnum = pgEnum('verification_status', [
  'verified',
  'needs_review',
  'expired',
  'estimated',
]);
export const importStatusEnum = pgEnum('import_status', [
  'pending',
  'running',
  'completed',
  'failed',
  'rolled_back',
]);

// --- Identity ---

export const users = pgTable(
  'users',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    email: varchar('email', { length: 255 }).notNull().unique(),
    email_verified_at: timestamp('email_verified_at', { withTimezone: true }),
    password_hash: varchar('password_hash', { length: 255 }),
    status: userStatusEnum('status').notNull().default('active'),
    locale: varchar('locale', { length: 10 }).notNull().default('en'),
    timezone: varchar('timezone', { length: 64 }).notNull().default('UTC'),
    created_at: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updated_at: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
    deleted_at: timestamp('deleted_at', { withTimezone: true }),
  },
  (t) => ({
    emailIdx: index('users_email_idx').on(t.email),
  }),
);

export const accounts = pgTable(
  'accounts',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    user_id: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    provider: varchar('provider', { length: 64 }).notNull(),
    provider_account_id: varchar('provider_account_id', { length: 255 }).notNull(),
    access_token: text('access_token'),
    refresh_token: text('refresh_token'),
    expires_at: integer('expires_at'),
    created_at: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({
    userIdx: index('accounts_user_idx').on(t.user_id),
    providerUid: unique('accounts_provider_uid_idx').on(t.provider, t.provider_account_id),
  }),
);

export const sessions = pgTable(
  'sessions',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    user_id: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    token: varchar('token', { length: 255 }).notNull().unique(),
    expires_at: timestamp('expires_at', { withTimezone: true }).notNull(),
    created_at: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updated_at: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({
    userIdx: index('sessions_user_idx').on(t.user_id),
    tokenIdx: index('sessions_token_idx').on(t.token),
  }),
);

export const verificationTokens = pgTable(
  'verification_tokens',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    identifier: varchar('identifier', { length: 255 }).notNull(),
    token: varchar('token', { length: 255 }).notNull().unique(),
    expires: timestamp('expires', { withTimezone: true }).notNull(),
  },
  (t) => ({
    tokenIdx: index('verification_tokens_token_idx').on(t.token),
    identifierIdx: index('verification_tokens_identifier_idx').on(t.identifier),
  }),
);

// --- Admin / RBAC ---

export const adminUsers = pgTable(
  'admin_users',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    user_id: uuid('user_id')
      .notNull()
      .unique()
      .references(() => users.id, { onDelete: 'cascade' }),
    role: userRoleEnum('role').notNull().default('user'),
    mfa_enabled: boolean('mfa_enabled').notNull().default(false),
    created_at: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({
    userIdx: index('admin_users_user_idx').on(t.user_id),
  }),
);

export const auditLogs = pgTable(
  'audit_logs',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    actor: uuid('actor').references(() => users.id, { onDelete: 'set null' }),
    action: varchar('action', { length: 128 }).notNull(),
    entity: varchar('entity', { length: 128 }).notNull(),
    entity_id: varchar('entity_id', { length: 255 }),
    ip_hash: varchar('ip_hash', { length: 64 }).notNull(),
    at: timestamp('at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({
    actorIdx: index('audit_logs_actor_idx').on(t.actor),
    entityIdx: index('audit_logs_entity_idx').on(t.entity, t.entity_id),
    atIdx: index('audit_logs_at_idx').on(t.at),
  }),
);

// --- Governance / source verification ---

export const sources = pgTable(
  'sources',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    publisher: varchar('publisher', { length: 255 }).notNull(),
    publisher_type: varchar('publisher_type', { length: 64 }).notNull(),
    title: varchar('title', { length: 255 }).notNull(),
    base_url: varchar('base_url', { length: 512 }),
    reliability_tier: integer('reliability_tier').notNull().default(3),
    created_at: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({
    publisherIdx: index('sources_publisher_idx').on(t.publisher),
  }),
);

export const fieldSources = pgTable(
  'field_sources',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    entity_type: varchar('entity_type', { length: 64 }).notNull(),
    entity_id: uuid('entity_id').notNull(),
    field_name: varchar('field_name', { length: 128 }).notNull(),
    source_id: uuid('source_id')
      .notNull()
      .references(() => sources.id),
    source_url: varchar('source_url', { length: 512 }).notNull(),
    verified_at: timestamp('verified_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({
    entityIdx: index('field_sources_entity_idx').on(t.entity_type, t.entity_id),
    sourceIdx: index('field_sources_source_idx').on(t.source_id),
  }),
);

export const verificationRecords = pgTable(
  'verification_records',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    entity_type: varchar('entity_type', { length: 64 }).notNull(),
    entity_id: uuid('entity_id').notNull(),
    field_name: varchar('field_name', { length: 128 }),
    outcome: verificationStatusEnum('outcome').notNull(),
    verified_by: uuid('verified_by').references(() => users.id, {
      onDelete: 'set null',
    }),
    evidence_url: varchar('evidence_url', { length: 512 }),
    snapshot_hash: varchar('snapshot_hash', { length: 128 }),
    notes: text('notes'),
    at: timestamp('at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({
    entityIdx: index('verification_records_entity_idx').on(
      t.entity_type,
      t.entity_id,
    ),
    atIdx: index('verification_records_at_idx').on(t.at),
  }),
);

export const recordRevisions = pgTable(
  'record_revisions',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    entity_type: varchar('entity_type', { length: 64 }).notNull(),
    entity_id: uuid('entity_id').notNull(),
    actor: uuid('actor').references(() => users.id, { onDelete: 'set null' }),
    diff: jsonb('diff'),
    at: timestamp('at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({
    entityIdx: index('record_revisions_entity_idx').on(
      t.entity_type,
      t.entity_id,
    ),
  }),
);

export const userReports = pgTable(
  'user_reports',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    entity_type: varchar('entity_type', { length: 64 }).notNull(),
    entity_id: uuid('entity_id').notNull(),
    reporter: uuid('reporter').references(() => users.id, { onDelete: 'set null' }),
    message: text('message').notNull(),
    status: varchar('status', { length: 32 }).notNull().default('open'),
    outcome: text('outcome'),
    created_at: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({
    entityIdx: index('user_reports_entity_idx').on(t.entity_type, t.entity_id),
    statusIdx: index('user_reports_status_idx').on(t.status),
  }),
);

// --- Data ingestion ---

export const dataImports = pgTable(
  'data_imports',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    type: varchar('type', { length: 64 }).notNull(),
    source: varchar('source', { length: 255 }).notNull(),
    status: importStatusEnum('status').notNull().default('pending'),
    file_key: varchar('file_key', { length: 512 }),
    started_at: timestamp('started_at', { withTimezone: true }),
    finished_at: timestamp('finished_at', { withTimezone: true }),
    stats: jsonb('stats'),
    created_at: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({
    statusIdx: index('data_imports_status_idx').on(t.status),
  }),
);

export const dataImportRows = pgTable(
  'data_import_rows',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    import_id: uuid('import_id')
      .notNull()
      .references(() => dataImports.id, { onDelete: 'cascade' }),
    row_no: integer('row_no').notNull(),
    raw: jsonb('raw').notNull(),
    normalized: jsonb('normalized'),
    errors: jsonb('errors'),
    dedupe_match_id: uuid('dedupe_match_id'),
    action: varchar('action', { length: 32 }).notNull().default('pending'),
  },
  (t) => ({
    importIdx: index('data_import_rows_import_idx').on(t.import_id),
    rowIdx: index('data_import_rows_row_idx').on(t.import_id, t.row_no),
  }),
);

export const importSchedules = pgTable(
  'import_schedules',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    type: varchar('type', { length: 64 }).notNull(),
    cron: varchar('cron', { length: 64 }).notNull(),
    connector_config: jsonb('connector_config').notNull(),
    enabled: boolean('enabled').notNull().default(true),
    last_run_at: timestamp('last_run_at', { withTimezone: true }),
    next_run_at: timestamp('next_run_at', { withTimezone: true }),
    created_at: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({
    enabledIdx: index('import_schedules_enabled_idx').on(t.enabled),
  }),
);

// Helper: reference users.id safely across schema (used by FKs above)

// Catalog tables (universities, scholarships, opportunities, admissions guides, sync runs)
export * from './catalog.js';
