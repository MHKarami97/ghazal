import { defineStore } from 'pinia';
import { ref } from 'vue';
import { db } from '../db/GhazalDB';
import { cdnClient } from '../services/CDNClient';
import { mapApiPoemToGanjoorPoem } from '../utils/ganjoorPoemMapper';
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

  // --- وضعیت همگام‌سازی صوت شعر (Audio Sync) ---
  var isAudioPlaying = ref<boolean>(false);
  var hasAudioSync = ref<boolean>(false);
  var activeAudioCoupletIndex = ref<number | null>(null);
  var activeAudioMisra = ref<1 | 2 | null>(null); // 1: راست، 2: چپ
  var activeAudioWordIndex = ref<number | null>(null);
  var activeAudioVerseOrder = ref<number | null>(null);
  var autoScrollAudio = ref<boolean>(true);
  var wordHighlightAudio = ref<boolean>(true);
  var seekCoupletRequest = ref<number | null>(null);

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

  async function fetchPoemFallbackFromApi(fullUrl: string): Promise<GanjoorPoem | null> {
    var cleanKey = fullUrl.replace(/^\/+/, '');
    try {
      var cached = await db.baseMeta.get(`poem-api:${cleanKey}`);
      if (cached && cached.data && cached.data.Id) {
        return cached.data as GanjoorPoem;
      }
    } catch (e) {}

    try {
      var controller = new AbortController();
      var timeoutId = setTimeout(function () {
        controller.abort();
      }, 6000);

      var apiUrl = `https://api.ganjoor.net/api/ganjoor/poem?url=${encodeURIComponent(fullUrl)}&catInfo=true&catPoems=false&rhymes=true&recitations=false&images=false&songs=false&comments=false&navigation=false`;
      var res = await fetch(apiUrl, {
        headers: { 'Accept': 'application/json' },
        signal: controller.signal
      });
      clearTimeout(timeoutId);

      if (!res.ok) return null;
      var raw = await res.json();
      return mapApiPoemToGanjoorPoem(raw);
    } catch (e) {
      return null;
    }
  }

  /**
   * بارگذاری شعر. اگر کاربر وسط کار به شعر دیگری برود، نتیجه درخواست قدیمی دور ریخته می‌شود (null).
   */
  async function loadPoem(poetSlug: string, catPath: string, poemSlug: string): Promise<GanjoorPoem | null> {
    var loadId = ++latestLoadId;
    var isStale = function () { return loadId !== latestLoadId; };

    isLoading.value = true;
    error.value = null;
    resetAudioPlaybackState();

    try {
      var fullUrl = `/${poetSlug}/${catPath ? catPath + '/' : ''}${poemSlug}`.replace(/\/+/g, '/');

      var poem = await findLocalPoem(poetSlug, poemSlug, fullUrl);
      if (!poem) {
        var remotePoem: GanjoorPoem | null = null;
        try {
          remotePoem = await cdnClient.getPoem(poetSlug, catPath, poemSlug);
        } catch (cdnErr) {
          remotePoem = null;
        }

        if (!remotePoem) {
          remotePoem = await fetchPoemFallbackFromApi(fullUrl);
        }

        if (remotePoem) {
          await db.poems.put(JSON.parse(JSON.stringify(remotePoem)));
          poem = remotePoem;
        }
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

  function setAudioPlaybackState(state: {
    isPlaying: boolean;
    hasSync: boolean;
    coupletIndex: number | null;
    misra: 1 | 2 | null;
    wordIndex: number | null;
    verseOrder: number | null;
  }) {
    isAudioPlaying.value = state.isPlaying;
    hasAudioSync.value = state.hasSync;
    activeAudioCoupletIndex.value = state.coupletIndex;
    activeAudioMisra.value = state.misra;
    activeAudioWordIndex.value = state.wordIndex;
    activeAudioVerseOrder.value = state.verseOrder;
  }

  function resetAudioPlaybackState() {
    isAudioPlaying.value = false;
    hasAudioSync.value = false;
    activeAudioCoupletIndex.value = null;
    activeAudioMisra.value = null;
    activeAudioWordIndex.value = null;
    activeAudioVerseOrder.value = null;
  }

  function requestSeekToCouplet(coupletIndex: number) {
    seekCoupletRequest.value = coupletIndex;
  }

  function clearSeekCoupletRequest() {
    seekCoupletRequest.value = null;
  }

  function toggleAutoScrollAudio() {
    autoScrollAudio.value = !autoScrollAudio.value;
  }

  function toggleWordHighlightAudio() {
    wordHighlightAudio.value = !wordHighlightAudio.value;
  }

  return {
    currentPoem,
    currentPoet,
    bookmarks,
    activeCoupletIndex,
    selectedLiteraryTag,
    isLoading,
    error,
    isAudioPlaying,
    hasAudioSync,
    activeAudioCoupletIndex,
    activeAudioMisra,
    activeAudioWordIndex,
    activeAudioVerseOrder,
    autoScrollAudio,
    wordHighlightAudio,
    seekCoupletRequest,
    loadPoem,
    loadPoet,
    loadBookmarks,
    isBookmarked,
    toggleBookmark,
    selectCouplet,
    selectLiteraryTag,
    setAudioPlaybackState,
    resetAudioPlaybackState,
    requestSeekToCouplet,
    clearSeekCoupletRequest,
    toggleAutoScrollAudio,
    toggleWordHighlightAudio
  };
});
