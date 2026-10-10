import { useEffect, useMemo, useState } from 'react';
import Icon from '../components/Icon.jsx';
import { Card, SectionHeader, Field, Modal, EmptyState, Confirm, Tabs, useToast } from '../components/UI.jsx';
import { useApp } from '../state/store.jsx';
import { GRADES_BY_STAGE, SECONDARY_SECTIONS, subjectsForGrade, getUnits } from '../data/curriculum.js';
import { TERMS, buildNotebook, notebookStats, notebookToMarkdown, notebookToCsv } from '../lib/notebookEngine.js';
import { download, slugify, todayISO, formatDate } from '../lib/utils.js';

function MetaTable({ meta }) {
  const rows = [
    ['المادة', meta.subjectName],
    ['الصف', meta.gradeName],
    ['الحلقة / المرحلة', meta.cycle],
    ['الفصل الدراسي', meta.termName],
    ['العام الدراسي', meta.academicYear],
    ['المعلم', meta.teacherName || '—'],
    ['المدرسة', meta.school || '—'],
    ['المديرية', meta.directorate || '—'],
    ['المحافظة', meta.governorate || '—']
  ];
  return (
    <table className="tbl !min-w-0">
      <tbody>
        {rows.map(([k, v]) => (
          <tr key={k}>
            <td className="font-bold text-slate-500 w-1/3">{k}</td>
            <td className="font-bold text-slate-800">{v}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function NotebookView({ nb }) {
  const stats = notebookStats(nb);
  return (
    <div className="space-y-5">
      {/* الغلاف */}
      <Card className="p-6 text-center border-2 border-brand-100">
        <div className="text-sm font-extrabold text-slate-500">الجمهورية اليمنية</div>
        <div className="text-sm font-extrabold text-slate-500">وزارة التربية والتعليم</div>
        <div className="mt-3 inline-flex items-center gap-2 text-brand-700">
          <Icon.School size={26} />
          <span className="text-lg font-extrabold">{nb.meta.school || 'مدرسة ................'}</span>
        </div>
        <h2 className="text-3xl font-extrabold text-slate-800 mt-3">كراسة التحضير الفصلية</h2>
        <div className="mt-2 text-slate-600 font-bold">
          {nb.meta.subjectName} — {nb.meta.gradeName} • {nb.meta.termName}
        </div>
        <div className="text-sm text-slate-500 font-bold mt-1">{nb.meta.academicYear}</div>
        <div className="grid grid-cols-3 gap-3 mt-5 max-w-md mx-auto">
          <div className="rounded-xl bg-brand-50 p-3">
            <div className="text-xl font-extrabold text-brand-700">{stats.weeks}</div>
            <div className="text-xs font-bold text-brand-700">أسبوعاً</div>
          </div>
          <div className="rounded-xl bg-sand-50 p-3">
            <div className="text-xl font-extrabold text-sand-600">{stats.lessons}</div>
            <div className="text-xs font-bold text-sand-600">درساً</div>
          </div>
          <div className="rounded-xl bg-slate-100 p-3">
            <div className="text-xl font-extrabold text-slate-600">{stats.units}</div>
            <div className="text-xs font-bold text-slate-600">وحدة</div>
          </div>
        </div>
      </Card>

      <Card className="p-5">
        <div className="section-title mb-3"><Icon.Info size={18} /> بيانات الكراسة</div>
        <MetaTable meta={nb.meta} />
      </Card>

      {/* الخطة الأسبوعية */}
      <Card className="p-5">
        <div className="section-title mb-3"><Icon.Calendar size={18} /> الخطة الأسبوعية ({nb.weeklyPlan.length} أسبوع)</div>
        <div className="table-wrap">
          <table className="tbl">
            <thead>
              <tr>
                <th>الأسبوع</th>
                <th>التاريخ</th>
                <th>النوع</th>
                <th>الوحدة</th>
                <th>الدرس</th>
                <th>الواجب</th>
              </tr>
            </thead>
            <tbody>
              {nb.weeklyPlan.map((w) => (
                <tr key={w.week}>
                  <td className="font-extrabold text-brand-700">{w.week}</td>
                  <td className="text-xs">{w.date ? formatDate(w.date) : '—'}</td>
                  <td>
                    <span className={`chip ${w.kind === 'درس' ? 'bg-brand-50 text-brand-700' : 'bg-amber-50 text-amber-700'}`}>{w.kind}</span>
                  </td>
                  <td className="text-xs text-slate-500">{w.unitTitle}</td>
                  <td className="font-bold">{w.lesson}</td>
                  <td className="text-xs text-slate-500">{w.homework}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* مواءمة المنهج */}
      <Card className="p-5">
        <div className="section-title mb-3"><Icon.Book size={18} /> مواءمة المنهج — توزيع الوحدات على الأسابيع</div>
        <div className="space-y-4">
          {nb.coverage.map((u, i) => (
            <div key={i} className="rounded-xl border border-slate-200 p-3">
              <div className="font-extrabold text-slate-700 text-sm mb-2">{u.unitTitle}</div>
              <div className="flex flex-wrap gap-2">
                {u.lessons.map((l, j) => (
                  <span key={j} className="chip bg-slate-100 text-slate-600">
                    {l.lesson}
                    {l.week ? <span className="text-brand-600"> • أ{l.week}</span> : <span className="text-slate-400"> • غير مجدول</span>}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* نموذج تحضير درس */}
      <Card className="p-5">
        <div className="section-title mb-3"><Icon.Sparkles size={18} /> نموذج تحضير درس</div>
        <div className="rounded-xl bg-gradient-to-l from-brand-600 to-brand-700 text-white p-4 mb-4">
          <div className="text-xs font-bold opacity-90">{nb.samplePlan.subjectName} • {nb.samplePlan.gradeName} • {nb.samplePlan.duration} دقيقة</div>
          <div className="text-xl font-extrabold mt-1">{nb.samplePlan.title}</div>
        </div>
        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <div className="font-bold text-slate-700 text-sm mb-2">الأهداف التعليمية</div>
            <ul className="space-y-1.5">
              {nb.samplePlan.objectives.map((o, i) => (
                <li key={i} className="flex gap-2 text-sm text-slate-600">
                  <Icon.Check size={16} className="text-brand-500 shrink-0 mt-0.5" /> {o}
                </li>
              ))}
            </ul>
          </div>
          <div>
            <div className="font-bold text-slate-700 text-sm mb-2">خطوات سير الدرس</div>
            <div className="space-y-1.5">
              {nb.samplePlan.phases.map((p, i) => (
                <div key={i} className="flex gap-2 text-sm">
                  <span className="chip bg-brand-50 text-brand-700 shrink-0">{p.minutes} د</span>
                  <span className="text-slate-600"><span className="font-bold">{p.name}:</span> {p.activity}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}

export default function LessonNotebook({ go, params }) {
  const { notebooks, addNotebook, deleteNotebook, profile } = useApp();
  const toast = useToast();
  const [view, setView] = useState('new');
  const [notebook, setNotebook] = useState(null);
  const [saved, setSaved] = useState(false);
  const [confirmDel, setConfirmDel] = useState(null);

  const [form, setForm] = useState({
    subjectId: params?.subjectId || profile.mainSubject || 'arabic',
    grade: params?.grade || 7,
    section: 'scientific',
    term: 'term1',
    academicYear: '1447هـ / 2025-2026م',
    weeks: 16,
    startDate: todayISO(),
    teacherName: profile.name || '',
    school: profile.school || '',
    governorate: profile.governorate || '',
    directorate: profile.directorate || ''
  });

  useEffect(() => {
    if (params?.subjectId || params?.grade) setForm((f) => ({ ...f, ...params }));
  }, [params]);

  const subjects = useMemo(() => subjectsForGrade(form.grade), [form.grade]);
  const unitCount = useMemo(() => getUnits(form.grade, form.subjectId).length, [form.grade, form.subjectId]);
  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const generate = (e) => {
    e?.preventDefault();
    const nb = buildNotebook(form);
    setNotebook(nb);
    setSaved(false);
    setView('new');
    toast.push('تم توليد كراسة التحضير');
    setTimeout(() => window.scrollTo({ top: 0, behavior: 'smooth' }), 50);
  };

  const save = () => {
    if (!notebook) return;
    addNotebook(notebook);
    setSaved(true);
    toast.push('تم حفظ الكراسة');
  };

  return (
    <div className="space-y-5">
      <SectionHeader
        icon={Icon.Clipboard}
        title="كراسة التحضير الفصلية"
        subtitle="خطة أسبوعية ومواءمة المنهج ونماذج تحضير جاهزة للطباعة — في كراسة واحدة متكاملة"
        actions={
          <Tabs
            tabs={[{ id: 'new', name: 'كراسة جديدة' }, { id: 'saved', name: `المحفوظة (${notebooks.length})` }]}
            active={view}
            onChange={setView}
          />
        }
      />

      {view === 'saved' ? (
        <Card className="p-5">
          {notebooks.length === 0 ? (
            <EmptyState icon={Icon.Clipboard} title="لا توجد كراسات محفوظة" subtitle="ولّد كراسة جديدة واحفظها ليظهر هنا." />
          ) : (
            <div className="grid md:grid-cols-2 gap-3">
              {notebooks.map((nb) => {
                const stats = notebookStats(nb);
                return (
                  <div key={nb.id} className="rounded-2xl border border-slate-200 p-4 hover:shadow-soft transition">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <div className="font-extrabold text-slate-800 truncate">
                          {nb.meta.subjectName} — {nb.meta.gradeName}
                        </div>
                        <div className="text-xs text-slate-500 font-bold mt-0.5">
                          {nb.meta.termName} • {stats.weeks} أسبوعاً • {stats.lessons} درساً
                        </div>
                      </div>
                      <button className="btn-danger !px-2.5 !py-1.5" onClick={() => setConfirmDel(nb)} title="حذف">
                        <Icon.Trash size={16} />
                      </button>
                    </div>
                    <div className="flex gap-2 mt-3 flex-wrap">
                      <button className="btn-outline !px-3 !py-1.5 !text-xs" onClick={() => { setNotebook(nb); setSaved(true); setView('new'); window.scrollTo({ top: 0 }); }}>
                        <Icon.Eye size={15} /> عرض
                      </button>
                      <button className="btn-outline !px-3 !py-1.5 !text-xs" onClick={() => download(`كراسة_${slugify(nb.meta.subjectName)}_${nb.meta.grade}.md`, notebookToMarkdown(nb))}>
                        <Icon.Download size={15} /> Markdown
                      </button>
                      <button className="btn-outline !px-3 !py-1.5 !text-xs" onClick={() => download(`كراسة_${slugify(nb.meta.subjectName)}_${nb.meta.grade}.csv`, notebookToCsv(nb), 'text/csv;charset=utf-8')}>
                        <Icon.Download size={15} /> CSV
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </Card>
      ) : (
        <>
          <Card className="p-4 sm:p-5 no-print">
            <form onSubmit={generate} className="space-y-4">
              <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <Field label="المادة" required>
                  <select className="input" value={form.subjectId} onChange={(e) => set('subjectId', e.target.value)}>
                    {subjects.map((s) => <option key={s.id} value={s.id}>{s.icon} {s.name}</option>)}
                  </select>
                </Field>
                <Field label="الصف" required>
                  <select className="input" value={form.grade} onChange={(e) => set('grade', Number(e.target.value))}>
                    {GRADES_BY_STAGE.map(({ stage, grades }) => (
                      <optgroup key={stage.id} label={stage.short}>
                        {grades.map((g) => <option key={g.n} value={g.n}>{g.label}</option>)}
                      </optgroup>
                    ))}
                  </select>
                </Field>
                {form.grade >= 10 && (
                  <Field label="القسم">
                    <select className="input" value={form.section} onChange={(e) => set('section', e.target.value)}>
                      {SECONDARY_SECTIONS.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
                    </select>
                  </Field>
                )}
                <Field label="الفصل الدراسي" required>
                  <select className="input" value={form.term} onChange={(e) => set('term', e.target.value)}>
                    {TERMS.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
                  </select>
                </Field>
                <Field label="عدد الأسابيع" required>
                  <input type="number" min={4} max={24} className="input" value={form.weeks} onChange={(e) => set('weeks', Number(e.target.value))} />
                </Field>
                <Field label="تاريخ بداية الدراسة">
                  <input type="date" className="input" value={form.startDate} onChange={(e) => set('startDate', e.target.value)} />
                </Field>
                <Field label="العام الدراسي">
                  <input className="input" value={form.academicYear} onChange={(e) => set('academicYear', e.target.value)} />
                </Field>
              </div>

              <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <Field label="اسم المعلم">
                  <input className="input" value={form.teacherName} onChange={(e) => set('teacherName', e.target.value)} placeholder="الاسم الكامل" />
                </Field>
                <Field label="المدرسة">
                  <input className="input" value={form.school} onChange={(e) => set('school', e.target.value)} placeholder="اسم المدرسة" />
                </Field>
                <Field label="المديرية">
                  <input className="input" value={form.directorate} onChange={(e) => set('directorate', e.target.value)} />
                </Field>
                <Field label="المحافظة">
                  <input className="input" value={form.governorate} onChange={(e) => set('governorate', e.target.value)} />
                </Field>
              </div>

              <div className="rounded-xl bg-brand-50/60 px-3.5 py-2.5 text-xs font-bold text-brand-700 flex items-center gap-2">
                <Icon.Info size={15} /> منهج {subjects.find((s) => s.id === form.subjectId)?.name} للصف يشمل {unitCount} وحدة، وسيُبنى جدول أسبوعي كامل قابل للتعديل والطباعة.
              </div>

              <div className="flex flex-wrap gap-2">
                <button type="submit" className="btn-primary">
                  <Icon.Sparkles size={18} /> توليد الكراسة
                </button>
                {notebook && (
                  <>
                    <button type="button" className="btn-sand" onClick={save} disabled={saved}>
                      <Icon.CheckCircle size={18} /> {saved ? 'محفوظة' : 'حفظ الكراسة'}
                    </button>
                    <button type="button" className="btn-outline" onClick={() => download(`كراسة_${slugify(notebook.meta.subjectName)}_${notebook.meta.grade}.md`, notebookToMarkdown(notebook))}>
                      <Icon.Download size={18} /> تصدير Markdown
                    </button>
                    <button type="button" className="btn-outline" onClick={() => download(`كراسة_${slugify(notebook.meta.subjectName)}_${notebook.meta.grade}.csv`, notebookToCsv(notebook), 'text/csv;charset=utf-8')}>
                      <Icon.Download size={18} /> تصدير CSV
                    </button>
                    <button type="button" className="btn-ghost" onClick={() => window.print()}>
                      <Icon.Print size={18} /> طباعة الكراسة
                    </button>
                  </>
                )}
              </div>
            </form>
          </Card>

          {notebook ? (
            <div className="print-area">
              <NotebookView nb={notebook} />
            </div>
          ) : (
            <Card className="p-6">
              <EmptyState
                icon={Icon.Clipboard}
                title="لم يتم توليد كراسة بعد"
                subtitle="اختر المادة والصف والفصل الدراسي ثم اضغط «توليد الكراسة»."
              />
            </Card>
          )}
        </>
      )}

      <Confirm
        open={!!confirmDel}
        onClose={() => setConfirmDel(null)}
        onConfirm={() => { deleteNotebook(confirmDel.id); toast.push('تم الحذف'); }}
        title="حذف الكراسة"
        message="هل تريد حذف هذه الكراسة؟"
      />
      {toast.view}
    </div>
  );
}
