import type {
  GanjoorGeotag,
  GanjoorLiteraryConcept,
  GanjoorLocation,
  GanjoorPerson,
  GanjoorPersonAffiliation,
  GanjoorPersonRelation,
  GanjoorPoem,
  GanjoorVerse
} from '../types/ganjoor';
import { analyzePoemVocabulary, cleanPoemWord } from './abjad';
import { getPoemMetreRhythm, groupVersesIntoCouplets } from './formatters';

export interface PoemConsonantStat {
  letter: string;
  count: number;
  percentage: number;
}

export interface PoemStyleAnalytics {
  coupletCount: number;
  verseCount: number;
  totalWords: number;
  uniqueWords: number;
  lexicalRichness: number;
  avgWordsPerCouplet: number;
  estimatedReadMinutes: number;
  rhymeLetters: string;
  rhythm: string;
  sourceName: string;
  radif: string;
  rhymeWords: string[];
  topConsonants: PoemConsonantStat[];
}

export interface PoemLocationMention {
  id: number;
  name: string;
  coupletIndexes: number[];
}

export interface PoemPersonMention {
  id: number;
  name: string;
  caption?: string;
  coupletIndexes: number[];
  matchKind: 'evidence' | 'tag' | 'text';
}

var NON_CONSONANT_LETTERS = new Set(['ا', 'و', 'ی', 'ه', 'آ', 'ء', 'أ', 'إ', 'ؤ', 'ئ', 'ة', 'ۀ', 'ى', 'ي']);

var AMBIGUOUS_PERSON_NAMES = new Set([
  'مهر', 'ماه', 'جان', 'گل', 'بهار', 'امید', 'باران', 'سحر', 'وفا', 'صفا', 'نگار', 'ناز',
  'روشن', 'دولت', 'آزاد', 'عادل', 'کمال', 'جمال', 'جلال', 'شیرین', 'شیر', 'خسرو',
  'فرهاد', 'ملک', 'سلطان', 'صالح', 'حسین', 'حسن', 'محمد', 'علی', 'رضا', 'احمد', 'سعد'
]);

function normalizeCompareText(raw: string): string {
  return (raw || '')
    .normalize('NFC')
    .replace(/[\u064B-\u065F\u0670\u0640]/g, '')
    .replace(/ي|ى/g, 'ی')
    .replace(/ك/g, 'ک')
    .replace(/ة/g, 'ه')
    .trim();
}

function tokenizeNormalizedWords(line: string): string[] {
  var parts = (line || '').split(/\s+/);
  var out: string[] = [];
  for (var i = 0; i < parts.length; i++) {
    var clean = cleanPoemWord(parts[i]);
    if (clean) out.push(clean);
  }
  return out;
}

function extractRadifAndRhymes(verses: GanjoorVerse[]): { radif: string; rhymeWords: string[] } {
  var pairs = groupVersesIntoCouplets(verses);
  if (pairs.length < 2) {
    return { radif: '', rhymeWords: [] };
  }

  // مصراع‌های قافیه‌دار استاندارد در غزل/قصیده: دو مصراع مطلع و مصراع‌های دوم ابیات بعدی
  var rhymingTokenLines: string[][] = [];
  if (pairs[0].rightVerse?.Text) {
    var r0 = tokenizeNormalizedWords(pairs[0].rightVerse.Text);
    if (r0.length > 0) rhymingTokenLines.push(r0);
  }
  for (var p = 0; p < pairs.length; p++) {
    var leftText = pairs[p].leftVerse?.Text || pairs[p].rightVerse?.Text || '';
    var tokens = tokenizeNormalizedWords(leftText);
    if (tokens.length > 0) rhymingTokenLines.push(tokens);
  }

  if (rhymingTokenLines.length < 2) {
    return { radif: '', rhymeWords: [] };
  }

  // پیدا کردن بیشترین پسوند واژگانی مشترک (حداکثر ۳ واژه) میان دست‌کم نصف مصراع‌های قافیه‌دار
  var radifTokens: string[] = [];
  for (var len = 3; len >= 1; len--) {
    var suffixCounts: Record<string, { count: number; tokens: string[] }> = {};
    for (var i = 0; i < rhymingTokenLines.length; i++) {
      var lineTokens = rhymingTokenLines[i];
      if (lineTokens.length <= len) continue;
      var slice = lineTokens.slice(lineTokens.length - len);
      var key = slice.join(' ');
      if (!suffixCounts[key]) {
        suffixCounts[key] = { count: 0, tokens: slice };
      }
      suffixCounts[key].count++;
    }

    var bestKey = '';
    var bestCount = 0;
    var keys = Object.keys(suffixCounts);
    for (var k = 0; k < keys.length; k++) {
      if (suffixCounts[keys[k]].count > bestCount) {
        bestCount = suffixCounts[keys[k]].count;
        bestKey = keys[k];
      }
    }

    var minMatch = Math.max(2, Math.ceil(rhymingTokenLines.length * 0.55));
    if (bestCount >= minMatch) {
      radifTokens = suffixCounts[bestKey].tokens;
      break;
    }
  }

  var radifStr = radifTokens.join(' ');
  var rhymeWordSet: string[] = [];
  var rLen = radifTokens.length;

  for (var m = 0; m < rhymingTokenLines.length; m++) {
    var line = rhymingTokenLines[m];
    if (rLen > 0) {
      if (line.length <= rLen) continue;
      var tailMatches = true;
      for (var t = 0; t < rLen; t++) {
        if (line[line.length - rLen + t] !== radifTokens[t]) {
          tailMatches = false;
          break;
        }
      }
      if (!tailMatches) continue;
      var candidate = line[line.length - rLen - 1];
      if (candidate && rhymeWordSet.indexOf(candidate) === -1) {
        rhymeWordSet.push(candidate);
      }
    } else {
      var lastWord = line[line.length - 1];
      if (lastWord && rhymeWordSet.indexOf(lastWord) === -1) {
        rhymeWordSet.push(lastWord);
      }
    }
  }

  // اگر بدون ردیف تقریباً هیچ هم‌آوایی آخر مصراع تکراری نبود (مثلاً مثنوی)، واژگان قافیه را صرف‌نظر می‌کنیم تا اشتباه نمایش ندهد
  if (!radifStr && pairs.length >= 4 && rhymeWordSet.length >= rhymingTokenLines.length - 1) {
    // حفظ ۴ واژه پایانی نمونه فقط برای نمایش ساختار پایان مصراع
    rhymeWordSet = rhymeWordSet.slice(0, 5);
  } else {
    rhymeWordSet = rhymeWordSet.slice(0, 6);
  }

  return {
    radif: radifStr,
    rhymeWords: rhymeWordSet
  };
}

function analyzeTopConsonants(verses: GanjoorVerse[]): PoemConsonantStat[] {
  var counts: Record<string, number> = {};
  var totalConsonants = 0;

  for (var i = 0; i < verses.length; i++) {
    var text = normalizeCompareText(verses[i]?.Text || '');
    for (var j = 0; j < text.length; j++) {
      var ch = text[j];
      if (!/^[\u0621-\u06CC]$/.test(ch)) continue;
      if (NON_CONSONANT_LETTERS.has(ch)) continue;
      totalConsonants++;
      counts[ch] = (counts[ch] || 0) + 1;
    }
  }

  var list: PoemConsonantStat[] = [];
  var letters = Object.keys(counts);
  for (var k = 0; k < letters.length; k++) {
    var l = letters[k];
    var c = counts[l];
    list.push({
      letter: l,
      count: c,
      percentage: totalConsonants > 0 ? Number(((c / totalConsonants) * 100).toFixed(1)) : 0
    });
  }

  list.sort(function (a, b) {
    return b.count - a.count;
  });

  return list.slice(0, 4);
}

/**
 * استخراج آمار تکمیلی قافیه، ردیف، ساختار و واج‌آرایی شعر از داده‌های محلی
 */
export function analyzePoemStyle(poem: GanjoorPoem): PoemStyleAnalytics {
  var verses = poem?.Verses || [];
  var pairs = groupVersesIntoCouplets(verses);
  var vocab = analyzePoemVocabulary(verses);
  var coupletCount = pairs.length;
  var lexicalRichness = vocab.totalWords > 0
    ? Math.round((vocab.uniqueWords / vocab.totalWords) * 100)
    : 0;
  var avgWordsPerCouplet = coupletCount > 0
    ? Number((vocab.totalWords / coupletCount).toFixed(1))
    : 0;
  var estimatedReadMinutes = Math.max(1, Math.ceil(vocab.totalWords / 110));
  var rhymeData = extractRadifAndRhymes(verses);

  return {
    coupletCount: coupletCount,
    verseCount: verses.length,
    totalWords: vocab.totalWords,
    uniqueWords: vocab.uniqueWords,
    lexicalRichness: lexicalRichness,
    avgWordsPerCouplet: avgWordsPerCouplet,
    estimatedReadMinutes: estimatedReadMinutes,
    rhymeLetters: (poem.RhymeLetters || '').trim(),
    rhythm: getPoemMetreRhythm(poem),
    sourceName: (poem.SourceName || '').trim(),
    radif: rhymeData.radif,
    rhymeWords: rhymeData.rhymeWords,
    topConsonants: analyzeTopConsonants(verses)
  };
}

export interface LiteraryMetadataContext {
  geotags: GanjoorGeotag[];
  people: GanjoorPerson[];
  relations: GanjoorPersonRelation[];
  affiliations: GanjoorPersonAffiliation[];
  concepts: GanjoorLiteraryConcept[];
  getLocationById: (id: number) => GanjoorLocation | undefined;
  getPersonById: (id: number) => GanjoorPerson | undefined;
}

/**
 * استخراج اشخاص تاریخی/اساطیری و مکان‌های جغرافیایی نام‌برده‌شده در شعر
 */
export function extractPoemPeopleAndLocations(
  poem: GanjoorPoem,
  ctx: LiteraryMetadataContext
): { locations: PoemLocationMention[]; people: PoemPersonMention[] } {
  if (!poem) {
    return { locations: [], people: [] };
  }

  // ۱. مکان‌های جغرافیایی از geotags رسمی
  var locMap = new Map<number, PoemLocationMention>();
  var geotags = ctx.geotags || [];
  for (var g = 0; g < geotags.length; g++) {
    var gt = geotags[g];
    if (gt.PoemId !== poem.Id) continue;
    var loc = ctx.getLocationById(gt.LocationId);
    if (!loc) continue;
    var existingLoc = locMap.get(loc.Id);
    if (!existingLoc) {
      existingLoc = {
        id: loc.Id,
        name: loc.Name,
        coupletIndexes: []
      };
      locMap.set(loc.Id, existingLoc);
    }
    if (typeof gt.CoupletIndex === 'number' && existingLoc.coupletIndexes.indexOf(gt.CoupletIndex) === -1) {
      existingLoc.coupletIndexes.push(gt.CoupletIndex);
    }
  }

  var locations: PoemLocationMention[] = [];
  locMap.forEach(function (item) {
    item.coupletIndexes.sort(function (a, b) { return a - b; });
    locations.push(item);
  });

  // ۲. اشخاص نام‌برده‌شده از اسناد روابط، پیوندها، مفاهیم تگ ادبی و تطبیق نام‌های شاخص
  var personMap = new Map<number, PoemPersonMention>();
  function upsertPerson(person: GanjoorPerson, coupletIndex: number | undefined, matchKind: 'evidence' | 'tag' | 'text') {
    var entry = personMap.get(person.Id);
    if (!entry) {
      entry = {
        id: person.Id,
        name: person.Name,
        caption: person.FamilyTreeCaption || person.Description,
        coupletIndexes: [],
        matchKind: matchKind
      };
      personMap.set(person.Id, entry);
    }
    if (typeof coupletIndex === 'number' && coupletIndex >= 0 && entry.coupletIndexes.indexOf(coupletIndex) === -1) {
      entry.coupletIndexes.push(coupletIndex);
    }
  }

  var rels = ctx.relations || [];
  for (var r = 0; r < rels.length; r++) {
    var rel = rels[r];
    var evList = rel.Evidence || [];
    for (var e = 0; e < evList.length; e++) {
      if (evList[e].PoemId === poem.Id) {
        var p1 = ctx.getPersonById(rel.Person1Id);
        var p2 = ctx.getPersonById(rel.Person2Id);
        if (p1) upsertPerson(p1, evList[e].CoupletIndex, 'evidence');
        if (p2) upsertPerson(p2, evList[e].CoupletIndex, 'evidence');
      }
    }
  }

  var affs = ctx.affiliations || [];
  for (var a = 0; a < affs.length; a++) {
    var aff = affs[a];
    var affEv = aff.Evidence || [];
    for (var ae = 0; ae < affEv.length; ae++) {
      if (affEv[ae].PoemId === poem.Id) {
        var ap1 = ctx.getPersonById(aff.Person1Id);
        var ap2 = ctx.getPersonById(aff.Person2Id);
        if (ap1) upsertPerson(ap1, affEv[ae].CoupletIndex, 'evidence');
        if (ap2) upsertPerson(ap2, affEv[ae].CoupletIndex, 'evidence');
      }
    }
  }

  // تطبیق دقیق بر اساس ConceptId یا نام‌های شاخص تاریخی/اساطیری درون ابیات
  var personByNormName = new Map<string, GanjoorPerson>();
  var allPeople = ctx.people || [];
  for (var pi = 0; pi < allPeople.length; pi++) {
    var pn = normalizeCompareText(allPeople[pi].Name);
    if (pn && !personByNormName.has(pn)) {
      personByNormName.set(pn, allPeople[pi]);
    }
  }

  var conceptsById = new Map<number, string>();
  var concepts = ctx.concepts || [];
  for (var ci = 0; ci < concepts.length; ci++) {
    conceptsById.set(concepts[ci].Id, normalizeCompareText(concepts[ci].Name));
  }

  var tags = poem.LiteraryTags || [];
  for (var ti = 0; ti < tags.length; ti++) {
    var tag = tags[ti];
    for (var tp = 0; tp < (tag.Parts || []).length; tp++) {
      var part = tag.Parts[tp];
      if (part.ConceptId && conceptsById.has(part.ConceptId)) {
        var cName = conceptsById.get(part.ConceptId)!;
        var matchedByConcept = personByNormName.get(cName);
        if (matchedByConcept) {
          upsertPerson(matchedByConcept, tag.CoupletIndex, 'tag');
        }
      }
    }
  }

  // اسکن دقیق متن ابیات برای شخصیت‌های شاخص یا نام‌های چندکلمه‌ای
  var verses = poem.Verses || [];
  if (verses.length > 0 && allPeople.length > 0) {
    var verseWordsByIndex: { coupletIndex: number; text: string; tokens: Set<string> }[] = [];
    for (var vi = 0; vi < verses.length; vi++) {
      var vNorm = normalizeCompareText(verses[vi].Text || '');
      verseWordsByIndex.push({
        coupletIndex: verses[vi].CoupletIndex,
        text: ` ${vNorm.replace(/[.,،؛:!؟?«»()\[\]{}]/g, ' ')} `,
        tokens: new Set(tokenizeNormalizedWords(verses[vi].Text || ''))
      });
    }

    for (var pk = 0; pk < allPeople.length; pk++) {
      var cand = allPeople[pk];
      if (personMap.has(cand.Id)) continue;
      var normName = normalizeCompareText(cand.Name);
      if (!normName || normName.length < 4) continue;
      if (AMBIGUOUS_PERSON_NAMES.has(normName)) continue;

      var isMultiWord = normName.indexOf(' ') !== -1;
      if (!isMultiWord && cand.Importance !== 'Important') continue;

      for (var vw = 0; vw < verseWordsByIndex.length; vw++) {
        var vEntry = verseWordsByIndex[vw];
        var matched = isMultiWord
          ? vEntry.text.indexOf(` ${normName} `) !== -1
          : vEntry.tokens.has(normName);
        if (matched) {
          upsertPerson(cand, vEntry.coupletIndex, 'text');
        }
      }
    }
  }

  var people: PoemPersonMention[] = [];
  personMap.forEach(function (item) {
    item.coupletIndexes.sort(function (a, b) { return a - b; });
    people.push(item);
  });

  // اولویت نمایش با موارد مستند و تگ‌شده، سپس نام‌های متن
  people.sort(function (a, b) {
    var order = { evidence: 0, tag: 1, text: 2 };
    return order[a.matchKind] - order[b.matchKind];
  });

  return {
    locations: locations,
    people: people.slice(0, 16)
  };
}
