# Project memory — alfaeq_yemen_new (الفائق يمن)

## What this repo is
Commercial **الفائق يمن** platform: Flutter app (`lib/`, ~13.9k LOC) + Supabase
(PostgreSQL/RLS/RPC/Realtime/Edge Functions) as the **only** backend. No Firebase
(CI hard-blocks firebase_* / service_role in the client tree).
Repo: `safwt771754091s-crypto/alfaeq_yemen_new`. Web (GitHub Pages) at
`https://safwt771754091s-crypto.github.io/alfaeq_yemen_new/`.
Supabase edge-function URL literal used in migrations: `https://safwt771754091s-crypto.supabase.co`.

## Harness (read these first)
- `AGENTS.md` + `CONVENTIONS.md` define MUST/MUST-NOT and the verification gate.
- `progress.md` = current task + evidence log; `feature_list.json` = scope.
- `session-handoff.md` = restart instructions.
- DoD requires code + DB + tests + builds + GitHub Actions evidence to agree.
- Work lands via focused PR; **never** merge agent work to main directly.

## Active master issue
- Issue **#48** "MASTER EXECUTION — Complete Alfaeq Yemen production platform"
  (`alfaeq-execute` label) lists the 10-step execution order. Autonomous executor
  is wired but safe-skips unless the repo secret `OPENHANDS_API_KEY` exists.

## Verify (local)
```
export PATH="/workspace/tools/flutter/bin:$PATH"
cd /workspace/project && flutter pub get && flutter analyze && flutter test
flutter build web --release
```
Baseline on main: analyze clean, **72 tests pass**, web release build OK.

## Environment (ephemeral — reinstalled each session)
- Flutter **not** preinstalled. Download stable tar.xz from
  `storage.googleapis.com/flutter_infra_release/releases/...` and extract to
  `/workspace/tools/flutter` (needs `unzip` for web builds; `xz` to extract).
  Stable at time of writing: **3.47.7 / Dart 3.13.5**.
- No Android SDK → `flutter build apk` not locally runnable (CI covers it).
- PostgreSQL 17 installable via apt (`postgresql`); used for migration testing.
- `gh` CLI authenticated as `safwt771754091s-crypto` via `GITHUB_TOKEN`.
- Push via `git push https://${GITHUB_TOKEN}@github.com/... <branch>` (no cached creds).

## Key gotchas learned
- **`automation_event_inbox` stale-claim loss (fixed PR #125, migration
  `20261009120000`)**: `automation-worker` claims a row `received→processing`
  before calling n8n; a mid-flight crash left it `processing` forever (worker only
  reads `received`) → accepted event silently dropped. The legacy `automation_events`
  queue self-heals via `claim_automation_events()`; the inbox now has
  `reap_stale_automation_inbox()` + `private.automation_inbox_drain_internal()`
  cron drain (`alfaeq-automation-inbox-drain`) + `processing_at` column.
- The insert trigger on `automation_event_inbox` fires **once at enqueue only**;
  retries after `available_at` backoff need an external kick (cron drain).
- Cron convention: `create extension pg_cron` in a `do $$ ... exception ... $$`
  block (best-effort), `cron.unschedule` then `cron.schedule` with a `$cron$...$cron$`
  command calling a `private.*_internal()` function. Same pattern as
  `20261005163000_whatsapp_dispatch_cron_v1.sql`.
- Engineering gate (`engineering-gates.yml`) enforces: migration filename
  `YYYYMMDDHHMMSS_snake.sql`, and every `security definer` function must set
  `search_path`. No pgtap / SQL test harness exists in-repo.
- Many RPCs called from Dart live in "applied live, recorded as history" migrations
  (e.g. `create_support_thread`, `send_chat_message` in
  `20260929203000_harden_support_chat_rpc_authorization.sql`) — grep all migrations,
  not just the obvious ones.
- Local Supabase CLI is not used; migrations are validated by applying the single
  file against a stubbed local Postgres (define `net.http_post`, `cron.schedule`,
  `anon`/`authenticated`/`service_role` roles, and the referenced tables first).

## Daily logs
- `2026-10-09.md` — repo audit, environment setup, stale-claim recovery fix (PR #125).
