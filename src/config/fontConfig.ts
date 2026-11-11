export type PoemFontId = 'vazirmatn' | 'gulzar' | 'amiri' | 'noto-naskh' | 'markazi';

export interface PoemFontOption {
  id: PoemFontId;
  label: string;
  description: string;
  cssFamily: string;
}

export var POEM_FONTS: PoemFontOption[] = [
  {
    id: 'vazirmatn',
    label: 'وزیرمتن (پیش‌فرض)',
    description: 'قلم مدرن، خوانا و همیشه در دسترس (آفلاین)',
    cssFamily: "'Vazirmatn', system-ui, sans-serif"
  },
  {
    id: 'gulzar',
    label: 'گلزار (نستعلیق معاصر)',
    description: 'قلم شاعرانه و نستعلیق‌گونه ویژهٔ غزل و شعر',
    cssFamily: "'Gulzar', 'Vazirmatn', serif"
  },
  {
    id: 'amiri',
    label: 'امیری (نسخ دیوانی)',
    description: 'قلم کلاسیک و باوقار الهام‌گرفته از چاپ سنگی',
    cssFamily: "'Amiri', 'Vazirmatn', serif"
  },
  {
    id: 'noto-naskh',
    label: 'نوتو نسخ (کتابی)',
    description: 'قلم نسخ شفاف و بسیار خوش‌خوان برای مثنوی و متن',
    cssFamily: "'Noto Naskh Arabic', 'Vazirmatn', serif"
  },
  {
    id: 'markazi',
    label: 'مرکزی (ادبی)',
    description: 'قلم ادبی متعادل با تناسب مطبوعاتی',
    cssFamily: "'Markazi Text', 'Vazirmatn', serif"
  }
];

export function getPoemFontOption(fontId?: string | null): PoemFontOption {
  for (var i = 0; i < POEM_FONTS.length; i++) {
    if (POEM_FONTS[i].id === fontId) {
      return POEM_FONTS[i];
    }
  }
  return POEM_FONTS[0];
}
