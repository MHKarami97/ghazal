import { db } from '../db/GhazalDB';

export interface PoemRecitation {
  id: number;
  poemId: number;
  audioArtist: string;
  audioTitle: string;
  mp3Url: string;
  xmlUrl?: string;
  xmlText?: string;
  audioArtistUrl?: string;
  mp3SizeInBytes?: number;
  inSyncWithText?: boolean;
  recitationType?: number | string;
}

export interface RecitationSyncPoint {
  verseOrder: number; // 0-based index of verse/misra
  audioMs: number;    // Milliseconds in the audio file
}

export interface RecitationSyncData {
  recitationId: number;
  poemId: number;
  points: RecitationSyncPoint[];
}

export function isCommentaryRecitation(rec: PoemRecitation): boolean {
  if (rec.recitationType === 1 || rec.recitationType === '1') return true;
  if (typeof rec.recitationType === 'string' && rec.recitationType.toLowerCase() === 'commentary') {
    return true;
  }
  return false;
}

/**
 * پارس فایل XML همگام‌سازی گنجور به نقاط همگامی
 */
export function parseGanjoorSyncXml(xml: string): RecitationSyncPoint[] {
  var points: RecitationSyncPoint[] = [];
  if (!xml || typeof xml !== 'string') return points;

  // ۱. پارس با DOMParser مرورگر
  if (typeof DOMParser !== 'undefined') {
    try {
      var parser = new DOMParser();
      var doc = parser.parseFromString(xml, 'text/xml');
      var nodes = doc.getElementsByTagName('SyncInfo');
      for (var i = 0; i < nodes.length; i++) {
        var node = nodes[i];
        var voEl = node.getElementsByTagName('VerseOrder')[0];
        var msEl = node.getElementsByTagName('AudioMiliseconds')[0];
        if (voEl && msEl) {
          var vo = parseInt(voEl.textContent || '', 10);
          var ms = parseInt(msEl.textContent || '', 10);
          if (!isNaN(vo) && !isNaN(ms)) {
            points.push({ verseOrder: vo, audioMs: ms });
          }
        }
      }
    } catch (e) {}
  }

  // ۲. پشتیبان با Regex در صورت خطای DOMParser یا محیط غیرمرورگر
  if (points.length === 0) {
    var regex = /<SyncInfo>[\s\S]*?<VerseOrder>(-?\d+)<\/VerseOrder>[\s\S]*?<AudioMiliseconds>(\d+)<\/AudioMiliseconds>[\s\S]*?<\/SyncInfo>/gi;
    var match: RegExpExecArray | null;
    while ((match = regex.exec(xml)) !== null) {
      var parsedVo = parseInt(match[1], 10);
      var parsedMs = parseInt(match[2], 10);
      if (!isNaN(parsedVo) && !isNaN(parsedMs)) {
        points.push({ verseOrder: parsedVo, audioMs: parsedMs });
      }
    }
  }

  return points.sort(function (a, b) {
    return a.audioMs - b.audioMs;
  });
}

export class RecitationService {
  private memCache: Map<number, PoemRecitation[]> = new Map();
  private syncCache: Map<number, RecitationSyncData | null> = new Map();

  async getRecitations(poemId: number): Promise<PoemRecitation[]> {
    if (!poemId) return [];

    if (this.memCache.has(poemId)) {
      return this.memCache.get(poemId)!;
    }

    // 1. چک کردن دیتابیس محلی
    try {
      var cached = await db.baseMeta.get(`recitations:v2:${poemId}`);
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
          xmlText: item.xmlText || '',
          audioArtistUrl: item.audioArtistUrl || '',
          mp3SizeInBytes: item.mp3SizeInBytes || 0,
          inSyncWithText: !!item.inSyncWithText,
          recitationType: item.recitationType
        };
      }).filter(function (r) {
        return !!r.mp3Url;
      });

      this.memCache.set(poemId, recitations);

      try {
        await db.baseMeta.put({
          key: `recitations:v2:${poemId}`,
          data: JSON.parse(JSON.stringify(recitations)),
          updatedAt: new Date().toISOString()
        });
      } catch (e) {}

      return recitations;
    } catch (err) {
      return [];
    }
  }

  /**
   * دریافت و کش کردن داده‌های همگام‌سازی متنی و صوتی گنجور برای یک دکلمه
   */
  async getRecitationSync(recitation: PoemRecitation): Promise<RecitationSyncData | null> {
    if (!recitation || !recitation.id) return null;

    if (this.syncCache.has(recitation.id)) {
      return this.syncCache.get(recitation.id)!;
    }

    var cacheKey = `recitation-sync:v2:${recitation.id}`;

    // ۱. بررسی حافظه موقت محلی IndexedDB
    try {
      var cached = await db.baseMeta.get(cacheKey);
      if (cached && cached.data && Array.isArray(cached.data.points)) {
        var data: RecitationSyncData = cached.data;
        this.syncCache.set(recitation.id, data);
        return data;
      }
    } catch (e) {}

    // ۲. مسیرهای قابل دریافت XML
    var urlsToTry: string[] = [];
    if (recitation.xmlUrl) {
      urlsToTry.push(recitation.xmlUrl);
    }
    if (recitation.xmlText) {
      urlsToTry.push(recitation.xmlText);
    }
    urlsToTry.push(`https://api.ganjoor.net/api/audio/xml/${recitation.id}`);

    for (var i = 0; i < urlsToTry.length; i++) {
      var targetUrl = urlsToTry[i];
      try {
        var controller = new AbortController();
        var timeoutId = setTimeout(function () {
          controller.abort();
        }, 6000);

        var res = await fetch(targetUrl, { signal: controller.signal });
        clearTimeout(timeoutId);

        if (!res.ok) continue;

        var text = await res.text();
        if (!text || text.trim().length === 0) continue;

        // اگر خروجی رشتهٔ JSON احاطه‌شده در گیومه باشد (مانند API گنجور)
        if ((text.startsWith('"') && text.endsWith('"')) || (text.startsWith('"{') && text.endsWith('}"'))) {
          try {
            text = JSON.parse(text);
          } catch (e) {}
        }

        var points = parseGanjoorSyncXml(text);
        if (points.length > 0) {
          var syncData: RecitationSyncData = {
            recitationId: recitation.id,
            poemId: recitation.poemId,
            points: points
          };

          this.syncCache.set(recitation.id, syncData);

          try {
            await db.baseMeta.put({
              key: cacheKey,
              data: JSON.parse(JSON.stringify(syncData)),
              updatedAt: new Date().toISOString()
            });
          } catch (e) {}

          return syncData;
        }
      } catch (err) {
        // ادامه به آدرس بعدی در صورت بروز خطا
      }
    }

    this.syncCache.set(recitation.id, null);
    return null;
  }
}

export const recitationService = new RecitationService();
