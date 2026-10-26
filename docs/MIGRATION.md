# Somnia — Migration skeleton (MIGRATION.md)

> Phase 1 skeleton per SPEC §50. Field-level mapping + counts + report land in later phases. DO NOT delete legacy code/data until cutover is verified.

## 1. Freeze (Phase 2)
- [ ] `git tag legacy-v1` on `main` HEAD (`b8cc994` at audit time)
- [ ] Export SQLite `data/app.db` → JSON/CSV in `/migration/legacy-export/` (users, profiles, applications, roadmaps, notifications, community_posts, cv_data, universities) + snapshot `public/data/*.json`
- [ ] Record row counts before/after per entity (table below)

## 2. Entity mapping (draft — finalize Phase 2/6/7)

| Legacy | New (SPEC §37) | Transform / default | Unmigratable |
|---|---|---|---|
| `users(id,username,email,password bcrypt)` | `users` + `accounts` | emails lowercased; passwords NOT migrated (bcrypt→argon2id requires reset, §50.4) | password hashes, `guest_*` throwaways (drop) |
| `profiles(30+ cols, incl. resumePdf base64, customGeminiKey, points/level)` | `student_profiles` + `qualifications` + `grades` + `test_scores` + `activities` + prefs | split flat cols into normalized tables; `resumePdf` → storage objects + `documents`; drop `points/level/rewardedActions/badges-grind`; drop `customGeminiKey` | game fields, per-user keys |
| `applications(id,user_id,name,providerOrUni,deadline,status,notes,checklist JSON)` | `applications` + `application_status_history` + `application_tasks` + docs/essays/recs | parse checklist JSON → tasks; status → §26 enum; seed history row | malformed JSON rows → quarantine + report |
| `universities(...)` + `universities.json` | `universities` + `university_costs` + `sources/field_sources` | dedupe (normalized name+country+domain); `needs_review` unless verifiable source | duplicates → merge log |
| `scholarships.json` (in-memory) | `scholarships` + `scholarship_requirements` + eligibility rules | unstructured eligibility → text + `needs_review`; structured rules only where source states them | invented-looking rows → `is_demo` or drop with reason |
| `cost_of_living/student_jobs/tax_rules/visa_guide.json` | `countries` + `country_facts` + `visa_guides(+steps/docs)` | every fact needs `source_id+url+last_verified`; visa requires government source or stays unpublished | unsourced facts → unpublished + honest empty state |
| `internships.json` + `jobs.json`(2 rows) | `opportunities` (+`opportunity_requirements`) | type enum mapping; dedupe | placeholder rows → `is_demo` |
| `community_posts`, `study-groups` (derived), `push_subs.json` | — (out of v1 scope) | archive to `/migration/legacy-export/` only | not migrated to prod |
| `notifications` (global) | `notifications` (user-scoped, dedupe_key) | global rows → dropped (leak) or mapped to admin broadcast w/ consent | global rows |
| `roadmaps`, `cv_data`, reviews, stories | tracker milestones / documents / moderated content | per-feature mapping in Phases 13/14/19 | skill-tree, fake bookings |

## 3. Verification status on migrate
All catalog rows land as `needs_review` (or `estimated`) unless a verifiable source exists; mock/demo → `is_demo=true`, hidden in prod. No row becomes `verified` without `source_url` (§36). Visa guides need government source (§24).

## 4. Redirect map (stubs — fill during rebuild)
`#/overview`→`/app`, `#/analytics`→`/app/analytics`, `#/scholarships`→`/scholarships`, `#/internships`→`/opportunities` (+legacy redirect), `#/universities`→`/universities`, `#/matcher`→`/countries`, `#/simulator,#/chances`→`/app/matches`, `#/writing`→`/app/documents`, `#/cv`→`/app/cv`, `#/counselling`→`/app/advisor`, `#/budget`→`/app/budget`, `#/visa`→`/visa`, `#/applications`→`/app/applications`, `#/search`→ palette, `#/learning,#/community,#/study-groups,#/predeparture,#/mentors,#/customize,#/export,#/profile,#/ielts`→ per AUDIT verdicts (merge/remove/404). Keep 12 months (§50.5).

## 5. Cutover
Side-by-side until AUDIT §10 regression checklist passes 100% → cutover → rollback doc → counts report committed (`/docs/MIGRATION_REPORT.md`).

## Counts (fill at export)
| Entity | Legacy count | Migrated | Demo/quarantined | Notes |
|---|---|---|---|---|
| users | TBD | | | |
| profiles | TBD | | | |
| applications | TBD | | | |
| universities | TBD | | | |
| scholarships | TBD | | | |
| opportunities | TBD | | | |
| (other) | TBD | | | |
