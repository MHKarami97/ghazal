import { db } from '../db/GhazalDB';

export interface PoemRecitation {
  id: number;
  poemId: number;
  audioArtist: string;
  audioTitle: string;
  mp3Url: string;
  xmlUrl?: string;
  audioArtistUrl?: string;
  mp3SizeInBytes?: number;
  inSyncWithText?: boolean;
}

export class RecitationService {
  private memCache: Map<number, PoemRecitation[]> = new Map();

  async getRecitations(poemId: number): Promise<PoemRecitation[]> {
    if (!poemId) return [];

    if (this.memCache.has(poemId)) {
      return this.memCache.get(poemId)!;
    }

    // 1. چک کردن دیتابیس محلی
    try {
      var cached = await db.baseMeta.get(`recitations:${poemId}`);
      if (cached && Array.isArray(cached.data)) {
        this.memCache.set(poemId, cached.data);
        return cached.data;
      }
    } catch (e) {}

    // 2. درخواست از API گنجور با کنترل خطای شبکه و تایم‌اوت
    try {
      var controller = new AbortController();
      var timeoutId = setTimeout(function () {
        controller.abort();
      }, 5000);

      var url = `https://api.ganjoor.net/api/ganjoor/poem/${poemId}/recitations`;
      var res = await fetch(url, {
        headers: {
          'Accept': 'application/json'
        },
        signal: controller.signal
      });
      clearTimeout(timeoutId);

      if (!res.ok) {
        return [];
      }

      var rawList = await res.json();
      if (!Array.isArray(rawList)) {
        return [];
      }

      var recitations: PoemRecitation[] = rawList.map(function (item: any) {
        return {
          id: item.id,
          poemId: item.poemId || poemId,
          audioArtist: item.audioArtist || 'خوانشگر ناشناس',
          audioTitle: item.audioTitle || 'دکلمه شعر',
          mp3Url: item.mp3Url || '',
          xmlUrl: item.xmlUrl || '',
          audioArtistUrl: item.audioArtistUrl || '',
          mp3SizeInBytes: item.mp3SizeInBytes || 0,
          inSyncWithText: !!item.inSyncWithText
        };
      }).filter(function (r) {
        return !!r.mp3Url;
      });

      this.memCache.set(poemId, recitations);

      try {
        await db.baseMeta.put({
          key: `recitations:${poemId}`,
          data: JSON.parse(JSON.stringify(recitations)),
          updatedAt: new Date().toISOString()
        });
      } catch (e) {}

      return recitations;
    } catch (err) {
      return [];
    }
  }
}

export const recitationService = new RecitationService();
