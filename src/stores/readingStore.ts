import { defineStore } from 'pinia';
import { ref } from 'vue';
import { db } from '../db/GhazalDB';
import { cdnClient } from '../services/CDNClient';
import type { GanjoorPoem, GanjoorPoet, GanjoorLiteraryTag } from '../types/ganjoor';
import type { UserBookmark } from '../types/user';

export const useReadingStore = defineStore('reading', () => {
  var currentPoem = ref<GanjoorPoem | null>(null);
  var currentPoet = ref<GanjoorPoet | null>(null);
  var bookmarks = ref<UserBookmark[]>([]);
  var activeCoupletIndex = ref<number | null>(null);
  var selectedLiteraryTag = ref<GanjoorLiteraryTag | null>(null);
  var isLoading = ref<boolean>(false);
  var error = ref<string | null>(null);

  async function loadPoem(poetSlug: string, catPath: string, poemSlug: string): Promise<GanjoorPoem | null> {
    isLoading.value = true;
    error.value = null;

    try {
      var fullUrl = `/${poetSlug}/${catPath ? catPath + '/' : ''}${poemSlug}`.replace(/\/+/g, '/');

      // ۱. ابتدا جست‌وجو در IndexedDB محلی
      var localPoem = await db.poems.where('FullUrl').equals(fullUrl).first();
      if (!localPoem) {
        // جست‌وجو با تطبیق دقیق اسلاگ
        var all = await db.poems.toArray();
        localPoem = all.find(function (p) {
          return p.FullUrl.endsWith(`/${poemSlug}`);
        });
      }

      if (localPoem) {
        currentPoem.value = localPoem;
      } else {
        // ۲. دریافت Lazy از CDN و ذخیره در دیتابیس
        var remotePoem = await cdnClient.getPoem(poetSlug, catPath, poemSlug);
        currentPoem.value = remotePoem;
        await db.poems.put(remotePoem);
      }

      // بارگذاری بیوگرافی شاعر در صورت عدم وجود
      if (!currentPoet.value || !currentPoet.value.FullUrl.includes(poetSlug)) {
        await loadPoet(poetSlug);
      }

      // ثبت در تاریخچه مطالعه
      if (currentPoem.value) {
        await db.userHistory.add({
          poemId: currentPoem.value.Id,
          poemTitle: currentPoem.value.Title,
          poetName: currentPoet.value?.Nickname || poetSlug,
          fullUrl: currentPoem.value.FullUrl,
          type: 'read',
          viewedAt: new Date().toISOString()
        });
      }

      await loadBookmarks();
      return currentPoem.value;
    } catch (err: any) {
      error.value = `خطا در بارگذاری شعر: ${err.message}`;
      return null;
    } finally {
      isLoading.value = false;
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
      await db.poets.put(remotePoet);
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
