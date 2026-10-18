import { useMemo } from 'react';
import Icon from '../components/Icon.jsx';
import { Card, SectionHeader } from '../components/UI.jsx';
import { useApp } from '../state/store.jsx';
import { GRADES, gradeName, subjectsForGrade, SUBJECTS } from '../data/curriculum.js';
import { buildBook } from '../lib/bookEngine.js';

// لوحة رفيق الطالب — تصميم مبهج يناسب الصفوف الابتدائية
export default function StudentHub({ go }) {
  const { companion, saveCompanion, studyLog } = useApp();
  const grade = companion.grade || 1;
  const isPrimary = grade <= 4;

  const subjects = useMemo(() => subjectsForGrade(grade), [grade]);

  const bookInfo = useMemo(() => {
    const sid = subjects[0]?.id;
    if (!sid) return null;
    return buildBook({ grade, subjectId: sid });
  }, [grade, subjects]);

  const todayLog = useMemo(() => {
    const day = new Date().toISOString().slice(0, 10);
    return studyLog.items.filter((x) => (x.date || x.createdAt || '').slice(0, 10) === day);
  }, [studyLog.items]);

  const tiles = [
    { id: 'book', icon: '📖', title: 'الكتاب الرقمي', text: 'افتح أي درس بالاسم ورقم الصفحة', tone: 'from-sky-400 to-sky-600' },
    { id: 'books', icon: '📚', title: 'مكتبة الكتب', text: '٢٧٤ كتاباً من المنهج بروابط تحميل', tone: 'from-teal-400 to-teal-600' },
    { id: 'ask', icon: '❓', title: 'اسأل الآن', text: 'سؤال وجواب سريع مع شرح مبسّط', tone: 'from-violet-400 to-violet-600' },
    { id: 'games', icon: '🎮', title: 'ألعاب تعليمية', text: 'تعلّم والعب في نفس الوقت', tone: 'from-amber-400 to-amber-600' },
    { id: 'practice', icon: '✨', title: 'تدرّب', text: 'أسئلة حقيقية من المنهج', tone: 'from-fuchsia-400 to-fuchsia-600' },
    { id: 'timetable', icon: '🗓️', title: 'جدول الحصص', text: 'حصص اليوم والواجبات', tone: 'from-emerald-400 to-emerald-600' },
  ];

  return (
    <div className="space-y-6">
      {/* ترحيب مبهرج */}
      <div className="rounded-3xl bg-gradient-to-l from-brand-600 via-brand-500 to-sand-500 text-white p-6 sm:p-8 shadow-soft">
        <div className="flex items-center gap-4 flex-wrap">
          <span className="grid place-items-center w-16 h-16 rounded-3xl bg-white/20 text-4xl">🎓</span>
          <div className="min-w-0">
            <div className="text-2xl font-extrabold">أهلاً يا {companion.studentName || 'صديقنا الصغير'}! 👋</div>
            <div className="text-white/90 font-bold mt-1">
              {isPrimary ? 'يلا نتعلّم ونلعب مع بعض اليوم!' : 'استعد لدرس جديد، خطوة بخطوة.'}
            </div>
          </div>
        </div>
      </div>

      {/* اختيار الصف */}
      <Card className="p-5">
        <SectionHeader icon={Icon.Users} title="صفّي" subtitle="اختر صفّك لعرض الدروس والألعاب المناسبة" />
        <div className="flex flex-wrap gap-2 mt-2">
          {GRADES.map((g) => (
            <button
              key={g.n}
              onClick={() => saveCompanion({ grade: g.n })}
              className={`rounded-2xl px-4 py-2.5 text-sm font-extrabold border-2 transition ${grade === g.n ? 'bg-brand-600 text-white border-brand-600' : 'bg-white text-slate-600 border-slate-200 hover:border-brand-300'}`}
            >
              {gradeName(g.n)}
            </button>
          ))}
        </div>
        <div className="mt-3 flex items-center gap-2">
          <span className="text-xs font-bold text-slate-500">اسمي:</span>
          <input
            value={companion.studentName || ''}
            onChange={(e) => saveCompanion({ studentName: e.target.value })}
            placeholder="اكتب اسمك هنا"
            className="input !py-2 max-w-xs"
          />
        </div>
      </Card>

      {/* بطاقات سريعة */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {tiles.map((t) => (
          <button
            key={t.id}
            onClick={() => go && go(t.id)}
            className={`text-right rounded-3xl p-5 text-white bg-gradient-to-br ${t.tone} shadow-soft hover:scale-[1.02] transition`}
          >
            <div className="text-4xl mb-2">{t.icon}</div>
            <div className="font-extrabold text-lg">{t.title}</div>
            <div className="text-white/90 text-xs font-bold mt-1 leading-relaxed">{t.text}</div>
          </button>
        ))}
      </div>

      {/* مواد الصف */}
      <Card className="p-5">
        <SectionHeader icon={Icon.Book} title={`موادي في ${gradeName(grade)}`} subtitle="اضغط مادةً لتفتح كتابها الرقمي" />
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 mt-2">
          {subjects.map((s) => (
            <button
              key={s.id}
              onClick={() => go && go('book', { subjectId: s.id })}
              className="rounded-2xl border-2 border-slate-100 bg-white p-4 text-center hover:border-brand-300 transition"
            >
              <div className="text-3xl mb-1">{s.icon}</div>
              <div className="text-sm font-extrabold text-slate-700">{s.name}</div>
            </button>
          ))}
        </div>
      </Card>

      {/* اليوم */}
      <div className="grid md:grid-cols-2 gap-4">
        <Card className="p-5">
          <SectionHeader icon={Icon.ListChecks} title="تعلّمت اليوم" subtitle={`${todayLog.length} عنصراً`} />
          {todayLog.length ? (
            <ul className="space-y-2 mt-2">
              {todayLog.slice(0, 6).map((x) => (
                <li key={x.id} className="flex items-center gap-2 rounded-xl bg-emerald-50 px-3 py-2">
                  <Icon.Check size={16} className="text-emerald-600" />
                  <span className="text-sm font-bold text-slate-700">{x.title || x.lesson || x.text}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm font-bold text-slate-400 mt-2">لم تسجّل تعلّمك اليوم بعد — افتح درساً واستمع له! 🎧</p>
          )}
        </Card>

        <Card className="p-5">
          <SectionHeader icon={Icon.Sparkles} title="كتابي جاهز" subtitle={bookInfo ? `${bookInfo.totalLessons} درساً • ${bookInfo.totalPages} صفحة` : ''} />
          <p className="text-sm font-bold text-slate-500 mt-2 leading-relaxed">
            يحتوي كتابك الرقمي على دروس {SUBJECTS[subjects[0]?.id]?.name || 'المادة'} كاملة، مرتّبة وحدةً وحدة،
            ويمكنك فتح أي درس بالاسم أو رقم الصفحة كما في الكتاب الورقي.
          </p>
          <button onClick={() => go && go('book')} className="btn-primary mt-3">
            <Icon.Book size={18} /> افتح الكتاب
          </button>
        </Card>
      </div>
    </div>
  );
}
