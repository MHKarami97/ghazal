<template>
  <div class="flex flex-wrap items-center justify-between gap-2 p-2.5 rounded-2xl bg-paper-warm/80 dark:bg-paper-surface/80 border border-ink-200/80 dark:border-paper-border mb-6 backdrop-blur-xs text-xs">
    <!-- کنترل اندازه فونت -->
    <div class="flex items-center gap-1.5">
      <span class="text-ink-500 dark:text-ink-400 font-medium ml-1">اندازه قلم:</span>
      <button
        @click="decreaseFont"
        class="w-7 h-7 rounded-lg border border-ink-200 dark:border-paper-border flex items-center justify-center font-bold text-ink-700 dark:text-ink-300 hover:bg-ink-100 dark:hover:bg-paper-dark"
        title="کوچک‌تر کردن متن"
      >
        -
      </button>
      <span class="w-6 text-center font-bold text-brand-600 dark:text-brand-400">
        {{ toPersianDigits(appStore.fontSize) }}
      </span>
      <button
        @click="increaseFont"
        class="w-7 h-7 rounded-lg border border-ink-200 dark:border-paper-border flex items-center justify-center font-bold text-ink-700 dark:text-ink-300 hover:bg-ink-100 dark:hover:bg-paper-dark"
        title="بزرگ‌تر کردن متن"
      >
        +
      </button>
    </div>

    <!-- دکمه‌های کنترل نمایش آرایه‌ها، مفهوم و حالت مطالعه -->
    <div class="flex flex-wrap items-center gap-1.5">
      <!-- ۱. دکمه نمایش یا مخفی‌سازی آرایه‌های ادبی -->
      <button
        @click="appStore.showLiteraryTags = !appStore.showLiteraryTags"
        class="flex items-center gap-1 px-2.5 py-1.5 rounded-xl border transition-all"
        :class="[
          appStore.showLiteraryTags
            ? 'border-brand-500/40 bg-brand-500/10 text-brand-800 dark:text-brand-300 font-bold'
            : 'border-ink-200 dark:border-paper-border text-ink-500 hover:bg-ink-100 dark:hover:bg-paper-dark'
        ]"
        :title="appStore.showLiteraryTags ? 'مخفی‌سازی خط‌چین‌ها و نشانگر آرایه‌ها' : 'نمایش زیرخط آرایه‌ها روی کلمات'"
      >
        <Sparkles v-if="appStore.showLiteraryTags" class="w-3.5 h-3.5 text-brand-600" />
        <EyeOff v-else class="w-3.5 h-3.5 text-ink-400" />
        <span>{{ appStore.showLiteraryTags ? 'آرایه‌ها روشن' : 'آرایه‌ها خاموش' }}</span>
      </button>

      <!-- ۲. دکمه نمایش یا مخفی‌سازی معنی و مفهوم ابیات -->
      <button
        @click="appStore.showCoupletSummary = !appStore.showCoupletSummary"
        class="flex items-center gap-1 px-2.5 py-1.5 rounded-xl border transition-all"
        :class="[
          appStore.showCoupletSummary
            ? 'border-brand-500/40 bg-brand-500/10 text-brand-800 dark:text-brand-300 font-bold'
            : 'border-ink-200 dark:border-paper-border text-ink-500 hover:bg-ink-100 dark:hover:bg-paper-dark'
        ]"
        :title="appStore.showCoupletSummary ? 'مخفی‌سازی کادرهای شرح و مفهوم زیر بیت‌ها' : 'نمایش شرح و مفهوم زیر ابیات'"
      >
        <BookOpenText v-if="appStore.showCoupletSummary" class="w-3.5 h-3.5 text-brand-600" />
        <FileText v-else class="w-3.5 h-3.5 text-ink-400" />
        <span>{{ appStore.showCoupletSummary ? 'مفهوم بیت روشن' : 'مفهوم بیت خاموش' }}</span>
      </button>

      <!-- ۳. دکمه حالت مطالعه متمرکز -->
      <button
        @click="appStore.readingMode = !appStore.readingMode"
        class="flex items-center gap-1 px-2.5 py-1.5 rounded-xl border transition-all"
        :class="[
          appStore.readingMode
            ? 'bg-brand-600 text-white border-brand-600 font-bold shadow-xs'
            : 'border-ink-200 dark:border-paper-border text-ink-700 dark:text-ink-300 hover:bg-ink-100 dark:hover:bg-paper-dark'
        ]"
        title="حالت مطالعه تمام‌صفحه بدون سایدبار و نوارها"
      >
        <Maximize2 v-if="!appStore.readingMode" class="w-3.5 h-3.5" />
        <Minimize2 v-else class="w-3.5 h-3.5" />
        <span>{{ appStore.readingMode ? 'خروج از مطالعه' : 'حالت مطالعه' }}</span>
      </button>

      <!-- ۴. دکمه باز کردن پنل آرایه‌ها در موبایل -->
      <button
        @click="$emit('toggle-literary-panel')"
        class="flex items-center gap-1 px-2.5 py-1.5 rounded-xl border border-ink-200 dark:border-paper-border text-ink-700 dark:text-ink-300 hover:bg-ink-100 dark:hover:bg-paper-dark transition-colors lg:hidden"
        title="مشاهده پنل جزئیات آرایه‌ها"
      >
        <Sparkles class="w-3.5 h-3.5 text-brand-600" />
        <span class="hidden sm:inline">تحلیل</span>
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useAppStore } from '../../stores/appStore';
import { toPersianDigits } from '../../utils/persianNormalizer';
import {
  Maximize2,
  Minimize2,
  Sparkles,
  EyeOff,
  BookOpenText,
  FileText
} from 'lucide-vue-next';

defineEmits(['toggle-literary-panel']);

var appStore = useAppStore();

function increaseFont() {
  if (appStore.fontSize < 32) {
    appStore.fontSize += 2;
  }
}

function decreaseFont() {
  if (appStore.fontSize > 16) {
    appStore.fontSize -= 2;
  }
}
</script>
