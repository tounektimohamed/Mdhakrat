export interface UnitPlanItem {
  الوحدة: string;
  الملف: string;
  المسار: string;
  الرابط: string;
  رابط_التحميل_المباشر: string;
  نوع_الوثيقة: string;
  نوع_الرابط: string;
  المصدر: string;
  حالة_التحقق: string;
  تاريخ_التحقق: string;
  الحجم: string;
  الصيغة: string;
}

export interface SubjectPlan {
  السنة: number;
  المادة: string;
  الوحدات: UnitPlanItem[];
}

export interface DatasetStats {
  إجمالي_الملفات_المحققة: number;
  حالة_التحقق: string;
  تاريخ_التحديث: string;
  توزيع_الملفات_حسب_المستويات: Record<string, number>;
  توزيع_الملفات_حسب_المواد: Record<string, number>;
  توزيع_الملفات_حسب_الصيغ: Record<string, number>;
  المصادر_المدمجة: string[];
}

export interface Dataset {
  الموضوع: string;
  تاريخ_التجميع: string;
  ملاحظة: string;
  إحصائيات_المكتبة: DatasetStats;
  المخططات: SubjectPlan[];
}
