# LIVE_VALIDATED_FINDINGS.md

Live-validated notes collected from the installed `stripe projects` CLI inside this repo, using the initialized project state on this machine.

## Scope

- Source of truth: live `stripe projects` command output in `~/Documents/ready-to-inc/repo`
- Purpose: replace guessed recipe assumptions with observed provider, service, and env behavior
- Caveat: catalog contents are dynamic and may change over time; rerun these checks when refreshing recipes

## Current project state

- Project initialized: yes
- Project name: `repo`
- Project email: `lucas@promptyield.com`
- Linked providers: Vercel
- Provisioned services: backend (Supabase:supabase:free), web (Vercel:project)

## Observed provisioned services in this project

- `backend` → provider `Supabase`, service slug `supabase/supabase:free`, status `complete`, pricing `Free`, config: name=founders-agreement, region=americas
- `web` → provider `Vercel`, service slug `vercel/project`, status `complete`, pricing `Free`, config: name=founders-agreement-web

## Observed env output shape

From live `stripe projects env --json`:

- Resource `fres_61UUArretkxosoQc016SvNwISGSQOMCtRf2PtuBcmSEC` exposes keys: SUPABASE_DB_PASS, SUPABASE_DB_URL, SUPABASE_PROJECT_REF, SUPABASE_PROJECT_URL
- Resource `fres_61UUArasFkJ5lkwhr16SvNwISGSQOMCtRf2PtuBcm6YC` exposes keys: VERCEL_PROJECT_ID, VERCEL_PROJECT_LINK, VERCEL_PROJECT_URL, VERCEL_TOKEN

### Important env finding

- Supabase provisioning in this project exposed backend/project keys like `SUPABASE_DB_URL` and `SUPABASE_PROJECT_URL`.
- It did **not** automatically expose a browser-ready public key such as `NEXT_PUBLIC_SUPABASE_ANON_KEY`.
- Recipe packs that assume app-ready public client env vars immediately appear after provisioning are too optimistic and should verify actual env output before scaffolding auth flows.

## Live provider/service observations

### vercel

- `vercel/project` — kind `deployable`, categories `compute`, pricing `component`
  - required config fields: name
  - config properties seen: name
  - description: A Vercel project with deployment capabilities

### supabase

- `supabase/supabase:free` — kind `deployable`, categories `database, auth, storage`, pricing `free`
  - required config fields: none
  - config properties seen: name, region
  - description: Supabase Free Plan: Unlimited API requests • Shared CPU • 500 MB RAM • 50K MAU • 500 MB database space • 5 GB bandwidth • 1 GB file storage

### clerk

- `clerk/pro` — kind `plan`, categories `auth`, pricing `paid`
  - description: Clerk Pro plan — production-ready auth with MFA, SSO, custom domains, remove branding. 50,000 MAU included, then usage-based.
- `clerk/auth` — kind `deployable`, categories `auth`, pricing `component`
  - required config fields: app_name
  - config properties seen: app_name, production_domain
  - description: Clerk Authentication — drop-in auth for any framework. Free by default, paid under Pro.
- `clerk/hobby` — kind `plan`, categories `auth`, pricing `free`
  - description: Clerk Hobby plan — authentication and user management for side projects and small apps. 50,000 MAU included.

### posthog

- `posthog/pay_as_you_go` — kind `plan`, categories `analytics, feature_flags, ai`, pricing `paid`
  - description: Pay-as-you-go - usage-based pricing across all PostHog products with no minimum commitment.
- `posthog/free` — kind `plan`, categories `analytics, feature_flags, ai`, pricing `free`
  - description: Free - generous free tier across all PostHog products, no credit card required.
- `posthog/analytics` — kind `deployable`, categories `analytics, feature_flags, ai`, pricing `component`
  - required config fields: none
  - config properties seen: project_name
  - description: PostHog — product analytics, session replay, realtime destinations, feature flags & experiments, surveys, data warehouse, error tracking, llm analytics, logs, posthog ai, emails, and more.

### neon

- `neon/postgres` — kind `deployable`, categories `database`, pricing `free`
  - description: Postgres databases for teams and agents

### planetscale

- `planetscale/mysql` — kind `deployable`, categories `database`, pricing `paid`
  - required config fields: name, cluster, region
  - config properties seen: name, cluster, region
  - description: Fully managed MySQL database on PlanetScale
- `planetscale/postgresql` — kind `deployable`, categories `database`, pricing `paid`
  - required config fields: name, cluster, region
  - config properties seen: name, cluster, region, replicas
  - description: Fully managed Postgres database on PlanetScale

### railway

- `railway/bucket` — kind `deployable`, categories `storage`, pricing `component`
  - required config fields: none
  - config properties seen: name, region
  - description: S3-compatible object storage on Railway. Powered by Tigris.
- `railway/redis` — kind `deployable`, categories `database, cache`, pricing `component`
  - required config fields: none
  - config properties seen: region
  - description: Managed Redis cache on Railway.
- `railway/free` — kind `plan`, categories `none`, pricing `free`
  - required config fields: none
  - config properties seen: none
  - description: Trial plan with limited resources. 500 hours of compute, 512 MB RAM, shared CPU, 1 GB disk.
- `railway/postgres` — kind `deployable`, categories `database`, pricing `component`
  - required config fields: none
  - config properties seen: region
  - description: Managed PostgreSQL database on Railway.
- `railway/hosting` — kind `deployable`, categories `compute`, pricing `component`
  - required config fields: none
  - config properties seen: repo, image, branch
  - description: Deploy a GitHub repository (public or private) or Docker image on Railway.
- `railway/mongo` — kind `deployable`, categories `database`, pricing `component`
  - required config fields: none
  - config properties seen: region
  - description: Managed MongoDB database on Railway.

### chroma

- `chroma/database` — kind `deployable`, categories `database, ai`, pricing `paid`
  - required config fields: name
  - config properties seen: name
  - description: A hosted search database for AI applications

### turso

- `turso/developer` — kind `plan`, categories `database`, pricing `paid`
  - description: Unlimited DBs (500 active), 9 GB storage, 2.5B rows read, 25M rows written, 10 GB syncs, 10-day PITR
- `turso/scaler_overages` — kind `plan`, categories `database`, pricing `paid`
  - description: Unlimited DBs (2,500 active), 24 GB storage, 100B rows read, 100M rows written, 24 GB syncs, 30-day PITR
- `turso/pro` — kind `plan`, categories `database`, pricing `paid`
  - description: Unlimited DBs (10,000 active), 50 GB storage, 250B rows read, 250M rows written, 100 GB syncs, 90-day PITR
- `turso/scaler` — kind `plan`, categories `database`, pricing `paid`
  - description: Unlimited DBs (2,500 active), 24 GB storage, 100B rows read, 100M rows written, 24 GB syncs, 30-day PITR
- `turso/database` — kind `deployable`, categories `database`, pricing `component`
  - required config fields: name, location
  - config properties seen: location, name
  - description: SQL database with limits according to chosen plan (offline-writes, local-first, branching, point-in-time recovery)
- `turso/developer_overages` — kind `plan`, categories `database`, pricing `paid`
  - description: Unlimited DBs (500 active), 9 GB storage, 2.5B rows read, 25M rows written, 10 GB syncs, 10-day PITR
- `turso/pro_overages` — kind `plan`, categories `database`, pricing `paid`
  - description: Unlimited DBs (10,000 active), 50 GB storage, 250B rows read, 250M rows written, 100 GB syncs, 90-day PITR
- `turso/starter` — kind `plan`, categories `database`, pricing `free`
  - description: 100 DBs, 5 GB storage, 500M rows read, 10M rows written, 3 GB syncs, 1-day PITR

### runloop

- `runloop/sandbox` — kind `deployable`, categories `ai, sandboxes`, pricing `component`
  - description: Runloop Sandbox — cloud Devbox execution environment
- `runloop/pro` — kind `plan`, categories `ai, sandboxes`, pricing `paid`
  - description: Runloop Pro — cloud Devboxes for production AI workloads at scale
- `runloop/basic` — kind `plan`, categories `ai, sandboxes`, pricing `paid`
  - description: Runloop Basic — cloud Devboxes with high concurrency and compute

## Concrete critiques for the recipes repo

1. **Catalog JSON, not prose assumptions, must drive recipe slugs.** Exact slugs like `vercel/project` and `supabase/supabase:free` were observed live and should be copied from catalog output, not inferred.
2. **Provisioning success is not the same as app-ready env success.** Recipes should verify which env vars actually appear after `stripe projects env --refresh --pull` before generating code that expects browser-safe keys.
3. **Split provisioning from scaffolding.** First: init, link, add, env pull, verify. Then scaffold. This avoids generating code around missing credentials or mismatched provider assumptions.
4. **Generated provider skills should be treated as local source of truth.** Recipes should explicitly inspect the project-local skills written by `stripe projects init` and defer to them for provider-specific behavior.
5. **Human checkpoints remain real.** Provider auth, billing, and ToS/browser confirmation still happen in practice. Recipes should acknowledge this rather than promising perfect one-shot unattended runs.

## Suggested next validation passes

- Capture project-local provider skill contents into a separate notes doc so recipes can reference actual guidance, not just CLI outputs.
- For each starter pack, replace guessed slugs/flags with live-validated ones from this machine.
- Add a per-pack verification checklist: provider linked, service provisioned, env keys observed, deployment command tested.
- Record exact browser-auth or provider-link flows when they occur so the skills can prompt humans cleanly instead of failing silently.
