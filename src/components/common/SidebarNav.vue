<template>
  <aside class="hidden md:flex flex-col w-64 h-screen sticky top-0 bg-paper-warm/70 dark:bg-paper-surface/60 backdrop-blur-md border-l border-ink-200/60 dark:border-paper-border p-4 transition-colors">
    <!-- نشان و نام برند -->
    <div class="flex items-center gap-3 px-2 py-4 mb-4">
      <div class="w-10 h-10 rounded-2xl bg-gradient-to-br from-brand-500 to-brand-700 flex items-center justify-center text-white font-bold text-xl shadow-md shadow-brand-500/20">
        غ
      </div>
      <div>
        <h2 class="text-xl font-black text-ink-900 dark:text-ink-50 tracking-tight">
          غـــــزل
        </h2>
        <p class="text-xs text-ink-500 dark:text-ink-400">
          گنجینه و آموزش شعر پارسی
        </p>
      </div>
    </div>

    <!-- پیوندهای اصلی ناوبری -->
    <nav class="flex-1 space-y-1.5 overflow-y-auto">
      <router-link
        v-for="item in navLinks"
        :key="item.path"
        :to="item.path"
        class="flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all"
        :class="[
          $route.path === item.path || ($route.path.startsWith(item.path) && item.path !== '/')
            ? 'bg-brand-500/10 text-brand-700 dark:text-brand-300 font-bold shadow-xs'
            : 'text-ink-600 dark:text-ink-400 hover:bg-ink-100 dark:hover:bg-paper-dark/50 hover:text-ink-900 dark:hover:text-ink-200'
        ]"
      >
        <component :is="item.icon" class="w-5 h-5 flex-shrink-0" />
        <span>{{ item.label }}</span>
        <span
          v-if="item.badge"
          class="mr-auto text-[10px] px-1.5 py-0.5 rounded-full font-bold bg-brand-500 text-white"
        >
          {{ item.badge }}
        </span>
      </router-link>
    </nav>

    <!-- کارت حافظه و وضعیت بسته‌ها در انتهای سایدبار -->
    <div class="mt-auto pt-4 border-t border-ink-200/60 dark:border-paper-border">
      <router-link
        to="/settings"
        class="block p-3 rounded-xl bg-paper-light dark:bg-paper-dark border border-ink-200/60 dark:border-paper-border hover:border-brand-500/40 transition-colors"
      >
        <div class="flex items-center justify-between text-xs mb-1.5">
          <span class="text-ink-500 dark:text-ink-400">بسته‌های آفلاین</span>
          <span class="font-bold text-brand-600 dark:text-brand-400">
            {{ toPersianDigits(dataStore.installedPackages.length) }} بسته
          </span>
        </div>
        <div class="w-full bg-ink-200 dark:bg-ink-800 h-1.5 rounded-full overflow-hidden">
          <div
            class="bg-brand-500 h-full rounded-full transition-all duration-500"
            :style="{ width: dataStore.installedPackages.length > 0 ? '60%' : '5%' }"
          ></div>
        </div>
      </router-link>
    </div>
  </aside>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useDataStore } from '../../stores/dataStore';
import { useMemorizeStore } from '../../stores/memorizeStore';
import { toPersianDigits } from '../../utils/persianNormalizer';
import {
  Home,
  BookOpen,
  Search,
  Sparkles,
  Brain,
  Compass,
  Bookmark,
  Settings
} from 'lucide-vue-next';

var dataStore = useDataStore();
var memorizeStore = useMemorizeStore();

var dueCount = computed(function () {
  return memorizeStore.dueCards.length > 0
    ? toPersianDigits(memorizeStore.dueCards.length)
    : undefined;
});

var navLinks = computed(function () {
  return [
    { label: 'خانه', path: '/', icon: Home },
    { label: 'شاعران و دیوان‌ها', path: '/poets', icon: BookOpen },
    { label: 'جست‌وجوی شعر', path: '/search', icon: Search },
    { label: 'فال حافظ', path: '/faal', icon: Sparkles },
    { label: 'حفظ شعر و آزمون', path: '/memorize', icon: Brain, badge: dueCount.value },
    { label: 'آموزش و آرایه‌ها', path: '/education', icon: Bookmark },
    { label: 'کاوش و تبارشناسی', path: '/explore', icon: Compass },
    { label: 'تنظیمات و داده‌ها', path: '/settings', icon: Settings }
  ];
});
</script>
