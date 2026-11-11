import { db } from '../db/GhazalDB';

export interface PoemQuotationItem {
  id: number;
  relatedPoemId: number;
  relatedPoemTitle: string;
  relatedPoetName: string;
  relatedPoemFullUrl: string;
  coupletIndex?: number;
  relatedCoupletIndex?: number;
  coupletVerse1?: string;
  coupletVerse2?: string;
  relatedCoupletVerse1?: string;
  relatedCoupletVerse2?: string;
  note?: string;
  isPriorToRelated?: boolean;
}

export class QuotationService {
  private memCache: Map<number, PoemQuotationItem[]> = new Map();

  async getQuotations(poemId: number): Promise<PoemQuotationItem[]> {
    if (!poemId) return [];

    if (this.memCache.has(poemId)) {
      return this.memCache.get(poemId)!;
    }

    try {
      var cached = await db.baseMeta.get(`quoteds:${poemId}`);
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

      var url = `https://api.ganjoor.net/api/ganjoor/poem/${poemId}/quoteds`;
      var res = await fetch(url, {
        headers: { 'Accept': 'application/json' },
        signal: controller.signal
      });
      clearTimeout(timeoutId);

      if (!res.ok) return [];

      var rawList = await res.json();
      if (!Array.isArray(rawList)) return [];

      var items: PoemQuotationItem[] = rawList
        .filter(function (item: any) {
          return item && (item.relatedPoemId || item.poemId || item.relatedPoemFullTitle || item.relatedCoupletVerse1 || item.coupletVerse1);
        })
        .map(function (item: any) {
          var relId = Number(
            item.relatedPoemId && Number(item.relatedPoemId) !== poemId
              ? item.relatedPoemId
              : (item.poemId && Number(item.poemId) !== poemId ? item.poemId : 0)
          );
          var rawTitle = String(
            item.relatedPoemFullTitle ||
            item.relatedPoemTitle ||
            item.poemFullTitle ||
            item.poemTitle ||
            item.fullTitle ||
            'شعر مرتبط'
          ).trim();
          var rawPoet = String(
            item.relatedPoetName ||
            item.poetName ||
            ''
          ).trim();
          if (!rawPoet && rawTitle.indexOf('»') !== -1) {
            rawPoet = rawTitle.split('»')[0].trim();
          }

          return {
            id: Number(item.id || 0),
            relatedPoemId: relId,
            relatedPoemTitle: rawTitle,
            relatedPoetName: rawPoet || 'شاعر مرتبط',
            relatedPoemFullUrl: String(item.relatedPoemFullUrl || item.poemFullUrl || item.fullUrl || '').trim(),
            coupletIndex: typeof item.coupletIndex === 'number' ? item.coupletIndex : undefined,
            relatedCoupletIndex: typeof item.relatedCoupletIndex === 'number' ? item.relatedCoupletIndex : undefined,
            coupletVerse1: item.coupletVerse1 ? String(item.coupletVerse1).trim() : undefined,
            coupletVerse2: item.coupletVerse2 ? String(item.coupletVerse2).trim() : undefined,
            relatedCoupletVerse1: item.relatedCoupletVerse1 ? String(item.relatedCoupletVerse1).trim() : undefined,
            relatedCoupletVerse2: item.relatedCoupletVerse2 ? String(item.relatedCoupletVerse2).trim() : undefined,
            note: item.note ? String(item.note).trim() : undefined,
            isPriorToRelated: typeof item.isPriorToRelated === 'boolean' ? item.isPriorToRelated : undefined
          };
        });

      this.memCache.set(poemId, items);

      try {
        await db.baseMeta.put({
          key: `quoteds:${poemId}`,
          data: JSON.parse(JSON.stringify(items)),
          updatedAt: new Date().toISOString()
        });
      } catch (e) {}

      return items;
    } catch (e) {
      return [];
    }
  }
}

export var quotationService = new QuotationService();
