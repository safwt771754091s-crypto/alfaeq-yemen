import { useMemo, useState } from 'react';
import Icon from '../components/Icon.jsx';
import { Card, SectionHeader, Field, EmptyState, Modal, useToast, Confirm } from '../components/UI.jsx';
import { useApp } from '../state/store.jsx';
import { download } from '../lib/utils.js';

const TYPES = [
  { id: 'file', name: 'ملف', icon: Icon.File },
  { id: 'link', name: 'رابط', icon: Icon.Eye },
  { id: 'video', name: 'فيديو', icon: Icon.Play },
  { id: 'image', name: 'صورة', icon: Icon.Image },
  { id: 'note', name: 'ملاحظة', icon: Icon.Info }
];

const CATEGORIES = ['عام', 'ملازم', 'نماذج اختبارات', 'عروض', 'أنشطة', 'أوراق عمل', 'مراجع'];

const EMPTY = { title: '', type: 'file', category: 'عام', url: '', note: '', subject: '' };

export default function Library() {
  const { library, profile } = useApp();
  const toast = useToast();
  const [query, setQuery] = useState('');
  const [cat, setCat] = useState('الكل');
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(EMPTY);
  const [confirmId, setConfirmId] = useState(null);

  const items = library.items;
  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const filtered = useMemo(() => {
    const q = query.trim();
    return items.filter((it) => {
      if (cat !== 'الكل' && it.category !== cat) return false;
      if (!q) return true;
      return [it.title, it.note, it.subject].filter(Boolean).join(' ').includes(q);
    });
  }, [items, query, cat]);

  const save = () => {
    if (!form.title.trim()) { toast.push('أدخل عنوان المورد', 'error'); return; }
    library.add(form);
    toast.push('تمت إضافة المورد للمكتبة');
    setForm(EMPTY);
    setOpen(false);
  };

  const typeMeta = (id) => TYPES.find((t) => t.id === id) || TYPES[0];

  const exportList = () => {
    const rows = [['العنوان', 'النوع', 'التصنيف', 'المادة', 'الرابط', 'ملاحظة']];
    filtered.forEach((it) => rows.push([it.title, typeMeta(it.type).name, it.category, it.subject || '', it.url || '', it.note || '']));
    const csv = rows.map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(',')).join('\n');
    download(`مكتبة_المعلم_${profile.name || ''}.csv`, csv, 'text/csv;charset=utf-8');
    toast.push('تم تصدير قائمة المكتبة');
  };

  return (
    <div className="space-y-5">
      <SectionHeader
        icon={Icon.Library}
        title="المكتبة"
        subtitle="مكتبتك الرقمية: ملازم، نماذج اختبارات، عروض، أوراق عمل وروابط تعليمية"
        actions={
          <>
            <button className="btn-outline" onClick={exportList}><Icon.Download size={18} /> تصدير</button>
            <button className="btn-primary" onClick={() => { setForm(EMPTY); setOpen(true); }}><Icon.Plus size={18} /> مورد جديد</button>
          </>
        }
      />

      <Card className="p-4">
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative grow min-w-[220px]">
            <span className="absolute inset-y-0 right-3 grid place-items-center text-slate-400"><Icon.Search size={18} /></span>
            <input className="input pr-10" placeholder="ابحث في المكتبة..." value={query} onChange={(e) => setQuery(e.target.value)} />
          </div>
          <div className="flex flex-wrap gap-1.5">
            {['الكل', ...CATEGORIES].map((c) => (
              <button
                key={c}
                onClick={() => setCat(c)}
                className={`rounded-xl px-3 py-1.5 text-xs font-bold border transition ${
                  cat === c ? 'bg-brand-600 text-white border-brand-600' : 'bg-white text-slate-600 border-slate-200 hover:border-brand-400'
                }`}
              >{c}</button>
            ))}
          </div>
        </div>
      </Card>

      {filtered.length === 0 ? (
        <Card>
          <EmptyState
            icon={Icon.Library}
            title="المكتبة فارغة"
            subtitle="أضف ملازمك ونماذج اختباراتك وعروضك لتبقى في متناول يدك دون اتصال."
            action={<button className="btn-primary" onClick={() => setOpen(true)}><Icon.Plus size={18} /> إضافة أول مورد</button>}
          />
        </Card>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((it) => {
            const M = typeMeta(it.type);
            const I = M.icon;
            return (
              <Card key={it.id} className="p-4 flex flex-col gap-3">
                <div className="flex items-start gap-3">
                  <span className="grid place-items-center w-11 h-11 rounded-2xl bg-brand-50 text-brand-700 shrink-0"><I size={22} /></span>
                  <div className="min-w-0 grow">
                    <div className="font-extrabold text-slate-800 leading-tight break-words">{it.title}</div>
                    <div className="text-xs text-slate-400 font-bold mt-0.5">{M.name}{it.subject ? ` • ${it.subject}` : ''}</div>
                  </div>
                  <span className="chip bg-slate-100 text-slate-600 shrink-0">{it.category}</span>
                </div>
                {it.note && <p className="text-sm text-slate-500 leading-relaxed line-clamp-3">{it.note}</p>}
                <div className="flex items-center gap-2 mt-auto">
                  {it.url && (
                    <a className="btn-outline !py-2 grow" href={it.url} target="_blank" rel="noreferrer">
                      <Icon.Eye size={16} /> فتح
                    </a>
                  )}
                  <button className="btn-danger !py-2" onClick={() => setConfirmId(it.id)} aria-label="حذف"><Icon.Trash size={16} /></button>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title="إضافة مورد للمكتبة"
        footer={<>
          <button className="btn-ghost" onClick={() => setOpen(false)}>إلغاء</button>
          <button className="btn-primary" onClick={save}><Icon.Check size={18} /> إضافة</button>
        </>}
      >
        <div className="grid sm:grid-cols-2 gap-4">
          <Field label="عنوان المورد" required>
            <input className="input" value={form.title} onChange={(e) => set('title', e.target.value)} placeholder="مثال: ملزمة الوحدة الأولى" />
          </Field>
          <Field label="النوع">
            <select className="input" value={form.type} onChange={(e) => set('type', e.target.value)}>
              {TYPES.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
            </select>
          </Field>
          <Field label="التصنيف">
            <select className="input" value={form.category} onChange={(e) => set('category', e.target.value)}>
              {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </Field>
          <Field label="المادة (اختياري)">
            <input className="input" value={form.subject} onChange={(e) => set('subject', e.target.value)} placeholder="مثال: الرياضيات" />
          </Field>
          <Field label="الرابط (اختياري)" hint="ضع رابط ملف أو فيديو أو صفحة">
            <input className="input" dir="ltr" value={form.url} onChange={(e) => set('url', e.target.value)} placeholder="https://..." />
          </Field>
          <Field label="ملاحظة">
            <input className="input" value={form.note} onChange={(e) => set('note', e.target.value)} placeholder="وصف مختصر" />
          </Field>
        </div>
      </Modal>

      <Confirm
        open={!!confirmId}
        onClose={() => setConfirmId(null)}
        onConfirm={() => { library.remove(confirmId); toast.push('تم حذف المورد'); }}
        title="حذف المورد"
        message="سيتم حذف هذا المورد من المكتبة. متابعة؟"
      />
      {toast.view}
    </div>
  );
}
