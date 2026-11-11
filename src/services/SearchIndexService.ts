import { db } from '../db/GhazalDB';
import type { GanjoorPoem } from '../types/ganjoor';
import { getPoemMetreRhythm } from '../utils/formatters';

export interface SearchResultItem {
  id: number;
  poemId: number;
  poetId: number;
  poetName: string;
  poemTitle: string;
  fullUrl?: string;
  coupletIndex: number;
  verseText: string;
  rhythm?: string;
  rhyme?: string;
  highlightQuery?: string;
  source?: 'local' | 'online';
}

interface SearchOptions {
  poetId?: number;
  rhythm?: string;
  rhyme?: string;
  limit?: number;
}

var INIT_PAGE_SIZE = 200;
var SEARCH_TIMEOUT_MS = 5000;
var VERSE_ID_FACTOR = 100000;

export class SearchIndexService {
  private worker: Worker | null = null;
  private pendingSearches: Map<number, (results: SearchResultItem[]) => void> = new Map();
  private nextRequestId = 1;
  private initPromise: Promise<void> | null = null;

  constructor() {
    this.initWorker();
  }

  private initWorker() {
    try {
      this.worker = new Worker(
        new URL('../workers/search.worker.ts', import.meta.url),
        { type: 'module' }
      );

      this.worker.onmessage = (e) => {
        var msg = e.data;
        if (msg.type !== 'search_results') return;

        var resolve = this.pendingSearches.get(msg.requestId);
        if (resolve) {
          this.pendingSearches.delete(msg.requestId);
          resolve(msg.results);
        }
      };
    } catch (err) {
      console.error('Failed to initialize search worker:', err);
    }
  }

  /**
   * ایندکس‌کردن کل اشعار ذخیره‌شده؛ صفحه‌به‌صفحه تا کل جدول یک‌جا در حافظه نیاید.
   * ایندکس در worker بر اساس کلید (شعر + مصرع) یکتا می‌شود، پس فراخوانی مجدد تکرار نمی‌سازد.
   */
  initializeFromDB(): Promise<void> {
    if (!this.initPromise) {
      var self = this;
      this.initPromise = this.indexAllPoems().catch(function (err) {
        self.initPromise = null;
        throw err;
      });
    }
    return this.initPromise;
  }

  private async indexAllPoems(): Promise<void> {
    var lastId = Number.NEGATIVE_INFINITY;
    while (true) {
      var page = await db.poems.where('Id').above(lastId).limit(INIT_PAGE_SIZE).toArray();
      if (page.length === 0) return;
      await this.indexPoems(page);
      lastId = page[page.length - 1].Id;
    }
  }

  async indexPoems(poems: GanjoorPoem[]): Promise<void> {
    if (!this.worker) this.initWorker();
    var items: any[] = [];

    for (var i = 0; i < poems.length; i++) {
      var poem = poems[i];
      if (!poem.Verses || !poem.Verses.length) continue;

      var poetName = poem.FullTitle?.split('»')?.[0]?.trim() || '';
      var rhythm = getPoemMetreRhythm(poem);

      for (var v = 0; v < poem.Verses.length; v++) {
        var verse = poem.Verses[v];
        items.push({
          key: `${poem.Id}:${verse.VOrder}`,
          id: poem.Id * VERSE_ID_FACTOR + verse.VOrder,
          poemId: poem.Id,
          poetId: poem.PoetId || 0,
          poetName: poetName,
          poemTitle: poem.Title,
          fullUrl: poem.FullUrl,
          coupletIndex: verse.CoupletIndex,
          verseText: verse.Text,
          rhythm: rhythm,
          rhyme: poem.RhymeLetters || ''
        });
      }
    }

    if (items.length > 0) {
      this.worker?.postMessage({ action: 'index_batch', items: items });
    }
  }

  removePoems(poemIds: number[]): void {
    if (poemIds.length === 0) return;
    this.worker?.postMessage({ action: 'remove_poems', poemIds: poemIds });
  }

  search(query: string, options?: SearchOptions): Promise<SearchResultItem[]> {
    return new Promise((resolve) => {
      if (!this.worker) this.initWorker();

      var requestId = this.nextRequestId++;
      var timer = setTimeout(() => {
        if (this.pendingSearches.delete(requestId)) resolve([]);
      }, SEARCH_TIMEOUT_MS);

      this.pendingSearches.set(requestId, function (results) {
        clearTimeout(timer);
        resolve(results);
      });

      this.worker?.postMessage({
        action: 'search',
        requestId: requestId,
        query: query,
        poetId: options?.poetId,
        rhythm: options?.rhythm,
        rhyme: options?.rhyme,
        limit: options?.limit || 50
      });
    });
  }
}

export const searchIndexService = new SearchIndexService();
