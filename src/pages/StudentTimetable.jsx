import { useMemo, useState } from 'react';
import Icon from '../components/Icon.jsx';
import { Card, SectionHeader, useToast } from '../components/UI.jsx';
import { useApp } from '../state/store.jsx';
import { gradeName, subjectsForGrade } from '../data/curriculum.js';

const DAYS = ['الأحد', 'الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس'];
const PERIODS = ['الحصة الأولى', 'الحصة الثانية', 'الحصة الثالثة', 'الحصة الرابعة', 'الحصة الخامسة', 'الحصة السادسة'];

// جدول الحصص اليومي للطالب + تسجيل ما تعلّمه اليوم + تذكير
export default function StudentTimetable() {
  const { companion, studyLog, reminders } = useApp();
  const toast = useToast();
  const grade = companion.grade || 1;
  const subjects = useMemo(() => subjectsForGrade(grade), [grade]);
  const [day, setDay] = useState(DAYS[0]);
  const [task, setTask] = useState('');

  // جدول افتراضي مبني على مواد الصف
  const schedule = useMemo(() => {
    const rows = {};
    DAYS.forEach((d, di) => {
      rows[d] = PERIODS.map((p, pi) => subjects[(di * 2 + pi) % subjects.length]);
    });
    return rows;
  }, [subjects]);

  const todayLog = studyLog.items.filter((x) => (x.date || x.createdAt || '').slice(0, 10) === new Date().toISOString().slice(0, 10));

  const addTask = () => {
    const t = task.trim();
    if (!t) return;
    studyLog.add({ title: t, lesson: t, date: new Date().toISOString().slice(0, 10) });
    setTask('');
    toast.push('✅ أُضيف إلى «تعلّمت اليوم»');
  };

  const remind = () => {
    reminders.add({ title: `تذكير: مراجعة حصص ${day}`, text: 'راجع دروسك القادمة', when: new Date().toISOString() });
    toast.push('🔔 سيصلك تذكير');
  };

  return (
    <div className="space-y-5">
      <SectionHeader icon={Icon.Calendar} title="جدول الحصص" subtitle={`جدول ${gradeName(grade)} — حصص اليوم والواجبات`} />

      <Card className="p-4">
        <div className="flex flex-wrap gap-2">
          {DAYS.map((d) => (
            <button key={d} onClick={() => setDay(d)} className={`rounded-2xl px-4 py-2 text-sm font-extrabold border-2 transition ${day === d ? 'bg-brand-600 text-white border-brand-600' : 'bg-white text-slate-600 border-slate-200 hover:border-brand-300'}`}>
              {d}
            </button>
          ))}
        </div>
      </Card>

      <Card className="p-5">
        <SectionHeader icon={Icon.Clock} title={`حصص ${day}`} actions={<button className="btn-outline !py-2" onClick={remind}><Icon.Bell size={16} /> ذكّرني</button>} />
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3 mt-2">
          {schedule[day].map((s, i) => (
            <div key={i} className="rounded-2xl border-2 border-slate-100 bg-white p-3 flex items-center gap-3">
              <span className="text-2xl">{s.icon}</span>
              <div className="min-w-0">
                <div className="text-xs font-extrabold text-slate-400">{PERIODS[i]}</div>
                <div className="font-extrabold text-slate-700 truncate">{s.name}</div>
              </div>
            </div>
          ))}
        </div>
      </Card>

      <div className="grid md:grid-cols-2 gap-4">
        <Card className="p-5">
          <SectionHeader icon={Icon.Plus} title="أضف ما تعلّمته" subtitle="سجّل درساً أو مهمة أنجزتها اليوم" />
          <div className="flex gap-2 mt-2">
            <input className="input" value={task} onChange={(e) => setTask(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && addTask()} placeholder="مثال: حفظت سورة الفيل" />
            <button className="btn-primary shrink-0" onClick={addTask}><Icon.Plus size={18} /> أضف</button>
          </div>
        </Card>

        <Card className="p-5">
          <SectionHeader icon={Icon.ListChecks} title="سجل اليوم" subtitle={`${todayLog.length} عنصراً`} />
          {todayLog.length ? (
            <ul className="space-y-2 mt-2">
              {todayLog.slice(0, 8).map((x) => (
                <li key={x.id} className="flex items-center gap-2 rounded-xl bg-emerald-50 px-3 py-2">
                  <Icon.Check size={16} className="text-emerald-600" />
                  <span className="text-sm font-bold text-slate-700">{x.title || x.lesson}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm font-bold text-slate-400 mt-2">لا شيء بعد — أضف ما تعلّمته اليوم!</p>
          )}
        </Card>
      </div>
      {toast.view}
    </div>
  );
}
