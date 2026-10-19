import { useMemo } from 'react';
import Icon from '../components/Icon.jsx';
import { Card, SectionHeader, StatCard, ProgressBar } from '../components/UI.jsx';
import { useApp } from '../state/store.jsx';
import { useAuth } from '../state/auth.jsx';
import { gradeName } from '../data/curriculum.js';
import { pct } from '../lib/utils.js';

// لوحة تحكم المعلم — صلاحياته الكاملة وأدواته اليومية
export default function TeacherDashboard({ go }) {
  const { classes, students, lessons, notebooks, presentations, assessments, attendance, activity } = useApp();
  const { currentUser, can } = useAuth();

  const tools = [
    { id: 'planner', name: 'التحضير الذكي', icon: Icon.Sparkles, tone: 'from-brand-500 to-brand-700', desc: 'ولّد تحضيراً احترافياً' },
    { id: 'presentations', name: 'العروض التقديمية', icon: Icon.Slides, tone: 'from-sand-500 to-sand-600', desc: 'شرائح جاهزة للتصدير' },
    { id: 'grader', name: 'التصحيح الذكي', icon: Icon.CheckCircle, tone: 'from-sky-500 to-sky-700', desc: 'صحّح ورصد آلياً' },
    { id: 'gradebook', name: 'سجل الدرجات', icon: Icon.Clipboard, tone: 'from-teal-500 to-teal-700', desc: 'مجاميع ونِسب تلقائية' },
    { id: 'attendance', name: 'الحضور والغياب', icon: Icon.Calendar, tone: 'from-violet-500 to-violet-700', desc: 'يومي بالإحصائيات' },
    { id: 'certificates', name: 'الشهادات', icon: Icon.Award, tone: 'from-amber-500 to-amber-600', desc: 'تفوق وتقدير' },
    { id: 'curriculum', name: 'المنهج اليمني', icon: Icon.Book, tone: 'from-emerald-500 to-emerald-700', desc: 'كل الصفوف والمواد' },
    { id: 'notebook', name: 'كراسة التحضير', icon: Icon.Clipboard, tone: 'from-rose-500 to-rose-700', desc: 'خطة فصلية' }
  ].filter((t) => can(t.id));

  const attendanceDays = Object.keys(attendance || {}).length;
  const myClasses = useMemo(() => classes.map((c) => ({ ...c, count: students.filter((s) => s.classId === c.id).length })), [classes, students]);

  const avg = useMemo(() => {
    const vals = [];
    classes.forEach((c) => {
      const cls = students.filter((s) => s.classId === c.id);
      const rel = assessments.filter((a) => a.classId === c.id);
      cls.forEach((s) => {
        const got = rel.reduce((a, x) => a + (x.scores?.[s.id] || 0), 0);
        const max = rel.reduce((a, x) => a + (Number(x.max) || 0), 0);
        if (max > 0) vals.push(pct(got, max));
      });
    });
    return vals.length ? Math.round((vals.reduce((a, b) => a + b, 0) / vals.length) * 10) / 10 : 0;
  }, [classes, students, assessments]);

  return (
    <div className="space-y-5">
      <div className="relative overflow-hidden rounded-3xl bg-hero-gradient text-white p-6 sm:p-8 shadow-lg">
        <span className="absolute -top-16 -left-10 w-56 h-56 rounded-full bg-white/10 blur-2xl" />
        <div className="relative flex items-center gap-4 flex-wrap">
          <span className="grid place-items-center w-16 h-16 rounded-3xl bg-white/15 ring-1 ring-white/25"><Icon.Sparkles size={32} /></span>
          <div>
            <h2 className="text-2xl font-extrabold">لوحة تحكم المعلم{currentUser?.name ? ` — أ. ${currentUser.name}` : ''}</h2>
            <p className="text-white/85 font-bold mt-1">أدواتك اليومية: التحضير، العروض، التصحيح، والسجلات — كلها في مكان واحد.</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard icon={Icon.Users} label="الصفوف" value={classes.length} tone="brand" />
        <StatCard icon={Icon.GraduationCap} label="الطلاب" value={students.length} tone="sky" />
        <StatCard icon={Icon.Sparkles} label="التحضيرات" value={lessons.length} tone="violet" />
        <StatCard icon={Icon.Chart} label="معدل الأداء" value={`${avg}%`} tone="amber" />
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
        {tools.map((t) => (
          <button key={t.id} onClick={() => go(t.id)} className={`text-right rounded-3xl p-5 text-white bg-gradient-to-br ${t.tone} shadow-soft hover:scale-[1.02] transition`}>
            <t.icon size={28} />
            <div className="font-extrabold mt-2">{t.name}</div>
            <div className="text-white/90 text-xs font-bold mt-0.5 leading-relaxed">{t.desc}</div>
          </button>
        ))}
      </div>

      <div className="grid lg:grid-cols-2 gap-4">
        <Card className="p-5">
          <SectionHeader icon={Icon.Users} title="صفوفي" subtitle={`${myClasses.length} صف`} />
          {myClasses.length === 0 ? <p className="text-sm text-slate-400 font-bold mt-2">لم تُضف صفوفاً بعد. أضف صفاً من «الصفوف والطلاب».</p> : (
            <div className="space-y-2 mt-2">
              {myClasses.map((c) => (
                <button key={c.id} onClick={() => go('classes')} className="w-full flex items-center gap-3 rounded-2xl bg-slate-50 px-3 py-2 hover:bg-slate-100 text-right">
                  <span className="grid place-items-center w-9 h-9 rounded-xl bg-brand-100 text-brand-700 font-extrabold">{c.count}</span>
                  <span className="font-extrabold text-slate-700">{c.name || gradeName(c.grade)}</span>
                  <Icon.ChevronLeft size={16} className="mr-auto text-slate-300" />
                </button>
              ))}
            </div>
          )}
        </Card>

        <Card className="p-5">
          <SectionHeader icon={Icon.ListChecks} title="آخر نشاط" subtitle={`${activity.length} حدث`} />
          <div className="space-y-1.5 mt-2 max-h-64 overflow-y-auto">
            {activity.length === 0 ? <p className="text-sm text-slate-400 font-bold">لا نشاط بعد.</p> :
              activity.slice(0, 12).map((a) => (
                <div key={a.id} className="flex items-center gap-2 rounded-xl bg-slate-50 px-3 py-2">
                  <Icon.Check size={15} className="text-brand-600 shrink-0" />
                  <span className="text-sm font-bold text-slate-600 truncate">{a.text}</span>
                </div>
              ))}
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <StatCard icon={Icon.Clipboard} label="كراسات" value={notebooks.length} tone="sand" />
        <StatCard icon={Icon.Slides} label="عروض" value={presentations.length} tone="indigo" />
        <StatCard icon={Icon.Calendar} label="أيام حضور" value={attendanceDays} tone="lime" />
        <StatCard icon={Icon.Chart} label="تقييمات" value={assessments.length} tone="rose" />
      </div>
    </div>
  );
}
