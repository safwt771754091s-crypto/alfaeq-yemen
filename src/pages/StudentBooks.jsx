import { useMemo, useState } from 'react';
import Icon from '../components/Icon.jsx';
import { Card, SectionHeader } from '../components/UI.jsx';
import { useApp } from '../state/store.jsx';
import { YEMEN_BOOKS, BOOK_SOURCE, AUTHORITY_LABEL, TERM_LABEL } from '../data/yemenBooks.js';
import { gradeName } from '../data/curriculum.js';

// «مكتبة الكتب» — كتالوج كتب المنهج اليمني بروابط تحميل مباشرة (تعمل دون تسجيل)
export default function StudentBooks() {
  const { companion } = useApp();
  const myGrade = companion.grade || 1;
  const [grade, setGrade] = useState(myGrade);
  const [subject, setSubject] = useState('');
  const [authority, setAuthority] = useState('');
  const [q, setQ] = useState('');

  const grades = useMemo(() => [...new Set(YEMEN_BOOKS.map((b) => b.grade))].sort((a, b) => a - b), []);
  const subjects = useMemo(
    () => [...new Set(YEMEN_BOOKS.filter((b) => b.grade === grade).map((b) => b.subject))],
    [grade]
  );

  const list = useMemo(() => {
    return YEMEN_BOOKS.filter((b) =>
      b.grade === grade &&
      (!subject || b.subject === subject) &&
      (!authority || b.authority === authority) &&
      (!q.trim() || b.title.includes(q) || b.subject.includes(q))
    );
  }, [grade, subject, authority, q]);

  return (
    <div className="space-y-5">
      <SectionHeader
        icon={Icon.Book}
        title="مكتبة الكتب المدرسية"
        subtitle={`${YEMEN_BOOKS.length} كتاباً من المنهج اليمني — روابط تحميل مباشرة`}
      />

      <Card className="p-4 space-y-3">
        <div className="flex flex-wrap gap-1.5">
          {grades.map((g) => (
            <button
              key={g}
              onClick={() => { setGrade(g); setSubject(''); }}
              className={`px-3 py-1.5 rounded-xl text-xs font-extrabold border transition ${
                g === grade ? 'bg-brand-600 text-white border-brand-600' : 'bg-white text-slate-600 border-slate-200 hover:border-brand-300'
              }`}
            >
              {g <= 9 ? `الصف ${g}` : g === 10 ? 'أول ثانوي' : g === 11 ? 'ثاني ثانوي' : 'ثالث ثانوي'}
            </button>
          ))}
        </div>

        <div className="grid sm:grid-cols-3 gap-2">
          <select value={subject} onChange={(e) => setSubject(e.target.value)} className="input">
            <option value="">كل المواد</option>
            {subjects.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
          <select value={authority} onChange={(e) => setAuthority(e.target.value)} className="input">
            <option value="">كل الجهات</option>
            <option value="common">المشترك</option>
            <option value="sanaa">صنعاء</option>
            <option value="aden">عدن</option>
          </select>
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="ابحث باسم الكتاب…" className="input" />
        </div>
      </Card>

      <div className="text-xs font-bold text-slate-400">
        {gradeName(grade)} • {list.length} كتاب
      </div>

      <div className="grid sm:grid-cols-2 gap-3">
        {list.map((b, i) => (
          <Card key={i} className="p-4 flex flex-col gap-3">
            <div className="flex items-start gap-3">
              <span className="grid place-items-center w-10 h-10 rounded-2xl bg-gradient-to-br from-emerald-400 to-emerald-600 text-white shrink-0">
                <Icon.Book size={18} />
              </span>
              <div className="min-w-0">
                <div className="font-extrabold text-slate-800 text-sm leading-relaxed line-clamp-2">{b.title}</div>
                <div className="flex flex-wrap gap-1.5 mt-1.5">
                  <span className="chip bg-slate-100 text-slate-600">{b.subject}</span>
                  <span className="chip bg-sky-100 text-sky-700">{AUTHORITY_LABEL[b.authority] || b.authority}</span>
                  <span className="chip bg-violet-100 text-violet-700">{TERM_LABEL[b.term] || b.term}</span>
                </div>
              </div>
            </div>
            <a href={b.url} target="_blank" rel="noopener noreferrer" className="btn-primary justify-center">
              <Icon.Book size={16} /> فتح / تحميل الكتاب
            </a>
          </Card>
        ))}
        {!list.length && (
          <Card className="p-8 text-center sm:col-span-2">
            <div className="text-4xl mb-2">📭</div>
            <div className="font-extrabold text-slate-600">لا توجد كتب مطابقة</div>
          </Card>
        )}
      </div>

      <p className="text-[11px] font-bold text-slate-400 leading-relaxed">
        المصدر: {BOOK_SOURCE.repo} (رخصة {BOOK_SOURCE.license}) — روابط التحميل من {BOOK_SOURCE.site} و{BOOK_SOURCE.alt}.
        الكتب مملوكة لوزارة التربية والتعليم اليمنية وتُوفَّر للاستخدام التعليمي.
      </p>
    </div>
  );
}
