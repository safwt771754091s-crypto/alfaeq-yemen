import { useMemo, useRef, useState } from 'react';
import Icon from '../components/Icon.jsx';
import { Card, SectionHeader, Field, ProgressBar, EmptyState, Confirm, useToast } from '../components/UI.jsx';
import { useApp } from '../state/store.jsx';
import '../lib/pdfWorker.js';
import { SUBJECTS, SUBJECTS_BY_GRADE, gradeName } from '../data/curriculum.js';
import { authorityBooks, subjectIdFor, AUTHORITY_LABEL } from '../data/yemenBooks.js';
import { importedBooks, removeImportedBook } from '../data/importedUnits.js';
import { importBookBuffer, bookIdFor } from '../lib/importer.js';

const GRADES = Array.from({ length: 12 }, (_, i) => i + 1);
const GRADE_LABEL = (g) => (g <= 9 ? `الصف ${g}` : g === 10 ? 'أول ثانوي' : g === 11 ? 'ثاني ثانوي' : 'ثالث ثانوي');

// «استيراد الكتب» — تحويل كتاب المنهج (عدن) إلى وحدات ودروس داخل المنصة.
export default function Importer() {
  const { companion, logActivity } = useApp();
  const toast = useToast();
  const [grade, setGrade] = useState(companion.grade || 1);
  const [subjectId, setSubjectId] = useState('');
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState(null);
  const [result, setResult] = useState(null);
  const [books, setBooks] = useState(() => importedBooks());
  const [confirmDel, setConfirmDel] = useState(null);
  const fileRef = useRef(null);

  const subjects = useMemo(
    () => (SUBJECTS_BY_GRADE[grade] || []).map((id) => SUBJECTS[id]).filter(Boolean),
    [grade]
  );
  const subject = SUBJECTS[subjectId];
  const adenBooks = useMemo(
    () => (subject ? authorityBooks(grade, subject.name, 'aden') : []),
    [grade, subject]
  );

  const refresh = () => setBooks(importedBooks());

  async function runImport(file, book) {
    const subjectKey = book?.subjectId || subjectIdFor(book?.subject || subject?.name || '');
    if (!subjectKey) {
      toast.push('تعذّر تحديد المادة — اختر المادة أولاً.', 'error');
      return;
    }
    setBusy(true);
    setResult(null);
    setProgress({ stage: 'read', pct: 2 });
    try {
      const buf = await file.arrayBuffer();
      const bookMeta = book
        ? { ...book, grade, subjectId: subjectKey }
        : { grade, subjectId: subjectKey, authority: 'aden', title: file.name.replace(/\.pdf$/i, ''), term: 'first' };

      const res = await importBookBuffer({
        data: new Uint8Array(buf),
        book: bookMeta,
        onProgress: (p) => {
          if (p.stage === 'extract') setProgress({ stage: 'extract', pct: 5 + Math.round((p.page / p.total) * 85), page: p.page, total: p.total });
          else if (p.stage === 'segment') setProgress({ stage: 'segment', pct: 94 });
          else setProgress({ stage: 'save', pct: 98 });
        }
      });

      if (!res.ok) {
        setResult(res);
        setProgress(null);
        toast.push(res.reason === 'no-text' ? 'الكتاب مصوّر بلا طبقة نصّية — لا يمكن استخراج دروسه آلياً.' : 'لم أجد دروساً في هذا الملف.', 'error');
      } else {
        setResult(res);
        setProgress({ stage: 'done', pct: 100 });
        refresh();
        logActivity?.(`استيراد كتاب: ${bookMeta.title}`);
        toast.push(`تم استيراد ${res.units} وحدة و${res.lessons} درساً.`);
      }
    } catch (e) {
      toast.push('فشل الاستيراد: ' + (e?.message || 'خطأ غير متوقع'), 'error');
      setProgress(null);
    } finally {
      setBusy(false);
    }
  }

  const onPick = (book) => () => { fileRef.current.dataset.book = JSON.stringify(book); fileRef.current.click(); };
  const onFile = (e) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    let book = null;
    try { book = fileRef.current.dataset.book ? JSON.parse(fileRef.current.dataset.book) : null; } catch { book = null; }
    runImport(file, book);
  };

  const stageLabel = {
    read: 'قراءة الملف…',
    extract: progress?.total ? `استخراج الصفحات (${progress.page}/${progress.total})…` : 'استخراج الصفحات…',
    segment: 'تقطيع الدروس…',
    save: 'حفظ محلي…',
    done: 'اكتمل'
  };

  return (
    <div className="space-y-5">
      {toast.view}
      <SectionHeader
        icon={Icon.Upload}
        title="استيراد كتب المنهج"
        subtitle="حوّل كتاب المنهج الرسمي (عدن) إلى وحدات ودروس داخل المنصة — يعمل محلياً دون إنترنت بعد تحميل الملف."
      />

      <Card className="p-4 space-y-3">
        <div className="flex flex-wrap gap-1.5">
          {GRADES.map((g) => (
            <button
              key={g}
              onClick={() => { setGrade(g); setSubjectId(''); }}
              className={`px-3 py-1.5 rounded-xl text-xs font-extrabold border transition ${
                g === grade ? 'bg-brand-600 text-white border-brand-600' : 'bg-white text-slate-600 border-slate-200 hover:border-brand-300'
              }`}
            >
              {GRADE_LABEL(g)}
            </button>
          ))}
        </div>
        <div className="flex flex-wrap gap-1.5">
          {subjects.map((s) => (
            <button
              key={s.id}
              onClick={() => setSubjectId(s.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition ${
                s.id === subjectId ? 'bg-slate-800 text-white border-slate-800' : 'bg-white text-slate-600 border-slate-200 hover:border-slate-400'
              }`}
            >
              <span className="me-1">{s.icon}</span>{s.name}
            </button>
          ))}
        </div>
      </Card>

      <input ref={fileRef} type="file" accept="application/pdf,.pdf" className="hidden" onChange={onFile} />

      {busy && progress && (
        <Card className="p-4 space-y-2">
          <div className="flex items-center justify-between text-sm font-bold text-slate-600">
            <span>{stageLabel[progress.stage] || 'جارٍ العمل…'}</span>
            <span className="tabular-nums">{progress.pct}%</span>
          </div>
          <ProgressBar value={progress.pct} />
        </Card>
      )}

      {result && (
        <Card className={`p-4 ${result.ok ? 'border-emerald-200 bg-emerald-50/40' : 'border-amber-200 bg-amber-50/40'}`}>
          {result.ok ? (
            <div className="flex flex-wrap items-center gap-4 text-sm">
              <span className="font-extrabold text-emerald-700 flex items-center gap-1.5"><Icon.CheckCircle size={18} /> تم الاستيراد</span>
              <span className="text-slate-600">الوحدات: <b>{result.units}</b></span>
              <span className="text-slate-600">الدروس: <b>{result.lessons}</b></span>
              <span className="text-slate-600">أسئلة مبدئية: <b>{result.questions}</b></span>
              <span className="text-slate-600">الصفحات المقروءة: <b>{result.readable}/{result.pages}</b></span>
              {result.partial && <span className="text-amber-700 font-bold">جزئي — بعض الصفحات مصوّرة</span>}
            </div>
          ) : (
            <div className="text-sm text-amber-800 font-bold">
              {result.reason === 'no-text'
                ? `هذا الكتاب نسخة مصوّرة بلا طبقة نصّية (${result.pages} صفحة). لا يمكن استخراج الدروس آلياً — استخدم كتاباً رقمياً.`
                : 'لم يُعثر على دروس في هذا الملف.'}
            </div>
          )}
        </Card>
      )}

      {!subjectId ? (
        <EmptyState icon={Icon.Book} title="اختر الصف والمادة" subtitle="ثم اختر كتاب عدن المطلوب واستورده، أو ارفع ملف PDF جاهزاً." />
      ) : (
        <div className="space-y-3">
          <div className="text-xs font-bold text-slate-400">
            {gradeName(grade)} • {subject.name} • كتب جهة {AUTHORITY_LABEL.aden} ({adenBooks.length})
          </div>
          {adenBooks.length === 0 && (
            <Card className="p-4 text-sm text-slate-500">
              لا يوجد كتاب «عدن» لهذه المادة. يمكنك رفع أي ملف PDF للكتاب مباشرةً.
            </Card>
          )}
          <div className="grid sm:grid-cols-2 gap-3">
            {adenBooks.map((b, i) => {
              const id = bookIdFor({ ...b, subjectId });
              const done = books.some((x) => x.bookId === id);
              return (
                <Card key={i} className="p-4 flex flex-col gap-3">
                  <div className="flex items-start gap-3">
                    <span className="grid place-items-center w-10 h-10 rounded-2xl bg-gradient-to-br from-indigo-400 to-indigo-600 text-white shrink-0">
                      <Icon.Book size={18} />
                    </span>
                    <div className="min-w-0">
                      <div className="font-extrabold text-slate-700 text-sm leading-snug">{b.title.replace('تحميل كتاب ', '').replace(' اليمن pdf', '')}</div>
                      <div className="text-[11px] text-slate-400 mt-0.5">{AUTHORITY_LABEL[b.authority]} • {b.term === 'second' ? 'الفصل الثاني' : 'الفصل الأول'}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 mt-auto">
                    <button className="btn-primary text-xs flex-1" disabled={busy} onClick={onPick({ ...b, subjectId })}>
                      <Icon.Upload size={15} /> {done ? 'إعادة الاستيراد' : 'استيراد الكتاب'}
                    </button>
                    <a className="btn-ghost text-xs" href={b.url} target="_blank" rel="noreferrer" title="تحميل PDF">
                      <Icon.Download size={15} /> PDF
                    </a>
                    {done && <span className="text-emerald-600" title="مستورد"><Icon.CheckCircle size={18} /></span>}
                  </div>
                </Card>
              );
            })}
          </div>

          <Card className="p-4">
            <div className="text-sm font-extrabold text-slate-700 mb-2">أو ارفع ملف PDF للكتاب</div>
            <button className="btn-ghost text-sm" disabled={busy} onClick={onPick(null)}>
              <Icon.Upload size={16} /> اختر ملف PDF من جهازك
            </button>
            <p className="text-[11px] text-slate-400 mt-2">
              ملاحظة: الكتب الرسمية غالباً نسخ مصوّرة بلا نصّ قابل للاستخراج؛ عندها استخدم الكتاب الرقمي (PDF) للعرض،
              والاستيراد يعمل مع الكتب ذات الطبقة النصّية.
            </p>
          </Card>
        </div>
      )}

      {books.length > 0 && (
        <div className="space-y-2">
          <div className="text-sm font-extrabold text-slate-700">الكتب المستوردة ({books.length})</div>
          <div className="grid sm:grid-cols-2 gap-3">
            {books.map((b, i) => (
              <Card key={i} className="p-3.5 flex items-center gap-3">
                <span className="grid place-items-center w-9 h-9 rounded-xl bg-emerald-50 text-emerald-700 shrink-0">
                  <Icon.CheckCircle size={16} />
                </span>
                <div className="min-w-0 grow">
                  <div className="text-sm font-bold text-slate-700 truncate">{b.bookTitle}</div>
                  <div className="text-[11px] text-slate-400">{GRADE_LABEL(b.grade)} • {SUBJECTS[b.subjectId]?.name || b.subjectId} • {b.units} وحدة • {b.lessons} درس</div>
                </div>
                <button className="btn-ghost !px-2.5 !py-2 text-rose-600" onClick={() => setConfirmDel(b)} title="حذف">
                  <Icon.Trash size={15} />
                </button>
              </Card>
            ))}
          </div>
        </div>
      )}

      <Confirm
        open={!!confirmDel}
        onClose={() => setConfirmDel(null)}
        onConfirm={() => { removeImportedBook(confirmDel.grade, confirmDel.subjectId, confirmDel.bookId); refresh(); toast.push('حُذفت وحدات الكتاب.'); }}
        title="حذف وحدات الكتاب"
        message={`سيتم حذف ${confirmDel?.units || 0} وحدة مستوردة من «${confirmDel?.bookTitle || ''}» من هيكل المنهج.`}
      />
    </div>
  );
}
