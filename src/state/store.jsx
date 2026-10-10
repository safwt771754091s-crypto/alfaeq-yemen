import { createContext, useContext, useEffect, useMemo, useState, useCallback } from 'react';
import { loadKey, saveKey, uid, exportAll, importAll, clearAll } from '../lib/storage.js';

const AppContext = createContext(null);

const KEYS = {
  profile: 'profile',
  classes: 'classes',
  students: 'students',
  lessons: 'lessons',
  notebooks: 'notebooks',
  presentations: 'presentations',
  quizzes: 'quizzes',
  assessments: 'assessments',
  attendance: 'attendance',
  certificates: 'certificates',
  activity: 'activity',
  library: 'library',
  designs: 'designs',
  timetable: 'timetable',
  reminders: 'reminders',
  community: 'community',
  messages: 'messages',
  training: 'training',
  announcements: 'announcements',
  followups: 'followups'
};

const DEFAULT_PROFILE = {
  name: '',
  school: '',
  directorate: '',
  governorate: '',
  mainSubject: 'arabic',
  setupDone: false
};

function usePersistent(key, initial) {
  const [value, setValue] = useState(() => loadKey(key, initial));
  useEffect(() => {
    saveKey(key, value);
  }, [key, value]);
  return [value, setValue];
}

// مجموعة مُخزّنة مع عمليات الإضافة/التعديل/الحذف — تُستخدم للمكتبة والجدول والإشعارات وغيرها
function useCollection(key, logActivity, label) {
  const [items, setItems] = usePersistent(key, []);
  const add = useCallback((item) => {
    const row = { id: uid(key.slice(0, 3)), createdAt: new Date().toISOString(), ...item };
    setItems((prev) => [row, ...prev]);
    if (label) logActivity(`${label}: ${item.title || item.name || ''}`.trim());
    return row;
  }, [key, setItems, logActivity, label]);
  const update = useCallback((id, patch) => {
    setItems((prev) => prev.map((x) => (x.id === id ? { ...x, ...patch } : x)));
  }, [setItems]);
  const remove = useCallback((id) => {
    setItems((prev) => prev.filter((x) => x.id !== id));
  }, [setItems]);
  return { items, add, update, remove };
}

export function AppProvider({ children }) {
  const [profile, setProfile] = usePersistent(KEYS.profile, DEFAULT_PROFILE);
  const [classes, setClasses] = usePersistent(KEYS.classes, []);
  const [students, setStudents] = usePersistent(KEYS.students, []);
  const [lessons, setLessons] = usePersistent(KEYS.lessons, []);
  const [notebooks, setNotebooks] = usePersistent(KEYS.notebooks, []);
  const [presentations, setPresentations] = usePersistent(KEYS.presentations, []);
  const [quizzes, setQuizzes] = usePersistent(KEYS.quizzes, []);
  const [assessments, setAssessments] = usePersistent(KEYS.assessments, []);
  const [attendance, setAttendance] = usePersistent(KEYS.attendance, {});
  const [certificates, setCertificates] = usePersistent(KEYS.certificates, []);
  const [activity, setActivity] = usePersistent(KEYS.activity, []);

  const logActivity = useCallback((text) => {
    setActivity((prev) => [
      { id: uid('act'), text, at: new Date().toISOString() },
      ...prev
    ].slice(0, 40));
  }, [setActivity]);

  // ===== المجموعات الجديدة (مكتبة، استوديو، جدول، إشعارات، مجتمع، رسائل، تدريب، إعلانات، متابعة) =====
  const library = useCollection(KEYS.library, logActivity, 'مورد مكتبة');
  const designs = useCollection(KEYS.designs, logActivity, 'تصميم');
  const timetable = useCollection(KEYS.timetable, logActivity, 'حصة جدول');
  const reminders = useCollection(KEYS.reminders, logActivity, 'إشعار');
  const community = useCollection(KEYS.community, logActivity, 'منشور مجتمع');
  const messages = useCollection(KEYS.messages, logActivity, 'رسالة');
  const training = useCollection(KEYS.training, logActivity, 'دورة تدريبية');
  const announcements = useCollection(KEYS.announcements, logActivity, 'إعلان');
  const followups = useCollection(KEYS.followups, logActivity, 'متابعة');


  // ===== الملف الشخصي =====
  const saveProfile = useCallback((p) => {
    setProfile((prev) => ({ ...prev, ...p }));
  }, [setProfile]);

  // ===== الصفوف =====
  const addClass = useCallback((cls) => {
    const item = { id: uid('cls'), createdAt: new Date().toISOString(), ...cls };
    setClasses((prev) => [item, ...prev]);
    logActivity(`أُضيف صف جديد: ${cls.name || cls.grade}`);
    return item;
  }, [setClasses, logActivity]);

  const updateClass = useCallback((id, patch) => {
    setClasses((prev) => prev.map((c) => (c.id === id ? { ...c, ...patch } : c)));
  }, [setClasses]);

  const deleteClass = useCallback((id) => {
    setClasses((prev) => prev.filter((c) => c.id !== id));
    setStudents((prev) => prev.filter((s) => s.classId !== id));
  }, [setClasses, setStudents]);

  // ===== الطلاب =====
  const addStudent = useCallback((student) => {
    const item = { id: uid('std'), createdAt: new Date().toISOString(), ...student };
    setStudents((prev) => [...prev, item]);
    return item;
  }, [setStudents]);

  const addStudentsBulk = useCallback((list) => {
    const items = list.map((s) => ({ id: uid('std'), createdAt: new Date().toISOString(), ...s }));
    setStudents((prev) => [...prev, ...items]);
    return items;
  }, [setStudents]);

  const updateStudent = useCallback((id, patch) => {
    setStudents((prev) => prev.map((s) => (s.id === id ? { ...s, ...patch } : s)));
  }, [setStudents]);

  const deleteStudent = useCallback((id) => {
    setStudents((prev) => prev.filter((s) => s.id !== id));
  }, [setStudents]);

  // ===== التحضير =====
  const addLesson = useCallback((lesson) => {
    const item = { id: uid('les'), createdAt: new Date().toISOString(), ...lesson };
    setLessons((prev) => [item, ...prev]);
    logActivity(`تحضير جديد: ${lesson.title}`);
    return item;
  }, [setLessons, logActivity]);

  const updateLesson = useCallback((id, patch) => {
    setLessons((prev) => prev.map((l) => (l.id === id ? { ...l, ...patch } : l)));
  }, [setLessons]);

  const deleteLesson = useCallback((id) => {
    setLessons((prev) => prev.filter((l) => l.id !== id));
  }, [setLessons]);

  // ===== كراسة التحضير =====
  const addNotebook = useCallback((nb) => {
    const item = { id: uid('nbk'), createdAt: new Date().toISOString(), ...nb };
    setNotebooks((prev) => [item, ...prev]);
    logActivity(`كراسة تحضير: ${nb.meta?.subjectName || ''} ${nb.meta?.gradeName || ''}`.trim());
    return item;
  }, [setNotebooks, logActivity]);

  const updateNotebook = useCallback((id, patch) => {
    setNotebooks((prev) => prev.map((n) => (n.id === id ? { ...n, ...patch } : n)));
  }, [setNotebooks]);

  const deleteNotebook = useCallback((id) => {
    setNotebooks((prev) => prev.filter((n) => n.id !== id));
  }, [setNotebooks]);

  // ===== العروض التقديمية =====
  const addPresentation = useCallback((pres) => {
    const item = { id: uid('prs'), createdAt: new Date().toISOString(), ...pres };
    setPresentations((prev) => [item, ...prev]);
    logActivity(`عرض تقديمي جديد: ${pres.title}`);
    return item;
  }, [setPresentations, logActivity]);

  const deletePresentation = useCallback((id) => {
    setPresentations((prev) => prev.filter((p) => p.id !== id));
  }, [setPresentations]);

  const updatePresentation = useCallback((id, patch) => {
    setPresentations((prev) => prev.map((p) => (p.id === id ? { ...p, ...patch } : p)));
  }, [setPresentations]);

  // ===== الاختبارات =====
  const addQuiz = useCallback((quiz) => {
    const item = { id: uid('qz'), createdAt: new Date().toISOString(), ...quiz };
    setQuizzes((prev) => [item, ...prev]);
    logActivity(`اختبار جديد: ${quiz.title}`);
    return item;
  }, [setQuizzes, logActivity]);

  const updateQuiz = useCallback((id, patch) => {
    setQuizzes((prev) => prev.map((q) => (q.id === id ? { ...q, ...patch } : q)));
  }, [setQuizzes]);

  const deleteQuiz = useCallback((id) => {
    setQuizzes((prev) => prev.filter((q) => q.id !== id));
  }, [setQuizzes]);

  // ===== الرصد والتقييمات =====
  const addAssessment = useCallback((a) => {
    const item = { id: uid('asm'), createdAt: new Date().toISOString(), ...a };
    setAssessments((prev) => [item, ...prev]);
    return item;
  }, [setAssessments]);

  const updateAssessment = useCallback((id, patch) => {
    setAssessments((prev) => prev.map((a) => (a.id === id ? { ...a, ...patch } : a)));
  }, [setAssessments]);

  const deleteAssessment = useCallback((id) => {
    setAssessments((prev) => prev.filter((a) => a.id !== id));
  }, [setAssessments]);

  const setScore = useCallback((assessmentId, studentId, score) => {
    setAssessments((prev) => prev.map((a) => {
      if (a.id !== assessmentId) return a;
      const scores = { ...(a.scores || {}) };
      if (score === '' || score == null) delete scores[studentId];
      else scores[studentId] = Number(score);
      return { ...a, scores };
    }));
  }, [setAssessments]);

  // ===== الحضور =====
  const setAttendanceStatus = useCallback((classId, dateISO, studentId, status) => {
    setAttendance((prev) => {
      const cls = { ...(prev[classId] || {}) };
      const day = { ...(cls[dateISO] || {}) };
      if (status == null) delete day[studentId];
      else day[studentId] = status;
      cls[dateISO] = day;
      return { ...prev, [classId]: cls };
    });
  }, [setAttendance]);

  const markAllAttendance = useCallback((classId, dateISO, studentIds, status) => {
    setAttendance((prev) => {
      const cls = { ...(prev[classId] || {}) };
      const day = { ...(cls[dateISO] || {}) };
      studentIds.forEach((sid) => { day[sid] = status; });
      cls[dateISO] = day;
      return { ...prev, [classId]: cls };
    });
  }, [setAttendance]);

  // ===== الشهادات =====
  const addCertificate = useCallback((c) => {
    const item = { id: uid('crt'), createdAt: new Date().toISOString(), ...c };
    setCertificates((prev) => [item, ...prev]);
    return item;
  }, [setCertificates]);

  const deleteCertificate = useCallback((id) => {
    setCertificates((prev) => prev.filter((c) => c.id !== id));
  }, [setCertificates]);

  // ===== نسخ احتياطي =====
  const backup = useCallback(() => exportAll(), []);
  const restore = useCallback((data) => {
    importAll(data);
    window.location.reload();
  }, []);
  const wipe = useCallback(() => {
    // نحافظ على حسابات المستخدمين حتى يبقى المالك مرتبطاً بالمنصة
    clearAll(['users']);
    window.location.reload();
  }, []);

  const value = useMemo(() => ({
    profile, saveProfile,
    classes, addClass, updateClass, deleteClass,
    students, addStudent, addStudentsBulk, updateStudent, deleteStudent,
    lessons, addLesson, updateLesson, deleteLesson,
    notebooks, addNotebook, updateNotebook, deleteNotebook,
    presentations, addPresentation, updatePresentation, deletePresentation,
    quizzes, addQuiz, updateQuiz, deleteQuiz,
    assessments, addAssessment, updateAssessment, deleteAssessment, setScore,
    attendance, setAttendanceStatus, markAllAttendance,
    certificates, addCertificate, deleteCertificate,
    activity, logActivity,
    library, designs, timetable, reminders, community, messages, training, announcements, followups,
    backup, restore, wipe
  }), [
    profile, saveProfile, classes, addClass, updateClass, deleteClass,
    students, addStudent, addStudentsBulk, updateStudent, deleteStudent,
    lessons, addLesson, updateLesson, deleteLesson,
    notebooks, addNotebook, updateNotebook, deleteNotebook,
    presentations, addPresentation, updatePresentation, deletePresentation,
    quizzes, addQuiz, updateQuiz, deleteQuiz,
    assessments, addAssessment, updateAssessment, deleteAssessment, setScore,
    attendance, setAttendanceStatus, markAllAttendance,
    certificates, addCertificate, deleteCertificate,
    activity, logActivity,
    library, designs, timetable, reminders, community, messages, training, announcements, followups,
    backup, restore, wipe
  ]);

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
}
