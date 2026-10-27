import { toPersianDigits } from './persianNormalizer';
import type { GanjoorVerse } from '../types/ganjoor';

export function formatBytes(bytes: number): string {
  if (bytes === 0) return '۰ بایت';
  var k = 1024;
  var sizes = ['بایت', 'کیلوبایت', 'مگابایت', 'گیگابایت'];
  var i = Math.floor(Math.log(bytes) / Math.log(k));
  var value = parseFloat((bytes / Math.pow(k, i)).toFixed(1));
  return `${toPersianDigits(value)} ${sizes[i]}`;
}

export function formatRelativeDate(isoDate: string): string {
  if (!isoDate) return '';
  var date = new Date(isoDate);
  var now = new Date();
  var diffMs = now.getTime() - date.getTime();
  var diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  var diffDays = Math.floor(diffHours / 24);

  if (diffHours < 1) return 'چند لحظه پیش';
  if (diffHours < 24) return `${toPersianDigits(diffHours)} ساعت پیش`;
  if (diffDays === 1) return 'دیروز';
  if (diffDays < 30) return `${toPersianDigits(diffDays)} روز پیش`;

  return toPersianDigits(date.toLocaleDateString('fa-IR'));
}

export interface CoupletPair {
  coupletIndex: number;
  rightVerse?: GanjoorVerse;
  leftVerse?: GanjoorVerse;
  summary?: string;
}

/**
 * گروه‌بندی ابیات شعر به جفت‌های مصرع اول و دوم بر اساس CoupletIndex
 */
export function groupVersesIntoCouplets(verses: GanjoorVerse[]): CoupletPair[] {
  if (!verses || !verses.length) return [];
  var map = new Map<number, CoupletPair>();

  for (var i = 0; i < verses.length; i++) {
    var v = verses[i];
    var cIndex = v.CoupletIndex;
    if (!map.has(cIndex)) {
      map.set(cIndex, {
        coupletIndex: cIndex,
        summary: v.CoupletSummary
      });
    }

    var pair = map.get(cIndex)!;
    if (v.CoupletSummary && !pair.summary) {
      pair.summary = v.CoupletSummary;
    }

    if (v.Position === 'Right' || v.VOrder % 2 === 1) {
      pair.rightVerse = v;
    } else {
      pair.leftVerse = v;
    }
  }

  var result: CoupletPair[] = [];
  map.forEach(function (val) {
    result.push(val);
  });

  result.sort(function (a, b) {
    return a.coupletIndex - b.coupletIndex;
  });

  return result;
}

/**
 * استخراج عنوان تمیز وزن عروضی شعر از میان فیلدهای Metre یا Rhythm
 */
export function getPoemMetreRhythm(poem: any): string {
  if (!poem) return '';
  if (typeof poem.Rhythm === 'string' && poem.Rhythm.trim()) {
    return poem.Rhythm.trim();
  }
  if (poem.Metre) {
    if (typeof poem.Metre === 'string' && poem.Metre.trim()) {
      return poem.Metre.trim();
    }
    if (typeof poem.Metre === 'object' && poem.Metre.Rhythm) {
      return String(poem.Metre.Rhythm).trim();
    }
  }
  return '';
}

