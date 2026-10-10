import { useRef, useState } from 'react';
import Icon from '../components/Icon.jsx';
import { Card, SectionHeader, Field, EmptyState, useToast, Confirm, Tabs } from '../components/UI.jsx';
import { useApp } from '../state/store.jsx';
import { download, todayISO, formatDate } from '../lib/utils.js';

const TEMPLATES = [
  { id: 'certificate', name: 'شهادة تفوق', icon: Icon.Award },
  { id: 'praise', name: 'بطاقة تشجيع', icon: Icon.Heart },
  { id: 'poster', name: 'ملصق/إعلان', icon: Icon.Megaphone },
  { id: 'worksheet', name: 'ترويسة ورقة عمل', icon: Icon.File }
];

const COLORS = ['#0f766e', '#d97706', '#0b1f3a', '#7c3aed', '#be123c', '#0369a1', '#15803d'];
const FONTS = ['Cairo', 'Tajawal', 'system-ui'];

const EMPTY = {
  name: 'certificate', title: 'شهادة تفوق وتقدير', subtitle: 'تُمنح هذه الشهادة تقديراً للتفوق والاجتهاد',
  studentName: 'اسم الطالب', school: '', date: todayISO(), note: 'معلم المادة',
  primary: '#0f766e', accent: '#d97706', font: 'Cairo', scale: 1, border: 'double'
};

export default function DesignStudio() {
  const { profile, designs } = useApp();
  const toast = useToast();
  const [tab, setTab] = useState('new');
  const [cfg, setCfg] = useState({ ...EMPTY, school: profile.school || '' });
  const [confirmId, setConfirmId] = useState(null);
  const printRef = useRef(null);

  const set = (k, v) => setCfg((c) => ({ ...c, [k]: v }));

  const renderDesign = (c) => {
    const scale = c.scale || 1;
    const base = { fontFamily: `'${c.font}', Cairo, system-ui`, direction: 'rtl' };
    const borderStyle = c.border === 'double' ? 'double 6px' : c.border === 'solid' ? 'solid 3px' : 'none';

    if (c.name === 'praise') {
      return (
        <div style={{ ...base, background: `linear-gradient(135deg, ${c.primary}, ${c.accent})` }} className="rounded-3xl p-8 text-white text-center">
          <div style={{ fontSize: 40 * scale }}>🌟</div>
          <div style={{ fontSize: 26 * scale, fontWeight: 900 }} className="mt-2">{c.title}</div>
          <div style={{ fontSize: 18 * scale, fontWeight: 800, marginTop: 12 }}>{c.studentName}</div>
          <p style={{ fontSize: 14 * scale, opacity: 0.95, marginTop: 8 }}>{c.subtitle}</p>
          <div style={{ fontSize: 12 * scale, opacity: 0.9, marginTop: 16 }}>{c.school}</div>
        </div>
      );
    }

    if (c.name === 'poster') {
      return (
        <div style={{ ...base, borderTop: `14px solid ${c.primary}`, borderBottom: `14px solid ${c.accent}` }} className="bg-white rounded-2xl p-10 text-center">
          <div style={{ fontSize: 30 * scale, fontWeight: 900, color: c.primary }}>{c.title}</div>
          <p style={{ fontSize: 17 * scale, color: '#334155', marginTop: 16, lineHeight: 1.9 }}>{c.subtitle}</p>
          <div style={{ fontSize: 14 * scale, fontWeight: 800, color: c.accent, marginTop: 20 }}>{c.note}</div>
          <div style={{ fontSize: 12 * scale, color: '#94a3b8', marginTop: 8 }}>{c.school}</div>
        </div>
      );
    }

    if (c.name === 'worksheet') {
      return (
        <div style={{ ...base }} className="bg-white p-6">
          <div className="flex items-center justify-between" style={{ borderBottom: `3px solid ${c.primary}`, paddingBottom: 12 }}>
            <div>
              <div style={{ fontSize: 20 * scale, fontWeight: 900, color: c.primary }}>{c.school || 'اسم المدرسة'}</div>
              <div style={{ fontSize: 13 * scale, color: '#64748b', fontWeight: 700 }}>{c.title}</div>
            </div>
            <div style={{ fontSize: 13 * scale, color: '#64748b', fontWeight: 700, textAlign: 'left' }}>
              <div>الاسم: ..............................</div>
              <div>الصف: ............ التاريخ: {formatDate(c.date)}</div>
            </div>
          </div>
          <div style={{ marginTop: 16, color: '#334155', fontSize: 14 * scale, lineHeight: 2.2 }}>
            <div>١) ................................................................................</div>
            <div>٢) ................................................................................</div>
            <div>٣) ................................................................................</div>
            <div>٤) ................................................................................</div>
          </div>
          <div style={{ marginTop: 18, fontSize: 12 * scale, color: c.accent, fontWeight: 800 }}>{c.note}</div>
        </div>
      );
    }

    // certificate (default)
    return (
      <div style={{ ...base, border: borderStyle, borderColor: c.primary }} className="bg-white rounded-2xl p-10 text-center">
        <div style={{ fontSize: 34 * scale, fontWeight: 900, color: c.primary }}>🏅 {c.title}</div>
        <div style={{ width: 90, height: 4, background: c.accent, margin: '14px auto', borderRadius: 4 }} />
        <p style={{ fontSize: 16 * scale, color: '#334155', lineHeight: 2 }}>{c.subtitle}</p>
        <div style={{ fontSize: 28 * scale, fontWeight: 900, color: c.accent, marginTop: 18 }}>{c.studentName}</div>
        <p style={{ fontSize: 14 * scale, color: '#64748b', marginTop: 16 }}>{c.school}</p>
        <div className="flex items-end justify-between" style={{ marginTop: 34 }}>
          <div style={{ fontSize: 13 * scale, color: '#475569', fontWeight: 800 }}>
            <div style={{ borderTop: '1px solid #cbd5e1', paddingTop: 6, minWidth: 140 }}>{c.note}</div>
          </div>
          <div style={{ fontSize: 13 * scale, color: '#475569', fontWeight: 800 }}>
            <div style={{ borderTop: '1px solid #cbd5e1', paddingTop: 6, minWidth: 140 }}>{formatDate(c.date)}</div>
          </div>
        </div>
      </div>
    );
  };

  const print = () => window.print();

  const downloadHtml = () => {
    const el = printRef.current;
    const html = `<!doctype html><html lang="ar" dir="rtl"><head><meta charset="utf-8">
<style>body{margin:0;padding:24px;background:#f1f5f9;display:flex;justify-content:center;
font-family:'Cairo','Tajawal',system-ui,sans-serif}
.sheet{background:#fff;max-width:800px;width:100%;border-radius:16px;overflow:hidden}</style></head>
<body><div class="sheet">${el.innerHTML}</div></body></html>`;
    download(`تصميم_${cfg.name}_${Date.now()}.html`, html, 'text/html;charset=utf-8');
    toast.push('تم تنزيل التصميم كملف HTML');
  };

  const saveDesign = () => {
    designs.add({ title: cfg.title, template: cfg.name, config: cfg });
    toast.push('تم حفظ التصميم في الاستوديو');
  };

  const saved = designs.items;

  return (
    <div className="space-y-5">
      <SectionHeader
        icon={Icon.Palette}
        title="استوديو التصميم"
        subtitle="صمّم شهادات وبطاقات تشجيع وملصقات وترويسات أوراق العمل بضغطة واحدة"
      />

      <Tabs
        tabs={[{ id: 'new', name: 'تصميم جديد' }, { id: 'saved', name: `المحفوظة (${saved.length})` }]}
        active={tab}
        onChange={setTab}
      />

      {tab === 'new' && (
        <div className="grid lg:grid-cols-[340px_1fr] gap-4 items-start">
          <Card className="p-5 space-y-4">
            <Field label="نوع التصميم">
              <div className="grid grid-cols-2 gap-2">
                {TEMPLATES.map((t) => {
                  const I = t.icon;
                  return (
                    <button
                      key={t.id}
                      onClick={() => set('name', t.id)}
                      className={`rounded-xl border px-3 py-3 text-xs font-bold flex flex-col items-center gap-1.5 transition ${
                        cfg.name === t.id ? 'bg-brand-600 text-white border-brand-600' : 'bg-white text-slate-600 border-slate-200 hover:border-brand-400'
                      }`}
                    >
                      <I size={20} /> {t.name}
                    </button>
                  );
                })}
              </div>
            </Field>

            <Field label="العنوان"><input className="input" value={cfg.title} onChange={(e) => set('title', e.target.value)} /></Field>
            <Field label="النص الفرعي"><textarea className="input min-h-[70px]" value={cfg.subtitle} onChange={(e) => set('subtitle', e.target.value)} /></Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="الاسم"><input className="input" value={cfg.studentName} onChange={(e) => set('studentName', e.target.value)} /></Field>
              <Field label="المدرسة"><input className="input" value={cfg.school} onChange={(e) => set('school', e.target.value)} /></Field>
              <Field label="التاريخ"><input type="date" className="input" value={cfg.date} onChange={(e) => set('date', e.target.value)} /></Field>
              <Field label="التوقيع/الختم"><input className="input" value={cfg.note} onChange={(e) => set('note', e.target.value)} /></Field>
            </div>

            <Field label="اللون الأساسي">
              <div className="flex flex-wrap gap-2">
                {COLORS.map((c) => (
                  <button key={c} onClick={() => set('primary', c)} style={{ background: c }}
                    className={`w-8 h-8 rounded-full border-2 ${cfg.primary === c ? 'border-slate-800' : 'border-white shadow'}`} aria-label={c} />
                ))}
              </div>
            </Field>
            <Field label="اللون المميّز">
              <div className="flex flex-wrap gap-2">
                {COLORS.map((c) => (
                  <button key={c} onClick={() => set('accent', c)} style={{ background: c }}
                    className={`w-8 h-8 rounded-full border-2 ${cfg.accent === c ? 'border-slate-800' : 'border-white shadow'}`} aria-label={c} />
                ))}
              </div>
            </Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="الخط">
                <select className="input" value={cfg.font} onChange={(e) => set('font', e.target.value)}>
                  {FONTS.map((f) => <option key={f} value={f}>{f}</option>)}
                </select>
              </Field>
              <Field label={`حجم الخط (${Math.round(cfg.scale * 100)}%)`}>
                <input type="range" min="0.8" max="1.4" step="0.05" value={cfg.scale} onChange={(e) => set('scale', Number(e.target.value))} className="w-full" />
              </Field>
            </div>
            <Field label="الإطار">
              <select className="input" value={cfg.border} onChange={(e) => set('border', e.target.value)}>
                <option value="double">مزدوج</option>
                <option value="solid">بسيط</option>
                <option value="none">بدون</option>
              </select>
            </Field>

            <div className="flex flex-wrap gap-2 pt-1">
              <button className="btn-primary grow" onClick={saveDesign}><Icon.Check size={18} /> حفظ التصميم</button>
              <button className="btn-outline" onClick={print}><Icon.Print size={18} /> طباعة</button>
              <button className="btn-outline" onClick={downloadHtml}><Icon.Download size={18} /> HTML</button>
            </div>
          </Card>

          <Card className="p-4 sm:p-6">
            <div className="text-xs font-bold text-slate-400 mb-3 no-print">معاينة مباشرة</div>
            <div className="print-area bg-slate-100 rounded-2xl p-4 sm:p-8 flex justify-center">
              <div ref={printRef} className="w-full max-w-[720px] shadow-card rounded-2xl overflow-hidden">
                {renderDesign(cfg)}
              </div>
            </div>
          </Card>
        </div>
      )}

      {tab === 'saved' && (
        saved.length === 0 ? (
          <Card><EmptyState icon={Icon.Palette} title="لا توجد تصاميم محفوظة" subtitle="صمّم شهادة أو بطاقة ثم اضغط «حفظ التصميم» لتظهر هنا." /></Card>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {saved.map((d) => (
              <Card key={d.id} className="p-4 flex flex-col gap-3">
                <div className="font-extrabold text-slate-800">{d.title}</div>
                <div className="text-xs text-slate-400 font-bold">
                  {TEMPLATES.find((t) => t.id === d.template)?.name || d.template}
                </div>
                <div className="flex gap-2 mt-auto">
                  <button className="btn-outline !py-2 grow" onClick={() => { setCfg(d.config); setTab('new'); toast.push('تم تحميل التصميم للتعديل'); }}>
                    <Icon.Edit size={16} /> تحرير
                  </button>
                  <button className="btn-danger !py-2" onClick={() => setConfirmId(d.id)} aria-label="حذف"><Icon.Trash size={16} /></button>
                </div>
              </Card>
            ))}
          </div>
        )
      )}

      <Confirm
        open={!!confirmId}
        onClose={() => setConfirmId(null)}
        onConfirm={() => { designs.remove(confirmId); toast.push('تم حذف التصميم'); }}
        title="حذف التصميم"
        message="سيتم حذف هذا التصميم نهائياً. متابعة؟"
      />
      {toast.view}
    </div>
  );
}
