# Project memory — منصة المعلم الذكية (Smart Teacher Platform)

## What this repo is
**Standalone** Arabic (RTL) web app for Yemeni teachers. User was explicit:
"هاذا مشروع جديد" / "اجعله لوحده لاتخلطه باي مشروع" — do NOT mix with the
`alfaeq_yemen_new` Flutter/Supabase project that previously occupied this workspace.
- Stack: Vite + React 18 + Tailwind. No backend — everything in browser LocalStorage.
- Offline-first PWA (vite-plugin-pwa / workbox).
- Remote: `https://github.com/safwt771754091s-crypto/alfaeq-yemen` (default branch
  `main`). Local branch is `master`; push with `git push https://$GITHUB_TOKEN@github.com/safwt771754091s-crypto/alfaeq-yemen master:main`.

## Verify (local)
```
cd /workspace/project && npm test        # node scripts/engine-test.mjs
npm run build                            # vite build + PWA generateSW
npm run preview -- --host 0.0.0.0 --port 12000   # live preview (already running)
```
Baseline: **262 tests pass**, web + standalone build OK (PWA SW precache).
Live URL: https://work-1-cckulonssjrajkcv.prod-runtime.all-hands.dev/ (port 12000).

## Design language (user-directed)
User wants the UI to look like the reference platform
`https://mariamemran1810-cloud.github.io/teacher-sidebar-dashboard/`
("منصة المعلم الليبي"): teal `#0f766e` + gold `#d97706`, navy `#0b1f3a`,
fonts **Cairo + Tajawal**, gradient hero (`--hero-gradient`), rounded cards,
soft teal shadows. We mirrored it with Yemeni branding: Tailwind `brand` scale
is now teal (700=#0f766e), `sand` is amber, added `navy`, `bg-hero-gradient`,
`bg-brand-gradient`, `bg-gold-gradient`, `animate-float`. Reference markup uses
`app.html` for the tool dashboard and `index.html` for a landing page — we now
mirror both: `src/pages/Landing.jsx` is the marketing landing (rendered first for
unauthenticated users), and the React dashboard is the app.

## Architecture
- `src/data/curriculum.js` — Yemeni curriculum: stages, GRADES(1-12), SUBJECTS,
  SUBJECTS_BY_GRADE, CURRICULUM units keyed "subjectId:grade", getUnits/getLessons,
  estimateLabel (Yemeni grading, PASS_MARK=50).
- `src/lib/lessonEngine.js` — generateLessonPlan + generateSlides + PPTX/Markdown export.
- `src/lib/illustrations.js` — offline SVG illustrations (topicIllustration) + subject examples (topicExamples).
- `src/lib/notebookEngine.js` — buildNotebook (weekly plan + coverage + sample plan),
  notebookToMarkdown/Csv, TERMS.
- `src/lib/gradingEngine.js` — analyzeClass, gradeQuestion, gradePaper, sample quiz.
- `src/lib/storage.js` — LocalStorage ns `smart_teacher_v1`; hashPin/randomSalt (FNV-1a
  salted) for the owner PIN.
- `src/state/store.jsx` — useApp() global store; `usePersistent(key, initial)` helper.
  Adding a collection = add to KEYS + useState + CRUD + context value AND deps array.
- `src/state/auth.jsx` — **useAuth()** = the auth/permissions provider (replaced the
  old `owner.jsx`). Exports `APP_VERSION`, fixed `OWNER` (username `safwt`,
  display name 'مالك المنصة' — the personal name was removed), `PERMISSION_GROUPS`/`ALL_PERMISSIONS`,
  `DEFAULT_TEACHER_PERMISSIONS` (all except `users`). Context:
  `{ isAuthed, currentUser, owner, isOwner, can, logout, login, register, users,
  updateUser, changeOwnPin }`. Session in LocalStorage `users` + session flag.
  Delete `keep=['users']` is what preserves the owner across a wipe.
- `src/pages/Login.jsx` (login + "معلم جديد؟ أنشئ حساباً"), `src/pages/Users.jsx`
  (owner-only user/permission management).
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

## Textbook importer («استيراد الكتب», added 2026-10-10)
- `src/pages/Importer.jsx` — upload a curriculum PDF → browser extract (pdf.js) →
  segment into units/lessons → save to LocalStorage → merged into `getUnits`.
- `src/lib/pdfExtract.js` — pdf.js wrapper (`extractPdf`, `looksReadable`,
  `normalizeArabic`). Worker source is set from `src/lib/pdfWorker.js`; the worker
  is also base64-embedded by `build-standalone.mjs` for the single-file build.
- `src/lib/textbookSegmenter.js` — `segmentLessons` (unit/lesson headings) +
  `extractQuestions` (exercise drafts) + `tidyHeading`/`stripPageNo`.
- `src/data/importedUnits.js` — LocalStorage ns `smart_teacher_v1:importedUnits`,
  keyed `grade:subjectId`; stores `lessons` AND `questions` per unit.
- **CRITICAL GOTCHA — `\b` is ASCII-only in JS**: `\b` never matches after an Arabic
  letter, so every Arabic keyword regex using `\b` silently fails (this made
  `extractQuestions` always return 0). Use an Arabic-aware boundary instead:
  `const AR_B = '(?![\\u0621-\\u064A])'` and build the regex with `new RegExp`.
- **RTL extraction gotcha**: Arabic PDFs (esp. Chromium-printed) place the item
  number / option letter at the *visual end* of the line («....؟(١», «الأول(أ»).
  The extractor handles markers at both ends (`LEAD_NUM`/`TAIL_NUM`, `parseOption`).
- Question types align with `gradingEngine.QUESTION_TYPES`: `mcq` | `tf` | `essay`.
  Do NOT emit `true_false` (legacy; grader won't recognize it).
- Verify: `npm test` (engine) is necessary but NOT sufficient. Do a real browser E2E:
  headless Chromium + CDP (`--remote-debugging-port`), seed
  `smart_teacher_v1:users`/`profile` + `sessionStorage auth_session`, click the
  `.nav-item` whose text is «استيراد الكتب», set `input[type=file]` via
  `DOM.setFileInputFiles`, then read `localStorage importedUnits`.

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
- Signed release APK (~1.5 MB after R8, `ye.teacher.smart`, minSdk 22). Permanent:
  `releases/latest/download/smart-teacher.apk` (and `.zip`, ~1.2 MB). The Settings +
  landing download cards link both, plus the Pages mirror.
  **v1.5** is current (images+examples). R8 enabled in `android/app/build.gradle` (`minifyEnabled true`,
  `shrinkResources true`, `proguard-android-optimize.txt`) cut classes.dex 6.2→0.86 MB
  (3.3→1.5 MB APK). Capacitor ships its own consumer keep rules, so R8 is safe.
  Bump `versionCode`/`versionName` in `android/app/build.gradle` AND `APP_VERSION`
  in `src/state/auth.jsx` together. `gh release create` keeps the file basename, so
  assets must be named `smart-teacher.apk` / `.zip`. Fresh assets 404 ~1–2 min on CDN.
  NOTE: the local shell has NO `zip` — use `python3 -c "import zipfile;..."`. HARDENING
  TODO: release signing still uses default passwords (store/key `teacher123`,
  alias `teacher`) from the tracked keystore — move to repo secrets before public ship.
- **CI APK build is BROKEN (v1.5)**: `android-actions/setup-android@v3` fails on the
  runner (`sdkmanager tools` package removed → step aborts). Replaced it with a plain
  shell step using the preinstalled SDK, but the NEXT blocker is the **keystore**:
  `android/app/alfaeq-teacher.keystore` is gitignored so CI has no signing key
  (`Keystore file ... not found for signing config 'release'`). To fix: base64 the
  keystore into a repo secret + `KEYSTORE_PASSWORD`/`KEY_ALIAS`/`KEY_PASSWORD`, and
  have CI decode it before gradle. Meanwhile **build the APK locally** (SDK at
  `/workspace/tools/android-sdk`, JDK at `/workspace/tools/jdk-17.0.20.1+1`):
  `ANDROID_HOME=/workspace/tools/android-sdk JAVA_HOME=/workspace/tools/jdk-17.0.20.1+1
  PATH=$JAVA_HOME/bin:$PATH npx cap sync android && (cd android && ./gradlew assembleRelease --no-daemon)`
  then `gh release create <tag> <apk> <zip>` (a manual release supersedes the CI one).
- **`vite build` wipes `dist/`** — re-copy the APK into `dist/` after any build.
- Keystore `android/app/alfaeq-teacher.keystore` is a secret; gitignored, never commit.

## GitHub publishing (2026-10-10)
- Repo: `safwt771754091s-crypto/alfaeq-yemen` (was an empty placeholder; reused
  because the CI `GITHUB_TOKEN` is a **GitHub App token** and CANNOT create repos,
  edit repo settings, or enable Pages — those all return 403 "Resource not
  accessible by integration"). It CAN push, create releases, upload assets.
- Permanent APK link (verified byte-identical, serving v1.3):
  `https://github.com/safwt771754091s-crypto/alfaeq-yemen/releases/latest/download/smart-teacher.apk`.
  The Settings + landing download cards point here (and the Pages mirror).
- Web platform: committed production build in `docs/` (rebuild+resync after any
  src change). Pages is **now ENABLED** and `deploy-pages.yml` deploys on push to
  main (GitHub Actions source). It also auto-attaches `smart-teacher.apk` from the
  latest release to the Pages site (`docs/smart-teacher.apk`). URL:
  `https://safwt771754091s-crypto.github.io/alfaeq-yemen/`.
- jsDelivr serves repo files but as `text/plain` → NOT usable to render the SPA
  (only good for direct file downloads). Use GitHub Pages for the web app.

## Student companion («رفيق الطالب اليمني»)
- Public routes (no login, hash-based): `#quiz` (platform MCQ + evidence) and `#student`
  (student portal: hub/book/ask/timetable). Both also reachable from in-app NAV and Landing.
- Engines (pure/offline): `bookEngine.js` (page-per-lesson digital book, open by name/page),
  `voice.js` (Yemeni dialect + Web Speech), `qnaEngine.js` (grounded Q&A → teacher queue).
- Teacher answers student questions in «أسئلة الطلاب» page; queue in localStorage `st.qna.queue.v1`.

## Voice-interactive lesson («الدرس الصوتي التفاعلي», added 2026-10-10 session 17)
- `src/lib/voiceLessonEngine.js` — pure/offline: `buildVoiceLesson` (segments the
  lesson into 2-sentence paragraphs, one comprehension question each),
  `evaluateAnswer` (keyword match + Arabic stemming), `feedbackSpeech`,
  `agentReply` (delegates to `qnaEngine.askQuestion`), `classifyIntent`,
  `summarizeSession` (percent/level/strengths/needsWork).
- **Arabic stemming gotcha**: literal `includes()` misses «ال» prefixed forms.
  `stemArabic()` strips diacritics + `ال`; matching is stem-based AND a hit on the
  segment's `focus` word alone counts as correct.
- `voice.js` gained: `VOICE_PROFILES` (teacher_female/teacher_male/agent),
  `rateForGrade`, `buildSSML` (prosody+breaks; browsers don't consume SSML, so the
  plain text is spoken), `speakText` (profile-aware), `asrSupported`/`createRecognizer`
  (Web Speech `SpeechRecognition`; `ar-YE`).
- `src/lib/voiceSession.js` — LocalStorage ns `smart_teacher_v1:voiceSessions`
  (array; `openSession` reuses an unfinished session for the same lesson,
  `recordAttempt`/`recordDialog`/`endSession`/`summarize`).
- `src/pages/VoiceLesson.jsx` — start lesson → narrate → ask → answer (voice w/
  8s timeout, or text fallback) → feedback → next → finish summary. Also a tab in
  StudentPortal (`voice`) and a tile in StudentHub; NAV id `voicelesson`; permission
  added in `auth.jsx`.
- Icons added to `Icon.jsx`: Mic, Stop, Speaker, Bot, Volume.
- **`src/lib/voiceProvider.js` (cloud layer, session 17b)** — `speakSmart()` picks
  Azure/Google TTS when online + key present, else the device engine, and **auto-falls
  back to local on any cloud error**. Config in LocalStorage `smart_teacher_v1:voiceConfig`
  (`provider` auto|local|azure|google, `azureKey`, `azureRegion` default `westeurope`,
  `googleKey`, optional `proxyUrl`, `voiceNames`). `buildCloudSSML` emits Azure
  `<voice name>` (default Yemeni voice **`ar-YE-SalmaNeural`**) / Google `ar-XA`
  prosody+breaks. `resolveProvider(cfg, online)` is pure/testable. Settings page has a
  «صوت الشرح (TTS)» card (provider, keys, region, proxy, test button). The VoiceLesson
  toolbar shows the active-provider chip. Azure supports CORS (browser-safe); Google
  REST also allows browser keys. For wide public use prefer the `proxyUrl` so the key
  stays server-side. Chromium headless has NO SpeechRecognition → ASR path untestable
  headless (text fallback is the tested path).


## Content sources (see docs/CONTENT-SOURCES.md)
- Richest source = the account's own repo **`safwt771754091s-crypto/Teacher-Safwat-`
  (Laravel, Apache-2.0)**: `backend/database/data/yemen_books_all.json` = 275 Yemeni
  textbook records with direct PDF links (grades 1–12, authorities common/sanaa/aden,
  hosts `s1.yemen-books.com` + `yemenmanhaj.com`). `yemeni_curriculum.json` there mirrors
  our own curriculum.js. Also ships Laravel PDF-ingestion agents (`BookImporterAgent`,
  `CurriculumBuilderAgent`, `SegmentTextbooks`) — reuse later.
- `mohamedalawdi198-wq/khota-almotafawqeen` and `sarmadalkadasi/quiz9` have **no LICENSE**
  → attribution-only, non-commercial. Always check a repo's LICENSE before integrating.
- Integrated: `src/data/yemenBooks.js` (YEMEN_BOOKS + booksForSubject) + `src/data/sourcedContent.js`.
- Link-check gotcha: use `curl -r 0-2000` (range), not HEAD — some hosts reject HEAD.

## Daily logs
- `2026-10-09.md` — built كراسة التحضير (notebook) + حساب المالك (owner account).
- `2026-10-10.md` — sessions 1-12: reference-design restyle, grade naming, offline
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
