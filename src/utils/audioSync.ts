import type { GanjoorVerse } from '../types/ganjoor';
import type { RecitationSyncPoint } from '../services/RecitationService';

export interface ActiveAudioPosition {
  verseOrder: number;
  coupletIndex: number;
  misra: 1 | 2; // 1: راست (مصرع اول), 2: چپ (مصرع دوم)
  wordIndex: number | null; // ایندکس واژه فعال در متن مصرع
  verseText: string;
  elapsedMs: number;
  verseDurationMs: number;
  progressInVerse: number; // 0 تا 1
}

/**
 * پاک‌سازی واژه برای وزن‌دهی زمانی عادلانه (حذف حرکات و نشانه‌ها)
 */
function cleanForWeight(raw: string): string {
  if (!raw) return '';
  return raw.replace(/[\u064B-\u065F\u0670\u06D6-\u06ED]/g, '').trim();
}

/**
 * محاسبه وزن زمانی هر کلمه متناسب با هجاها و وزن طبیعی عروضی شعر
 * در شعر فارسی کلمات ۱ یا ۲ حرفی به نسبت کشیده خوانده می‌شوند و نباید خیلی سریع رد شوند،
 * و کلمات طولانی‌تر نیز کشش افراطی ندارند تا مانع از عقب ماندن هایلایت شود.
 */
function getWordCadenceWeight(rawWord: string): number {
  var clean = cleanForWeight(rawWord);
  var len = clean.length;
  if (len <= 0) return 0;
  // حروف ربط و اضافه تک یا دو حرفی (مانند «و»، «به»، «که»، «در»، «یا»)
  if (len <= 2) return 3.4;
  // کلمات متداول ۳ تا ۴ حرفی (مانند «عشق»، «آسان»، «نمود»، «اول»)
  if (len <= 4) return 4.0;
  // کلمات ۵ تا ۶ حرفی (مانند «بگشاید»، «نافه‌ای»)
  if (len <= 6) return 4.7;
  // کلمات بلندتر (مانند «مشکل‌ها»، «سلسله‌مویش»)
  return 5.3;
}

/**
 * محاسبه بیت، مصرع و واژهٔ در حال خوانده‌شدن بر اساس میلی‌ثانیه پخش صوت و نقاط همگامی
 */
export function calculateAudioPosition(
  currentAudioMs: number,
  durationMs: number,
  points: RecitationSyncPoint[],
  verses: GanjoorVerse[]
): ActiveAudioPosition | null {
  if (!points || points.length === 0) return null;
  if (currentAudioMs < points[0].audioMs) return null;

  // یافتن آخرین نقطه همگامی که زمان آن کوچک‌تر یا مساوی زمان فعلی است
  var k = 0;
  for (var i = points.length - 1; i >= 0; i--) {
    if (points[i].audioMs <= currentAudioMs) {
      k = i;
      break;
    }
  }

  var pt = points[k];
  var vo = pt.verseOrder;

  // اگر شماره مصرع منفی باشد (اعلان عنوان شعر یا مقدمه در گنجور)، بیتی هایلایت نمی‌شود
  if (vo < 0) return null;

  var tStart = pt.audioMs;
  var tEnd = (k < points.length - 1)
    ? points[k + 1].audioMs
    : Math.max(durationMs || 0, tStart + 3500);
  var vDuration = Math.max(500, tEnd - tStart);
  var elapsed = Math.max(0, currentAudioMs - tStart);

  // یافتن مصرع متناظر در لیست ابیات شعر
  var verse = (verses && vo >= 0 && vo < verses.length) ? verses[vo] : null;
  if (!verse && verses && verses.length > 0) {
    verse = verses.find(function (v) {
      return v.VOrder === vo || v.VOrder === vo + 1;
    }) || null;
  }

  var cIndex = verse ? verse.CoupletIndex : Math.floor(vo / 2);
  var isRight = verse
    ? (verse.Position === 'Right' || verse.VOrder % 2 === 1)
    : (vo % 2 === 0);
  var misra: 1 | 2 = isRight ? 1 : 2;
  var verseText = verse ? verse.Text : '';

  // تقطیع کلمات مصرع مشابه روش CoupletView
  var words = verseText ? verseText.split(' ') : [];
  var wordIndex: number | null = null;

  if (words.length > 0 && verseText.trim()) {
    var weights: number[] = [];
    var totalWeight = 0;
    for (var w = 0; w < words.length; w++) {
      var wt = getWordCadenceWeight(words[w]);
      weights.push(wt);
      totalWeight += wt;
    }

    // مکث ملایم آغاز مصرع (تنفس و ورود به مصرع) و مکث ملایم پایان مصرع (سکت عروضی)
    var leadIn = Math.min(250, Math.max(80, vDuration * 0.035));
    var tailPause = Math.min(450, Math.max(150, vDuration * 0.065));
    var speechDuration = Math.max(400, vDuration - leadIn - tailPause);
    var timeInSpeech = elapsed - leadIn;

    if (timeInSpeech <= 0) {
      // در بازهٔ آغازین ورود به مصرع، کلمهٔ اول با آرامش فعال است
      wordIndex = 0;
    } else if (timeInSpeech >= speechDuration) {
      // در بازهٔ مکث پایان مصرع، کلمهٔ پایانی تا شروع مصرع بعدی فعال می‌ماند
      wordIndex = words.length - 1;
    } else {
      var ratio = Math.min(0.9999, Math.max(0, timeInSpeech / speechDuration));
      var targetWeight = ratio * totalWeight;
      var running = 0;
      for (var idx = 0; idx < words.length; idx++) {
        running += weights[idx];
        if (targetWeight < running) {
          wordIndex = idx;
          break;
        }
      }
      if (wordIndex === null) {
        wordIndex = words.length - 1;
      }
    }
  }

  return {
    verseOrder: vo,
    coupletIndex: cIndex,
    misra: misra,
    wordIndex: wordIndex,
    verseText: verseText,
    elapsedMs: elapsed,
    verseDurationMs: vDuration,
    progressInVerse: Math.min(1, Math.max(0, elapsed / vDuration))
  };
}

/**
 * یافتن نقطه شروع صوت برای یک بیت خاص بر اساس شماره بیت
 */
export function findCoupletSyncPoint(
  coupletIndex: number,
  points: RecitationSyncPoint[],
  verses: GanjoorVerse[]
): RecitationSyncPoint | null {
  if (!points || points.length === 0) return null;

  for (var i = 0; i < points.length; i++) {
    var pt = points[i];
    if (pt.verseOrder < 0) continue;

    var verse = (verses && pt.verseOrder >= 0 && pt.verseOrder < verses.length)
      ? verses[pt.verseOrder]
      : (verses ? verses.find(function (v) { return v.VOrder === pt.verseOrder || v.VOrder === pt.verseOrder + 1; }) : null);

    var cIndex = verse ? verse.CoupletIndex : Math.floor(pt.verseOrder / 2);
    if (cIndex === coupletIndex) {
      return pt;
    }
  }

  return null;
}
