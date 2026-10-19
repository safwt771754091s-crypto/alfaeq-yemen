import { useMemo, useState } from 'react';
import Icon from '../components/Icon.jsx';
import { Card, SectionHeader, Field, Modal, Confirm, useToast, StatCard, EmptyState } from '../components/UI.jsx';
import { useApp } from '../state/store.jsx';
import { useAuth } from '../state/auth.jsx';
import {
  ENTITIES, entityByKey, entityApi, entityCounts, findDuplicates, applyMerge, removeMany, updateMany
} from '../lib/controlCenter.js';

// نموذج إضافة/تعديل مبني تلقائياً من وصف الحقول
function EntityForm({ entity, row, onClose }) {
  const app = useApp();
  const api = useMemo(() => entityApi(app), [app]);
  const toast = useToast();
  const isEdit = !!row;
  const [f, setF] = useState(() => {
    const init = {};
    entity.fields.forEach((fld) => { init[fld.k] = row?.[fld.k] ?? (fld.type === 'select' ? (fld.options?.[0]?.value ?? '') : ''); });
    return init;
  });
  const set = (k, v) => setF((p) => ({ ...p, [k]: v }));

  const submit = () => {
    const missing = entity.fields.find((fld) => fld.required && !String(f[fld.k] || '').trim());
    if (missing) { toast.push(`أدخل «${missing.label}»`, 'error'); return; }
    const patch = { ...f };
    entity.fields.forEach((fld) => { if (fld.type === 'number') patch[fld.k] = patch[fld.k] === '' ? '' : Number(patch[fld.k]); });
    if (isEdit) api[entity.key].update(row.id, patch);
    else api[entity.key].add(patch);
    toast.push(isEdit ? 'تم التعديل' : 'تمت الإضافة');
    onClose();
  };

  return (
    <Modal open onClose={onClose} title={isEdit ? `تعديل: ${entity.title(row) || ''}` : `إضافة إلى ${entity.label}`} size="md"
      footer={<><button className="btn-ghost" onClick={onClose}>إلغاء</button><button className="btn-primary" onClick={submit}><Icon.Check size={18} /> حفظ</button></>}>
      <div className="space-y-4">
        {entity.fields.map((fld) => (
          <Field key={fld.k} label={fld.label} required={fld.required}>
            {fld.type === 'select' ? (
              <select className="input" value={f[fld.k]} onChange={(e) => set(fld.k, e.target.value)}>
                {(fld.options || []).map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
            ) : fld.type === 'textarea' ? (
              <textarea className="input min-h-[90px]" value={f[fld.k]} onChange={(e) => set(fld.k, e.target.value)} />
            ) : (
              <input className="input" type={fld.type === 'number' ? 'number' : 'text'} dir={fld.type === 'number' ? 'ltr' : 'rtl'} value={f[fld.k]} onChange={(e) => set(fld.k, e.target.value)} />
            )}
          </Field>
        ))}
      </div>
    </Modal>
  );
}

// مدير نوع واحد: قائمة + بحث + إضافة + تعديل + حذف + تحديد جماعي + دمج التكرار
function EntityManager({ entityKey, onBack }) {
  const app = useApp();
  const api = useMemo(() => entityApi(app), [app]);
  const entity = entityByKey(entityKey);
  const toast = useToast();
  const [q, setQ] = useState('');
  const [form, setForm] = useState(null); // {row}
  const [confirm, setConfirm] = useState(null);
  const [selected, setSelected] = useState([]);
  const [mergeOpen, setMergeOpen] = useState(false);

  const rows = api[entityKey]?.list || [];
  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (!s) return rows;
    return rows.filter((r) => (entity.search ? entity.search(r) : '').toLowerCase().includes(s));
  }, [rows, q, entity]);

  const duplicates = useMemo(() => findDuplicates(entityKey, rows), [entityKey, rows]);
  const IconEl = Icon[entity.icon] || Icon.Grid;

  const toggle = (id) => setSelected((s) => (s.includes(id) ? s.filter((x) => x !== id) : [...s, id]));

  const bulkDelete = () => {
    removeMany(api, entityKey, selected);
    toast.push(`تم حذف ${selected.length} عنصر`);
    setSelected([]);
  };

  const doMergeAll = () => {
    let merged = 0;
    duplicates.forEach((g) => { merged += applyMerge(api, entityKey, g); });
    toast.push(merged ? `تم دمج ${merged} عنصراً مكرراً` : 'لا يوجد تكرار');
    setMergeOpen(false);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 flex-wrap">
        <button className="btn-ghost !px-3 !py-2" onClick={onBack}><Icon.ChevronRight size={18} /> رجوع للمركز</button>
        <div className="flex items-center gap-2">
          <IconEl size={20} className="text-brand-700" />
          <h2 className="text-lg font-extrabold text-slate-800">{entity.label}</h2>
          <span className="chip bg-brand-50 text-brand-700">{rows.length}</span>
        </div>
        <div className="mr-auto flex items-center gap-2 flex-wrap">
          <div className="relative">
            <Icon.Search size={16} className="absolute top-1/2 -translate-y-1/2 right-3 text-slate-400" />
            <input className="input !pr-9 !w-56" placeholder="بحث..." value={q} onChange={(e) => setQ(e.target.value)} />
          </div>
          <button className="btn-outline !px-3 !py-2" onClick={() => setMergeOpen(true)} disabled={!duplicates.length}>
            <Icon.Copy size={16} /> دمج المكرر {duplicates.length ? `(${duplicates.length})` : ''}
          </button>
          <button className="btn-primary" onClick={() => setForm({ row: null })}><Icon.Plus size={18} /> إضافة</button>
        </div>
      </div>

      {selected.length > 0 && (
        <div className="flex items-center gap-2 flex-wrap rounded-2xl bg-sand-50 ring-1 ring-sand-100 px-4 py-2.5">
          <span className="text-sm font-extrabold text-sand-800">حُدِّد {selected.length}</span>
          <button className="btn-ghost !px-3 !py-1.5 text-xs" onClick={() => updateMany(api, entityKey, selected, {})} style={{ display: 'none' }} />
          <button className="btn-ghost !px-3 !py-1.5 text-xs text-rose-600" onClick={bulkDelete}><Icon.Trash size={15} /> حذف المحدد</button>
          <button className="btn-ghost !px-3 !py-1.5 text-xs" onClick={() => setSelected([])}>إلغاء التحديد</button>
        </div>
      )}

      {filtered.length === 0 ? (
        <EmptyState icon={IconEl} title="لا توجد عناصر" subtitle={q ? 'لا نتائج مطابقة للبحث' : 'ابدأ بإضافة عنصر جديد'} action={<button className="btn-primary" onClick={() => setForm({ row: null })}><Icon.Plus size={18} /> إضافة</button>} />
      ) : (
        <Card className="p-2 sm:p-3">
          <div className="divide-y divide-slate-100">
            {filtered.map((r) => (
              <div key={r.id} className="flex items-center gap-3 p-3 flex-wrap">
                <input type="checkbox" className="w-4 h-4 accent-brand-600" checked={selected.includes(r.id)} onChange={() => toggle(r.id)} />
                <div className="min-w-0">
                  <div className="font-extrabold text-slate-800 truncate">{entity.title(r) || '—'}</div>
                  {entity.subtitle && <div className="text-xs text-slate-400 font-bold truncate">{entity.subtitle(r)}</div>}
                </div>
                <div className="mr-auto flex items-center gap-1.5">
                  <button className="btn-outline !px-3 !py-2 text-xs" onClick={() => setForm({ row: r })}><Icon.Edit size={15} /> تعديل</button>
                  <button className="btn-ghost !px-3 !py-2 text-xs text-rose-600" onClick={() => setConfirm(r)}><Icon.Trash size={15} /></button>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {form && <EntityForm entity={entity} row={form.row} onClose={() => setForm(null)} />}

      <Modal open={mergeOpen} onClose={() => setMergeOpen(false)} title="دمج العناصر المكرّرة" size="lg"
        footer={<><button className="btn-ghost" onClick={() => setMergeOpen(false)}>إلغاء</button><button className="btn-primary" onClick={doMergeAll}><Icon.Copy size={18} /> دمج الكل</button></>}>
        <p className="text-sm text-slate-500 font-bold mb-3">وُجدت {duplicates.length} مجموعة متشابهة. الدمج يحتفظ بالأول ويُكمل الحقول الناقصة من الباقي ثم يحذف المكرر.</p>
        <div className="space-y-2 max-h-80 overflow-y-auto">
          {duplicates.map((g) => (
            <div key={g.key} className="rounded-xl bg-slate-50 px-3 py-2 flex items-center gap-2 flex-wrap">
              <span className="font-extrabold text-slate-700">{g.rows[0] && (entity.title(g.rows[0]) || g.key)}</span>
              <span className="chip bg-amber-50 text-amber-700">{g.rows.length} نسخة</span>
              <button className="btn-ghost !px-3 !py-1.5 text-xs mr-auto" onClick={() => { applyMerge(api, entityKey, g); toast.push('تم الدمج'); }}>دمج هذه</button>
            </div>
          ))}
        </div>
      </Modal>

      <Confirm open={!!confirm} onClose={() => setConfirm(null)} onConfirm={() => { api[entityKey].remove(confirm.id); toast.push('تم الحذف'); }}
        title="حذف عنصر" message={`سيتم حذف «${confirm ? (entity.title(confirm) || '') : ''}» نهائياً. متابعة؟`} />
      {toast.view}
    </div>
  );
}

// نظرة عامة: بطاقات لكل نوع + إحصاءات
function Overview({ onOpen }) {
  const app = useApp();
  const { users } = useAuth();
  const api = useMemo(() => entityApi(app), [app]);
  const counts = entityCounts(api);
  const total = Object.values(counts).reduce((a, b) => a + b, 0);
  const dupTotal = useMemo(() => ENTITIES.reduce((acc, e) => acc + findDuplicates(e.key, api[e.key]?.list || []).length, 0), [api]);

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <StatCard icon={Icon.Grid} label="أنواع المحتوى" value={ENTITIES.length} tone="brand" />
        <StatCard icon={Icon.Clipboard} label="إجمالي السجلات" value={total} tone="sky" />
        <StatCard icon={Icon.Copy} label="مجموعات مكررة" value={dupTotal} tone="amber" />
        <StatCard icon={Icon.Users} label="المستخدمون" value={users.length} tone="violet" />
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
        {ENTITIES.map((e) => {
          const I = Icon[e.icon] || Icon.Grid;
          const dups = findDuplicates(e.key, api[e.key]?.list || []).length;
          return (
            <button key={e.key} onClick={() => onOpen(e.key)}
              className="card p-4 text-right hover:shadow-lg transition group">
              <div className="flex items-center gap-3">
                <span className="grid place-items-center w-11 h-11 rounded-2xl bg-brand-50 text-brand-700 group-hover:bg-brand-100"><I size={22} /></span>
                <div className="min-w-0">
                  <div className="font-extrabold text-slate-800 truncate">{e.label}</div>
                  <div className="text-xs text-slate-400 font-bold">{counts[e.key]} سجل {dups ? `• ${dups} مكرر` : ''}</div>
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

export default function ControlCenter() {
  const { isOwner, currentUser } = useAuth();
  const [entityKey, setEntityKey] = useState(null);

  if (!isOwner && !(currentUser?.permissions || []).includes('controlcenter')) {
    return (
      <EmptyState icon={Icon.Lock} title="مركز التحكم للمالك فقط"
        subtitle="هذه الصفحة متاحة لمالك المنصة أو من يملك صلاحية «مركز التحكم»." />
    );
  }

  return (
    <div className="space-y-5">
      <SectionHeader icon={Icon.Grid} title="مركز التحكم"
        subtitle="إدارة كل محتوى المنصة — إضافة، تعديل، دمج المكرر، وحذف" />
      {entityKey
        ? <EntityManager entityKey={entityKey} onBack={() => setEntityKey(null)} />
        : <Overview onOpen={setEntityKey} />}
    </div>
  );
}
