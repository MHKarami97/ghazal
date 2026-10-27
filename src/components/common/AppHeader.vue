<template>
  <header class="sticky top-0 z-30 bg-paper-light/90 dark:bg-paper-dark/90 backdrop-blur-md border-b border-ink-200/60 dark:border-paper-border pt-safe transition-colors">
    <div class="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
      <!-- بخش راست: دکمه بازگشت یا لوگو -->
      <div class="flex items-center gap-3">
        <button
          v-if="showBack"
          @click="goBack"
          class="p-2 rounded-xl text-ink-600 dark:text-ink-300 hover:bg-ink-100 dark:hover:bg-paper-surface transition-colors"
          title="بازگشت"
        >
          <ChevronRight class="w-6 h-6" />
        </button>
        <router-link to="/" class="flex items-center gap-2">
          <div class="w-9 h-9 rounded-xl bg-gradient-to-br from-brand-400 to-brand-600 flex items-center justify-center text-white font-bold text-lg shadow-sm">
            غ
          </div>
          <div>
            <h1 class="text-lg font-bold text-ink-900 dark:text-ink-50 leading-tight">
              {{ title || 'غـــــزل' }}
            </h1>
            <p v-if="subtitle" class="text-xs text-ink-500 dark:text-ink-400">
              {{ subtitle }}
            </p>
          </div>
        </router-link>
      </div>

      <!-- بخش چپ: کنترل‌ها و وضعیت -->
      <div class="flex items-center gap-2">
        <!-- نشانگر آفلاین -->
        <span
          v-if="!appStore.isOnline"
          class="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300"
        >
          <WifiOff class="w-3.5 h-3.5" />
          حالت آفلاین
        </span>

        <!-- جست‌وجو -->
        <router-link
          to="/search"
          class="p-2 rounded-xl text-ink-600 dark:text-ink-300 hover:bg-ink-100 dark:hover:bg-paper-surface transition-colors"
          title="جست‌وجو"
        >
          <Search class="w-5 h-5" />
        </router-link>

        <!-- تغییر تم -->
        <button
          @click="toggleTheme"
          class="p-2 rounded-xl text-ink-600 dark:text-ink-300 hover:bg-ink-100 dark:hover:bg-paper-surface transition-colors"
          :title="themeTitle"
        >
          <Sun v-if="appStore.theme === 'light'" class="w-5 h-5 text-amber-500" />
          <Moon v-else-if="appStore.theme === 'dark'" class="w-5 h-5 text-blue-400" />
          <Laptop v-else class="w-5 h-5" />
        </button>

        <!-- تنظیمات -->
        <router-link
          to="/settings"
          class="p-2 rounded-xl text-ink-600 dark:text-ink-300 hover:bg-ink-100 dark:hover:bg-paper-surface transition-colors"
          title="تنظیمات و بسته‌های داده"
        >
          <Settings class="w-5 h-5" />
        </router-link>
      </div>
    </div>
  </header>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useRouter } from 'vue-router';
import { useAppStore } from '../../stores/appStore';
import {
  ChevronRight,
  Search,
  Sun,
  Moon,
  Laptop,
  Settings,
  WifiOff
} from 'lucide-vue-next';

var props = defineProps<{
  title?: string;
  subtitle?: string;
  showBack?: boolean;
}>();

var router = useRouter();
var appStore = useAppStore();

var themeTitle = computed(function () {
  if (appStore.theme === 'light') return 'تم روشن';
  if (appStore.theme === 'dark') return 'تم تاریک';
  return 'تم خودکار سیستم';
});

function toggleTheme() {
  if (appStore.theme === 'light') {
    appStore.applyTheme('dark');
  } else if (appStore.theme === 'dark') {
    appStore.applyTheme('system');
  } else {
    appStore.applyTheme('light');
  }
}

function goBack() {
  if (window.history.length > 1) {
    router.back();
  } else {
    router.push('/');
  }
}
</script>
