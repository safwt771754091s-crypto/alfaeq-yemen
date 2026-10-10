import { useMemo, useState } from 'react';
import Icon from '../components/Icon.jsx';
import { Card, SectionHeader, Field, EmptyState, useToast, ProgressBar, Tabs } from '../components/UI.jsx';
import { useApp } from '../state/store.jsx';
import { gradeName, PASS_MARK } from '../data/curriculum.js';
import { todayISO, formatDate, pct, download, slugify } from '../lib/utils.js';

const STATUS = {
  present: { id: 'present', label: 'حاضر', short: 'ح', tone: 'bg-emerald-500', soft: 'bg-emerald-50 text-emerald-700' },
  absent: { id: 'absent', label: 'غائب', short: 'غ', tone: 'bg-rose-500', soft: 'bg-rose-50 text-rose-600' },
  late: { id: 'late', label: 'متأخر', short: 'م', tone: 'bg-amber-500', soft: 'bg-amber-50 text-amber-700' },
  excused: { id: 'excused', label: 'بعذر', short: 'ع', tone: 'bg-sky-500', soft: 'bg-sky-50 text-sky-700' }
};

export default function Attendance({ go }) {
  const { classes, students, attendance, setAttendanceStatus, markAllAttendance } = useApp();
  const toast = useToast();
  const [classId, setClassId] = useState('');
  const [date, setDate] = useState(todayISO());
  const [view, setView] = useState('daily');

  const cls = classes.find((c) => c.id === classId);
  const clsStudents = useMemo(() => students.filter((s) => s.classId === classId), [students, classId]);
  const day = (attendance[classId] || {})[date] || {};

  const stats = useMemo(() => {
    const counts = { present: 0, absent: 0, late: 0, excused: 0, unset: 0 };
    clsStudents.forEach((s) => {
      const st = day[s.id];
      if (st && counts[st] != null) counts[st]++;
      else counts.unset++;
    });
    return counts;
  }, [clsStudents, day]);

  // تقرير تراكمي
  const report = useMemo(() => {
    if (!cls) return [];
    const dates = Object.keys(attendance[classId] || {}).sort();
    return clsStudents.map((s) => {
      let present = 0, absent = 0, late = 0, excused = 0;
      dates.forEach((d) => {
        const st = attendance[classId][d]?.[s.id];
        if (st === 'present') present++;
        else if (st === 'absent') absent++;
        else if (st === 'late') late++;
        else if (st === 'excused') excused++;
      });
      const total = present + absent + late + excused;
      const rate = pct(present + late + excused, total);
      return { student: s, present, absent, late, excused, total, rate };
    });
  }, [cls, clsStudents, attendance, classId]);

  const classRate = report.length ? Math.round((report.reduce((a, r) => a + r.rate, 0) / report.length) * 10) / 10 : 0;

  const setAll = (status) => {
    if (!classId) return;
    markAllAttendance(classId, date, clsStudents.map((s) => s.id), status);
    toast.push(`تم تسجيل الكل: ${STATUS[status].label}`);
  };

  const exportCsv = () => {
    const dates = Object.keys(attendance[classId] || {}).sort();
    const head = ['الطالب', ...dates.map((d) => formatDate(d)), 'حاضر', 'غائب', 'متأخر', 'بعذر', 'النسبة'];
    const lines = [head.join(',')];
    report.forEach((r) => {
      lines.push([
        r.student.name,
        ...dates.map((d) => STATUS[attendance[classId][d]?.[r.student.id]]?.short || '-'),
        r.present, r.absent, r.late, r.excused, `${r.rate}%`
      ].map((x) => `"${x}"`).join(','));
    });
    download(`حضور_${slugify(cls.name)}.csv`, lines.join('\n'), 'text/csv;charset=utf-8');
    toast.push('تم تصدير التقرير');
  };

  return (
    <div className="space-y-5">
      <SectionHeader
        icon={Icon.Calendar}
        title="سجل الحضور والغياب"
        subtitle="تسجيل يومي سريع مع إحصائيات وتقارير جاهزة للتصدير والطباعة"
        actions={
          <Tabs
            tabs={[{ id: 'daily', name: 'التسجيل اليومي' }, { id: 'report', name: 'التقرير التراكمي' }]}
            active={view}
            onChange={setView}
          />
        }
      />

      {classes.length === 0 ? (
        <Card className="p-6">
          <EmptyState icon={Icon.Users} title="لا توجد صفوف بعد" subtitle="أضف صفاً وطلاباً للبدء."
            action={<button className="btn-primary" onClick={() => go('classes')}><Icon.Plus size={18} /> إضافة صف</button>} />
        </Card>
      ) : (
        <>
          <Card className="p-4">
            <div className="grid sm:grid-cols-3 gap-4">
              <Field label="الصف/الشعبة">
                <select className="input" value={classId} onChange={(e) => setClassId(e.target.value)}>
                  <option value="">— اختر —</option>
                  {classes.map((c) => <option key={c.id} value={c.id}>{c.name} ({gradeName(c.grade)})</option>)}
                </select>
              </Field>
              <Field label="التاريخ">
                <input type="date" className="input" value={date} onChange={(e) => setDate(e.target.value)} />
              </Field>
              {cls && (
                <div className="flex items-end gap-2">
                  <button className="btn-primary grow" onClick={() => setAll('present')}><Icon.Check size={18} /> تسجيل الكل حاضر</button>
                </div>
              )}
            </div>
          </Card>

          {!classId ? (
            <Card className="p-6"><EmptyState icon={Icon.Calendar} title="اختر صفاً للبدء" /></Card>
          ) : clsStudents.length === 0 ? (
            <Card className="p-6"><EmptyState icon={Icon.Users} title="لا يوجد طلاب" action={<button className="btn-primary" onClick={() => go('classes')}>إدارة الطلاب</button>} /></Card>
          ) : view === 'daily' ? (
            <>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                {Object.values(STATUS).map((s) => (
                  <div key={s.id} className="stat-card">
                    <span className={`grid place-items-center w-11 h-11 rounded-2xl text-white ${s.tone}`}>{s.short}</span>
                    <div><div className="text-xl font-extrabold text-slate-800">{stats[s.id]}</div><div className="text-xs font-bold text-slate-500">{s.label}</div></div>
                  </div>
                ))}
                <div className="stat-card">
                  <span className="grid place-items-center w-11 h-11 rounded-2xl bg-slate-200 text-slate-500">—</span>
                  <div><div className="text-xl font-extrabold text-slate-800">{stats.unset}</div><div className="text-xs font-bold text-slate-500">لم يُسجَّل</div></div>
                </div>
              </div>

              <Card className="p-4">
                <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
                  <div className="section-title"><Icon.Users size={18} /> {formatDate(date)} — {clsStudents.length} طالب</div>
                  <div className="flex gap-2 flex-wrap">
                    {Object.values(STATUS).map((s) => (
                      <button key={s.id} className={`chip ${s.soft}`} onClick={() => setAll(s.id)}>الكل {s.label}</button>
                    ))}
                  </div>
                </div>
                <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-2.5">
                  {clsStudents.map((s, i) => {
                    const cur = day[s.id];
                    return (
                      <div key={s.id} className="rounded-2xl border border-slate-200 p-3 flex items-center gap-3">
                        <span className="grid place-items-center w-8 h-8 rounded-lg bg-slate-100 text-slate-500 text-xs font-extrabold">{i + 1}</span>
                        <span className="font-bold text-slate-700 text-sm grow truncate">{s.name}</span>
                        <div className="flex gap-1">
                          {Object.values(STATUS).map((st) => (
                            <button
                              key={st.id}
                              title={st.label}
                              onClick={() => setAttendanceStatus(classId, date, s.id, cur === st.id ? null : st.id)}
                              className={`w-8 h-8 rounded-lg text-xs font-extrabold transition ${cur === st.id ? `${st.tone} text-white shadow-soft` : 'bg-slate-100 text-slate-500 hover:bg-slate-200'}`}
                            >
                              {st.short}
                            </button>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </Card>
            </>
          ) : (
            <Card className="p-4 print-area">
              <div className="flex items-center justify-between gap-3 mb-3 flex-wrap">
                <div className="section-title"><Icon.Chart size={18} /> تقرير الحضور التراكمي</div>
                <div className="flex gap-2">
                  <span className="chip bg-brand-50 text-brand-700">متوسط الحضور: {classRate}%</span>
                  <button className="btn-outline !px-3 !py-1.5 !text-xs no-print" onClick={exportCsv}><Icon.Download size={15} /> CSV</button>
                  <button className="btn-ghost !px-3 !py-1.5 !text-xs no-print" onClick={() => window.print()}><Icon.Print size={15} /> طباعة</button>
                </div>
              </div>
              <div className="table-wrap">
                <table className="tbl">
                  <thead>
                    <tr><th>#</th><th>الطالب</th><th>حاضر</th><th>غائب</th><th>متأخر</th><th>بعذر</th><th>نسبة الحضور</th></tr>
                  </thead>
                  <tbody>
                    {report.map((r, i) => (
                      <tr key={r.student.id}>
                        <td>{i + 1}</td>
                        <td className="font-bold">{r.student.name}</td>
                        <td className="text-emerald-600 font-bold">{r.present}</td>
                        <td className="text-rose-600 font-bold">{r.absent}</td>
                        <td className="text-amber-600 font-bold">{r.late}</td>
                        <td className="text-sky-600 font-bold">{r.excused}</td>
                        <td className="w-40"><ProgressBar value={r.rate} tone={r.rate >= 80 ? 'emerald' : r.rate >= 60 ? 'amber' : 'rose'} /></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          )}
        </>
      )}
      {toast.view}
    </div>
  );
}
