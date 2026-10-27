import Dexie, { type Table } from 'dexie';
import type {
  GanjoorPoet,
  GanjoorCategory,
  GanjoorPoem,
} from '../types/ganjoor';
import type {
  DataPackage,
  UserBookmark,
  UserHistoryItem,
  MemorizeDeck,
  MemorizeCard
} from '../types/user';

export interface VerseIndexRecord {
  id?: number;
  poemId: number;
  poetId: number;
  coupletIndex: number;
  text: string;
  normalizedText: string;
}

export interface BaseMetaRecord {
  key: string;
  data: any;
  updatedAt: string;
}

export class GhazalDB extends Dexie {
  packages!: Table<DataPackage, string>;
  poets!: Table<GanjoorPoet, number>;
  categories!: Table<GanjoorCategory, number>;
  poems!: Table<GanjoorPoem, number>;
  verseIndex!: Table<VerseIndexRecord, number>;
  userBookmarks!: Table<UserBookmark, number>;
  userHistory!: Table<UserHistoryItem, number>;
  memorizeDecks!: Table<MemorizeDeck, number>;
  memorizeCards!: Table<MemorizeCard, number>;
  baseMeta!: Table<BaseMetaRecord, string>;

  constructor() {
    super('GhazalPoetryDB');

    this.version(1).stores({
      packages: 'id, type, slug, title, status, commitSha',
      poets: 'Id, Nickname, FullUrl',
      categories: 'Id, PoetId, Title, FullUrl',
      poems: 'Id, CatId, PoetId, FullUrl, Rhythm',
      verseIndex: '++id, poemId, poetId, coupletIndex, normalizedText',
      userBookmarks: '++id, poemId, coupletIndex, createdAt',
      userHistory: '++id, poemId, viewedAt, type',
      memorizeDecks: '++id, title, createdAt',
      memorizeCards: '++id, deckId, poemId, coupletIndex, dueDate, status',
      baseMeta: 'key'
    });
  }

  /**
   * درخواست فعال‌سازی Persistent Storage از مرورگر
   */
  async requestPersistence(): Promise<boolean> {
    if (navigator.storage && navigator.storage.persist) {
      var isPersisted = await navigator.storage.persisted();
      if (!isPersisted) {
        return await navigator.storage.persist();
      }
      return true;
    }
    return false;
  }

  /**
   * برآورد فضای مصرف‌شده توسط IndexedDB
   */
  async estimateStorage(): Promise<{ usage: number; quota: number }> {
    if (navigator.storage && navigator.storage.estimate) {
      var est = await navigator.storage.estimate();
      return {
        usage: est.usage || 0,
        quota: est.quota || 0
      };
    }
    return { usage: 0, quota: 0 };
  }
}

export const db = new GhazalDB();
