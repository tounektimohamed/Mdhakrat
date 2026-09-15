import { useState, useMemo } from 'react';
import { dataset } from './data';
import { UnitPlanItem } from './types';
import { 
  BookOpen, 
  Search, 
  Copy, 
  CheckCircle2, 
  Download, 
  GraduationCap, 
  Layers, 
  FileCheck, 
  Building, 
  Check, 
  FileText
} from 'lucide-react';

export default function App() {
  const [selectedYear, setSelectedYear] = useState<number | 'all'>('all');
  const [selectedSubject, setSelectedSubject] = useState<string>('all');
  const [selectedDocType, setSelectedDocType] = useState<string>('all');
  const [selectedFormat, setSelectedFormat] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [copiedLink, setCopiedLink] = useState<string | null>(null);
  const [copiedJson, setCopiedJson] = useState(false);
  const [showJsonModal, setShowJsonModal] = useState(false);
  const [displayLimit, setDisplayLimit] = useState<number>(40);

  // Extract unique subjects
  const subjects = useMemo(() => {
    const s = new Set<string>();
    dataset.المخططات.forEach(item => s.add(item.المادة));
    return Array.from(s).sort();
  }, []);

  // Extract unique document types
  const docTypes = useMemo(() => {
    const types = new Set<string>();
    dataset.المخططات.forEach(item => {
      item.الوحدات.forEach(u => types.add(u.نوع_الوثيقة));
    });
    return Array.from(types).sort();
  }, []);

  // Extract unique formats
  const formats = useMemo(() => {
    const f = new Set<string>();
    dataset.المخططات.forEach(item => {
      item.الوحدات.forEach(u => f.add(u.الصيغة));
    });
    return Array.from(f).sort();
  }, []);

  // Filter plans based on year, subject, docType, format and search query
  const filteredPlans = useMemo(() => {
    return dataset.المخططات.map(plan => {
      if (selectedYear !== 'all' && plan.السنة !== selectedYear) {
        return null;
      }
      if (selectedSubject !== 'all' && plan.المادة !== selectedSubject) {
        return null;
      }

      const matchingUnits = plan.الوحدات.filter((unit: UnitPlanItem) => {
        if (selectedDocType !== 'all' && unit.نوع_الوثيقة !== selectedDocType) {
          return false;
        }
        if (selectedFormat !== 'all' && unit.الصيغة !== selectedFormat) {
          return false;
        }

        if (!searchQuery.trim()) return true;
        const q = searchQuery.toLowerCase();
        return (
          unit.الوحدة.toLowerCase().includes(q) ||
          unit.الملف.toLowerCase().includes(q) ||
          unit.المسار.toLowerCase().includes(q) ||
          plan.المادة.toLowerCase().includes(q) ||
          unit.نوع_الوثيقة.toLowerCase().includes(q) ||
          `سنة ${plan.السنة}`.includes(q)
        );
      });

      if (matchingUnits.length === 0) return null;

      return {
        ...plan,
        الوحدات: matchingUnits
      };
    }).filter(Boolean);
  }, [selectedYear, selectedSubject, selectedDocType, selectedFormat, searchQuery]);

  // Total matching units count
  const matchingUnitsCount = useMemo(() => {
    return filteredPlans.reduce((acc, plan) => acc + (plan?.الوحدات.length || 0), 0);
  }, [filteredPlans]);

  // Copy link handler
  const handleCopyLink = (url: string) => {
    navigator.clipboard.writeText(url);
    setCopiedLink(url);
    setTimeout(() => setCopiedLink(null), 2000);
  };

  // Copy entire JSON handler
  const handleCopyJson = () => {
    navigator.clipboard.writeText(JSON.stringify(dataset, null, 2));
    setCopiedJson(true);
    setTimeout(() => setCopiedJson(false), 2000);
  };

  // Download JSON handler
  const handleDownloadJson = () => {
    const blob = new Blob([JSON.stringify(dataset, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'mokhattat_tounes_moamaq.json';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Format badge color helper
  const getFormatBadge = (format: string) => {
    switch (format.toUpperCase()) {
      case 'PDF':
        return 'bg-rose-50 text-rose-700 border-rose-200';
      case 'DOC':
      case 'DOCX':
        return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'RAR':
      case 'ZIP':
        return 'bg-amber-50 text-amber-700 border-amber-200';
      case 'JPG':
      case 'PNG':
        return 'bg-purple-50 text-purple-700 border-purple-200';
      default:
        return 'bg-stone-50 text-stone-700 border-stone-200';
    }
  };

  // Reset all filters
  const handleResetFilters = () => {
    setSelectedYear('all');
    setSelectedSubject('all');
    setSelectedDocType('all');
    setSelectedFormat('all');
    setSearchQuery('');
    setDisplayLimit(40);
  };

  return (
    <div className="min-h-screen bg-[#FBFBFA] text-[#1C1917] flex flex-col selection:bg-amber-100 selection:text-amber-900">
      {/* Top Header */}
      <header className="border-b border-stone-200 bg-white sticky top-0 z-30 shadow-2xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-700 shrink-0">
              <GraduationCap className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-lg font-bold tracking-tight text-stone-900">
                  مخططات التعليم الابتدائي التونسي
                </h1>
                <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200">
                  {dataset.إحصائيات_المكتبة.إجمالي_الملفات_المحققة} وثيقة ومخطط رسمي
                </span>
              </div>
              <p className="text-xs text-stone-500 mt-0.5">
                مكتبة شاملة لمخططات الوحدات، جذاذات المعلم، وأدلة المركز الوطني البيداغوجي للسنوات (1 إلى 6)
              </p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2 flex-wrap justify-end">
            <button
              id="view-json-btn"
              onClick={() => setShowJsonModal(true)}
              className="px-3 py-1.5 text-xs font-medium rounded-lg border border-stone-200 text-stone-700 hover:bg-stone-50 transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <FileCheck className="w-3.5 h-3.5 text-stone-500" />
              <span>عرض JSON</span>
            </button>
            <button
              id="copy-json-btn"
              onClick={handleCopyJson}
              className="px-3 py-1.5 text-xs font-medium rounded-lg border border-stone-200 text-stone-700 hover:bg-stone-50 transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              {copiedJson ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5 text-stone-500" />}
              <span>{copiedJson ? 'تم النسخ' : 'نسخ البيانات'}</span>
            </button>
            <button
              id="download-json-btn"
              onClick={handleDownloadJson}
              className="px-3.5 py-1.5 text-xs font-semibold rounded-lg bg-amber-600 text-white hover:bg-amber-700 transition-colors flex items-center gap-1.5 shadow-xs cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>تحميل mokhattat_tounes_moamaq.json</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Body */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {/* Overview Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="p-4 rounded-xl border border-stone-200 bg-white shadow-2xs">
            <div className="flex items-center justify-between text-stone-500 text-xs mb-1">
              <span>إجمالي الملفات والمخططات</span>
              <BookOpen className="w-4 h-4 text-amber-600" />
            </div>
            <div className="text-2xl font-bold text-stone-900">
              {dataset.إحصائيات_المكتبة.إجمالي_الملفات_المحققة}
            </div>
            <div className="text-[11px] text-stone-400 mt-1">وثيقة بيداغوجية ومخطط</div>
          </div>

          <div className="p-4 rounded-xl border border-stone-200 bg-white shadow-2xs">
            <div className="flex items-center justify-between text-stone-500 text-xs mb-1">
              <span>أدلة ومخططات المعلم CNP</span>
              <Building className="w-4 h-4 text-emerald-600" />
            </div>
            <div className="text-2xl font-bold text-emerald-700 flex items-center gap-1.5">
              38 دليلاً
              <span className="text-xs font-normal text-emerald-600">(رسمي)</span>
            </div>
            <div className="text-[11px] text-stone-400 mt-1">المركز الوطني البيداغوجي</div>
          </div>

          <div className="p-4 rounded-xl border border-stone-200 bg-white shadow-2xs">
            <div className="flex items-center justify-between text-stone-500 text-xs mb-1">
              <span>المراحل المغطاة</span>
              <Layers className="w-4 h-4 text-amber-600" />
            </div>
            <div className="text-2xl font-bold text-stone-900">1 ← 6 + الرسمية</div>
            <div className="text-[11px] text-stone-400 mt-1">كامل المرحلة الابتدائية</div>
          </div>

          <div className="p-4 rounded-xl border border-stone-200 bg-white shadow-2xs">
            <div className="flex items-center justify-between text-stone-500 text-xs mb-1">
              <span>الصيغ المتوفرة</span>
              <FileText className="w-4 h-4 text-amber-600" />
            </div>
            <div className="text-lg font-bold text-stone-900 flex items-center gap-1">
              <span>349 PDF</span>
              <span className="text-xs text-stone-400">• 201 Word</span>
            </div>
            <div className="text-[11px] text-stone-400 mt-1">تحميل مباشر بنقرة واحدة</div>
          </div>
        </div>

        {/* Filters Card */}
        <div className="p-4 rounded-xl border border-stone-200 bg-white shadow-2xs space-y-4">
          {/* Search bar */}
          <div className="relative">
            <Search className="w-4 h-4 absolute right-3 top-3 text-stone-400" />
            <input
              id="search-input"
              type="text"
              placeholder="ابحث في 665 ملفاً (مثال: دليل المعلم، الوحدة 1، الفرنسية، إيقاظ علمي، تقييم، CNP...)"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-4 pr-10 py-2 text-sm rounded-lg border border-stone-200 focus:outline-hidden focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all bg-stone-50/50"
            />
          </div>

          {/* Year selector */}
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-xs font-semibold text-stone-500 ml-2">المستوى الدراسي:</span>
            <button
              id="year-all-btn"
              onClick={() => setSelectedYear('all')}
              className={`px-3 py-1 text-xs rounded-lg font-medium transition-colors cursor-pointer ${
                selectedYear === 'all'
                  ? 'bg-stone-900 text-white'
                  : 'bg-stone-100 text-stone-700 hover:bg-stone-200'
              }`}
            >
              جميع المستويات ({dataset.إحصائيات_المكتبة.إجمالي_الملفات_المحققة})
            </button>
            <button
              id="year-0-btn"
              onClick={() => setSelectedYear(0)}
              className={`px-3 py-1 text-xs rounded-lg font-medium transition-colors cursor-pointer ${
                selectedYear === 0
                  ? 'bg-amber-600 text-white'
                  : 'bg-stone-100 text-stone-700 hover:bg-stone-200'
              }`}
            >
              الوثائق الرسمية ({dataset.إحصائيات_المكتبة.توزيع_الملفات_حسب_المستويات['البرامج والوثائق الرسمية'] || 0})
            </button>
            {[1, 2, 3, 4, 5, 6].map((year) => (
              <button
                key={year}
                id={`year-${year}-btn`}
                onClick={() => setSelectedYear(year)}
                className={`px-3 py-1 text-xs rounded-lg font-medium transition-colors cursor-pointer ${
                  selectedYear === year
                    ? 'bg-amber-600 text-white'
                    : 'bg-stone-100 text-stone-700 hover:bg-stone-200'
                }`}
              >
                السنة {year} ({dataset.إحصائيات_المكتبة.توزيع_الملفات_حسب_المستويات[`السنة ${year}`] || 0})
              </button>
            ))}
          </div>

          {/* Subject selector */}
          <div className="flex flex-wrap items-center gap-1.5 pt-2 border-t border-stone-100">
            <span className="text-xs font-semibold text-stone-500 ml-2">المادة:</span>
            <button
              id="subject-all-btn"
              onClick={() => setSelectedSubject('all')}
              className={`px-2.5 py-0.5 text-xs rounded-md transition-colors cursor-pointer ${
                selectedSubject === 'all'
                  ? 'bg-stone-800 text-white'
                  : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
              }`}
            >
              كل المواد
            </button>
            {subjects.map((subj) => (
              <button
                key={subj}
                id={`subject-${subj}-btn`}
                onClick={() => setSelectedSubject(subj)}
                className={`px-2.5 py-0.5 text-xs rounded-md transition-colors cursor-pointer ${
                  selectedSubject === subj
                    ? 'bg-amber-600 text-white'
                    : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
                }`}
              >
                {subj} ({dataset.إحصائيات_المكتبة.توزيع_الملفات_حسب_المواد[subj] || 0})
              </button>
            ))}
          </div>

          {/* Document type and format row */}
          <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-stone-100 text-xs">
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-semibold text-stone-500">نوع الوثيقة:</span>
              <select
                value={selectedDocType}
                onChange={(e) => setSelectedDocType(e.target.value)}
                className="bg-stone-50 border border-stone-200 rounded-md px-2 py-1 text-xs text-stone-700 focus:outline-hidden"
              >
                <option value="all">جميع الأنواع</option>
                {docTypes.map((dt) => (
                  <option key={dt} value={dt}>{dt}</option>
                ))}
              </select>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <span className="font-semibold text-stone-500">الصيغة:</span>
              <select
                value={selectedFormat}
                onChange={(e) => setSelectedFormat(e.target.value)}
                className="bg-stone-50 border border-stone-200 rounded-md px-2 py-1 text-xs text-stone-700 focus:outline-hidden"
              >
                <option value="all">جميع الصيغ</option>
                {formats.map((fmt) => (
                  <option key={fmt} value={fmt}>{fmt}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Results Bar */}
        <div className="flex items-center justify-between text-xs text-stone-500 px-1">
          <div>
            يتم عرض <span className="font-semibold text-stone-800">{matchingUnitsCount}</span> ملفاً من إجمالي {dataset.إحصائيات_المكتبة.إجمالي_الملفات_المحققة}
          </div>
          {(selectedYear !== 'all' || selectedSubject !== 'all' || selectedDocType !== 'all' || selectedFormat !== 'all' || searchQuery) && (
            <button
              onClick={handleResetFilters}
              className="text-amber-700 hover:underline cursor-pointer font-medium"
            >
              إعادة ضبط جميع الفلاتر
            </button>
          )}
        </div>

        {/* Results Groups */}
        <div className="space-y-6">
          {filteredPlans.length === 0 ? (
            <div className="text-center py-16 bg-white rounded-xl border border-stone-200">
              <Search className="w-10 h-10 text-stone-300 mx-auto mb-3" />
              <h3 className="text-stone-700 font-semibold text-base">لا توجد ملفات تطابق معايير التصفية</h3>
              <p className="text-stone-400 text-xs mt-1">يرجى تعديل معايير البحث أو اختيار مستوى آخر.</p>
              <button
                onClick={handleResetFilters}
                className="mt-4 px-4 py-1.5 text-xs bg-stone-900 text-white rounded-lg hover:bg-stone-800"
              >
                إعادة ضبط الفلاتر
              </button>
            </div>
          ) : (
            filteredPlans.slice(0, displayLimit).map((planGroup, idx) => {
              if (!planGroup) return null;
              return (
                <section
                  key={`${planGroup.السنة}-${planGroup.المادة}-${idx}`}
                  className="bg-white rounded-xl border border-stone-200 shadow-2xs overflow-hidden"
                >
                  {/* Subject Group Header */}
                  <div className="bg-stone-50/90 px-5 py-3 border-b border-stone-200 flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <span className="px-2 py-0.5 text-xs font-bold rounded-md bg-amber-500/15 text-amber-900 border border-amber-500/20">
                        {planGroup.السنة === 0 ? 'الوثائق الرسمية' : `السنة ${planGroup.السنة}`}
                      </span>
                      <h2 className="font-bold text-stone-900 text-base">
                        {planGroup.المادة}
                      </h2>
                    </div>
                    <span className="text-xs text-stone-500 font-medium">
                      {planGroup.الوحدات.length} ملف
                    </span>
                  </div>

                  {/* Documents List */}
                  <div className="divide-y divide-stone-100">
                    {planGroup.الوحدات.map((unit: UnitPlanItem, unitIdx: number) => (
                      <div
                        key={unitIdx}
                        className="px-5 py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-stone-50/60 transition-colors"
                      >
                        <div className="space-y-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-semibold text-stone-800 text-sm">
                              {unit.الوحدة}
                            </span>
                            <span className={`text-[11px] px-2 py-0.5 rounded-md font-mono font-semibold border ${getFormatBadge(unit.الصيغة)}`}>
                              {unit.الصيغة}
                            </span>
                            <span className="text-[11px] px-2 py-0.5 rounded-full bg-stone-100 text-stone-600 font-normal">
                              {unit.نوع_الوثيقة}
                            </span>
                            <span className="text-[11px] px-2 py-0.5 rounded-full bg-stone-50 text-stone-500 border border-stone-200 font-mono">
                              {unit.الحجم}
                            </span>
                          </div>
                          
                          <div className="text-xs text-stone-400 font-mono flex items-center gap-2 truncate max-w-2xl">
                            <span className="truncate">{unit.المسار}</span>
                          </div>
                        </div>

                        {/* Action buttons (Direct download and copy only) */}
                        <div className="flex items-center gap-2 shrink-0">
                          <button
                            onClick={() => handleCopyLink(unit.رابط_التحميل_المباشر)}
                            className="px-2.5 py-1 text-xs rounded-md border border-stone-200 text-stone-600 hover:bg-white transition-colors flex items-center gap-1 cursor-pointer"
                            title="نسخ رابط التحميل"
                          >
                            {copiedLink === unit.رابط_التحميل_المباشر ? (
                              <>
                                <Check className="w-3.5 h-3.5 text-emerald-600" />
                                <span className="text-emerald-700">تم النسخ</span>
                              </>
                            ) : (
                              <>
                                <Copy className="w-3.5 h-3.5 text-stone-400" />
                                <span>نسخ الرابط</span>
                              </>
                            )}
                          </button>

                          <a
                            href={unit.رابط_التحميل_المباشر}
                            target="_blank"
                            rel="noopener noreferrer"
                            download={unit.الملف}
                            className="px-3.5 py-1 text-xs font-semibold rounded-md bg-stone-900 text-white hover:bg-amber-600 transition-colors flex items-center gap-1.5 shadow-xs"
                            title="تحميل الملف مباشرة"
                          >
                            <Download className="w-3.5 h-3.5" />
                            <span>تحميل الملف</span>
                          </a>
                        </div>
                      </div>
                    ))}
                  </div>
                </section>
              );
            })
          )}

          {/* Load more if there are many groups */}
          {filteredPlans.length > displayLimit && (
            <div className="text-center pt-4">
              <button
                onClick={() => setDisplayLimit(prev => prev + 30)}
                className="px-6 py-2 text-xs font-semibold rounded-lg bg-white border border-stone-300 text-stone-700 hover:bg-stone-50 shadow-2xs cursor-pointer"
              >
                عرض المزيد من المواد والمخططات ({filteredPlans.length - displayLimit} متبقية)
              </button>
            </div>
          )}
        </div>

        {/* Pedagogical Sources Card */}
        <section className="p-5 rounded-xl border border-stone-200 bg-white shadow-2xs space-y-3">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <h3 className="font-bold text-stone-900 text-sm flex items-center gap-2">
              <Building className="w-4 h-4 text-amber-600" />
              المصادر التربوية التونسية المعتمدة
            </h3>
          </div>
          <p className="text-xs text-stone-600 leading-relaxed">
            تمت فهرسة ومراجعة وتجهيز جميع الملفات البالغ عددها <strong>665 ملفاً رسمياً</strong> مخصصاً للمرحلة الابتدائية، تشمل أدلة المركز الوطني البيداغوجي (CNP)، برامج وزارة التربية التونسية، ومخططات الوحدات للسنوات من الأولى إلى السادسة لكافة المواد التعليمية مع روابط تحميل مباشرة.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs pt-1">
            {dataset.إحصائيات_المكتبة.المصادر_المدمجة.map((source, i) => (
              <div key={i} className="p-2.5 rounded-lg bg-stone-50 border border-stone-200/80 flex items-center gap-2 text-stone-700">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>{source}</span>
              </div>
            ))}
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-stone-200 bg-white py-6 mt-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center text-xs text-stone-400 space-y-1">
          <p>
            قاعدة بيانات مخططات وحدات التعليم الابتدائي التونسي — مصادر بيداغوجية رسمية ومحققة
          </p>
          <p>الملف المصدر المحقق: <code className="text-stone-600 bg-stone-100 px-1 py-0.5 rounded font-mono">mokhattat_tounes_moamaq.json</code></p>
        </div>
      </footer>

      {/* Modal for Raw JSON */}
      {showJsonModal && (
        <div className="fixed inset-0 z-50 bg-stone-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-stone-200 max-w-3xl w-full max-h-[85vh] flex flex-col shadow-xl">
            <div className="p-4 border-b border-stone-200 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-stone-900 text-sm">محتوى ملف mokhattat_tounes_moamaq.json</h3>
                <p className="text-xs text-stone-500">
                  {dataset.إحصائيات_المكتبة.إجمالي_الملفات_المحققة} وثيقة ومخطط رسمي
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={handleCopyJson}
                  className="px-3 py-1 text-xs rounded-lg border border-stone-200 text-stone-700 hover:bg-stone-50 flex items-center gap-1 cursor-pointer"
                >
                  {copiedJson ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedJson ? 'تم النسخ' : 'نسخ الكل'}</span>
                </button>
                <button
                  onClick={handleDownloadJson}
                  className="px-3 py-1 text-xs rounded-lg bg-amber-600 text-white hover:bg-amber-700 flex items-center gap-1 cursor-pointer font-medium"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>تحميل JSON</span>
                </button>
                <button
                  onClick={() => setShowJsonModal(false)}
                  className="px-3 py-1 text-xs rounded-lg bg-stone-100 text-stone-700 hover:bg-stone-200 font-medium cursor-pointer"
                >
                  إغلاق
                </button>
              </div>
            </div>
            <div className="p-4 overflow-auto flex-1 font-mono text-xs text-stone-800 bg-stone-50">
              <pre dir="ltr" className="text-left whitespace-pre-wrap">{JSON.stringify(dataset, null, 2)}</pre>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
