import { useEffect, useMemo, useRef, useState } from 'react';
import Icon from '../components/Icon.jsx';
import { generateLessonPlan } from '../lib/lessonEngine.js';
import { SUBJECTS, gradeName, subjectsForGrade } from '../data/curriculum.js';

const OWNER_NAME = 'صفوت محمد عبدالعزيز البريهي';

const NAV_LINKS = [
  { href: '#features', label: 'المميزات' },
  { href: '#tools', label: 'الأدوات' },
  { href: '#curriculum', label: 'المنهج اليمني' },
  { href: '#testimonials', label: 'آراء المعلمين' },
  { href: '#faq', label: 'الأسئلة' },
  { href: '#contact', label: 'تواصل' }
];

const FEATURES = [
  { icon: '📝', title: 'التحضير الذكي', text: 'ولّد تحضيراً كاملاً بالأهداف والتمهيد والعرض والتقويم بضغطة واحدة، ثم عدّله كما تشاء.' },
  { icon: '📚', title: 'المنهج اليمني', text: 'مرتبط بمراحل التعليم في اليمن: الأساسي (1–9) والثانوي بقسميه العلمي والأدبي.' },
  { icon: '🧮', title: 'حساب الدرجات', text: 'أدخل درجة الأعمال والفرض والامتحان ويُحسب المجموع والنسبة والتقدير تلقائياً وبدقة.' },
  { icon: '🗓️', title: 'الحضور والغياب', text: 'سجّل حضور طلابك يومياً واطلع على نسب الغياب والتأخر بتقرير واضح وإحصاءات جاهزة.' },
  { icon: '🏆', title: 'مولّد الشهادات', text: 'شهادات تقدير وتفوق أنيقة تُعبّأ تلقائياً بالاسم والمادة ويمكن طباعتها فوراً.' },
  { icon: '🧪', title: 'بنك الأسئلة والتصحيح', text: 'أنشئ أسئلة اختيار من متعدد وصح/خطأ ومقالية، مع تصحيح وتحليل فوري لأخطاء الطلاب.' },
  { icon: '🎬', title: 'العروض التقديمية', text: 'ولّد شرائح جاهزة للعرض والتصدير (Markdown / PowerPoint) من عناصر الدرس.' },
  { icon: '📊', title: 'تقارير ومتابعة', text: 'تقارير عن أداء الطلاب والمستويات ومتابعة الحالات العلاجية والإثرائية.' },
  { icon: '🌍', title: 'يعمل بلا إنترنت', text: 'بياناتك تُحفظ في متصفحك، فتصل لأدواتك حتى مع ضعف الاتصال أو انقطاعه.' }
];

const STAGES = [
  {
    icon: '🧸', title: 'التعليم الأساسي (الحلقة الأولى)', text: 'من الصف الأول حتى الرابع — أساس قوي للقراءة والحساب والمهارات.',
    items: ['القرآن الكريم والتربية الإسلامية', 'اللغة العربية والرياضيات', 'العلوم والتربية الفنية', 'التربية الرياضية']
  },
  {
    icon: '🎒', title: 'التعليم الأساسي (الحلقة الثانية)', text: 'من الصف الخامس حتى التاسع — تعميق المفاهيم وبناء مهارات التفكير والتحليل.',
    items: ['الرياضيات والعلوم', 'الاجتماعيات واللغة الإنجليزية', 'مهارات الحاسوب والتربية المهنية', 'القرآن واللغة العربية']
  },
  {
    icon: '🎓', title: 'المرحلة الثانوية', text: 'القسمان العلمي والأدبي تحضيراً للجامعة وسوق العمل.',
    items: ['القسم العلمي: فيزياء وكيمياء وأحياء', 'القسم الأدبي: تاريخ وجغرافيا وفلسفة', 'الرياضيات واللغة الإنجليزية', 'المواطنة والتقويم والامتحانات']
  }
];

const TESTIMONIALS = [
  { name: 'أ. عبدالله الحميري', role: 'معلم رياضيات — صنعاء', initial: 'ع', text: 'وفّرت عليّ ساعات في التحضير اليومي. أكتب عنوان الدرس ويطلع لي تحضير كامل، أعدّله وأطبع. تجربة ممتازة.' },
  { name: 'أ. سارة المقطري', role: 'معلمة لغة إنجليزية — عدن', initial: 'س', text: 'سجل الدرجات والحضور سهّل متابعتي لطلابي كثيراً، والتقارير ساعدتني في الاجتماعات مع الإدارة وأولياء الأمور.' },
  { name: 'أ. محمد الشرعبي', role: 'وكيل مدرسة — تعز', initial: 'م', text: 'مولّد الشهادات رائع! طبعنا شهادات تفوق الطلاب في دقائق بتصميم أبهى مما كنا نستعمل. أنصح كل معلم بتجربتها.' }
];

const FAQ = [
  { q: 'هل أحتاج إلى إنترنت لاستخدام المنصة؟', a: 'الأدوات الأساسية تعمل داخل متصفحك وتُحفظ بياناتك محلياً (LocalStorage)، فيمكنك استخدامها حتى مع اتصال ضعيف أو منقطع. بعض الميزات المطوّرة تحتاج اتصالاً.' },
  { q: 'هل بيانات طلابي آمنة؟', a: 'نعم، تُخزَّن بياناتك في متصفح جهازك فقط ولا تُرسَل إلى أي جهة خارجية، ويمكنك حذفها في أي وقت من الإعدادات.' },
  { q: 'هل تناسب المنصة جميع المواد والصفوف؟', a: 'بالتأكيد، صُممت الأدوات لتكون مرنة وتصلح لكل المواد والمراحل من التعليم الأساسي (1–9) حتى الثانوي بقسميه العلمي والأدبي.' },
  { q: 'هل المنصة مجانية؟', a: 'جميع الأدوات الأساسية مجانية بالكامل للمعلم اليمني. نعمل على إضافة ميزات متقدمة للمدارس والمعلمين المحترفين.' },
  { q: 'كيف أبدأ؟', a: 'اضغط «ابدأ الآن مجاناً» وأنشئ حسابك (معلم جديد)، أو ادخل بحساب المالك لإكمال الإعداد الأولي، ثم اختر أداة وابدأ فوراً.' }
];

function gradeLabel(total) {
  if (total >= 90) return { label: 'ممتاز', color: 'text-emerald-600' };
  if (total >= 80) return { label: 'جيد جداً', color: 'text-teal-600' };
  if (total >= 70) return { label: 'جيد', color: 'text-sky-600' };
  if (total >= 60) return { label: 'مقبول', color: 'text-amber-600' };
  if (total >= 50) return { label: 'ضعيف', color: 'text-orange-600' };
  return { label: 'راسب', color: 'text-rose-600' };
}

function ToolTabs({ tab, setTab }) {
  const tabs = [
    { id: 'lesson', label: '📝 مولّد التحضير' },
    { id: 'grades', label: '🧮 حاسبة الدرجات' },
    { id: 'cert', label: '🏆 مولّد الشهادات' }
  ];
  return (
    <div className="flex flex-wrap justify-center gap-2 mb-6">
      {tabs.map((t) => (
        <button
          key={t.id}
          onClick={() => setTab(t.id)}
          className={`rounded-full px-5 py-2.5 text-sm font-extrabold transition ${tab === t.id ? 'bg-brand-700 text-white shadow-soft' : 'bg-white text-slate-600 border border-slate-200 hover:border-brand-300'}`}
        >
          {t.label}
        </button>
      ))}
    </div>
  );
}

export default function Landing({ onStart }) {
  const [dark, setDark] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [tab, setTab] = useState('lesson');
  const [faqOpen, setFaqOpen] = useState(0);

  const [les, setLes] = useState({ title: '', subject: 'math', grade: 5, duration: 45 });
  const [lesson, setLesson] = useState(null);

  const [marks, setMarks] = useState({ work: 18, quiz: 16, exam: 52 });
  const [cert, setCert] = useState({ student: '', teacher: '', school: '', type: 'شهادة تفوق دراسي' });
  const certRef = useRef(null);

  useEffect(() => {
    if (dark) document.documentElement.classList.add('dark');
    else document.documentElement.classList.remove('dark');
  }, [dark]);

  const subjects = useMemo(() => subjectsForGrade(Number(les.grade)), [les.grade]);

  const genLesson = () => {
    if (!les.title.trim()) { setLesson({ error: 'اكتب عنوان الدرس أولاً' }); return; }
    const plan = generateLessonPlan({
      subjectId: les.subject,
      grade: Number(les.grade),
      title: les.title.trim(),
      duration: Number(les.duration)
    });
    setLesson(plan);
  };

  const total = Math.min(20, Number(marks.work) || 0) + Math.min(20, Number(marks.quiz) || 0) + Math.min(60, Number(marks.exam) || 0);
  const pct = Math.round((total / 100) * 100);
  const gl = gradeLabel(total);

  const printCert = () => window.print();

  return (
    <div className="min-h-screen bg-[var(--landing-bg)] text-slate-800" dir="rtl" style={{ '--landing-bg': dark ? '#0a1628' : '#f8fffe' }}>
      {/* Header */}
      <header className="sticky top-0 z-40 border-b border-slate-200/70 bg-white/85 backdrop-blur dark:bg-navy-900/85 dark:border-white/10">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 h-16 flex items-center gap-3">
          <a href="#home" className="flex items-center gap-2.5 shrink-0">
            <span className="grid place-items-center w-10 h-10 rounded-2xl bg-gradient-to-br from-brand-500 to-brand-700 text-white shadow-soft">🎓</span>
            <span className="leading-tight">
              <b className="block font-extrabold text-slate-800 dark:text-white text-[15px]">منصة المعلم الذكية</b>
              <span className="block text-[11px] text-slate-400 font-bold">للمعلم اليمني</span>
            </span>
          </a>
          <nav className="hidden lg:flex items-center gap-1 mr-2">
            {NAV_LINKS.map((l) => (
              <a key={l.href} href={l.href} className="rounded-lg px-3 py-2 text-sm font-bold text-slate-600 hover:text-brand-700 hover:bg-brand-50 dark:text-slate-300 dark:hover:bg-white/5">{l.label}</a>
            ))}
          </nav>
          <div className="mr-auto flex items-center gap-2">
            <button onClick={() => setDark((v) => !v)} className="grid place-items-center w-10 h-10 rounded-xl border border-slate-200 text-lg hover:border-brand-300 dark:border-white/10" title="الوضع الليلي">
              {dark ? '☀️' : '🌙'}
            </button>
            <button onClick={onStart} className="btn-primary !py-2.5">ابدأ مجاناً ✨</button>
            <button onClick={() => setMenuOpen((v) => !v)} className="lg:hidden grid place-items-center w-10 h-10 rounded-xl border border-slate-200 dark:border-white/10" aria-label="القائمة">
              <Icon.Menu size={20} />
            </button>
          </div>
        </div>
        {menuOpen && (
          <nav className="lg:hidden border-t border-slate-100 dark:border-white/10 bg-white dark:bg-navy-900 px-4 py-3 grid gap-1">
            {NAV_LINKS.map((l) => (
              <a key={l.href} href={l.href} onClick={() => setMenuOpen(false)} className="rounded-lg px-3 py-2.5 text-sm font-bold text-slate-600 hover:bg-brand-50 dark:text-slate-300 dark:hover:bg-white/5">{l.label}</a>
            ))}
          </nav>
        )}
      </header>

      {/* Hero */}
      <section id="home" className="relative overflow-hidden">
        <span className="pointer-events-none absolute -top-24 -left-16 w-96 h-96 rounded-full bg-brand-300/25 blur-3xl" />
        <span className="pointer-events-none absolute top-10 -right-20 w-80 h-80 rounded-full bg-sand-300/25 blur-3xl" />
        <div className="mx-auto max-w-6xl px-4 sm:px-6 py-12 lg:py-20 grid lg:grid-cols-2 gap-10 items-center relative">
          <div>
            <span className="inline-flex items-center gap-2 rounded-full bg-sand-50 text-sand-800 ring-1 ring-sand-200 px-4 py-1.5 text-xs font-extrabold dark:bg-white/5 dark:text-sand-300 dark:ring-white/10">🇾🇪 صُنع خصيصاً لمعلم اليمن</span>
            <h1 className="mt-4 text-3xl sm:text-4xl lg:text-5xl font-extrabold leading-tight text-slate-900 dark:text-white">
              منصة <span className="bg-gradient-to-l from-brand-600 to-brand-800 bg-clip-text text-transparent">المعلم اليمني</span> الذكية<br />كل أدواتك في مكان واحد
            </h1>
            <p className="mt-4 text-base sm:text-lg text-slate-600 dark:text-slate-300 font-bold leading-relaxed">
              حضّر دروسك، ولّد عروضك التقديمية، صحّح اختباراتك، وسجّل الدرجات والحضور والشهادات بضغطة زر — بواجهة عربية أنيقة تعمل على الجوال والحاسوب، ومتوافقة مع المنهج اليمني.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <button onClick={onStart} className="btn-primary !py-3"><Icon.Sparkles size={18} /> 🛠️ جرّب الأدوات الآن</button>
              <a href="#curriculum" className="btn-outline !py-3">📚 استكشف المنهج اليمني</a>
            </div>
            <div className="mt-6 flex flex-wrap gap-x-5 gap-y-2 text-sm font-bold text-slate-500 dark:text-slate-400">
              <span className="inline-flex items-center gap-1.5">⚡ بدون تسجيل معقّد</span>
              <span className="inline-flex items-center gap-1.5">🔒 بياناتك محفوظة في جهازك</span>
              <span className="inline-flex items-center gap-1.5">📱 يعمل على الجوال</span>
            </div>
          </div>
          {/* Mock window */}
          <div className="relative">
            <div className="rounded-3xl border border-white/40 bg-white/80 backdrop-blur shadow-xl p-4 dark:bg-white/5 dark:border-white/10">
              <div className="flex gap-1.5 mb-3">
                <span className="w-2.5 h-2.5 rounded-full bg-rose-400" />
                <span className="w-2.5 h-2.5 rounded-full bg-amber-400" />
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
              </div>
              {[
                { i: '📝', t: 'تحضير درس: الكسور المتكافئة', s: 'الرياضيات — الصف الخامس', w: '100%' },
                { i: '📊', t: 'سجل الدرجات — الفصل الأول', s: '32 طالباً — متوسط 87%', w: '87%' },
                { i: '🗓️', t: 'الحضور والغياب — اليوم', s: 'حاضر 29 | غائب 3', w: '90%' },
                { i: '🏆', t: 'شهادة تفوق — جاهزة للطباعة', s: 'توليد تلقائي بالاسم', w: '100%' }
              ].map((r) => (
                <div key={r.t} className="flex items-center gap-3 rounded-2xl bg-white p-3 mb-2 shadow-sm dark:bg-navy-800">
                  <span className="grid place-items-center w-9 h-9 rounded-xl bg-brand-50 text-lg">{r.i}</span>
                  <div className="min-w-0 grow">
                    <b className="block text-[13px] text-slate-800 truncate dark:text-white">{r.t}</b>
                    <small className="block text-[11px] text-slate-400 font-bold truncate">{r.s}</small>
                    <div className="mt-1.5 h-1.5 rounded-full bg-slate-100 overflow-hidden"><i className="block h-full rounded-full bg-gradient-to-l from-brand-500 to-brand-700" style={{ width: r.w }} /></div>
                  </div>
                </div>
              ))}
            </div>
            <div className="absolute -bottom-4 right-2 rounded-2xl bg-white shadow-lg px-3 py-2 flex items-center gap-2 dark:bg-navy-800">
              <span className="text-xl">📚</span><div className="leading-tight"><b className="text-sm text-brand-700 dark:text-brand-300">+120</b><small className="block text-[10px] text-slate-400 font-bold">نموذج جاهز</small></div>
            </div>
            <div className="absolute -top-4 left-2 rounded-2xl bg-white shadow-lg px-3 py-2 flex items-center gap-2 dark:bg-navy-800">
              <span className="text-xl">⏱️</span><div className="leading-tight"><b className="text-sm text-sand-600">5 دقائق</b><small className="block text-[10px] text-slate-400 font-bold">لتجهيز درسك</small></div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="bg-gradient-to-l from-navy-900 to-brand-800 text-white">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 py-8 grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
          {[['+12,000', 'معلم يمني'], ['+35,000', 'درس محضَّر'], ['+480', 'مدرسة مشاركة'], ['98%', 'رضا المعلمين']].map((s) => (
            <div key={s[1]}><div className="text-2xl sm:text-3xl font-extrabold">{s[0]}</div><div className="text-xs sm:text-sm text-white/75 font-bold mt-1">{s[1]}</div></div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section id="features" className="py-14 sm:py-20">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="text-center max-w-2xl mx-auto mb-10">
            <span className="text-xs font-extrabold text-brand-700 dark:text-brand-300">✨ لماذا منصتنا؟</span>
            <h2 className="mt-2 text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white">كل ما يحتاجه المعلم الرقمي في اليمن</h2>
            <p className="mt-3 text-slate-500 dark:text-slate-400 font-bold">أدوات عملية صُممت لتوفّر وقتك وتُحسّن تجربتك التعليمية، من التحضير اليومي حتى التقارير والشهادات.</p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {FEATURES.map((f) => (
              <div key={f.title} className="card p-5 transition hover:-translate-y-0.5 hover:shadow-lg dark:bg-white/5 dark:border-white/10">
                <div className="grid place-items-center w-12 h-12 rounded-2xl bg-brand-50 text-2xl mb-3 dark:bg-white/10">{f.icon}</div>
                <h3 className="font-extrabold text-slate-800 dark:text-white">{f.title}</h3>
                <p className="mt-1.5 text-sm text-slate-500 dark:text-slate-400 font-bold leading-relaxed">{f.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Tools */}
      <section id="tools" className="py-14 sm:py-20 bg-gradient-to-b from-brand-50/60 to-transparent dark:from-white/5">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="text-center max-w-2xl mx-auto mb-8">
            <span className="text-xs font-extrabold text-brand-700 dark:text-brand-300">🛠️ جرّبها الآن</span>
            <h2 className="mt-2 text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white">أدوات ذكية تعمل الآن بين يديك</h2>
            <p className="mt-3 text-slate-500 dark:text-slate-400 font-bold">عاين الأدوات مباشرة — للتسجيل الكامل اضغط «ابدأ مجاناً».</p>
          </div>
          <ToolTabs tab={tab} setTab={setTab} />
          <div className="card p-5 sm:p-7 max-w-4xl mx-auto dark:bg-white/5 dark:border-white/10">
            {tab === 'lesson' && (
              <div>
                <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  <label className="block"><span className="text-xs font-extrabold text-slate-500">عنوان الدرس</span>
                    <input className="input mt-1" placeholder="مثال: الكسور المتكافئة" value={les.title} onChange={(e) => setLes({ ...les, title: e.target.value })} /></label>
                  <label className="block"><span className="text-xs font-extrabold text-slate-500">المادة</span>
                    <select className="input mt-1" value={les.subject} onChange={(e) => setLes({ ...les, subject: e.target.value })}>
                      {subjects.map((s) => <option key={s.id} value={s.id}>{s.icon} {s.name}</option>)}
                    </select></label>
                  <label className="block"><span className="text-xs font-extrabold text-slate-500">الصف</span>
                    <select className="input mt-1" value={les.grade} onChange={(e) => setLes({ ...les, grade: e.target.value })}>
                      {Array.from({ length: 12 }, (_, i) => i + 1).map((g) => <option key={g} value={g}>{gradeName(g)}</option>)}
                    </select></label>
                  <label className="block"><span className="text-xs font-extrabold text-slate-500">مدة الحصة</span>
                    <select className="input mt-1" value={les.duration} onChange={(e) => setLes({ ...les, duration: e.target.value })}>
                      {[45, 60, 90].map((d) => <option key={d} value={d}>{d} دقيقة</option>)}
                    </select></label>
                </div>
                <button onClick={genLesson} className="btn-primary mt-5"><Icon.Sparkles size={18} /> ✨ ولّد التحضير الكامل</button>
                <div className="mt-5 rounded-2xl bg-slate-50 p-4 min-h-[120px] dark:bg-navy-800/60">
                  {!lesson && <p className="text-sm text-slate-400 font-bold text-center py-6">اكتب عنوان الدرس واسم المادة ثم اضغط «ولّد» ليظهر التحضير الكامل جاهزاً… 🎓</p>}
                  {lesson?.error && <p className="text-sm text-rose-600 font-bold text-center py-6">{lesson.error}</p>}
                  {lesson && !lesson.error && (
                    <div className="text-sm space-y-3">
                      <div className="flex items-center justify-between flex-wrap gap-2">
                        <b className="text-brand-800 dark:text-brand-200 text-base">تحضير درس: {lesson.title}</b>
                        <span className="chip bg-brand-50 text-brand-700">{lesson.subjectName} — {lesson.gradeName}</span>
                      </div>
                      <div><b className="text-slate-700 dark:text-slate-200">الأهداف:</b>
                        <ul className="list-disc pr-5 mt-1 text-slate-600 dark:text-slate-300 space-y-0.5">{lesson.objectives.slice(0, 4).map((o, i) => <li key={i}>{o}</li>)}</ul>
                      </div>
                      <div><b className="text-slate-700 dark:text-slate-200">خطوات الحصة:</b>
                        <ul className="mt-1 space-y-1 text-slate-600 dark:text-slate-300">{lesson.phases.map((p, i) => <li key={i} className="flex gap-2"><span className="chip bg-sand-100 text-sand-800 shrink-0">{p.minutes}د</span>{p.name}</li>)}</ul>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
            {tab === 'grades' && (
              <div>
                <div className="grid sm:grid-cols-3 gap-4">
                  <label className="block"><span className="text-xs font-extrabold text-slate-500">درجة الأعمال (من 20)</span><input type="number" min="0" max="20" className="input mt-1" value={marks.work} onChange={(e) => setMarks({ ...marks, work: e.target.value })} /></label>
                  <label className="block"><span className="text-xs font-extrabold text-slate-500">درجة الفرض (من 20)</span><input type="number" min="0" max="20" className="input mt-1" value={marks.quiz} onChange={(e) => setMarks({ ...marks, quiz: e.target.value })} /></label>
                  <label className="block"><span className="text-xs font-extrabold text-slate-500">درجة الامتحان (من 60)</span><input type="number" min="0" max="60" className="input mt-1" value={marks.exam} onChange={(e) => setMarks({ ...marks, exam: e.target.value })} /></label>
                </div>
                <div className="mt-6 rounded-2xl bg-slate-50 p-6 text-center dark:bg-navy-800/60">
                  <div className="text-4xl font-extrabold text-brand-700 dark:text-brand-300 tabular-nums">{total} / 100</div>
                  <div className={`mt-2 text-lg font-extrabold ${gl.color}`}>{gl.label}</div>
                  <div className="text-xs text-slate-400 font-bold mt-1">النسبة المئوية: {pct}%</div>
                </div>
              </div>
            )}
            {tab === 'cert' && (
              <div>
                <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  <label className="block"><span className="text-xs font-extrabold text-slate-500">اسم الطالب/الطالبة</span><input className="input mt-1" placeholder="اكتب الاسم" value={cert.student} onChange={(e) => setCert({ ...cert, student: e.target.value })} /></label>
                  <label className="block"><span className="text-xs font-extrabold text-slate-500">اسم المعلم</span><input className="input mt-1" placeholder="اسم المعلم" value={cert.teacher} onChange={(e) => setCert({ ...cert, teacher: e.target.value })} /></label>
                  <label className="block"><span className="text-xs font-extrabold text-slate-500">المدرسة</span><input className="input mt-1" placeholder="اسم المدرسة" value={cert.school} onChange={(e) => setCert({ ...cert, school: e.target.value })} /></label>
                  <label className="block"><span className="text-xs font-extrabold text-slate-500">نوع الشهادة</span>
                    <select className="input mt-1" value={cert.type} onChange={(e) => setCert({ ...cert, type: e.target.value })}>
                      {['شهادة تفوق دراسي', 'شهادة شكر وتقدير', 'شهادة تحسّن ملحوظ', 'شهادة مشاركة فعالة'].map((t) => <option key={t}>{t}</option>)}
                    </select></label>
                </div>
                <div ref={certRef} className="mt-5 rounded-2xl border-4 border-double border-brand-700 bg-white p-6 text-center">
                  <div className="text-2xl font-extrabold text-brand-700">🏅 {cert.type}</div>
                  <div className="w-20 h-1 bg-sand-500 mx-auto my-3 rounded-full" />
                  <p className="text-sm text-slate-500 font-bold">تُمنح هذه الشهادة تقديراً للتفوق والاجتهاد إلى</p>
                  <div className="text-2xl font-extrabold text-sand-600 mt-2">{cert.student || 'اسم الطالب'}</div>
                  <div className="text-xs text-slate-400 font-bold mt-3">{cert.school || 'اسم المدرسة'}</div>
                  <div className="flex justify-between mt-6 text-xs font-extrabold text-slate-500">
                    <span className="border-t border-slate-200 pt-1 min-w-[120px]">{cert.teacher || 'المعلم'}</span>
                    <span className="border-t border-slate-200 pt-1 min-w-[120px]">{new Date().toLocaleDateString('ar-EG')}</span>
                  </div>
                </div>
                <button onClick={printCert} className="btn-sand mt-4 no-print"><Icon.Print size={18} /> 🖨️ معاينة وطباعة الشهادة</button>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Curriculum */}
      <section id="curriculum" className="py-14 sm:py-20">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="text-center max-w-2xl mx-auto mb-10">
            <span className="text-xs font-extrabold text-brand-700 dark:text-brand-300">📚 مراحل التعليم في اليمن</span>
            <h2 className="mt-2 text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white">محتوى مطابق للمنهج اليمني</h2>
            <p className="mt-3 text-slate-500 dark:text-slate-400 font-bold">نُظّم المحتوى حسب النظام التعليمي اليمني — التعليم الأساسي (1–9) والمرحلة الثانوية بقسميها العلمي والأدبي.</p>
          </div>
          <div className="grid md:grid-cols-3 gap-4">
            {STAGES.map((s) => (
              <div key={s.title} className="card p-6 dark:bg-white/5 dark:border-white/10">
                <div className="text-4xl mb-3">{s.icon}</div>
                <h3 className="font-extrabold text-slate-800 dark:text-white">{s.title}</h3>
                <p className="mt-1.5 text-sm text-slate-500 dark:text-slate-400 font-bold">{s.text}</p>
                <ul className="mt-3 space-y-1.5">
                  {s.items.map((it) => <li key={it} className="flex items-center gap-2 text-sm font-bold text-slate-600 dark:text-slate-300"><Icon.Check size={15} className="text-brand-600 shrink-0" />{it}</li>)}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section id="testimonials" className="py-14 sm:py-20 bg-brand-50/60 dark:bg-white/5">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="text-center max-w-2xl mx-auto mb-10">
            <span className="text-xs font-extrabold text-brand-700 dark:text-brand-300">💬 قالوا عنا</span>
            <h2 className="mt-2 text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white">معلمون من مختلف المحافظات اليمنية</h2>
          </div>
          <div className="grid md:grid-cols-3 gap-4">
            {TESTIMONIALS.map((t) => (
              <div key={t.name} className="card p-5 dark:bg-navy-800 dark:border-white/10">
                <div className="text-sand-500 text-lg">★★★★★</div>
                <p className="mt-2 text-sm text-slate-600 dark:text-slate-300 font-bold leading-relaxed">«{t.text}»</p>
                <div className="mt-4 flex items-center gap-3">
                  <span className="grid place-items-center w-10 h-10 rounded-full bg-gradient-to-br from-brand-500 to-brand-700 text-white font-extrabold">{t.initial}</span>
                  <div><b className="block text-sm text-slate-800 dark:text-white">{t.name}</b><small className="text-[11px] text-slate-400 font-bold">{t.role}</small></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="py-14 sm:py-20">
        <div className="mx-auto max-w-3xl px-4 sm:px-6">
          <div className="text-center mb-8">
            <span className="text-xs font-extrabold text-brand-700 dark:text-brand-300">❓ استفسارات</span>
            <h2 className="mt-2 text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white">الأسئلة الشائعة</h2>
          </div>
          <div className="space-y-2">
            {FAQ.map((f, i) => (
              <div key={f.q} className="card overflow-hidden dark:bg-white/5 dark:border-white/10">
                <button onClick={() => setFaqOpen(faqOpen === i ? -1 : i)} className="w-full flex items-center justify-between gap-3 px-4 py-3.5 text-right">
                  <b className="text-sm text-slate-800 dark:text-white">{f.q}</b>
                  <span className={`text-brand-700 dark:text-brand-300 text-xl transition-transform ${faqOpen === i ? 'rotate-45' : ''}`}>＋</span>
                </button>
                {faqOpen === i && <div className="px-4 pb-4 -mt-1 text-sm text-slate-500 dark:text-slate-400 font-bold leading-relaxed">{f.a}</div>}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="px-4 sm:px-6 pb-14">
        <div className="mx-auto max-w-5xl rounded-3xl bg-gradient-to-l from-navy-900 to-brand-800 text-white p-8 sm:p-12 text-center shadow-xl">
          <h2 className="text-2xl sm:text-3xl font-extrabold">جاهز لتوفير وقتك والارتقاء بتدريسك؟</h2>
          <p className="mt-3 text-white/80 font-bold max-w-2xl mx-auto">ابدأ الآن مجاناً — أنشئ حسابك أو ادخل بحساب المالك لإكمال الإعداد، وكل بياناتك محفوظة على جهازك.</p>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <button onClick={onStart} className="btn-sand !py-3">🚀 ابدأ الآن مجاناً</button>
            <a href="#contact" className="btn-ghost !py-3 bg-white/10 text-white hover:bg-white/20">📩 تواصل معنا للمدارس</a>
          </div>
        </div>
      </section>

      {/* Contact + Footer */}
      <section id="contact" className="py-14 bg-slate-50 dark:bg-navy-950/40">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="text-center mb-8">
            <span className="text-xs font-extrabold text-brand-700 dark:text-brand-300">📩 تواصل معنا</span>
            <h2 className="mt-2 text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white">لديك سؤال أو مقترح؟ نحن نسمعك</h2>
          </div>
          <div className="grid md:grid-cols-2 gap-6">
            <div className="space-y-3">
              <div className="card p-4 flex items-center gap-3 dark:bg-white/5 dark:border-white/10"><span className="text-2xl">📍</span><div><b className="block text-sm text-slate-800 dark:text-white">الموقع</b><span className="text-xs text-slate-400 font-bold">اليمن — نخدم جميع المحافظات والمدن</span></div></div>
              <div className="card p-4 flex items-center gap-3 dark:bg-white/5 dark:border-white/10"><span className="text-2xl">✉️</span><div><b className="block text-sm text-slate-800 dark:text-white">البريد الإلكتروني</b><span className="text-xs text-slate-400 font-bold">support@yemen-teacher.app</span></div></div>
              <div className="card p-4 flex items-center gap-3 dark:bg-white/5 dark:border-white/10"><span className="text-2xl">📱</span><div><b className="block text-sm text-slate-800 dark:text-white">واتساب / الهاتف</b><span className="text-xs text-slate-400 font-bold">+967 7XX XXX XXX</span></div></div>
              <div className="card p-4 flex items-center gap-3 dark:bg-white/5 dark:border-white/10"><span className="text-2xl">🕐</span><div><b className="block text-sm text-slate-800 dark:text-white">أوقات الرد</b><span className="text-xs text-slate-400 font-bold">يومياً من 9 صباحاً حتى 5 مساءً</span></div></div>
            </div>
            <ContactForm />
          </div>
        </div>
      </section>

      <footer className="bg-navy-900 text-slate-300">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 py-10 grid sm:grid-cols-2 lg:grid-cols-4 gap-8">
          <div>
            <div className="flex items-center gap-2.5">
              <span className="grid place-items-center w-10 h-10 rounded-2xl bg-gradient-to-br from-brand-500 to-brand-700 text-white">🎓</span>
              <b className="text-white font-extrabold">منصة المعلم الذكية</b>
            </div>
            <p className="mt-3 text-sm text-slate-400 font-bold leading-relaxed">منصة متكاملة تجمع أدوات المعلم اليمني في مكان واحد، لتوفير الوقت والجهد والارتقاء بجودة التعليم.</p>
          </div>
          <div><b className="block text-white font-extrabold mb-2">المنصة</b><ul className="space-y-1.5 text-sm font-bold text-slate-400">{NAV_LINKS.map((l) => <li key={l.href}><a href={l.href} className="hover:text-white">{l.label}</a></li>)}</ul></div>
          <div><b className="block text-white font-extrabold mb-2">الأدوات</b><ul className="space-y-1.5 text-sm font-bold text-slate-400"><li>مولّد التحضير</li><li>حاسبة الدرجات</li><li>سجل الحضور</li><li>مولّد الشهادات</li></ul></div>
          <div><b className="block text-white font-extrabold mb-2">المالك</b><p className="text-sm font-bold text-slate-400">{OWNER_NAME}</p><button onClick={onStart} className="btn-sand mt-3 !py-2 text-xs">دخول المنصة</button></div>
        </div>
        <div className="border-t border-white/10 py-4 text-center text-xs text-slate-500 font-bold">
          © 2026 منصة المعلم الذكية — جميع الحقوق محفوظة • صُنع بحب لمعلمي اليمن 🇾🇪
        </div>
      </footer>
    </div>
  );
}

function ContactForm() {
  const [sent, setSent] = useState(false);
  const [f, setF] = useState({ name: '', contact: '', msg: '' });
  const submit = (e) => {
    e.preventDefault();
    setSent(true);
    setF({ name: '', contact: '', msg: '' });
  };
  return (
    <form onSubmit={submit} className="card p-5 space-y-4 dark:bg-white/5 dark:border-white/10">
      <div className="grid sm:grid-cols-2 gap-4">
        <label className="block"><span className="text-xs font-extrabold text-slate-500">الاسم</span><input required className="input mt-1" placeholder="اسمك الكريم" value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} /></label>
        <label className="block"><span className="text-xs font-extrabold text-slate-500">البريد أو الهاتف</span><input required className="input mt-1" placeholder="وسيلة التواصل" value={f.contact} onChange={(e) => setF({ ...f, contact: e.target.value })} /></label>
      </div>
      <label className="block"><span className="text-xs font-extrabold text-slate-500">الرسالة</span><textarea required rows={4} className="input mt-1" placeholder="اكتب رسالتك أو استفسارك…" value={f.msg} onChange={(e) => setF({ ...f, msg: e.target.value })} /></label>
      <button type="submit" className="btn-primary"><Icon.Send size={18} /> إرسال الرسالة ✉️</button>
      {sent && <p className="text-sm text-emerald-600 font-bold">✅ تم استلام رسالتك، سنتواصل معك قريباً.</p>}
    </form>
  );
}
