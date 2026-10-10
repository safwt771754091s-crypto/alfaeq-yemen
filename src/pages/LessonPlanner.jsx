import { useEffect, useMemo, useState } from 'react';
import Icon from '../components/Icon.jsx';
import { Card, SectionHeader, Field, Modal, EmptyState, Confirm, Tabs, useToast } from '../components/UI.jsx';
import { useApp } from '../state/store.jsx';
import { GRADES, SECONDARY_SECTIONS, SUBJECTS, subjectsForGrade, getLessons, gradeName } from '../data/curriculum.js';
import { generateLessonPlan } from '../lib/lessonEngine.js';
import { download, slugify } from '../lib/utils.js';

function PlanView({ plan }) {
  return (
    <div className="space-y-4">
      <div className="rounded-2xl bg-gradient-to-l from-brand-600 to-brand-700 text-white p-5">
        <div className="text-xs font-bold opacity-90">{plan.subjectName} • {plan.gradeName} • {plan.cycle}</div>
        <h3 className="text-2xl font-extrabold mt-1">{plan.title}</h3>
        <div className="flex flex-wrap gap-3 mt-3 text-sm font-bold opacity-95">
          <span className="inline-flex items-center gap-1.5"><Icon.Clock size={16} /> الزمن: {plan.duration} دقيقة</span>
          <span className="inline-flex items-center gap-1.5"><Icon.Target size={16} /> {plan.objectives.length} أهداف</span>
          <span className="inline-flex items-center gap-1.5"><Icon.Lightbulb size={16} /> {plan.strategies.length} استراتيجيات</span>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        <Card className="p-4">
          <div className="section-title mb-3"><Icon.Target size={18} /> الأهداف التعليمية</div>
          <ul className="space-y-2">
            {plan.objectives.map((o, i) => (
              <li key={i} className="flex gap-2 text-sm text-slate-600">
                <Icon.Check size={17} className="text-brand-500 shrink-0 mt-0.5" />
                <span>{o}</span>
              </li>
            ))}
          </ul>
        </Card>

        <Card className="p-4">
          <div className="section-title mb-3"><Icon.Lightbulb size={18} /> التمهيد والتهيئة</div>
          <p className="text-sm text-slate-600 leading-relaxed">{plan.warmUp}</p>
          {plan.notes && (
            <div className="mt-3 rounded-xl bg-amber-50 p-3 text-sm text-amber-800">
              <span className="font-bold">ملاحظات: </span>{plan.notes}
            </div>
          )}
        </Card>
      </div>

      <Card className="p-4">
        <div className="section-title mb-3"><Icon.Book size={18} /> عناصر الدرس ومحتواه</div>
        <div className="space-y-4">
          {plan.elements.map((e, i) => (
            <div key={i}>
              <div className="font-bold text-slate-700 text-sm mb-2">{e.title}</div>
              <div className="grid sm:grid-cols-2 gap-2">
                {e.items.map((it, j) => (
                  <div key={j} className="flex gap-2 text-sm text-slate-600 rounded-xl bg-slate-50 px-3 py-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-brand-400 mt-1.5 shrink-0" />
                    <span>{it}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </Card>

      <Card className="p-4">
        <div className="section-title mb-3"><Icon.TrendUp size={18} /> استراتيجيات التدريس المقترحة</div>
        <div className="grid sm:grid-cols-2 gap-3">
          {plan.strategies.map((s) => (
            <div key={s.id} className="rounded-xl border border-slate-200 p-3">
              <div className="font-extrabold text-slate-700 text-sm">{s.name}</div>
              <div className="text-xs text-slate-500 mt-1">{s.desc}</div>
              <span className="chip bg-brand-50 text-brand-700 mt-2">الأنسب: {s.when}</span>
            </div>
          ))}
        </div>
      </Card>

      <Card className="p-4">
        <div className="section-title mb-3"><Icon.Clock size={18} /> خطوات سير الدرس (الزمني)</div>
        <div className="space-y-2">
          {plan.phases.map((p, i) => (
            <div key={i} className="flex gap-3 rounded-xl border border-slate-100 p-3">
              <span className="grid place-items-center w-14 shrink-0 rounded-lg bg-brand-50 text-brand-700 text-xs font-extrabold">
                {p.minutes} د
              </span>
              <div>
                <div className="font-bold text-slate-700 text-sm">{p.name}</div>
                <div className="text-sm text-slate-600 mt-0.5">{p.activity}</div>
                <div className="text-xs text-slate-400 mt-1">{p.role}</div>
              </div>
            </div>
          ))}
        </div>
      </Card>

      <div className="grid md:grid-cols-2 gap-4">
        <Card className="p-4">
          <div className="section-title mb-3"><Icon.CheckCircle size={18} /> أدوات التقويم</div>
          <ul className="space-y-2">
            {plan.assessment.map((a, i) => (
              <li key={i} className="flex gap-2 text-sm text-slate-600">
                <Icon.Check size={16} className="text-brand-500 shrink-0 mt-0.5" /> {a}
              </li>
            ))}
          </ul>
        </Card>
        <Card className="p-4">
          <div className="section-title mb-3"><Icon.File size={18} /> الواجب والوسائل</div>
          <p className="text-sm text-slate-600 mb-3">{plan.homework}</p>
          <div className="flex flex-wrap gap-2">
            {plan.resources.map((r, i) => (
              <span key={i} className="chip bg-slate-100 text-slate-600">{r}</span>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}

function planToMarkdown(plan) {
  const L = [];
  L.push(`# تحضير درس: ${plan.title}`);
  L.push(`**المادة:** ${plan.subjectName} | **${plan.gradeName}** | **الزمن:** ${plan.duration} دقيقة`);
  L.push('');
  L.push('## الأهداف التعليمية');
  plan.objectives.forEach((o) => L.push(`- ${o}`));
  L.push('');
  L.push('## التمهيد');
  L.push(plan.warmUp);
  L.push('');
  plan.elements.forEach((e) => {
    L.push(`## ${e.title}`);
    e.items.forEach((i) => L.push(`- ${i}`));
    L.push('');
  });
  L.push('## استراتيجيات التدريس');
  plan.strategies.forEach((s) => L.push(`- **${s.name}:** ${s.desc}`));
  L.push('');
  L.push('## خطوات سير الدرس');
  plan.phases.forEach((p) => L.push(`- (${p.minutes} د) **${p.name}:** ${p.activity}`));
  L.push('');
  L.push('## أدوات التقويم');
  plan.assessment.forEach((a) => L.push(`- ${a}`));
  L.push('');
  L.push('## الواجب');
  L.push(plan.homework);
  L.push('');
  L.push('## الوسائل التعليمية');
  plan.resources.forEach((r) => L.push(`- ${r}`));
  return L.join('\n');
}

export default function LessonPlanner({ go, params }) {
  const { lessons, addLesson, deleteLesson, profile } = useApp();
  const toast = useToast();
  const [form, setForm] = useState({
    subjectId: params?.subjectId || profile.mainSubject || 'arabic',
    grade: params?.grade || 7,
    title: params?.title || '',
    duration: 45,
    section: 'scientific',
    notes: ''
  });
  const [plan, setPlan] = useState(null);
  const [saved, setSaved] = useState(false);
  const [view, setView] = useState('new');
  const [confirmDel, setConfirmDel] = useState(null);

  useEffect(() => {
    if (params?.subjectId || params?.title) {
      setForm((f) => ({ ...f, ...params }));
    }
  }, [params]);

  const subjects = useMemo(() => subjectsForGrade(form.grade), [form.grade]);
  const suggestions = useMemo(
    () => (form.subjectId ? getLessons(form.grade, form.subjectId).map((x) => x.lesson) : []),
    [form.grade, form.subjectId]
  );

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const generate = (e) => {
    e?.preventDefault();
    if (!form.title.trim()) { toast.push('أدخل عنوان الدرس', 'error'); return; }
    const p = generateLessonPlan(form);
    setPlan(p);
    setSaved(false);
    setView('new');
    toast.push('تم توليد التحضير بنجاح');
  };

  const save = () => {
    if (!plan) return;
    addLesson(plan);
    setSaved(true);
    toast.push('تم حفظ التحضير في السجلات');
  };

  return (
    <div className="space-y-5">
      <SectionHeader
        icon={Icon.Sparkles}
        title="أداة التحضير الذكي للدروس"
        subtitle="أدخل بيانات الدرس وولّد تحضيراً احترافياً متكاملاً في ثوانٍ"
        actions={
          <Tabs
            tabs={[{ id: 'new', name: 'تحضير جديد' }, { id: 'saved', name: `المحفوظة (${lessons.length})` }]}
            active={view}
            onChange={setView}
          />
        }
      />

      {view === 'saved' ? (
        <Card className="p-5">
          {lessons.length === 0 ? (
            <EmptyState icon={Icon.Sparkles} title="لا توجد تحضيرات محفوظة" subtitle="ولّد تحضيراً جديداً واحفظه ليظهر هنا." />
          ) : (
            <div className="grid md:grid-cols-2 gap-3">
              {lessons.map((l) => (
                <div key={l.id} className="rounded-2xl border border-slate-200 p-4 hover:shadow-soft transition">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <div className="font-extrabold text-slate-800 truncate">{l.title}</div>
                      <div className="text-xs text-slate-500 font-bold mt-0.5">
                        {l.subjectName} • {l.gradeName} • {l.duration} دقيقة
                      </div>
                    </div>
                    <button className="btn-danger !px-2.5 !py-1.5" onClick={() => setConfirmDel(l)} title="حذف">
                      <Icon.Trash size={16} />
                    </button>
                  </div>
                  <div className="flex gap-2 mt-3 flex-wrap">
                    <button className="btn-outline !px-3 !py-1.5 !text-xs" onClick={() => { setPlan(l); setSaved(true); setView('new'); window.scrollTo({ top: 0 }); }}>
                      <Icon.Eye size={15} /> عرض
                    </button>
                    <button className="btn-outline !px-3 !py-1.5 !text-xs" onClick={() => download(`${slugify(l.title)}.md`, planToMarkdown(l))}>
                      <Icon.Download size={15} /> Markdown
                    </button>
                    <button className="btn-primary !px-3 !py-1.5 !text-xs" onClick={() => go('presentations', { subjectId: l.subjectId, grade: l.grade, title: l.title })}>
                      <Icon.Slides size={15} /> عرض تقديمي
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      ) : (
        <>
          <Card className="p-4 sm:p-5">
            <form onSubmit={generate} className="space-y-4">
              <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <Field label="المادة" required>
                  <select className="input" value={form.subjectId} onChange={(e) => set('subjectId', e.target.value)}>
                    {subjects.map((s) => <option key={s.id} value={s.id}>{s.icon} {s.name}</option>)}
                  </select>
                </Field>
                <Field label="الصف" required>
                  <select className="input" value={form.grade} onChange={(e) => set('grade', Number(e.target.value))}>
                    {GRADES.map((g) => <option key={g.n} value={g.n}>{g.name} — {g.cycle}</option>)}
                  </select>
                </Field>
                <Field label="الزمن (دقيقة)" required>
                  <input type="number" min={20} max={120} step={5} className="input" value={form.duration} onChange={(e) => set('duration', Number(e.target.value))} />
                </Field>
                {form.grade >= 10 && (
                  <Field label="القسم">
                    <select className="input" value={form.section} onChange={(e) => set('section', e.target.value)}>
                      {SECONDARY_SECTIONS.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
                    </select>
                  </Field>
                )}
              </div>

              <Field label="عنوان الدرس" required hint="يمكنك الاختيار من مقترحات المنهج أو الكتابة يدوياً">
                <input
                  className="input"
                  list="lesson-suggestions"
                  value={form.title}
                  onChange={(e) => set('title', e.target.value)}
                  placeholder="مثال: المعادلات من الدرجة الأولى"
                  required
                />
                <datalist id="lesson-suggestions">
                  {suggestions.map((s, i) => <option key={i} value={s} />)}
                </datalist>
              </Field>

              {suggestions.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {suggestions.slice(0, 6).map((s, i) => (
                    <button type="button" key={i} className="chip bg-slate-100 text-slate-600 hover:bg-brand-50 hover:text-brand-700" onClick={() => set('title', s)}>
                      {s}
                    </button>
                  ))}
                </div>
              )}

              <Field label="ملاحظات إضافية (اختياري)">
                <textarea className="input min-h-[80px]" value={form.notes} onChange={(e) => set('notes', e.target.value)} placeholder="أي ملاحظات خاصة بالدرس أو بمستوى الصف..." />
              </Field>

              <div className="flex flex-wrap gap-2">
                <button type="submit" className="btn-primary">
                  <Icon.Sparkles size={18} /> توليد التحضير
                </button>
                {plan && (
                  <>
                    <button type="button" className="btn-sand" onClick={save} disabled={saved}>
                      <Icon.CheckCircle size={18} /> {saved ? 'محفوظ' : 'حفظ في السجلات'}
                    </button>
                    <button type="button" className="btn-outline" onClick={() => download(`${slugify(plan.title)}.md`, planToMarkdown(plan))}>
                      <Icon.Download size={18} /> تصدير Markdown
                    </button>
                    <button type="button" className="btn-outline" onClick={() => go('presentations', { subjectId: plan.subjectId, grade: plan.grade, title: plan.title })}>
                      <Icon.Slides size={18} /> توليد عرض تقديمي
                    </button>
                    <button type="button" className="btn-ghost" onClick={() => window.print()}>
                      <Icon.Print size={18} /> طباعة
                    </button>
                  </>
                )}
              </div>
            </form>
          </Card>

          {plan ? (
            <div className="print-area">
              <PlanView plan={plan} />
            </div>
          ) : (
            <Card className="p-6">
              <EmptyState
                icon={Icon.Sparkles}
                title="لم يتم توليد تحضير بعد"
                subtitle="اختر المادة والصف وأدخل عنوان الدرس ثم اضغط «توليد التحضير»."
              />
            </Card>
          )}
        </>
      )}

      <Confirm
        open={!!confirmDel}
        onClose={() => setConfirmDel(null)}
        onConfirm={() => { deleteLesson(confirmDel.id); toast.push('تم الحذف'); }}
        title="حذف التحضير"
        message={`هل تريد حذف تحضير «${confirmDel?.title}»؟`}
      />
      {toast.view}
    </div>
  );
}
