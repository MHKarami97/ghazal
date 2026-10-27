<template>
  <div class="space-y-6">
    <div class="text-center">
      <div class="text-xs font-bold text-brand-600 dark:text-brand-400 mb-1">
        {{ question.poetName }} » {{ question.poemTitle }}
      </div>
      <p class="text-xs text-ink-500 mb-4">
        با لغزنده زیر درصد محوشدن کلمات را افزایش دهید و شعر را در ذهن یا با صدای بلند بخوانید. برای دیدن کلمه مخفی، روی آن کلیک کنید:
      </p>

      <!-- درصد مخفی‌سازی کلمات -->
      <div class="flex items-center justify-center gap-2 mb-6">
        <button
          v-for="lvl in levels"
          :key="lvl"
          @click="currentLevel = lvl"
          class="px-3 py-1.5 rounded-xl text-xs font-bold transition-all border"
          :class="[
            currentLevel === lvl
              ? 'bg-brand-600 border-brand-600 text-white shadow-xs'
              : 'bg-paper-light dark:bg-paper-surface border-ink-200 dark:border-paper-border text-ink-700 dark:text-ink-300 hover:bg-ink-100'
          ]"
        >
          {{ toPersianDigits(lvl) }}٪
        </button>
      </div>
    </div>

    <!-- متن شعر با کلمات مخفی‌شده -->
    <div class="p-6 rounded-2xl bg-paper-warm/80 dark:bg-paper-surface/80 border border-ink-200 dark:border-paper-border text-center space-y-4">
      <!-- مصرع اول -->
      <div class="text-lg sm:text-xl font-medium text-ink-900 dark:text-ink-100 flex flex-wrap justify-center gap-1.5">
        <span
          v-for="(w, idx) in wordsFirst"
          :key="'f-' + idx"
          @click="toggleReveal('f-' + idx)"
          class="cursor-pointer transition-all px-1 rounded-sm"
          :class="[
            isWordHidden('f', idx)
              ? 'bg-ink-300 dark:bg-ink-700 text-transparent select-none hover:bg-ink-400'
              : 'text-ink-900 dark:text-ink-100'
          ]"
        >
          {{ w }}
        </span>
      </div>

      <!-- مصرع دوم -->
      <div class="text-lg sm:text-xl font-medium text-ink-900 dark:text-ink-100 flex flex-wrap justify-center gap-1.5">
        <span
          v-for="(w, idx) in wordsSecond"
          :key="'s-' + idx"
          @click="toggleReveal('s-' + idx)"
          class="cursor-pointer transition-all px-1 rounded-sm"
          :class="[
            isWordHidden('s', idx)
              ? 'bg-ink-300 dark:bg-ink-700 text-transparent select-none hover:bg-ink-400'
              : 'text-ink-900 dark:text-ink-100'
          ]"
        >
          {{ w }}
        </span>
      </div>
    </div>

    <!-- دکمه‌های تایید تسلط -->
    <div class="flex items-center justify-center gap-3">
      <button
        @click="confirmMastery(true)"
        class="py-3 px-6 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm shadow-md transition-colors"
      >
        بیت را کاملاً حفظ شدم
      </button>
      <button
        @click="confirmMastery(false)"
        class="py-3 px-6 rounded-xl border border-ink-200 dark:border-paper-border text-ink-700 dark:text-ink-300 font-bold text-sm hover:bg-ink-100 dark:hover:bg-paper-dark transition-colors"
      >
        نیاز به تکرار بیشتر
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import type { QuizQuestion } from '../../types/quiz';
import { toPersianDigits } from '../../utils/persianNormalizer';

var props = defineProps<{
  question: QuizQuestion;
}>();

var emit = defineEmits(['answered']);

var levels = [0, 30, 60, 100];
var currentLevel = ref<number>(30);
var temporarilyRevealed = ref<Set<string>>(new Set());

var wordsFirst = computed(function () {
  return (props.question.firstMisra || '').split(/\s+/).filter(Boolean);
});

var wordsSecond = computed(function () {
  return (props.question.secondMisra || '').split(/\s+/).filter(Boolean);
});

function isWordHidden(misraKey: 'f' | 's', index: number): boolean {
  var key = `${misraKey}-${index}`;
  if (temporarilyRevealed.value.has(key)) return false;
  if (currentLevel.value === 0) return false;
  if (currentLevel.value === 100) return true;

  // هش قطعی بر اساس ایندکس جهت پنهان‌سازی یکنواخت
  var hash = (index * 7 + (misraKey === 'f' ? 3 : 5)) % 100;
  return hash < currentLevel.value;
}

function toggleReveal(key: string) {
  if (temporarilyRevealed.value.has(key)) {
    temporarilyRevealed.value.delete(key);
  } else {
    temporarilyRevealed.value.add(key);
  }
}

function confirmMastery(success: boolean) {
  emit('answered', { isCorrect: success, answer: 'rehearsed' });
  temporarilyRevealed.value.clear();
  currentLevel.value = 30;
}
</script>
