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
    // وزن‌دهی زمانی با حداقل وزن ۳ تا کلمات کوتاه خیلی سریع محو نشوند
    var weights: number[] = [];
    var totalWeight = 0;
    for (var w = 0; w < words.length; w++) {
      var wt = Math.max(3, cleanForWeight(words[w]).length);
      weights.push(wt);
      totalWeight += wt;
    }

    // مکث ملایم پایان مصرع (حداکثر ۴۰۰ میلی‌ثانیه یا ۶٪ مدت مصرع)
    var pauseMs = (vDuration >= 2000)
      ? Math.min(400, Math.max(100, vDuration * 0.06))
      : 0;
    var speechDuration = Math.max(400, vDuration - pauseMs);

    if (elapsed >= speechDuration) {
      // در بازهٔ کوتاه مکث انتهای مصرع، کلمهٔ آخر تا آغاز مصرع بعدی هایلایت می‌ماند
      wordIndex = words.length - 1;
    } else {
      var ratio = Math.min(0.9999, Math.max(0, elapsed / speechDuration));
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
