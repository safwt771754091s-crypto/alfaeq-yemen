import { useMemo, useState } from 'react';
import Icon from '../components/Icon.jsx';
import { Card, SectionHeader, Field, EmptyState, Modal, useToast, Confirm, Tabs } from '../components/UI.jsx';
import { useApp } from '../state/store.jsx';
import { GRADES, gradeName } from '../data/curriculum.js';
import { todayISO, formatDate, arabicNumber } from '../lib/utils.js';

const THEMES = {
  gold: {
    name: 'ذهبي (تفوق)',
    frame: 'border-[10px] border-sand-400',
    inner: 'border-4 border-sand-300',
    bg: 'bg-gradient-to-br from-sand-50 via-white to-sand-100',
    title: 'text-sand-700',
    accent: 'bg-sand-500'
  },
  green: {
    name: 'أخضر (تقدير)',
    frame: 'border-[10px] border-brand-500',
    inner: 'border-4 border-brand-300',
    bg: 'bg-gradient-to-br from-brand-50 via-white to-brand-100',
    title: 'text-brand-700',
    accent: 'bg-brand-600'
  },
  navy: {
    name: 'أزرق ملكي',
    frame: 'border-[10px] border-slate-700',
    inner: 'border-4 border-slate-400',
    bg: 'bg-gradient-to-br from-slate-50 via-white to-slate-100',
    title: 'text-slate-800',
    accent: 'bg-slate-700'
  },
  rose: {
    name: 'وردي (شكر)',
    frame: 'border-[10px] border-rose-400',
    inner: 'border-4 border-rose-200',
    bg: 'bg-gradient-to-br from-rose-50 via-white to-rose-100',
    title: 'text-rose-700',
    accent: 'bg-rose-500'
  }
};

const TYPES = [
  { id: 'excellence', name: 'شهادة تفوق', body: 'تشهد إدارة المدرسة بأن الطالب/الطالبة قد حصل على شهادة التفوق لحصوله على المرتبة' },
  { id: 'appreciation', name: 'شهادة تقدير', body: 'تشهد إدارة المدرسة بأن الطالب/الطالبة قد أظهر تميزاً واجتهاداً يستحق التقدير والشكر' },
  { id: 'attendance', name: 'شهادة انتظام', body: 'تشهد إدارة المدرسة بأن الطالب/الطالبة قد حافظ على الحضور والانتظام طوال العام الدراسي' },
  { id: 'participation', name: 'شهادة مشاركة', body: 'تشهد إدارة المدرسة بأن الطالب/الطالبة قد شارك بفاعلية في الأنشطة المدرسية' }
];

function CertificateView({ cert, profile, forPrint }) {
  const theme = THEMES[cert.theme] || THEMES.gold;
  const type = TYPES.find((t) => t.id === cert.type) || TYPES[0];
  return (
    <div className={`cert-print relative ${theme.bg} ${theme.frame} rounded-2xl p-3 sm:p-5 print-area`}>
      <div className={`${theme.inner} rounded-xl p-5 sm:p-10 relative overflow-hidden`}>
        {/* زخرفة */}
        <div className="absolute top-0 right-0 w-40 h-40 rounded-full opacity-10 -translate-y-1/3 translate-x-1/3" style={{ background: 'currentColor' }} />
        <div className="absolute bottom-0 left-0 w-52 h-52 rounded-full opacity-10 translate-y-1/3 -translate-x-1/3" style={{ background: 'currentColor' }} />

        <div className="relative text-center">
          <div className="text-xs font-bold text-slate-500">الجمهورية اليمنية — وزارة التربية والتعليم</div>
          <div className="text-sm font-extrabold text-slate-700 mt-0.5">{cert.school || 'اسم المدرسة'}</div>

          <div className="my-4 flex items-center justify-center gap-3">
            <span className={`h-1 w-16 rounded-full ${theme.accent}`} />
            <span className={`grid place-items-center w-16 h-16 rounded-full ${theme.accent} text-white shadow-card`}>
              <Icon.Award size={34} />
            </span>
            <span className={`h-1 w-16 rounded-full ${theme.accent}`} />
          </div>

          <h2 className={`text-3xl sm:text-4xl font-extrabold ${theme.title}`}>{type.name}</h2>
          <p className="text-xs font-bold text-slate-400 mt-1">Certificate of {cert.type === 'excellence' ? 'Excellence' : 'Appreciation'}</p>

          <p className="mt-6 text-slate-600 font-bold text-sm sm:text-base">{type.body}</p>

          <div className="my-4">
            <div className={`inline-block px-8 py-2 rounded-xl bg-white/80 border-2 ${theme.frame.replace('border-[10px]', 'border-')} `}>
              <span className="text-2xl sm:text-3xl font-extrabold text-slate-800">{cert.studentName}</span>
            </div>
          </div>

          {cert.type === 'excellence' && cert.rank && (
            <p className="text-lg font-extrabold text-slate-700">
              المرتبة {arabicNumber(cert.rank)} {cert.percent ? `— بمعدل ${cert.percent}%` : ''}
            </p>
          )}

          <p className="mt-3 text-sm font-bold text-slate-600">
            {gradeName(cert.grade)} — للعام الدراسي {cert.year || new Date().getFullYear()}
          </p>

          {cert.note && <p className="mt-3 text-sm text-slate-500 italic max-w-lg mx-auto">{cert.note}</p>}

          <div className="mt-8 grid grid-cols-2 gap-6 max-w-lg mx-auto text-sm">
            <div className="text-center">
              <div className="h-10 border-b-2 border-dashed border-slate-300" />
              <div className="mt-1 font-bold text-slate-600">المعلم/المعلمة</div>
              <div className="text-xs text-slate-400">{profile?.name || ''}</div>
            </div>
            <div className="text-center">
              <div className="h-10 border-b-2 border-dashed border-slate-300" />
              <div className="mt-1 font-bold text-slate-600">مدير المدرسة</div>
              <div className="text-xs text-slate-400">{cert.director || ''}</div>
            </div>
          </div>

          <div className="mt-5 text-[11px] text-slate-400 font-bold">
            تاريخ الإصدار: {formatDate(cert.issueDate || todayISO())}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function Certificates({ go }) {
  const { classes, students, certificates, addCertificate, deleteCertificate, profile } = useApp();
  const toast = useToast();
  const [tab, setTab] = useState('create');
  const [classId, setClassId] = useState('');
  const [studentId, setStudentId] = useState('');
  const [type, setType] = useState('excellence');
  const [theme, setTheme] = useState('gold');
  const [rank, setRank] = useState(1);
  const [percent, setPercent] = useState('');
  const [note, setNote] = useState('');
  const [director, setDirector] = useState('');
  const [year, setYear] = useState(String(new Date().getFullYear()));
  const [issueDate, setIssueDate] = useState(todayISO());
  const [preview, setPreview] = useState(null);
  const [confirmDel, setConfirmDel] = useState(null);
  const [bulkOpen, setBulkOpen] = useState(false);
  const [bulkType, setBulkType] = useState('appreciation');

  const clsStudents = useMemo(() => students.filter((s) => s.classId === classId), [students, classId]);
  const cls = classes.find((c) => c.id === classId);
  const student = students.find((s) => s.id === studentId);

  const current = {
    studentName: student?.name || 'اسم الطالب',
    grade: cls?.grade || 7,
    school: profile.school,
    type, theme, rank, percent, note, director, year, issueDate
  };

  const save = () => {
    if (!student) { toast.push('اختر الطالب', 'error'); return; }
    addCertificate({ ...current, studentId, classId });
    toast.push('تم حفظ الشهادة');
    setTab('saved');
  };

  const bulkGenerate = () => {
    if (!classId || !clsStudents.length) { toast.push('اختر صفاً يحتوي طلاباً', 'error'); return; }
    clsStudents.forEach((s) => {
      addCertificate({
        studentName: s.name, studentId: s.id, classId, grade: cls.grade, school: profile.school,
        type: bulkType, theme, rank: '', percent: '', note, director, year, issueDate
      });
    });
    setBulkOpen(false);
    toast.push(`تم توليد ${clsStudents.length} شهادة`);
    setTab('saved');
  };

  return (
    <div className="space-y-5">
      <SectionHeader
        icon={Icon.Award}
        title="مولّد الشهادات"
        subtitle="تصميم شهادات تفوق وتقدير قابلة للتعديل والطباعة بالأسماء تلقائياً"
        actions={
          <Tabs
            tabs={[{ id: 'create', name: 'إنشاء شهادة' }, { id: 'saved', name: `المحفوظة (${certificates.length})` }]}
            active={tab}
            onChange={setTab}
          />
        }
      />

      {tab === 'create' ? (
        <div className="grid lg:grid-cols-[380px_1fr] gap-4">
          <Card className="p-4 sm:p-5 h-fit no-print">
            <div className="space-y-4">
              <Field label="الصف/الشعبة">
                <select className="input" value={classId} onChange={(e) => { setClassId(e.target.value); setStudentId(''); }}>
                  <option value="">— اختر —</option>
                  {classes.map((c) => <option key={c.id} value={c.id}>{c.name} ({gradeName(c.grade)})</option>)}
                </select>
              </Field>
              <Field label="الطالب" required>
                <select className="input" value={studentId} onChange={(e) => setStudentId(e.target.value)} disabled={!classId}>
                  <option value="">— اختر —</option>
                  {clsStudents.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
              </Field>
              <Field label="نوع الشهادة">
                <select className="input" value={type} onChange={(e) => setType(e.target.value)}>
                  {TYPES.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
                </select>
              </Field>
              <Field label="التصميم">
                <div className="grid grid-cols-2 gap-2">
                  {Object.entries(THEMES).map(([id, t]) => (
                    <button key={id} onClick={() => setTheme(id)}
                      className={`rounded-xl border-2 p-2 text-xs font-bold transition ${theme === id ? 'border-brand-500 bg-brand-50' : 'border-slate-200'}`}>
                      <span className={`block h-6 rounded-md mb-1 ${t.accent}`} />
                      {t.name}
                    </button>
                  ))}
                </div>
              </Field>
              {type === 'excellence' && (
                <div className="grid grid-cols-2 gap-3">
                  <Field label="المرتبة">
                    <input type="number" min={1} className="input" value={rank} onChange={(e) => setRank(e.target.value)} />
                  </Field>
                  <Field label="المعدل %">
                    <input type="number" min={0} max={100} className="input" value={percent} onChange={(e) => setPercent(e.target.value)} placeholder="اختياري" />
                  </Field>
                </div>
              )}
              <Field label="اسم مدير المدرسة">
                <input className="input" value={director} onChange={(e) => setDirector(e.target.value)} placeholder="اسم المدير" />
              </Field>
              <Field label="العام الدراسي">
                <input className="input" value={year} onChange={(e) => setYear(e.target.value)} />
              </Field>
              <Field label="ملاحظة إضافية">
                <textarea className="input min-h-[70px]" value={note} onChange={(e) => setNote(e.target.value)} placeholder="نص اختياري يظهر في الشهادة" />
              </Field>
              <div className="flex gap-2 flex-wrap">
                <button className="btn-primary grow" onClick={save}><Icon.CheckCircle size={18} /> حفظ الشهادة</button>
                <button className="btn-outline" onClick={() => window.print()}><Icon.Print size={18} /> طباعة</button>
              </div>
              <button className="btn-sand w-full" onClick={() => setBulkOpen(true)}>
                <Icon.Users size={18} /> توليد شهادات لصف كامل
              </button>
            </div>
          </Card>

          <div>
            <CertificateView cert={current} profile={profile} />
          </div>
        </div>
      ) : (
        <Card className="p-5">
          {certificates.length === 0 ? (
            <EmptyState icon={Icon.Award} title="لا توجد شهادات محفوظة" subtitle="أنشئ شهادة واحفظها لتظهر هنا." />
          ) : (
            <div className="grid md:grid-cols-2 gap-4">
              {certificates.map((c) => (
                <div key={c.id} className="rounded-2xl border border-slate-200 p-3">
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div className="min-w-0">
                      <div className="font-extrabold text-slate-800 truncate">{c.studentName}</div>
                      <div className="text-xs text-slate-500 font-bold">{TYPES.find((t) => t.id === c.type)?.name} • {gradeName(c.grade)}</div>
                    </div>
                    <button className="btn-danger !px-2.5 !py-1.5" onClick={() => setConfirmDel(c)}><Icon.Trash size={16} /></button>
                  </div>
                  <div className="flex gap-2 flex-wrap">
                    <button className="btn-outline !px-3 !py-1.5 !text-xs" onClick={() => setPreview(c)}><Icon.Eye size={15} /> معاينة</button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      )}

      <Modal open={!!preview} onClose={() => setPreview(null)} title="معاينة الشهادة" size="xl"
        footer={<><button className="btn-ghost" onClick={() => setPreview(null)}>إغلاق</button><button className="btn-primary" onClick={() => window.print()}><Icon.Print size={18} /> طباعة</button></>}>
        {preview && <CertificateView cert={preview} profile={profile} forPrint />}
      </Modal>

      <Modal open={bulkOpen} onClose={() => setBulkOpen(false)} title="توليد شهادات لصف كامل" size="sm"
        footer={<><button className="btn-ghost" onClick={() => setBulkOpen(false)}>إلغاء</button><button className="btn-primary" onClick={bulkGenerate}>توليد</button></>}>
        <Field label="نوع الشهادة للجميع">
          <select className="input" value={bulkType} onChange={(e) => setBulkType(e.target.value)}>
            {TYPES.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
          </select>
        </Field>
        <p className="text-sm text-slate-500 mt-3">
          سيتم توليد {clsStudents.length} شهادة للصف «{cls?.name || '—'}» بالتصميم المختار.
        </p>
      </Modal>

      <Confirm
        open={!!confirmDel}
        onClose={() => setConfirmDel(null)}
        onConfirm={() => { deleteCertificate(confirmDel.id); toast.push('تم الحذف'); }}
        title="حذف الشهادة"
        message={`هل تريد حذف شهادة «${confirmDel?.studentName}»؟`}
      />
      {toast.view}
    </div>
  );
}
