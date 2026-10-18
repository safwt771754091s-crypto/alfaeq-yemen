import { useMemo, useState } from 'react';
import Icon from '../components/Icon.jsx';
import { Card, SectionHeader, useToast } from '../components/UI.jsx';
import { useApp } from '../state/store.jsx';
import { gradeName, subjectsForGrade, SUBJECTS } from '../data/curriculum.js';
import { askQuestion, addQuestion, suggestedQuestions, loadQueue } from '../lib/qnaEngine.js';
import { speak, toYemeni, speechSupported, pickArabicVoice } from '../lib/voice.js';

// صفحة «اسأل الآن» — سؤال/جواب سريع مع شرح مبسّط ودعم اللهجة اليمنية
export default function StudentAsk() {
  const { companion } = useApp();
  const toast = useToast();
  const grade = companion.grade || 1;
  const subjects = useMemo(() => subjectsForGrade(grade), [grade]);

  const [subjectId, setSubjectId] = useState('');
  const [question, setQuestion] = useState('');
  const [answer, setAnswer] = useState(null);
  const [myQuestions, setMyQuestions] = useState(() => loadQueue());

  const ask = (text) => {
    const q = (text ?? question).trim();
    if (!q) { toast.push('اكتب سؤالك أولاً'); return; }
    const res = askQuestion({ question: q, grade, subjectId });
    setAnswer({ ...res, question: q });
    addQuestion({
      question: q, grade, subjectId,
      lesson: res.lesson || '', short: res.short, explanation: res.explanation,
      needsTeacher: res.needsTeacher, askedBy: companion.studentName || 'طالب',
    });
    setMyQuestions(loadQueue());
    setQuestion('');
  };

  const listen = () => {
    if (!answer) return;
    if (!speechSupported()) { toast.push('الجهاز لا يدعم النطق'); return; }
    speak(answer.yemeni || toYemeni(answer.short), { voice: pickArabicVoice(window.speechSynthesis.getVoices()) });
  };

  const suggestions = suggestedQuestions(answer?.lesson || '');

  return (
    <div className="space-y-5">
      <SectionHeader icon={Icon.Message} title="اسأل الآن" subtitle="اكتب سؤالك، وسيصلك جواب مختصر مع شرح مبسّط" />

      <Card className="p-5">
        <div className="grid sm:grid-cols-3 gap-3">
          <label className="block">
            <span className="text-xs font-extrabold text-slate-500">المادة (اختياري)</span>
            <select className="input mt-1" value={subjectId} onChange={(e) => setSubjectId(e.target.value)}>
              <option value="">كل المواد</option>
              {subjects.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </label>
          <label className="block sm:col-span-2">
            <span className="text-xs font-extrabold text-slate-500">سؤالك</span>
            <div className="flex gap-2 mt-1">
              <input className="input" value={question} onChange={(e) => setQuestion(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && ask()} placeholder="مثال: إيش معنى المعادلة؟" />
              <button className="btn-primary shrink-0" onClick={() => ask()}><Icon.Send size={18} /> اسأل</button>
            </div>
          </label>
        </div>

        <div className="flex flex-wrap gap-2 mt-3">
          {suggestions.map((s, i) => (
            <button key={i} onClick={() => ask(s)} className="chip bg-violet-50 text-violet-700 hover:bg-violet-100">
              {s}
            </button>
          ))}
        </div>
      </Card>

      {answer && (
        <Card className="p-5 border-r-4 border-brand-400">
          <div className="text-xs font-extrabold text-slate-400 mb-1">سؤالك:</div>
          <div className="font-extrabold text-slate-800 mb-3">{answer.question}</div>

          <div className="rounded-2xl bg-emerald-50 border border-emerald-100 p-4">
            <div className="flex items-center gap-2 mb-1">
              <Icon.Lightbulb size={18} className="text-emerald-600" />
              <span className="font-extrabold text-emerald-800">الجواب المختصر</span>
              {answer.grounded && <span className="chip bg-white text-emerald-700 text-[10px]">من الكتاب: {answer.lesson}</span>}
            </div>
            <p className="text-slate-700 font-bold leading-loose">{answer.short}</p>
          </div>

          {answer.explanation && (
            <div className="mt-3 rounded-2xl bg-slate-50 p-4">
              <div className="font-extrabold text-slate-700 mb-1">شرح مبسّط</div>
              <p className="text-slate-600 font-bold leading-loose text-sm">{answer.explanation}</p>
            </div>
          )}

          <div className="flex flex-wrap gap-2 mt-3">
            <button className="btn-outline" onClick={listen}><Icon.Presentation size={16} /> اسمع باللهجة اليمنية 🎧</button>
            {answer.lesson && (
              <span className="chip bg-sky-50 text-sky-700 self-center">
                📖 {SUBJECTS[answer.subjectId]?.name} — {gradeName(grade)} — صفحة {answer.page}
              </span>
            )}
            {answer.needsTeacher && (
              <span className="chip bg-amber-50 text-amber-700 self-center">
                <Icon.Bell size={12} /> أُرسل سؤالك للمعلم
              </span>
            )}
          </div>
        </Card>
      )}

      <Card className="p-5">
        <SectionHeader icon={Icon.ListChecks} title="أسئلتي" subtitle="سجل أسئلتك وأجوبتها (يظهر جواب المعلم عند إضافته)" />
        {myQuestions.length ? (
          <div className="space-y-2 mt-2">
            {myQuestions.slice(0, 12).map((r) => (
              <div key={r.id} className="rounded-2xl border border-slate-100 p-3">
                <div className="flex items-center justify-between gap-2">
                  <span className="font-bold text-slate-700 text-sm">{r.question}</span>
                  <span className={`chip text-[10px] ${r.status === 'answered' ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'}`}>
                    {r.status === 'answered' ? 'تمت الإجابة' : 'بانتظار المعلم'}
                  </span>
                </div>
                {r.teacherAnswer && (
                  <div className="mt-2 rounded-xl bg-brand-50 p-2.5 text-sm font-bold text-brand-800">
                    <span className="text-xs">إجابة المعلم: </span>{r.teacherAnswer}
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm font-bold text-slate-400 mt-2">لم تسأل بعد — اكتب سؤالك في الأعلى.</p>
        )}
      </Card>
      {toast.view}
    </div>
  );
}
