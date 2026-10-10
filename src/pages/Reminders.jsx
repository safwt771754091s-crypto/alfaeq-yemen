import { useMemo, useState } from 'react';
import Icon from '../components/Icon.jsx';
import { Card, SectionHeader, Field, EmptyState, Modal, useToast, Confirm } from '../components/UI.jsx';
import { useApp } from '../state/store.jsx';
import { todayISO, formatDate } from '../lib/utils.js';

const TYPES = [
  { id: 'task', name: 'مهمة', icon: Icon.ListChecks, cls: 'bg-brand-50 text-brand-700' },
  { id: 'exam', name: 'اختبار', icon: Icon.Clipboard, cls: 'bg-rose-50 text-rose-600' },
  { id: 'meeting', name: 'اجتماع', icon: Icon.Users, cls: 'bg-violet-50 text-violet-700' },
  { id: 'reminder', name: 'تذكير', icon: Icon.Bell, cls: 'bg-amber-50 text-amber-700' }
];

const EMPTY = { title: '', type: 'task', date: todayISO(), time: '', note: '', done: false };

export default function Reminders() {
  const { reminders } = useApp();
  const toast = useToast();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(EMPTY);
  const [confirmId, setConfirmId] = useState(null);
  const [filter, setFilter] = useState('all');

  const items = reminders.items;
  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const { upcoming, done } = useMemo(() => {
    const up = items.filter((r) => !r.done).sort((a, b) => (a.date || '').localeCompare(b.date || ''));
    const dn = items.filter((r) => r.done);
    return { upcoming: up, done: dn };
  }, [items]);

  const list = filter === 'all' ? items : filter === 'done' ? done : upcoming;
  const meta = (id) => TYPES.find((t) => t.id === id) || TYPES[0];
  const isToday = (d) => d === todayISO();

  const save = () => {
    if (!form.title.trim()) { toast.push('أدخل عنوان التذكير', 'error'); return; }
    reminders.add(form);
    toast.push('تمت إضافة التذكير');
    setForm(EMPTY);
    setOpen(false);
  };

  return (
    <div className="space-y-5">
      <SectionHeader
        icon={Icon.Bell}
        title="الإشعارات والتذكيرات"
        subtitle="مهامك ومواعيد اختباراتك واجتماعاتك في مكان واحد"
        actions={<button className="btn-primary" onClick={() => { setForm(EMPTY); setOpen(true); }}><Icon.Plus size={18} /> تذكير جديد</button>}
      />

      <div className="grid sm:grid-cols-3 gap-3">
        <Card className="p-4 flex items-center gap-3">
          <span className="grid place-items-center w-11 h-11 rounded-2xl bg-brand-50 text-brand-700"><Icon.Bell size={22} /></span>
          <div><div className="text-2xl font-extrabold text-slate-800">{upcoming.length}</div><div className="text-xs font-bold text-slate-500">قادمة</div></div>
        </Card>
        <Card className="p-4 flex items-center gap-3">
          <span className="grid place-items-center w-11 h-11 rounded-2xl bg-amber-50 text-amber-700"><Icon.Clock size={22} /></span>
          <div><div className="text-2xl font-extrabold text-slate-800">{items.filter((r) => isToday(r.date) && !r.done).length}</div><div className="text-xs font-bold text-slate-500">اليوم</div></div>
        </Card>
        <Card className="p-4 flex items-center gap-3">
          <span className="grid place-items-center w-11 h-11 rounded-2xl bg-emerald-50 text-emerald-700"><Icon.CheckCircle size={22} /></span>
          <div><div className="text-2xl font-extrabold text-slate-800">{done.length}</div><div className="text-xs font-bold text-slate-500">مكتملة</div></div>
        </Card>
      </div>

      <div className="flex gap-1.5">
        {[{ id: 'all', name: 'الكل' }, { id: 'upcoming', name: 'القادمة' }, { id: 'done', name: 'المكتملة' }].map((f) => (
          <button key={f.id} onClick={() => setFilter(f.id)}
            className={`rounded-xl px-4 py-2 text-sm font-bold border transition ${filter === f.id ? 'bg-brand-600 text-white border-brand-600' : 'bg-white text-slate-600 border-slate-200'}`}>
            {f.name}
          </button>
        ))}
      </div>

      {list.length === 0 ? (
        <Card><EmptyState icon={Icon.Bell} title="لا توجد تذكيرات" subtitle="أضف مواعيدك ومهامك لتتابعها بسهولة." action={<button className="btn-primary" onClick={() => setOpen(true)}><Icon.Plus size={18} /> إضافة</button>} /></Card>
      ) : (
        <div className="space-y-2.5">
          {list.map((r) => {
            const M = meta(r.type); const I = M.icon;
            return (
              <Card key={r.id} className="p-4 flex items-center gap-3">
                <button onClick={() => reminders.update(r.id, { done: !r.done })}
                  className={`grid place-items-center w-10 h-10 rounded-xl border-2 shrink-0 transition ${r.done ? 'bg-emerald-500 border-emerald-500 text-white' : 'border-slate-300 text-transparent hover:border-brand-400'}`}>
                  <Icon.Check size={20} />
                </button>
                <span className={`grid place-items-center w-10 h-10 rounded-xl shrink-0 ${M.cls}`}><I size={20} /></span>
                <div className="min-w-0 grow">
                  <div className={`font-extrabold ${r.done ? 'text-slate-400 line-through' : 'text-slate-800'}`}>{r.title}</div>
                  <div className="text-xs text-slate-400 font-bold mt-0.5 flex flex-wrap gap-x-3">
                    <span>{formatDate(r.date)}{r.time ? ` • ${r.time}` : ''}</span>
                    {isToday(r.date) && !r.done && <span className="text-rose-500">اليوم</span>}
                    {r.note && <span className="truncate">{r.note}</span>}
                  </div>
                </div>
                <span className="chip bg-slate-100 text-slate-600 shrink-0 hidden sm:inline-flex">{M.name}</span>
                <button className="btn-danger !py-2" onClick={() => setConfirmId(r.id)} aria-label="حذف"><Icon.Trash size={16} /></button>
              </Card>
            );
          })}
        </div>
      )}

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title="تذكير جديد"
        footer={<><button className="btn-ghost" onClick={() => setOpen(false)}>إلغاء</button><button className="btn-primary" onClick={save}><Icon.Check size={18} /> إضافة</button></>}
      >
        <div className="grid sm:grid-cols-2 gap-4">
          <Field label="العنوان" required><input className="input" value={form.title} onChange={(e) => set('title', e.target.value)} placeholder="مثال: اختبار الوحدة الثانية" /></Field>
          <Field label="النوع">
            <select className="input" value={form.type} onChange={(e) => set('type', e.target.value)}>
              {TYPES.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
            </select>
          </Field>
          <Field label="التاريخ"><input type="date" className="input" value={form.date} onChange={(e) => set('date', e.target.value)} /></Field>
          <Field label="الوقت (اختياري)"><input type="time" className="input" value={form.time} onChange={(e) => set('time', e.target.value)} /></Field>
          <Field label="ملاحظة"><input className="input" value={form.note} onChange={(e) => set('note', e.target.value)} /></Field>
        </div>
      </Modal>

      <Confirm open={!!confirmId} onClose={() => setConfirmId(null)}
        onConfirm={() => { reminders.remove(confirmId); toast.push('تم حذف التذكير'); }}
        title="حذف التذكير" message="سيتم حذف هذا التذكير. متابعة؟" />
      {toast.view}
    </div>
  );
}
