import { useEffect, useState } from 'react';
import Icon from './components/Icon.jsx';
import { useApp } from './state/store.jsx';
import { useAuth } from './state/auth.jsx';
import Login from './pages/Login.jsx';
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
import Library from './pages/Library.jsx';
import DesignStudio from './pages/DesignStudio.jsx';
import Timetable from './pages/Timetable.jsx';
import Reminders from './pages/Reminders.jsx';
import Community from './pages/Community.jsx';
import Messages from './pages/Messages.jsx';
import Training from './pages/Training.jsx';
import Announcements from './pages/Announcements.jsx';
import Reports from './pages/Reports.jsx';
import ActivityLog from './pages/ActivityLog.jsx';
import Followups from './pages/Followups.jsx';
import MathGames from './pages/MathGames.jsx';
import Users from './pages/Users.jsx';

const NAV = [
  { id: 'dashboard', name: 'لوحة التحكم', icon: Icon.Home, group: 'عام' },
  { id: 'followups', name: 'المتابعة', icon: Icon.ListChecks, group: 'عام' },
  { id: 'messages', name: 'الرسائل', icon: Icon.Message, group: 'عام' },
  { id: 'library', name: 'المكتبة', icon: Icon.Library, group: 'عام' },
  { id: 'training', name: 'التدريب', icon: Icon.GraduationCap, group: 'عام' },
  { id: 'design', name: 'استوديو التصميم', icon: Icon.Palette, group: 'عام' },

  { id: 'curriculum', name: 'المنهج اليمني', icon: Icon.Book, group: 'التخطيط' },
  { id: 'planner', name: 'التحضير الذكي', icon: Icon.Sparkles, group: 'التخطيط' },
  { id: 'notebook', name: 'كراسة التحضير', icon: Icon.Clipboard, group: 'التخطيط' },
  { id: 'presentations', name: 'العروض التقديمية', icon: Icon.Slides, group: 'التخطيط' },
  { id: 'timetable', name: 'الجدول الدراسي', icon: Icon.Calendar, group: 'التخطيط' },

  { id: 'grader', name: 'التصحيح الذكي', icon: Icon.CheckCircle, group: 'التقييم' },
  { id: 'gradebook', name: 'سجل الدرجات', icon: Icon.Clipboard, group: 'السجلات' },
  { id: 'attendance', name: 'الحضور والغياب', icon: Icon.Calendar, group: 'السجلات' },
  { id: 'certificates', name: 'الشهادات', icon: Icon.Award, group: 'السجلات' },
  { id: 'reports', name: 'التقارير', icon: Icon.Chart, group: 'السجلات' },
  { id: 'activity', name: 'سجل النشاط', icon: Icon.ListChecks, group: 'السجلات' },

  { id: 'community', name: 'المجتمع', icon: Icon.Users, group: 'تواصل' },
  { id: 'announcements', name: 'الإعلانات', icon: Icon.Megaphone, group: 'تواصل' },
  { id: 'reminders', name: 'الإشعارات', icon: Icon.Bell, group: 'تواصل' },

  { id: 'mathgames', name: 'ألعاب الرياضيات', icon: Icon.Gamepad, group: 'أنشطة' },

  { id: 'classes', name: 'الصفوف والطلاب', icon: Icon.Users, group: 'الإعداد' },
  { id: 'users', name: 'المستخدمون والصلاحيات', icon: Icon.Shield, group: 'الإعداد' },
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
  settings: Settings,
  library: Library,
  design: DesignStudio,
  timetable: Timetable,
  reminders: Reminders,
  community: Community,
  messages: Messages,
  training: Training,
  announcements: Announcements,
  reports: Reports,
  activity: ActivityLog,
  followups: Followups,
  users: Users,
  mathgames: MathGames
};

function useOnline() {
  const [online, setOnline] = useState(typeof navigator !== 'undefined' ? navigator.onLine : true);
  useEffect(() => {
    const on = () => setOnline(true);
    const off = () => setOnline(false);
    window.addEventListener('online', on);
    window.addEventListener('offline', off);
    return () => {
      window.removeEventListener('online', on);
      window.removeEventListener('offline', off);
    };
  }, []);
  return online;
}

function AccessDenied({ title, message, onLogout }) {
  return (
    <div className="min-h-screen grid place-items-center p-6" dir="rtl">
      <div className="card p-8 max-w-md text-center">
        <span className="inline-grid place-items-center w-16 h-16 rounded-3xl bg-rose-50 text-rose-600 mb-3">
          <Icon.Lock size={32} />
        </span>
        <h2 className="text-xl font-extrabold text-slate-800">{title}</h2>
        <p className="text-slate-500 font-bold mt-2 leading-relaxed">{message}</p>
        {onLogout && (
          <button className="btn-outline mt-4" onClick={onLogout}><Icon.LogOut size={18} /> تسجيل الخروج</button>
        )}
      </div>
    </div>
  );
}

export default function App() {
  const { profile, logActivity } = useApp();
  const { isAuthed, currentUser, owner, isOwner, can, logout } = useAuth();
  const [route, setRoute] = useState('dashboard');
  const [routeParams, setRouteParams] = useState({});
  const [menuOpen, setMenuOpen] = useState(false);
  const online = useOnline();

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
    setMenuOpen(false);
  }, [route]);

  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') setMenuOpen(false); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  // تسجيل الدخول مطلوب أولاً
  if (!isAuthed) {
    return <Login />;
  }

  // الإعداد الأولي يُطلب من مالك المنصة فقط
  if (!profile.setupDone) {
    if (!isOwner) {
      return <AccessDenied title="المنصة غير مهيّأة" message="لم يكتمل إعداد المنصة بعد. من فضلك سجّل الدخول بحساب المالك لإكمال الإعداد الأولي." onLogout={logout} />;
    }
    return <Onboarding onDone={() => { logActivity('تم إعداد الحساب'); setRoute('dashboard'); }} />;
  }

  const ownerName = owner?.name || 'صفوت محمد عبدالعزيز البريهي';
  const visibleNav = NAV.filter((n) => can(n.id) || n.id === 'owner');
  const groups = [...new Set(visibleNav.map((n) => n.group))];
  const routeAllowed = can(route) || route === 'owner' || route === 'dashboard';
  const Current = routeAllowed ? (PAGES[route] || Dashboard) : Dashboard;

  const go = (id, params = {}) => {
    setRouteParams(params || {});
    setRoute(id);
  };

  const doLogout = () => {
    logActivity('تسجيل خروج');
    logout();
  };

  return (
    <div className="min-h-screen" dir="rtl">
      {/* خلفية معتمة عند فتح القائمة */}
      {menuOpen && (
        <div
          className="no-print fixed inset-0 bg-slate-900/45 backdrop-blur-[1px] z-40"
          onClick={() => setMenuOpen(false)}
        />
      )}

      {/* لوحة التنقل — منسدلة من جهة اليمين، تُفتح بزر الاختصار وتُغلق بنفس الزر */}
      <aside
        className={`no-print fixed inset-y-0 right-0 w-72 max-w-[82vw] z-50 bg-white border-l border-slate-200 shadow-2xl flex flex-col
        transition-transform duration-300 ease-out ${menuOpen ? 'translate-x-0' : 'translate-x-full'}`}
        aria-hidden={!menuOpen}
      >
        <div className="px-4 py-4 border-b border-slate-100 flex items-center gap-3">
          <span className="grid place-items-center w-11 h-11 rounded-2xl bg-gradient-to-br from-brand-500 to-brand-700 text-white shadow-soft">
            <Icon.School size={24} />
          </span>
          <div className="min-w-0">
            <div className="font-extrabold text-slate-800 leading-tight">منصة المعلم الذكية</div>
            <div className="text-[11px] text-slate-400 font-bold">للمعلم اليمني</div>
          </div>
          <button className="btn-ghost !px-2.5 !py-2 mr-auto" onClick={() => setMenuOpen(false)} aria-label="إغلاق القائمة">
            <Icon.Close size={18} />
          </button>
        </div>

        <nav className="p-3 overflow-y-auto grow">
          {groups.map((g) => (
            <div key={g} className="mb-4">
              <div className="px-3.5 mb-1.5 text-[11px] font-extrabold text-slate-400 uppercase tracking-wide">{g}</div>
              <div className="space-y-1">
                {visibleNav.filter((n) => n.group === g).map((n) => {
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

        <div className="p-3 border-t border-slate-100 space-y-2">
          <div className="flex items-center gap-3 px-3 py-2.5 rounded-xl bg-slate-50">
            <span className={`grid place-items-center w-10 h-10 rounded-full text-white font-extrabold shrink-0 ${isOwner ? 'bg-gradient-to-br from-sand-500 to-sand-600' : 'bg-gradient-to-br from-brand-500 to-brand-700'}`}>
              {(currentUser?.name || 'م').slice(0, 1)}
            </span>
            <div className="min-w-0">
              <div className="font-extrabold text-slate-800 text-sm truncate">{currentUser?.name || 'المعلم'}</div>
              <div className="text-[11px] text-slate-400 font-bold flex items-center gap-1">
                <Icon.Shield size={12} /> {currentUser?.roleLabel || 'معلم'}
              </div>
            </div>
          </div>

          {/* مالك المنصة — ثابت دائماً */}
          <div className="flex items-center gap-3 px-3 py-2.5 rounded-xl bg-sand-50 ring-1 ring-sand-100">
            <span className="grid place-items-center w-9 h-9 rounded-full bg-gradient-to-br from-sand-500 to-sand-600 text-white shrink-0">
              <Icon.Crown size={18} />
            </span>
            <div className="min-w-0">
              <div className="text-[10px] text-sand-600 font-extrabold">مالك المنصة</div>
              <div className="font-extrabold text-slate-800 text-[13px] truncate">{ownerName}</div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <button className="btn-ghost !py-2 text-xs" onClick={() => go('dashboard')}>
              <Icon.Home size={16} /> الرئيسية
            </button>
            <button className="btn-ghost !py-2 text-xs text-rose-600" onClick={doLogout}>
              <Icon.LogOut size={16} /> خروج
            </button>
          </div>

          <div className="flex items-center gap-2 px-3 py-1.5">
            {online ? <Icon.Wifi size={16} className="text-brand-600" /> : <Icon.WifiOff size={16} className="text-rose-500" />}
            <span className="text-[11px] font-bold text-slate-400">
              {online ? 'متصل بالإنترنت' : 'غير متصل — البيانات محفوظة محلياً'}
            </span>
          </div>
        </div>
      </aside>

      {/* المحتوى — بعرض كامل دائماً، لا يغطيه أي شيء إلا عند فتح القائمة */}
      <div className="min-h-screen flex flex-col">
        <header className="sticky top-0 z-30 bg-white/85 backdrop-blur border-b border-slate-200 no-print">
          <div className="flex items-center gap-3 px-4 sm:px-6 py-3">
            <button
              className="btn-outline !px-3 !py-2 shrink-0"
              onClick={() => setMenuOpen((v) => !v)}
              aria-label="القائمة"
              aria-expanded={menuOpen}
              title="القائمة"
            >
              {menuOpen ? <Icon.Close size={20} /> : <Icon.Menu size={20} />}
            </button>
            <div className="min-w-0">
              <h1 className="text-lg sm:text-xl font-extrabold text-slate-800 truncate">
                {NAV.find((n) => n.id === route)?.name || 'الرئيسية'}
              </h1>
              <p className="text-[11px] sm:text-xs text-slate-400 font-bold truncate">
                {currentUser?.name ? `أ. ${currentUser.name}` : 'منصة المعلم الذكية'} — مالك المنصة: {ownerName}
              </p>
            </div>
            <div className="mr-auto flex items-center gap-2">
              {!online && (
                <span className="chip bg-amber-50 text-amber-700 hidden sm:inline-flex">
                  <Icon.WifiOff size={14} /> وضع دون اتصال
                </span>
              )}
              <button className="btn-outline !px-3 !py-2" onClick={() => go('owner')} title={`مالك المنصة: ${ownerName}`}>
                <Icon.Crown size={18} />
              </button>
              <button className="btn-outline !px-3 !py-2" onClick={() => go('settings')} title="الإعدادات">
                <Icon.Settings size={18} />
              </button>
              <button className="btn-outline !px-3 !py-2 text-rose-600" onClick={doLogout} title="تسجيل الخروج">
                <Icon.LogOut size={18} />
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
