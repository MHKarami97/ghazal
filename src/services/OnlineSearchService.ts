import { db } from '../db/GhazalDB';
import { normalizeGanjoorFullUrl } from '../utils/ganjoorPoemMapper';
import type { SearchResultItem } from './SearchIndexService';

export interface OnlineSearchResponse {
  items: SearchResultItem[];
  pageNumber: number;
  hasMore: boolean;
  totalCount?: number;
}

export interface OnlineSearchOptions {
  poetId?: number;
  pageNumber?: number;
  pageSize?: number;
  rhythm?: string;
  rhyme?: string;
  signal?: AbortSignal;
}

var SEARCH_PATHS = [
  'https://api.ganjoor.net/api/ganjoor/poems/search',
  'https://api.ganjoor.net/api/ganjoor/poem/search'
];

var preferredSearchPath: string | null = null;

function normalizeForMatch(raw: string): string {
  return (raw || '')
    .normalize('NFC')
    .replace(/[\u064B-\u065F\u0670\u0640]/g, '')
    .replace(/ي|ى/g, 'ی')
    .replace(/ك/g, 'ک')
    .replace(/ة/g, 'ه')
    .replace(/إ|أ|آ/g, 'ا')
    .replace(/[\u200C\u200B]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function stripHtmlTags(html: string): string {
  return (html || '')
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/div>|<\/p>/gi, '\n')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/gi, ' ')
    .replace(/[ \t]+/g, ' ')
    .trim();
}

function extractBestMatchSnippet(
  item: any,
  normQuery: string
): { verseText: string; coupletIndex: number } {
  var queryTokens = normQuery.split(' ').filter(function (w) { return w.length >= 2; });
  var rawVerses = Array.isArray(item.verses) ? item.verses : [];

  if (rawVerses.length > 0) {
    var bestIdx = -1;
    var bestScore = -1;

    for (var i = 0; i < rawVerses.length; i++) {
      var v = rawVerses[i];
      var text = String(v?.text || v?.Text || v?.m1 || '').trim();
      if (!text) continue;
      var normText = normalizeForMatch(text);
      if (normQuery && normText.indexOf(normQuery) !== -1) {
        bestIdx = i;
        break;
      }

      var hits = 0;
      for (var t = 0; t < queryTokens.length; t++) {
        if (normText.indexOf(queryTokens[t]) !== -1) hits++;
      }
      if (hits > bestScore) {
        bestScore = hits;
        bestIdx = i;
      }
    }

    var targetIdx = bestIdx >= 0 ? bestIdx : 0;
    var targetVerse = rawVerses[targetIdx];
    var coupletIndex = typeof targetVerse?.coupletIndex === 'number'
      ? targetVerse.coupletIndex
      : Math.floor(targetIdx / 2);

    var lineText = String(
      targetVerse?.text ||
      targetVerse?.Text ||
      (targetVerse?.m1 && targetVerse?.m2 ? `${targetVerse.m1} / ${targetVerse.m2}` : '') ||
      item.title ||
      ''
    ).trim();

    return { verseText: lineText, coupletIndex: coupletIndex };
  }

  var plainSource = String(item.plainText || stripHtmlTags(item.htmlText || '') || '').trim();
  if (plainSource) {
    var lines = plainSource
      .split(/\r?\n/)
      .map(function (l) { return l.trim(); })
      .filter(Boolean);

    for (var li = 0; li < lines.length; li++) {
      var normLine = normalizeForMatch(lines[li]);
      if (normQuery && normLine.indexOf(normQuery) !== -1) {
        return { verseText: lines[li], coupletIndex: Math.floor(li / 2) };
      }
    }

    for (var lk = 0; lk < lines.length; lk++) {
      var normL = normalizeForMatch(lines[lk]);
      for (var qt = 0; qt < queryTokens.length; qt++) {
        if (normL.indexOf(queryTokens[qt]) !== -1) {
          return { verseText: lines[lk], coupletIndex: Math.floor(lk / 2) };
        }
      }
    }

    if (lines.length > 0) {
      return { verseText: lines[0], coupletIndex: 0 };
    }
  }

  return { verseText: String(item.title || item.fullTitle || '').trim(), coupletIndex: 0 };
}

export class OnlineSearchService {
  private memCache: Map<string, OnlineSearchResponse> = new Map();

  async searchAllPoems(term: string, options?: OnlineSearchOptions): Promise<OnlineSearchResponse> {
    var cleanTerm = (term || '').trim();
    if (!cleanTerm) {
      return { items: [], pageNumber: 1, hasMore: false, totalCount: 0 };
    }

    var pageNumber = options?.pageNumber || 1;
    var pageSize = options?.pageSize || 25;
    var poetId = options?.poetId && options.poetId > 0 ? options.poetId : undefined;
    var rhythmFilter = (options?.rhythm || '').trim();
    var rhymeFilter = (options?.rhyme || '').trim();

    var cacheKey = `${normalizeForMatch(cleanTerm)}|p:${poetId || 0}|pg:${pageNumber}|sz:${pageSize}|rh:${rhythmFilter}|ry:${rhymeFilter}`;

    if (this.memCache.has(cacheKey)) {
      return this.memCache.get(cacheKey)!;
    }

    try {
      var dbCached = await db.baseMeta.get(`online-search:${cacheKey}`);
      if (dbCached && dbCached.data && Array.isArray(dbCached.data.items)) {
        this.memCache.set(cacheKey, dbCached.data);
        return dbCached.data as OnlineSearchResponse;
      }
    } catch (e) {}

    var params = new URLSearchParams();
    params.set('term', cleanTerm);
    if (poetId) {
      params.set('poetId', String(poetId));
    }
    params.set('PageNumber', String(pageNumber));
    params.set('PageSize', String(pageSize));

    var endpoints = preferredSearchPath
      ? [preferredSearchPath]
      : SEARCH_PATHS;

    var res: Response | null = null;
    for (var ei = 0; ei < endpoints.length; ei++) {
      var candidate = `${endpoints[ei]}?${params.toString()}`;
      var attemptRes = await fetch(candidate, {
        headers: { 'Accept': 'application/json' },
        signal: options?.signal
      });
      if (attemptRes.ok) {
        preferredSearchPath = endpoints[ei];
        res = attemptRes;
        break;
      }
      if (attemptRes.status !== 404 && attemptRes.status !== 405) {
        throw new Error(`HTTP ${attemptRes.status}`);
      }
    }

    if (!res) {
      return { items: [], pageNumber: pageNumber, hasMore: false, totalCount: 0 };
    }

    var paginationHeader = res.headers.get('PaginationMetadata') || res.headers.get('x-pagination');
    var headerMeta: any = null;
    if (paginationHeader) {
      try {
        headerMeta = JSON.parse(paginationHeader);
      } catch (e) {}
    }

    var payload = await res.json();
    var rawList: any[] = Array.isArray(payload)
      ? payload
      : (payload?.poems || payload?.items || payload?.results || payload?.data || []);

    var normQuery = normalizeForMatch(cleanTerm);
    var mapped: SearchResultItem[] = [];

    for (var i = 0; i < rawList.length; i++) {
      var p = rawList[i];
      if (!p) continue;

      var poemId = Number(p.id || p.poemId || 0);
      if (!poemId) continue;

      var fullTitle = String(p.fullTitle || p.title || 'شعر').trim();
      var title = String(p.title || fullTitle).trim();
      var poetName = String(
        p.poet?.nickname ||
        p.poet?.name ||
        p.poetName ||
        p.category?.poet?.name ||
        (fullTitle.indexOf('»') !== -1 ? fullTitle.split('»')[0].trim() : '') ||
        'گنجور'
      ).trim();

      var fullUrl = normalizeGanjoorFullUrl(String(p.fullUrl || p.url || p.urlSlug || ''));
      var rhythm = String(
        p.ganjoorMetre?.rhythm ||
        p.rhythm ||
        (typeof p.metre === 'string' ? p.metre : p.metre?.rhythm) ||
        ''
      ).trim();
      var rhyme = String(p.rhymeLetters || '').trim();

      if (rhythmFilter && rhythm && rhythm.indexOf(rhythmFilter) === -1) continue;
      if (rhymeFilter && rhyme && rhyme.indexOf(rhymeFilter) === -1) continue;

      var snippet = extractBestMatchSnippet(p, normQuery);

      mapped.push({
        id: poemId * 100000 + snippet.coupletIndex,
        poemId: poemId,
        poetId: Number(p.poetId || p.poet?.id || poetId || 0),
        poetName: poetName,
        poemTitle: title,
        fullUrl: fullUrl || undefined,
        coupletIndex: snippet.coupletIndex,
        verseText: snippet.verseText,
        rhythm: rhythm || undefined,
        rhyme: rhyme || undefined,
        highlightQuery: cleanTerm,
        source: 'online'
      });
    }

    var totalCount = typeof payload?.totalCount === 'number'
      ? payload.totalCount
      : (typeof headerMeta?.totalCount === 'number' ? headerMeta.totalCount : undefined);

    var hasMore = typeof headerMeta?.hasNext === 'boolean'
      ? headerMeta.hasNext
      : (typeof payload?.hasNext === 'boolean'
          ? payload.hasNext
          : rawList.length >= pageSize);

    var result: OnlineSearchResponse = {
      items: mapped,
      pageNumber: pageNumber,
      hasMore: hasMore,
      totalCount: totalCount
    };

    if (this.memCache.size > 40) {
      var oldest = this.memCache.keys().next().value;
      if (oldest !== undefined) this.memCache.delete(oldest);
    }
    this.memCache.set(cacheKey, result);

    try {
      await db.baseMeta.put({
        key: `online-search:${cacheKey}`,
        data: JSON.parse(JSON.stringify(result)),
        updatedAt: new Date().toISOString()
      });
    } catch (e) {}

    return result;
  }
}

export var onlineSearchService = new OnlineSearchService();
