import { useMemo, useState } from 'react';
import Icon from '../components/Icon.jsx';
import { Card, SectionHeader, Field, EmptyState } from '../components/UI.jsx';
import { GRADES, STAGES, SECONDARY_SECTIONS, subjectsForGrade, getUnits, gradeName } from '../data/curriculum.js';

export default function Curriculum({ go }) {
  const [grade, setGrade] = useState(7);
  const [section, setSection] = useState('scientific');
  const [subjectId, setSubjectId] = useState(null);
  const [query, setQuery] = useState('');

  const subjects = useMemo(() => subjectsForGrade(grade), [grade]);
  const activeSubject = subjects.find((s) => s.id === subjectId) || subjects[0];
  const units = useMemo(
    () => (activeSubject ? getUnits(grade, activeSubject.id) : []),
    [grade, activeSubject]
  );

  const stage = STAGES.find((s) => s.grades.includes(grade));
  const isSecondary = grade >= 10;

  const filteredUnits = query
    ? units.map((u) => ({ ...u, lessons: u.lessons.filter((l) => l.includes(query)) }))
        .filter((u) => u.lessons.length || u.title.includes(query))
    : units;

  return (
    <div className="space-y-5">
      <SectionHeader
        icon={Icon.Book}
        title="هيكل المنهج اليمني الشامل"
        subtitle="المقررات الرسمية لوزارة التربية والتعليم — التعليم الأساسي والثانوي"
      />

      {/* اختيار المرحلة والصف */}
      <Card className="p-4 sm:p-5">
        <div className="grid md:grid-cols-2 gap-4">
          <Field label="المرحلة الدراسية">
            <div className="flex flex-wrap gap-2">
              {STAGES.map((s) => (
                <button
                  key={s.id}
                  onClick={() => setGrade(s.grades[0])}
                  className={`btn ${s.grades.includes(grade) ? 'btn-primary' : 'btn-ghost'}`}
                >
                  {s.name}
                </button>
              ))}
            </div>
          </Field>
          {isSecondary && (
            <Field label="القسم (المرحلة الثانوية)">
              <div className="flex gap-2">
                {SECONDARY_SECTIONS.map((sec) => (
                  <button
                    key={sec.id}
                    onClick={() => setSection(sec.id)}
                    className={`btn ${section === sec.id ? 'btn-sand' : 'btn-ghost'}`}
                  >
                    {sec.icon} {sec.name}
                  </button>
                ))}
              </div>
            </Field>
          )}
        </div>

        <div className="mt-4">
          <div className="label">الصف الدراسي</div>
          <div className="flex flex-wrap gap-2">
            {GRADES.filter((g) => stage.grades.includes(g.n)).map((g) => (
              <button
                key={g.n}
                onClick={() => { setGrade(g.n); setSubjectId(null); }}
                className={`rounded-xl px-3.5 py-2 text-sm font-bold border transition ${
                  grade === g.n
                    ? 'bg-brand-600 text-white border-brand-600 shadow-soft'
                    : 'bg-white text-slate-600 border-slate-200 hover:border-brand-400 hover:text-brand-700'
                }`}
              >
                {g.name}
              </button>
            ))}
          </div>
        </div>
      </Card>

      <div className="grid lg:grid-cols-[300px_1fr] gap-4">
        {/* قائمة المواد */}
        <Card className="p-4 h-fit">
          <div className="section-title mb-3">
            <Icon.Book size={18} /> مقررات {gradeName(grade)}
          </div>
          <div className="space-y-1.5">
            {subjects.map((s) => (
              <button
                key={s.id}
                onClick={() => setSubjectId(s.id)}
                className={`w-full flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-bold text-right transition ${
                  activeSubject?.id === s.id
                    ? 'bg-brand-50 text-brand-700 ring-1 ring-brand-200'
                    : 'text-slate-600 hover:bg-slate-50'
                }`}
              >
                <span className="text-lg">{s.icon}</span>
                <span className="grow">{s.name}</span>
                <span className="text-[11px] text-slate-400">
                  {getUnits(grade, s.id).length} وحدات
                </span>
              </button>
            ))}
          </div>
        </Card>

        {/* تفاصيل المادة */}
        <div className="space-y-4">
          {activeSubject && (
            <Card className="p-5">
              <div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-4">
                <span className="grid place-items-center w-14 h-14 rounded-2xl bg-brand-50 text-3xl">
                  {activeSubject.icon}
                </span>
                <div className="grow">
                  <h3 className="text-xl font-extrabold text-slate-800">{activeSubject.name}</h3>
                  <p className="text-sm text-slate-500 font-bold">
                    {gradeName(grade)} • {stage.short}{isSecondary ? ` • ${SECONDARY_SECTIONS.find((x) => x.id === section)?.name}` : ''}
                  </p>
                </div>
                <button className="btn-primary" onClick={() => go('planner', { subjectId: activeSubject.id, grade })}>
                  <Icon.Sparkles size={18} /> تحضير درس من هذه المادة
                </button>
              </div>

              <div className="flex items-center gap-2 mb-4">
                <div className="relative grow">
                  <Icon.Search size={18} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    className="input pr-10"
                    placeholder="ابحث في الدروس..."
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                  />
                </div>
              </div>

              {filteredUnits.length === 0 ? (
                <EmptyState title="لا توجد نتائج" subtitle="جرّب كلمة بحث أخرى." />
              ) : (
                <div className="space-y-3">
                  {filteredUnits.map((u, i) => (
                    <div key={i} className="rounded-2xl border border-slate-200 overflow-hidden">
                      <div className="bg-slate-50 px-4 py-2.5 flex items-center gap-2">
                        <span className="grid place-items-center w-7 h-7 rounded-lg bg-brand-600 text-white text-xs font-extrabold">
                          {i + 1}
                        </span>
                        <span className="font-extrabold text-slate-700 text-sm">{u.title}</span>
                        {u.sourced && (
                          <span className="chip bg-emerald-100 text-emerald-700" title="محتوى منهجي حقيقي من مصدر موثّق">
                            موثّق ✓
                          </span>
                        )}
                        <span className="mr-auto chip bg-white text-slate-500 border border-slate-200">
                          {u.lessons.length} دروس
                        </span>
                      </div>
                      <ul className="divide-y divide-slate-100">
                        {u.lessons.map((l, j) => (
                          <li key={j} className="flex items-center gap-2.5 px-4 py-2.5 hover:bg-brand-50/40">
                            <Icon.File size={16} className="text-slate-300" />
                            <span className="text-sm text-slate-600 grow">{l}</span>
                            <button
                              className="btn-ghost !px-2.5 !py-1.5 !text-xs"
                              onClick={() => go('planner', { subjectId: activeSubject.id, grade, title: l })}
                            >
                              تحضير
                            </button>
                            <button
                              className="btn-ghost !px-2.5 !py-1.5 !text-xs"
                              onClick={() => go('presentations', { subjectId: activeSubject.id, grade, title: l })}
                            >
                              عرض
                            </button>
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
