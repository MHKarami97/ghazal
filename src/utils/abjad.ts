import type { GanjoorVerse } from '../types/ganjoor';

var ABJAD_VALUES: Record<string, number> = {
  'ا': 1,
  'ب': 2,
  'ج': 3,
  'د': 4,
  'ه': 5,
  'و': 6,
  'ز': 7,
  'ح': 8,
  'ط': 9,
  'ي': 10,
  'ک': 20,
  'ل': 30,
  'م': 40,
  'ن': 50,
  'س': 60,
  'ع': 70,
  'ف': 80,
  'ص': 90,
  'ق': 100,
  'ر': 200,
  'ش': 300,
  'ت': 400,
  'ث': 500,
  'خ': 600,
  'ذ': 700,
  'ض': 800,
  'ظ': 900,
  'غ': 1000,
  // حروف چهارگانه فارسی معادل هم‌مخرج
  'پ': 2,
  'چ': 3,
  'ژ': 7,
  'گ': 20
};

function normalizeAbjadChar(ch: string): string {
  switch (ch) {
    case 'أ':
    case 'إ':
    case 'آ':
    case 'ٱ':
    case 'ء':
      return 'ا';
    case 'ؤ':
      return 'و';
    case 'ئ':
    case 'ى':
    case 'ی':
    case 'یـ':
      return 'ي';
    case 'ة':
    case 'ۀ':
      return 'ه';
    case 'ك':
      return 'ک';
    default:
      return ch;
  }
}

export interface AbjadResult {
  kabir: number;
  saghir9: number;
  saghir12: number;
  letterCount: number;
}

/**
 * محاسبه ابجد کبیر، ابجد صغیر (باقی‌مانده بر ۹ و ۱۲) و تعداد حروف محاسبه‌شده مطابق قواعد گنجور
 */
export function calculateAbjad(text: string): AbjadResult {
  if (!text) {
    return { kabir: 0, saghir9: 0, saghir12: 0, letterCount: 0 };
  }

  var kabir = 0;
  var letterCount = 0;

  for (var i = 0; i < text.length; i++) {
    var normalized = normalizeAbjadChar(text[i]);
    if (Object.prototype.hasOwnProperty.call(ABJAD_VALUES, normalized)) {
      kabir += ABJAD_VALUES[normalized];
      letterCount++;
    }
  }

  var saghir9 = kabir > 0 ? ((kabir % 9) || 9) : 0;
  var saghir12 = kabir > 0 ? ((kabir % 12) || 12) : 0;

  return {
    kabir: kabir,
    saghir9: saghir9,
    saghir12: saghir12,
    letterCount: letterCount
  };
}

export interface PoemWordFrequency {
  word: string;
  count: number;
  percentage: number;
}

export interface PoemVocabularyStats {
  totalWords: number;
  uniqueWords: number;
  items: PoemWordFrequency[];
}

var EDGE_PUNCTUATION_REGEX = /^[\s،؛.؟!«»()\[\]{}:"'\-–—_*ـ]+|[\s،؛.؟!«»()\[\]{}:"'\-–—_*ـ]+$/g;
var DIACRITICS_REGEX = /[\u064B-\u065F\u0670\u0640]/g;

/**
 * حذف موقت اعراب (حرکات) بدون آسیب به «آ» و فاصله‌ها برای نمایش بدون اعراب
 */
export function stripPersianDiacritics(text: string): string {
  if (!text) return '';
  return text.normalize('NFC').replace(/[\u064B-\u065F\u0670]/g, '');
}

/**
 * پاک‌سازی یک واژه از علائم نگارشی، اعراب و تبدیل حروف عربی برای شمارش و جستجو
 */
export function cleanPoemWord(rawWord: string): string {
  if (!rawWord) return '';
  var cleaned = rawWord
    .replace(EDGE_PUNCTUATION_REGEX, '')
    .replace(DIACRITICS_REGEX, '')
    .replace(/ي/g, 'ی')
    .replace(/ك/g, 'ک')
    .trim();
  if (!cleaned || /^[0-9۰-۹]+$/.test(cleaned)) {
    return '';
  }
  return cleaned;
}

/**
 * تحلیل آماری واژگان درون یک شعر (تعداد تکرار و درصد هر واژه نسبت به کل واژگان شعر)
 */
export function analyzePoemVocabulary(verses: GanjoorVerse[]): PoemVocabularyStats {
  var counts: Record<string, number> = {};
  var totalWords = 0;

  for (var i = 0; i < verses.length; i++) {
    var line = verses[i]?.Text || '';
    var parts = line.split(/\s+/);
    for (var j = 0; j < parts.length; j++) {
      var word = cleanPoemWord(parts[j]);
      if (!word) continue;
      totalWords++;
      counts[word] = (counts[word] || 0) + 1;
    }
  }

  var items: PoemWordFrequency[] = [];
  var keys = Object.keys(counts);
  for (var k = 0; k < keys.length; k++) {
    var w = keys[k];
    var cnt = counts[w];
    items.push({
      word: w,
      count: cnt,
      percentage: totalWords > 0 ? (cnt / totalWords) * 100 : 0
    });
  }

  items.sort(function (a, b) {
    if (b.count !== a.count) return b.count - a.count;
    return a.word.localeCompare(b.word, 'fa');
  });

  return {
    totalWords: totalWords,
    uniqueWords: items.length,
    items: items
  };
}
