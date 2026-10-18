import { useEffect, useMemo, useRef, useState } from 'react';
import Icon from '../components/Icon.jsx';
import { Card, SectionHeader, useToast } from '../components/UI.jsx';
import { useApp } from '../state/store.jsx';
import { GRADES, gradeName, subjectsForGrade, SUBJECTS } from '../data/curriculum.js';
import { booksForSubject } from '../data/yemenBooks.js';
import { buildBook, flattenPages, openAt, searchLessons } from '../lib/bookEngine.js';
import { narrationForLesson, speak, stopSpeaking, speechSupported, pickArabicVoice } from '../lib/voice.js';

// الكتاب الرقمي — فتح أي درس بالاسم ورقم الصفحة، تقليب، استماع، وتسجيل التعلّم
export default function StudentBook({ params = {} }) {
  const { companion, saveCompanion, studyLog } = useApp();
  const toast = useToast();
  const grade = companion.grade || 1;

  const [subjectId, setSubjectId] = useState(params.subjectId || subjectsForGrade(grade)[0]?.id || 'arabic');
  const [nameQuery, setNameQuery] = useState('');
  const [pageInput, setPageInput] = useState('');
  const [pageIndex, setPageIndex] = useState(0);
  const [target, setTarget] = useState(null); // { page, lesson, subjectId } — نتيجة الفتح بالاسم عبر كل المواد
  const pendingJump = useRef(null);

  const subjects = useMemo(() => subjectsForGrade(grade), [grade]);
  const book = useMemo(() => buildBook({ grade, subjectId }), [grade, subjectId]);
  const pages = useMemo(() => flattenPages(book), [book]);

  // عند تغيير الصف/المادة، ارجع للصفحة الأولى (أو الصفحة المطلوبة عبر المواد)
  useEffect(() => {
    if (pendingJump.current) {
      const t = pendingJump.current;
      pendingJump.current = null;
      setTarget(t);
      const i = pages.findIndex((p) => p.page === t.page && p.lesson === t.lesson);
      setPageIndex(i >= 0 ? i : 0);
      return;
    }
    setPageIndex(0);
    setPageInput('');
    setTarget(null);
  }, [grade, subjectId, pages]);

  const current = pages[pageIndex] || null;
  const officialBooks = useMemo(() => booksForSubject(grade, SUBJECTS[subjectId]?.name || ''), [grade, subjectId]);
  // اقتراحات بحث فورية عبر كل مواد الصف
  const searchHits = useMemo(() => {
    if (!nameQuery.trim()) return [];
    const out = [];
    for (const s of subjects) {
      const b = s.id === subjectId ? book : buildBook({ grade, subjectId: s.id });
      for (const h of searchLessons(b, nameQuery)) out.push({ ...h, subjectId: s.id, subjectName: s.name });
    }
    return out.slice(0, 20);
  }, [book, subjects, subjectId, grade, nameQuery]);

  // الفتح بالاسم أو رقم الصفحة — يبحث في المادة الحالية ثم في كل مواد الصف
  const openByLookup = () => {
    const hasName = nameQuery.trim().length > 0;
    const hasPage = String(pageInput).trim().length > 0;

    // 1) المادة الحالية
    if (hasName) {
      const local = searchLessons(book, nameQuery);
      if (local.length) {
        const t = openAt(book, { name: local[0].lesson });
        setTarget({ page: t.page, lesson: t.lesson, subjectId });
        setPageIndex(pages.findIndex((p) => p.page === t.page && p.lesson === t.lesson));
        return;
      }
    }

    // 2) بقية مواد الصف
    if (hasName) {
      for (const s of subjects) {
        if (s.id === subjectId) continue;
        const b = buildBook({ grade, subjectId: s.id });
        const hits = searchLessons(b, nameQuery);
        if (hits.length) {
          const t = openAt(b, { name: hits[0].lesson });
          pendingJump.current = { page: t.page, lesson: t.lesson, subjectId: s.id };
          setSubjectId(s.id);
          toast.push(`وُجد الدرس في مادة ${s.name}`);
          return;
        }
      }
    }

    // 3) رقم الصفحة في المادة الحالية
    if (hasPage) {
      const t = openAt(book, { page: pageInput });
      setTarget({ page: t.page, lesson: t.lesson, subjectId });
      setPageIndex(pages.findIndex((p) => p.page === t.page && p.lesson === t.lesson));
      return;
    }

    toast.push('لم نجد الدرس المطلوب — جرّب كلمة أخرى', 'error');
  };

  const goPage = (i) => {
    const next = Math.max(0, Math.min(pages.length - 1, i));
    setPageIndex(next);
    setPageInput(String(pages[next]?.page || ''));
  };

  const listen = () => {
    if (!current) return;
    if (!speechSupported()) { toast.push('الجهاز لا يدعم النطق الصوتي'); return; }
    const lessonPages = pages.filter((p) => p.lesson === current.lesson);
    const text = narrationForLesson(lessonPages);
    const voice = pickArabicVoice(window.speechSynthesis.getVoices());
    speak(text, { voice });
    toast.push('🎧 الشرح الصوتي يعمل باللهجة اليمنية');
  };

  const logLearned = () => {
    if (!current) return;
    studyLog.add({
      title: `درس «${current.lesson}»`,
      lesson: current.lesson,
      subjectId,
      page: current.page,
      date: new Date().toISOString().slice(0, 10),
    });
    toast.push('✅ سُجّل في «تعلّمت اليوم»');
  };

  return (
    <div className="space-y-5">
      <SectionHeader
        icon={Icon.Book}
        title="الكتاب الرقمي"
        subtitle="افتح أي درس بالاسم أو رقم الصفحة — واستمع للشرح باللهجة اليمنية"
      />

      {/* أدوات الفتح */}
      <Card className="p-4">
        <div className="grid sm:grid-cols-4 gap-3">
          <label className="block">
            <span className="text-xs font-extrabold text-slate-500">الصف</span>
            <select className="input mt-1" value={grade} onChange={(e) => saveCompanion({ grade: Number(e.target.value) })}>
              {GRADES.map((g) => <option key={g.n} value={g.n}>{gradeName(g.n)}</option>)}
            </select>
          </label>
          <label className="block">
            <span className="text-xs font-extrabold text-slate-500">المادة</span>
            <select className="input mt-1" value={subjectId} onChange={(e) => setSubjectId(e.target.value)}>
              {subjects.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </label>
          <label className="block">
            <span className="text-xs font-extrabold text-slate-500">اسم الدرس</span>
            <input className="input mt-1" value={nameQuery} onChange={(e) => setNameQuery(e.target.value)} placeholder="مثال: الحروف الهجائية" />
          </label>
          <label className="block">
            <span className="text-xs font-extrabold text-slate-500">رقم الصفحة</span>
            <input className="input mt-1" type="number" min="1" value={pageInput} onChange={(e) => setPageInput(e.target.value)} placeholder="مثال: 5" />
          </label>
        </div>
        <div className="flex flex-wrap gap-2 mt-3">
          <button className="btn-primary" onClick={openByLookup}><Icon.Search size={18} /> افتح</button>
          {officialBooks.length > 0 && (
            <a href={officialBooks[0].url} target="_blank" rel="noopener noreferrer"
              className="btn-ghost border border-emerald-200 text-emerald-700 bg-emerald-50">
              <Icon.Book size={18} /> الكتاب الرسمي (PDF)
            </a>
          )}
          <span className="chip bg-slate-100 text-slate-600 self-center">
            {book.totalLessons} درساً • {book.totalPages} صفحة • {SUBJECTS[subjectId]?.name}
          </span>
        </div>

        {searchHits.length > 0 && (
          <div className="mt-3 rounded-2xl border border-slate-100 divide-y divide-slate-100 max-h-64 overflow-auto">
            {searchHits.map((h, i) => (
              <button
                key={i}
                className="w-full text-right px-3 py-2 hover:bg-brand-50 transition"
                onClick={() => {
                  if (h.subjectId === subjectId) {
                    const t = openAt(book, { name: h.lesson });
                    setTarget({ page: t.page, lesson: t.lesson, subjectId });
                    setPageIndex(pages.findIndex((p) => p.page === t.page && p.lesson === t.lesson));
                  } else {
                    const b = buildBook({ grade, subjectId: h.subjectId });
                    const t = openAt(b, { name: h.lesson });
                    pendingJump.current = { page: t.page, lesson: t.lesson, subjectId: h.subjectId };
                    setSubjectId(h.subjectId);
                  }
                }}
              >
                <span className="text-sm font-bold text-slate-700">{h.lesson}</span>
                <span className="text-xs text-slate-400 font-bold"> — {h.subjectName} • {h.chapter} • صفحة {h.page}</span>
              </button>
            ))}
          </div>
        )}
      </Card>

      {/* شريط نتيجة الفتح */}
      {target && (
        <div className="flex items-center gap-2 rounded-2xl bg-sky-50 border border-sky-100 px-4 py-2.5 text-sm font-bold text-sky-800">
          <Icon.Book size={16} />
          فُتح درس «{target.lesson}» — {SUBJECTS[target.subjectId]?.name} • صفحة {target.page}
        </div>
      )}

      {/* صفحة الكتاب */}
      {current ? (
        <Card className="p-0 overflow-hidden">
          <div className="flex items-center justify-between gap-2 px-4 py-3 bg-gradient-to-l from-brand-600 to-brand-500 text-white">
            <div className="min-w-0">
              <div className="text-xs font-bold text-white/80">{current.chapter}</div>
              <div className="font-extrabold truncate">{current.title || current.lesson}</div>
            </div>
            <div className="flex items-center gap-1 shrink-0">
              <button onClick={() => goPage(pageIndex - 1)} disabled={pageIndex === 0} className="grid place-items-center w-9 h-9 rounded-xl bg-white/20 hover:bg-white/30 disabled:opacity-40" title="السابق">
                <Icon.ChevronRight size={18} />
              </button>
              <span className="text-sm font-extrabold px-2">صفحة {current.page}</span>
              <button onClick={() => goPage(pageIndex + 1)} disabled={pageIndex >= pages.length - 1} className="grid place-items-center w-9 h-9 rounded-xl bg-white/20 hover:bg-white/30 disabled:opacity-40" title="التالي">
                <Icon.ChevronLeft size={18} />
              </button>
            </div>
          </div>

          <div className="p-5 sm:p-7 bg-[#fffdf5] min-h-[280px]">
            {Array.isArray(current.body) && (
              <div className="space-y-2">
                {current.body.map((b, i) => <p key={i} className="text-slate-700 font-bold leading-loose text-[15px]">{b}</p>)}
              </div>
            )}

            {Array.isArray(current.points) && (
              <ul className="mt-4 space-y-2">
                {current.points.map((p, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <span className="grid place-items-center w-6 h-6 rounded-full bg-brand-100 text-brand-700 text-xs font-extrabold shrink-0">{i + 1}</span>
                    <span className="text-slate-700 font-bold">{p}</span>
                  </li>
                ))}
              </ul>
            )}

            {Array.isArray(current.examples) && current.examples.length > 0 && (
              <div className="mt-4">
                <div className="font-extrabold text-slate-800 mb-2">أمثلة:</div>
                <ul className="space-y-1.5">
                  {current.examples.map((e, i) => (
                    <li key={i} className="rounded-xl bg-white border border-slate-100 px-3 py-2 text-slate-700 font-bold text-sm">{e}</li>
                  ))}
                </ul>
              </div>
            )}

            {Array.isArray(current.exercise) && (
              <div className="mt-4 rounded-2xl bg-amber-50 border border-amber-100 p-3">
                <div className="font-extrabold text-amber-800 mb-1.5">تدريب 🖊️</div>
                <ol className="space-y-1 list-decimal pr-5">
                  {current.exercise.map((x, i) => <li key={i} className="text-slate-700 font-bold text-sm">{x}</li>)}
                </ol>
              </div>
            )}

            {current.tips && (
              <div className="mt-4 flex items-center gap-2 text-sm font-bold text-emerald-700">
                <Icon.Lightbulb size={16} /> {current.tips}
              </div>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-2 p-4 border-t border-slate-100">
            <button className="btn-primary" onClick={listen}><Icon.Presentation size={18} /> استمع للشرح 🎧</button>
            <button className="btn-outline" onClick={stopSpeaking}><Icon.Close size={16} /> إيقاف</button>
            <button className="btn-outline" onClick={logLearned}><Icon.CheckCircle size={16} /> سجّل تعلّم اليوم</button>
            <span className="text-xs font-bold text-slate-400 mr-auto">{pageIndex + 1} / {pages.length}</span>
          </div>
        </Card>
      ) : (
        <Card className="p-8 text-center text-slate-400 font-bold">لا توجد صفحات لهذه المادة.</Card>
      )}
      {toast.view}
    </div>
  );
}
