import { useMemo, useState } from 'react';
import Icon from '../components/Icon.jsx';
import { Card, SectionHeader, EmptyState, useToast } from '../components/UI.jsx';
import { useApp } from '../state/store.jsx';
import { download, formatDateLong } from '../lib/utils.js';

export default function ActivityLog() {
  const { activity, logActivity } = useApp();
  const toast = useToast();
  const [query, setQuery] = useState('');

  const items = useMemo(
    () => activity.filter((a) => !query || a.text.includes(query)),
    [activity, query]
  );

  const exportLog = () => {
    const csv = ['النشاط,التاريخ', ...activity.map((a) => `"${a.text}","${a.at}"`)].join('\n');
    download(`سجل_النشاط.csv`, csv, 'text/csv;charset=utf-8');
    toast.push('تم تصدير سجل النشاط');
  };

  return (
    <div className="space-y-5">
      <SectionHeader
        icon={Icon.ListChecks}
        title="سجل النشاط"
        subtitle="آخر ما قمت به على المنصة — مرتب من الأحدث"
        actions={
          <>
            <button className="btn-outline" onClick={exportLog} disabled={!activity.length}><Icon.Download size={18} /> تصدير</button>
            <button className="btn-ghost" onClick={() => { logActivity('تحقق يدوي من سجل النشاط'); toast.push('تمت إضافة إشارة للسجل'); }}><Icon.Refresh size={18} /> تحديث</button>
          </>
        }
      />

      <Card className="p-4">
        <div className="relative">
          <span className="absolute inset-y-0 right-3 grid place-items-center text-slate-400"><Icon.Search size={18} /></span>
          <input className="input pr-10" placeholder="ابحث في سجل النشاط..." value={query} onChange={(e) => setQuery(e.target.value)} />
        </div>
      </Card>

      {items.length === 0 ? (
        <Card><EmptyState icon={Icon.ListChecks} title="السجل فارغ" subtitle="ستظهر هنا أنشطتك تلقائياً بمجرد استخدامك للمنصة." /></Card>
      ) : (
        <Card className="p-5">
          <ol className="relative border-s-2 border-slate-100 space-y-4 ps-5">
            {items.map((a) => (
              <li key={a.id} className="relative">
                <span className="absolute -start-[27px] top-1 grid place-items-center w-6 h-6 rounded-full bg-brand-100 text-brand-700 ring-4 ring-white">
                  <Icon.Check size={13} />
                </span>
                <div className="font-bold text-slate-800">{a.text}</div>
                <div className="text-xs text-slate-400 font-bold mt-0.5">
                  {formatDateLong(a.at.slice(0, 10))} • {new Date(a.at).toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' })}
                </div>
              </li>
            ))}
          </ol>
        </Card>
      )}
      {toast.view}
    </div>
  );
}
