import { db } from '../db/GhazalDB';
import { cachedCompute } from './CachedComputeService';
import { getPoemMetreRhythm } from '../utils/formatters';
import type { GanjoorPoem } from '../types/ganjoor';

export interface MetreStatItem {
  rhythm: string;
  count: number;
  percentage: number;
}

export interface LocationMentionItem {
  locationId: number;
  locationName: string;
  count: number;
}

export interface PoetStatsResult {
  poetSlug: string;
  poetName: string;
  totalPoems: number;
  totalVerses: number;
  topMetres: MetreStatItem[];
  commonLocations: LocationMentionItem[];
  categoryBreakdown: { title: string; count: number }[];
  topKeywords: { word: string; count: number }[];
}

export interface PoetComparisonResult {
  poet1: PoetStatsResult;
  poet2: PoetStatsResult;
  sharedMetres: { rhythm: string; count1: number; count2: number }[];
  sharedLocations: { name: string; count1: number; count2: number }[];
}

export class PoetAnalyticsService {
  /**
   * محاسبه یا دریافت آمار جامع یک شاعر با کش ماندگار
   */
  async getPoetStats(poetSlug: string, poetName?: string): Promise<PoetStatsResult> {
    var prefix = `/${poetSlug}/`;
    var poemCount = await db.poems.where('FullUrl').startsWith(prefix).count();

    // تعداد اشعار در کلید کش است تا بعد از دانلود اشعار بیشتر، آمار قدیمی نمایش داده نشود
    var cacheKey = `stats:poet:${poetSlug}:${poemCount}`;
    return cachedCompute.getOrCompute(cacheKey, async () => {
      await cachedCompute.invalidate(`stats:poet:${poetSlug}:`);
      var poems = await db.poems.where('FullUrl').startsWith(prefix).toArray();

      var resolvedName = poetName || poems[0]?.FullTitle?.split('»')?.[0]?.trim();
      if (!resolvedName) {
        var localPoet = await db.poets.where('FullUrl').equals(`/${poetSlug}`).first();
        resolvedName = localPoet?.Nickname || localPoet?.Name || poetSlug;
      }
      var totalPoems = poems.length;
      var totalVerses = 0;

      var metreMap = new Map<string, number>();
      var catMap = new Map<string, number>();
      var wordsMap = new Map<string, number>();

      var stopWords = new Set([
        'در', 'به', 'از', 'که', 'و', 'این', 'آن', 'را', 'با', 'بر', 'تا', 'چو', 'گر', 'چون',
        'ما', 'من', 'تو', 'او', 'هم', 'شد', 'بود', 'است', 'شدند', 'بودند', 'می', 'نه', 'چه',
        'یک', 'همی', 'کن', 'کند', 'کرد', 'نیست', 'هست', 'بی', 'ای', 'هر', 'اگر', 'چنان'
      ]);

      for (var i = 0; i < poems.length; i++) {
        var poem = poems[i];
        var vCount = poem.Verses ? poem.Verses.length : 0;
        totalVerses += vCount;

        // استخراج وزن
        var rhythm = getPoemMetreRhythm(poem);
        if (rhythm && rhythm !== 'نامشخص' && rhythm !== '-') {
          metreMap.set(rhythm, (metreMap.get(rhythm) || 0) + 1);
        }

        // تفکیک بخش/دفتر
        var parts = poem.FullUrl.split('/').filter(Boolean);
        var catTitle = parts.length > 2 ? parts[1] : 'سایر';
        catMap.set(catTitle, (catMap.get(catTitle) || 0) + 1);

        // واژگان پرتکرار (نمونه‌برداری از ابیات اول و دوم جهت بهینه‌سازی پردازش)
        if (poem.Verses) {
          for (var v = 0; v < Math.min(4, poem.Verses.length); v++) {
            var words = poem.Verses[v].Text.replace(/[.,،؛:!؟?«»()]/g, '').split(/\s+/);
            for (var w = 0; w < words.length; w++) {
              var word = words[w].trim();
              if (word.length >= 3 && !stopWords.has(word)) {
                wordsMap.set(word, (wordsMap.get(word) || 0) + 1);
              }
            }
          }
        }
      }

      // مرتب‌سازی اوزان
      var topMetres: MetreStatItem[] = [];
      metreMap.forEach(function (count, r) {
        topMetres.push({
          rhythm: r,
          count: count,
          percentage: totalPoems > 0 ? Math.round((count / totalPoems) * 100) : 0
        });
      });
      topMetres.sort(function (a, b) { return b.count - a.count; });

      // دسته‌بندی‌ها
      var categoryBreakdown: { title: string; count: number }[] = [];
      catMap.forEach(function (count, title) {
        categoryBreakdown.push({ title: title, count: count });
      });
      categoryBreakdown.sort(function (a, b) { return b.count - a.count; });

      // کلمات پرتکرار
      var topKeywords: { word: string; count: number }[] = [];
      wordsMap.forEach(function (count, word) {
        if (count >= 2) {
          topKeywords.push({ word: word, count: count });
        }
      });
      topKeywords.sort(function (a, b) { return b.count - a.count; });

      return {
        poetSlug: poetSlug,
        poetName: resolvedName,
        totalPoems: totalPoems,
        totalVerses: totalVerses,
        topMetres: topMetres.slice(0, 8),
        commonLocations: [],
        categoryBreakdown: categoryBreakdown.slice(0, 6),
        topKeywords: topKeywords.slice(0, 15)
      };
    });
  }

  /**
   * مقایسه تطبیقی دو شاعر بزرگ با کش محاسبات
   */
  async comparePoets(poet1Slug: string, poet2Slug: string, poet1Name?: string, poet2Name?: string): Promise<PoetComparisonResult> {
    var p1 = await this.getPoetStats(poet1Slug, poet1Name);
    var p2 = await this.getPoetStats(poet2Slug, poet2Name);

    var p2MetreMap = new Map<string, number>();
    p2.topMetres.forEach(function (m) { p2MetreMap.set(m.rhythm, m.count); });

    var sharedMetres: { rhythm: string; count1: number; count2: number }[] = [];
    p1.topMetres.forEach(function (m1) {
      var c2 = p2MetreMap.get(m1.rhythm);
      if (c2 !== undefined) {
        sharedMetres.push({ rhythm: m1.rhythm, count1: m1.count, count2: c2 });
      }
    });

    return {
      poet1: p1,
      poet2: p2,
      sharedMetres: sharedMetres,
      sharedLocations: []
    };
  }

  /**
   * یافتن اشعار هم‌وزن و هم‌آهنگ برای پیشنهاد در صفحه شعر
   */
  async getSimilarMetrePoems(
    rhythm: string,
    currentPoemId: number,
    rhymeLetters?: string,
    limit: number = 6
  ): Promise<GanjoorPoem[]> {
    if (!rhythm || rhythm === 'نامشخص' || rhythm === '-') return [];

    var cacheKey = `similar:${encodeURIComponent(rhythm)}:${currentPoemId}:${rhymeLetters || ''}`;
    return cachedCompute.getOrCompute(cacheKey, async () => {
      var candidateLimit = limit * 4 + 1;
      var candidates = await db.poems.where('Rhythm').equals(rhythm).limit(candidateLimit).toArray();

      if (candidates.length === 0) {
        // وزن ممکن است فقط در فیلد Metre ذخیره شده باشد
        candidates = await db.poems
          .filter(function (p) { return getPoemMetreRhythm(p) === rhythm; })
          .limit(candidateLimit)
          .toArray();
      }

      var others = candidates.filter(function (p) { return p.Id !== currentPoemId; });
      if (rhymeLetters) {
        var sameRhyme = others.filter(function (p) { return p.RhymeLetters === rhymeLetters; });
        var differentRhyme = others.filter(function (p) { return p.RhymeLetters !== rhymeLetters; });
        others = sameRhyme.concat(differentRhyme);
      }
      return others.slice(0, limit);
    });
  }
}

export const poetAnalytics = new PoetAnalyticsService();
