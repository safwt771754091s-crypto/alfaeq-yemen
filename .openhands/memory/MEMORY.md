# Project memory — منصة المعلم الذكية (Smart Teacher Platform)

## What this repo is
**Standalone** Arabic (RTL) web app for Yemeni teachers. User was explicit:
"هاذا مشروع جديد" / "اجعله لوحده لاتخلطه باي مشروع" — do NOT mix with the
`alfaeq_yemen_new` Flutter/Supabase project that previously occupied this workspace.
- Stack: Vite + React 18 + Tailwind. No backend — everything in browser LocalStorage.
- Offline-first PWA (vite-plugin-pwa / workbox).
- No git remote configured; local repo on branch `master`.

## Verify (local)
```
cd /workspace/project && npm test        # node scripts/engine-test.mjs
npm run build                            # vite build + PWA generateSW
npm run preview -- --host 0.0.0.0 --port 12000   # live preview (already running)
```
Baseline: **79 tests pass**, web build OK (precache 11 entries).
Live URL: https://work-1-cckulonssjrajkcv.prod-runtime.all-hands.dev/ (port 12000).

## Design language (user-directed)
User wants the UI to look like the reference platform
`https://mariamemran1810-cloud.github.io/teacher-sidebar-dashboard/`
("منصة المعلم الليبي"): teal `#0f766e` + gold `#d97706`, navy `#0b1f3a`,
fonts **Cairo + Tajawal**, gradient hero (`--hero-gradient`), rounded cards,
soft teal shadows. We mirrored it with Yemeni branding: Tailwind `brand` scale
is now teal (700=#0f766e), `sand` is amber, added `navy`, `bg-hero-gradient`,
`bg-brand-gradient`, `bg-gold-gradient`, `animate-float`. Reference markup uses
`app.html` for the tool dashboard and `index.html` for a landing page — our
React app is the dashboard, and `Onboarding.jsx` is our landing.

## Architecture
- `src/data/curriculum.js` — Yemeni curriculum: stages, GRADES(1-12), SUBJECTS,
  SUBJECTS_BY_GRADE, CURRICULUM units keyed "subjectId:grade", getUnits/getLessons,
  estimateLabel (Yemeni grading, PASS_MARK=50).
- `src/lib/lessonEngine.js` — generateLessonPlan + generateSlides + PPTX/Markdown export.
- `src/lib/notebookEngine.js` — buildNotebook (weekly plan + coverage + sample plan),
  notebookToMarkdown/Csv, TERMS.
- `src/lib/gradingEngine.js` — analyzeClass, gradeQuestion, gradePaper, sample quiz.
- `src/lib/storage.js` — LocalStorage ns `smart_teacher_v1`; hashPin/randomSalt (FNV-1a
  salted) for the owner PIN.
- `src/state/store.jsx` — useApp() global store; `usePersistent(key, initial)` helper.
  Adding a collection = add to KEYS + useState + CRUD + context value AND deps array.
- `src/state/owner.jsx` — useOwner(): owner account (configured/name/salt/pinHash),
  session unlock in `sessionStorage:smart_teacher_v1:owner_unlocked`.
- `src/components/UI.jsx` — Card, SectionHeader, Field, Modal, EmptyState, StatCard,
  ProgressBar, useToast, Tabs, Confirm. `src/components/Icon.jsx` — inline SVG Icon map.

## Pages / nav (App.jsx NAV + PAGES)
الرئيسية، المنهج اليمني، التحضير الذكي، كراسة التحضير، العروض التقديمية،
التصحيح الذكي، سجل الدرجات، الحضور والغياب، الشهادات، الصفوف والطلاب،
حساب المالك، الإعدادات. Pages get { go, params }.

## Pages (24, in NAV groups)
عام: dashboard, followups, messages, library, training, design ·
التخطيط: curriculum, planner, notebook, presentations, timetable ·
التقييم: grader · السجلات: gradebook, attendance, certificates, reports, activity ·
تواصل: community, announcements, reminders · أنشطة: mathgames ·
الإعداد: classes, owner, settings. All in `src/pages/*.jsx`, registered in
`PAGES`/`NAV` in App.jsx.

## Conventions / gotchas
- **Nav is an off-canvas drawer on the physical RIGHT** (closed by default; opened
  by the header hamburger, closed by the same button / X / overlay / Escape / route
  change). Content is full-width. In an `dir="rtl"` document, Tailwind logical
  utilities (`inset-inline-end`, `border-s`) map to the **left** — use physical
  `right-0` + `border-l` + `translate-x-full` for a right-side drawer.
- Print: `no-print` class hides controls; `print-area` removes card shadow.
- Onboarding gate: App shows <Onboarding> until profile.setupDone.
- After a rebuild, the browser may serve a stale SW — reload with a new ?v= query.
- Tests are plain-node asserts in scripts/engine-test.mjs (no framework); import
  from ../src/... directly.
- Owner PIN is obfuscation only (FNV-1a hash + salt), explicitly documented as such.

## Build & ship
- Offline: all fonts bundled locally (`public/fonts/`), zero external requests.
  SW precaches everything → works with no internet.
- Android app via **Capacitor 6** (`android/` dir). Build env is NOT preinstalled;
  needs `/workspace/tools/jdk17` (Temurin 17 — Gradle 8.2.1 rejects JDK 21) and
  `/workspace/tools/android-sdk` (cmdline-tools + platform-34 + build-tools 34).
  Exact steps + gotchas in `2026-10-10.md`.
- Signed release APK (~3.2 MB, `ye.teacher.smart`, minSdk 22) copied to
  `dist/smart-teacher.apk` and served for download. Settings page has an Android
  download card, hidden when running natively.
- **`vite build` wipes `dist/`** — re-copy the APK into `dist/` after any build.
- Keystore `android/app/alfaeq-teacher.keystore` is a secret; gitignored, never commit.

## Daily logs
- `2026-10-09.md` — built كراسة التحضير (notebook) + حساب المالك (owner account).
- `2026-10-10.md` — reference-design restyle, secondary grade naming fix, offline
  font bundling, Android APK build/ship (full steps).

## Environment quirks (learned)
- **No vision model**: `inspect_image_with_vision` fails (Gemini provider
  NotFoundError) and the managed LLM proxy only exposes text models
  (`deepseek-v4.1-flash`). To read user-supplied mockup images, install
  `easyocr` (`pip install easyocr`; torch is pulled in) and OCR with
  `Reader(['ar','en'], gpu=False)`. Screenshots from the browser are 1920x1080
  PNGs; DOM text (`browser_get_content`) is the most reliable way to verify
  React output.
- **PWA stale cache**: after `npm run build`, the already-open app on port 12000
  may still run the old bundle via the service worker. Verify new builds on the
  *other* origin (port 12001, `python3 -m http.server 12001 --directory dist`)
  which has no SW, or reload with a fresh `?v=`. The server itself always serves
  the new hashed assets.
- `numpy` is not installed; Pillow is. Do pixel analysis in pure Python.
