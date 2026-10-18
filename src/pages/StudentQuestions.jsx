import { useState } from 'react';
import Icon from '../components/Icon.jsx';
import { Card, SectionHeader, EmptyState, useToast } from '../components/UI.jsx';
import { gradeName, SUBJECTS } from '../data/curriculum.js';
import { loadQueue, answerQuestion, removeQuestion } from '../lib/qnaEngine.js';

// «أسئلة الطلاب» — يراها المعلم ليجيب عن أسئلة الطلاب غير المُجابة (مشاركة بشرية)
export default function StudentQuestions() {
  const toast = useToast();
  const [rows, setRows] = useState(() => loadQueue());
  const [draft, setDraft] = useState({});

  const refresh = () => setRows(loadQueue());

  const answer = (id) => {
    const text = (draft[id] || '').trim();
    if (!text) { toast.push('اكتب الإجابة أولاً', 'error'); return; }
    answerQuestion(id, { text });
    setDraft((d) => ({ ...d, [id]: '' }));
    refresh();
    toast.push('✅ أُرسلت الإجابة للطالب');
  };

  const pending = rows.filter((r) => r.status !== 'answered');
  const done = rows.filter((r) => r.status === 'answered');

  return (
    <div className="space-y-5">
      <SectionHeader icon={Icon.Message} title="أسئلة الطلاب" subtitle="أجب عن أسئلة الطلاب غير المُجابة ليروها في «اسأل الآن»" />

      <Card className="p-5">
        <SectionHeader icon={Icon.Bell} title={`بانتظار إجابتك (${pending.length})`} />
        {pending.length ? (
          <div className="space-y-3">
            {pending.map((r) => (
              <div key={r.id} className="rounded-2xl border-2 border-amber-100 bg-amber-50/40 p-3">
                <div className="flex items-center justify-between gap-2 flex-wrap">
                  <span className="font-extrabold text-slate-800">{r.question}</span>
                  <span className="chip bg-white text-slate-500 text-[10px]">
                    {r.askedBy} • {gradeName(r.grade)}{r.subjectId ? ` • ${SUBJECTS[r.subjectId]?.name || ''}` : ''}
                  </span>
                </div>
                <div className="flex gap-2 mt-2">
                  <input className="input" value={draft[r.id] || ''} onChange={(e) => setDraft((d) => ({ ...d, [r.id]: e.target.value }))} placeholder="اكتب شرحاً مبسّطاً للطالب..." onKeyDown={(e) => e.key === 'Enter' && answer(r.id)} />
                  <button className="btn-primary shrink-0" onClick={() => answer(r.id)}><Icon.Send size={16} /> أرسل</button>
                  <button className="btn-ghost shrink-0 text-rose-600" onClick={() => { removeQuestion(r.id); refresh(); }}><Icon.Trash size={16} /></button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <EmptyState icon={Icon.CheckCircle} title="لا توجد أسئلة معلّقة" subtitle="كل أسئلة الطلاب تمّت الإجابة عليها." />
        )}
      </Card>

      {done.length > 0 && (
        <Card className="p-5">
          <SectionHeader icon={Icon.Check} title={`تمّت الإجابة (${done.length})`} />
          <div className="space-y-2">
            {done.slice(0, 10).map((r) => (
              <div key={r.id} className="rounded-2xl border border-slate-100 p-3">
                <div className="font-bold text-slate-700 text-sm">{r.question}</div>
                {r.teacherAnswer && <div className="text-xs font-bold text-brand-700 mt-1">إجابتك: {r.teacherAnswer}</div>}
                {!r.teacherAnswer && <div className="text-xs font-bold text-slate-400 mt-1">أُجيب آلياً من الكتاب</div>}
              </div>
            ))}
          </div>
        </Card>
      )}

      {toast.view}
    </div>
  );
}
