import { db } from '../db/GhazalDB';
import { normalizeGanjoorFullUrl } from '../utils/ganjoorPoemMapper';

export interface PoemSongContextMeta {
  poemId: number;
  poemTitle?: string;
  poemFullUrl?: string;
  poetSlug?: string;
  poetName?: string;
  poetId?: number;
}

export interface PoemSongTrack {
  id: number;
  poemId: number;
  artistName: string;
  artistUrl?: string;
  albumName?: string;
  albumUrl?: string;
  trackName: string;
  trackUrl?: string;
  description?: string;
  trackType?: string | number;
  poemTitle?: string;
  poemFullUrl?: string;
  poetSlug?: string;
  poetName?: string;
  poetId?: number;
}

export interface CachedPoemSongsRecord {
  poemId: number;
  tracks: PoemSongTrack[];
  meta?: PoemSongContextMeta;
  updatedAt: string;
}

var EMPTY_CACHE_TTL_MS = 7 * 24 * 60 * 60 * 1000;
var SONGS_TIMEOUT_MS = 6000;

export function safeSongExternalUrl(url?: string): string {
  if (!url) return '';
  var trimmed = String(url).trim();
  if (/^https?:\/\//i.test(trimmed)) {
    return trimmed;
  }
  return '';
}

export function extractPoetSlugFromUrl(fullUrl?: string): string {
  var norm = normalizeGanjoorFullUrl(fullUrl || '');
  if (!norm) return '';
  var parts = norm.split('/').filter(Boolean);
  return parts.length > 0 ? parts[0] : '';
}

export function detectSongPlatformLabel(track: PoemSongTrack): string {
  var candidates = [track.trackUrl, track.albumUrl, track.artistUrl];
  for (var i = 0; i < candidates.length; i++) {
    var safe = safeSongExternalUrl(candidates[i]);
    if (!safe) continue;
    try {
      var host = new URL(safe).hostname.toLowerCase();
      if (host.indexOf('golha.co.uk') !== -1) return 'گل‌ها';
      if (host.indexOf('spotify.com') !== -1) return 'اسپاتیفای';
      if (host.indexOf('beeptunes.com') !== -1) return 'بیپ‌تونز';
      if (host.indexOf('apple.com') !== -1 || host.indexOf('itunes') !== -1) return 'اپل موزیک';
      if (host.indexOf('youtube.com') !== -1 || host.indexOf('youtu.be') !== -1) return 'یوتیوب';
      if (host.indexOf('soundcloud.com') !== -1) return 'ساندکلاد';
      if (host.indexOf('shajarian') !== -1 || host.indexOf('khosousi') !== -1) return 'آرشیو خصوصی';
    } catch (e) {}
  }

  if (typeof track.trackType === 'string') {
    var rawType = track.trackType.trim();
    if (rawType && !/^\d+$/.test(rawType)) {
      var lower = rawType.toLowerCase();
      if (lower.indexOf('golha') !== -1) return 'گل‌ها';
      if (lower.indexOf('spotify') !== -1) return 'اسپاتیفای';
      if (lower.indexOf('beeptunes') !== -1) return 'بیپ‌تونز';
      if (lower.indexOf('itunes') !== -1 || lower.indexOf('apple') !== -1) return 'اپل موزیک';
      return rawType;
    }
  }

  return 'قطعه موسیقی';
}

function mergeContextMeta(
  poemId: number,
  existing?: PoemSongContextMeta,
  incoming?: Partial<PoemSongContextMeta>
): PoemSongContextMeta | undefined {
  var poemFullUrl = normalizeGanjoorFullUrl(incoming?.poemFullUrl || existing?.poemFullUrl || '');
  var poetSlug = incoming?.poetSlug || existing?.poetSlug || extractPoetSlugFromUrl(poemFullUrl);
  var poemTitle = (incoming?.poemTitle || existing?.poemTitle || '').trim() || undefined;
  var poetName = (incoming?.poetName || existing?.poetName || '').trim() || undefined;
  var poetId = incoming?.poetId || existing?.poetId || undefined;

  if (!poemTitle && !poemFullUrl && !poetSlug && !poetName && !poetId) {
    return undefined;
  }

  return {
    poemId: poemId,
    poemTitle: poemTitle,
    poemFullUrl: poemFullUrl || undefined,
    poetSlug: poetSlug || undefined,
    poetName: poetName,
    poetId: poetId
  };
}

function applyMetaToTracks(tracks: PoemSongTrack[], meta?: PoemSongContextMeta): PoemSongTrack[] {
  if (!meta) return tracks;
  return tracks.map(function (t) {
    return {
      ...t,
      poemTitle: t.poemTitle || meta.poemTitle,
      poemFullUrl: t.poemFullUrl || meta.poemFullUrl,
      poetSlug: t.poetSlug || meta.poetSlug,
      poetName: t.poetName || meta.poetName,
      poetId: t.poetId || meta.poetId
    };
  });
}

function hasRicherMeta(
  prev?: PoemSongContextMeta,
  merged?: PoemSongContextMeta
): boolean {
  if (!merged) return false;
  if (!prev) return true;
  return (
    (!prev.poemTitle && !!merged.poemTitle) ||
    (!prev.poemFullUrl && !!merged.poemFullUrl) ||
    (!prev.poetSlug && !!merged.poetSlug) ||
    (!prev.poetName && !!merged.poetName) ||
    (!prev.poetId && !!merged.poetId)
  );
}

function mapRawSongsPayload(
  rawList: any[],
  poemId: number,
  meta?: PoemSongContextMeta
): PoemSongTrack[] {
  return rawList
    .filter(function (item: any) {
      if (!item || item.approved === false || item.rejected || item.brokenLink) return false;
      var tName = item.trackName || item.TrackName || item.title;
      var aName = item.artistName || item.ArtistName || item.singer;
      var tUrl = item.trackUrl || item.TrackUrl || item.url;
      return !!(tName || aName || tUrl);
    })
    .map(function (item: any) {
      var trackUrl = safeSongExternalUrl(item.trackUrl || item.TrackUrl || item.url) || undefined;
      var artistUrl = safeSongExternalUrl(item.artistUrl || item.ArtistUrl) || undefined;
      var albumUrl = safeSongExternalUrl(item.albumUrl || item.AlbumUrl) || undefined;
      var poemFullUrl = normalizeGanjoorFullUrl(
        item.poemFullUrl || item.poemUrl || meta?.poemFullUrl || ''
      ) || undefined;
      var poetSlug = meta?.poetSlug || extractPoetSlugFromUrl(poemFullUrl) || undefined;

      return {
        id: Number(item.id || item.Id || 0),
        poemId: Number(item.poemId || item.PoemId || poemId),
        artistName: String(item.artistName || item.ArtistName || item.singer || 'هنرمند ناشناس').trim(),
        artistUrl: artistUrl,
        albumName: (item.albumName || item.AlbumName) ? String(item.albumName || item.AlbumName).trim() : undefined,
        albumUrl: albumUrl,
        trackName: String(item.trackName || item.TrackName || item.title || 'قطعه موسیقی').trim(),
        trackUrl: trackUrl,
        description: (item.description || item.Description) ? String(item.description || item.Description).trim() : undefined,
        trackType: item.trackType !== undefined ? item.trackType : item.TrackType,
        poemTitle: (item.poemTitle || meta?.poemTitle) ? String(item.poemTitle || meta?.poemTitle).trim() : undefined,
        poemFullUrl: poemFullUrl,
        poetSlug: poetSlug,
        poetName: meta?.poetName,
        poetId: meta?.poetId
      };
    });
}

export class SongService {
  private memCache: Map<number, CachedPoemSongsRecord> = new Map();
  private summaryCache: Map<number, string> = new Map();

  async getSongs(
    poemId: number,
    contextMeta?: Partial<PoemSongContextMeta>,
    options?: { forceRefresh?: boolean; signal?: AbortSignal }
  ): Promise<PoemSongTrack[]> {
    if (!poemId) return [];

    var forceRefresh = !!options?.forceRefresh;
    var memEntry = this.memCache.get(poemId);
    if (memEntry && !forceRefresh) {
      var updatedMemMeta = mergeContextMeta(poemId, memEntry.meta, contextMeta);
      if (hasRicherMeta(memEntry.meta, updatedMemMeta)) {
        memEntry.meta = updatedMemMeta;
        memEntry.tracks = applyMetaToTracks(memEntry.tracks, updatedMemMeta);
        void this.saveV2Record(memEntry);
      }
      return memEntry.tracks;
    }

    if (!forceRefresh) {
      try {
        var v2 = await db.baseMeta.get(`songs:v2:${poemId}`);
        if (v2 && v2.data && Array.isArray(v2.data.tracks)) {
          var v2Data = v2.data as CachedPoemSongsRecord;
          var isEmptyExpired =
            v2Data.tracks.length === 0 &&
            Date.now() - Date.parse(v2.updatedAt || v2Data.updatedAt || '') > EMPTY_CACHE_TTL_MS;

          if (!isEmptyExpired) {
            var mergedMeta = mergeContextMeta(poemId, v2Data.meta, contextMeta);
            var enrichedTracks = applyMetaToTracks(v2Data.tracks, mergedMeta);
            var resolvedRecord: CachedPoemSongsRecord = {
              poemId: poemId,
              tracks: enrichedTracks,
              meta: mergedMeta,
              updatedAt: v2.updatedAt || v2Data.updatedAt || new Date().toISOString()
            };
            this.memCache.set(poemId, resolvedRecord);
            if (hasRicherMeta(v2Data.meta, mergedMeta)) {
              void this.saveV2Record(resolvedRecord);
            }
            return resolvedRecord.tracks;
          }
        }

        // مهاجرت کش قدیمی تنها در صورت داشتن حداقل یک اثر معتبر (کش خالی قدیمی بازبینی می‌شود)
        var legacy = await db.baseMeta.get(`songs:${poemId}`);
        if (legacy && Array.isArray(legacy.data) && legacy.data.length > 0) {
          var legacyMeta = mergeContextMeta(poemId, undefined, contextMeta);
          var migratedRecord: CachedPoemSongsRecord = {
            poemId: poemId,
            tracks: applyMetaToTracks(legacy.data as PoemSongTrack[], legacyMeta),
            meta: legacyMeta,
            updatedAt: legacy.updatedAt || new Date().toISOString()
          };
          this.memCache.set(poemId, migratedRecord);
          void this.saveV2Record(migratedRecord);
          return migratedRecord.tracks;
        }
      } catch (e) {}
    }

    if (options?.signal?.aborted) {
      return [];
    }

    var controller = new AbortController();
    var onExternalAbort = function () {
      controller.abort();
    };
    if (options?.signal) {
      options.signal.addEventListener('abort', onExternalAbort, { once: true });
    }
    var timeoutId = setTimeout(function () {
      controller.abort();
    }, SONGS_TIMEOUT_MS);

    try {
      var url = `https://api.ganjoor.net/api/ganjoor/poem/${poemId}/songs`;
      var res = await fetch(url, {
        headers: { 'Accept': 'application/json' },
        signal: controller.signal
      });

      if (!res.ok) return [];

      var rawList = await res.json();
      if (!Array.isArray(rawList)) return [];

      var merged = mergeContextMeta(poemId, undefined, contextMeta);
      var tracks = mapRawSongsPayload(rawList, poemId, merged);
      var newRecord: CachedPoemSongsRecord = {
        poemId: poemId,
        tracks: tracks,
        meta: merged,
        updatedAt: new Date().toISOString()
      };
      this.memCache.set(poemId, newRecord);
      await this.saveV2Record(newRecord);
      return tracks;
    } catch (e) {
      return [];
    } finally {
      clearTimeout(timeoutId);
      if (options?.signal) {
        options.signal.removeEventListener('abort', onExternalAbort);
      }
    }
  }

  private async saveV2Record(record: CachedPoemSongsRecord): Promise<void> {
    try {
      await db.baseMeta.put({
        key: `songs:v2:${record.poemId}`,
        data: JSON.parse(JSON.stringify(record)),
        updatedAt: record.updatedAt
      });
    } catch (e) {}
  }

  /**
   * در صورت نبودن خلاصه شعر در بستهٔ دانلودشده، از API سبک گنجور دریافت و کش می‌کند
   */
  async getPoemSummaryFallback(poemId: number): Promise<string> {
    if (!poemId) return '';

    if (this.summaryCache.has(poemId)) {
      return this.summaryCache.get(poemId)!;
    }

    try {
      var cached = await db.baseMeta.get(`poem-summary:${poemId}`);
      if (cached && typeof cached.data === 'string') {
        this.summaryCache.set(poemId, cached.data);
        return cached.data;
      }
    } catch (e) {}

    try {
      var controller = new AbortController();
      var timeoutId = setTimeout(function () {
        controller.abort();
      }, 4500);

      var url = `https://api.ganjoor.net/api/ganjoor/poem/${poemId}?catInfo=false&catPoems=false&rhymes=false&recitations=false&images=false&songs=false&comments=false&navigation=false`;
      var res = await fetch(url, {
        headers: { 'Accept': 'application/json' },
        signal: controller.signal
      });
      clearTimeout(timeoutId);

      if (!res.ok) return '';

      var data = await res.json();
      var summary = String(data?.poemSummary || data?.PoemSummary || '').trim();
      this.summaryCache.set(poemId, summary);

      try {
        await db.baseMeta.put({
          key: `poem-summary:${poemId}`,
          data: summary,
          updatedAt: new Date().toISOString()
        });
      } catch (e) {}

      return summary;
    } catch (e) {
      return '';
    }
  }
}

export var songService = new SongService();
