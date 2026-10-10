import { useMemo, useState } from 'react';
import Icon from '../components/Icon.jsx';
import { Card, SectionHeader, Field, EmptyState, Modal, useToast } from '../components/UI.jsx';
import { useApp } from '../state/store.jsx';

const QUICK = [
  { id: 'parents', name: 'رسالة لأولياء الأمور', text: 'السلام عليكم، نحيطكم علماً بأن...' },
  { id: 'admin', name: 'رسالة للإدارة', text: 'إلى إدارة المدرسة المحترمة، أرجو...' },
  { id: 'student', name: 'رسالة لطالب', text: 'عزيزي الطالب، نلفت انتباهك إلى...' }
];

const EMPTY = { to: '', subject: '', body: '' };

export default function Messages() {
  const { messages, students, profile } = useApp();
  const toast = useToast();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(EMPTY);
  const [selected, setSelected] = useState(null);
  const [query, setQuery] = useState('');

  const items = useMemo(
    () => messages.items.filter((m) => !query || [m.to, m.subject, m.body].join(' ').includes(query)),
    [messages.items, query]
  );
  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const save = () => {
    if (!form.subject.trim() && !form.body.trim()) { toast.push('اكتب موضوعاً أو نصاً للرسالة', 'error'); return; }
    messages.add({ ...form, from: profile.name || 'المعلم' });
    toast.push('تم حفظ الرسالة');
    setForm(EMPTY);
    setOpen(false);
  };

  const current = selected ? items.find((m) => m.id === selected) : null;

  return (
    <div className="space-y-5">
      <SectionHeader
        icon={Icon.Message}
        title="الرسائل"
        subtitle="أنشئ واحفظ رسائل جاهزة لأولياء الأمور والإدارة والطلاب"
        actions={<button className="btn-primary" onClick={() => { setForm(EMPTY); setOpen(true); }}><Icon.Plus size={18} /> رسالة جديدة</button>}
      />

      <Card className="p-4">
        <div className="relative">
          <span className="absolute inset-y-0 right-3 grid place-items-center text-slate-400"><Icon.Search size={18} /></span>
          <input className="input pr-10" placeholder="ابحث في الرسائل..." value={query} onChange={(e) => setQuery(e.target.value)} />
        </div>
        <div className="flex flex-wrap gap-1.5 mt-3">
          {QUICK.map((q) => (
            <button key={q.id} className="chip bg-brand-50 text-brand-700 hover:bg-brand-100"
              onClick={() => { setForm({ to: '', subject: q.name, body: q.text }); setOpen(true); }}>
              <Icon.Copy size={14} /> {q.name}
            </button>
          ))}
        </div>
      </Card>

      {items.length === 0 ? (
        <Card><EmptyState icon={Icon.Message} title="لا توجد رسائل" subtitle="أنشئ رسالة جاهزة لتوفير وقتك عند التواصل مع أولياء الأمور."
          action={<button className="btn-primary" onClick={() => setOpen(true)}><Icon.Plus size={18} /> رسالة جديدة</button>} /></Card>
      ) : (
        <div className="grid lg:grid-cols-[340px_1fr] gap-4 items-start">
          <Card className="p-2 divide-y divide-slate-100">
            {items.map((m) => (
              <button key={m.id} onClick={() => setSelected(m.id)}
                className={`w-full text-right px-3 py-3 rounded-xl transition ${selected === m.id ? 'bg-brand-50' : 'hover:bg-slate-50'}`}>
                <div className="font-extrabold text-slate-800 text-sm truncate">{m.subject || '(بدون موضوع)'}</div>
                <div className="text-xs text-slate-400 font-bold truncate">{m.to ? `إلى: ${m.to}` : '—'}</div>
              </button>
            ))}
          </Card>

          {current ? (
            <Card className="p-5">
              <div className="flex items-start justify-between gap-3 mb-3">
                <div>
                  <h3 className="text-lg font-extrabold text-slate-800">{current.subject || '(بدون موضوع)'}</h3>
                  <div className="text-xs text-slate-400 font-bold mt-0.5">
                    {current.to ? `إلى: ${current.to} • ` : ''}من: {current.from || 'المعلم'}
                  </div>
                </div>
                <div className="flex gap-2">
                  <button className="btn-outline !py-2" onClick={() => { navigator.clipboard?.writeText(`${current.subject}\n\n${current.body}`); toast.push('تم نسخ الرسالة'); }}><Icon.Copy size={16} /> نسخ</button>
                  <button className="btn-danger !py-2" onClick={() => { messages.remove(current.id); setSelected(null); toast.push('تم حذف الرسالة'); }} aria-label="حذف"><Icon.Trash size={16} /></button>
                </div>
              </div>
              <p className="text-sm text-slate-700 leading-loose whitespace-pre-wrap">{current.body}</p>
            </Card>
          ) : (
            <Card><EmptyState icon={Icon.Message} title="اختر رسالة" subtitle="اختر رسالة من القائمة لعرضها ونسخها." /></Card>
          )}
        </div>
      )}

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title="رسالة جديدة"
        footer={<><button className="btn-ghost" onClick={() => setOpen(false)}>إلغاء</button><button className="btn-primary" onClick={save}><Icon.Check size={18} /> حفظ</button></>}
      >
        <div className="space-y-4">
          <div className="grid sm:grid-cols-2 gap-4">
            <Field label="المرسل إليه">
              <input className="input" list="msg-recipients" value={form.to} onChange={(e) => set('to', e.target.value)} placeholder="مثال: ولي أمر الطالب / الإدارة" />
              <datalist id="msg-recipients">
                {students.slice(0, 60).map((s) => <option key={s.id} value={`ولي أمر ${s.name}`} />)}
              </datalist>
            </Field>
            <Field label="الموضوع"><input className="input" value={form.subject} onChange={(e) => set('subject', e.target.value)} /></Field>
          </div>
          <Field label="نص الرسالة"><textarea className="input min-h-[160px]" value={form.body} onChange={(e) => set('body', e.target.value)} /></Field>
        </div>
      </Modal>
      {toast.view}
    </div>
  );
}
