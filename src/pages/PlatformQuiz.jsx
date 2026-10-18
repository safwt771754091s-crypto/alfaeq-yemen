import { useMemo, useState } from 'react';
import Icon from '../components/Icon.jsx';
import { QUIZ_META, QUIZ_QUESTIONS, TOTAL_QUESTIONS, EVIDENCE_ANCHORS } from '../data/platformQuiz.js';

// صفحة مستقلة (تُفتح على مسار منفصل #quiz) — أسئلة اختيار من متعدد عن المنصة،
// وكل إجابة مرفقة بـ«الدليل من المنصة نفسها» (اقتباس + مصدره).
export default function PlatformQuiz({ onHome }) {
  const [idx, setIdx] = useState(0);
  const [picked, setPicked] = useState(null);
  const [answers, setAnswers] = useState({});
  const [done, setDone] = useState(false);

  const q = QUIZ_QUESTIONS[idx];
  const isLast = idx === TOTAL_QUESTIONS - 1;
  const progress = Math.round(((idx + (picked !== null ? 1 : 0)) / TOTAL_QUESTIONS) * 100);

  const score = useMemo(
    () => QUIZ_QUESTIONS.reduce((s, item) => s + (answers[item.id] === item.answer ? 1 : 0), 0),
    [answers]
  );

  const choose = (i) => {
    if (picked !== null) return;
    setPicked(i);
    setAnswers((a) => ({ ...a, [q.id]: i }));
  };

  const next = () => {
    if (isLast) { setDone(true); return; }
    setIdx((v) => v + 1);
    setPicked(null);
  };

  const restart = () => { setIdx(0); setPicked(null); setAnswers({}); setDone(false); };

  const evidence = q?.evidence;
  const anchor = evidence ? EVIDENCE_ANCHORS[evidence.anchor] : null;

  return (
    <div className="min-h-screen bg-slate-50" dir="rtl">
      {/* ترويسة الصفحة المستقلة */}
      <header className="sticky top-0 z-30 bg-white/90 backdrop-blur border-b border-slate-200">
        <div className="mx-auto max-w-3xl px-4 sm:px-6 h-16 flex items-center gap-3">
          <span className="grid place-items-center w-10 h-10 rounded-2xl bg-gradient-to-br from-brand-500 to-brand-700 text-white shadow-soft">
            <Icon.CheckCircle size={22} />
          </span>
          <div className="min-w-0">
            <div className="font-extrabold text-slate-800 leading-tight">{QUIZ_META.title}</div>
            <div className="text-[11px] text-slate-400 font-bold">اختبار قصير عن المنصة</div>
          </div>
          <button onClick={onHome} className="btn-outline !py-2 mr-auto text-sm">
            <Icon.Home size={16} /> الرئيسية
          </button>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-4 sm:px-6 py-6 sm:py-10">
        {!done ? (
          <>
            {/* شريط التقدّم */}
            <div className="mb-5">
              <div className="flex items-center justify-between text-xs font-extrabold text-slate-500 mb-2">
                <span>السؤال {idx + 1} من {TOTAL_QUESTIONS}</span>
                <span>{progress}%</span>
              </div>
              <div className="h-2 rounded-full bg-slate-200 overflow-hidden">
                <div className="h-full bg-gradient-to-l from-brand-500 to-brand-700 transition-all duration-300" style={{ width: `${progress}%` }} />
              </div>
            </div>

            <div className="card p-5 sm:p-7">
              <h2 className="text-lg sm:text-xl font-extrabold text-slate-800 leading-relaxed mb-5">{q.q}</h2>

              <div className="grid gap-3">
                {q.options.map((opt, i) => {
                  const isCorrect = i === q.answer;
                  const isPicked = picked === i;
                  let cls = 'border-slate-200 bg-white hover:border-brand-300';
                  if (picked !== null) {
                    if (isCorrect) cls = 'border-emerald-400 bg-emerald-50';
                    else if (isPicked) cls = 'border-rose-400 bg-rose-50';
                    else cls = 'border-slate-200 bg-white opacity-70';
                  }
                  return (
                    <button
                      key={i}
                      onClick={() => choose(i)}
                      disabled={picked !== null}
                      className={`w-full text-right flex items-center gap-3 rounded-2xl border-2 px-4 py-3.5 transition font-bold ${cls}`}
                    >
                      <span className={`grid place-items-center w-8 h-8 rounded-full text-sm font-extrabold shrink-0
                        ${picked !== null && isCorrect ? 'bg-emerald-500 text-white'
                          : picked !== null && isPicked ? 'bg-rose-500 text-white'
                          : 'bg-slate-100 text-slate-500'}`}>
                        {picked !== null && isCorrect ? <Icon.Check size={16} />
                          : picked !== null && isPicked ? <Icon.Close size={16} />
                          : ['أ', 'ب', 'ج', 'د'][i]}
                      </span>
                      <span className="text-slate-700 leading-relaxed">{opt}</span>
                    </button>
                  );
                })}
              </div>

              {/* الدليل من المنصة */}
              {picked !== null && (
                <div className={`mt-5 rounded-2xl border p-4 ${picked === q.answer ? 'border-emerald-200 bg-emerald-50/60' : 'border-amber-200 bg-amber-50/60'}`}>
                  <div className="flex items-center gap-2 mb-2">
                    <Icon.Lightbulb size={18} className={picked === q.answer ? 'text-emerald-600' : 'text-amber-600'} />
                    <span className="font-extrabold text-slate-800 text-sm">
                      {picked === q.answer ? 'إجابة صحيحة ✓' : 'الإجابة الصحيحة موضّحة بالأعلى'}
                    </span>
                  </div>
                  <div className="text-sm font-bold text-slate-600 mb-1">الدليل من المنصة نفسها:</div>
                  <blockquote className="rounded-xl bg-white/80 border-r-4 border-brand-400 px-3.5 py-2.5 text-[15px] text-slate-700 leading-loose font-bold">
                    «{evidence.quote}»
                  </blockquote>
                  <div className="mt-2 flex items-center gap-1.5 text-xs font-bold text-slate-500">
                    <Icon.Info size={14} /> المصدر: {evidence.source}
                  </div>
                  {anchor && (
                    <button onClick={onHome} className="mt-3 text-xs font-extrabold text-brand-700 hover:underline">
                      ↗ اطّلع عليه في: {anchor.label}
                    </button>
                  )}
                </div>
              )}

              {picked !== null && (
                <button onClick={next} className="btn-primary w-full mt-5 !py-3">
                  {isLast ? 'عرض النتيجة 🎯' : 'السؤال التالي'} <Icon.ChevronLeft size={18} />
                </button>
              )}
            </div>
          </>
        ) : (
          <ResultCard score={score} total={TOTAL_QUESTIONS} answers={answers} onRestart={restart} onHome={onHome} />
        )}
      </main>

      <footer className="px-6 py-6 text-center text-xs text-slate-400">
        منصة المعلم الذكية — كل الأدلة مقتبسة من محتوى المنصة نفسه.
      </footer>
    </div>
  );
}

function ResultCard({ score, total, answers, onRestart, onHome }) {
  const pct = Math.round((score / total) * 100);
  const tone = pct >= 80 ? 'emerald' : pct >= 50 ? 'amber' : 'rose';
  const msg = pct >= 80 ? 'ممتاز! تعرف المنصة جيداً 🎉'
    : pct >= 50 ? 'جيد، يمكنك التعرّف أكثر على الأدوات 💡'
    : 'لا بأس، اطّلع على المميزات والأسئلة الشائعة ثم أعد المحاولة 📚';
  const toneCls = { emerald: 'text-emerald-600', amber: 'text-amber-600', rose: 'text-rose-600' }[tone];

  return (
    <div className="card p-6 sm:p-8 text-center">
      <div className="text-5xl mb-2">{pct >= 80 ? '🏆' : pct >= 50 ? '👍' : '📚'}</div>
      <h2 className="text-xl font-extrabold text-slate-800">نتيجتك</h2>
      <div className={`text-4xl font-extrabold my-3 ${toneCls}`}>{score} / {total}</div>
      <div className="text-slate-500 font-bold mb-5">{msg}</div>

      <div className="grid gap-2 text-right mb-6">
        {QUIZ_QUESTIONS.map((q) => {
          const ok = answers[q.id] === q.answer;
          return (
            <div key={q.id} className="flex items-start gap-2.5 rounded-xl bg-slate-50 px-3.5 py-2.5">
              <span className={`grid place-items-center w-6 h-6 rounded-full shrink-0 mt-0.5 ${ok ? 'bg-emerald-500 text-white' : 'bg-rose-500 text-white'}`}>
                {ok ? <Icon.Check size={14} /> : <Icon.Close size={14} />}
              </span>
              <div className="min-w-0">
                <div className="text-sm font-bold text-slate-700 leading-relaxed">{q.q}</div>
                <div className="text-xs font-bold text-slate-400 mt-0.5">
                  الإجابة: {q.options[q.answer]}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="flex flex-wrap justify-center gap-3">
        <button onClick={onRestart} className="btn-primary !py-3"><Icon.Refresh size={18} /> أعد المحاولة</button>
        <button onClick={onHome} className="btn-outline !py-3"><Icon.Home size={18} /> العودة للرئيسية</button>
      </div>
    </div>
  );
}
