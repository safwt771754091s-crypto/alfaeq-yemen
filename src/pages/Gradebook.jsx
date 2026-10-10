import { useMemo, useState } from 'react';
import Icon from '../components/Icon.jsx';
import { Card, SectionHeader, Field, EmptyState, Modal, useToast, Confirm, ProgressBar } from '../components/UI.jsx';
import { useApp } from '../state/store.jsx';
import { GRADES, subjectsForGrade, estimateLabel, PASS_MARK, gradeName } from '../data/curriculum.js';
import { pct, round1, download, slugify } from '../lib/utils.js';

export default function Gradebook({ go }) {
  const { classes, students, assessments, addAssessment, deleteAssessment, setScore, profile } = useApp();
  const toast = useToast();
  const [classId, setClassId] = useState('');
  const [open, setOpen] = useState(false);
  const [confirmDel, setConfirmDel] = useState(null);
  const [form, setForm] = useState({
    title: '', subjectId: profile.mainSubject || 'arabic', max: 100, kind: 'اختبار قصير'
  });

  const cls = classes.find((c) => c.id === classId);
  const clsStudents = useMemo(() => students.filter((s) => s.classId === classId), [students, classId]);
  const clsAssess = useMemo(() => assessments.filter((a) => a.classId === classId), [assessments, classId]);

  const subjects = cls ? subjectsForGrade(cls.grade) : subjectsForGrade(7);

  const rows = useMemo(() => clsStudents.map((s) => {
    const per = clsAssess.map((a) => ({ id: a.id, max: Number(a.max) || 0, score: a.scores?.[s.id] ?? null }));
    const obtained = per.reduce((sum, p) => sum + (p.score || 0), 0);
    const totalMax = per.reduce((sum, p) => sum + p.max, 0);
    const percent = pct(obtained, totalMax);
    return { student: s, per, obtained: round1(obtained), totalMax, percent, estimate: estimateLabel(percent) };
  }), [clsStudents, clsAssess]);

  const classAvg = rows.length ? round1(rows.reduce((a, r) => a + r.percent, 0) / rows.length) : 0;

  const addAssess = () => {
    if (!form.title.trim() || !classId) { toast.push('أكمل البيانات', 'error'); return; }
    addAssessment({ ...form, classId, max: Number(form.max) || 100, scores: {} });
    setOpen(false);
    setForm({ title: '', subjectId: form.subjectId, max: 100, kind: 'اختبار قصير' });
    toast.push('تمت إضافة التقييم');
  };

  const exportCsv = () => {
    if (!cls) return;
    const head = ['الطالب', ...clsAssess.map((a) => a.title), 'المجموع', 'النسبة', 'التقدير'];
    const lines = [head.join(',')];
    rows.forEach((r) => {
      lines.push([
        r.student.name,
        ...r.per.map((p) => (p.score ?? '')),
        r.obtained, `${r.percent}%`, r.estimate.label
      ].map((x) => `"${x}"`).join(','));
    });
    download(`سجل_درجات_${slugify(cls.name)}.csv`, lines.join('\n'), 'text/csv;charset=utf-8');
    toast.push('تم تصدير السجل');
  };

  return (
    <div className="space-y-5">
      <SectionHeader
        icon={Icon.Clipboard}
        title="سجل الدرجات الآلي"
        subtitle="حساب المجاميع والنسب والتقديرات تلقائياً مع تصدير وطباعة"
        actions={
          <div className="flex gap-2 flex-wrap">
            {classId && <button className="btn-outline" onClick={exportCsv}><Icon.Download size={18} /> CSV</button>}
            {classId && <button className="btn-ghost" onClick={() => window.print()}><Icon.Print size={18} /> طباعة</button>}
            <button className="btn-primary" onClick={() => setOpen(true)} disabled={!classId}><Icon.Plus size={18} /> تقييم جديد</button>
          </div>
        }
      />

      {classes.length === 0 ? (
        <Card className="p-6">
          <EmptyState icon={Icon.Users} title="لا توجد صفوف بعد" subtitle="أضف صفاً وطلاباً للبدء في رصد الدرجات."
            action={<button className="btn-primary" onClick={() => go('classes')}><Icon.Plus size={18} /> إضافة صف</button>} />
        </Card>
      ) : (
        <>
          <Card className="p-4">
            <div className="flex flex-wrap gap-2 items-end">
              <Field label="اختر الصف/الشعبة">
                <select className="input min-w-[220px]" value={classId} onChange={(e) => setClassId(e.target.value)}>
                  <option value="">— اختر —</option>
                  {classes.map((c) => <option key={c.id} value={c.id}>{c.name} ({gradeName(c.grade)})</option>)}
                </select>
              </Field>
              {cls && (
                <div className="flex gap-4 ml-auto text-sm font-bold text-slate-500">
                  <span>{clsStudents.length} طالب</span>
                  <span>{clsAssess.length} تقييم</span>
                  <span className="text-brand-700">المتوسط: {classAvg}%</span>
                </div>
              )}
            </div>
          </Card>

          {!classId ? (
            <Card className="p-6"><EmptyState icon={Icon.Clipboard} title="اختر صفاً لعرض السجل" /></Card>
          ) : clsStudents.length === 0 ? (
            <Card className="p-6"><EmptyState icon={Icon.Users} title="لا يوجد طلاب" subtitle="أضف طلاباً لهذا الصف." action={<button className="btn-primary" onClick={() => go('classes')}>إدارة الطلاب</button>} /></Card>
          ) : (
            <Card className="p-4 print-area">
              <div className="table-wrap">
                <table className="tbl">
                  <thead>
                    <tr>
                      <th>#</th>
                      <th>الطالب</th>
                      {clsAssess.map((a) => (
                        <th key={a.id} className="text-center">
                          <div className="flex items-center justify-center gap-1">
                            <span>{a.title}</span>
                            <span className="text-[10px] text-slate-400">({a.max})</span>
                            <button className="text-rose-400 hover:text-rose-600 no-print" onClick={() => setConfirmDel(a)} title="حذف">
                              <Icon.Close size={13} />
                            </button>
                          </div>
                        </th>
                      ))}
                      <th>المجموع</th>
                      <th>النسبة</th>
                      <th>التقدير</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map((r, i) => (
                      <tr key={r.student.id}>
                        <td>{i + 1}</td>
                        <td className="font-bold whitespace-nowrap">{r.student.name}</td>
                        {r.per.map((p) => (
                          <td key={p.id} className="text-center">
                            <input
                              type="number"
                              min={0}
                              max={p.max}
                              step={0.5}
                              className="input !w-20 !py-1.5 !text-center !text-sm"
                              value={p.score ?? ''}
                              onChange={(e) => setScore(p.id, r.student.id, e.target.value)}
                              placeholder="—"
                            />
                          </td>
                        ))}
                        <td className="font-bold tabular-nums">{r.obtained} / {r.totalMax}</td>
                        <td className="w-32"><ProgressBar value={r.percent} tone={r.percent >= PASS_MARK ? 'brand' : 'rose'} /></td>
                        <td>
                          <span className={`chip ${
                            r.estimate.color === 'emerald' ? 'bg-emerald-50 text-emerald-700'
                              : r.estimate.color === 'teal' ? 'bg-teal-50 text-teal-700'
                              : r.estimate.color === 'sky' ? 'bg-sky-50 text-sky-700'
                              : r.estimate.color === 'amber' ? 'bg-amber-50 text-amber-700'
                              : 'bg-rose-50 text-rose-600'
                          }`}>{r.estimate.label}</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* ملخص */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-4">
                <div className="rounded-xl bg-brand-50 p-3 text-center">
                  <div className="text-xl font-extrabold text-brand-700">{classAvg}%</div>
                  <div className="text-xs font-bold text-brand-600">المتوسط العام</div>
                </div>
                <div className="rounded-xl bg-emerald-50 p-3 text-center">
                  <div className="text-xl font-extrabold text-emerald-700">{rows.filter((r) => r.percent >= PASS_MARK).length}</div>
                  <div className="text-xs font-bold text-emerald-600">ناجحون</div>
                </div>
                <div className="rounded-xl bg-rose-50 p-3 text-center">
                  <div className="text-xl font-extrabold text-rose-700">{rows.filter((r) => r.percent < PASS_MARK && r.totalMax > 0).length}</div>
                  <div className="text-xs font-bold text-rose-600">متعثرون</div>
                </div>
                <div className="rounded-xl bg-sand-100 p-3 text-center">
                  <div className="text-xl font-extrabold text-sand-700">{rows.length ? Math.max(...rows.map((r) => r.percent)) : 0}%</div>
                  <div className="text-xs font-bold text-sand-600">أعلى نسبة</div>
                </div>
              </div>
            </Card>
          )}
        </>
      )}

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title="إضافة تقييم / اختبار"
        size="md"
        footer={<><button className="btn-ghost" onClick={() => setOpen(false)}>إلغاء</button><button className="btn-primary" onClick={addAssess}>إضافة</button></>}
      >
        <div className="grid sm:grid-cols-2 gap-4">
          <Field label="عنوان التقييم" required>
            <input className="input" value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))} placeholder="مثال: اختبار الفترة الأولى" />
          </Field>
          <Field label="المادة">
            <select className="input" value={form.subjectId} onChange={(e) => setForm((f) => ({ ...f, subjectId: e.target.value }))}>
              {subjects.map((s) => <option key={s.id} value={s.id}>{s.icon} {s.name}</option>)}
            </select>
          </Field>
          <Field label="الدرجة العظمى" required>
            <input type="number" min={1} className="input" value={form.max} onChange={(e) => setForm((f) => ({ ...f, max: e.target.value }))} />
          </Field>
          <Field label="النوع">
            <select className="input" value={form.kind} onChange={(e) => setForm((f) => ({ ...f, kind: e.target.value }))}>
              {['اختبار قصير', 'اختبار الفترة', 'الاختبار النهائي', 'أعمال فصلية', 'واجب', 'مشروع', 'مشاركة'].map((k) => <option key={k} value={k}>{k}</option>)}
            </select>
          </Field>
        </div>
      </Modal>

      <Confirm
        open={!!confirmDel}
        onClose={() => setConfirmDel(null)}
        onConfirm={() => { deleteAssessment(confirmDel.id); toast.push('تم حذف التقييم'); }}
        title="حذف التقييم"
        message={`سيتم حذف «${confirmDel?.title}» وكل درجاته. متابعة؟`}
      />
      {toast.view}
    </div>
  );
}
