<template>
  <div class="flex items-center justify-between p-2.5 rounded-2xl bg-paper-warm/80 dark:bg-paper-surface/80 border border-ink-200/80 dark:border-paper-border mb-6 backdrop-blur-xs text-xs">
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

    <!-- دکمه‌های اقدام جانبی -->
    <div class="flex items-center gap-1.5">
      <!-- حالت تمرکز مطالعه -->
      <button
        @click="appStore.readingMode = !appStore.readingMode"
        class="flex items-center gap-1 px-2.5 py-1.5 rounded-xl border border-ink-200 dark:border-paper-border text-ink-700 dark:text-ink-300 hover:bg-ink-100 dark:hover:bg-paper-dark transition-colors"
        :class="{ 'bg-brand-500/10 text-brand-700 dark:text-brand-300 border-brand-500/30': appStore.readingMode }"
        title="حالت مطالعه متمرکز"
      >
        <Maximize2 v-if="!appStore.readingMode" class="w-3.5 h-3.5" />
        <Minimize2 v-else class="w-3.5 h-3.5" />
        <span class="hidden sm:inline">حالت مطالعه</span>
      </button>

      <!-- پنل آرایه‌ها در موبایل -->
      <button
        @click="$emit('toggle-literary-panel')"
        class="flex items-center gap-1 px-2.5 py-1.5 rounded-xl border border-ink-200 dark:border-paper-border text-ink-700 dark:text-ink-300 hover:bg-ink-100 dark:hover:bg-paper-dark transition-colors lg:hidden"
      >
        <Sparkles class="w-3.5 h-3.5 text-brand-600" />
        <span>آرایه‌ها</span>
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useAppStore } from '../../stores/appStore';
import { toPersianDigits } from '../../utils/persianNormalizer';
import { Maximize2, Minimize2, Sparkles } from 'lucide-vue-next';

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
