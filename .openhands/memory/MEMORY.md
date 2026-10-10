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
Baseline: **71 tests pass**, web build OK (precache 11 entries).
Live URL: https://work-1-cckulonssjrajkcv.prod-runtime.all-hands.dev/ (port 12000).

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

## Conventions / gotchas
- Print: `no-print` class hides controls; `print-area` removes card shadow.
- Onboarding gate: App shows <Onboarding> until profile.setupDone.
- After a rebuild, the browser may serve a stale SW — reload with a new ?v= query.
- Tests are plain-node asserts in scripts/engine-test.mjs (no framework); import
  from ../src/... directly.
- Owner PIN is obfuscation only (FNV-1a hash + salt), explicitly documented as such.

## Daily logs
- `2026-10-09.md` — built كراسة التحضير (notebook) + حساب المالك (owner account).
