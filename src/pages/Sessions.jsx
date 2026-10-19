import { useEffect, useState } from 'react';
import Icon from '../components/Icon.jsx';
import { Card, SectionHeader, StatCard, useToast, Confirm, EmptyState } from '../components/UI.jsx';
import { useAuth } from '../state/auth.jsx';
import {
  getSessions, getEvents, sessionStats, userSessionSummary, subscribeSessions, clearSessions
} from '../lib/sessionTrack.js';
import { formatDate } from '../lib/utils.js';

const METHOD_LABELS = { pin: 'رمز دخول', otp: 'رمز تحقق', register: 'تسجيل جديد' };

function timeAgo(iso) {
  if (!iso) return '—';
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return 'الآن';
  if (m < 60) return `قبل ${m} دقيقة`;
  const h = Math.floor(m / 60);
  if (h < 24) return `قبل ${h} ساعة`;
  return formatDate(String(iso).slice(0, 10));
}

function fmt(iso) {
  if (!iso) return '—';
  const d = new Date(iso);
  return `${d.toLocaleDateString('ar-EG')} ${d.toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' })}`;
}

export default function Sessions() {
  const { users, isOwner, currentUser } = useAuth();
  const toast = useToast();
  const [tick, setTick] = useState(0);
  const [confirm, setConfirm] = useState(false);
  useEffect(() => subscribeSessions(() => setTick((t) => t + 1)), []);

  if (!isOwner && !(currentUser?.permissions || []).includes('sessions')) {
    return <EmptyState icon={Icon.Lock} title="سجل الجلسات للمالك فقط" subtitle="تحتاج صلاحية «الجلسات والنشاط»." />;
  }

  const stats = sessionStats();
  const perUser = userSessionSummary(users);
  const sessions = getSessions();
  const events = getEvents();

  return (
    <div className="space-y-5" data-tick={tick}>
      <SectionHeader icon={Icon.Eye} title="الجلسات والنشاط"
        subtitle="من سجّل الدخول، من نشط الآن، وأي صفحة يستخدم"
        actions={<button className="btn-ghost !px-3 !py-2 text-xs text-rose-600" onClick={() => setConfirm(true)}><Icon.Trash size={15} /> تفريغ السجل</button>} />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard icon={Icon.Users} label="مستخدمون الآن" value={stats.activeUsers} tone="brand" sub={`${stats.active} جلسة نشطة`} />
        <StatCard icon={Icon.LogOut} label="دخولات اليوم" value={stats.loginsToday} tone="sky" />
        <StatCard icon={Icon.Users} label="إجمالي الحسابات المسجّلة" value={stats.uniqueUsers} tone="violet" />
        <StatCard icon={Icon.Chart} label="إجمالي الجلسات" value={stats.total} tone="amber" />
      </div>

      <Card className="p-5">
        <div className="section-title mb-3"><Icon.Users size={18} /> حالة المستخدمين</div>
        <div className="divide-y divide-slate-100">
          {perUser.map(({ user, logins, lastLoginAt, lastSeen, online, currentPageName }) => (
            <div key={user.id} className="flex items-center gap-3 py-3 flex-wrap">
              <span className={`grid place-items-center w-10 h-10 rounded-2xl text-white font-extrabold shrink-0 ${user.role === 'owner' ? 'bg-gradient-to-br from-sand-500 to-sand-600' : user.role === 'student' ? 'bg-gradient-to-br from-sky-500 to-sky-700' : 'bg-gradient-to-br from-brand-500 to-brand-700'}`}>
                {(user.name || user.username || 'م').slice(0, 1)}
              </span>
              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-extrabold text-slate-800">{user.name || user.username}</span>
                  <span className="chip bg-slate-100 text-slate-600">{user.roleLabel}</span>
                  {online ? <span className="chip bg-emerald-50 text-emerald-700"><span className="w-2 h-2 rounded-full bg-emerald-500 inline-block" /> نشط الآن</span>
                    : <span className="chip bg-slate-100 text-slate-500">غير نشط</span>}
                  {!user.verified?.email && !user.verified?.phone && user.role !== 'owner' && <span className="chip bg-amber-50 text-amber-700">غير موثّق</span>}
                </div>
                <div className="text-xs text-slate-400 font-bold mt-0.5">
                  {online && currentPageName ? <>يستخدم الآن: <b className="text-brand-700">{currentPageName}</b></> : <>آخر ظهور: {timeAgo(lastSeen)}</>}
                  {user.email ? <> • {user.email}</> : ''}{user.phone ? <> • {user.phone}</> : ''}
                </div>
              </div>
              <div className="mr-auto text-left">
                <div className="text-xs font-bold text-slate-500">عدد الدخولات: <b className="text-slate-800">{logins}</b></div>
                <div className="text-[11px] text-slate-400 font-bold">آخر دخول: {lastLoginAt ? timeAgo(lastLoginAt) : '—'}</div>
              </div>
            </div>
          ))}
        </div>
      </Card>

      <div className="grid lg:grid-cols-2 gap-4">
        <Card className="p-5">
          <div className="section-title mb-3"><Icon.Chart size={18} /> الصفحات الأكثر استخداماً</div>
          {stats.byPage.length === 0 ? <p className="text-sm text-slate-400 font-bold">لا بيانات بعد.</p> : (
            <div className="space-y-2">
              {stats.byPage.slice(0, 10).map(([name, count]) => (
                <div key={name} className="flex items-center gap-3">
                  <span className="text-sm font-bold text-slate-600 w-40 truncate">{name}</span>
                  <div className="grow h-2.5 rounded-full bg-slate-100 overflow-hidden">
                    <div className="h-full bg-brand-500" style={{ width: `${Math.min(100, (count / stats.byPage[0][1]) * 100)}%` }} />
                  </div>
                  <span className="text-xs font-extrabold text-slate-500 w-8 text-left">{count}</span>
                </div>
              ))}
            </div>
          )}
        </Card>

        <Card className="p-5">
          <div className="section-title mb-3"><Icon.ListChecks size={18} /> أحدث الأحداث (دخول/خروج)</div>
          {events.length === 0 ? <p className="text-sm text-slate-400 font-bold">لا أحداث بعد.</p> : (
            <div className="space-y-1.5 max-h-72 overflow-y-auto">
              {events.slice(0, 30).map((e) => (
                <div key={e.id} className="flex items-center gap-2 text-sm rounded-xl bg-slate-50 px-3 py-2">
                  <span className={`grid place-items-center w-6 h-6 rounded-full text-white shrink-0 ${e.type === 'login' ? 'bg-emerald-500' : 'bg-slate-400'}`}>
                    {e.type === 'login' ? <Icon.Check size={13} /> : <Icon.LogOut size={13} />}
                  </span>
                  <span className="font-bold text-slate-700 truncate">{e.text}</span>
                  <span className="mr-auto text-[11px] text-slate-400 font-bold shrink-0">{timeAgo(e.at)}</span>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>

      <Card className="p-5">
        <div className="section-title mb-3"><Icon.Eye size={18} /> سجل الجلسات التفصيلي</div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-right text-xs text-slate-400 font-extrabold border-b border-slate-100">
                <th className="py-2 px-2">المستخدم</th>
                <th className="py-2 px-2">الطريقة</th>
                <th className="py-2 px-2">الدخول</th>
                <th className="py-2 px-2">آخر نشاط</th>
                <th className="py-2 px-2">الخروج</th>
                <th className="py-2 px-2">الصفحة</th>
              </tr>
            </thead>
            <tbody>
              {sessions.slice(0, 40).map((s) => (
                <tr key={s.id} className="border-b border-slate-50">
                  <td className="py-2 px-2 font-bold text-slate-700">{s.name || s.username}</td>
                  <td className="py-2 px-2 text-slate-500">{METHOD_LABELS[s.method] || s.method}</td>
                  <td className="py-2 px-2 text-slate-500 text-xs">{fmt(s.loginAt)}</td>
                  <td className="py-2 px-2 text-slate-500 text-xs">{fmt(s.lastSeen)}</td>
                  <td className="py-2 px-2 text-xs">{s.logoutAt ? <span className="text-slate-400">{fmt(s.logoutAt)}</span> : <span className="text-emerald-600 font-bold">نشطة</span>}</td>
                  <td className="py-2 px-2 text-slate-500 text-xs">{s.pageName || '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      <Confirm open={confirm} onClose={() => setConfirm(false)} onConfirm={() => { clearSessions(); toast.push('تم تفريغ سجل الجلسات'); }}
        title="تفريغ سجل الجلسات" message="سيتم حذف كل سجل الدخول والنشاط. لا يؤثر على الحسابات. متابعة؟" />
      {toast.view}
    </div>
  );
}
