import { defineStore } from 'pinia';
import { ref } from 'vue';
import { db } from '../db/GhazalDB';
import { cdnClient } from '../services/CDNClient';
import type { GanjoorPoem, GanjoorPoet, GanjoorLiteraryTag } from '../types/ganjoor';
import type { UserBookmark } from '../types/user';

var HISTORY_DEDUPE_WINDOW_MS = 10 * 60 * 1000;

export const useReadingStore = defineStore('reading', () => {
  var currentPoem = ref<GanjoorPoem | null>(null);
  var currentPoet = ref<GanjoorPoet | null>(null);
  var bookmarks = ref<UserBookmark[]>([]);
  var activeCoupletIndex = ref<number | null>(null);
  var selectedLiteraryTag = ref<GanjoorLiteraryTag | null>(null);
  var isLoading = ref<boolean>(false);
  var error = ref<string | null>(null);
  var latestLoadId = 0;

  async function recordReadHistory(poem: GanjoorPoem, poetSlug: string) {
    var lastVisit = await db.userHistory
      .where('poemId')
      .equals(poem.Id)
      .and(function (h) { return h.type === 'read'; })
      .last();

    var isRecentRepeat = !!lastVisit && Date.now() - new Date(lastVisit.viewedAt).getTime() < HISTORY_DEDUPE_WINDOW_MS;
    if (isRecentRepeat) return;

    await db.userHistory.add({
      poemId: poem.Id,
      poemTitle: poem.Title,
      poetName: currentPoet.value?.Nickname || poetSlug,
      fullUrl: poem.FullUrl,
      type: 'read',
      viewedAt: new Date().toISOString()
    });
  }

  async function findLocalPoem(poetSlug: string, poemSlug: string, fullUrl: string): Promise<GanjoorPoem | undefined> {
    var exact = await db.poems.where('FullUrl').equals(fullUrl).first();
    if (exact) return exact;

    var prefix = `/${poetSlug}/`;
    return db.poems
      .where('FullUrl')
      .startsWith(prefix)
      .filter(function (p) {
        return p.FullUrl.endsWith(`/${poemSlug}`);
      })
      .first();
  }

  /**
   * بارگذاری شعر. اگر کاربر وسط کار به شعر دیگری برود، نتیجهٔ درخواست قدیمی دور ریخته می‌شود (null).
   */
  async function loadPoem(poetSlug: string, catPath: string, poemSlug: string): Promise<GanjoorPoem | null> {
    var loadId = ++latestLoadId;
    var isStale = function () { return loadId !== latestLoadId; };

    isLoading.value = true;
    error.value = null;

    try {
      var fullUrl = `/${poetSlug}/${catPath ? catPath + '/' : ''}${poemSlug}`.replace(/\/+/g, '/');

      var poem = await findLocalPoem(poetSlug, poemSlug, fullUrl);
      if (!poem) {
        var remotePoem = await cdnClient.getPoem(poetSlug, catPath, poemSlug);
        if (remotePoem) {
          await db.poems.put(JSON.parse(JSON.stringify(remotePoem)));
        }
        poem = remotePoem;
      }
      if (isStale()) return null;

      if (!currentPoet.value || !currentPoet.value.FullUrl.includes(poetSlug)) {
        await loadPoet(poetSlug);
        if (isStale()) return null;
      }

      currentPoem.value = poem || null;

      if (poem) {
        await recordReadHistory(poem, poetSlug);
      }

      await loadBookmarks();
      return isStale() ? null : currentPoem.value;
    } catch (err: any) {
      if (!isStale()) error.value = `خطا در بارگذاری شعر: ${err.message}`;
      return null;
    } finally {
      if (!isStale()) isLoading.value = false;
    }
  }

  async function loadPoet(poetSlug: string): Promise<GanjoorPoet | null> {
    var prefix = `/${poetSlug}`;
    var localPoet = await db.poets.where('FullUrl').equals(prefix).first();
    if (localPoet) {
      currentPoet.value = localPoet;
      return localPoet;
    }

    try {
      var remotePoet = await cdnClient.getPoet(poetSlug);
      currentPoet.value = remotePoet;
      if (remotePoet) {
        await db.poets.put(JSON.parse(JSON.stringify(remotePoet)));
      }
      return remotePoet;
    } catch (e) {
      return null;
    }
  }

  async function loadBookmarks() {
    bookmarks.value = await db.userBookmarks.toArray();
  }

  function isBookmarked(poemId: number, coupletIndex?: number): boolean {
    return bookmarks.value.some(function (b) {
      if (b.poemId !== poemId) return false;
      if (coupletIndex !== undefined && b.coupletIndex !== undefined) {
        return b.coupletIndex === coupletIndex;
      }
      return true;
    });
  }

  async function toggleBookmark(poemId: number, coupletIndex?: number, note?: string) {
    var existing = bookmarks.value.find(function (b) {
      return b.poemId === poemId && (coupletIndex === undefined || b.coupletIndex === coupletIndex);
    });

    if (existing && existing.id) {
      await db.userBookmarks.delete(existing.id);
    } else if (currentPoem.value) {
      await db.userBookmarks.add({
        poemId: poemId,
        coupletIndex: coupletIndex,
        poemTitle: currentPoem.value.Title,
        poetName: currentPoet.value?.Nickname || '',
        fullUrl: currentPoem.value.FullUrl,
        note: note,
        createdAt: new Date().toISOString()
      });
    }

    await loadBookmarks();
  }

  function selectCouplet(index: number | null) {
    activeCoupletIndex.value = index;
  }

  function selectLiteraryTag(tag: GanjoorLiteraryTag | null) {
    selectedLiteraryTag.value = tag;
  }

  return {
    currentPoem,
    currentPoet,
    bookmarks,
    activeCoupletIndex,
    selectedLiteraryTag,
    isLoading,
    error,
    loadPoem,
    loadPoet,
    loadBookmarks,
    isBookmarked,
    toggleBookmark,
    selectCouplet,
    selectLiteraryTag
  };
});
