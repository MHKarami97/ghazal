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
    var cacheKey = `stats:poet:${poetSlug}`;
    return cachedCompute.getOrCompute(cacheKey, async () => {
      // پیدا کردن تمام اشعار این شاعر در دیتابیس محلی
      var poems = await db.poems
        .filter(function (p) {
          return p.FullUrl.startsWith(`/${poetSlug}/`) || p.FullUrl === `/${poetSlug}`;
        })
        .toArray();

      var resolvedName = poetName || poems[0]?.FullTitle?.split('»')?.[0]?.trim() || poetSlug;
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
  async comparePoets(poet1Slug: string, poet2Slug: string): Promise<PoetComparisonResult> {
    var key = `compare:${poet1Slug}:${poet2Slug}`;
    return cachedCompute.getOrCompute(key, async () => {
      var p1 = await this.getPoetStats(poet1Slug);
      var p2 = await this.getPoetStats(poet2Slug);

      var p2MetreMap = new Map<string, number>();
      p2.topMetres.forEach(function (m) { p2MetreMap.set(m.rhythm, m.count); });

      var sharedMetres: { rhythm: string; count1: number; count2: number }[] = [];
      p1.topMetres.forEach(function (m1) {
        var c2 = p2MetreMap.get(m1.rhythm);
        if (c2 !== undefined) {
          sharedMetres.push({
            rhythm: m1.rhythm,
            count1: m1.count,
            count2: c2
          });
        }
      });

      return {
        poet1: p1,
        poet2: p2,
        sharedMetres: sharedMetres,
        sharedLocations: []
      };
    });
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
      var all = await db.poems.toArray();
      var matches: GanjoorPoem[] = [];

      for (var i = 0; i < all.length; i++) {
        var p = all[i];
        if (p.Id === currentPoemId) continue;

        var pRhythm = getPoemMetreRhythm(p);
        if (pRhythm === rhythm) {
          // ترجیح اشعاری که هم‌قافیه نیز هستند
          if (rhymeLetters && p.RhymeLetters === rhymeLetters) {
            matches.unshift(p);
          } else {
            matches.push(p);
          }
        }
        if (matches.length >= limit * 2) break;
      }

      return matches.slice(0, limit);
    });
  }
}

export const poetAnalytics = new PoetAnalyticsService();
