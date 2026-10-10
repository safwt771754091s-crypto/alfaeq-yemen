// أيقونات SVG مضمّنة (بدون مكتبات خارجية) — تعمل دون اتصال
const base = {
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.9,
  strokeLinecap: 'round',
  strokeLinejoin: 'round'
};

function Svg({ children, size = 22, className = '' }) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} className={className} {...base}>
      {children}
    </svg>
  );
}

export const Icon = {
  Home: (p) => <Svg {...p}><path d="M3 10.5 12 3l9 7.5" /><path d="M5 9.5V21h14V9.5" /><path d="M9.5 21v-6h5v6" /></Svg>,
  Book: (p) => <Svg {...p}><path d="M4 4.5A1.5 1.5 0 0 1 5.5 3H19v18H5.5A1.5 1.5 0 0 1 4 19.5z" /><path d="M8 3v18" /></Svg>,
  Sparkles: (p) => <Svg {...p}><path d="M12 3l1.8 4.6L18.5 9l-4.7 1.4L12 15l-1.8-4.6L5.5 9l4.7-1.4z" /><path d="M18.5 15.5l.8 2 2 .8-2 .8-.8 2-.8-2-2-.8 2-.8z" /></Svg>,
  Slides: (p) => <Svg {...p}><rect x="3" y="4" width="18" height="12" rx="2" /><path d="M12 16v4" /><path d="M8 20h8" /></Svg>,
  Check: (p) => <Svg {...p}><path d="M20 6 9 17l-5-5" /></Svg>,
  CheckCircle: (p) => <Svg {...p}><circle cx="12" cy="12" r="9" /><path d="M8.5 12.5l2.5 2.5 4.5-5" /></Svg>,
  Clipboard: (p) => <Svg {...p}><rect x="7" y="4" width="10" height="4" rx="1" /><path d="M8 6H6a2 2 0 0 0-2 2v11a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-2" /><path d="M9 13h6" /><path d="M9 17h4" /></Svg>,
  Calendar: (p) => <Svg {...p}><rect x="3" y="5" width="18" height="16" rx="2" /><path d="M8 3v4M16 3v4M3 10h18" /></Svg>,
  Award: (p) => <Svg {...p}><circle cx="12" cy="9" r="5" /><path d="M8.5 13.5 7 21l5-3 5 3-1.5-7.5" /></Svg>,
  Settings: (p) => <Svg {...p}><circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.6 1.6 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.6 1.6 0 0 0-2.7 1.1V21a2 2 0 1 1-4 0v-.1A1.6 1.6 0 0 0 7 19.4a1.6 1.6 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1A1.6 1.6 0 0 0 3 15H3a2 2 0 1 1 0-4h.1A1.6 1.6 0 0 0 4.6 7a1.6 1.6 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1A1.6 1.6 0 0 0 9 3.6V3a2 2 0 1 1 4 0v.1A1.6 1.6 0 0 0 15 4.6a1.6 1.6 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1A1.6 1.6 0 0 0 20.4 9H21a2 2 0 1 1 0 4h-.1a1.6 1.6 0 0 0-1.5 1z" /></Svg>,
  Users: (p) => <Svg {...p}><circle cx="9" cy="8" r="3.5" /><path d="M2.5 20a6.5 6.5 0 0 1 13 0" /><path d="M17 4.5a3.5 3.5 0 0 1 0 7" /><path d="M18 20a6.5 6.5 0 0 0-3-5.5" /></Svg>,
  Plus: (p) => <Svg {...p}><path d="M12 5v14M5 12h14" /></Svg>,
  Trash: (p) => <Svg {...p}><path d="M4 7h16" /><path d="M9 7V5a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" /><path d="M6 7l1 13a1 1 0 0 0 1 1h8a1 1 0 0 0 1-1l1-13" /></Svg>,
  Edit: (p) => <Svg {...p}><path d="M12 20h9" /><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z" /></Svg>,
  Download: (p) => <Svg {...p}><path d="M12 3v12" /><path d="M7 10l5 5 5-5" /><path d="M4 21h16" /></Svg>,
  Upload: (p) => <Svg {...p}><path d="M12 15V3" /><path d="M7 8l5-5 5 5" /><path d="M4 21h16" /></Svg>,
  Print: (p) => <Svg {...p}><path d="M6 9V3h12v6" /><rect x="4" y="9" width="16" height="8" rx="2" /><path d="M8 17h8v4H8z" /></Svg>,
  Close: (p) => <Svg {...p}><path d="M6 6l12 12M18 6 6 18" /></Svg>,
  Search: (p) => <Svg {...p}><circle cx="11" cy="11" r="7" /><path d="m20 20-3.5-3.5" /></Svg>,
  ChevronDown: (p) => <Svg {...p}><path d="m6 9 6 6 6-6" /></Svg>,
  ChevronLeft: (p) => <Svg {...p}><path d="m15 6-6 6 6 6" /></Svg>,
  ChevronRight: (p) => <Svg {...p}><path d="m9 6 6 6-6 6" /></Svg>,
  Menu: (p) => <Svg {...p}><path d="M4 7h16M4 12h16M4 17h16" /></Svg>,
  Wifi: (p) => <Svg {...p}><path d="M5 12.5a10 10 0 0 1 14 0" /><path d="M8.5 16a5 5 0 0 1 7 0" /><circle cx="12" cy="19.5" r="1" /></Svg>,
  WifiOff: (p) => <Svg {...p}><path d="M3 3l18 18" /><path d="M8.5 16a5 5 0 0 1 7 0" /><path d="M5 12.5a10 10 0 0 1 5-2.7" /><path d="M14 9.8a10 10 0 0 1 5 2.7" /><circle cx="12" cy="19.5" r="1" /></Svg>,
  Clock: (p) => <Svg {...p}><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></Svg>,
  Chart: (p) => <Svg {...p}><path d="M4 20V10M10 20V4M16 20v-7M22 20H2" /></Svg>,
  Target: (p) => <Svg {...p}><circle cx="12" cy="12" r="9" /><circle cx="12" cy="12" r="5" /><circle cx="12" cy="12" r="1" /></Svg>,
  Lightbulb: (p) => <Svg {...p}><path d="M9 18h6" /><path d="M10 21h4" /><path d="M12 3a6 6 0 0 1 4 10.5c-.7.7-1 1.3-1 2.5H9c0-1.2-.3-1.8-1-2.5A6 6 0 0 1 12 3z" /></Svg>,
  Presentation: (p) => <Svg {...p}><path d="M3 4h18" /><path d="M4 4v10a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V4" /><path d="M12 16v4" /><path d="M8.5 20 12 16l3.5 4" /></Svg>,
  School: (p) => <Svg {...p}><path d="M12 3 2 9l10 6 10-6z" /><path d="M6 12v5c0 1.5 2.7 3 6 3s6-1.5 6-3v-5" /></Svg>,
  Star: (p) => <Svg {...p}><path d="M12 3.5 14.7 9l6 .8-4.4 4.2 1 6-5.3-2.9L6.7 20l1-6L3.3 9.8 9.3 9z" /></Svg>,
  Refresh: (p) => <Svg {...p}><path d="M20 11a8 8 0 1 0-1.5 5" /><path d="M20 5v6h-6" /></Svg>,
  Copy: (p) => <Svg {...p}><rect x="9" y="9" width="11" height="11" rx="2" /><path d="M5 15V5a2 2 0 0 1 2-2h10" /></Svg>,
  Info: (p) => <Svg {...p}><circle cx="12" cy="12" r="9" /><path d="M12 11v5M12 8h.01" /></Svg>,
  Eye: (p) => <Svg {...p}><path d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12z" /><circle cx="12" cy="12" r="3" /></Svg>,
  Filter: (p) => <Svg {...p}><path d="M4 5h16l-6 8v6l-4-2v-4z" /></Svg>,
  File: (p) => <Svg {...p}><path d="M6 3h8l4 4v14H6z" /><path d="M14 3v4h4" /></Svg>,
  X: (p) => <Svg {...p}><path d="M6 6l12 12M18 6 6 18" /></Svg>,
  TrendUp: (p) => <Svg {...p}><path d="M3 17l6-6 4 4 8-8" /><path d="M15 7h6v6" /></Svg>,
  Shield: (p) => <Svg {...p}><path d="M12 3l7 3v5c0 4.5-3 8-7 10-4-2-7-5.5-7-10V6z" /><path d="M9.5 12l2 2 3.5-4" /></Svg>,
  Lock: (p) => <Svg {...p}><rect x="5" y="11" width="14" height="10" rx="2" /><path d="M8 11V8a4 4 0 0 1 8 0v3" /><path d="M12 15v2" /></Svg>,
  Key: (p) => <Svg {...p}><circle cx="8" cy="15" r="4" /><path d="M11 12 20 3" /><path d="M17 6l2 2" /><path d="M15 8l2 2" /></Svg>,
  LogOut: (p) => <Svg {...p}><path d="M15 4h3a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2h-3" /><path d="M10 12h10" /><path d="M13 9l3 3-3 3" /></Svg>,
  Crown: (p) => <Svg {...p}><path d="M4 18h16" /><path d="M4 18 3 7l5 4 4-7 4 7 5-4-1 11" /></Svg>,
  Library: (p) => <Svg {...p}><path d="M5 3h3v18H5z" /><path d="M10.5 3h3v18h-3z" /><path d="m16 4 3 .8L17.4 21l-3-.8z" /><path d="M3 21h18" /></Svg>,
  Palette: (p) => <Svg {...p}><path d="M12 3a9 9 0 0 0 0 18c1.4 0 2-.9 2-1.8 0-.5-.2-.9-.5-1.2-.3-.3-.5-.7-.5-1.2 0-.9.7-1.6 1.6-1.6H16a5 5 0 0 0 5-5c0-3.9-4-7.2-9-7.2z" /><circle cx="7.5" cy="11" r="1" /><circle cx="10.5" cy="7.5" r="1" /><circle cx="15" cy="7.5" r="1" /><circle cx="17.5" cy="11" r="1" /></Svg>,
  Bell: (p) => <Svg {...p}><path d="M6 9a6 6 0 0 1 12 0c0 4 1.5 5.5 2 6H4c.5-.5 2-2 2-6z" /><path d="M10 19a2 2 0 0 0 4 0" /></Svg>,
  Message: (p) => <Svg {...p}><path d="M4 5h16v11H9l-5 4z" /><path d="M8 9h8M8 12h5" /></Svg>,
  GraduationCap: (p) => <Svg {...p}><path d="M12 4 2 9l10 5 10-5z" /><path d="M6 11.5V16c0 1.4 2.7 2.5 6 2.5s6-1.1 6-2.5v-4.5" /><path d="M22 9v5" /></Svg>,
  Megaphone: (p) => <Svg {...p}><path d="M4 10v4a1 1 0 0 0 1 1h2l9 4V5L7 9H5a1 1 0 0 0-1 1z" /><path d="M7 15v4a1 1 0 0 0 1 1h2v-4" /></Svg>,
  Gamepad: (p) => <Svg {...p}><rect x="2" y="7" width="20" height="11" rx="4" /><path d="M7 11v4M5 13h4" /><circle cx="16" cy="12" r="1" /><circle cx="18.5" cy="14" r="1" /></Svg>,
  Folder: (p) => <Svg {...p}><path d="M3 6a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" /></Svg>,
  Image: (p) => <Svg {...p}><rect x="3" y="4" width="18" height="16" rx="2" /><circle cx="8.5" cy="9.5" r="1.5" /><path d="m4 18 5-5 4 4 3-3 4 4" /></Svg>,
  Send: (p) => <Svg {...p}><path d="M4 12 21 4l-7 17-3-7z" /><path d="M11 14l10-10" /></Svg>,
  Heart: (p) => <Svg {...p}><path d="M12 20s-7-4.5-7-9.5A4 4 0 0 1 12 7a4 4 0 0 1 7 3.5C19 15.5 12 20 12 20z" /></Svg>,
  ListChecks: (p) => <Svg {...p}><path d="M4 6h1.5M4 12h1.5M4 18h1.5" /><path d="M9 6h11M9 12h11M9 18h11" /></Svg>,
  Grid: (p) => <Svg {...p}><rect x="3" y="3" width="7" height="7" rx="1" /><rect x="14" y="3" width="7" height="7" rx="1" /><rect x="3" y="14" width="7" height="7" rx="1" /><rect x="14" y="14" width="7" height="7" rx="1" /></Svg>,
  Play: (p) => <Svg {...p}><path d="M7 4l13 8-13 8z" /></Svg>
};

export default Icon;
