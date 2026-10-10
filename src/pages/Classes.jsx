import { useMemo, useState } from 'react';
import Icon from '../components/Icon.jsx';
import { Card, SectionHeader, Field, EmptyState, Modal, useToast, Confirm } from '../components/UI.jsx';
import { useApp } from '../state/store.jsx';
import { GRADES_BY_STAGE, SECONDARY_SECTIONS, SUBJECTS, subjectsForGrade, gradeName } from '../data/curriculum.js';
import { parseStudentsCsv } from '../lib/gradingEngine.js';
import { download, slugify } from '../lib/utils.js';

export default function Classes({ go }) {
  const { classes, addClass, updateClass, deleteClass, students, addStudent, addStudentsBulk, updateStudent, deleteStudent } = useApp();
  const toast = useToast();
  const [open, setOpen] = useState(false);
  const [editCls, setEditCls] = useState(null);
  const [form, setForm] = useState({ name: '', grade: 7, section: 'scientific', subjectId: 'arabic' });
  const [activeCls, setActiveCls] = useState(null);
  const [stuOpen, setStuOpen] = useState(false);
  const [stuForm, setStuForm] = useState({ name: '', seat: '' });
  const [bulkOpen, setBulkOpen] = useState(false);
  const [bulkText, setBulkText] = useState('');
  const [confirmDel, setConfirmDel] = useState(null);
  const [confirmStu, setConfirmStu] = useState(null);

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));
  const clsStudents = useMemo(() => students.filter((s) => s.classId === activeCls), [students, activeCls]);
  const activeClass = classes.find((c) => c.id === activeCls);

  const openNew = () => { setEditCls(null); setForm({ name: '', grade: 7, section: 'scientific', subjectId: 'arabic' }); setOpen(true); };
  const openEdit = (c) => { setEditCls(c); setForm({ name: c.name, grade: c.grade, section: c.section || 'scientific', subjectId: c.subjectId || 'arabic' }); setOpen(true); };

  const submitCls = () => {
    if (!form.name.trim()) { toast.push('أدخل اسم الصف/الشعبة', 'error'); return; }
    if (editCls) { updateClass(editCls.id, form); toast.push('تم التعديل'); }
    else { const c = addClass(form); setActiveCls(c.id); toast.push('تمت إضافة الصف'); }
    setOpen(false);
  };

  const addStu = () => {
    if (!stuForm.name.trim()) { toast.push('أدخل اسم الطالب', 'error'); return; }
    addStudent({ ...stuForm, classId: activeCls });
    setStuForm({ name: '', seat: '' });
    toast.push('تمت إضافة الطالب');
  };

  const importBulk = () => {
    const list = parseStudentsCsv(bulkText).map((s) => ({ ...s, classId: activeCls }));
    if (!list.length) { toast.push('لا توجد بيانات صالحة', 'error'); return; }
    addStudentsBulk(list);
    setBulkText('');
    setBulkOpen(false);
    toast.push(`تم استيراد ${list.length} طالب`);
  };

  const exportRoster = () => {
    const head = ['الاسم', 'رقم الجلوس'];
    const lines = [head.join(',')];
    clsStudents.forEach((s) => lines.push([s.name, s.seat || ''].map((x) => `"${x}"`).join(',')));
    download(`كشف_${slugify(activeClass?.name || 'صف')}.csv`, lines.join('\n'), 'text/csv;charset=utf-8');
  };

  return (
    <div className="space-y-5">
      <SectionHeader
        icon={Icon.Users}
        title="الصفوف والطلاب"
        subtitle="إدارة الصفوف والشعب وكشوف الطلاب"
        actions={<button className="btn-primary" onClick={openNew}><Icon.Plus size={18} /> صف جديد</button>}
      />

      {classes.length === 0 ? (
        <Card className="p-6">
          <EmptyState icon={Icon.Users} title="لا توجد صفوف بعد" subtitle="أضف صفاً (شعبة) لتبدأ برصد الطلاب والدرجات والحضور."
            action={<button className="btn-primary" onClick={openNew}><Icon.Plus size={18} /> إضافة صف</button>} />
        </Card>
      ) : (
        <div className="grid lg:grid-cols-[320px_1fr] gap-4">
          <Card className="p-4 h-fit">
            <div className="section-title mb-3"><Icon.School size={18} /> الصفوف ({classes.length})</div>
            <div className="space-y-1.5">
              {classes.map((c) => {
                const count = students.filter((s) => s.classId === c.id).length;
                return (
                  <div key={c.id}
                    className={`rounded-xl px-3 py-2.5 cursor-pointer transition ${activeCls === c.id ? 'bg-brand-50 ring-1 ring-brand-200' : 'hover:bg-slate-50'}`}
                    onClick={() => setActiveCls(c.id)}>
                    <div className="flex items-center justify-between gap-2">
                      <div className="min-w-0">
                        <div className="font-bold text-slate-700 text-sm truncate">{c.name}</div>
                        <div className="text-[11px] text-slate-400 font-bold">{gradeName(c.grade)} • {count} طالب</div>
                      </div>
                      <div className="flex gap-1">
                        <button className="text-slate-400 hover:text-brand-600" onClick={(e) => { e.stopPropagation(); openEdit(c); }}><Icon.Edit size={15} /></button>
                        <button className="text-slate-400 hover:text-rose-600" onClick={(e) => { e.stopPropagation(); setConfirmDel(c); }}><Icon.Trash size={15} /></button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </Card>

          <div>
            {!activeCls ? (
              <Card className="p-6"><EmptyState icon={Icon.Users} title="اختر صفاً" subtitle="اختر صفاً من القائمة لعرض الطلاب." /></Card>
            ) : (
              <Card className="p-4 sm:p-5">
                <div className="flex items-center justify-between gap-3 mb-4 flex-wrap">
                  <div>
                    <h3 className="text-lg font-extrabold text-slate-800">{activeClass?.name}</h3>
                    <p className="text-xs text-slate-400 font-bold">{gradeName(activeClass?.grade)} • {clsStudents.length} طالب</p>
                  </div>
                  <div className="flex gap-2 flex-wrap">
                    <button className="btn-outline !px-3 !py-2 !text-xs" onClick={exportRoster} disabled={!clsStudents.length}><Icon.Download size={15} /> كشف CSV</button>
                    <button className="btn-ghost !px-3 !py-2 !text-xs" onClick={() => setBulkOpen(true)}><Icon.Upload size={15} /> استيراد</button>
                    <button className="btn-primary !px-3 !py-2 !text-xs" onClick={() => setStuOpen(true)}><Icon.Plus size={15} /> طالب</button>
                  </div>
                </div>

                {/* إضافة سريعة */}
                <div className="flex gap-2 mb-4">
                  <input className="input" placeholder="اسم الطالب..." value={stuForm.name} onChange={(e) => setStuForm((f) => ({ ...f, name: e.target.value }))}
                    onKeyDown={(e) => e.key === 'Enter' && addStu()} />
                  <input className="input !w-28" placeholder="الجلوس" value={stuForm.seat} onChange={(e) => setStuForm((f) => ({ ...f, seat: e.target.value }))} />
                  <button className="btn-primary" onClick={addStu}><Icon.Plus size={18} /></button>
                </div>

                {clsStudents.length === 0 ? (
                  <EmptyState icon={Icon.Users} title="لا يوجد طلاب" subtitle="أضف الطلاب يدوياً أو استوردهم من ملف." />
                ) : (
                  <div className="table-wrap">
                    <table className="tbl">
                      <thead><tr><th>#</th><th>الاسم</th><th>رقم الجلوس</th><th>إجراء</th></tr></thead>
                      <tbody>
                        {clsStudents.map((s, i) => (
                          <tr key={s.id}>
                            <td>{i + 1}</td>
                            <td>
                              <input className="input !py-1.5 !text-sm !border-transparent hover:!border-slate-200" value={s.name}
                                onChange={(e) => updateStudent(s.id, { name: e.target.value })} />
                            </td>
                            <td>
                              <input className="input !w-24 !py-1.5 !text-sm !border-transparent hover:!border-slate-200" value={s.seat || ''}
                                onChange={(e) => updateStudent(s.id, { seat: e.target.value })} />
                            </td>
                            <td>
                              <button className="btn-danger !px-2.5 !py-1.5" onClick={() => setConfirmStu(s)}><Icon.Trash size={15} /></button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </Card>
            )}
          </div>
        </div>
      )}

      {/* صف جديد/تعديل */}
      <Modal open={open} onClose={() => setOpen(false)} title={editCls ? 'تعديل الصف' : 'إضافة صف جديد'} size="md"
        footer={<><button className="btn-ghost" onClick={() => setOpen(false)}>إلغاء</button><button className="btn-primary" onClick={submitCls}>{editCls ? 'حفظ' : 'إضافة'}</button></>}>
        <div className="space-y-4">
          <Field label="اسم الصف/الشعبة" required hint="مثال: السابع (أ) أو الصف السابع — شعبة 1">
            <input className="input" value={form.name} onChange={(e) => set('name', e.target.value)} placeholder="اسم الصف/الشعبة" />
          </Field>
          <div className="grid sm:grid-cols-2 gap-4">
            <Field label="الصف الدراسي">
              <select className="input" value={form.grade} onChange={(e) => set('grade', Number(e.target.value))}>
                {GRADES_BY_STAGE.map(({ stage, grades }) => (
                      <optgroup key={stage.id} label={stage.short}>
                        {grades.map((g) => <option key={g.n} value={g.n}>{g.label}</option>)}
                      </optgroup>
                    ))}
              </select>
            </Field>
            <Field label="المادة الأساسية">
              <select className="input" value={form.subjectId} onChange={(e) => set('subjectId', e.target.value)}>
                {subjectsForGrade(form.grade).map((s) => <option key={s.id} value={s.id}>{s.icon} {s.name}</option>)}
              </select>
            </Field>
          </div>
          {form.grade >= 10 && (
            <Field label="القسم">
              <select className="input" value={form.section} onChange={(e) => set('section', e.target.value)}>
                {SECONDARY_SECTIONS.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            </Field>
          )}
        </div>
      </Modal>

      {/* استيراد */}
      <Modal open={bulkOpen} onClose={() => setBulkOpen(false)} title="استيراد الطلاب" size="md"
        footer={<><button className="btn-ghost" onClick={() => setBulkOpen(false)}>إلغاء</button><button className="btn-primary" onClick={importBulk}>استيراد</button></>}>
        <Field label="ألصق الأسماء (سطر لكل طالب)" hint="يمكن فصل رقم الجلوس بفاصلة: الاسم، رقم الجلوس">
          <textarea className="input min-h-[200px]" value={bulkText} onChange={(e) => setBulkText(e.target.value)}
            placeholder={'محمد أحمد\nعلي صالح\nفاطمة عبدالله، 3'} />
        </Field>
      </Modal>

      <Confirm open={!!confirmDel} onClose={() => setConfirmDel(null)}
        onConfirm={() => { if (activeCls === confirmDel.id) setActiveCls(null); deleteClass(confirmDel.id); toast.push('تم حذف الصف'); }}
        title="حذف الصف" message={`سيتم حذف «${confirmDel?.name}» وكل طلابه. متابعة؟`} />

      <Confirm open={!!confirmStu} onClose={() => setConfirmStu(null)}
        onConfirm={() => { deleteStudent(confirmStu.id); toast.push('تم حذف الطالب'); }}
        title="حذف الطالب" message={`هل تريد حذف «${confirmStu?.name}»؟`} />
      {toast.view}
    </div>
  );
}
