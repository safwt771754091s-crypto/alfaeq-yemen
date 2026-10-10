import { useEffect, useState } from 'react';
import Icon from './components/Icon.jsx';
import { useApp } from './state/store.jsx';
import Dashboard from './pages/Dashboard.jsx';
import Curriculum from './pages/Curriculum.jsx';
import LessonPlanner from './pages/LessonPlanner.jsx';
import LessonNotebook from './pages/LessonNotebook.jsx';
import Presentations from './pages/Presentations.jsx';
import Grader from './pages/Grader.jsx';
import Gradebook from './pages/Gradebook.jsx';
import Attendance from './pages/Attendance.jsx';
import Certificates from './pages/Certificates.jsx';
import Classes from './pages/Classes.jsx';
import Settings from './pages/Settings.jsx';
import Owner from './pages/Owner.jsx';
import Onboarding from './pages/Onboarding.jsx';

const NAV = [
  { id: 'dashboard', name: 'الرئيسية', icon: Icon.Home, group: 'عام' },
  { id: 'curriculum', name: 'المنهج اليمني', icon: Icon.Book, group: 'التخطيط' },
  { id: 'planner', name: 'التحضير الذكي', icon: Icon.Sparkles, group: 'التخطيط' },
  { id: 'notebook', name: 'كراسة التحضير', icon: Icon.Clipboard, group: 'التخطيط' },
  { id: 'presentations', name: 'العروض التقديمية', icon: Icon.Slides, group: 'التخطيط' },
  { id: 'grader', name: 'التصحيح الذكي', icon: Icon.CheckCircle, group: 'التقييم' },
  { id: 'gradebook', name: 'سجل الدرجات', icon: Icon.Clipboard, group: 'السجلات' },
  { id: 'attendance', name: 'الحضور والغياب', icon: Icon.Calendar, group: 'السجلات' },
  { id: 'certificates', name: 'الشهادات', icon: Icon.Award, group: 'السجلات' },
  { id: 'classes', name: 'الصفوف والطلاب', icon: Icon.Users, group: 'الإعداد' },
  { id: 'owner', name: 'حساب المالك', icon: Icon.Crown, group: 'الإعداد' },
  { id: 'settings', name: 'الإعدادات', icon: Icon.Settings, group: 'الإعداد' }
];

const PAGES = {
  dashboard: Dashboard,
  curriculum: Curriculum,
  planner: LessonPlanner,
  notebook: LessonNotebook,
  presentations: Presentations,
  grader: Grader,
  gradebook: Gradebook,
  attendance: Attendance,
  certificates: Certificates,
  classes: Classes,
  owner: Owner,
  settings: Settings
};

function useOnline() {
  const [online, setOnline] = useState(typeof navigator !== 'undefined' ? navigator.onLine : true);
  useEffect(() => {
    const on = () => setOnline(true);
    const off = () => setOnline(false);
    window.addEventListener('online', on);
    window.addEventListener('offline', off);
    return () => { window.removeEventListener('online', on); window.removeEventListener('offline', off); };
  }, []);
  return online;
}

export default function App() {
  const { profile, logActivity } = useApp();
  const [route, setRoute] = useState('dashboard');
  const [routeParams, setRouteParams] = useState({});
  const [menuOpen, setMenuOpen] = useState(false);
  const online = useOnline();

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
    setMenuOpen(false);
  }, [route]);

  if (!profile.setupDone) {
    return <Onboarding onDone={() => { logActivity('تم إعداد الحساب'); setRoute('dashboard'); }} />;
  }

  const Current = PAGES[route] || Dashboard;
  const groups = [...new Set(NAV.map((n) => n.group))];

  const go = (id, params = {}) => {
    setRouteParams(params || {});
    setRoute(id);
  };

  return (
    <div className="min-h-screen flex" dir="rtl">
      {/* الشريط الجانبي */}
      <aside
        className={`fixed lg:sticky top-0 h-screen w-72 shrink-0 z-40 bg-white/95 backdrop-blur border-l border-slate-200 flex flex-col
        transition-transform duration-300 lg:translate-x-0 ${menuOpen ? 'translate-x-0' : 'translate-x-full lg:translate-x-0'}`}
        style={{ insetInlineStart: 'auto', insetInlineEnd: 0 }}
      >
        <div className="px-5 py-5 border-b border-slate-100 flex items-center gap-3">
          <span className="grid place-items-center w-11 h-11 rounded-2xl bg-gradient-to-br from-brand-500 to-brand-700 text-white shadow-soft">
            <Icon.School size={24} />
          </span>
          <div className="min-w-0">
            <div className="font-extrabold text-slate-800 leading-tight">منصة المعلم الذكية</div>
            <div className="text-[11px] text-slate-400 font-bold">للمعلم اليمني</div>
          </div>
          <button className="btn-ghost !px-2 !py-2 lg:hidden mr-auto" onClick={() => setMenuOpen(false)} aria-label="إغلاق">
            <Icon.Close size={18} />
          </button>
        </div>

        <nav className="p-3 overflow-y-auto grow">
          {groups.map((g) => (
            <div key={g} className="mb-4">
              <div className="px-3.5 mb-1.5 text-[11px] font-extrabold text-slate-400 uppercase tracking-wide">{g}</div>
              <div className="space-y-1">
                {NAV.filter((n) => n.group === g).map((n) => {
                  const I = n.icon;
                  return (
                    <div
                      key={n.id}
                      className={`nav-item ${route === n.id ? 'nav-item-active' : ''}`}
                      onClick={() => go(n.id)}
                      role="button"
                      tabIndex={0}
                      onKeyDown={(e) => e.key === 'Enter' && go(n.id)}
                    >
                      <I size={20} />
                      <span>{n.name}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>

        <div className="p-3 border-t border-slate-100">
          <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-slate-50">
            {online ? <Icon.Wifi size={18} className="text-brand-600" /> : <Icon.WifiOff size={18} className="text-rose-500" />}
            <span className="text-xs font-bold text-slate-500">
              {online ? 'متصل بالإنترنت' : 'غير متصل — البيانات محفوظة محلياً'}
            </span>
          </div>
        </div>
      </aside>

      {menuOpen && <div className="fixed inset-0 bg-slate-900/40 z-30 lg:hidden" onClick={() => setMenuOpen(false)} />}

      {/* المحتوى */}
      <div className="grow min-w-0 flex flex-col">
        <header className="sticky top-0 z-20 bg-white/85 backdrop-blur border-b border-slate-200 no-print">
          <div className="flex items-center gap-3 px-4 sm:px-6 py-3">
            <button className="btn-ghost !px-2.5 !py-2 lg:hidden" onClick={() => setMenuOpen(true)} aria-label="القائمة">
              <Icon.Menu size={20} />
            </button>
            <div className="min-w-0">
              <h1 className="text-lg sm:text-xl font-extrabold text-slate-800 truncate">
                {NAV.find((n) => n.id === route)?.name || 'الرئيسية'}
              </h1>
              <p className="text-[11px] sm:text-xs text-slate-400 font-bold truncate">
                {profile.name ? `أ. ${profile.name}` : 'منصة المعلم الذكية'}
                {profile.school ? ` — ${profile.school}` : ''}
              </p>
            </div>
            <div className="mr-auto flex items-center gap-2">
              {!online && (
                <span className="chip bg-amber-50 text-amber-700 hidden sm:inline-flex">
                  <Icon.WifiOff size={14} /> وضع دون اتصال
                </span>
              )}
              <button className="btn-outline !px-3 !py-2" onClick={() => go('owner')} title="حساب المالك">
                <Icon.Crown size={18} />
              </button>
              <button className="btn-outline !px-3 !py-2" onClick={() => go('settings')} title="الإعدادات">
                <Icon.Settings size={18} />
              </button>
            </div>
          </div>
        </header>

        <main className="p-4 sm:p-6 grow">
          <div className="max-w-7xl mx-auto animate-fade-in">
            <Current key={route} go={go} params={routeParams} />
          </div>
        </main>

        <footer className="px-6 py-5 text-center text-xs text-slate-400 no-print">
          منصة المعلم الذكية — تعمل دون اتصال • البيانات محفوظة على جهازك (LocalStorage)
        </footer>
      </div>
    </div>
  );
}
