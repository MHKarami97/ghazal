import { db } from '../db/GhazalDB';
import type { GanjoorPoem } from '../types/ganjoor';
import { getPoemMetreRhythm } from '../utils/formatters';

export interface SearchResultItem {
  id: number;
  poemId: number;
  poetId: number;
  poetName: string;
  poemTitle: string;
  coupletIndex: number;
  verseText: string;
  rhythm?: string;
  rhyme?: string;
  highlightQuery?: string;
}

export class SearchIndexService {
  private worker: Worker | null = null;
  private pendingSearches: Map<string, (results: SearchResultItem[]) => void> = new Map();
  private isInitialized = false;

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
        if (msg.type === 'search_results') {
          var query = msg.query;
          var cb = this.pendingSearches.get(query);
          if (cb) {
            cb(msg.results);
            this.pendingSearches.delete(query);
          }
        }
      };
    } catch (err) {
      console.error('Failed to initialize search worker:', err);
    }
  }

  async initializeFromDB(): Promise<void> {
    if (this.isInitialized) return;
    var allPoems = await db.poems.toArray();
    await this.indexPoems(allPoems);
    this.isInitialized = true;
  }

  async indexPoems(poems: GanjoorPoem[]): Promise<void> {
    if (!this.worker) this.initWorker();
    var items: any[] = [];

    for (var i = 0; i < poems.length; i++) {
      var poem = poems[i];
      var poetName = poem.FullTitle?.split('»')?.[0]?.trim() || '';

      if (poem.Verses && poem.Verses.length) {
        for (var v = 0; v < poem.Verses.length; v++) {
          var verse = poem.Verses[v];
          items.push({
            id: Number(`${poem.Id}${verse.VOrder}`),
            poemId: poem.Id,
            poetId: poem.PoetId || 0,
            poetName: poetName,
            poemTitle: poem.Title,
            coupletIndex: verse.CoupletIndex,
            verseText: verse.Text,
            rhythm: getPoemMetreRhythm(poem),
            rhyme: poem.RhymeLetters || ''
          });
        }
      }
    }

    if (items.length > 0) {
      this.worker?.postMessage({
        action: 'index_batch',
        items: items
      });
    }
  }

  search(
    query: string,
    options?: { poetId?: number; rhythm?: string; rhyme?: string; limit?: number }
  ): Promise<SearchResultItem[]> {
    return new Promise((resolve) => {
      if (!this.worker) this.initWorker();

      this.pendingSearches.set(query, resolve);
      this.worker?.postMessage({
        action: 'search',
        query: query,
        poetId: options?.poetId,
        rhythm: options?.rhythm,
        rhyme: options?.rhyme,
        limit: options?.limit || 50
      });

      // مهلت زمانی اضطراری
      setTimeout(() => {
        if (this.pendingSearches.has(query)) {
          this.pendingSearches.delete(query);
          resolve([]);
        }
      }, 5000);
    });
  }
}

export const searchIndexService = new SearchIndexService();
