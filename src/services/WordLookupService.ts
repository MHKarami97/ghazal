import { db } from '../db/GhazalDB';
import { cleanPoemWord } from '../utils/abjad';

export interface WordMeaningResult {
  word: string;
  found: boolean;
  definitions: string[];
  sourceUrl: string;
  offlineError?: boolean;
}

var WIKTIONARY_API = 'https://fa.wiktionary.org/w/api.php';
var IGNORE_SECTIONS = [
  'ریشه‌شناسی',
  'تلفظ',
  'آوایش',
  'برگردان',
  'ترجمه',
  'منابع',
  'پیوند',
  'جستار',
  'نگارخانه',
  'یادداشت',
  'مترادف',
  'متضاد',
  'هم‌خانواده',
  'واژه‌های مشتق',
  'آثار'
];

function extractPersianDefinitions(rawExtract: string): string[] {
  if (!rawExtract) return [];

  var lines = rawExtract.split('\n');
  var inPersianSection = false;
  var hasAnyLanguageHeader = /^==[^=].*==$/.test(rawExtract.replace(/\n/g, ' ')) || /^==\s*فارسی\s*==/m.test(rawExtract);
  var currentSubSection = '';
  var skipCurrentSection = false;
  var results: string[] = [];

  for (var i = 0; i < lines.length; i++) {
    var line = lines[i].trim();
    if (!line) continue;

    // تشخیص سرفصل زبان
    if (line.startsWith('== ') && line.endsWith(' ==') && !line.startsWith('===')) {
      var langTitle = line.replace(/=/g, '').trim();
      if (langTitle === 'فارسی') {
        inPersianSection = true;
        skipCurrentSection = false;
        currentSubSection = '';
      } else if (inPersianSection) {
        // به بخش زبان دیگری رسیدیم
        break;
      } else {
        inPersianSection = false;
      }
      continue;
    }

    if (hasAnyLanguageHeader && !inPersianSection && !rawExtract.includes('== فارسی ==')) {
      // اگر سرفصل فارسی نبود اما کل صفحه غیر از فارسی بود صرف‌نظر می‌کنیم
      continue;
    }

    if (hasAnyLanguageHeader && !inPersianSection && rawExtract.includes('== فارسی ==')) {
      continue;
    }

    // تشخیص زیربخش‌ها (معنی، اسم، صفت، فعل و...)
    if (line.startsWith('===') || line.startsWith('====')) {
      var subTitle = line.replace(/=/g, '').trim();
      currentSubSection = subTitle;
      skipCurrentSection = IGNORE_SECTIONS.some(function (ignored) {
        return subTitle.includes(ignored);
      });
      continue;
    }

    if (skipCurrentSection) continue;

    // پاک‌سازی نویزهای الگوهای ویکی‌واژه
    if (
      line.length < 3 ||
      line.startsWith('رده:') ||
      line.startsWith('برگرفته از') ||
      line.startsWith('↑')
    ) {
      continue;
    }

    var formattedLine = currentSubSection && !['معنی', 'معانی', 'تعریف'].includes(currentSubSection)
      ? `${currentSubSection}: ${line}`
      : line;

    // افزودن با جلوگیری از تکرار و سقف طول خوانا
    if (!results.includes(formattedLine)) {
      results.push(formattedLine);
    }

    if (results.length >= 8) break;
  }

  // اگر ساختار استاندارد زیرعنوان پیدا نشد، خط‌های معنادار اول بخش فارسی یا متن را استخراج کن
  if (results.length === 0) {
    for (var j = 0; j < lines.length; j++) {
      var plain = lines[j].trim();
      if (
        plain.length >= 4 &&
        !plain.startsWith('=') &&
        !plain.startsWith('رده:')
      ) {
        results.push(plain);
      }
      if (results.length >= 5) break;
    }
  }

  return results;
}

export class WordLookupService {
  private memCache: Map<string, WordMeaningResult> = new Map();
  private inflight: Map<string, Promise<WordMeaningResult>> = new Map();

  async lookup(rawWord: string): Promise<WordMeaningResult> {
    var word = cleanPoemWord(rawWord) || rawWord.trim();
    var wiktionaryPageUrl = `https://fa.wiktionary.org/wiki/${encodeURIComponent(word)}`;

    if (!word) {
      return { word: '', found: false, definitions: [], sourceUrl: wiktionaryPageUrl };
    }

    if (this.memCache.has(word)) {
      return this.memCache.get(word)!;
    }

    try {
      var cached = await db.baseMeta.get(`dict:${word}`);
      if (cached && cached.data) {
        this.memCache.set(word, cached.data);
        return cached.data as WordMeaningResult;
      }
    } catch (e) {}

    var existing = this.inflight.get(word);
    if (existing) return existing;

    var self = this;
    var promise = this.fetchFromWiktionary(word, wiktionaryPageUrl).finally(function () {
      self.inflight.delete(word);
    });

    this.inflight.set(word, promise);
    return promise;
  }

  private async fetchFromWiktionary(word: string, sourceUrl: string): Promise<WordMeaningResult> {
    var controller = new AbortController();
    var timeoutId = setTimeout(function () {
      controller.abort();
    }, 5000);

    try {
      var apiUrl = `${WIKTIONARY_API}?action=query&prop=extracts&explaintext=1&exsectionformat=plain&titles=${encodeURIComponent(word)}&format=json&origin=*&redirects=1`;
      var res = await fetch(apiUrl, {
        headers: { 'Accept': 'application/json' },
        signal: controller.signal
      });
      clearTimeout(timeoutId);

      if (!res.ok) {
        return { word: word, found: false, definitions: [], sourceUrl: sourceUrl, offlineError: true };
      }

      var data = await res.json();
      var pages = data?.query?.pages || {};
      var pageKeys = Object.keys(pages);
      if (pageKeys.length === 0 || pageKeys[0] === '-1') {
        var notFoundResult: WordMeaningResult = {
          word: word,
          found: false,
          definitions: [],
          sourceUrl: sourceUrl
        };
        this.rememberResult(word, notFoundResult);
        return notFoundResult;
      }

      var extractText = String(pages[pageKeys[0]]?.extract || '');
      var definitions = extractPersianDefinitions(extractText);
      var result: WordMeaningResult = {
        word: word,
        found: definitions.length > 0,
        definitions: definitions,
        sourceUrl: sourceUrl
      };

      this.rememberResult(word, result);
      return result;
    } catch (e) {
      clearTimeout(timeoutId);
      return { word: word, found: false, definitions: [], sourceUrl: sourceUrl, offlineError: true };
    }
  }

  private rememberResult(word: string, result: WordMeaningResult) {
    this.memCache.set(word, result);
    db.baseMeta
      .put({
        key: `dict:${word}`,
        data: result,
        updatedAt: new Date().toISOString()
      })
      .catch(function () {});
  }
}

export var wordLookupService = new WordLookupService();
