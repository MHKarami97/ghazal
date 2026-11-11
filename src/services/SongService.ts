import { db } from '../db/GhazalDB';

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
}

export class SongService {
  private memCache: Map<number, PoemSongTrack[]> = new Map();
  private summaryCache: Map<number, string> = new Map();

  async getSongs(poemId: number): Promise<PoemSongTrack[]> {
    if (!poemId) return [];

    if (this.memCache.has(poemId)) {
      return this.memCache.get(poemId)!;
    }

    try {
      var cached = await db.baseMeta.get(`songs:${poemId}`);
      if (cached && Array.isArray(cached.data)) {
        this.memCache.set(poemId, cached.data);
        return cached.data;
      }
    } catch (e) {}

    try {
      var controller = new AbortController();
      var timeoutId = setTimeout(function () {
        controller.abort();
      }, 5000);

      var url = `https://api.ganjoor.net/api/ganjoor/poem/${poemId}/songs`;
      var res = await fetch(url, {
        headers: { 'Accept': 'application/json' },
        signal: controller.signal
      });
      clearTimeout(timeoutId);

      if (!res.ok) return [];

      var rawList = await res.json();
      if (!Array.isArray(rawList)) return [];

      var tracks: PoemSongTrack[] = rawList
        .filter(function (item: any) {
          return item && !item.rejected && !item.brokenLink && (item.trackName || item.artistName || item.trackUrl);
        })
        .map(function (item: any) {
          return {
            id: Number(item.id || 0),
            poemId: Number(item.poemId || poemId),
            artistName: String(item.artistName || item.singer || 'هنرمند ناشناس'),
            artistUrl: item.artistUrl || undefined,
            albumName: item.albumName || undefined,
            albumUrl: item.albumUrl || undefined,
            trackName: String(item.trackName || item.title || 'قطعه موسیقی'),
            trackUrl: item.trackUrl || item.url || undefined,
            description: item.description || undefined,
            trackType: item.trackType
          };
        });

      this.memCache.set(poemId, tracks);

      try {
        await db.baseMeta.put({
          key: `songs:${poemId}`,
          data: JSON.parse(JSON.stringify(tracks)),
          updatedAt: new Date().toISOString()
        });
      } catch (e) {}

      return tracks;
    } catch (e) {
      return [];
    }
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
