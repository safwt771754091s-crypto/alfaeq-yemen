// إعداد عامل pdf.js داخل المتصفح فقط (لا يعمل تحت Node في الاختبارات).
// في البناء العادي يُستخدم ملف العامل من الحزمة، وفي الملف المكتفي بذاته
// يُبنى كائن Blob من النسخة المضمّنة (window.__PDF_WORKER_B64__).
import workerUrl from 'pdfjs-dist/build/pdf.worker.min.mjs?url';
import { configurePdfWorker } from './pdfExtract.js';

const b64 = typeof window !== 'undefined' ? window.__PDF_WORKER_B64__ : null;
if (b64) {
  const bin = atob(b64);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  configurePdfWorker(URL.createObjectURL(new Blob([bytes], { type: 'text/javascript' })));
} else {
  configurePdfWorker(workerUrl);
}

export default true;
