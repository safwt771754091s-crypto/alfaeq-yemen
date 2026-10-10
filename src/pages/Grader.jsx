import { useMemo, useState } from 'react';
import Icon from '../components/Icon.jsx';
import { Card, SectionHeader, Field, EmptyState, Tabs, Modal, useToast, ProgressBar, Confirm } from '../components/UI.jsx';
import { useApp } from '../state/store.jsx';
import { GRADES_BY_STAGE, subjectsForGrade } from '../data/curriculum.js';
import { QUESTION_TYPES, analyzeClass, generateSampleQuiz } from '../lib/gradingEngine.js';
import { pct } from '../lib/utils.js';
import { uid } from '../lib/storage.js';

function QuestionEditor({ q, index, onChange, onRemove }) {
  const t = QUESTION_TYPES[q.type];
  const set = (patch) => onChange({ ...q, ...patch });
  return (
    <div className="rounded-2xl border border-slate-200 p-3.5">
      <div className="flex items-center gap-2 mb-2">
        <span className="grid place-items-center w-7 h-7 rounded-lg bg-brand-600 text-white text-xs font-extrabold">{index + 1}</span>
        <select className="input !w-auto !py-1.5 !text-xs" value={q.type} onChange={(e) => {
          const type = e.target.value;
          const base = { id: q.id, type, prompt: q.prompt, points: q.points };
          if (type === 'mcq') onChange({ ...base, options: ['', '', '', ''], answer: '' });
          else if (type === 'tf') onChange({ ...base, answer: 'صح' });
          else onChange({ ...base, answer: '', keywords: [] });
        }}>
          {Object.values(QUESTION_TYPES).map((x) => <option key={x.id} value={x.id}>{x.icon} {x.name}</option>)}
        </select>
        <div className="mr-auto flex items-center gap-2">
          <label className="text-xs font-bold text-slate-500">الدرجة</label>
          <input type="number" min={0.5} step={0.5} className="input !w-20 !py-1.5 !text-xs" value={q.points} onChange={(e) => set({ points: Number(e.target.value) })} />
          <button className="btn-danger !px-2 !py-1.5" onClick={onRemove}><Icon.Trash size={15} /></button>
        </div>
      </div>

      <textarea className="input !text-sm min-h-[54px]" placeholder="نص السؤال..." value={q.prompt} onChange={(e) => set({ prompt: e.target.value })} />

      {q.type === 'mcq' && (
        <div className="mt-2 space-y-2">
          <div className="grid sm:grid-cols-2 gap-2">
            {(q.options || []).map((o, i) => (
              <div key={i} className="flex items-center gap-2">
                <span className="text-xs font-bold text-slate-400 w-5">{'أبجد'[i] || i + 1}</span>
                <input className="input !py-1.5 !text-sm" placeholder={`الخيار ${i + 1}`} value={o} onChange={(e) => {
                  const options = [...q.options]; options[i] = e.target.value; set({ options });
                }} />
              </div>
            ))}
          </div>
          <Field label="الإجابة الصحيحة">
            <select className="input !py-1.5 !text-sm" value={q.answer} onChange={(e) => set({ answer: e.target.value })}>
              <option value="">— اختر —</option>
              {(q.options || []).map((o, i) => <option key={i} value={o}>{o || `الخيار ${i + 1}`}</option>)}
            </select>
          </Field>
        </div>
      )}

      {q.type === 'tf' && (
        <div className="mt-2 flex items-center gap-2">
          <span className="text-xs font-bold text-slate-500">الإجابة الصحيحة:</span>
          {['صح', 'خطأ'].map((v) => (
            <button key={v} type="button" onClick={() => set({ answer: v })}
              className={`chip ${q.answer === v ? 'bg-brand-600 text-white' : 'bg-slate-100 text-slate-600'}`}>{v}</button>
          ))}
        </div>
      )}

      {q.type === 'essay' && (
        <div className="mt-2">
          <Field label="الكلمات المفتاحية (افصل بفاصلة)" hint="تُستخدم للتصحيح الآلي المساعد للأسئلة المقالية">
            <input className="input !py-1.5 !text-sm" placeholder="مثال: التعريف، السبب، النتيجة" value={(q.keywords || []).join('، ')}
              onChange={(e) => set({ keywords: e.target.value.split(/[،,]/).map((s) => s.trim()).filter(Boolean) })} />
          </Field>
        </div>
      )}
    </div>
  );
}

export default function Grader({ go, params }) {
  const { classes, students, quizzes, addQuiz, deleteQuiz, assessments, addAssessment, profile } = useApp();
  const toast = useToast();
  const [tab, setTab] = useState('build');
  const [meta, setMeta] = useState({
    title: params?.title || '',
    subjectId: params?.subjectId || profile.mainSubject || 'arabic',
    grade: params?.grade || 7,
    classId: ''
  });
  const [questions, setQuestions] = useState([]);
  const [saveOpen, setSaveOpen] = useState(false);
  const [answersFor, setAnswersFor] = useState(null); // { studentId, answers }
  const [analysis, setAnalysis] = useState(null);
  const [busy, setBusy] = useState(false);
  const [confirmDel, setConfirmDel] = useState(null);

  const subjects = useMemo(() => subjectsForGrade(meta.grade), [meta.grade]);
  const classStudents = useMemo(() => students.filter((s) => s.classId === meta.classId), [students, meta.classId]);
  const setMeta_ = (k, v) => setMeta((m) => ({ ...m, [k]: v }));

  const addQuestion = (type) => {
    const base = { id: uid('q'), type, prompt: '', points: type === 'tf' ? 1 : type === 'mcq' ? 2 : 5 };
    if (type === 'mcq') Object.assign(base, { options: ['', '', '', ''], answer: '' });
    if (type === 'tf') base.answer = 'صح';
    if (type === 'essay') Object.assign(base, { answer: '', keywords: [] });
    setQuestions((qs) => [...qs, base]);
  };

  const totalPoints = questions.reduce((a, q) => a + (Number(q.points) || 0), 0);

  const loadSample = () => {
    const sample = generateSampleQuiz({ title: meta.title || 'درس تجريبي', type: 'mcq', count: 4 });
    setQuestions(sample);
    toast.push('تم توليد أسئلة نموذجية — عدّلها كما تشاء', 'info');
  };

  // ====== رصد إجابات الطلاب ======
  const papers = useMemo(() => {
    // papers stored in answersFor as map? We'll accumulate in a separate state.
    return null;
  }, []);

  const [papersMap, setPapersMap] = useState({}); // studentId -> answers

  const openAnswer = (studentId) => {
    setAnswersFor({ studentId, answers: papersMap[studentId] || {} });
  };

  const saveAnswer = () => {
    setPapersMap((m) => ({ ...m, [answersFor.studentId]: answersFor.answers }));
    setAnswersFor(null);
  };

  const autoFillAll = () => {
    // رصد سريع: تصحيح تلقائي بافتراض إجابات صحيحة (لتسهيل التجربة) — يمكن للمعلم تعديلها
    const m = { ...papersMap };
    classStudents.forEach((s) => {
      if (m[s.id]) return;
      const a = {};
      questions.forEach((q) => {
        if (q.type === 'mcq') a[q.id] = q.answer;
        else if (q.type === 'tf') a[q.id] = q.answer;
      });
      m[s.id] = a;
    });
    setPapersMap(m);
    toast.push('تم تعبئة إجابات نموذجية — عدّلها حسب أوراق الطلاب', 'info');
  };

  const runAnalysis = () => {
    if (!questions.length) { toast.push('أضف أسئلة أولاً', 'error'); return; }
    setBusy(true);
    setTimeout(() => {
      const list = classStudents.map((s) => ({
        studentId: s.id,
        studentName: s.name,
        answers: papersMap[s.id] || {}
      }));
      const res = analyzeClass(questions, list);
      setAnalysis(res);
      setTab('analyze');
      setBusy(false);
      toast.push('تم التصحيح والتحليل');
    }, 250);
  };

  const saveToGradebook = () => {
    if (!meta.classId) { toast.push('اختر الصف أولاً', 'error'); return; }
    const scores = {};
    analysis.graded.forEach((g) => { scores[g.studentId] = g.grade.earned; });
    addAssessment({
      title: meta.title || 'اختبار',
      subjectId: meta.subjectId,
      classId: meta.classId,
      max: analysis.graded[0]?.grade.totalMax || totalPoints,
      scores,
      kind: 'اختبار مصحح'
    });
    toast.push('تم الرصد في سجل الدرجات');
  };

  const saveQuiz = () => {
    if (!meta.title.trim() || !questions.length) { toast.push('أكمل بيانات الاختبار', 'error'); return; }
    addQuiz({ ...meta, questions });
    setSaveOpen(false);
    toast.push('تم حفظ الاختبار');
  };

  const loadQuiz = (q) => {
    setMeta({ title: q.title, subjectId: q.subjectId, grade: q.grade, classId: q.classId || '' });
    setQuestions(q.questions);
    setTab('build');
    toast.push('تم تحميل الاختبار', 'info');
  };

  return (
    <div className="space-y-5">
      <SectionHeader
        icon={Icon.CheckCircle}
        title="أداة التصحيح الذكي"
        subtitle="أنشئ اختباراً أو ارفع نموذج الإجابة، صحّح آلياً، واحصل على تحليل فوري وخطة علاجية"
      />

      <Tabs
        tabs={[
          { id: 'build', name: '١) بناء الاختبار' },
          { id: 'answer', name: '٢) رصد الإجابات' },
          { id: 'analyze', name: '٣) التصحيح والتحليل' },
          { id: 'saved', name: `الاختبارات (${quizzes.length})` }
        ]}
        active={tab}
        onChange={setTab}
      />

      {tab === 'build' && (
        <div className="space-y-4">
          <Card className="p-4 sm:p-5">
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <Field label="عنوان الاختبار" required>
                <input className="input" value={meta.title} onChange={(e) => setMeta_('title', e.target.value)} placeholder="مثال: اختبار الوحدة الأولى" />
              </Field>
              <Field label="المادة">
                <select className="input" value={meta.subjectId} onChange={(e) => setMeta_('subjectId', e.target.value)}>
                  {subjects.map((s) => <option key={s.id} value={s.id}>{s.icon} {s.name}</option>)}
                </select>
              </Field>
              <Field label="الصف">
                <select className="input" value={meta.grade} onChange={(e) => setMeta_('grade', Number(e.target.value))}>
                  {GRADES_BY_STAGE.map(({ stage, grades }) => (
                      <optgroup key={stage.id} label={stage.short}>
                        {grades.map((g) => <option key={g.n} value={g.n}>{g.label}</option>)}
                      </optgroup>
                    ))}
                </select>
              </Field>
              <Field label="الصف/الشعبة للرصد">
                <select className="input" value={meta.classId} onChange={(e) => setMeta_('classId', e.target.value)}>
                  <option value="">— اختر —</option>
                  {classes.filter((c) => c.grade === meta.grade).map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </Field>
            </div>
          </Card>

          <Card className="p-4 sm:p-5">
            <div className="flex items-center justify-between gap-3 mb-3 flex-wrap">
              <div className="section-title"><Icon.Clipboard size={18} /> الأسئلة ({questions.length}) — المجموع {totalPoints} درجة</div>
              <div className="flex gap-2 flex-wrap">
                {Object.values(QUESTION_TYPES).map((t) => (
                  <button key={t.id} className="btn-outline !px-3 !py-2 !text-xs" onClick={() => addQuestion(t.id)}>
                    <Icon.Plus size={15} /> {t.icon} {t.name}
                  </button>
                ))}
                <button className="btn-ghost !px-3 !py-2 !text-xs" onClick={loadSample}><Icon.Sparkles size={15} /> أسئلة نموذجية</button>
              </div>
            </div>

            {questions.length === 0 ? (
              <EmptyState icon={Icon.Clipboard} title="لا توجد أسئلة بعد" subtitle="أضف أسئلة اختيار من متعدد أو صح وخطأ أو مقالية." />
            ) : (
              <div className="space-y-3">
                {questions.map((q, i) => (
                  <QuestionEditor
                    key={q.id}
                    q={q}
                    index={i}
                    onChange={(nq) => setQuestions((qs) => qs.map((x) => (x.id === q.id ? nq : x)))}
                    onRemove={() => setQuestions((qs) => qs.filter((x) => x.id !== q.id))}
                  />
                ))}
              </div>
            )}

            <div className="flex gap-2 mt-4 flex-wrap">
              <button className="btn-primary" onClick={() => { if (!meta.title.trim()) { toast.push('أدخل عنوان الاختبار', 'error'); return; } setSaveOpen(true); }}>
                <Icon.CheckCircle size={18} /> حفظ الاختبار
              </button>
              <button className="btn-sand" onClick={() => setTab('answer')} disabled={!questions.length}>
                رصد الإجابات <Icon.ChevronLeft size={16} />
              </button>
            </div>
          </Card>
        </div>
      )}

      {tab === 'answer' && (
        <Card className="p-4 sm:p-5">
          <div className="flex items-center justify-between gap-3 mb-4 flex-wrap">
            <div className="section-title"><Icon.Users size={18} /> رصد إجابات الطلاب</div>
            <div className="flex gap-2">
              <button className="btn-ghost !px-3 !py-2 !text-xs" onClick={autoFillAll} disabled={!classStudents.length}>
                <Icon.Sparkles size={15} /> تعبئة نموذجية
              </button>
              <button className="btn-primary" onClick={runAnalysis} disabled={!questions.length}>
                <Icon.CheckCircle size={18} /> {busy ? 'جارٍ التصحيح...' : 'تصحيح وتحليل'}
              </button>
            </div>
          </div>

          {!meta.classId ? (
            <EmptyState icon={Icon.Users} title="اختر الصف/الشعبة" subtitle="ارجع لخطوة البناء واختر الصف للرصد."
              action={<button className="btn-primary" onClick={() => setTab('build')}>الذهاب للبناء</button>} />
          ) : classStudents.length === 0 ? (
            <EmptyState icon={Icon.Users} title="لا يوجد طلاب في هذا الصف" subtitle="أضف الطلاب من صفحة الصفوف والطلاب."
              action={<button className="btn-primary" onClick={() => go('classes')}>إدارة الطلاب</button>} />
          ) : (
            <div className="table-wrap">
              <table className="tbl">
                <thead>
                  <tr>
                    <th>#</th>
                    <th>اسم الطالب</th>
                    <th>حالة الإجابات</th>
                    <th>إجراء</th>
                  </tr>
                </thead>
                <tbody>
                  {classStudents.map((s, i) => {
                    const filled = papersMap[s.id] ? Object.keys(papersMap[s.id]).length : 0;
                    return (
                      <tr key={s.id}>
                        <td>{i + 1}</td>
                        <td className="font-bold">{s.name}</td>
                        <td>
                          <span className={`chip ${filled ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}>
                            {filled ? `تم رصد ${filled}/${questions.length}` : 'لم يُرصد'}
                          </span>
                        </td>
                        <td>
                          <button className="btn-outline !px-3 !py-1.5 !text-xs" onClick={() => openAnswer(s.id)}>
                            <Icon.Edit size={15} /> رصد
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      )}

      {tab === 'analyze' && (
        !analysis ? (
          <Card className="p-6"><EmptyState icon={Icon.Chart} title="لا يوجد تحليل بعد" subtitle="ارصد الإجابات ثم اضغط «تصحيح وتحليل»." /></Card>
        ) : (
          <div className="space-y-4">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
              <div className="stat-card"><div className="min-w-0">
                <div className="text-2xl font-extrabold text-slate-800">{analysis.stats.count}</div>
                <div className="text-xs font-bold text-slate-500">عدد الطلاب</div></div></div>
              <div className="stat-card"><div className="min-w-0">
                <div className="text-2xl font-extrabold text-brand-700">{analysis.stats.avg}%</div>
                <div className="text-xs font-bold text-slate-500">المتوسط العام</div></div></div>
              <div className="stat-card"><div className="min-w-0">
                <div className="text-2xl font-extrabold text-emerald-600">{analysis.stats.passRate}%</div>
                <div className="text-xs font-bold text-slate-500">نسبة النجاح</div></div></div>
              <div className="stat-card"><div className="min-w-0">
                <div className="text-2xl font-extrabold text-rose-600">{analysis.stats.failCount}</div>
                <div className="text-xs font-bold text-slate-500">متأخرون</div></div></div>
            </div>

            <Card className="p-4">
              <div className="section-title mb-3"><Icon.Chart size={18} /> توزيع التقديرات</div>
              <div className="grid sm:grid-cols-2 gap-3">
                {Object.entries(analysis.distribution).map(([label, count]) => (
                  <div key={label}>
                    <div className="flex justify-between text-sm font-bold text-slate-600 mb-1">
                      <span>{label}</span><span>{count} طالب</span>
                    </div>
                    <ProgressBar value={pct(count, analysis.stats.count)} tone={label.includes('ممتاز') ? 'emerald' : label.includes('راسب') ? 'rose' : 'brand'} />
                  </div>
                ))}
              </div>
            </Card>

            <Card className="p-4">
              <div className="section-title mb-3"><Icon.Clipboard size={18} /> تحليل الأسئلة (نقاط القوة والضعف)</div>
              <div className="table-wrap">
                <table className="tbl">
                  <thead>
                    <tr><th>#</th><th>السؤال</th><th>النوع</th><th>نسبة النجاح</th><th>الصعوبة</th></tr>
                  </thead>
                  <tbody>
                    {analysis.perQuestion.map((q, i) => (
                      <tr key={q.id}>
                        <td>{i + 1}</td>
                        <td className="max-w-[280px] truncate">{q.prompt || `سؤال ${i + 1}`}</td>
                        <td>{QUESTION_TYPES[q.type]?.name}</td>
                        <td className="w-40"><ProgressBar value={q.successRate} tone={q.successRate >= 75 ? 'emerald' : q.successRate >= 50 ? 'amber' : 'rose'} /></td>
                        <td>
                          <span className={`chip ${q.difficulty === 'سهل' ? 'bg-emerald-50 text-emerald-700' : q.difficulty === 'متوسط' ? 'bg-amber-50 text-amber-700' : 'bg-rose-50 text-rose-600'}`}>
                            {q.difficulty}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>

            <div className="grid md:grid-cols-2 gap-4">
              <Card className="p-4">
                <div className="section-title mb-3"><Icon.Star size={18} /> الطلاب المتفوقون</div>
                {analysis.topStudents.length ? (
                  <ul className="space-y-2">
                    {analysis.topStudents.map((s) => (
                      <li key={s.studentId} className="flex items-center justify-between rounded-xl bg-emerald-50 px-3 py-2 text-sm">
                        <span className="font-bold text-emerald-800">{s.studentName}</span>
                        <span className="font-extrabold text-emerald-700">{s.percent}%</span>
                      </li>
                    ))}
                  </ul>
                ) : <p className="text-sm text-slate-400">لا يوجد متفوقون بهذا الاختبار.</p>}
              </Card>
              <Card className="p-4">
                <div className="section-title mb-3"><Icon.Info size={18} /> الطلاب المتعثرون</div>
                {analysis.struggling.length ? (
                  <ul className="space-y-2">
                    {analysis.struggling.map((s) => (
                      <li key={s.studentId} className="flex items-center justify-between rounded-xl bg-rose-50 px-3 py-2 text-sm">
                        <span className="font-bold text-rose-800">{s.studentName}</span>
                        <span className="font-extrabold text-rose-700">{s.percent}%</span>
                      </li>
                    ))}
                  </ul>
                ) : <p className="text-sm text-slate-400">لا يوجد متعثرون — أداء جيد.</p>}
              </Card>
            </div>

            <Card className="p-4">
              <div className="section-title mb-3"><Icon.Lightbulb size={18} /> الخطة العلاجية المقترحة (توليد تلقائي)</div>
              <div className="grid md:grid-cols-2 gap-3">
                {analysis.remedial.map((r, i) => (
                  <div key={i} className="rounded-2xl border border-slate-200 p-4">
                    <div className="font-extrabold text-slate-800 text-sm">{r.area}</div>
                    <div className="text-xs text-slate-400 font-bold mt-0.5">{r.reason}</div>
                    <ul className="mt-2 space-y-1.5">
                      {r.activities.map((a, j) => (
                        <li key={j} className="flex gap-2 text-sm text-slate-600">
                          <Icon.Check size={15} className="text-brand-500 shrink-0 mt-0.5" /> {a}
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </Card>

            <Card className="p-4">
              <div className="section-title mb-3"><Icon.Users size={18} /> درجات الطلاب التفصيلية</div>
              <div className="table-wrap">
                <table className="tbl">
                  <thead>
                    <tr><th>#</th><th>الطالب</th><th>الدرجة</th><th>النسبة</th><th>التقدير</th></tr>
                  </thead>
                  <tbody>
                    {analysis.graded.sort((a, b) => b.grade.percent - a.grade.percent).map((g, i) => (
                      <tr key={g.studentId}>
                        <td>{i + 1}</td>
                        <td className="font-bold">{g.studentName}</td>
                        <td>{g.grade.earned} / {g.grade.totalMax}</td>
                        <td>{g.grade.percent}%</td>
                        <td>
                          <span className="chip bg-brand-50 text-brand-700">{g.grade.estimate.label} ({g.grade.estimate.grade})</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="flex gap-2 mt-4 flex-wrap">
                <button className="btn-primary" onClick={saveToGradebook} disabled={!meta.classId}>
                  <Icon.CheckCircle size={18} /> رصد في سجل الدرجات
                </button>
                <button className="btn-outline" onClick={() => window.print()}><Icon.Print size={18} /> طباعة التقرير</button>
              </div>
            </Card>
          </div>
        )
      )}

      {tab === 'saved' && (
        <Card className="p-5">
          {quizzes.length === 0 ? (
            <EmptyState icon={Icon.Clipboard} title="لا توجد اختبارات محفوظة" subtitle="ابنِ اختباراً واحفظه ليظهر هنا." />
          ) : (
            <div className="grid md:grid-cols-2 gap-3">
              {quizzes.map((q) => (
                <div key={q.id} className="rounded-2xl border border-slate-200 p-4">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <div className="font-extrabold text-slate-800 truncate">{q.title}</div>
                      <div className="text-xs text-slate-500 font-bold mt-0.5">{q.questions.length} سؤال • {q.questions.reduce((a, x) => a + x.points, 0)} درجة</div>
                    </div>
                    <button className="btn-danger !px-2.5 !py-1.5" onClick={() => setConfirmDel(q)}><Icon.Trash size={16} /></button>
                  </div>
                  <div className="flex gap-2 mt-3">
                    <button className="btn-primary !px-3 !py-1.5 !text-xs" onClick={() => loadQuiz(q)}><Icon.Edit size={15} /> تحميل</button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      )}

      {/* رصد إجابات طالب */}
      <Modal
        open={!!answersFor}
        onClose={() => setAnswersFor(null)}
        title={`رصد إجابات: ${classStudents.find((s) => s.id === answersFor?.studentId)?.name || ''}`}
        size="lg"
        footer={<><button className="btn-ghost" onClick={() => setAnswersFor(null)}>إلغاء</button><button className="btn-primary" onClick={saveAnswer}><Icon.Check size={18} /> حفظ</button></>}
      >
        {answersFor && (
          <div className="space-y-3">
            {questions.map((q, i) => {
              const ans = answersFor.answers[q.id] ?? '';
              const setAns = (v) => setAnswersFor((a) => ({ ...a, answers: { ...a.answers, [q.id]: v } }));
              return (
                <div key={q.id} className="rounded-xl border border-slate-200 p-3">
                  <div className="text-sm font-bold text-slate-700 mb-2">
                    <span className="text-brand-600">{i + 1}.</span> {q.prompt || 'سؤال'} <span className="text-xs text-slate-400">({q.points} د)</span>
                  </div>
                  {q.type === 'mcq' && (
                    <div className="grid sm:grid-cols-2 gap-2">
                      {(q.options || []).filter(Boolean).map((o, j) => (
                        <button key={j} onClick={() => setAns(o)} className={`text-right rounded-lg border px-3 py-2 text-sm ${ans === o ? 'border-brand-500 bg-brand-50 text-brand-700 font-bold' : 'border-slate-200 text-slate-600'}`}>{o}</button>
                      ))}
                    </div>
                  )}
                  {q.type === 'tf' && (
                    <div className="flex gap-2">
                      {['صح', 'خطأ'].map((v) => (
                        <button key={v} onClick={() => setAns(v)} className={`chip ${ans === v ? 'bg-brand-600 text-white' : 'bg-slate-100 text-slate-600'}`}>{v}</button>
                      ))}
                    </div>
                  )}
                  {q.type === 'essay' && (
                    <textarea className="input !text-sm min-h-[70px]" value={ans} onChange={(e) => setAns(e.target.value)} placeholder="اكتب إجابة الطالب..." />
                  )}
                </div>
              );
            })}
          </div>
        )}
      </Modal>

      {/* حفظ الاختبار */}
      <Modal
        open={saveOpen}
        onClose={() => setSaveOpen(false)}
        title="حفظ الاختبار"
        size="sm"
        footer={<><button className="btn-ghost" onClick={() => setSaveOpen(false)}>إلغاء</button><button className="btn-primary" onClick={saveQuiz}>حفظ</button></>}
      >
        <Field label="اسم الاختبار">
          <input className="input" value={meta.title} onChange={(e) => setMeta_('title', e.target.value)} />
        </Field>
        <p className="text-sm text-slate-500 mt-3">سيُحفظ الاختبار مع {questions.length} سؤالاً.</p>
      </Modal>

      <Confirm
        open={!!confirmDel}
        onClose={() => setConfirmDel(null)}
        onConfirm={() => { deleteQuiz(confirmDel.id); toast.push('تم الحذف'); }}
        title="حذف الاختبار"
        message={`هل تريد حذف اختبار «${confirmDel?.title}»؟`}
      />
      {toast.view}
    </div>
  );
}
