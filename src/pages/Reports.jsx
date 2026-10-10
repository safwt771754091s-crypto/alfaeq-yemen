import { useMemo, useState } from 'react';
import Icon from '../components/Icon.jsx';
import { Card, SectionHeader, StatCard, EmptyState, useToast } from '../components/UI.jsx';
import { useApp } from '../state/store.jsx';
import { download, todayISO } from '../lib/utils.js';

export default function Reports() {
  const app = useApp();
  const { profile, classes, students, lessons, notebooks, presentations, quizzes, assessments, attendance, certificates } = app;
  const toast = useToast();
  const [scope, setScope] = useState('all');

  const classStudents = useMemo(
    () => (scope === 'all' ? students : students.filter((s) => s.classId === scope)),
    [students, scope]
  );
  const ids = useMemo(() => new Set(classStudents.map((s) => s.id)), [classStudents]);

  const classAssessments = useMemo(
    () => assessments.filter((a) => scope === 'all' || a.classId === scope),
    [assessments, scope]
  );

  // حساب متوسط كل طالب من الرصد
  const rows = useMemo(() => {
    return classStudents.map((s) => {
      const scores = classAssessments
        .map((a) => a.scores?.[s.id])
        .filter((v) => v != null);
      const avg = scores.length ? Math.round((scores.reduce((x, y) => x + y, 0) / scores.length) * 10) / 10 : null;
      return { ...s, count: scores.length, avg };
    }).sort((a, b) => (b.avg ?? -1) - (a.avg ?? -1));
  }, [classStudents, classAssessments]);

  // نسبة الحضور
  const attendanceRate = useMemo(() => {
    let present = 0, total = 0;
    Object.values(attendance || {}).forEach((cls) => {
      Object.values(cls || {}).forEach((day) => {
        Object.entries(day || {}).forEach(([sid, st]) => {
          if (scope !== 'all' && !ids.has(sid)) return;
          total += 1;
          if (st === 'present' || st === 'late') present += 1;
        });
      });
    });
    return total ? Math.round((present / total) * 1000) / 10 : 0;
  }, [attendance, ids, scope]);

  const classAvg = useMemo(() => {
    const withAvg = rows.filter((r) => r.avg != null);
    if (!withAvg.length) return 0;
    return Math.round((withAvg.reduce((s, r) => s + r.avg, 0) / withAvg.length) * 10) / 10;
  }, [rows]);

  const passed = rows.filter((r) => r.avg != null && r.avg >= 50).length;
  const passRate = rows.filter((r) => r.avg != null).length
    ? Math.round((passed / rows.filter((r) => r.avg != null).length) * 1000) / 10 : 0;

  const scopeName = scope === 'all' ? 'جميع الصفوف' : (classes.find((c) => c.id === scope)?.name || 'صف');

  const exportReport = () => {
    const lines = [
      `تقرير أداء — ${profile.school || ''}`,
      `المعلم: ${profile.name || ''}`,
      `النطاق: ${scopeName}`,
      `التاريخ: ${todayISO()}`,
      '',
      `عدد الطلاب,${classStudents.length}`,
      `المتوسط العام,${classAvg}`,
      `نسبة النجاح,${passRate}%`,
      `نسبة الحضور,${attendanceRate}%`,
      '',
      'الطالب,عدد الرصد,المتوسط,التقدير'
    ];
    rows.forEach((r) => lines.push([r.name, r.count, r.avg ?? '-', r.avg == null ? '-' : r.avg >= 90 ? 'ممتاز' : r.avg >= 80 ? 'جيد جداً' : r.avg >= 65 ? 'جيد' : r.avg >= 50 ? 'مقبول' : 'ضعيف'].join(',')));
    download(`تقرير_${scopeName}_${todayISO()}.csv`, lines.join('\n'), 'text/csv;charset=utf-8');
    toast.push('تم تصدير التقرير');
  };

  return (
    <div className="space-y-5">
      <SectionHeader
        icon={Icon.Chart}
        title="التقارير"
        subtitle="ملخص شامل لأداء طلابك وحضورهم ومؤشرات إنجازك"
        actions={
          <>
            <button className="btn-outline" onClick={() => window.print()}><Icon.Print size={18} /> طباعة</button>
            <button className="btn-primary" onClick={exportReport}><Icon.Download size={18} /> تصدير CSV</button>
          </>
        }
      />

      <Card className="p-4 no-print">
        <div className="flex flex-wrap gap-2">
          <button onClick={() => setScope('all')} className={`rounded-xl px-4 py-2 text-sm font-bold border ${scope === 'all' ? 'bg-brand-600 text-white border-brand-600' : 'bg-white text-slate-600 border-slate-200'}`}>جميع الصفوف</button>
          {classes.map((c) => (
            <button key={c.id} onClick={() => setScope(c.id)} className={`rounded-xl px-4 py-2 text-sm font-bold border ${scope === c.id ? 'bg-brand-600 text-white border-brand-600' : 'bg-white text-slate-600 border-slate-200'}`}>{c.name}</button>
          ))}
        </div>
      </Card>

      <div className="print-area">
        <Card className="p-5 mb-4">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div>
              <h2 className="text-lg font-extrabold text-slate-800">تقرير أداء — {scopeName}</h2>
              <p className="text-sm text-slate-500">{profile.school || '—'} • المعلم: {profile.name || '—'}</p>
            </div>
            <span className="chip bg-brand-50 text-brand-700">{todayISO()}</span>
          </div>
        </Card>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
          <StatCard icon={Icon.Users} label="عدد الطلاب" value={classStudents.length} tone="brand" />
          <StatCard icon={Icon.TrendUp} label="المتوسط العام" value={classAvg} tone="emerald" sub={`نسبة النجاح ${passRate}%`} />
          <StatCard icon={Icon.Calendar} label="نسبة الحضور" value={`${attendanceRate}%`} tone="sand" />
          <StatCard icon={Icon.Clipboard} label="عمليات الرصد" value={classAssessments.length} tone="violet" />
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
          <StatCard icon={Icon.Sparkles} label="خطط دروس" value={lessons.length} tone="brand" />
          <StatCard icon={Icon.Clipboard} label="كراسات" value={notebooks.length} tone="sand" />
          <StatCard icon={Icon.Slides} label="عروض" value={presentations.length} tone="violet" />
          <StatCard icon={Icon.Award} label="شهادات" value={certificates.length} tone="emerald" />
        </div>

        {rows.length === 0 ? (
          <Card><EmptyState icon={Icon.Chart} title="لا توجد بيانات" subtitle="أضف طلاباً وسجّل تقييمات ليظهر التقرير هنا." /></Card>
        ) : (
          <Card className="p-4">
            <div className="section-title mb-3"><Icon.Chart size={18} /> ترتيب الطلاب حسب المتوسط</div>
            <div className="table-wrap">
              <table className="tbl">
                <thead>
                  <tr><th>#</th><th>الطالب</th><th>الصف</th><th>عدد الرصد</th><th>المتوسط</th><th>التقدير</th></tr>
                </thead>
                <tbody>
                  {rows.map((r, i) => {
                    const cls = classes.find((c) => c.id === r.classId);
                    const label = r.avg == null ? '—' : r.avg >= 90 ? 'ممتاز' : r.avg >= 80 ? 'جيد جداً' : r.avg >= 65 ? 'جيد' : r.avg >= 50 ? 'مقبول' : 'ضعيف';
                    return (
                      <tr key={r.id}>
                        <td className="text-slate-400 font-bold">{i + 1}</td>
                        <td className="font-bold text-slate-800">{r.name}</td>
                        <td className="text-slate-500">{cls ? cls.name : '—'}</td>
                        <td>{r.count}</td>
                        <td className="font-extrabold text-brand-700">{r.avg ?? '—'}</td>
                        <td><span className="chip bg-slate-100 text-slate-600">{label}</span></td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </Card>
        )}
      </div>

      {toast.view}
    </div>
  );
}
