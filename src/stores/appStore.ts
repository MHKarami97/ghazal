import { defineStore } from 'pinia';
import { ref, watch } from 'vue';

export type ThemeMode = 'light' | 'dark' | 'system';

export const useAppStore = defineStore('app', () => {
  var savedTheme = (localStorage.getItem('ghazal-theme') as ThemeMode) || 'system';
  var theme = ref<ThemeMode>(savedTheme);
  var isOnline = ref<boolean>(navigator.onLine);
  var fontSize = ref<number>(Number(localStorage.getItem('ghazal-font-size')) || 20);
  var lineHeight = ref<number>(Number(localStorage.getItem('ghazal-line-height')) || 2.4);
  var readingMode = ref<boolean>(false);
  var showLiteraryTags = ref<boolean>(localStorage.getItem('ghazal-show-literary') !== 'false');
  var showCoupletSummary = ref<boolean>(localStorage.getItem('ghazal-show-summary') !== 'false');
  var notificationEnabled = ref<boolean>(localStorage.getItem('ghazal-notif') === 'true');

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
  }

  // گوش دادن به تغییرات تم سیستم
  window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', function (e) {
    if (theme.value === 'system') {
      if (e.matches) {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
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

  // اعمال اولیه تم
  applyTheme(savedTheme);

  return {
    theme,
    isOnline,
    fontSize,
    lineHeight,
    readingMode,
    showLiteraryTags,
    showCoupletSummary,
    notificationEnabled,
    applyTheme
  };
});
