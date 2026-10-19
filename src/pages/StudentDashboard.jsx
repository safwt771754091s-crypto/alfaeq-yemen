import { useMemo } from 'react';
import Icon from '../components/Icon.jsx';
import { Card, SectionHeader, StatCard } from '../components/UI.jsx';
import { useApp } from '../state/store.jsx';
import { useAuth } from '../state/auth.jsx';
import { GRADES, gradeName, subjectsForGrade } from '../data/curriculum.js';
import { audienceMatches } from '../lib/controlCenter.js';

// لوحة تحكم الطالب — واجهة مبسّطة بأدوات الطالب وصلاحياته
export default function StudentDashboard({ go }) {
  const { companion, saveCompanion, studyLog, announcements } = useApp();
  const { currentUser } = useAuth();
  const grade = companion.grade || 1;
  const subjects = useMemo(() => subjectsForGrade(grade), [grade]);

  const myAnnouncements = useMemo(
    () => (announcements?.items || []).filter((a) => audienceMatches(a.audience || 'all', 'student')).slice(0, 5),
    [announcements]
  );

  const todayLog = useMemo(() => {
    const day = new Date().toISOString().slice(0, 10);
    return studyLog.items.filter((x) => (x.date || x.createdAt || '').slice(0, 10) === day);
  }, [studyLog.items]);

  const tools = [
    { id: 'voicelesson', icon: '🎧', title: 'الدرس الصوتي', text: 'اسمع الشرح وأجب صوتياً', tone: 'from-rose-400 to-rose-600' },
    { id: 'studentbook', icon: '📖', title: 'الكتاب الرقمي', text: 'افتح أي درس بالاسم والصفحة', tone: 'from-sky-400 to-sky-600' },
    { id: 'studentbooks', icon: '📚', title: 'مكتبة الكتب', text: 'كتب المنهج بروابط التحميل', tone: 'from-teal-400 to-teal-600' },
    { id: 'studentask', icon: '❓', title: 'اسأل الآن', text: 'سؤال وجواب وشرح مبسّط', tone: 'from-violet-400 to-violet-600' },
    { id: 'mathgames', icon: '🎮', title: 'ألعاب تعليمية', text: 'تعلّم والعب معاً', tone: 'from-amber-400 to-amber-600' },
    { id: 'studentpractice', icon: '✨', title: 'تدرّب', text: 'أسئلة من المنهج', tone: 'from-fuchsia-400 to-fuchsia-600' },
    { id: 'studenttimetable', icon: '🗓️', title: 'جدول الحصص', text: 'حصص اليوم والواجبات', tone: 'from-emerald-400 to-emerald-600' },
    { id: 'library', icon: '🗂️', title: 'المكتبة', text: 'مصادر ومراجع مفيدة', tone: 'from-indigo-400 to-indigo-600' }
  ];

  return (
    <div className="space-y-5">
      <div className="rounded-3xl bg-gradient-to-l from-brand-600 via-brand-500 to-sand-500 text-white p-6 sm:p-8 shadow-soft">
        <div className="flex items-center gap-4 flex-wrap">
          <span className="grid place-items-center w-16 h-16 rounded-3xl bg-white/20 text-4xl">🎓</span>
          <div className="min-w-0">
            <div className="text-2xl font-extrabold">أهلاً يا {currentUser?.name || companion.studentName || 'صديقنا'}! 👋</div>
            <div className="text-white/90 font-bold mt-1">لوحة الطالب — تعلّمك كلّه في مكان واحد.</div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard icon={Icon.Book} label="صفّي" value={gradeName(grade)} tone="brand" />
        <StatCard icon={Icon.Sparkles} label="تعلّمت اليوم" value={todayLog.length} tone="sky" />
        <StatCard icon={Icon.Megaphone} label="إعلانات" value={myAnnouncements.length} tone="amber" />
        <StatCard icon={Icon.Book} label="موادي" value={subjects.length} tone="violet" />
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
        {tools.map((t) => (
          <button key={t.id} onClick={() => go(t.id)} className={`text-right rounded-3xl p-5 text-white bg-gradient-to-br ${t.tone} shadow-soft hover:scale-[1.02] transition`}>
            <div className="text-3xl mb-2">{t.icon}</div>
            <div className="font-extrabold">{t.title}</div>
            <div className="text-white/90 text-xs font-bold mt-0.5 leading-relaxed">{t.text}</div>
          </button>
        ))}
      </div>

      <Card className="p-5">
        <SectionHeader icon={Icon.Users} title="صفّي" subtitle="اختر صفّك لعرض الدروس والألعاب المناسبة" />
        <div className="flex flex-wrap gap-2 mt-2">
          {GRADES.map((g) => (
            <button key={g.n} onClick={() => saveCompanion({ grade: g.n })}
              className={`rounded-2xl px-4 py-2 text-sm font-extrabold border-2 transition ${grade === g.n ? 'bg-brand-600 text-white border-brand-600' : 'bg-white text-slate-600 border-slate-200 hover:border-brand-300'}`}>
              {gradeName(g.n)}
            </button>
          ))}
        </div>
      </Card>

      <div className="grid lg:grid-cols-2 gap-4">
        <Card className="p-5">
          <SectionHeader icon={Icon.Book} title={`موادي في ${gradeName(grade)}`} subtitle="اضغط مادةً لتفتح كتابها الرقمي" />
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mt-2">
            {subjects.map((s) => (
              <button key={s.id} onClick={() => go('studentbook', { subjectId: s.id })}
                className="rounded-2xl border-2 border-slate-100 bg-white p-4 text-center hover:border-brand-300 transition">
                <div className="text-3xl mb-1">{s.icon}</div>
                <div className="text-sm font-extrabold text-slate-700">{s.name}</div>
              </button>
            ))}
          </div>
        </Card>

        <Card className="p-5">
          <SectionHeader icon={Icon.Megaphone} title="إعلانات المنصة" subtitle="رسائل موجّهة لك" />
          {myAnnouncements.length === 0 ? <p className="text-sm text-slate-400 font-bold mt-2">لا إعلانات حالياً.</p> : (
            <div className="space-y-2 mt-2">
              {myAnnouncements.map((a) => (
                <div key={a.id} className="rounded-2xl bg-slate-50 p-3">
                  <div className="font-extrabold text-slate-800">{a.title}</div>
                  <p className="text-sm text-slate-600 font-bold mt-1 leading-relaxed whitespace-pre-wrap">{a.text}</p>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
