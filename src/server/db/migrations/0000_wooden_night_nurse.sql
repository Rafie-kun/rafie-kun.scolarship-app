CREATE TYPE "public"."import_status" AS ENUM('pending', 'running', 'completed', 'failed', 'rolled_back');--> statement-breakpoint
CREATE TYPE "public"."user_role" AS ENUM('user', 'editor', 'admin');--> statement-breakpoint
CREATE TYPE "public"."user_status" AS ENUM('active', 'disabled', 'deleted');--> statement-breakpoint
CREATE TYPE "public"."verification_status" AS ENUM('verified', 'needs_review', 'expired', 'estimated');--> statement-breakpoint
CREATE TYPE "public"."opportunity_type" AS ENUM('internship', 'research', 'summer_program', 'fellowship', 'competition', 'volunteer', 'academic', 'student_program');--> statement-breakpoint
CREATE TYPE "public"."catalog_verification_status" AS ENUM('verified', 'needs_review', 'expired', 'estimated');--> statement-breakpoint
CREATE TABLE "accounts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"provider" varchar(64) NOT NULL,
	"provider_account_id" varchar(255) NOT NULL,
	"access_token" text,
	"refresh_token" text,
	"expires_at" integer,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "accounts_provider_uid_idx" UNIQUE("provider","provider_account_id")
);
--> statement-breakpoint
CREATE TABLE "admin_users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"role" "user_role" DEFAULT 'user' NOT NULL,
	"mfa_enabled" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "admin_users_user_id_unique" UNIQUE("user_id")
);
--> statement-breakpoint
CREATE TABLE "audit_logs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"actor" uuid,
	"action" varchar(128) NOT NULL,
	"entity" varchar(128) NOT NULL,
	"entity_id" varchar(255),
	"ip_hash" varchar(64) NOT NULL,
	"at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "data_import_rows" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"import_id" uuid NOT NULL,
	"row_no" integer NOT NULL,
	"raw" jsonb NOT NULL,
	"normalized" jsonb,
	"errors" jsonb,
	"dedupe_match_id" uuid,
	"action" varchar(32) DEFAULT 'pending' NOT NULL
);
--> statement-breakpoint
CREATE TABLE "data_imports" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"type" varchar(64) NOT NULL,
	"source" varchar(255) NOT NULL,
	"status" "import_status" DEFAULT 'pending' NOT NULL,
	"file_key" varchar(512),
	"started_at" timestamp with time zone,
	"finished_at" timestamp with time zone,
	"stats" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "field_sources" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"entity_type" varchar(64) NOT NULL,
	"entity_id" uuid NOT NULL,
	"field_name" varchar(128) NOT NULL,
	"source_id" uuid NOT NULL,
	"source_url" varchar(512) NOT NULL,
	"verified_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "import_schedules" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"type" varchar(64) NOT NULL,
	"cron" varchar(64) NOT NULL,
	"connector_config" jsonb NOT NULL,
	"enabled" boolean DEFAULT true NOT NULL,
	"last_run_at" timestamp with time zone,
	"next_run_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "record_revisions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"entity_type" varchar(64) NOT NULL,
	"entity_id" uuid NOT NULL,
	"actor" uuid,
	"diff" jsonb,
	"at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "sessions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"token" varchar(255) NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "sessions_token_unique" UNIQUE("token")
);
--> statement-breakpoint
CREATE TABLE "sources" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"publisher" varchar(255) NOT NULL,
	"publisher_type" varchar(64) NOT NULL,
	"title" varchar(255) NOT NULL,
	"base_url" varchar(512),
	"reliability_tier" integer DEFAULT 3 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "user_reports" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"entity_type" varchar(64) NOT NULL,
	"entity_id" uuid NOT NULL,
	"reporter" uuid,
	"message" text NOT NULL,
	"status" varchar(32) DEFAULT 'open' NOT NULL,
	"outcome" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"email" varchar(255) NOT NULL,
	"email_verified_at" timestamp with time zone,
	"password_hash" varchar(255),
	"status" "user_status" DEFAULT 'active' NOT NULL,
	"locale" varchar(10) DEFAULT 'en' NOT NULL,
	"timezone" varchar(64) DEFAULT 'UTC' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone,
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "verification_records" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"entity_type" varchar(64) NOT NULL,
	"entity_id" uuid NOT NULL,
	"field_name" varchar(128),
	"outcome" "verification_status" NOT NULL,
	"verified_by" uuid,
	"evidence_url" varchar(512),
	"snapshot_hash" varchar(128),
	"notes" text,
	"at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "verification_tokens" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"identifier" varchar(255) NOT NULL,
	"token" varchar(255) NOT NULL,
	"expires" timestamp with time zone NOT NULL,
	CONSTRAINT "verification_tokens_token_unique" UNIQUE("token")
);
--> statement-breakpoint
CREATE TABLE "admissions_guides" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"university_id" uuid NOT NULL,
	"where_to_apply" text,
	"application_platform" varchar(128),
	"application_fee" numeric(14, 2),
	"application_fee_currency" varchar(3),
	"deadlines_text" text,
	"requirements_text" text,
	"documents_text" text,
	"personal_statement_text" text,
	"recommendations_text" text,
	"tests_text" text,
	"interview_text" text,
	"portfolio_text" text,
	"timeline" jsonb,
	"source_url" varchar(512),
	"last_verified_at" timestamp with time zone,
	"verification_status" "catalog_verification_status" DEFAULT 'needs_review' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "admissions_guides_university_id_unique" UNIQUE("university_id")
);
--> statement-breakpoint
CREATE TABLE "catalog_sync_runs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"started_at" timestamp with time zone DEFAULT now() NOT NULL,
	"finished_at" timestamp with time zone,
	"status" varchar(32) DEFAULT 'running' NOT NULL,
	"universities_added" integer DEFAULT 0 NOT NULL,
	"universities_updated" integer DEFAULT 0 NOT NULL,
	"scholarships_added" integer DEFAULT 0 NOT NULL,
	"scholarships_updated" integer DEFAULT 0 NOT NULL,
	"opportunities_added" integer DEFAULT 0 NOT NULL,
	"opportunities_updated" integer DEFAULT 0 NOT NULL,
	"admissions_guides_added" integer DEFAULT 0 NOT NULL,
	"admissions_guides_updated" integer DEFAULT 0 NOT NULL,
	"errors" jsonb
);
--> statement-breakpoint
CREATE TABLE "opportunities" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"slug" varchar(255) NOT NULL,
	"title" varchar(255) NOT NULL,
	"type" "opportunity_type" DEFAULT 'internship' NOT NULL,
	"organization" varchar(255),
	"country" varchar(128),
	"is_remote" boolean DEFAULT false NOT NULL,
	"description" text,
	"stipend" varchar(128),
	"duration" varchar(128),
	"deadline" timestamp with time zone,
	"official_url" varchar(512),
	"application_url" varchar(512),
	"eligibility_text" text,
	"source_id" uuid,
	"source_url" varchar(512),
	"last_verified_at" timestamp with time zone,
	"verification_status" "catalog_verification_status" DEFAULT 'needs_review' NOT NULL,
	"verification_notes" text,
	"data_origin" varchar(32) DEFAULT 'import' NOT NULL,
	"is_demo" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "opportunities_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "scholarships" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"slug" varchar(255) NOT NULL,
	"name" varchar(255) NOT NULL,
	"provider" varchar(255),
	"country" varchar(128),
	"university_id" uuid,
	"description" text,
	"degree_level" varchar(64),
	"funding_type" varchar(64),
	"funding_amount_min" numeric(14, 2),
	"funding_amount_max" numeric(14, 2),
	"funding_currency" varchar(3),
	"deadline" timestamp with time zone,
	"official_url" varchar(512),
	"application_url" varchar(512),
	"eligibility_text" text,
	"documents_text" text,
	"source_id" uuid,
	"source_url" varchar(512),
	"last_verified_at" timestamp with time zone,
	"verification_status" "catalog_verification_status" DEFAULT 'needs_review' NOT NULL,
	"verification_notes" text,
	"data_origin" varchar(32) DEFAULT 'import' NOT NULL,
	"is_demo" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "scholarships_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "universities" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"slug" varchar(255) NOT NULL,
	"name" varchar(255) NOT NULL,
	"country" varchar(128) NOT NULL,
	"city" varchar(128),
	"website" varchar(512),
	"admissions_url" varchar(512),
	"application_portal_url" varchar(512),
	"description" text,
	"type" varchar(64),
	"ranking" integer,
	"acceptance_rate" numeric(5, 2),
	"tuition_min" numeric(14, 2),
	"tuition_max" numeric(14, 2),
	"tuition_currency" varchar(3),
	"has_on_campus_housing" boolean,
	"source_id" uuid,
	"source_url" varchar(512),
	"last_verified_at" timestamp with time zone,
	"verification_status" "catalog_verification_status" DEFAULT 'needs_review' NOT NULL,
	"verification_notes" text,
	"data_origin" varchar(32) DEFAULT 'import' NOT NULL,
	"is_demo" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "universities_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
ALTER TABLE "accounts" ADD CONSTRAINT "accounts_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "admin_users" ADD CONSTRAINT "admin_users_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_actor_users_id_fk" FOREIGN KEY ("actor") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "data_import_rows" ADD CONSTRAINT "data_import_rows_import_id_data_imports_id_fk" FOREIGN KEY ("import_id") REFERENCES "public"."data_imports"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "field_sources" ADD CONSTRAINT "field_sources_source_id_sources_id_fk" FOREIGN KEY ("source_id") REFERENCES "public"."sources"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "record_revisions" ADD CONSTRAINT "record_revisions_actor_users_id_fk" FOREIGN KEY ("actor") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_reports" ADD CONSTRAINT "user_reports_reporter_users_id_fk" FOREIGN KEY ("reporter") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "verification_records" ADD CONSTRAINT "verification_records_verified_by_users_id_fk" FOREIGN KEY ("verified_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "admissions_guides" ADD CONSTRAINT "admissions_guides_university_id_universities_id_fk" FOREIGN KEY ("university_id") REFERENCES "public"."universities"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "scholarships" ADD CONSTRAINT "scholarships_university_id_universities_id_fk" FOREIGN KEY ("university_id") REFERENCES "public"."universities"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "accounts_user_idx" ON "accounts" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "admin_users_user_idx" ON "admin_users" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "audit_logs_actor_idx" ON "audit_logs" USING btree ("actor");--> statement-breakpoint
CREATE INDEX "audit_logs_entity_idx" ON "audit_logs" USING btree ("entity","entity_id");--> statement-breakpoint
CREATE INDEX "audit_logs_at_idx" ON "audit_logs" USING btree ("at");--> statement-breakpoint
CREATE INDEX "data_import_rows_import_idx" ON "data_import_rows" USING btree ("import_id");--> statement-breakpoint
CREATE INDEX "data_import_rows_row_idx" ON "data_import_rows" USING btree ("import_id","row_no");--> statement-breakpoint
CREATE INDEX "data_imports_status_idx" ON "data_imports" USING btree ("status");--> statement-breakpoint
CREATE INDEX "field_sources_entity_idx" ON "field_sources" USING btree ("entity_type","entity_id");--> statement-breakpoint
CREATE INDEX "field_sources_source_idx" ON "field_sources" USING btree ("source_id");--> statement-breakpoint
CREATE INDEX "import_schedules_enabled_idx" ON "import_schedules" USING btree ("enabled");--> statement-breakpoint
CREATE INDEX "record_revisions_entity_idx" ON "record_revisions" USING btree ("entity_type","entity_id");--> statement-breakpoint
CREATE INDEX "sessions_user_idx" ON "sessions" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "sessions_token_idx" ON "sessions" USING btree ("token");--> statement-breakpoint
CREATE INDEX "sources_publisher_idx" ON "sources" USING btree ("publisher");--> statement-breakpoint
CREATE INDEX "user_reports_entity_idx" ON "user_reports" USING btree ("entity_type","entity_id");--> statement-breakpoint
CREATE INDEX "user_reports_status_idx" ON "user_reports" USING btree ("status");--> statement-breakpoint
CREATE INDEX "users_email_idx" ON "users" USING btree ("email");--> statement-breakpoint
CREATE INDEX "verification_records_entity_idx" ON "verification_records" USING btree ("entity_type","entity_id");--> statement-breakpoint
CREATE INDEX "verification_records_at_idx" ON "verification_records" USING btree ("at");--> statement-breakpoint
CREATE INDEX "verification_tokens_token_idx" ON "verification_tokens" USING btree ("token");--> statement-breakpoint
CREATE INDEX "verification_tokens_identifier_idx" ON "verification_tokens" USING btree ("identifier");--> statement-breakpoint
CREATE INDEX "admissions_guides_university_idx" ON "admissions_guides" USING btree ("university_id");--> statement-breakpoint
CREATE INDEX "catalog_sync_runs_started_idx" ON "catalog_sync_runs" USING btree ("started_at");--> statement-breakpoint
CREATE INDEX "opportunities_title_idx" ON "opportunities" USING btree ("title");--> statement-breakpoint
CREATE INDEX "opportunities_type_idx" ON "opportunities" USING btree ("type");--> statement-breakpoint
CREATE INDEX "opportunities_status_idx" ON "opportunities" USING btree ("verification_status");--> statement-breakpoint
CREATE INDEX "scholarships_name_idx" ON "scholarships" USING btree ("name");--> statement-breakpoint
CREATE INDEX "scholarships_country_idx" ON "scholarships" USING btree ("country");--> statement-breakpoint
CREATE INDEX "scholarships_deadline_idx" ON "scholarships" USING btree ("deadline");--> statement-breakpoint
CREATE INDEX "scholarships_status_idx" ON "scholarships" USING btree ("verification_status");--> statement-breakpoint
CREATE INDEX "universities_name_idx" ON "universities" USING btree ("name");--> statement-breakpoint
CREATE INDEX "universities_country_idx" ON "universities" USING btree ("country");--> statement-breakpoint
CREATE INDEX "universities_status_idx" ON "universities" USING btree ("verification_status");