import Icon from '../components/Icon.jsx';
import { Card, SectionHeader, StatCard, EmptyState, ProgressBar } from '../components/UI.jsx';
import { useApp } from '../state/store.jsx';
import { useAuth } from '../state/auth.jsx';
import { formatDate, pct } from '../lib/utils.js';
import { estimateLabel, PASS_MARK } from '../data/curriculum.js';

export default function Dashboard({ go }) {
  const { profile, classes, students, lessons, notebooks, presentations, quizzes, assessments, certificates, activity } = useApp();
  const { currentUser, isOwner } = useAuth();
  const displayName = currentUser?.name || profile.name;
  const greetName = isOwner ? 'مالك المنصة' : displayName;

  const quick = [
    { id: 'planner', name: 'تحضير درس', icon: Icon.Sparkles, desc: 'توليد تحضير احترافي', tone: 'bg-brand-600' },
    { id: 'notebook', name: 'كراسة التحضير', icon: Icon.Clipboard, desc: 'خطة فصلية كاملة', tone: 'bg-teal-600' },
    { id: 'presentations', name: 'عرض تقديمي', icon: Icon.Slides, desc: 'شرائح جاهزة للتصدير', tone: 'bg-sand-500' },
    { id: 'grader', name: 'تصحيح ذكي', icon: Icon.CheckCircle, desc: 'رصد وتحليل تلقائي', tone: 'bg-sky-600' },
    { id: 'attendance', name: 'تسجيل الحضور', icon: Icon.Calendar, desc: 'يومي بالإحصائيات', tone: 'bg-violet-600' },
    { id: 'certificates', name: 'إنشاء شهادة', icon: Icon.Award, desc: 'تفوق وتقدير', tone: 'bg-amber-500' }
  ];

  // ملخص الأداء العام عبر التقييمات
  const classAverages = classes.map((c) => {
    const cls = students.filter((s) => s.classId === c.id);
    const relAssess = assessments.filter((a) => a.classId === c.id);
    const vals = [];
    cls.forEach((s) => {
      const obtained = relAssess.reduce((a, x) => a + (x.scores?.[s.id] || 0), 0);
      const max = relAssess.reduce((a, x) => a + (Number(x.max) || 0), 0);
      if (max > 0) vals.push(pct(obtained, max));
    });
    const avg = vals.length ? Math.round((vals.reduce((a, b) => a + b, 0) / vals.length) * 10) / 10 : 0;
    return { cls: c, count: cls.length, avg, hasData: vals.length > 0 };
  });

  const withData = classAverages.filter((c) => c.hasData);

  return (
    <div className="space-y-6">
      {/* ترحيب — بطاقة رئيسية بأسلوب المنصة */}
      <div className="relative overflow-hidden rounded-3xl bg-hero-gradient text-white p-6 sm:p-8 shadow-lg">
        <span className="absolute -top-16 -left-10 w-56 h-56 rounded-full bg-white/10 blur-2xl pointer-events-none" />
        <span className="absolute -bottom-20 right-10 w-64 h-64 rounded-full bg-brand-300/20 blur-3xl pointer-events-none" />
        <div className="relative flex flex-col sm:flex-row sm:items-center gap-5">
          <span className="grid place-items-center w-16 h-16 rounded-3xl bg-white/15 backdrop-blur text-white shrink-0 ring-1 ring-white/25">
            <Icon.School size={34} />
          </span>
          <div className="grow">
            <span className="chip bg-white/15 text-white/95 mb-2">🇾🇪 صُنع خصيصاً لمعلم اليمن</span>
            <h2 className="text-2xl sm:text-3xl font-extrabold leading-tight">
              أهلاً بك{greetName ? ` ${isOwner ? '' : 'أ. '}${greetName}` : ''} 👋
            </h2>
            <p className="text-white/85 font-bold mt-1.5 max-w-2xl">
              منصة المعلم الذكية — نظّم تحضيرك، وولّد عروضك، وصحّح وسجّل بذكاء، بواجهة عربية أنيقة متوافقة مع المنهج اليمني.
            </p>
            <div className="flex flex-wrap gap-2 mt-4">
              <button className="btn bg-white text-brand-800 hover:bg-brand-50 shadow-soft" onClick={() => go('planner')}>
                <Icon.Sparkles size={18} /> ابدأ التحضير
              </button>
              <button className="btn bg-white/15 text-white hover:bg-white/25 ring-1 ring-white/25" onClick={() => go('curriculum')}>
                <Icon.Book size={18} /> استكشف المنهج اليمني
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* إحصاءات */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard icon={Icon.Users} label="الطلاب" value={students.length} tone="brand" sub={`${classes.length} صف`} />
        <StatCard icon={Icon.Sparkles} label="خطط الدروس" value={lessons.length} tone="sand" sub={`${notebooks.length} كراسة`} />
        <StatCard icon={Icon.Slides} label="العروض التقديمية" value={presentations.length} tone="sky" />
        <StatCard icon={Icon.CheckCircle} label="الاختبارات" value={quizzes.length} tone="violet" sub={`${assessments.length} تقييم مرصود`} />
      </div>

      {/* إجراءات سريعة */}
      <div>
        <SectionHeader icon={Icon.TrendUp} title="إجراءات سريعة" subtitle="اختر مهمة لتبدأ فوراً" />
        <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3">
          {quick.map((q) => {
            const I = q.icon;
            return (
              <button
                key={q.id}
                onClick={() => go(q.id)}
                className="card p-4 text-right hover:shadow-lg hover:-translate-y-0.5 transition group"
              >
                <span className={`grid place-items-center w-11 h-11 rounded-2xl text-white mb-3 ${q.tone}`}>
                  <I size={22} />
                </span>
                <div className="font-extrabold text-slate-800 text-sm">{q.name}</div>
                <div className="text-[11px] text-slate-400 font-bold mt-0.5">{q.desc}</div>
              </button>
            );
          })}
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-4">
        {/* أداء الصفوف */}
        <Card className="p-5 lg:col-span-2">
          <SectionHeader icon={Icon.Chart} title="أداء الصفوف" subtitle="المتوسط العام لكل صف" />
          {withData.length === 0 ? (
            <EmptyState
              icon={Icon.Chart}
              title="لا توجد بيانات رصد بعد"
              subtitle="أضف صفاً وطلاباً، ثم سجّل تقييمات لتظهر هنا إحصائيات الأداء تلقائياً."
              action={<button className="btn-primary" onClick={() => go('classes')}><Icon.Plus size={18} /> إضافة صف</button>}
            />
          ) : (
            <div className="space-y-4">
              {withData.map((c) => {
                const est = estimateLabel(c.avg);
                return (
                  <div key={c.cls.id}>
                    <div className="flex items-center justify-between mb-1.5">
                      <div className="font-bold text-slate-700 text-sm">
                        {c.cls.name} <span className="text-slate-400 font-normal">• {c.count} طالب</span>
                      </div>
                      <span className={`chip ${
                        est.color === 'emerald' ? 'bg-emerald-50 text-emerald-700'
                          : est.color === 'teal' ? 'bg-teal-50 text-teal-700'
                          : est.color === 'sky' ? 'bg-sky-50 text-sky-700'
                          : est.color === 'amber' ? 'bg-amber-50 text-amber-700'
                          : 'bg-rose-50 text-rose-600'
                      }`}>{est.label} ({c.avg}%)</span>
                    </div>
                    <ProgressBar value={c.avg} tone={c.avg >= PASS_MARK ? 'brand' : 'rose'} />
                  </div>
                );
              })}
            </div>
          )}
        </Card>

        {/* آخر الأنشطة */}
        <Card className="p-5">
          <SectionHeader icon={Icon.Clock} title="آخر الأنشطة" />
          {activity.length === 0 ? (
            <p className="text-sm text-slate-400 text-center py-8">لا يوجد نشاط بعد.</p>
          ) : (
            <ul className="space-y-3">
              {activity.slice(0, 8).map((a) => (
                <li key={a.id} className="flex items-start gap-2.5">
                  <span className="w-2 h-2 rounded-full bg-brand-400 mt-1.5 shrink-0" />
                  <div className="min-w-0">
                    <div className="text-sm font-bold text-slate-700">{a.text}</div>
                    <div className="text-[11px] text-slate-400">
                      {formatDate(a.at.slice(0, 10))}
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>
    </div>
  );
}
