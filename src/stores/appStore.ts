import { defineStore } from 'pinia';
import { ref, computed, watch } from 'vue';
import { getPoemFontOption, preloadPoemFont, preloadAllPoemFonts, type PoemFontId } from '../config/fontConfig';

export type ThemeMode = 'light' | 'dark' | 'system';

export type PoemCollapsibleSectionKey =
  | 'summary'
  | 'vocabulary'
  | 'quotations'
  | 'similarPoems'
  | 'songs'
  | 'literaryDevices'
  | 'peopleLocations'
  | 'rhymeStyleStats';

export interface CollapsibleSectionMeta {
  key: PoemCollapsibleSectionKey;
  label: string;
  group: 'poem' | 'panel';
}

export var COLLAPSIBLE_SECTIONS_META: CollapsibleSectionMeta[] = [
  { key: 'summary', label: 'خلاصه شعر', group: 'poem' },
  { key: 'vocabulary', label: 'واژگان و بسامد کلمات این شعر', group: 'poem' },
  { key: 'quotations', label: 'نقل‌قول‌ها، استقبال‌ها و تضمین‌ها', group: 'poem' },
  { key: 'similarPoems', label: 'اشعار هم‌وزن و هم‌آهنگ با این شعر', group: 'poem' },
  { key: 'songs', label: 'ترانه‌ها و آثار موسیقایی مرتبط', group: 'poem' },
  { key: 'literaryDevices', label: 'تحلیل و آرایه‌های ادبی', group: 'panel' },
  { key: 'peopleLocations', label: 'اشخاص و مکان‌های جغرافیایی شعر', group: 'panel' },
  { key: 'rhymeStyleStats', label: 'آمار تکمیلی قافیه، ردیف و سبک شعر', group: 'panel' }
];

var COLLAPSED_SECTIONS_KEY = 'ghazal-collapsed-sections';

function loadCollapsedSections(): Record<PoemCollapsibleSectionKey, boolean> {
  var defaults: Record<PoemCollapsibleSectionKey, boolean> = {
    summary: false,
    vocabulary: false,
    quotations: false,
    similarPoems: false,
    songs: false,
    literaryDevices: false,
    peopleLocations: false,
    rhymeStyleStats: false
  };

  try {
    var raw = localStorage.getItem(COLLAPSED_SECTIONS_KEY);
    if (!raw) return defaults;
    var parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object') return defaults;

    for (var i = 0; i < COLLAPSIBLE_SECTIONS_META.length; i++) {
      var key = COLLAPSIBLE_SECTIONS_META[i].key;
      if (typeof parsed[key] === 'boolean') {
        defaults[key] = parsed[key];
      }
    }
  } catch (e) {}

  return defaults;
}

export const useAppStore = defineStore('app', () => {
  var urlParams = typeof window !== 'undefined' ? new URLSearchParams(window.location.search) : null;
  var queryTheme = urlParams ? (urlParams.get('theme') as ThemeMode | null) : null;
  var savedTheme = queryTheme || (localStorage.getItem('ghazal-theme') as ThemeMode) || 'system';
  var theme = ref<ThemeMode>(savedTheme);
  var isOnline = ref<boolean>(navigator.onLine);
  var fontSize = ref<number>(Number(localStorage.getItem('ghazal-font-size')) || 20);
  var lineHeight = ref<number>(Number(localStorage.getItem('ghazal-line-height')) || 2.4);
  var savedPoemFont = (localStorage.getItem('ghazal-poem-font') as PoemFontId) || 'vazirmatn';
  var poemFont = ref<PoemFontId>(getPoemFontOption(savedPoemFont).id);
  var poemFontFamily = computed(function () {
    return getPoemFontOption(poemFont.value).cssFamily;
  });
  var readingMode = ref<boolean>(false);
  var showLiteraryTags = ref<boolean>(localStorage.getItem('ghazal-show-literary') !== 'false');
  var showCoupletSummary = ref<boolean>(localStorage.getItem('ghazal-show-summary') !== 'false');
  var showDiacritics = ref<boolean>(localStorage.getItem('ghazal-show-diacritics') !== 'false');
  var showAbjad = ref<boolean>(localStorage.getItem('ghazal-show-abjad') === 'true');
  var wordClickEnabled = ref<boolean>(localStorage.getItem('ghazal-word-click') !== 'false');
  var notificationEnabled = ref<boolean>(localStorage.getItem('ghazal-notif') === 'true');
  var collapsedSections = ref<Record<PoemCollapsibleSectionKey, boolean>>(loadCollapsedSections());

  function persistCollapsedSections(next: Record<PoemCollapsibleSectionKey, boolean>) {
    try {
      localStorage.setItem(COLLAPSED_SECTIONS_KEY, JSON.stringify(next));
    } catch (e) {}
  }

  function isSectionCollapsed(key: PoemCollapsibleSectionKey): boolean {
    return !!collapsedSections.value[key];
  }

  function setSectionCollapsed(key: PoemCollapsibleSectionKey, collapsed: boolean) {
    var next = { ...collapsedSections.value, [key]: collapsed };
    collapsedSections.value = next;
    persistCollapsedSections(next);
  }

  function toggleSectionCollapsed(key: PoemCollapsibleSectionKey) {
    setSectionCollapsed(key, !isSectionCollapsed(key));
  }

  function setAllSectionsCollapsed(collapsed: boolean, group?: 'poem' | 'panel') {
    var next = { ...collapsedSections.value };
    for (var i = 0; i < COLLAPSIBLE_SECTIONS_META.length; i++) {
      var item = COLLAPSIBLE_SECTIONS_META[i];
      if (!group || item.group === group) {
        next[item.key] = collapsed;
      }
    }
    collapsedSections.value = next;
    persistCollapsedSections(next);
  }

  function updateThemeColorMeta(isDark: boolean) {
    if (typeof document === 'undefined') return;
    var themeColor = isDark ? '#13151a' : '#fdfbf7';
    var metas = document.querySelectorAll<HTMLMetaElement>('meta[name="theme-color"]');
    metas.forEach(function (m) {
      m.setAttribute('content', themeColor);
    });
  }

  function applyTheme(newTheme: ThemeMode) {
    theme.value = newTheme;
    localStorage.setItem('ghazal-theme', newTheme);

    var isDark =
      newTheme === 'dark' ||
      (newTheme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);

    if (isDark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }

    updateThemeColorMeta(isDark);
  }

  // گوش دادن به تغییرات تم سیستم
  window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', function (e) {
    if (theme.value === 'system') {
      var isDark = e.matches;
      if (isDark) {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
      updateThemeColorMeta(isDark);
    }
  });

  // وضعیت اتصال شبکه
  window.addEventListener('online', function () { isOnline.value = true; });
  window.addEventListener('offline', function () { isOnline.value = false; });

  watch(fontSize, function (newSize) {
    localStorage.setItem('ghazal-font-size', String(newSize));
  });

  watch(lineHeight, function (newHeight) {
    localStorage.setItem('ghazal-line-height', String(newHeight));
  });

  watch(showLiteraryTags, function (val) {
    localStorage.setItem('ghazal-show-literary', String(val));
  });

  watch(showCoupletSummary, function (val) {
    localStorage.setItem('ghazal-show-summary', String(val));
  });

  watch(poemFont, function (val) {
    localStorage.setItem('ghazal-poem-font', val);
    void preloadPoemFont(val);
  });

  watch(showAbjad, function (val) {
    localStorage.setItem('ghazal-show-abjad', String(val));
  });

  watch(showDiacritics, function (val) {
    localStorage.setItem('ghazal-show-diacritics', String(val));
  });

  watch(wordClickEnabled, function (val) {
    localStorage.setItem('ghazal-word-click', String(val));
  });

  // اعمال اولیه تم و پیش‌بارگذاری فونت منتخب شعر
  applyTheme(savedTheme);
  void preloadPoemFont(poemFont.value);
  if (typeof window !== 'undefined') {
    setTimeout(preloadAllPoemFonts, 1200);
  }

  return {
    theme,
    isOnline,
    fontSize,
    lineHeight,
    poemFont,
    poemFontFamily,
    readingMode,
    showLiteraryTags,
    showCoupletSummary,
    showDiacritics,
    showAbjad,
    wordClickEnabled,
    notificationEnabled,
    collapsedSections,
    isSectionCollapsed,
    setSectionCollapsed,
    toggleSectionCollapsed,
    setAllSectionsCollapsed,
    applyTheme
  };
});
