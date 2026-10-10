import { useMemo, useState } from 'react';
import Icon from '../components/Icon.jsx';
import { Card, SectionHeader, Field, EmptyState, Modal, useToast } from '../components/UI.jsx';
import { useApp } from '../state/store.jsx';
import { download } from '../lib/utils.js';

const DAYS = ['الأحد', 'الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس'];
const PERIODS = [1, 2, 3, 4, 5, 6, 7];

export default function Timetable() {
  const { timetable, classes, profile } = useApp();
  const toast = useToast();
  const [editing, setEditing] = useState(null); // { day, period }
  const [form, setForm] = useState({ subject: '', className: '', room: '' });

  const entries = timetable.items;

  const grid = useMemo(() => {
    const map = {};
    entries.forEach((e) => { map[`${e.day}-${e.period}`] = e; });
    return map;
  }, [entries]);

  const openCell = (day, period) => {
    const e = grid[`${day}-${period}`];
    setForm(e ? { subject: e.subject, className: e.className, room: e.room || '' } : { subject: '', className: '', room: '' });
    setEditing({ day, period, id: e?.id });
  };

  const save = () => {
    if (!form.subject.trim()) { toast.push('أدخل اسم المادة', 'error'); return; }
    if (editing.id) timetable.update(editing.id, form);
    else timetable.add({ day: editing.day, period: editing.period, ...form });
    toast.push('تم حفظ الحصة');
    setEditing(null);
  };

  const clearCell = () => {
    if (editing.id) timetable.remove(editing.id);
    setEditing(null);
    toast.push('تم حذف الحصة');
  };

  const exportTable = () => {
    const rows = [['الحصة', ...DAYS]];
    PERIODS.forEach((p) => {
      const row = [String(p)];
      DAYS.forEach((d) => {
        const e = grid[`${d}-${p}`];
        row.push(e ? `${e.subject}${e.className ? ` (${e.className})` : ''}` : '');
      });
      rows.push(row);
    });
    const csv = rows.map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(',')).join('\n');
    download(`الجدول_الدراسي_${profile.name || ''}.csv`, csv, 'text/csv;charset=utf-8');
    toast.push('تم تصدير الجدول');
  };

  return (
    <div className="space-y-5">
      <SectionHeader
        icon={Icon.Calendar}
        title="الجدول الدراسي"
        subtitle="نظّم حصصك الأسبوعية — اضغط أي خانة لإضافتها أو تعديلها"
        actions={
          <>
            <button className="btn-outline" onClick={exportTable}><Icon.Download size={18} /> تصدير</button>
            <button className="btn-outline" onClick={() => window.print()}><Icon.Print size={18} /> طباعة</button>
          </>
        }
      />

      <Card className="p-4">
        <div className="table-wrap print-area">
          <table className="tbl" style={{ minWidth: 720 }}>
            <thead>
              <tr>
                <th className="w-20">الحصة</th>
                {DAYS.map((d) => <th key={d}>{d}</th>)}
              </tr>
            </thead>
            <tbody>
              {PERIODS.map((p) => (
                <tr key={p}>
                  <td className="text-center font-extrabold text-brand-700 bg-brand-50/50">{p}</td>
                  {DAYS.map((d) => {
                    const e = grid[`${d}-${p}`];
                    return (
                      <td key={d} className="align-top">
                        <button
                          onClick={() => openCell(d, p)}
                          className={`w-full text-right rounded-xl px-2.5 py-2 min-h-[52px] transition ${
                            e ? 'bg-brand-50 border border-brand-200 hover:border-brand-400' : 'border border-dashed border-slate-200 hover:border-brand-300 text-slate-300'
                          }`}
                        >
                          {e ? (
                            <>
                              <div className="font-extrabold text-slate-800 text-sm">{e.subject}</div>
                              {e.className && <div className="text-[11px] text-slate-500 font-bold">{e.className}{e.room ? ` • ${e.room}` : ''}</div>}
                            </>
                          ) : (
                            <span className="text-xs font-bold">+ إضافة</span>
                          )}
                        </button>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {entries.length === 0 && (
        <Card><EmptyState icon={Icon.Calendar} title="الجدول فارغ" subtitle="اضغط أي خانة في الجدول أعلاه لإضافة حصة (المادة، الصف، القاعة)." /></Card>
      )}

      <Modal
        open={!!editing}
        onClose={() => setEditing(null)}
        title={editing ? `الحصة ${editing.period} — ${editing.day}` : ''}
        footer={<>
          {editing?.id && <button className="btn-danger mr-auto" onClick={clearCell}><Icon.Trash size={18} /> حذف الحصة</button>}
          <button className="btn-ghost" onClick={() => setEditing(null)}>إلغاء</button>
          <button className="btn-primary" onClick={save}><Icon.Check size={18} /> حفظ</button>
        </>}
      >
        <div className="grid sm:grid-cols-2 gap-4">
          <Field label="المادة" required>
            <input className="input" value={form.subject} onChange={(e) => setForm((f) => ({ ...f, subject: e.target.value }))} placeholder="مثال: الرياضيات" />
          </Field>
          <Field label="الصف">
            {classes.length ? (
              <select className="input" value={form.className} onChange={(e) => setForm((f) => ({ ...f, className: e.target.value }))}>
                <option value="">— اختر —</option>
                {classes.map((c) => <option key={c.id} value={c.name}>{c.name}</option>)}
              </select>
            ) : (
              <input className="input" value={form.className} onChange={(e) => setForm((f) => ({ ...f, className: e.target.value }))} placeholder="مثال: الأول ثانوي" />
            )}
          </Field>
          <Field label="القاعة (اختياري)">
            <input className="input" value={form.room} onChange={(e) => setForm((f) => ({ ...f, room: e.target.value }))} placeholder="مثال: قاعة 3" />
          </Field>
        </div>
      </Modal>
      {toast.view}
    </div>
  );
}
