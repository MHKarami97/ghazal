import { db } from '../db/GhazalDB';
import type { CachedStatRecord } from '../types/user';

export class CachedComputeService {
  private memoryCache = new Map<string, any>();

  /**
   * دریافت نتیجه از کش یا محاسبه یکباره و ذخیره در IndexedDB
   * جهت حذف هرگونه سربار پردازشی مجدد برای کاربر
   */
  async getOrCompute<T>(
    key: string,
    computeFn: () => Promise<T>,
    ttlMs: number = 7 * 24 * 60 * 60 * 1000 // پیش‌فرض ۷ روز
  ): Promise<T> {
    // ۱. بررسی کش در حافظه (زیر ۱ میلی‌ثانیه)
    if (this.memoryCache.has(key)) {
      return this.memoryCache.get(key) as T;
    }

    try {
      // ۲. بررسی در IndexedDB
      var record = await db.cachedStats.get(key);
      if (record) {
        var now = Date.now();
        var cachedTime = new Date(record.cachedAt).getTime();
        if (now - cachedTime < ttlMs) {
          this.memoryCache.set(key, record.data);
          return record.data as T;
        }
      }
    } catch (e) {
      console.warn('Cache read error for key:', key, e);
    }

    // ۳. محاسبه یکباره نتیجه
    var result = await computeFn();

    // ۴. ذخیره در حافظه و IndexedDB
    this.memoryCache.set(key, result);
    try {
      var safeData = JSON.parse(JSON.stringify(result));
      await db.cachedStats.put({
        key: key,
        data: safeData,
        cachedAt: new Date().toISOString()
      });
    } catch (e) {
      console.warn('Cache write error for key:', key, e);
    }

    return result;
  }

  async invalidate(keyPrefix: string): Promise<void> {
    this.memoryCache.clear();
    try {
      var keys = await db.cachedStats.toCollection().primaryKeys();
      var toDelete = keys.filter(function (k) { return String(k).startsWith(keyPrefix); });
      await db.cachedStats.bulkDelete(toDelete as string[]);
    } catch (e) {
      console.warn('Cache invalidation error:', e);
    }
  }

  async clearAll(): Promise<void> {
    this.memoryCache.clear();
    await db.cachedStats.clear();
  }
}

export const cachedCompute = new CachedComputeService();
