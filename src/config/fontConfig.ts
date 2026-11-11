export type PoemFontId =
  | 'vazirmatn'
  | 'gulzar'
  | 'noto-nastaliq'
  | 'amiri'
  | 'noto-naskh'
  | 'markazi'
  | 'scheherazade'
  | 'lateef'
  | 'mirza'
  | 'parastoo'
  | 'sahel'
  | 'samim'
  | 'shabnam'
  | 'lalezar';

export interface PoemFontOption {
  id: PoemFontId;
  label: string;
  description: string;
  faceName: string;
  cssFamily: string;
}

export var POEM_FONTS: PoemFontOption[] = [
  {
    id: 'vazirmatn',
    label: 'وزیرمتن',
    description: 'قلم مدرن، خوانا و استاندارد برنامه',
    faceName: 'Vazirmatn',
    cssFamily: "'Vazirmatn', system-ui, sans-serif"
  },
  {
    id: 'gulzar',
    label: 'گلزار (نستعلیق معاصر)',
    description: 'قلم شاعرانه و نستعلیق‌گونه ویژهٔ غزل و شعر',
    faceName: 'Gulzar',
    cssFamily: "'Gulzar', 'Vazirmatn', serif"
  },
  {
    id: 'noto-nastaliq',
    label: 'نستعلیق اصیل',
    description: 'خوشنویسی نستعلیق سنتی با کشیدگی حروف',
    faceName: 'Noto Nastaliq Urdu',
    cssFamily: "'Noto Nastaliq Urdu', 'Vazirmatn', serif"
  },
  {
    id: 'amiri',
    label: 'امیری (نسخ دیوانی)',
    description: 'قلم کلاسیک و باوقار الهام‌گرفته از چاپ سنگی',
    faceName: 'Amiri',
    cssFamily: "'Amiri', 'Vazirmatn', serif"
  },
  {
    id: 'parastoo',
    label: 'پرستو (کتابی فارسی)',
    description: 'قلم ادبی و ظریف ویژهٔ متون و دواوین فارسی',
    faceName: 'Parastoo',
    cssFamily: "'Parastoo', 'Vazirmatn', serif"
  },
  {
    id: 'noto-naskh',
    label: 'نوتو نسخ (کتابی)',
    description: 'نسخ شفاف و بسیار خوش‌خوان برای مثنوی و متن طولانی',
    faceName: 'Noto Naskh Arabic',
    cssFamily: "'Noto Naskh Arabic', 'Vazirmatn', serif"
  },
  {
    id: 'markazi',
    label: 'مرکزی (ادبی)',
    description: 'قلم ادبی متعادل با تناسب مطبوعاتی',
    faceName: 'Markazi Text',
    cssFamily: "'Markazi Text', 'Vazirmatn', serif"
  },
  {
    id: 'scheherazade',
    label: 'شهرزاد (نسخ سنتی)',
    description: 'نسخ کلاسیک با نمایش دقیق اعراب و حرکات',
    faceName: 'Scheherazade New',
    cssFamily: "'Scheherazade New', 'Vazirmatn', serif"
  },
  {
    id: 'lateef',
    label: 'لطیف (نسخ کشیده)',
    description: 'نسخ نرم، روان و خوش‌خط برای قرائت آرام',
    faceName: 'Lateef',
    cssFamily: "'Lateef', 'Vazirmatn', serif"
  },
  {
    id: 'mirza',
    label: 'میرزا (نسخ و ثلث)',
    description: 'قلم سنتی با حال‌وهوای کتیبه و نسخ قدیمی',
    faceName: 'Mirza',
    cssFamily: "'Mirza', 'Vazirmatn', serif"
  },
  {
    id: 'sahel',
    label: 'ساحل (مدرن نرم)',
    description: 'قلم فارسی نرم و چشم‌نواز برای مطالعه طولانی',
    faceName: 'Sahel',
    cssFamily: "'Sahel', 'Vazirmatn', sans-serif"
  },
  {
    id: 'samim',
    label: 'صمیم (متعادل فارسی)',
    description: 'قلم آرام و یکدست با خوانایی بالا در موبایل',
    faceName: 'Samim',
    cssFamily: "'Samim', 'Vazirmatn', sans-serif"
  },
  {
    id: 'shabnam',
    label: 'شبنم (گرد و ملایم)',
    description: 'قلم خوانا و ساده با قوس‌های لطیف فارسی',
    faceName: 'Shabnam',
    cssFamily: "'Shabnam', 'Vazirmatn', sans-serif"
  },
  {
    id: 'lalezar',
    label: 'لاله‌زار (نمایشی پررنگ)',
    description: 'قلم ضخیم و کتیبه‌مانند برای جلوهٔ پرقدرت ابیات',
    faceName: 'Lalezar',
    cssFamily: "'Lalezar', 'Vazirmatn', sans-serif"
  }
];

var preloadedFaces = new Set<string>();
var allPreloadStarted = false;

export function getPoemFontOption(fontId?: string | null): PoemFontOption {
  for (var i = 0; i < POEM_FONTS.length; i++) {
    if (POEM_FONTS[i].id === fontId) {
      return POEM_FONTS[i];
    }
  }
  return POEM_FONTS[0];
}

/**
 * پیش‌بارگذاری فوری یک فونت در حافظه مرورگر (با کاراکتر فارسی برای بارگذاری زیرمجموعه عربی/فارسی)
 */
export function preloadPoemFont(fontId?: string | null): Promise<void> {
  if (typeof document === 'undefined' || !document.fonts || !document.fonts.load) {
    return Promise.resolve();
  }
  var option = getPoemFontOption(fontId);
  if (preloadedFaces.has(option.id)) {
    return Promise.resolve();
  }
  preloadedFaces.add(option.id);
  var face = `"${option.faceName}"`;
  return Promise.all([
    document.fonts.load(`400 20px ${face}`, 'ابپت').catch(function () { return []; }),
    document.fonts.load(`500 20px ${face}`, 'ابپت').catch(function () { return []; })
  ]).then(function () {
    return undefined;
  });
}

/**
 * پیش‌بارگذاری تدریجی تمام فونت‌های شعر تا تغییر فونت در صفحه بدون هیچ تأخیری انجام شود
 */
export function preloadAllPoemFonts(): void {
  if (allPreloadStarted) return;
  if (typeof document === 'undefined' || !document.fonts || !document.fonts.load) return;
  allPreloadStarted = true;

  for (var i = 0; i < POEM_FONTS.length; i++) {
    (function (idx: number) {
      var font = POEM_FONTS[idx];
      var run = function () {
        void preloadPoemFont(font.id);
      };
      if (typeof window !== 'undefined' && 'requestIdleCallback' in window) {
        (window as any).requestIdleCallback(run, { timeout: 1500 + idx * 150 });
      } else {
        setTimeout(run, 150 + idx * 80);
      }
    })(i);
  }
}
