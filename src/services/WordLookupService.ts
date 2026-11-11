import { db } from '../db/GhazalDB';
import { cleanPoemWord } from '../utils/abjad';

export interface WordPronunciationItem {
  label: string;
  value: string;
}

export interface WordPosEntry {
  pos: string;
  headword?: string;
  senses: string[];
}

export interface WordLanguageSection {
  language: string;
  altForms: string[];
  etymologies: string[];
  pronunciations: WordPronunciationItem[];
  entries: WordPosEntry[];
  synonyms: string[];
}

export interface WordMeaningResult {
  word: string;
  found: boolean;
  sections: WordLanguageSection[];
  sources: string[];
  definitions: string[];
  sourceUrl: string;
  offlineError?: boolean;
}

type SubKind =
  | 'pos'
  | 'altForms'
  | 'etymology'
  | 'pronunciation'
  | 'synonyms'
  | 'sources'
  | 'ignore';

var WIKTIONARY_API = 'https://fa.wiktionary.org/w/api.php';

var IGNORE_TITLES = [
  'برگردان',
  'ترجمه',
  'جستارهای وابسته',
  'جستار',
  'پیوند به بیرون',
  'پیوند',
  'نگارخانه',
  'یادداشت',
  'آثار',
  'واژه‌های مشتق',
  'واژههای مشتق',
  'هم‌خانواده',
  'همخانواده',
  'اشتقاق'
];

var SOURCE_TITLES = ['منابع', 'منبع', 'بن‌مایه', 'بنمایه', 'مآخذ', 'پانویس'];
var ALT_FORM_TITLES = ['گونههای دیگر نوشتار', 'گونه‌های دیگر نوشتار', 'املاهای دیگر', 'صورتهای دیگر', 'صورت‌های دیگر'];
var ETYMOLOGY_TITLES = ['ریشه لغت', 'ریشه‌شناسی', 'ریشه شناسی', 'واژه‌شناسی', 'واژه شناسی'];
var PRONUNCIATION_TITLES = ['آوایش', 'تلفظ', 'واج‌شناسی', 'واج شناسی'];
var SYNONYM_TITLES = ['مترادف', 'هم‌معنی', 'هممعنی', 'متضاد'];
var OTHER_LANG_TITLES = ['زبان دیگر', 'زبان‌های دیگر', 'زبانهای دیگر', 'عربی', 'انگلیسی', 'ترکی', 'فرانسوی', 'کردی', 'لری', 'آلمانی'];

function normalizeHeadingTitle(raw: string): string {
  return (raw || '')
    .replace(/\[ویرایش\]/g, '')
    .replace(/[=:|–—]+/g, ' ')
    .replace(/ك/g, 'ک')
    .replace(/ي/g, 'ی')
    .replace(/\s+/g, ' ')
    .trim();
}

function normalizeInlineText(raw: string): string {
  return (raw || '')
    .replace(/\u00A0/g, ' ')
    .replace(/[ \t]+/g, ' ')
    .replace(/\n+/g, ' ')
    .trim();
}

function isSeparatorNoise(text: string): boolean {
  if (!text) return true;
  if (/^[–—\-_.=*~\s]+$/.test(text)) return true;
  if (text.startsWith('رده:') || text.startsWith('برگرفته از') || text.startsWith('↑')) return true;
  return false;
}

function titleMatchesAny(title: string, list: string[]): boolean {
  var compact = title.replace(/\u200C/g, '');
  for (var i = 0; i < list.length; i++) {
    var cand = list[i].replace(/\u200C/g, '');
    if (compact === cand || compact.includes(cand)) {
      return true;
    }
  }
  return false;
}

function classifyHeadingKind(title: string): SubKind {
  if (titleMatchesAny(title, SOURCE_TITLES)) return 'sources';
  if (titleMatchesAny(title, IGNORE_TITLES)) return 'ignore';
  if (titleMatchesAny(title, ALT_FORM_TITLES)) return 'altForms';
  if (titleMatchesAny(title, ETYMOLOGY_TITLES)) return 'etymology';
  if (titleMatchesAny(title, PRONUNCIATION_TITLES)) return 'pronunciation';
  if (titleMatchesAny(title, SYNONYM_TITLES)) return 'synonyms';
  return 'pos';
}

function createEmptySection(language: string): WordLanguageSection {
  return {
    language: language,
    altForms: [],
    etymologies: [],
    pronunciations: [],
    entries: [],
    synonyms: []
  };
}

function pushUnique(arr: string[], val: string) {
  if (!val || arr.indexOf(val) !== -1) return;
  arr.push(val);
}

function extractDirectLiText(liEl: Element): string {
  var parts: string[] = [];
  for (var i = 0; i < liEl.childNodes.length; i++) {
    var child = liEl.childNodes[i];
    if (child.nodeType === 1) {
      var tag = (child as Element).tagName.toLowerCase();
      if (tag === 'ul' || tag === 'ol') continue;
    }
    var txt = normalizeInlineText(child.textContent || '');
    if (txt) parts.push(txt);
  }
  return normalizeInlineText(parts.join(' '));
}

function collectPronunciationsFromList(listEl: Element, out: WordPronunciationItem[]) {
  for (var i = 0; i < listEl.children.length; i++) {
    var child = listEl.children[i];
    if (child.tagName.toLowerCase() !== 'li') continue;

    var directText = extractDirectLiText(child);
    if (directText && !isSeparatorNoise(directText)) {
      addPronunciationLine(directText, out);
    }

    var nestedLists = child.querySelectorAll(':scope > ul, :scope > ol');
    for (var n = 0; n < nestedLists.length; n++) {
      collectPronunciationsFromList(nestedLists[n], out);
    }
  }
}

function addPronunciationLine(line: string, out: WordPronunciationItem[]) {
  var colonIdx = line.search(/[:：]/);
  if (colonIdx !== -1) {
    var label = line.slice(0, colonIdx).trim();
    var value = line.slice(colonIdx + 1).trim();
    // عنوان خالی مثل «ایرانی:» که زیرشاخه‌ها مقدار دارند حذف می‌شود
    if (!value) return;
    pushPronunciationUnique(out, { label: label || 'تلفظ', value: value });
    return;
  }
  if (!isSeparatorNoise(line)) {
    pushPronunciationUnique(out, { label: 'آوایش', value: line });
  }
}

function pushPronunciationUnique(out: WordPronunciationItem[], item: WordPronunciationItem) {
  for (var i = 0; i < out.length; i++) {
    if (out[i].label === item.label && out[i].value === item.value) return;
  }
  out.push(item);
}

function flattenMeaningLi(liEl: Element): string {
  var direct = extractDirectLiText(liEl);
  var nestedParts: string[] = [];
  var nestedItems = liEl.querySelectorAll(':scope > ul > li, :scope > ol > li, :scope > dl > dd');
  for (var i = 0; i < nestedItems.length; i++) {
    var sub = normalizeInlineText(nestedItems[i].textContent || '');
    if (sub && !isSeparatorNoise(sub)) {
      nestedParts.push(sub);
    }
  }
  if (direct && nestedParts.length > 0) {
    return `${direct} (${nestedParts.slice(0, 2).join('؛ ')})`;
  }
  return direct || nestedParts.join('؛ ');
}

function isHeadwordParagraph(text: string, hasBoldChild: boolean, targetWord: string, entry: WordPosEntry): boolean {
  if (!text || entry.headword || entry.senses.length > 0) return false;
  var cleanTarget = cleanPoemWord(targetWord);
  var cleanCand = cleanPoemWord(text);
  if (cleanTarget && cleanCand && cleanCand === cleanTarget) {
    return true;
  }
  if (hasBoldChild && text.length <= 40 && text.split(/\s+/).length <= 3 && !/[.؟!؛]/.test(text)) {
    return true;
  }
  return false;
}

function finalizeResult(
  word: string,
  sections: WordLanguageSection[],
  sources: string[],
  sourceUrl: string
): WordMeaningResult {
  var filtered = sections
    .map(function (sec) {
      sec.entries = sec.entries.filter(function (e) {
        return e.senses.length > 0;
      });
      return sec;
    })
    .filter(function (sec) {
      return (
        sec.entries.length > 0 ||
        sec.etymologies.length > 0 ||
        sec.pronunciations.length > 0 ||
        sec.altForms.length > 0 ||
        sec.synonyms.length > 0
      );
    });

  // قرار گرفتن بخش «فارسی» در صدر نتایج
  filtered.sort(function (a, b) {
    var aIsFa = a.language === 'فارسی' ? 0 : 1;
    var bIsFa = b.language === 'فارسی' ? 0 : 1;
    return aIsFa - bIsFa;
  });

  var definitions: string[] = [];
  for (var s = 0; s < filtered.length; s++) {
    var sec = filtered[s];
    for (var e = 0; e < sec.entries.length; e++) {
      var ent = sec.entries[e];
      for (var k = 0; k < ent.senses.length; k++) {
        definitions.push(`${ent.pos}: ${ent.senses[k]}`);
      }
    }
  }

  return {
    word: word,
    found: filtered.length > 0,
    sections: filtered,
    sources: sources,
    definitions: definitions.slice(0, 12),
    sourceUrl: sourceUrl
  };
}

function parseWiktionaryHtml(html: string, word: string, sourceUrl: string): WordMeaningResult {
  var parser = new DOMParser();
  var doc = parser.parseFromString(html, 'text/html');

  var sections: WordLanguageSection[] = [];
  var sources: string[] = [];
  var currentLang: WordLanguageSection | null = null;
  var subKind: SubKind = 'pos';
  var activePosEntry: WordPosEntry | null = null;

  function ensureLang(langName?: string): WordLanguageSection {
    if (!currentLang) {
      currentLang = createEmptySection(langName || 'فارسی');
      sections.push(currentLang);
    }
    return currentLang;
  }

  function startLanguage(langName: string) {
    var cleanName = langName || 'فارسی';
    currentLang = createEmptySection(cleanName);
    sections.push(currentLang);
    subKind = 'pos';
    activePosEntry = null;
  }

  function startPosEntry(posTitle: string) {
    var lang = ensureLang();
    activePosEntry = {
      pos: posTitle || 'تعریف',
      senses: []
    };
    lang.entries.push(activePosEntry);
  }

  function collectBlocks(el: Element, blocks: Element[]) {
    for (var i = 0; i < el.children.length; i++) {
      var child = el.children[i];
      var tag = child.tagName.toLowerCase();
      if (tag === 'div' || tag === 'section' || tag === 'article' || tag === 'main') {
        collectBlocks(child, blocks);
      } else {
        blocks.push(child);
      }
    }
  }

  var blocks: Element[] = [];
  collectBlocks(doc.body, blocks);

  for (var b = 0; b < blocks.length; b++) {
    var el = blocks[b];
    var tag = el.tagName.toLowerCase();

    if (tag === 'hr') {
      activePosEntry = null;
      continue;
    }

    if (tag === 'h1' || tag === 'h2') {
      var topTitle = normalizeHeadingTitle(el.textContent || '');
      if (!topTitle) continue;
      if (titleMatchesAny(topTitle, SOURCE_TITLES)) {
        subKind = 'sources';
        activePosEntry = null;
      } else if (titleMatchesAny(topTitle, IGNORE_TITLES)) {
        subKind = 'ignore';
        activePosEntry = null;
      } else {
        startLanguage(topTitle);
      }
      continue;
    }

    if (tag === 'h3' || tag === 'h4' || tag === 'h5' || tag === 'h6') {
      var subTitle = normalizeHeadingTitle(el.textContent || '');
      if (!subTitle) continue;

      if (titleMatchesAny(subTitle, OTHER_LANG_TITLES)) {
        startLanguage(subTitle);
        continue;
      }

      subKind = classifyHeadingKind(subTitle);
      activePosEntry = null;
      if (subKind === 'pos') {
        startPosEntry(subTitle);
      }
      continue;
    }

    if (subKind === 'ignore') continue;

    if (subKind === 'sources') {
      if (tag === 'ul' || tag === 'ol') {
        var srcItems = el.querySelectorAll('li');
        for (var si = 0; si < srcItems.length; si++) {
          var sTxt = normalizeInlineText(srcItems[si].textContent || '');
          if (sTxt && !isSeparatorNoise(sTxt)) pushUnique(sources, sTxt);
        }
      } else if (tag === 'p') {
        var spTxt = normalizeInlineText(el.textContent || '');
        if (spTxt && !isSeparatorNoise(spTxt)) pushUnique(sources, spTxt);
      }
      continue;
    }

    var lang = ensureLang();

    if (subKind === 'altForms') {
      if (tag === 'ul' || tag === 'ol') {
        var altLis = el.querySelectorAll('li');
        for (var ai = 0; ai < altLis.length; ai++) {
          var aTxt = normalizeInlineText(altLis[ai].textContent || '');
          if (aTxt && !isSeparatorNoise(aTxt)) pushUnique(lang.altForms, aTxt);
        }
      } else if (tag === 'p') {
        var apTxt = normalizeInlineText(el.textContent || '');
        if (apTxt && !isSeparatorNoise(apTxt)) {
          apTxt.split(/[،,]/).forEach(function (part) {
            var p = part.trim();
            if (p) pushUnique(lang.altForms, p);
          });
        }
      }
      continue;
    }

    if (subKind === 'etymology') {
      if (tag === 'p' || tag === 'li') {
        var etTxt = normalizeInlineText(el.textContent || '');
        if (etTxt && !isSeparatorNoise(etTxt)) pushUnique(lang.etymologies, etTxt);
      } else if (tag === 'ul' || tag === 'ol') {
        var etLis = el.querySelectorAll('li');
        for (var ei = 0; ei < etLis.length; ei++) {
          var elTxt = normalizeInlineText(etLis[ei].textContent || '');
          if (elTxt && !isSeparatorNoise(elTxt)) pushUnique(lang.etymologies, elTxt);
        }
      }
      continue;
    }

    if (subKind === 'pronunciation') {
      if (tag === 'ul' || tag === 'ol') {
        collectPronunciationsFromList(el, lang.pronunciations);
      } else if (tag === 'p') {
        var pTxt = normalizeInlineText(el.textContent || '');
        if (pTxt && !isSeparatorNoise(pTxt)) {
          addPronunciationLine(pTxt, lang.pronunciations);
        }
      }
      continue;
    }

    if (subKind === 'synonyms') {
      var rawSyn = normalizeInlineText(el.textContent || '');
      if (rawSyn && !isSeparatorNoise(rawSyn)) {
        rawSyn.split(/[،,؛]/).forEach(function (part) {
          var s = part.trim();
          if (s && s.length >= 2) pushUnique(lang.synonyms, s);
        });
      }
      continue;
    }

    // بخش معانی و نقش دستوری (pos)
    if (!activePosEntry) {
      startPosEntry('تعریف');
    }

    if (tag === 'ol' || tag === 'ul') {
      for (var liIdx = 0; liIdx < el.children.length; liIdx++) {
        var liChild = el.children[liIdx];
        if (liChild.tagName.toLowerCase() !== 'li') continue;
        var senseText = flattenMeaningLi(liChild);
        if (senseText && !isSeparatorNoise(senseText)) {
          pushUnique(activePosEntry!.senses, senseText);
        }
      }
    } else if (tag === 'p') {
      var pText = normalizeInlineText(el.textContent || '');
      if (!pText || isSeparatorNoise(pText)) continue;
      var hasBold = Boolean(el.querySelector('b, strong'));
      if (isHeadwordParagraph(pText, hasBold, word, activePosEntry!)) {
        activePosEntry!.headword = pText;
      } else {
        pushUnique(activePosEntry!.senses, pText);
      }
    } else if (tag === 'dl') {
      var dds = el.querySelectorAll('dd');
      for (var di = 0; di < dds.length; di++) {
        var ddTxt = normalizeInlineText(dds[di].textContent || '');
        if (ddTxt && !isSeparatorNoise(ddTxt)) {
          pushUnique(activePosEntry!.senses, ddTxt);
        }
      }
    }
  }

  return finalizeResult(word, sections, sources, sourceUrl);
}

function parsePlainWiktionaryFallback(rawText: string, word: string, sourceUrl: string): WordMeaningResult {
  var htmlLines: string[] = [];
  var lines = (rawText || '').split('\n');
  for (var i = 0; i < lines.length; i++) {
    var line = lines[i].trim();
    if (!line) continue;
    if (line.startsWith('====') && line.endsWith('====')) {
      htmlLines.push(`<h4>${line.replace(/=/g, '').trim()}</h4>`);
    } else if (line.startsWith('===') && line.endsWith('===')) {
      htmlLines.push(`<h3>${line.replace(/=/g, '').trim()}</h3>`);
    } else if (line.startsWith('==') && line.endsWith('==')) {
      htmlLines.push(`<h2>${line.replace(/=/g, '').trim()}</h2>`);
    } else {
      htmlLines.push(`<p>${line}</p>`);
    }
  }
  return parseWiktionaryHtml(htmlLines.join('\n'), word, sourceUrl);
}

export class WordLookupService {
  private memCache: Map<string, WordMeaningResult> = new Map();
  private inflight: Map<string, Promise<WordMeaningResult>> = new Map();

  async lookup(rawWord: string): Promise<WordMeaningResult> {
    var word = cleanPoemWord(rawWord) || rawWord.trim();
    var wiktionaryPageUrl = `https://fa.wiktionary.org/wiki/${encodeURIComponent(word)}`;

    if (!word) {
      return {
        word: '',
        found: false,
        sections: [],
        sources: [],
        definitions: [],
        sourceUrl: wiktionaryPageUrl
      };
    }

    if (this.memCache.has(word)) {
      return this.memCache.get(word)!;
    }

    try {
      var cached = await db.baseMeta.get(`dict:v2:${word}`);
      if (cached && cached.data && Array.isArray(cached.data.sections)) {
        this.memCache.set(word, cached.data as WordMeaningResult);
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
    }, 5500);

    try {
      var apiUrl = `${WIKTIONARY_API}?action=query&prop=extracts&exsectionformat=wiki&titles=${encodeURIComponent(word)}&format=json&origin=*&redirects=1`;
      var res = await fetch(apiUrl, {
        headers: { 'Accept': 'application/json' },
        signal: controller.signal
      });
      clearTimeout(timeoutId);

      if (!res.ok) {
        return {
          word: word,
          found: false,
          sections: [],
          sources: [],
          definitions: [],
          sourceUrl: sourceUrl,
          offlineError: true
        };
      }

      var data = await res.json();
      var pages = data?.query?.pages || {};
      var pageKeys = Object.keys(pages);
      if (pageKeys.length === 0 || pageKeys[0] === '-1') {
        var notFoundResult: WordMeaningResult = {
          word: word,
          found: false,
          sections: [],
          sources: [],
          definitions: [],
          sourceUrl: sourceUrl
        };
        this.rememberResult(word, notFoundResult);
        return notFoundResult;
      }

      var extractRaw = String(pages[pageKeys[0]]?.extract || '');
      var hasHtmlTags = /<(h[1-6]|p|ul|ol|li|div|section)\b/i.test(extractRaw);
      var parsed = hasHtmlTags
        ? parseWiktionaryHtml(extractRaw, word, sourceUrl)
        : parsePlainWiktionaryFallback(extractRaw, word, sourceUrl);

      this.rememberResult(word, parsed);
      return parsed;
    } catch (e) {
      clearTimeout(timeoutId);
      return {
        word: word,
        found: false,
        sections: [],
        sources: [],
        definitions: [],
        sourceUrl: sourceUrl,
        offlineError: true
      };
    }
  }

  private rememberResult(word: string, result: WordMeaningResult) {
    this.memCache.set(word, result);
    db.baseMeta
      .put({
        key: `dict:v2:${word}`,
        data: JSON.parse(JSON.stringify(result)),
        updatedAt: new Date().toISOString()
      })
      .catch(function () {});
  }
}

export var wordLookupService = new WordLookupService();
