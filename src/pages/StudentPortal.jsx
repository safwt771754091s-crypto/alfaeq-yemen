import { useState } from 'react';
import Icon from '../components/Icon.jsx';
import { useApp } from '../state/store.jsx';
import StudentHub from './StudentHub.jsx';
import StudentBook from './StudentBook.jsx';
import StudentAsk from './StudentAsk.jsx';
import StudentTimetable from './StudentTimetable.jsx';
import StudentPractice from './StudentPractice.jsx';
import StudentBooks from './StudentBooks.jsx';
import VoiceLesson from './VoiceLesson.jsx';
import MathGames from './MathGames.jsx';
import { gradeName } from '../data/curriculum.js';

const TABS = [
  { id: 'hub', name: 'الرئيسية', icon: Icon.Home },
  { id: 'voice', name: 'الدرس الصوتي', icon: Icon.Speaker },
  { id: 'book', name: 'الكتاب الرقمي', icon: Icon.Book },
  { id: 'books', name: 'مكتبة الكتب', icon: Icon.Book },
  { id: 'ask', name: 'اسأل الآن', icon: Icon.Message },
  { id: 'practice', name: 'تدرّب', icon: Icon.Sparkles },
  { id: 'games', name: 'ألعاب', icon: Icon.Sparkles },
  { id: 'timetable', name: 'جدولي', icon: Icon.Calendar },
];

// بوابة الطالب المستقلة — واجهة مبسّطة مبهجة تعمل دون تسجيل دخول (رابط #student)
export default function StudentPortal({ onHome }) {
  const { companion } = useApp();
  const [tab, setTab] = useState('hub');
  const [params, setParams] = useState({});

  const go = (id, p = {}) => { setParams(p || {}); setTab(id); };

  const body = tab === 'book' ? <StudentBook params={params} />
    : tab === 'voice' ? <VoiceLesson />
    : tab === 'books' ? <StudentBooks />
    : tab === 'ask' ? <StudentAsk />
    : tab === 'practice' ? <StudentPractice />
    : tab === 'games' ? <MathGames />
    : tab === 'timetable' ? <StudentTimetable />
    : <StudentHub go={go} />;

  return (
    <div className="min-h-screen bg-gradient-to-b from-sky-50 to-white" dir="rtl">
      <header className="sticky top-0 z-30 bg-white/90 backdrop-blur border-b border-slate-200">
        <div className="mx-auto max-w-4xl px-4 h-16 flex items-center gap-3">
          <span className="grid place-items-center w-11 h-11 rounded-2xl bg-gradient-to-br from-brand-500 to-sand-500 text-white text-2xl shadow-soft">🎓</span>
          <div className="min-w-0">
            <div className="font-extrabold text-slate-800 leading-tight">رفيق الطالب اليمني</div>
            <div className="text-[11px] text-slate-400 font-bold">{gradeName(companion.grade || 1)} • تعلّم والعب</div>
          </div>
          <button onClick={onHome} className="btn-outline !py-2 mr-auto text-sm"><Icon.Home size={16} /> الموقع</button>
        </div>
        <div className="mx-auto max-w-4xl px-2 pb-2 flex gap-1 overflow-x-auto">
          {TABS.map((t) => {
            const I = t.icon;
            return (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                className={`shrink-0 flex items-center gap-2 rounded-2xl px-4 py-2 text-sm font-extrabold transition ${tab === t.id ? 'bg-brand-600 text-white shadow-soft' : 'bg-white text-slate-600 border border-slate-200 hover:border-brand-300'}`}
              >
                <I size={18} /> {t.name}
              </button>
            );
          })}
        </div>
      </header>

      <main className="mx-auto max-w-4xl px-4 py-6 animate-fade-in">
        <div key={tab}>{body}</div>
      </main>

      <footer className="px-6 py-6 text-center text-xs text-slate-400">
        رفيق الطالب اليمني — من منصة المعلم الذكية • يعمل دون اتصال
      </footer>
    </div>
  );
}
