import {useEffect, useMemo, useRef, useState} from 'react';
import {motion, AnimatePresence} from 'motion/react';
import {dataset} from './data';
import {fbImages, FbImage} from './fbImages';
import {evaluationFiles} from './evaluationData';
import {SubjectPlan, UnitPlanItem} from './types';
import {
  BookOpen,
  Building,
  Check,
  CheckCircle2,
  ChevronDown,
  ClipboardList,
  Copy,
  Download,
  FileCheck,
  FileText,
  FolderOpen,
  GraduationCap,
  Layers,
  Link2,
  Moon,
  RotateCcw,
  Search,
  SlidersHorizontal,
  Sparkles,
  Sun,
  X,
} from 'lucide-react';

/* ---------- helpers ---------- */

const normalize = (s: string) =>
  s
    .toLowerCase()
    .replace(/[\u064B-\u0652\u0670\u0640]/g, '')
    .replace(/[أإآ]/g, 'ا')
    .replace(/ى/g, 'ي')
    .replace(/ة/g, 'ه')
    .replace(/ؤ/g, 'و')
    .replace(/ئ/g, 'ي')
    .trim();

const levelLabel = (y: number) => (y === 0 ? 'الوثائق الرسمية' : y === 8 ? 'التحضيري' : `السنة ${y}`);

const formatBadge = (format: string) => {
  switch (format.toUpperCase()) {
    case 'PDF':
      return 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-500/10 dark:text-rose-300 dark:border-rose-500/30';
    case 'DOC':
    case 'DOCX':
      return 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-500/10 dark:text-blue-300 dark:border-blue-500/30';
    case 'RAR':
    case 'ZIP':
      return 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-500/10 dark:text-amber-300 dark:border-amber-500/30';
    case 'JPG':
    case 'PNG':
      return 'bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-500/10 dark:text-purple-300 dark:border-purple-500/30';
    default:
      return 'bg-stone-100 text-stone-600 border-stone-200 dark:bg-stone-500/10 dark:text-stone-300 dark:border-stone-500/30';
  }
};

const docTypeTone = (type: string) => {
  if (/دليل/.test(type)) return 'text-emerald-700 bg-emerald-50 border-emerald-200 dark:text-emerald-300 dark:bg-emerald-500/10 dark:border-emerald-500/30';
  if (/برنامج|رسمي|توجيه/.test(type))
    return 'text-sky-700 bg-sky-50 border-sky-200 dark:text-sky-300 dark:bg-sky-500/10 dark:border-sky-500/30';
  if (/تقييم|معايير|تشخيص|علاج/.test(type))
    return 'text-violet-700 bg-violet-50 border-violet-200 dark:text-violet-300 dark:bg-violet-500/10 dark:border-violet-500/30';
  if (/مخطط|تخطيط|سنوي/.test(type))
    return 'text-amber-700 bg-amber-50 border-amber-200 dark:text-amber-300 dark:bg-amber-500/10 dark:border-amber-500/30';
  if (/جذاذة|يوم|فترة/.test(type))
    return 'text-orange-700 bg-orange-50 border-orange-200 dark:text-orange-300 dark:bg-orange-500/10 dark:border-orange-500/30';
  return 'text-stone-600 bg-stone-100 border-stone-200 dark:text-stone-300 dark:bg-stone-500/10 dark:border-stone-500/30';
};

const evalTypeTone = (t: string) => {
  if (/Google Drive|Google Docs|UC\?|docs\.google/.test(t))
    return 'bg-sky-50 text-sky-700 border-sky-200 dark:bg-sky-500/10 dark:text-sky-300 dark:border-sky-500/30';
  if (/MediaFire|mediafire/.test(t))
    return 'bg-orange-50 text-orange-700 border-orange-200 dark:bg-orange-500/10 dark:text-orange-300 dark:border-orange-500/30';
  if (/Word|docx?|مباشر|PDF/.test(t))
    return 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-500/10 dark:text-rose-300 dark:border-rose-500/30';
  if (/مختصر|adf|linkvertise/.test(t))
    return 'bg-violet-50 text-violet-700 border-violet-200 dark:bg-violet-500/10 dark:text-violet-300 dark:border-violet-500/30';
  if (/صفحة/.test(t))
    return 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-300 dark:border-emerald-500/30';
  return 'bg-stone-100 text-stone-600 border-stone-200 dark:bg-stone-500/10 dark:text-stone-300 dark:border-stone-500/30';
};

const sortPlans = (list: (SubjectPlan | null)[], mode: SortMode): SubjectPlan[] => {
  const valid = list.filter(Boolean) as SubjectPlan[];
  if (mode === 'subject') {
    return [...valid].sort((a, b) => a.المادة.localeCompare(b.المادة, 'ar'));
  }
  if (mode === 'level') {
    const ord = (y: number) => (y === 8 ? 0 : y === 0 ? 1 : y + 1);
    return [...valid].sort((a, b) => ord(a.السنة) - ord(b.السنة) || a.المادة.localeCompare(b.المادة, 'ar'));
  }
  return [...valid].sort((a, b) => {
    const ma = a.الوحدات.length ? Math.max(...a.الوحدات.map((u) => parseInt(u.الحجم) || 0)) : 0;
    const mb = b.الوحدات.length ? Math.max(...b.الوحدات.map((u) => parseInt(u.الحجم) || 0)) : 0;
    return mb - ma;
  });
};

type SortMode = 'level' | 'subject' | 'size';

export default function App() {
  const [dark, setDark] = useState<boolean>(() => {
    if (typeof localStorage === 'undefined') return false;
    const s = localStorage.getItem('mdhakrat-theme');
    return s ? s === 'dark' : false;
  });
  const [search, setSearch] = useState('');
  const [year, setYear] = useState<number | 'all'>('all');
  const [subject, setSubject] = useState<string>('all');
  const [docType, setDocType] = useState<string>('all');
  const [format, setFormat] = useState<string>('all');
  const [sort, setSort] = useState<SortMode>('level');
  const [limit, setLimit] = useState(30);
  const [toast, setToast] = useState<string | null>(null);
  const [showJson, setShowJson] = useState(false);
  const [copied, setCopied] = useState<string | null>(null);
  const [previewImg, setPreviewImg] = useState<string | null>(null);
  const [tab, setTab] = useState<'docs' | 'gallery' | 'evaluation'>('docs');
  const gallery = tab === 'gallery';
  const evaluation = tab === 'evaluation';
  const [galleryLevel, setGalleryLevel] = useState<'all' | string>('all');
  const [galleryFormat, setGalleryFormat] = useState<'all' | 'JPG' | 'PNG'>('all');
  const [galleryLimit, setGalleryLimit] = useState(60);
  const [evalYear, setEvalYear] = useState<'all' | string>('all');
  const [evalSubject, setEvalSubject] = useState('all');
  const [evalSource, setEvalSource] = useState('all');
  const [showTop, setShowTop] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const toastTimer = useRef<number | undefined>(undefined);

  useEffect(() => {
    const onScroll = () => setShowTop(window.scrollY > 600);
    window.addEventListener('scroll', onScroll, {passive: true});
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    document.documentElement.classList.toggle('dark', dark);
    localStorage.setItem('mdhakrat-theme', dark ? 'dark' : 'light');
  }, [dark]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === '/' && document.activeElement?.tagName !== 'INPUT') {
        e.preventDefault();
        inputRef.current?.focus();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  const showToast = (msg: string) => {
    setToast(msg);
    window.clearTimeout(toastTimer.current);
    toastTimer.current = window.setTimeout(() => setToast(null), 2200);
  };

  const copyText = async (text: string, label: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(text);
      showToast(`تم نسخ ${label}`);
      window.setTimeout(() => setCopied(null), 2000);
    } catch {
      showToast('تعذّر النسخ');
    }
  };

  const downloadJson = () => {
    const blob = new Blob([JSON.stringify(dataset, null, 2)], {type: 'application/json'});
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'mokhattat_tounes_moamaq.json';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const total = dataset.إحصائيات_المكتبة.إجمالي_الملفات_المحققة;
  const totalImages = dataset.إحصائيات_المكتبة.عدد_الصور_التقييمية ?? 0;
  const stats = dataset.إحصائيات_المكتبة;

  const linkCountByYear = useMemo(() => {
    const m = new Map<number, number>();
    dataset.المخططات.forEach((p) => {
      const n = p.روابط_تحميل?.length || 0;
      if (n) m.set(p.السنة, (m.get(p.السنة) || 0) + n);
    });
    return m;
  }, []);

  const linkCountBySubject = useMemo(() => {
    const m = new Map<string, number>();
    dataset.المخططات.forEach((p) => {
      const n = p.روابط_تحميل?.length || 0;
      if (n) m.set(p.المادة, (m.get(p.المادة) || 0) + n);
    });
    return m;
  }, []);

  /* ---------- derived data ---------- */

  const subjects = useMemo(
    () =>
      Array.from(new Set(dataset.المخططات.map((p) => p.المادة))).sort((a, b) =>
        a.localeCompare(b, 'ar'),
      ),
    [],
  );

  const docTypes = useMemo(() => {
    const m = new Map<string, number>();
    dataset.المخططات.forEach((p) =>
      p.الوحدات.forEach((u) => m.set(u.نوع_الوثيقة, (m.get(u.نوع_الوثيقة) || 0) + 1)),
    );
    dataset.المخططات.forEach((p) =>
      (p.روابط_تحميل || []).forEach((l) => {
        const t = l.نوع || 'عام';
        m.set(t, (m.get(t) || 0) + 1);
      }),
    );
    return Array.from(m.entries()).sort((a, b) => b[1] - a[1]);
  }, []);

  const formats = useMemo(() => {
    const m = new Map<string, number>();
    dataset.المخططات.forEach((p) =>
      p.الوحدات.forEach((u) => m.set(u.الصيغة, (m.get(u.الصيغة) || 0) + 1)),
    );
    return Array.from(m.entries()).sort((a, b) => b[1] - a[1]);
  }, []);

  /* ---------- galerie d'images (fb-evaluations) ---------- */

  const galleryFolders = useMemo(() => {
    const order = ['annee-1', 'annee-2', 'annee-3', 'annee-4', 'annee-5', 'annee-6', 'autre'];
    const m = new Map<string, number>();
    fbImages.forEach((i) => m.set(i.المجلد, (m.get(i.المجلد) || 0) + 1));
    return order.map((f) => [f, m.get(f) || 0] as const);
  }, []);

  const gallerySubjects = useMemo(() => {
    const m = new Map<string, number>();
    fbImages.forEach((i) => {
      const s = i.المادة || 'غير مصنّف';
      m.set(s, (m.get(s) || 0) + 1);
    });
    return Array.from(m.entries()).sort((a, b) => b[1] - a[1]);
  }, []);

  const galleryImgFormat = (i: FbImage) => (i.الصيغة || i.المسار.split('.').pop()?.toUpperCase() || '');

  const filteredImages = useMemo(() => {
    const q = normalize(search);
    return fbImages.filter((i) => {
      if (galleryLevel !== 'all' && i.المجلد !== galleryLevel) return false;
      if (subject !== 'all' && i.المادة !== subject) return false;
      if (galleryFormat !== 'all' && galleryImgFormat(i) !== galleryFormat) return false;
      if (!q) return true;
      return (
        normalize(i.المسار).includes(q) ||
        normalize(i.الوصف).includes(q) ||
        normalize(i.المادة).includes(q) ||
        normalize(i.الوحدة).includes(q) ||
        normalize(i.المصدر).includes(q)
      );
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [galleryLevel, galleryFormat, search, subject]);

  const visibleImages = filteredImages.slice(0, galleryLimit);
  const galleryActiveFilters =
    (galleryLevel !== 'all' ? 1 : 0) + (subject !== 'all' ? 1 : 0) + (galleryFormat !== 'all' ? 1 : 0) + (search.trim() ? 1 : 0);
  const resetGallery = () => {
    setGalleryLevel('all');
    setGalleryFormat('all');
    if (subject !== 'all') setSubject('all');
    if (search) setSearch('');
    setGalleryLimit(60);
  };

  const evalSubjects = useMemo(() => {
    const m = new Map<string, number>();
    evaluationFiles.forEach((f) => {
      const s = f.المادة || 'غير مصنّف';
      m.set(s, (m.get(s) || 0) + 1);
    });
    return Array.from(m.entries()).sort((a, b) => b[1] - a[1]);
  }, []);

  const evalSources = useMemo(() => {
    const m = new Map<string, number>();
    evaluationFiles.forEach((f) => {
      const s = f.المصدر || 'غير معروف';
      m.set(s, (m.get(s) || 0) + 1);
    });
    return Array.from(m.entries()).sort((a, b) => b[1] - a[1]);
  }, []);

  const filteredEval = useMemo(() => {
    const q = normalize(search);
    return evaluationFiles.filter((f) => {
      if (evalYear !== 'all' && f.السنة !== evalYear && f.السنة !== 'الكل') return false;
      if (evalSubject !== 'all' && f.المادة !== evalSubject) return false;
      if (evalSource !== 'all' && f.المصدر !== evalSource) return false;
      if (!q) return true;
      return (
        normalize(f.العنوان).includes(q) ||
        normalize(f.المادة).includes(q) ||
        normalize(f.المصدر).includes(q) ||
        normalize(f.نوع_الرابط).includes(q) ||
        normalize(f.ملاحظات || '').includes(q)
      );
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [evalYear, evalSubject, evalSource, search]);

  const evalCountFor = (y: string) =>
    evaluationFiles.filter((f) => f.السنة === y || f.السنة === 'الكل').length;
  const evalActiveFilters =
    (evalYear !== 'all' ? 1 : 0) + (evalSubject !== 'all' ? 1 : 0) + (evalSource !== 'all' ? 1 : 0) + (search.trim() ? 1 : 0);
  const resetEval = () => {
    setEvalYear('all');
    setEvalSubject('all');
    setEvalSource('all');
    if (search) setSearch('');
  };

  const yearCount = (y: number | 'all') => {
    const base =
      y === 'all'
        ? total
        : y === 0
          ? stats.توزيع_الملفات_حسب_المستويات['البرامج والوثائق الرسمية'] || 0
          : y === 8
            ? stats.توزيع_الملفات_حسب_المستويات['التحضيري'] || 0
            : stats.توزيع_الملفات_حسب_المستويات[`السنة ${y}`] || 0;
    const links = y === 'all' ? totalLinks : linkCountByYear.get(y as number) || 0;
    return base + links;
  };

  const subjectCount = (s: string) =>
    (stats.توزيع_الملفات_حسب_المواد[s] || 0) + (linkCountBySubject.get(s) || 0);

  /* ---------- filtering ---------- */

  const q = normalize(search);

  const filteredPlans = useMemo(() => {
    const res = dataset.المخططات.map((p) => {
      if (year !== 'all' && p.السنة !== year) return null;
      if (subject !== 'all' && p.المادة !== subject) return null;
      const units = p.الوحدات.filter((u: UnitPlanItem) => {
        if (docType !== 'all' && u.نوع_الوثيقة !== docType) return false;
        if (format !== 'all' && u.الصيغة !== format) return false;
        if (!q) return true;
        return (
          normalize(u.الوحدة).includes(q) ||
          normalize(u.الملف).includes(q) ||
          normalize(u.المسار).includes(q) ||
          normalize(u.نوع_الوثيقة).includes(q) ||
          normalize(p.المادة).includes(q) ||
          normalize(levelLabel(p.السنة)).includes(q)
        );
      });
      const links = (p.روابط_تحميل || []).filter((l) => {
        if (docType !== 'all' && l.نوع && l.نوع !== docType) return false;
        if (!q) return true;
        return (
          normalize(l.الوصف).includes(q) ||
          normalize(l.الرابط).includes(q) ||
          normalize(l.المصدر).includes(q) ||
          normalize(l.نوع || '').includes(q) ||
          normalize(p.المادة).includes(q) ||
          normalize(levelLabel(p.السنة)).includes(q)
        );
      });
      if (!units.length && !links.length) return null;
      return {...p, الوحدات: units, روابط_تحميل: links.length ? links : undefined};
    });
    return sortPlans(res, sort);
  }, [year, subject, docType, format, q, sort]);

  const matchUnits = useMemo(() => filteredPlans.reduce((acc, p) => acc + p.الوحدات.length, 0), [filteredPlans]);
  const matchLinks = useMemo(
    () => filteredPlans.reduce((acc, p) => acc + (p.روابط_تحميل?.length || 0), 0),
    [filteredPlans],
  );
  const matchCount = matchUnits + matchLinks;

  const totalLinks = useMemo(
    () => dataset.المخططات.reduce((acc, p) => acc + (p.روابط_تحميل?.length || 0), 0),
    [],
  );

  const activeFilters = useMemo(
    () =>
      (
        [
          year !== 'all' && ['السنة', levelLabel(year as number)],
          subject !== 'all' && ['المادة', subject],
          docType !== 'all' && ['النوع', docType],
          format !== 'all' && ['الصيغة', format],
          search.trim() && ['بحث', search.trim()],
        ] as (false | [string, string])[]
      ).filter(Boolean) as [string, string][],
    [year, subject, docType, format, search],
  );

  const hasActiveFilters = activeFilters.length > 0;

  const reset = () => {
    setSearch('');
    setYear('all');
    setSubject('all');
    setDocType('all');
    setFormat('all');
    setLimit(30);
  };

  const clearOne = (key: string) => {
    if (key === 'السنة') setYear('all');
    else if (key === 'المادة') setSubject('all');
    else if (key === 'النوع') setDocType('all');
    else if (key === 'الصيغة') setFormat('all');
    else if (key === 'بحث') setSearch('');
  };

  const visiblePlans = filteredPlans.slice(0, limit);

  /* ---------- render ---------- */

  const selectClass =
    'bg-stone-50 border border-stone-200 rounded-lg px-2.5 py-1.5 text-xs font-medium text-stone-700 focus:outline-hidden focus:ring-2 focus:ring-amber-500/30 dark:bg-stone-800 dark:border-stone-700 dark:text-stone-200 cursor-pointer';

  return (
    <div className="min-h-screen bg-[#FAF9F7] text-stone-900 dark:bg-stone-950 dark:text-stone-100 flex flex-col selection:bg-amber-100 selection:text-amber-900 transition-colors">
      {/* ===== Header ===== */}
      <header className="sticky top-0 z-40 border-b border-stone-200/80 bg-white/85 dark:bg-stone-900/85 dark:border-stone-800 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className="relative w-10 h-10 rounded-xl bg-gradient-to-br from-amber-400 to-amber-600 text-white flex items-center justify-center shadow-sm shrink-0">
              <GraduationCap className="w-5.5 h-5.5" />
              <span className="absolute -top-1 -left-1 w-3.5 h-3.5 rounded-full bg-emerald-500 border-2 border-white dark:border-stone-900" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-base sm:text-lg font-extrabold tracking-tight truncate">
                  مكتبة المعلم التونسي
                </h1>
                <span className="hidden sm:inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-300 dark:border-emerald-500/30">
                  <CheckCircle2 className="w-3 h-3" />
                  {total} وثيقة
                  <span className="w-px h-3 bg-emerald-300/50 dark:bg-emerald-500/40 hidden sm:inline-block" />
                  <span className="hidden sm:inline-flex items-center gap-1">
                    <Link2 className="w-3 h-3" />
                    {totalLinks} رابط خارجي
                  </span>
                </span>
              </div>
              <p className="text-[11px] text-stone-500 dark:text-stone-400 truncate">
                مخططات الوحدات · أدلة CNP · برامج الوزارة · مستويات التحضيري ← 6
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <div className="flex items-center gap-0.5 p-1 rounded-xl border border-stone-200 bg-stone-100/80 dark:border-stone-700 dark:bg-stone-800/80">
              <button
                onClick={() => setTab('docs')}
                className={`px-2.5 py-1.5 text-[11px] font-bold rounded-lg transition-colors cursor-pointer ${
                  tab === 'docs'
                    ? 'bg-white text-stone-900 shadow-xs dark:bg-stone-900 dark:text-white'
                    : 'text-stone-500 hover:text-stone-700 dark:text-stone-400 dark:hover:text-stone-200'
                }`}
              >
                الوثائق
              </button>
              <button
                onClick={() => setTab('gallery')}
                className={`inline-flex items-center gap-1 px-2.5 py-1.5 text-[11px] font-bold rounded-lg transition-colors cursor-pointer ${
                  tab === 'gallery'
                    ? 'bg-white text-amber-700 shadow-xs dark:bg-stone-900 dark:text-amber-400'
                    : 'text-stone-500 hover:text-stone-700 dark:text-stone-400 dark:hover:text-stone-200'
                }`}
              >
                <span className="relative">
                  الصور
                  <span className="absolute -top-1 -right-2 w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                </span>
                <span className="text-[10px] text-stone-400">{totalImages}</span>
              </button>
              <button
                onClick={() => setTab('evaluation')}
                className={`inline-flex items-center gap-1 px-2.5 py-1.5 text-[11px] font-bold rounded-lg transition-colors cursor-pointer ${
                  tab === 'evaluation'
                    ? 'bg-white text-amber-700 shadow-xs dark:bg-stone-900 dark:text-amber-400'
                    : 'text-stone-500 hover:text-stone-700 dark:text-stone-400 dark:hover:text-stone-200'
                }`}
              >
                <ClipboardList className="w-3.5 h-3.5" />
                ملف التقييم
                <span className="text-[10px] text-stone-400">{evaluationFiles.length}</span>
              </button>
            </div>
            <button
              onClick={downloadJson}
              title="تحميل ملف البيانات"
              className="hidden md:inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-lg border border-stone-200 text-stone-600 hover:bg-stone-50 dark:border-stone-700 dark:text-stone-300 dark:hover:bg-stone-800 transition-colors cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>ملف البيانات</span>
            </button>
            <button
              onClick={() => setDark((d) => !d)}
              aria-label="تبديل المظهر"
              title="تبديل المظهر (ليلاً / نهاراً)"
              className="p-2 rounded-lg border border-stone-200 text-stone-600 hover:bg-stone-50 dark:border-stone-700 dark:text-stone-300 dark:hover:bg-stone-800 transition-colors cursor-pointer"
            >
              {dark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>
          </div>
        </div>
      </header>

      {/* ===== Hero ===== */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-bl from-amber-200/60 via-orange-100/40 to-stone-50 dark:from-amber-900/20 dark:via-orange-900/10 dark:to-stone-950 pointer-events-none" />
        <div className="absolute -top-24 -left-24 w-64 h-64 rounded-full bg-amber-400/10 blur-3xl pointer-events-none" />
        <div className="absolute -bottom-32 -right-24 w-80 h-80 rounded-full bg-orange-400/10 blur-3xl pointer-events-none" />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10">
          <div className="text-center max-w-2xl mx-auto">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/70 dark:bg-stone-800/70 border border-stone-200 dark:border-stone-700 text-[11px] font-bold text-stone-600 dark:text-stone-300 shadow-xs">
              <Sparkles className="w-3.5 h-3.5 text-amber-600" />
              {evaluation
                ? 'ملف التقييم والمتابعة — روابط محقَّقة'
                : gallery
                  ? 'معرض الصور التقييمية المحققّة'
                  : 'كل الوثائق البيداغوجية في مكان واحد'}
            </span>
            <h2 className="mt-3 text-2xl sm:text-3xl font-extrabold tracking-tight text-stone-900 dark:text-white">
              {evaluation
                ? 'دوسيي التقييم لجميع المستويات'
                : gallery
                  ? 'تصفّح كل الصور حسب المسار والمستوى'
                  : 'ابحث، صفِّ، وحمّل مخطّطاتك في ثوانٍ'}
            </h2>
            <p className="mt-2 text-sm text-stone-600 dark:text-stone-400 leading-relaxed">
              {evaluation
                ? 'دفاتر التقييم، cahiers d’évaluation، الدوسييهات والمتابعة (تمام، مقيّم، تقييمات دورية) — لكل سنة من 1 إلى 6، مع سنة النشر ومصدر كل رابط.'
                : gallery
                  ? 'فلاتر حسب المسار (annee-1..6 / autres)، المادة، الصيغة والبحث في الأوصاف.'
                  : 'جذاذات، خطط سنوية وفصلية، أدلة المعلم، وتقييمات رسمية — مصنّفة حسب المستوى والمادة ونوع الوثيقة والصيغة.'}
            </p>
          </div>

          {/* Search */}
          <div className="mt-6 max-w-3xl mx-auto">
            <div className="relative group">
              <Search className="w-5 h-5 absolute right-4 top-1/2 -translate-y-1/2 text-stone-400 pointer-events-none" />
              <input
                ref={inputRef}
                type="text"
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setLimit(30);
                }}
                placeholder={
                  evaluation
                    ? 'ابحث في عنوان الملف أو المادة أو المصدر…  (مثال: تمام، تقييم فرنسية)'
                    : gallery
                      ? 'ابحث في المسار أو الأوصاف أو المواد…  (مثال: annee-3، تقييم، Français)'
                      : 'ابحث بالاسم أو النوع أو المصدر…  (مثال: دليل المعلم، امتحان، فرنسية)'
                }
                className="w-full pl-12 pr-12 py-3.5 text-sm rounded-2xl border border-stone-200 bg-white shadow-sm placeholder:text-stone-400 focus:outline-hidden focus:ring-4 focus:ring-amber-500/20 focus:border-amber-500 transition-all dark:bg-stone-900 dark:border-stone-700 dark:placeholder:text-stone-500"
              />
              {search && (
                <button
                  onClick={() => setSearch('')}
                  className="absolute left-3 top-1/2 -translate-y-1/2 p-1 rounded-md text-stone-400 hover:text-stone-600 hover:bg-stone-100 dark:hover:bg-stone-800 cursor-pointer"
                  aria-label="مسح البحث"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
              <kbd className="absolute left-3 top-1/2 -translate-y-1/2 hidden sm:inline-block px-1.5 py-0.5 text-[10px] font-mono text-stone-400 border border-stone-200 rounded dark:border-stone-700">
                /
              </kbd>
            </div>

            {/* Level pills */}
            <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
              {evaluation ? (
                <>
                  <button
                    onClick={() => setEvalYear('all')}
                    className={`px-3.5 py-1.5 text-xs font-bold rounded-full border transition-all cursor-pointer ${
                      evalYear === 'all'
                        ? 'bg-stone-900 border-stone-900 text-white shadow-xs dark:bg-white dark:border-white dark:text-stone-900'
                        : 'bg-white/80 border-stone-200 text-stone-600 hover:border-amber-400 hover:text-amber-700 dark:bg-stone-800/80 dark:border-stone-700 dark:text-stone-300 dark:hover:border-amber-500/60'
                    }`}
                  >
                    كل السنوات
                    <span className="mr-1.5 text-[10px] text-stone-400 dark:text-stone-500">
                      {evaluationFiles.length}
                    </span>
                  </button>
                  {(['1', '2', '3', '4', '5', '6'] as string[]).map((y) => {
                    const active = evalYear === y;
                    return (
                      <button
                        key={y}
                        onClick={() => setEvalYear(evalYear === y ? 'all' : y)}
                        className={`px-3.5 py-1.5 text-xs font-bold rounded-full border transition-all cursor-pointer ${
                          active
                            ? 'bg-amber-600 border-amber-600 text-white shadow-sm dark:bg-amber-500 dark:border-amber-500'
                            : 'bg-white/80 border-stone-200 text-stone-600 hover:border-amber-400 hover:text-amber-700 dark:bg-stone-800/80 dark:border-stone-700 dark:text-stone-300 dark:hover:border-amber-500/60'
                        }`}
                      >
                        السنة {y}
                        <span className={`mr-1.5 text-[10px] ${active ? 'opacity-80' : 'text-stone-400 dark:text-stone-500'}`}>
                          {evalCountFor(y)}
                        </span>
                      </button>
                    );
                  })}
                </>
              ) : gallery ? (
                <>
                  <button
                    onClick={() => {
                      setGalleryLevel('all');
                      setGalleryLimit(60);
                    }}
                    className={`px-3.5 py-1.5 text-xs font-bold rounded-full border transition-all cursor-pointer ${
                      galleryLevel === 'all'
                        ? 'bg-stone-900 border-stone-900 text-white shadow-xs dark:bg-white dark:border-white dark:text-stone-900'
                        : 'bg-white/80 border-stone-200 text-stone-600 hover:border-amber-400 hover:text-amber-700 dark:bg-stone-800/80 dark:border-stone-700 dark:text-stone-300 dark:hover:border-amber-500/60'
                    }`}
                  >
                    كل المسارات
                    <span className="mr-1.5 text-[10px] text-stone-400 dark:text-stone-500">
                      {fbImages.length}
                    </span>
                  </button>
                  {galleryFolders.map(([f, c]) => (
                    <button
                      key={f}
                      onClick={() => {
                        setGalleryLevel(galleryLevel === f ? 'all' : f);
                        setGalleryLimit(60);
                      }}
                      className={`px-3.5 py-1.5 text-xs font-bold rounded-full border transition-all cursor-pointer ${
                        galleryLevel === f
                          ? 'bg-amber-600 border-amber-600 text-white shadow-sm dark:bg-amber-500 dark:border-amber-500'
                          : 'bg-white/80 border-stone-200 text-stone-600 hover:border-amber-400 hover:text-amber-700 dark:bg-stone-800/80 dark:border-stone-700 dark:text-stone-300 dark:hover:border-amber-500/60'
                      }`}
                    >
                      <span className="font-mono" dir="ltr">
                        {f}
                      </span>
                      <span className={`mr-1.5 text-[10px] ${galleryLevel === f ? 'opacity-80' : 'text-stone-400 dark:text-stone-500'}`}>
                        {c}
                      </span>
                    </button>
                  ))}
                </>
              ) : (
                (['all', 8, 0, 1, 2, 3, 4, 5, 6] as (number | 'all')[]).map((y) => {
                  const active = year === y;
                  return (
                    <button
                      key={String(y)}
                      onClick={() => {
                        setYear(y);
                        setLimit(30);
                      }}
                      className={`px-3.5 py-1.5 text-xs font-bold rounded-full border transition-all cursor-pointer ${
                        active
                          ? y === 'all'
                            ? 'bg-stone-900 border-stone-900 text-white shadow-xs dark:bg-white dark:border-white dark:text-stone-900'
                            : 'bg-amber-600 border-amber-600 text-white shadow-sm dark:bg-amber-500 dark:border-amber-500'
                          : 'bg-white/80 border-stone-200 text-stone-600 hover:border-amber-400 hover:text-amber-700 dark:bg-stone-800/80 dark:border-stone-700 dark:text-stone-300 dark:hover:border-amber-500/60'
                      }`}
                    >
                      {y === 'all' ? 'جميع المستويات' : levelLabel(y)}
                      <span
                        className={`mr-1.5 text-[10px] font-semibold ${
                          active ? 'opacity-80' : 'text-stone-400 dark:text-stone-500'
                        }`}
                      >
                        {yearCount(y)}
                      </span>
                    </button>
                  );
                })
              )}
            </div>
          </div>
        </div>
      </section>

      {/* ===== Stats strip ===== */}
      <section className="max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {[
            {
              icon: <BookOpen className="w-4 h-4 text-amber-600" />,
              label: 'وثائق ومخططات',
              value: total + totalImages,
              hint: `${total} وثيقة + ${totalImages} صورة تقييمية`,
            },
            {
              icon: <Link2 className="w-4 h-4 text-sky-600" />,
              label: 'روابط خارجية',
              value: totalLinks,
              hint: 'مخططات وتقييمات إضافية',
            },
            {
              icon: <Layers className="w-4 h-4 text-sky-600" />,
              label: 'المراحل المغطاة',
              value: `${new Set(dataset.المخططات.map((p) => p.السنة)).size} مستويات`,
              hint: 'الفترة 1 ← 6 + التحضيري + الوثائق الرسمية',
            },
            {
              icon: <FileText className="w-4 h-4 text-violet-600" />,
              label: 'صيغ متعددة',
              value: `${formats.reduce((a, [, c]) => a + c, 0)} ملف`,
              hint: 'PDF · Word · JPG',
            },
          ].map((c, i) => (
            <motion.div
              key={c.label}
              initial={{opacity: 0, y: 10}}
              animate={{opacity: 1, y: 0}}
              transition={{delay: i * 0.05, duration: 0.3}}
              className="p-4 rounded-2xl border border-stone-200 bg-white shadow-2xs dark:bg-stone-900 dark:border-stone-800"
            >
              <div className="flex items-center justify-between text-xs font-semibold text-stone-500 dark:text-stone-400">
                <span>{c.label}</span>
                {c.icon}
              </div>
              <div className="mt-1.5 text-2xl font-extrabold text-stone-900 dark:text-white">
                {c.value}
              </div>
              <div className="mt-0.5 text-[11px] text-stone-400 dark:text-stone-500">{c.hint}</div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ===== Filter panel ===== */}
      <section className="max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 mt-5">
        <div className="rounded-2xl border border-stone-200 bg-white shadow-xs dark:bg-stone-900 dark:border-stone-800 overflow-hidden">
          <div className="px-5 py-3 border-b border-stone-100 dark:border-stone-800 flex items-center justify-between gap-2 bg-stone-50/60 dark:bg-stone-900/60">
            <div className="flex items-center gap-2 text-sm font-bold text-stone-800 dark:text-stone-200">
              <span className="w-7 h-7 rounded-lg bg-amber-500/15 border border-amber-500/25 flex items-center justify-center">
                <SlidersHorizontal className="w-4 h-4 text-amber-700 dark:text-amber-400" />
              </span>
              {evaluation
                ? 'تصفية ملفات التقييم'
                : gallery
                  ? 'تصفية الصور حسب المسار'
                  : 'تصفية دقيقة'}
              <span className="text-[11px] font-semibold text-stone-400 dark:text-stone-500">
                {evaluation
                  ? filteredEval.length
                  : gallery
                    ? filteredImages.length
                    : matchCount}{' '}
                نتيجة
              </span>
            </div>
            {(evaluation ? evalActiveFilters > 0 : gallery ? galleryActiveFilters > 0 : hasActiveFilters) && (
              <button
                onClick={evaluation ? resetEval : gallery ? resetGallery : reset}
                className="inline-flex items-center gap-1 text-[11px] font-semibold text-amber-700 hover:text-amber-800 dark:text-amber-400 cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                إعادة الضبط
              </button>
            )}
          </div>

{evaluation ? (
            <div className="p-5 space-y-4">
              <div>
                <div className="flex items-center gap-2 text-[11px] font-bold text-stone-500 dark:text-stone-400 mb-2">
                  <FolderOpen className="w-3.5 h-3.5" />
                  المادة الدراسية
                </div>
                <div className="flex flex-wrap gap-1.5">
                  <button
                    onClick={() => setEvalSubject('all')}
                    className={`px-2.5 py-1 text-xs rounded-lg font-semibold transition-colors cursor-pointer ${
                      evalSubject === 'all'
                        ? 'bg-stone-800 text-white dark:bg-white dark:text-stone-900'
                        : 'bg-stone-100 text-stone-600 hover:bg-stone-200 dark:bg-stone-800 dark:text-stone-300 dark:hover:bg-stone-700'
                    }`}
                  >
                    كل المواد
                  </button>
                  {evalSubjects.map(([s, c]) => (
                    <button
                      key={s}
                      onClick={() => setEvalSubject(evalSubject === s ? 'all' : s)}
                      className={`px-2.5 py-1 text-xs rounded-lg font-semibold transition-colors cursor-pointer ${
                        evalSubject === s
                          ? 'bg-amber-600 text-white shadow-sm dark:bg-amber-500'
                          : 'bg-stone-100 text-stone-600 hover:bg-amber-100 hover:text-amber-800 dark:bg-stone-800 dark:text-stone-300 dark:hover:bg-amber-500/10 dark:hover:text-amber-300'
                      }`}
                    >
                      {s}
                      <span className={`mr-1 text-[10px] ${evalSubject === s ? 'opacity-80' : 'text-stone-400'}`}>
                        {c}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
              <div className="pt-1 border-t border-stone-100 dark:border-stone-800">
                <div className="flex items-center gap-2 text-[11px] font-bold text-stone-500 dark:text-stone-400 mb-2">
                  <Building className="w-3.5 h-3.5" />
                  المصدر
                </div>
                <div className="flex flex-wrap gap-1.5">
                  <button
                    onClick={() => setEvalSource('all')}
                    className={`px-2.5 py-1 text-xs rounded-lg font-semibold transition-colors cursor-pointer ${
                      evalSource === 'all'
                        ? 'bg-stone-800 text-white dark:bg-white dark:text-stone-900'
                        : 'bg-stone-100 text-stone-600 hover:bg-stone-200 dark:bg-stone-800 dark:text-stone-300 dark:hover:bg-stone-700'
                    }`}
                  >
                    كل المصادر
                  </button>
                  {evalSources.map(([s, c]) => (
                    <button
                      key={s}
                      onClick={() => setEvalSource(evalSource === s ? 'all' : s)}
                      className={`px-2.5 py-1 text-xs rounded-lg font-semibold transition-colors cursor-pointer ${
                        evalSource === s
                          ? 'bg-amber-600 text-white shadow-sm dark:bg-amber-500'
                          : 'bg-stone-100 text-stone-600 hover:bg-amber-100 hover:text-amber-800 dark:bg-stone-800 dark:text-stone-300 dark:hover:bg-amber-500/10 dark:hover:text-amber-300'
                      }`}
                    >
                      <span className="font-mono" dir="ltr">
                        {s}
                      </span>
                      <span className={`mr-1 text-[10px] ${evalSource === s ? 'opacity-80' : 'text-stone-400'}`}>
                        {c}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
              <div className="pt-1 border-t border-stone-100 dark:border-stone-800">
                <div className="flex items-center gap-1.5 text-[11px] font-semibold text-stone-400 dark:text-stone-500">
                  <ClipboardList className="w-3.5 h-3.5" />
                  النطاق: الكل · {['1', '2', '3', '4', '5', '6'].map((y) => `السنة ${y}`).join(' · ')} — حدّد السنة بالأزرار أعلاه
                </div>
              </div>
            </div>
          ) : gallery ? (
            <div className="p-5 space-y-4">
              <div>
                <div className="flex items-center gap-2 text-[11px] font-bold text-stone-500 dark:text-stone-400 mb-2">
                  <FolderOpen className="w-3.5 h-3.5" />
                  المادة الدراسية
                </div>
                <div className="flex flex-wrap gap-1.5">
                  <button
                    onClick={() => setSubject('all')}
                    className={`px-2.5 py-1 text-xs rounded-lg font-semibold transition-colors cursor-pointer ${
                      subject === 'all'
                        ? 'bg-stone-800 text-white dark:bg-white dark:text-stone-900'
                        : 'bg-stone-100 text-stone-600 hover:bg-stone-200 dark:bg-stone-800 dark:text-stone-300 dark:hover:bg-stone-700'
                    }`}
                  >
                    كل المواد
                  </button>
                  {gallerySubjects.map(([s, c]) => (
                    <button
                      key={s}
                      onClick={() => setSubject(subject === s ? 'all' : s)}
                      className={`px-2.5 py-1 text-xs rounded-lg font-semibold transition-colors cursor-pointer ${
                        subject === s
                          ? 'bg-amber-600 text-white shadow-sm dark:bg-amber-500'
                          : 'bg-stone-100 text-stone-600 hover:bg-amber-100 hover:text-amber-800 dark:bg-stone-800 dark:text-stone-300 dark:hover:bg-amber-500/10 dark:hover:text-amber-300'
                      }`}
                    >
                      {s}
                      <span className={`mr-1 text-[10px] ${subject === s ? 'opacity-80' : 'text-stone-400'}`}>
                        {c}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
              <div className="pt-1">
                <div className="flex items-center gap-2 text-[11px] font-bold text-stone-500 dark:text-stone-400 mb-2">
                  <FileCheck className="w-3.5 h-3.5" />
                  الصيغة
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {(['all', 'JPG', 'PNG'] as const).map((f) => {
                    const count = f === 'all' ? fbImages.length : fbImages.filter((i) => galleryImgFormat(i) === f).length;
                    return (
                      <button
                        key={f}
                        onClick={() => setGalleryFormat(f)}
                        className={`px-2.5 py-1 text-xs rounded-full border font-semibold transition-colors cursor-pointer ${
                          galleryFormat === f
                            ? 'bg-amber-600 border-amber-600 text-white dark:bg-amber-500 dark:border-amber-500'
                            : 'bg-white border-stone-200 text-stone-600 hover:border-amber-400 hover:text-amber-700 dark:bg-stone-800 dark:border-stone-700 dark:text-stone-300'
                        }`}
                      >
                        {f === 'all' ? 'الكل' : f}
                        <span className="mr-1 text-[10px] text-stone-400">
                          {count}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
              <div className="pt-1 border-t border-stone-100 dark:border-stone-800">
                <div className="flex items-center gap-1.5 text-[11px] font-semibold text-stone-400 dark:text-stone-500">
                  <Layers className="w-3.5 h-3.5" />
                  المسارات: fb-evaluations/{'{'}{galleryLevel !== 'all' ? galleryLevel : 'annee-1…6، autre'}{'}'}
                </div>
              </div>
            </div>
          ) : (
          <div className="p-5 space-y-4">
            {/* Subjects */}
            <div>
              <div className="flex items-center gap-2 text-[11px] font-bold text-stone-500 dark:text-stone-400 mb-2">
                <FolderOpen className="w-3.5 h-3.5" />
                المادة الدراسية
              </div>
              <div className="flex flex-wrap gap-1.5">
                <button
                  onClick={() => setSubject('all')}
                  className={`px-2.5 py-1 text-xs rounded-lg font-semibold transition-colors cursor-pointer ${
                    subject === 'all'
                      ? 'bg-stone-800 text-white dark:bg-white dark:text-stone-900'
                      : 'bg-stone-100 text-stone-600 hover:bg-stone-200 dark:bg-stone-800 dark:text-stone-300 dark:hover:bg-stone-700'
                  }`}
                >
                  كل المواد
                </button>
                {subjects.map((s) => (
                  <button
                    key={s}
                    onClick={() => setSubject(subject === s ? 'all' : s)}
                    className={`px-2.5 py-1 text-xs rounded-lg font-semibold transition-colors cursor-pointer ${
                      subject === s
                        ? 'bg-amber-600 text-white shadow-sm dark:bg-amber-500'
                        : 'bg-stone-100 text-stone-600 hover:bg-amber-100 hover:text-amber-800 dark:bg-stone-800 dark:text-stone-300 dark:hover:bg-amber-500/10 dark:hover:text-amber-300'
                    }`}
                  >
                    {s}
                    <span
                      className={`mr-1 text-[10px] ${subject === s ? 'opacity-80' : 'text-stone-400'}`}
                    >
                      {subjectCount(s)}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* Doc type quick chips */}
            <div className="pt-1">
              <div className="flex items-center gap-2 text-[11px] font-bold text-stone-500 dark:text-stone-400 mb-2">
                <FileCheck className="w-3.5 h-3.5" />
                نوع الوثيقة — اختصارات سريعة
              </div>
              <div className="flex flex-wrap gap-1.5">
                <button
                  onClick={() => setDocType('all')}
                  className={`px-2.5 py-1 text-xs rounded-full border font-semibold transition-colors cursor-pointer ${
                    docType === 'all'
                      ? 'bg-stone-800 border-stone-800 text-white dark:bg-white dark:border-white dark:text-stone-900'
                      : 'bg-white border-stone-200 text-stone-600 hover:border-amber-400 hover:text-amber-700 dark:bg-stone-800 dark:border-stone-700 dark:text-stone-300'
                  }`}
                >
                  الكل
                </button>
                {docTypes.slice(0, 6).map(([t, c]) => (
                  <button
                    key={t}
                    onClick={() => setDocType(docType === t ? 'all' : t)}
                    className={`px-2.5 py-1 text-xs rounded-full border font-semibold transition-colors cursor-pointer ${
                      docType === t
                        ? 'bg-amber-600 border-amber-600 text-white dark:bg-amber-500 dark:border-amber-500'
                        : 'bg-white border-stone-200 text-stone-600 hover:border-amber-400 hover:text-amber-700 dark:bg-stone-800 dark:border-stone-700 dark:text-stone-300'
                    }`}
                  >
                    {t}
                    <span
                      className={`mr-1 text-[10px] ${docType === t ? 'opacity-80' : 'text-stone-400'}`}
                    >
                      {c}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* Selects row */}
            <div className="flex flex-wrap items-end gap-3 pt-1">
              <label className="flex flex-col gap-1 text-[11px] font-bold text-stone-500 dark:text-stone-400">
                نوع الوثيقة
                <select value={docType} onChange={(e) => setDocType(e.target.value)} className={selectClass}>
                  <option value="all">جميع الأنواع</option>
                  {docTypes.map(([t, c]) => (
                    <option key={t} value={t}>
                      {t} ({c})
                    </option>
                  ))}
                </select>
              </label>
              <label className="flex flex-col gap-1 text-[11px] font-bold text-stone-500 dark:text-stone-400">
                الصيغة
                <select value={format} onChange={(e) => setFormat(e.target.value)} className={selectClass}>
                  <option value="all">جميع الصيغ</option>
                  {formats.map(([f, c]) => (
                    <option key={f} value={f}>
                      {f} ({c})
                    </option>
                  ))}
                </select>
              </label>
              <label className="flex flex-col gap-1 text-[11px] font-bold text-stone-500 dark:text-stone-400">
                الترتيب
                <select
                  value={sort}
                  onChange={(e) => setSort(e.target.value as SortMode)}
                  className={selectClass}
                >
                  <option value="level">حسب المستوى</option>
                  <option value="subject">حسب المادة</option>
                  <option value="size">حسب الحجم</option>
                </select>
              </label>
            </div>

            {/* Active filters */}
            <AnimatePresence>
              {hasActiveFilters && (
                <motion.div
                  initial={{opacity: 0, height: 0}}
                  animate={{opacity: 1, height: 'auto'}}
                  exit={{opacity: 0, height: 0}}
                  className="flex flex-wrap items-center gap-1.5 pt-1 border-t border-stone-100 dark:border-stone-800"
                >
                  <span className="text-[11px] font-bold text-stone-400 dark:text-stone-500">
                    فلاتر نشطة:
                  </span>
                  {activeFilters.map(([k, v]) => (
                    <button
                      key={k + v}
                      onClick={() => clearOne(k)}
                      className="inline-flex items-center gap-1 px-2 py-0.5 text-[11px] font-semibold rounded-full bg-amber-100 text-amber-800 border border-amber-200 hover:bg-amber-200 dark:bg-amber-500/15 dark:text-amber-300 dark:border-amber-500/30 cursor-pointer"
                    >
                      {v}
                      <X className="w-3 h-3" />
                    </button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
          )}
        </div>
      </section>

      {/* ===== Results ===== */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {evaluation ? (
          /* ===== Dossier d'évaluation ===== */
          <motion.div key="eval-results" initial={{opacity: 0}} animate={{opacity: 1}} exit={{opacity: 0}} className="space-y-5">
            <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-stone-500 dark:text-stone-400 px-1">
              <span>
                «
                <span className="font-extrabold text-stone-900 dark:text-white">{filteredEval.length}</span>
                » ملف تقييم
                {evalActiveFilters > 0 ? ' — حسب المعايير المحددة' : ''}
              </span>
              <span className="text-[11px] text-stone-400 dark:text-stone-500">
                روابط محقَّقة (200 OK) — افتح الرابط ثم حمّل/اطبع الملف
              </span>
            </div>

            {filteredEval.length === 0 ? (
              <div className="text-center py-20 bg-white rounded-2xl border border-dashed border-stone-300 dark:bg-stone-900 dark:border-stone-700">
                <div className="mx-auto w-16 h-16 rounded-2xl bg-stone-100 dark:bg-stone-800 flex items-center justify-center">
                  <ClipboardList className="w-8 h-8 text-stone-400" />
                </div>
                <h3 className="mt-4 font-bold text-stone-800 dark:text-stone-200">لا توجد ملفات مطابقة</h3>
                <p className="mt-1 text-sm text-stone-500 dark:text-stone-400">
                  جرّب تغيير السنة أو المادة أو إعادة ضبط الفلاتر.
                </p>
                <button
                  onClick={resetEval}
                  className="mt-4 inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold rounded-lg bg-stone-900 text-white hover:bg-amber-600 transition-colors dark:bg-white dark:text-stone-900 cursor-pointer"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  إعادة ضبط الفلاتر
                </button>
              </div>
            ) : (
              filteredEval.map((e, idx) => (
                <motion.section
                  key={`${e.السنة}-${e.الرابط}-${idx}`}
                  initial={{opacity: 0, y: 12}}
                  animate={{opacity: 1, y: 0}}
                  transition={{delay: Math.min(idx * 0.03, 0.4), duration: 0.3}}
                  className="bg-white rounded-2xl border border-stone-200 shadow-xs overflow-hidden dark:bg-stone-900 dark:border-stone-800"
                >
                  <div className="px-5 py-3 border-b border-stone-100 dark:border-stone-800 flex items-center justify-between gap-3 bg-gradient-to-l from-emerald-50/60 to-transparent dark:from-emerald-500/5">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <span
                        className={`px-2.5 py-1 text-[11px] font-extrabold rounded-lg shrink-0 ${
                          e.السنة === 'الكل'
                            ? 'bg-stone-900 text-white dark:bg-white dark:text-stone-900'
                            : 'bg-emerald-600/15 text-emerald-800 border border-emerald-600/25 dark:bg-emerald-500/10 dark:text-emerald-300 dark:border-emerald-500/30'
                        }`}
                      >
                        {e.السنة === 'الكل' ? 'جميع المستويات' : `السنة ${e.السنة}`}
                      </span>
                      <h3 className="font-extrabold text-stone-900 dark:text-white text-sm leading-snug">
                        {e.العنوان}
                      </h3>
                    </div>
                    <span className="hidden sm:block text-[10px] font-mono text-stone-300 dark:text-stone-600">
                      {e.المصدر} · {e.نوع_الرابط}
                    </span>
                  </div>

                  <div className="px-5 py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="min-w-0 space-y-1.5">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-300 dark:border-emerald-500/30 font-bold">
                          {e.المادة}
                        </span>
                        <span className={`text-[10px] px-2 py-0.5 rounded-md font-mono font-bold border ${evalTypeTone(e.نوع_الرابط)}`}>
                          {e.نوع_الرابط}
                        </span>
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-stone-100 text-stone-500 border border-stone-200 dark:bg-stone-800 dark:text-stone-400 dark:border-stone-700 font-mono" dir="ltr">
                          {e.المصدر}
                        </span>
                        {e.سنة_النشر && (
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 border border-amber-200 dark:bg-amber-500/10 dark:text-amber-300 dark:border-amber-500/30 font-mono">
                            {e.سنة_النشر}
                          </span>
                        )}
                      </div>
                      {e.ملاحظات && (
                        <p className="text-[11px] text-stone-500 dark:text-stone-400 leading-relaxed">
                          {e.ملاحظات}
                        </p>
                      )}
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        onClick={() => copyText(e.الرابط, 'الرابط')}
                        className="px-2.5 py-1.5 text-xs rounded-lg border border-stone-200 text-stone-600 hover:bg-stone-50 dark:border-stone-700 dark:text-stone-300 dark:hover:bg-stone-800 transition-colors flex items-center gap-1.5 cursor-pointer"
                        title="نسخ الرابط"
                      >
                        {copied === e.الرابط ? (
                          <Check className="w-3.5 h-3.5 text-emerald-600" />
                        ) : (
                          <Copy className="w-3.5 h-3.5" />
                        )}
                        <span className="hidden lg:inline">نسخ</span>
                      </button>
                      {e.متاح ? (
                        <a
                          href={e.الرابط}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-3.5 py-1.5 text-xs font-bold rounded-lg bg-emerald-700 text-white hover:bg-emerald-600 transition-colors flex items-center gap-1.5 shadow-xs"
                          title="فتح الملف"
                        >
                          <Download className="w-3.5 h-3.5" />
                          فتح الملف
                        </a>
                      ) : (
                        <span className="text-[10px] font-semibold text-stone-400 px-3.5 py-1.5 rounded-lg border border-stone-200 dark:border-stone-700">
                          رابط معطل
                        </span>
                      )}
                    </div>
                  </div>
                </motion.section>
              ))
            )}
          </motion.div>
        ) : gallery ? (
          /* ===== Galerie d'images ===== */
          <AnimatePresence mode="wait">
            {visibleImages.length === 0 ? (
              <motion.div
                key="gallery-empty"
                initial={{opacity: 0, y: 8}}
                animate={{opacity: 1, y: 0}}
                exit={{opacity: 0}}
                className="text-center py-20 bg-white rounded-2xl border border-dashed border-stone-300 dark:bg-stone-900 dark:border-stone-700"
              >
                <div className="mx-auto w-16 h-16 rounded-2xl bg-stone-100 dark:bg-stone-800 flex items-center justify-center">
                  <Search className="w-8 h-8 text-stone-400" />
                </div>
                <h3 className="mt-4 font-bold text-stone-800 dark:text-stone-200">لا توجد صور مطابقة</h3>
                <p className="mt-1 text-sm text-stone-500 dark:text-stone-400">
                  جرّب تغيير المسار أو إعادة ضبط الفلاتر.
                </p>
                <button
                  onClick={resetGallery}
                  className="mt-4 inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold rounded-lg bg-stone-900 text-white hover:bg-amber-600 transition-colors dark:bg-white dark:text-stone-900 cursor-pointer"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  إعادة ضبط الفلاتر
                </button>
              </motion.div>
            ) : (
              <motion.div
                key="gallery-results"
                initial={{opacity: 0}}
                animate={{opacity: 1}}
                exit={{opacity: 0}}
              >
                <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-stone-500 dark:text-stone-400 px-1 mb-3">
                  <span>
                    «
                    <span className="font-extrabold text-stone-900 dark:text-white">
                      {filteredImages.length}
                    </span>
                    » صورة من أصل{' '}
                    <span className="font-bold text-stone-700 dark:text-stone-300">
                      {fbImages.length}
                    </span>
                    {' '}موجودة في المسار fb-evaluations/
                    {hasActiveFilters || galleryActiveFilters > 0 ? ' — حسب المعايير المحددة' : ''}
                  </span>
                  <span className="text-[11px] text-stone-400 dark:text-stone-500">
                    اضغط على أي صورة لعرضها بملء الشاشة
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5 gap-3">
                  {visibleImages.map((img, idx) => (
                    <motion.div
                      key={img.المسار}
                      initial={{opacity: 0, y: 10}}
                      animate={{opacity: 1, y: 0}}
                      transition={{delay: Math.min(idx * 0.02, 0.3), duration: 0.25}}
                      onClick={() => setPreviewImg(img.الرابط)}
                      className="group relative rounded-xl overflow-hidden border border-stone-200 bg-white shadow-2xs cursor-zoom-in dark:bg-stone-900 dark:border-stone-700 hover:shadow-lg hover:border-amber-300 hover:-translate-y-0.5 transition-all"
                    >
                      <div className="relative aspect-[4/3] overflow-hidden bg-stone-100 dark:bg-stone-800">
                        <img
                          src={img.الرابط}
                          alt={img.الوصف || img.المسار}
                          loading="lazy"
                          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
                        />
                        <span className="absolute top-1.5 right-1.5 px-1.5 py-0.5 text-[9px] font-mono font-bold rounded-md bg-black/60 text-white backdrop-blur-sm" dir="ltr">
                          {img.المجلد}
                        </span>
                      </div>
                      <div className="px-2.5 py-2 min-w-0">
                        <div className="flex items-center gap-1 mb-1">
                          <span className={`text-[9px] px-1.5 py-0.5 rounded font-mono font-bold border ${formatBadge(img.الصيغة)}`}>
                            {galleryImgFormat(img)}
                          </span>
                          {img.المادة && (
                            <span className="text-[9px] px-1.5 py-0.5 rounded font-semibold bg-stone-100 text-stone-600 border border-stone-200 dark:bg-stone-800 dark:text-stone-300 dark:border-stone-700 truncate">
                              {img.المادة}
                            </span>
                          )}
                        </div>
                        <p className="text-[10px] text-stone-500 dark:text-stone-400 truncate" title={img.الوصف || img.المسار}>
                          {img.الوصف || img.الوحدة || 'صورة تقييمية'}
                        </p>
                        {img.الوصف && img.الوحدة && img.الوحدة !== img.الوصف && (
                          <p className="text-[9px] text-stone-400 dark:text-stone-500 truncate mt-0.5">
                            {img.الوحدة}
                          </p>
                        )}
                      </div>
                    </motion.div>
                  ))}
                </div>

                {filteredImages.length > galleryLimit && (
                  <div className="text-center pt-5">
                    <button
                      onClick={() => setGalleryLimit((p) => p + 60)}
                      className="px-6 py-2.5 text-xs font-bold rounded-xl bg-white border border-stone-300 text-stone-700 hover:bg-amber-50 hover:border-amber-400 hover:text-amber-800 shadow-xs dark:bg-stone-900 dark:border-stone-700 dark:text-stone-200 dark:hover:bg-amber-500/10 transition-colors cursor-pointer"
                    >
                      عرض المزيد من الصور
                      <span className="mr-1.5 text-[11px] text-stone-400">
                        ({filteredImages.length - galleryLimit} صورة متبقية)
                      </span>
                    </button>
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        ) : (
        <AnimatePresence mode="wait">
          {visiblePlans.length === 0 ? (
            <motion.div
              key="empty"
              initial={{opacity: 0, y: 8}}
              animate={{opacity: 1, y: 0}}
              exit={{opacity: 0}}
              className="text-center py-20 bg-white rounded-2xl border border-dashed border-stone-300 dark:bg-stone-900 dark:border-stone-700"
            >
              <div className="mx-auto w-16 h-16 rounded-2xl bg-stone-100 dark:bg-stone-800 flex items-center justify-center">
                <Search className="w-8 h-8 text-stone-400" />
              </div>
              <h3 className="mt-4 font-bold text-stone-800 dark:text-stone-200">لا توجد نتائج مطابقة</h3>
              <p className="mt-1 text-sm text-stone-500 dark:text-stone-400">
                جرّب تغيير معايير البحث أو إعادة ضبط الفلاتر.
              </p>
              <button
                onClick={reset}
                className="mt-4 inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold rounded-lg bg-stone-900 text-white hover:bg-amber-600 transition-colors dark:bg-white dark:text-stone-900 cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                إعادة ضبط الفلاتر
              </button>
            </motion.div>
          ) : (
            <motion.div
              key="results"
              initial={{opacity: 0}}
              animate={{opacity: 1}}
              exit={{opacity: 0}}
              className="space-y-5"
            >
              {/* Result summary */}
              <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-stone-500 dark:text-stone-400 px-1">
                <span>
                  «
                  <span className="font-extrabold text-stone-900 dark:text-white">{matchCount}</span>
                  » نتيجة
                  {hasActiveFilters && ' — حسب المعايير المحددة'}
                </span>
                <span className="text-[11px] text-stone-400 dark:text-stone-500">
                  {total} ملف و{totalLinks} رابط بالخزانة — اضغط «تحميل» لتنزيل الملف
                </span>
              </div>

              {visiblePlans.map((plan, idx) => (
                <motion.section
                  key={`${plan.السنة}-${plan.المادة}-${idx}`}
                  initial={{opacity: 0, y: 12}}
                  animate={{opacity: 1, y: 0}}
                  transition={{delay: Math.min(idx * 0.04, 0.4), duration: 0.3}}
                  className="bg-white rounded-2xl border border-stone-200 shadow-xs overflow-hidden dark:bg-stone-900 dark:border-stone-800"
                >
                  <div className="px-5 py-3 border-b border-stone-100 dark:border-stone-800 flex items-center justify-between gap-3 bg-gradient-to-l from-amber-50/60 to-transparent dark:from-amber-500/5">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <span className="px-2.5 py-1 text-[11px] font-extrabold rounded-lg bg-amber-500/15 text-amber-800 border border-amber-500/25 dark:bg-amber-500/10 dark:text-amber-300 dark:border-amber-500/30 shrink-0">
                        {levelLabel(plan.السنة)}
                      </span>
                      <h3 className="font-extrabold text-stone-900 dark:text-white text-sm truncate">
                        {plan.المادة}
                      </h3>
                      <div className="flex items-center gap-1.5">
                      <span className="text-[11px] font-semibold text-stone-400 dark:text-stone-500 shrink-0">
                        {plan.الوحدات.length + (plan.روابط_تحميل?.length || 0)} وثيقة
                      </span>
                      {plan.روابط_تحميل && plan.روابط_تحميل.length > 0 && (
                        <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-sky-700 dark:text-sky-300 bg-sky-100 dark:bg-sky-500/10 border border-sky-200 dark:border-sky-500/30 rounded-full px-2 py-0.5 shrink-0">
                          <Link2 className="w-3 h-3" />
                          {plan.روابط_تحميل.length} رابط
                        </span>
                      )}
                    </div>
                    </div>
                    <span className="hidden sm:block text-[10px] font-mono text-stone-300 dark:text-stone-600">
                      السنة {plan.السنة} ← {plan.المادة}
                    </span>
                  </div>

                  <div className="divide-y divide-stone-100 dark:divide-stone-800">
                    {(plan.روابط_تحميل || []).map((ext, ei) => {
                      const fmt = (ext.الرابط.match(/\.(pdf|docx?|xlsx?|pptx?|jpg|jpeg|png)/i)?.[1] || 'PDF').toUpperCase();
                      return (
                        <div
                          key={`l-${ei}`}
                          className="px-5 py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-amber-50/40 dark:hover:bg-amber-500/5 transition-colors"
                        >
                          <div className="min-w-0 space-y-1.5">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <a
                                href={ext.الرابط}
                                target="_blank"
                                rel="noopener noreferrer"
                                download
                                title={ext.الوصف}
                                className="font-bold text-stone-800 dark:text-stone-100 text-sm leading-snug hover:text-amber-700 dark:hover:text-amber-300 transition-colors truncate max-w-full"
                              >
                                {ext.الوصف}
                              </a>
                              <span
                                className={`text-[10px] px-2 py-0.5 rounded-md font-mono font-bold border shrink-0 ${formatBadge(fmt)}`}
                              >
                                {fmt}
                              </span>
                            </div>
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full bg-sky-100 text-sky-700 border border-sky-200 dark:bg-sky-500/10 dark:text-sky-300 dark:border-sky-500/30 font-semibold">
                                <Link2 className="w-3 h-3" />
                                رابط
                              </span>
                              {ext.نوع && (
                                <span
                                  className={`text-[10px] px-2 py-0.5 rounded-full border font-semibold ${docTypeTone(ext.نوع)}`}
                                >
                                  {ext.نوع}
                                </span>
                              )}
                              <span className="text-[10px] px-2 py-0.5 rounded-full bg-stone-100 text-stone-500 border border-stone-200 dark:bg-stone-800 dark:text-stone-400 dark:border-stone-700 font-mono">
                                {ext.المصدر}
                              </span>
                            </div>
                          </div>
                          <div className="flex items-center gap-2 shrink-0">
                            <a
                              href={ext.الرابط}
                              target="_blank"
                              rel="noopener noreferrer"
                              download
                              className="px-3.5 py-1.5 text-xs font-bold rounded-lg bg-stone-900 text-white hover:bg-amber-600 dark:bg-white dark:text-stone-900 dark:hover:bg-amber-400 transition-colors flex items-center gap-1.5 shadow-xs"
                              title="تحميل الملف"
                            >
                              <Download className="w-3.5 h-3.5" />
                              تحميل
                            </a>
                          </div>
                        </div>
                      );
                    })}

                    {plan.الوحدات.map((unit: UnitPlanItem, ui: number) => (
                      <div
                        key={ui}
                        className="px-5 py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-amber-50/40 dark:hover:bg-amber-500/5 transition-colors"
                      >
                        <div className="min-w-0 space-y-1.5">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="font-bold text-stone-800 dark:text-stone-100 text-sm leading-snug">
                              {unit.الملف}
                            </span>
                            <span
                              className={`text-[10px] px-2 py-0.5 rounded-md font-mono font-bold border shrink-0 ${formatBadge(unit.الصيغة)}`}
                            >
                              {unit.الصيغة}
                            </span>
                          </div>
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span
                              className={`text-[10px] px-2 py-0.5 rounded-full border font-semibold ${docTypeTone(unit.نوع_الوثيقة)}`}
                            >
                              {unit.نوع_الوثيقة}
                            </span>
                            <span className="text-[10px] px-2 py-0.5 rounded-full bg-stone-100 text-stone-500 border border-stone-200 dark:bg-stone-800 dark:text-stone-400 dark:border-stone-700 font-mono">
                              {unit.الحجم}
                            </span>
                            <span className="hidden sm:inline-flex text-[10px] font-mono text-stone-400 dark:text-stone-500 truncate max-w-[220px]" dir="ltr" title={unit.المسار}>
                              {unit.الوحدة}
                            </span>
                          </div>
                          {unit.الصور && unit.الصور.length > 0 && (
                            <div className="flex items-center gap-1.5">
                              <span className="relative w-16 h-12 rounded-lg overflow-hidden border border-stone-200 dark:border-stone-700 shadow-xs group cursor-zoom-in" onClick={() => setPreviewImg(unit.الصور![0]!.الرابط)}>
                                <img src={unit.الصور![0]!.الرابط} alt={unit.الصور![0]!.الوصف} loading="lazy" className="w-full h-full object-cover transition-transform group-hover:scale-110" />
                              </span>
                              <div className="flex flex-col gap-0.5 min-w-0">
                                <span className="text-[10px] font-bold text-purple-700 dark:text-purple-300 flex items-center gap-1">
                                  <FileCheck className="w-3 h-3" />
                                  {unit.الصور.length} صورة مرفقة
                                </span>
                                <span className="text-[10px] text-stone-400 dark:text-stone-500 truncate max-w-[220px]">
                                  {unit.الصور![0]!.الوصف}
                                </span>
                              </div>
                            </div>
                          )}
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          <button
                            onClick={() => copyText(unit.رابط_التحميل_المباشر, 'رابط التحميل')}
                            className="px-2.5 py-1.5 text-xs rounded-lg border border-stone-200 text-stone-600 hover:bg-stone-50 dark:border-stone-700 dark:text-stone-300 dark:hover:bg-stone-800 transition-colors flex items-center gap-1.5 cursor-pointer"
                            title="نسخ رابط التحميل"
                          >
                            {copied === unit.رابط_التحميل_المباشر ? (
                              <Check className="w-3.5 h-3.5 text-emerald-600" />
                            ) : (
                              <Copy className="w-3.5 h-3.5" />
                            )}
                            <span className="hidden lg:inline">نسخ الرابط</span>
                          </button>
                          <a
                            href={unit.رابط_التحميل_المباشر}
                            target="_blank"
                            rel="noopener noreferrer"
                            download={unit.الملف}
                            className="px-3.5 py-1.5 text-xs font-bold rounded-lg bg-stone-900 text-white hover:bg-amber-600 dark:bg-white dark:text-stone-900 dark:hover:bg-amber-400 transition-colors flex items-center gap-1.5 shadow-xs"
                            title="تحميل الملف مباشرة"
                          >
                            <Download className="w-3.5 h-3.5" />
                            تحميل
                          </a>
                        </div>
                      </div>
                    ))}
                  </div>
                </motion.section>
              ))}

              {filteredPlans.length > limit && (
                <div className="text-center pt-2">
                  <button
                    onClick={() => setLimit((p) => p + 30)}
                    className="px-6 py-2.5 text-xs font-bold rounded-xl bg-white border border-stone-300 text-stone-700 hover:bg-amber-50 hover:border-amber-400 hover:text-amber-800 shadow-xs dark:bg-stone-900 dark:border-stone-700 dark:text-stone-200 dark:hover:bg-amber-500/10 transition-colors cursor-pointer"
                  >
                    عرض المزيد
                    <span className="mr-1.5 text-[11px] text-stone-400">
                      ({filteredPlans.length - limit} قسم متبقٍ)
                    </span>
                  </button>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
        )}

        {/* ===== Sources ===== */}
        <section className="mt-8 p-5 rounded-2xl border border-stone-200 bg-white shadow-xs dark:bg-stone-900 dark:border-stone-800">
          <h3 className="font-extrabold text-stone-900 dark:text-white text-sm flex items-center gap-2">
            <Building className="w-4 h-4 text-amber-600" />
            المصادر التربوية التونسية المعتمدة
          </h3>
          <p className="mt-2 text-xs text-stone-500 dark:text-stone-400 leading-relaxed">
            كل ملفات المكتبة ({total} وثيقة) فُهرست وتُحقق (200 OK) وشملت مخططات الوحدات، أدلة
            المعلم، برامج وزارة التربية والجذاذات لجميع السنوات والمواد — مع روابط تحميل مباشرة.
          </p>
          <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-2">
            {stats.المصادر_المدمجة.map((src, i) => (
              <div
                key={i}
                className="p-2.5 rounded-xl bg-stone-50 border border-stone-200/80 dark:bg-stone-800/60 dark:border-stone-700/60 flex items-center gap-2 text-xs font-medium text-stone-700 dark:text-stone-300"
              >
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>{src}</span>
              </div>
            ))}
          </div>

          {/* JSON modal trigger (advanced) */}
          <button
            onClick={() => setShowJson(true)}
            className="mt-4 inline-flex items-center gap-1.5 text-[11px] font-semibold text-stone-400 hover:text-stone-600 dark:hover:text-stone-300 cursor-pointer"
          >
            <ChevronDown className="w-3.5 h-3.5" />
            بيانات JSON الخام للمطوّرين
          </button>
        </section>
      </main>

      {/* ===== Footer ===== */}
      <footer className="border-t border-stone-200 bg-white py-6 mt-4 dark:bg-stone-900 dark:border-stone-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center text-[11px] text-stone-400 dark:text-stone-500 space-y-1">
          <p>مكتبة المعلم التونسي — مصادر بيداغوجية رسمية ومحقَّقة (CNP · وزارة التربية · نجحني · موسوعة المعلم)</p>
          <p>
            {total} ملفاً + {totalLinks} رابطاً مصنّفة لجميع سنوات التعليم الأساسي (تحضيري ← 6)
            + {evaluationFiles.length} ملف تقييم ومتابعة
          </p>
          <p className="pt-1 text-stone-500 dark:text-stone-400">
            برمجة وجمع البيانات:{' '}
            <a
              href="http://devplatform-phi.vercel.app/p/tounekti17"
              target="_blank"
              rel="noopener noreferrer"
              className="font-bold text-amber-700 hover:text-amber-800 hover:underline dark:text-amber-400 dark:hover:text-amber-300"
            >
              Tounekti Mohamed
            </a>
          </p>
        </div>
      </footer>

      {/* ===== Toast ===== */}
      <AnimatePresence>
        {showTop && (
          <motion.button
            initial={{opacity: 0, y: 12}}
            animate={{opacity: 1, y: 0}}
            exit={{opacity: 0, y: 12}}
            onClick={() => window.scrollTo({top: 0, behavior: 'smooth'})}
            className="fixed bottom-5 right-5 z-40 w-10 h-10 rounded-full bg-stone-900 text-white shadow-lg hover:bg-amber-600 transition-colors flex items-center justify-center cursor-pointer dark:bg-white dark:text-stone-900 dark:hover:bg-amber-400"
            title="العودة إلى الأعلى"
            aria-label="العودة إلى الأعلى"
          >
            <ChevronDown className="w-5 h-5 rotate-180" />
          </motion.button>
        )}
      </AnimatePresence>

      {/* ===== Toast ===== */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{opacity: 0, y: -16, scale: 0.97}}
            animate={{opacity: 1, y: 0, scale: 1}}
            exit={{opacity: 0, y: -12, scale: 0.97}}
            className="fixed top-5 left-1/2 -translate-x-1/2 z-50 px-4 py-2.5 rounded-xl bg-stone-900 text-white text-xs font-bold shadow-lg flex items-center gap-2 dark:bg-white dark:text-stone-900"
          >
            <CheckCircle2 className="w-4 h-4 text-emerald-400 dark:text-emerald-600" />
            {toast}
          </motion.div>
        )}
      </AnimatePresence>

      {/* ===== JSON modal ===== */}
      <AnimatePresence>
        {showJson && (
          <motion.div
            initial={{opacity: 0}}
            animate={{opacity: 1}}
            exit={{opacity: 0}}
            className="fixed inset-0 z-50 bg-stone-900/60 backdrop-blur-sm flex items-center justify-center p-4"
            onClick={() => setShowJson(false)}
          >
            <motion.div
              initial={{scale: 0.96, y: 8}}
              animate={{scale: 1, y: 0}}
              exit={{scale: 0.96, y: 8}}
              onClick={(e) => e.stopPropagation()}
              className="bg-white dark:bg-stone-900 rounded-2xl border border-stone-200 dark:border-stone-700 max-w-3xl w-full max-h-[85vh] flex flex-col shadow-2xl"
            >
              <div className="p-4 border-b border-stone-200 dark:border-stone-800 flex items-center justify-between gap-2">
                <div>
                  <h4 className="font-extrabold text-sm text-stone-900 dark:text-white">
                    mokhattat_tounes_moamaq.json
                  </h4>
                  <p className="text-[11px] text-stone-500 dark:text-stone-400">
                    {total} وثيقة ومخطط رسمي
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => copyText(JSON.stringify(dataset, null, 2), 'البيانات')}
                    className="px-3 py-1.5 text-xs font-semibold rounded-lg border border-stone-200 hover:bg-stone-50 dark:border-stone-700 dark:hover:bg-stone-800 cursor-pointer"
                  >
                    {copied === JSON.stringify(dataset, null, 2) ? (
                      <Check className="w-3.5 h-3.5 text-emerald-600" />
                    ) : (
                      <Copy className="w-3.5 h-3.5" />
                    )}
                    <span className="mr-1">نسخ الكل</span>
                  </button>
                  <button
                    onClick={() => setShowJson(false)}
                    className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-stone-100 hover:bg-stone-200 dark:bg-stone-800 dark:hover:bg-stone-700 cursor-pointer"
                  >
                    إغلاق
                  </button>
                </div>
              </div>
              <div className="flex-1 overflow-auto bg-stone-50 dark:bg-stone-950">
                <pre dir="ltr" className="text-left text-xs font-mono text-stone-800 dark:text-stone-300 p-4 whitespace-pre-wrap">
                  {JSON.stringify(dataset, null, 2)}
                </pre>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ===== image lightbox ===== */}
      <AnimatePresence>
        {previewImg && (
          <motion.div
            initial={{opacity: 0}}
            animate={{opacity: 1}}
            exit={{opacity: 0}}
            className="fixed inset-0 z-50 bg-stone-950/85 backdrop-blur-sm flex items-center justify-center p-4"
            onClick={() => setPreviewImg(null)}
          >
            <motion.div
              initial={{scale: 0.95, y: 8}}
              animate={{scale: 1, y: 0}}
              exit={{scale: 0.95, y: 8}}
              onClick={(e) => e.stopPropagation()}
              className="max-w-3xl w-full max-h-[88vh] flex flex-col"
            >
              <div className="flex items-center justify-between gap-2 p-2">
                <a
                  href={previewImg}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[11px] font-semibold text-amber-300 hover:text-amber-200 underline underline-offset-2 font-mono truncate"
                >
                  فتح الصورة الأصلية
                </a>
                <button
                  onClick={() => setPreviewImg(null)}
                  className="p-2 rounded-full bg-white/10 hover:bg-white/20 text-white cursor-pointer"
                  title="إغلاق"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              <img
                src={previewImg}
                alt="معاينة"
                className="w-full max-h-[80vh] object-contain rounded-xl shadow-2xl bg-white"
              />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}