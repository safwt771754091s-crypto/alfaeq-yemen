import { useState } from 'react';
import Icon from '../components/Icon.jsx';
import { Card, SectionHeader, Field, EmptyState, Modal, useToast, Confirm } from '../components/UI.jsx';
import { useApp } from '../state/store.jsx';
import { formatDate, todayISO } from '../lib/utils.js';

const PRIORITIES = [
  { id: 'normal', name: 'عادي', cls: 'bg-slate-100 text-slate-600' },
  { id: 'important', name: 'مهم', cls: 'bg-amber-50 text-amber-700' },
  { id: 'urgent', name: 'عاجل', cls: 'bg-rose-50 text-rose-600' }
];

const EMPTY = { title: '', body: '', priority: 'normal', date: todayISO(), audience: 'الطلاب' };

export default function Announcements() {
  const { announcements } = useApp();
  const toast = useToast();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(EMPTY);
  const [confirmId, setConfirmId] = useState(null);

  const items = announcements.items;
  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));
  const prio = (id) => PRIORITIES.find((p) => p.id === id) || PRIORITIES[0];

  const save = () => {
    if (!form.title.trim()) { toast.push('أدخل عنوان الإعلان', 'error'); return; }
    announcements.add(form);
    toast.push('تم نشر الإعلان');
    setForm(EMPTY);
    setOpen(false);
  };

  return (
    <div className="space-y-5">
      <SectionHeader
        icon={Icon.Megaphone}
        title="الإعلانات"
        subtitle="أعلن لطلابك عن الاختبارات والأنشطة والمواعيد المهمة"
        actions={<button className="btn-primary" onClick={() => { setForm(EMPTY); setOpen(true); }}><Icon.Plus size={18} /> إعلان جديد</button>}
      />

      {items.length === 0 ? (
        <Card><EmptyState icon={Icon.Megaphone} title="لا توجد إعلانات" subtitle="انشر إعلاناً ليظهر في لوحة الإعلانات."
          action={<button className="btn-primary" onClick={() => setOpen(true)}><Icon.Plus size={18} /> إعلان جديد</button>} /></Card>
      ) : (
        <div className="space-y-3">
          {items.map((a) => {
            const P = prio(a.priority);
            return (
              <Card key={a.id} className="p-5 flex items-start gap-4">
                <span className={`grid place-items-center w-11 h-11 rounded-2xl shrink-0 ${P.cls}`}><Icon.Megaphone size={22} /></span>
                <div className="grow min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="font-extrabold text-slate-800">{a.title}</h3>
                    <span className={`chip ${P.cls}`}>{P.name}</span>
                    <span className="chip bg-slate-100 text-slate-600">{a.audience}</span>
                  </div>
                  {a.body && <p className="text-sm text-slate-600 leading-relaxed mt-2 whitespace-pre-wrap">{a.body}</p>}
                  <div className="text-xs text-slate-400 font-bold mt-2">{formatDate(a.date)}</div>
                </div>
                <button className="btn-danger !py-2" onClick={() => setConfirmId(a.id)} aria-label="حذف"><Icon.Trash size={16} /></button>
              </Card>
            );
          })}
        </div>
      )}

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title="إعلان جديد"
        footer={<><button className="btn-ghost" onClick={() => setOpen(false)}>إلغاء</button><button className="btn-primary" onClick={save}><Icon.Megaphone size={18} /> نشر</button></>}
      >
        <div className="space-y-4">
          <Field label="عنوان الإعلان" required><input className="input" value={form.title} onChange={(e) => set('title', e.target.value)} placeholder="مثال: اختبار الرياضيات يوم الأحد" /></Field>
          <div className="grid sm:grid-cols-3 gap-4">
            <Field label="الأهمية">
              <select className="input" value={form.priority} onChange={(e) => set('priority', e.target.value)}>
                {PRIORITIES.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
            </Field>
            <Field label="الجمهور">
              <select className="input" value={form.audience} onChange={(e) => set('audience', e.target.value)}>
                {['الطلاب', 'أولياء الأمور', 'المعلمون', 'الكل'].map((a) => <option key={a} value={a}>{a}</option>)}
              </select>
            </Field>
            <Field label="التاريخ"><input type="date" className="input" value={form.date} onChange={(e) => set('date', e.target.value)} /></Field>
          </div>
          <Field label="النص"><textarea className="input min-h-[110px]" value={form.body} onChange={(e) => set('body', e.target.value)} /></Field>
        </div>
      </Modal>

      <Confirm open={!!confirmId} onClose={() => setConfirmId(null)}
        onConfirm={() => { announcements.remove(confirmId); toast.push('تم حذف الإعلان'); }}
        title="حذف الإعلان" message="سيتم حذف هذا الإعلان. متابعة؟" />
      {toast.view}
    </div>
  );
}
