import { db } from '../db/GhazalDB';
import { normalizeGanjoorFullUrl } from '../utils/ganjoorPoemMapper';

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

    var cacheKey = `quoteds:v2:${poemId}`;
    try {
      var cached = await db.baseMeta.get(cacheKey);
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
          var isSwapped = Boolean(
            item.relatedPoemId &&
            Number(item.relatedPoemId) === poemId &&
            item.poemId &&
            Number(item.poemId) !== poemId
          );

          var relId = Number(isSwapped ? (item.poemId || 0) : (item.relatedPoemId || 0));
          var rawUrl = isSwapped
            ? String(
                item.poemFullUrl ||
                item.cachedPoemFullUrl ||
                item.poemUrl ||
                item.poem?.fullUrl ||
                item.fullUrl ||
                ''
              )
            : String(
                item.relatedPoemFullUrl ||
                item.cachedRelatedPoemFullUrl ||
                item.relatedPoemUrl ||
                item.relatedPoem?.fullUrl ||
                item.fullUrl ||
                ''
              );

          var rawTitle = isSwapped
            ? String(
                item.poemFullTitle ||
                item.cachedPoemFullTitle ||
                item.poemTitle ||
                item.poem?.fullTitle ||
                item.poem?.title ||
                item.fullTitle ||
                'شعر مرتبط'
              ).trim()
            : String(
                item.relatedPoemFullTitle ||
                item.cachedRelatedPoemFullTitle ||
                item.relatedPoemTitle ||
                item.relatedPoem?.fullTitle ||
                item.relatedPoem?.title ||
                item.fullTitle ||
                'شعر مرتبط'
              ).trim();

          var rawPoet = isSwapped
            ? String(item.poetName || item.cachedPoemPoetName || item.poem?.poet?.name || '').trim()
            : String(item.relatedPoetName || item.cachedRelatedPoemPoetName || item.relatedPoemPoetName || item.relatedPoem?.poet?.name || '').trim();

          if (!rawPoet && rawTitle.indexOf('»') !== -1) {
            rawPoet = rawTitle.split('»')[0].trim();
          }

          var curCouplet = isSwapped ? item.relatedCoupletIndex : item.coupletIndex;
          var relCouplet = isSwapped ? item.coupletIndex : item.relatedCoupletIndex;

          var curV1 = isSwapped ? item.relatedCoupletVerse1 : item.coupletVerse1;
          var curV2 = isSwapped ? item.relatedCoupletVerse2 : item.coupletVerse2;
          var relV1 = isSwapped ? item.coupletVerse1 : item.relatedCoupletVerse1;
          var relV2 = isSwapped ? item.coupletVerse2 : item.relatedCoupletVerse2;

          return {
            id: Number(item.id || 0),
            relatedPoemId: relId,
            relatedPoemTitle: rawTitle,
            relatedPoetName: rawPoet || 'شاعر مرتبط',
            relatedPoemFullUrl: normalizeGanjoorFullUrl(rawUrl),
            coupletIndex: typeof curCouplet === 'number' ? curCouplet : undefined,
            relatedCoupletIndex: typeof relCouplet === 'number' ? relCouplet : undefined,
            coupletVerse1: curV1 ? String(curV1).trim() : undefined,
            coupletVerse2: curV2 ? String(curV2).trim() : undefined,
            relatedCoupletVerse1: relV1 ? String(relV1).trim() : undefined,
            relatedCoupletVerse2: relV2 ? String(relV2).trim() : undefined,
            note: item.note ? String(item.note).trim() : undefined,
            isPriorToRelated: typeof item.isPriorToRelated === 'boolean'
              ? (isSwapped ? !item.isPriorToRelated : item.isPriorToRelated)
              : undefined
          };
        });

      this.memCache.set(poemId, items);

      try {
        await db.baseMeta.put({
          key: cacheKey,
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
