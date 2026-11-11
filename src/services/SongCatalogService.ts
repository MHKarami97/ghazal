import { db } from '../db/GhazalDB';
import { loadCategoryData } from './CategoryRepository';
import { normalizeGanjoorFullUrl } from '../utils/ganjoorPoemMapper';
import {
  songService,
  extractPoetSlugFromUrl,
  type CachedPoemSongsRecord,
  type PoemSongTrack,
  type PoemSongContextMeta
} from './SongService';
import type { GanjoorCategory, GanjoorCategoryRef, GanjoorPoetRef } from '../types/ganjoor';

export interface CatalogSongEntry {
  poemId: number;
  poemTitle: string;
  poemFullUrl: string;
  poemRoute: string;
  poetSlug: string;
  poetName: string;
  poetId?: number;
  tracks: PoemSongTrack[];
  updatedAt: string;
}

export interface PoemScanRef {
  poemId: number;
  title: string;
  fullUrl: string;
  poetSlug: string;
  poetName: string;
  poetId?: number;
  catTitle?: string;
}

export interface PoetSongOverview {
  rootTitle: string;
  childCats: GanjoorCategoryRef[];
  directPoemsCount: number;
}

export interface PoetSongScanRecord {
  poetSlug: string;
  poetName: string;
  catPath: string;
  catTitle: string;
  scannedCount: number;
  poemsWithSongsCount: number;
  tracksCount: number;
  updatedAt: string;
}

export interface SongScanProgress {
  phase: 'collecting' | 'scanning' | 'done' | 'cancelled';
  collectedPoems: number;
  processedCount: number;
  totalCount: number;
  foundPoemsCount: number;
  foundTracksCount: number;
  currentTitle: string;
}

export interface CachedCatalogResult {
  entries: CatalogSongEntry[];
  inspectedPoemsCount: number;
}

export function buildPoemRouteFromSong(poemId: number, poemFullUrl?: string): string {
  var norm = normalizeGanjoorFullUrl(poemFullUrl || '');
  if (norm) {
    var segments = norm.split('/').filter(Boolean);
    if (segments.length >= 2) {
      return `/read${norm}`;
    }
  }
  return `/poem/${poemId}`;
}

export function categoryUrlToCatPath(fullUrl: string, poetSlug: string): string {
  var clean = normalizeGanjoorFullUrl(fullUrl).replace(/^\/+/, '');
  var slugPrefix = `${poetSlug}/`;
  if (clean === poetSlug) return '';
  if (clean.indexOf(slugPrefix) === 0) {
    return clean.slice(slugPrefix.length);
  }
  return clean;
}

function buildPoetMapBySlug(poetsList?: GanjoorPoetRef[]): Map<string, GanjoorPoetRef> {
  var map = new Map<string, GanjoorPoetRef>();
  if (!poetsList) return map;
  for (var i = 0; i < poetsList.length; i++) {
    var p = poetsList[i];
    var slug = extractPoetSlugFromUrl(p.FullUrl);
    if (slug) {
      map.set(slug, p);
    }
  }
  return map;
}

function buildPoetMapById(poetsList?: GanjoorPoetRef[]): Map<number, GanjoorPoetRef> {
  var map = new Map<number, GanjoorPoetRef>();
  if (!poetsList) return map;
  for (var i = 0; i < poetsList.length; i++) {
    map.set(poetsList[i].Id, poetsList[i]);
  }
  return map;
}

/**
 * خواندن کل فهرست ترانه‌های کش‌شده در IndexedDB (همراه با غنی‌سازی عنوان شعر و نام شاعر از دیوان‌های محلی)
 */
export async function loadCachedSongCatalog(
  poetsList?: GanjoorPoetRef[]
): Promise<CachedCatalogResult> {
  var bySlug = buildPoetMapBySlug(poetsList);
  var byId = buildPoetMapById(poetsList);

  var v2Rows = await db.baseMeta.where('key').startsWith('songs:v2:').toArray();
  var legacyRows = await db.baseMeta
    .where('key')
    .between('songs:0', 'songs:9999999999', true, true)
    .toArray();

  var recordMap = new Map<number, CachedPoemSongsRecord>();
  var inspectedSet = new Set<number>();

  for (var i = 0; i < v2Rows.length; i++) {
    var row = v2Rows[i];
    var data = row.data as CachedPoemSongsRecord | undefined;
    if (!data || !data.poemId) continue;
    inspectedSet.add(data.poemId);
    if (Array.isArray(data.tracks) && data.tracks.length > 0) {
      recordMap.set(data.poemId, data);
    }
  }

  for (var j = 0; j < legacyRows.length; j++) {
    var legacyRow = legacyRows[j];
    if (!/^songs:\d+$/.test(legacyRow.key)) continue;
    var legacyPoemId = Number(legacyRow.key.replace('songs:', ''));
    if (!legacyPoemId || recordMap.has(legacyPoemId)) continue;
    var tracks = Array.isArray(legacyRow.data) ? (legacyRow.data as PoemSongTrack[]) : [];
    if (tracks.length > 0) {
      inspectedSet.add(legacyPoemId);
      recordMap.set(legacyPoemId, {
        poemId: legacyPoemId,
        tracks: tracks,
        updatedAt: legacyRow.updatedAt || ''
      });
    }
  }

  var poemIdsNeedingInfo: number[] = [];
  recordMap.forEach(function (rec) {
    if (!rec.meta?.poemTitle || !rec.meta?.poemFullUrl || !rec.meta?.poetName) {
      poemIdsNeedingInfo.push(rec.poemId);
    }
  });

  var localPoemMap = new Map<number, any>();
  if (poemIdsNeedingInfo.length > 0) {
    try {
      var localPoems = await db.poems.bulkGet(poemIdsNeedingInfo);
      for (var k = 0; k < localPoems.length; k++) {
        var lp = localPoems[k];
        if (lp && lp.Id) {
          localPoemMap.set(lp.Id, lp);
        }
      }
    } catch (e) {}
  }

  var entries: CatalogSongEntry[] = [];
  recordMap.forEach(function (rec) {
    var lp = localPoemMap.get(rec.poemId);
    var firstTrack = rec.tracks[0];
    var poemFullUrl = normalizeGanjoorFullUrl(
      rec.meta?.poemFullUrl || firstTrack?.poemFullUrl || lp?.FullUrl || ''
    );
    var poetSlug =
      rec.meta?.poetSlug ||
      firstTrack?.poetSlug ||
      lp?.PoetSlug ||
      extractPoetSlugFromUrl(poemFullUrl);
    var poetId = rec.meta?.poetId || firstTrack?.poetId || lp?.PoetId;
    var poetRef = (poetSlug ? bySlug.get(poetSlug) : undefined) || (poetId ? byId.get(poetId) : undefined);
    var poetName =
      rec.meta?.poetName ||
      firstTrack?.poetName ||
      poetRef?.Nickname ||
      (poetSlug || 'شاعر نامشخص');
    var poemTitle =
      rec.meta?.poemTitle ||
      firstTrack?.poemTitle ||
      lp?.FullTitle ||
      lp?.Title ||
      `شعر شماره ${rec.poemId}`;

    var enrichedTracks = rec.tracks.map(function (t) {
      return {
        ...t,
        poemTitle: t.poemTitle || poemTitle,
        poemFullUrl: t.poemFullUrl || poemFullUrl || undefined,
        poetSlug: t.poetSlug || poetSlug || undefined,
        poetName: t.poetName || poetName,
        poetId: t.poetId || poetId
      };
    });

    entries.push({
      poemId: rec.poemId,
      poemTitle: poemTitle,
      poemFullUrl: poemFullUrl,
      poemRoute: buildPoemRouteFromSong(rec.poemId, poemFullUrl),
      poetSlug: poetSlug,
      poetName: poetName,
      poetId: poetId,
      tracks: enrichedTracks,
      updatedAt: rec.updatedAt || ''
    });
  });

  entries.sort(function (a, b) {
    var bTime = b.updatedAt ? Date.parse(b.updatedAt) : 0;
    var aTime = a.updatedAt ? Date.parse(a.updatedAt) : 0;
    if (bTime !== aTime) return bTime - aTime;
    return b.tracks.length - a.tracks.length;
  });

  return {
    entries: entries,
    inspectedPoemsCount: inspectedSet.size
  };
}

/**
 * فهرست اشعار دانلودشده در حافظه دستگاه برای اسکن سریع (کل دیوان‌های محلی یا یک شاعر خاص)
 */
export async function getLocalPoemScanRefs(
  poetsList?: GanjoorPoetRef[],
  poetSlugFilter?: string
): Promise<PoemScanRef[]> {
  var bySlug = buildPoetMapBySlug(poetsList);
  var byId = buildPoetMapById(poetsList);

  var poems: any[] = [];
  if (poetSlugFilter) {
    var targetRef = bySlug.get(poetSlugFilter);
    if (targetRef) {
      poems = await db.poems.where('PoetId').equals(targetRef.Id).toArray();
    }
    if (poems.length === 0) {
      var allPoemsFallback = await db.poems.toArray();
      poems = allPoemsFallback.filter(function (p) {
        return extractPoetSlugFromUrl(p.FullUrl) === poetSlugFilter || p.PoetSlug === poetSlugFilter;
      });
    }
  } else {
    poems = await db.poems.toArray();
  }

  var seenIds = new Set<number>();
  var refs: PoemScanRef[] = [];

  for (var i = 0; i < poems.length; i++) {
    var p = poems[i];
    if (!p || !p.Id || seenIds.has(p.Id)) continue;
    seenIds.add(p.Id);
    var fullUrl = normalizeGanjoorFullUrl(p.FullUrl || '');
    var poetSlug = p.PoetSlug || extractPoetSlugFromUrl(fullUrl);
    var poetRef = (poetSlug ? bySlug.get(poetSlug) : undefined) || (p.PoetId ? byId.get(p.PoetId) : undefined);
    refs.push({
      poemId: p.Id,
      title: String(p.FullTitle || p.Title || `شعر ${p.Id}`),
      fullUrl: fullUrl,
      poetSlug: poetSlug,
      poetName: poetRef?.Nickname || poetSlug || 'شاعر',
      poetId: p.PoetId || poetRef?.Id
    });
  }

  return refs;
}

/**
 * دریافت سرفصل‌ها و دفترهای یک شاعر برای انتخاب هدفمند در صفحه ترانه‌ها
 */
export async function loadPoetSongOverview(poetSlug: string): Promise<PoetSongOverview | null> {
  if (!poetSlug) return null;
  try {
    var rootCat = await loadCategoryData(poetSlug, '');
    return {
      rootTitle: rootCat.Title || poetSlug,
      childCats: Array.isArray(rootCat.ChildCats) ? rootCat.ChildCats : [],
      directPoemsCount: Array.isArray(rootCat.Poems) ? rootCat.Poems.length : 0
    };
  } catch (e) {
    return null;
  }
}

/**
 * جمع‌آوری فهرست اشعار یک شاعر یا دفتر خاص از ساختار دسته‌بندی گنجور
 */
export async function collectPoetCategoryRefs(
  poetSlug: string,
  poetName: string,
  poetId?: number,
  initialCatPath: string = '',
  options?: {
    signal?: AbortSignal;
    onCollectProgress?: (count: number, currentCatTitle: string) => void;
    maxCategories?: number;
  }
): Promise<PoemScanRef[]> {
  if (!poetSlug) return [];

  var maxCats = options?.maxCategories || 160;
  var visitedCats = new Set<string>();
  var seenPoemIds = new Set<number>();
  var refs: PoemScanRef[] = [];
  var queue: Array<{ path: string; title: string }> = [
    { path: initialCatPath || '', title: poetName }
  ];

  while (queue.length > 0 && visitedCats.size < maxCats) {
    if (options?.signal?.aborted) break;

    var current = queue.shift()!;
    if (visitedCats.has(current.path)) continue;
    visitedCats.add(current.path);

    var catData: GanjoorCategory;
    try {
      catData = await loadCategoryData(poetSlug, current.path);
    } catch (e) {
      continue;
    }

    if (options?.signal?.aborted) break;

    var catTitle = catData.Title || current.title || poetName;
    if (Array.isArray(catData.Poems)) {
      for (var i = 0; i < catData.Poems.length; i++) {
        var pr = catData.Poems[i];
        if (!pr || !pr.Id || seenPoemIds.has(pr.Id)) continue;
        seenPoemIds.add(pr.Id);
        refs.push({
          poemId: pr.Id,
          title: pr.Title || `شعر ${pr.Id}`,
          fullUrl: normalizeGanjoorFullUrl(pr.FullUrl || ''),
          poetSlug: poetSlug,
          poetName: poetName,
          poetId: poetId || catData.PoetId,
          catTitle: catTitle
        });
      }
    }

    if (options?.onCollectProgress) {
      options.onCollectProgress(refs.length, catTitle);
    }

    if (Array.isArray(catData.ChildCats)) {
      for (var j = 0; j < catData.ChildCats.length; j++) {
        var child = catData.ChildCats[j];
        var childPath = categoryUrlToCatPath(child.FullUrl || '', poetSlug);
        if (childPath && !visitedCats.has(childPath)) {
          queue.push({ path: childPath, title: child.Title || '' });
        }
      }
    }
  }

  return refs;
}

/**
 * اسکن گروهی اشعار برای کشف قطعات موسیقی ثبت‌شده در گنجور و ذخیره در کش آفلاین
 */
export async function scanPoemRefsForSongs(
  refs: PoemScanRef[],
  options?: {
    concurrency?: number;
    forceRefresh?: boolean;
    signal?: AbortSignal;
    onProgress?: (progress: SongScanProgress) => void;
  }
): Promise<{
  processedCount: number;
  foundPoemsCount: number;
  foundTracksCount: number;
  cancelled: boolean;
}> {
  var total = refs.length;
  var concurrency = Math.max(1, Math.min(options?.concurrency || 4, 6));
  var cursor = 0;
  var processedCount = 0;
  var foundPoemsCount = 0;
  var foundTracksCount = 0;
  var lastTitle = '';

  function notify(phase: SongScanProgress['phase']) {
    if (!options?.onProgress) return;
    options.onProgress({
      phase: phase,
      collectedPoems: total,
      processedCount: processedCount,
      totalCount: total,
      foundPoemsCount: foundPoemsCount,
      foundTracksCount: foundTracksCount,
      currentTitle: lastTitle
    });
  }

  async function worker() {
    while (cursor < total) {
      if (options?.signal?.aborted) break;
      var myIdx = cursor++;
      var ref = refs[myIdx];
      lastTitle = ref.title;

      var ctx: Partial<PoemSongContextMeta> = {
        poemId: ref.poemId,
        poemTitle: ref.title,
        poemFullUrl: ref.fullUrl,
        poetSlug: ref.poetSlug,
        poetName: ref.poetName,
        poetId: ref.poetId
      };

      var tracks = await songService.getSongs(ref.poemId, ctx, {
        forceRefresh: options?.forceRefresh,
        signal: options?.signal
      });

      if (!options?.signal?.aborted) {
        processedCount++;
        if (tracks.length > 0) {
          foundPoemsCount++;
          foundTracksCount += tracks.length;
        }
        if (processedCount % 3 === 0 || processedCount === total || tracks.length > 0) {
          notify('scanning');
        }
      }
    }
  }

  notify('scanning');
  var workers: Promise<void>[] = [];
  var workerCount = Math.min(concurrency, Math.max(1, total));
  for (var w = 0; w < workerCount; w++) {
    workers.push(worker());
  }
  await Promise.all(workers);

  var cancelled = !!options?.signal?.aborted;
  notify(cancelled ? 'cancelled' : 'done');

  return {
    processedCount: processedCount,
    foundPoemsCount: foundPoemsCount,
    foundTracksCount: foundTracksCount,
    cancelled: cancelled
  };
}

export async function savePoetSongScanRecord(record: PoetSongScanRecord): Promise<void> {
  if (!record.poetSlug) return;
  try {
    var catKey = record.catPath ? `:${record.catPath}` : '';
    await db.baseMeta.put({
      key: `songs-poet-scan:${record.poetSlug}${catKey}`,
      data: JSON.parse(JSON.stringify(record)),
      updatedAt: record.updatedAt
    });
  } catch (e) {}
}

export async function loadPoetSongScanRecords(): Promise<PoetSongScanRecord[]> {
  try {
    var rows = await db.baseMeta.where('key').startsWith('songs-poet-scan:').toArray();
    var list: PoetSongScanRecord[] = [];
    for (var i = 0; i < rows.length; i++) {
      var data = rows[i].data as PoetSongScanRecord | undefined;
      if (data && data.poetSlug) {
        list.push(data);
      }
    }
    list.sort(function (a, b) {
      return Date.parse(b.updatedAt || '') - Date.parse(a.updatedAt || '');
    });
    return list;
  } catch (e) {
    return [];
  }
}
