import { useState } from 'react';
import Icon from '../components/Icon.jsx';
import { Card, SectionHeader, Field, useToast, EmptyState } from '../components/UI.jsx';
import { useApp } from '../state/store.jsx';
import { useAuth } from '../state/auth.jsx';
import { AUDIENCES, audienceLabel, audienceMatches } from '../lib/controlCenter.js';
import { formatDate } from '../lib/utils.js';

export default function Broadcast() {
  const { announcements } = useApp();
  const { users, currentUser, isOwner } = useAuth();
  const toast = useToast();
  const [f, setF] = useState({ title: '', text: '', audience: 'all', pin: true });
  const set = (k, v) => setF((p) => ({ ...p, [k]: v }));

  if (!isOwner && !(currentUser?.permissions || []).includes('broadcast')) {
    return <EmptyState icon={Icon.Lock} title="الإرسال الجماعي للمالك فقط" subtitle="تحتاج صلاحية «الإرسال الجماعي»." />;
  }

  const recipients = users.filter((u) => u.active !== false && audienceMatches(f.audience, u.role) && u.role !== 'owner');

  const send = () => {
    if (!f.title.trim()) { toast.push('أدخل عنوان الرسالة', 'error'); return; }
    if (!f.text.trim()) { toast.push('أدخل نص الرسالة', 'error'); return; }
    announcements.add({ title: f.title, text: f.text, audience: f.audience, kind: 'broadcast', by: currentUser?.name || 'الإدارة' });
    toast.push(`أُرسلت إلى ${recipients.length} مستخدماً (${audienceLabel(f.audience)})`);
    setF({ title: '', text: '', audience: f.audience, pin: true });
  };

  const list = (announcements?.items || []).filter((a) => a.kind === 'broadcast' || a.audience);

  return (
    <div className="space-y-5">
      <SectionHeader icon={Icon.Megaphone} title="الإرسال الجماعي"
        subtitle="أرسل إعلاناً أو رسالة لكل المعلمين أو الطلاب أو الجميع" />

      <div className="grid lg:grid-cols-3 gap-4">
        <Card className="p-5 lg:col-span-2">
          <div className="space-y-4">
            <Field label="العنوان" required><input className="input" value={f.title} onChange={(e) => set('title', e.target.value)} placeholder="مثال: تحديث المنصة متاح الآن" /></Field>
            <Field label="نص الرسالة" required><textarea className="input min-h-[130px]" value={f.text} onChange={(e) => set('text', e.target.value)} placeholder="اكتب نص الرسالة الموجّهة..." /></Field>
            <Field label="الجمهور المستهدف">
              <select className="input" value={f.audience} onChange={(e) => set('audience', e.target.value)}>
                {AUDIENCES.map((a) => <option key={a.value} value={a.value}>{a.label}</option>)}
              </select>
            </Field>
            <div className="flex items-center gap-3 flex-wrap">
              <button className="btn-primary" onClick={send}><Icon.Send size={18} /> إرسال الآن</button>
              <span className="chip bg-brand-50 text-brand-700"><Icon.Users size={14} /> {recipients.length} مستلماً</span>
            </div>
          </div>
        </Card>

        <Card className="p-5">
          <div className="section-title mb-3"><Icon.Users size={18} /> المستلمون</div>
          <div className="space-y-1.5 max-h-80 overflow-y-auto">
            {recipients.length === 0 ? <p className="text-sm text-slate-400 font-bold">لا مستلمين في هذه الفئة.</p> :
              recipients.map((u) => (
                <div key={u.id} className="flex items-center gap-2 text-sm rounded-xl bg-slate-50 px-3 py-2">
                  <span className="grid place-items-center w-7 h-7 rounded-full bg-brand-600 text-white text-xs font-extrabold shrink-0">{(u.name || 'م').slice(0, 1)}</span>
                  <span className="font-bold text-slate-700 truncate">{u.name || u.username}</span>
                  <span className="mr-auto chip bg-white text-slate-500 !text-[10px]">{u.roleLabel}</span>
                </div>
              ))}
          </div>
        </Card>
      </div>

      <Card className="p-5">
        <div className="section-title mb-3"><Icon.Megaphone size={18} /> الرسائل المُرسلة</div>
        {list.length === 0 ? <p className="text-sm text-slate-400 font-bold">لم تُرسل رسائل بعد.</p> : (
          <div className="space-y-2">
            {list.map((a) => (
              <div key={a.id} className="rounded-2xl bg-slate-50 p-3">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-extrabold text-slate-800">{a.title}</span>
                  <span className="chip bg-sand-50 text-sand-700">{audienceLabel(a.audience || 'all')}</span>
                  <span className="mr-auto text-[11px] text-slate-400 font-bold">{a.createdAt ? formatDate(a.createdAt.slice(0, 10)) : ''}</span>
                </div>
                <p className="text-sm text-slate-600 font-bold mt-1 leading-relaxed whitespace-pre-wrap">{a.text}</p>
                {a.by && <div className="text-[11px] text-slate-400 font-bold mt-1">من: {a.by}</div>}
              </div>
            ))}
          </div>
        )}
      </Card>
      {toast.view}
    </div>
  );
}
