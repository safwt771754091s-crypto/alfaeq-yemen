import { useMemo, useState } from 'react';
import Icon from '../components/Icon.jsx';
import { Card, SectionHeader, Field, EmptyState, Modal, useToast, Confirm, ProgressBar } from '../components/UI.jsx';
import { useApp } from '../state/store.jsx';

const CATEGORIES = ['استراتيجيات التدريس', 'التقويم', 'الإدارة الصفية', 'التقنية التعليمية', 'التربية الخاصة', 'أخرى'];

// دورات مقترحة للمعلم اليمني (تُضاف بضغطة)
const SUGGESTED = [
  { title: 'استراتيجيات التعلم النشط', category: 'استراتيجيات التدريس', provider: 'وزارة التربية والتعليم', hours: 12 },
  { title: 'تصميم الاختبارات وفق جدول المواصفات', category: 'التقويم', provider: 'مكتب التربية', hours: 8 },
  { title: 'إدارة الصف الفعّالة', category: 'الإدارة الصفية', provider: 'تدريب عن بُعد', hours: 10 },
  { title: 'توظيف التقنية في التعليم', category: 'التقنية التعليمية', provider: 'منصة تعليمية', hours: 6 },
  { title: 'أساليب التقويم البديل', category: 'التقويم', provider: 'مكتب التربية', hours: 9 }
];

const EMPTY = { title: '', category: CATEGORIES[0], provider: '', hours: '', status: 'planned', progress: 0, link: '', note: '' };

export default function Training() {
  const { training } = useApp();
  const toast = useToast();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(EMPTY);
  const [confirmId, setConfirmId] = useState(null);

  const items = training.items;
  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const stats = useMemo(() => {
    const done = items.filter((t) => t.status === 'done').length;
    const totalHours = items.reduce((s, t) => s + (Number(t.hours) || 0), 0);
    const doneHours = items.filter((t) => t.status === 'done').reduce((s, t) => s + (Number(t.hours) || 0), 0);
    return { done, total: items.length, totalHours, doneHours };
  }, [items]);

  const save = () => {
    if (!form.title.trim()) { toast.push('أدخل اسم الدورة', 'error'); return; }
    training.add(form);
    toast.push('تمت إضافة الدورة');
    setForm(EMPTY);
    setOpen(false);
  };

  const addSuggested = () => {
    SUGGESTED.forEach((s) => {
      if (!items.some((t) => t.title === s.title)) training.add({ ...EMPTY, ...s });
    });
    toast.push('تمت إضافة الدورات المقترحة');
  };

  const cycle = (t) => {
    const order = ['planned', 'inprogress', 'done'];
    const next = order[(order.indexOf(t.status) + 1) % order.length];
    training.update(t.id, { status: next, progress: next === 'done' ? 100 : next === 'planned' ? 0 : Math.max(t.progress || 0, 30) });
  };

  const statusMeta = {
    planned: { name: 'مخطّطة', cls: 'bg-slate-100 text-slate-600' },
    inprogress: { name: 'قيد التدريب', cls: 'bg-amber-50 text-amber-700' },
    done: { name: 'مكتملة', cls: 'bg-emerald-50 text-emerald-700' }
  };

  return (
    <div className="space-y-5">
      <SectionHeader
        icon={Icon.GraduationCap}
        title="التدريب والتطوير المهني"
        subtitle="تابع دوراتك وورشك التدريبية وساعاتك المعتمدة"
        actions={
          <>
            <button className="btn-outline" onClick={addSuggested}><Icon.Sparkles size={18} /> دورات مقترحة</button>
            <button className="btn-primary" onClick={() => { setForm(EMPTY); setOpen(true); }}><Icon.Plus size={18} /> دورة جديدة</button>
          </>
        }
      />

      <div className="grid sm:grid-cols-3 gap-3">
        <Card className="p-4 flex items-center gap-3">
          <span className="grid place-items-center w-11 h-11 rounded-2xl bg-brand-50 text-brand-700"><Icon.GraduationCap size={22} /></span>
          <div><div className="text-2xl font-extrabold text-slate-800">{stats.total}</div><div className="text-xs font-bold text-slate-500">إجمالي الدورات</div></div>
        </Card>
        <Card className="p-4 flex items-center gap-3">
          <span className="grid place-items-center w-11 h-11 rounded-2xl bg-emerald-50 text-emerald-700"><Icon.CheckCircle size={22} /></span>
          <div><div className="text-2xl font-extrabold text-slate-800">{stats.done}</div><div className="text-xs font-bold text-slate-500">مكتملة</div></div>
        </Card>
        <Card className="p-4 flex items-center gap-3">
          <span className="grid place-items-center w-11 h-11 rounded-2xl bg-amber-50 text-amber-700"><Icon.Clock size={22} /></span>
          <div><div className="text-2xl font-extrabold text-slate-800">{stats.doneHours}/{stats.totalHours}</div><div className="text-xs font-bold text-slate-500">الساعات المعتمدة</div></div>
        </Card>
      </div>

      {items.length === 0 ? (
        <Card><EmptyState icon={Icon.GraduationCap} title="لا توجد دورات" subtitle="أضف دوراتك التدريبية، أو ابدأ بالدورات المقترحة للمعلم اليمني."
          action={<button className="btn-primary" onClick={addSuggested}><Icon.Sparkles size={18} /> إضافة دورات مقترحة</button>} /></Card>
      ) : (
        <div className="grid sm:grid-cols-2 gap-4">
          {items.map((t) => {
            const S = statusMeta[t.status] || statusMeta.planned;
            return (
              <Card key={t.id} className="p-4 flex flex-col gap-3">
                <div className="flex items-start gap-3">
                  <span className="grid place-items-center w-11 h-11 rounded-2xl bg-brand-50 text-brand-700 shrink-0"><Icon.GraduationCap size={22} /></span>
                  <div className="min-w-0 grow">
                    <div className="font-extrabold text-slate-800 leading-tight">{t.title}</div>
                    <div className="text-xs text-slate-400 font-bold mt-0.5">{t.provider || '—'}{t.hours ? ` • ${t.hours} ساعة` : ''}</div>
                  </div>
                  <button onClick={() => cycle(t)} className={`chip ${S.cls} shrink-0`}>{S.name}</button>
                </div>
                <div className="text-xs font-bold text-slate-500">{t.category}</div>
                <ProgressBar value={t.progress || 0} tone={t.status === 'done' ? 'emerald' : 'brand'} />
                <div className="flex items-center gap-2 mt-auto">
                  {t.link && <a className="btn-outline !py-2 grow" href={t.link} target="_blank" rel="noreferrer"><Icon.Eye size={16} /> فتح</a>}
                  <button className="btn-danger !py-2" onClick={() => setConfirmId(t.id)} aria-label="حذف"><Icon.Trash size={16} /></button>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title="دورة تدريبية جديدة"
        footer={<><button className="btn-ghost" onClick={() => setOpen(false)}>إلغاء</button><button className="btn-primary" onClick={save}><Icon.Check size={18} /> إضافة</button></>}
      >
        <div className="grid sm:grid-cols-2 gap-4">
          <Field label="اسم الدورة" required><input className="input" value={form.title} onChange={(e) => set('title', e.target.value)} /></Field>
          <Field label="المجال">
            <select className="input" value={form.category} onChange={(e) => set('category', e.target.value)}>
              {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </Field>
          <Field label="الجهة المانحة"><input className="input" value={form.provider} onChange={(e) => set('provider', e.target.value)} /></Field>
          <Field label="عدد الساعات"><input type="number" className="input" value={form.hours} onChange={(e) => set('hours', e.target.value)} /></Field>
          <Field label="الحالة">
            <select className="input" value={form.status} onChange={(e) => set('status', e.target.value)}>
              <option value="planned">مخطّطة</option>
              <option value="inprogress">قيد التدريب</option>
              <option value="done">مكتملة</option>
            </select>
          </Field>
          <Field label="الرابط (اختياري)"><input className="input" dir="ltr" value={form.link} onChange={(e) => set('link', e.target.value)} placeholder="https://..." /></Field>
        </div>
      </Modal>

      <Confirm open={!!confirmId} onClose={() => setConfirmId(null)}
        onConfirm={() => { training.remove(confirmId); toast.push('تم حذف الدورة'); }}
        title="حذف الدورة" message="سيتم حذف هذه الدورة من سجل التدريب. متابعة؟" />
      {toast.view}
    </div>
  );
}
