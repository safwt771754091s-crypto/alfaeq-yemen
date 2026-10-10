import { useMemo, useState } from 'react';
import Icon from '../components/Icon.jsx';
import { Card, SectionHeader, Field, EmptyState, Modal, useToast, Confirm } from '../components/UI.jsx';
import { useApp } from '../state/store.jsx';
import { todayISO, formatDate } from '../lib/utils.js';

const TYPES = [
  { id: 'academic', name: 'متابعة أكاديمية', cls: 'bg-brand-50 text-brand-700', icon: Icon.Book },
  { id: 'behavior', name: 'متابعة سلوكية', cls: 'bg-amber-50 text-amber-700', icon: Icon.Shield },
  { id: 'attendance', name: 'متابعة حضور', cls: 'bg-rose-50 text-rose-600', icon: Icon.Calendar },
  { id: 'parent', name: 'تواصل مع الأسرة', cls: 'bg-violet-50 text-violet-700', icon: Icon.Users }
];

const EMPTY = { studentId: '', studentName: '', type: 'academic', note: '', date: todayISO(), status: 'open' };

export default function Followups() {
  const { followups, students } = useApp();
  const toast = useToast();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(EMPTY);
  const [confirmId, setConfirmId] = useState(null);
  const [filter, setFilter] = useState('open');

  const items = followups.items;
  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));
  const meta = (id) => TYPES.find((t) => t.id === id) || TYPES[0];

  const list = useMemo(
    () => (filter === 'all' ? items : items.filter((f) => f.status === filter)),
    [items, filter]
  );

  const save = () => {
    if (!form.note.trim()) { toast.push('اكتب ملاحظة المتابعة', 'error'); return; }
    const stu = students.find((s) => s.id === form.studentId);
    followups.add({ ...form, studentName: stu?.name || form.studentName });
    toast.push('تمت إضافة المتابعة');
    setForm(EMPTY);
    setOpen(false);
  };

  return (
    <div className="space-y-5">
      <SectionHeader
        icon={Icon.ListChecks}
        title="المتابعة"
        subtitle="تابع الطلاب المحتاجين للدعم الأكاديمي أو السلوكي أو الحضوري"
        actions={<button className="btn-primary" onClick={() => { setForm(EMPTY); setOpen(true); }}><Icon.Plus size={18} /> متابعة جديدة</button>}
      />

      <div className="grid sm:grid-cols-3 gap-3">
        <Card className="p-4 flex items-center gap-3">
          <span className="grid place-items-center w-11 h-11 rounded-2xl bg-rose-50 text-rose-600"><Icon.Clock size={22} /></span>
          <div><div className="text-2xl font-extrabold text-slate-800">{items.filter((f) => f.status === 'open').length}</div><div className="text-xs font-bold text-slate-500">قيد المتابعة</div></div>
        </Card>
        <Card className="p-4 flex items-center gap-3">
          <span className="grid place-items-center w-11 h-11 rounded-2xl bg-emerald-50 text-emerald-700"><Icon.CheckCircle size={22} /></span>
          <div><div className="text-2xl font-extrabold text-slate-800">{items.filter((f) => f.status === 'resolved').length}</div><div className="text-xs font-bold text-slate-500">تم حلها</div></div>
        </Card>
        <Card className="p-4 flex items-center gap-3">
          <span className="grid place-items-center w-11 h-11 rounded-2xl bg-brand-50 text-brand-700"><Icon.Users size={22} /></span>
          <div><div className="text-2xl font-extrabold text-slate-800">{new Set(items.map((f) => f.studentId).filter(Boolean)).size}</div><div className="text-xs font-bold text-slate-500">طلاب متابعون</div></div>
        </Card>
      </div>

      <div className="flex gap-1.5">
        {[{ id: 'open', name: 'قيد المتابعة' }, { id: 'resolved', name: 'المحلولة' }, { id: 'all', name: 'الكل' }].map((f) => (
          <button key={f.id} onClick={() => setFilter(f.id)}
            className={`rounded-xl px-4 py-2 text-sm font-bold border transition ${filter === f.id ? 'bg-brand-600 text-white border-brand-600' : 'bg-white text-slate-600 border-slate-200'}`}>
            {f.name}
          </button>
        ))}
      </div>

      {list.length === 0 ? (
        <Card><EmptyState icon={Icon.ListChecks} title="لا توجد متابعات" subtitle="أضف ملاحظة متابعة لطالب ليتمكن من دعمه بشكل أفضل."
          action={<button className="btn-primary" onClick={() => setOpen(true)}><Icon.Plus size={18} /> متابعة جديدة</button>} /></Card>
      ) : (
        <div className="space-y-2.5">
          {list.map((f) => {
            const M = meta(f.type); const I = M.icon;
            return (
              <Card key={f.id} className="p-4 flex items-start gap-3">
                <span className={`grid place-items-center w-11 h-11 rounded-2xl shrink-0 ${M.cls}`}><I size={22} /></span>
                <div className="min-w-0 grow">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-extrabold text-slate-800">{f.studentName || 'طالب'}</span>
                    <span className={`chip ${M.cls}`}>{M.name}</span>
                    {f.status === 'resolved' && <span className="chip bg-emerald-50 text-emerald-700">تم الحل</span>}
                  </div>
                  <p className="text-sm text-slate-600 leading-relaxed mt-1.5 whitespace-pre-wrap">{f.note}</p>
                  <div className="text-xs text-slate-400 font-bold mt-1.5">{formatDate(f.date)}</div>
                </div>
                <div className="flex flex-col gap-2 shrink-0">
                  <button className="btn-outline !py-1.5 !px-2.5" title={f.status === 'open' ? 'وضع كمحلولة' : 'إعادة فتح'}
                    onClick={() => followups.update(f.id, { status: f.status === 'open' ? 'resolved' : 'open' })}>
                    <Icon.Check size={16} />
                  </button>
                  <button className="btn-danger !py-1.5 !px-2.5" onClick={() => setConfirmId(f.id)} aria-label="حذف"><Icon.Trash size={16} /></button>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title="متابعة جديدة"
        footer={<><button className="btn-ghost" onClick={() => setOpen(false)}>إلغاء</button><button className="btn-primary" onClick={save}><Icon.Check size={18} /> إضافة</button></>}
      >
        <div className="grid sm:grid-cols-2 gap-4">
          <Field label="الطالب">
            {students.length ? (
              <select className="input" value={form.studentId} onChange={(e) => set('studentId', e.target.value)}>
                <option value="">— اختر الطالب —</option>
                {students.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            ) : (
              <input className="input" value={form.studentName} onChange={(e) => set('studentName', e.target.value)} placeholder="اسم الطالب" />
            )}
          </Field>
          <Field label="النوع">
            <select className="input" value={form.type} onChange={(e) => set('type', e.target.value)}>
              {TYPES.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
            </select>
          </Field>
          <Field label="التاريخ"><input type="date" className="input" value={form.date} onChange={(e) => set('date', e.target.value)} /></Field>
        </div>
        <div className="mt-4">
          <Field label="ملاحظة المتابعة" required><textarea className="input min-h-[110px]" value={form.note} onChange={(e) => set('note', e.target.value)} placeholder="صف المشكلة والإجراء المقترح..." /></Field>
        </div>
      </Modal>

      <Confirm open={!!confirmId} onClose={() => setConfirmId(null)}
        onConfirm={() => { followups.remove(confirmId); toast.push('تم حذف المتابعة'); }}
        title="حذف المتابعة" message="سيتم حذف هذه المتابعة. متابعة؟" />
      {toast.view}
    </div>
  );
}
