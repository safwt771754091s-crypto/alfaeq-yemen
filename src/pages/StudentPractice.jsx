import { useMemo, useState } from 'react';
import Icon from '../components/Icon.jsx';
import { Card, SectionHeader } from '../components/UI.jsx';
import { useApp } from '../state/store.jsx';
import { SOURCED_QUESTIONS, SOURCES } from '../data/sourcedContent.js';
import { gradeName, SUBJECTS } from '../data/curriculum.js';

// «تدرّب على أسئلة المنهج» — بنك أسئلة حقيقي مُجمَّع من مصادر مفتوحة
export default function StudentPractice() {
  const { companion, studyLog } = useApp();
  const grade = companion.grade || 1;

  const pool = useMemo(() => SOURCED_QUESTIONS.filter((q) => q.grade === grade), [grade]);
  const [order, setOrder] = useState(() => shuffle(SOURCED_QUESTIONS.filter((q) => q.grade === grade)));
  const [idx, setIdx] = useState(0);
  const [picked, setPicked] = useState(null);
  const [score, setScore] = useState(0);
  const [done, setDone] = useState(false);

  // إعادة التهيئة عند تغيير الصف
  const poolKey = pool.map((q) => q.id).join(',');
  const [key, setKey] = useState(poolKey);
  if (key !== poolKey) {
    setKey(poolKey);
    setOrder(shuffle(pool));
    setIdx(0); setPicked(null); setScore(0); setDone(false);
  }

  const src = (id) => SOURCES.find((s) => s.id === id);

  if (!order.length) {
    return (
      <div className="space-y-5">
        <SectionHeader icon={Icon.Sparkles} title="تدرّب على أسئلة المنهج" subtitle="أسئلة حقيقية من مصادر مفتوحة" />
        <Card className="p-8 text-center">
          <div className="text-5xl mb-3">📚</div>
          <div className="font-extrabold text-slate-700">لا توجد أسئلة مُجمَّعة لهذا الصف بعد</div>
          <p className="text-sm font-bold text-slate-400 mt-2 leading-relaxed">
            بنك الأسئلة الحقيقي المتاح حالياً للصف التاسع (الرياضيات) والصف الثالث الثانوي (الجبر).
            اختر الصف التاسع من «صفّي» لتجربته.
          </p>
        </Card>
      </div>
    );
  }

  const q = order[idx];

  const choose = (opt) => {
    if (picked) return;
    setPicked(opt);
    if (opt === q.answer) setScore((s) => s + 1);
  };

  const next = () => {
    if (idx + 1 >= order.length) {
      setDone(true);
      studyLog.add({ title: `تدرّب على ${order.length} سؤالاً في ${SUBJECTS[q.subjectId]?.name || ''}`, date: new Date().toISOString().slice(0, 10) });
      return;
    }
    setIdx((i) => i + 1);
    setPicked(null);
  };

  const restart = () => { setOrder(shuffle(pool)); setIdx(0); setPicked(null); setScore(0); setDone(false); };

  if (done) {
    const pct = Math.round((score / order.length) * 100);
    return (
      <div className="space-y-5">
        <SectionHeader icon={Icon.CheckCircle} title="أحسنت!" subtitle="نتيجة التدريب" />
        <Card className="p-8 text-center">
          <div className="text-6xl mb-3">{pct >= 80 ? '🏆' : pct >= 50 ? '👏' : '💪'}</div>
          <div className="text-3xl font-extrabold text-brand-700">{score} / {order.length}</div>
          <div className="font-extrabold text-slate-600 mt-1">نسبة الإجابات الصحيحة {pct}%</div>
          <button className="btn-primary mt-4" onClick={restart}><Icon.Plus size={16} /> أعد التدريب</button>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <SectionHeader
        icon={Icon.Sparkles}
        title="تدرّب على أسئلة المنهج"
        subtitle={`${gradeName(grade)} • سؤال ${idx + 1} من ${order.length}`}
      />

      <Card className="p-5">
        <div className="h-2 rounded-full bg-slate-100 overflow-hidden mb-4">
          <div className="h-full bg-brand-500 transition-all" style={{ width: `${((idx) / order.length) * 100}%` }} />
        </div>
        <div className="font-extrabold text-slate-800 text-lg leading-relaxed">{q.prompt}</div>

        <div className="grid sm:grid-cols-2 gap-3 mt-4">
          {q.options.map((opt, i) => {
            const isAnswer = opt === q.answer;
            const isPicked = opt === picked;
            let cls = 'border-slate-200 bg-white hover:border-brand-300';
            if (picked && isAnswer) cls = 'border-emerald-400 bg-emerald-50';
            else if (picked && isPicked) cls = 'border-rose-400 bg-rose-50';
            return (
              <button key={i} onClick={() => choose(opt)} disabled={!!picked}
                className={`text-right rounded-2xl border-2 p-3 font-bold text-slate-700 transition ${cls}`}>
                <span className="inline-grid place-items-center w-6 h-6 rounded-full bg-slate-100 text-slate-600 text-xs font-extrabold ml-2">
                  {['أ', 'ب', 'ج', 'د'][i]}
                </span>
                {opt}
                {picked && isAnswer && <Icon.Check size={16} className="inline mr-2 text-emerald-600" />}
              </button>
            );
          })}
        </div>

        {picked && (
          <div className={`mt-4 rounded-2xl p-3 font-bold ${picked === q.answer ? 'bg-emerald-50 text-emerald-800' : 'bg-amber-50 text-amber-800'}`}>
            {picked === q.answer ? '✅ إجابة صحيحة!' : `❌ الإجابة الصحيحة: ${q.answer}`}
          </div>
        )}

        <div className="flex items-center gap-2 mt-4">
          <button className="btn-primary" onClick={next} disabled={!picked}>
            {idx + 1 >= order.length ? 'إنهاء' : 'التالي'} <Icon.ChevronLeft size={16} />
          </button>
          <span className="text-xs font-bold text-slate-400 mr-auto">
            المصدر: {src(q.source)?.name} ({src(q.source)?.repo})
          </span>
        </div>
      </Card>
    </div>
  );
}

function shuffle(a) {
  const x = [...a];
  for (let i = x.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [x[i], x[j]] = [x[j], x[i]]; }
  return x;
}
