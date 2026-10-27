<template>
  <div class="space-y-6">
    <div class="text-center p-6 rounded-2xl bg-paper-warm/70 dark:bg-paper-surface/60 border border-ink-200 dark:border-paper-border">
      <div class="text-xs font-bold text-brand-600 dark:text-brand-400 mb-2">
        آزمون تشخیص آرایه‌های ادبی
      </div>
      <div class="text-sm text-ink-500 mb-2">
        در بیت زیر کدام آرایه بلاغی به کار رفته است؟
      </div>
      <div class="text-lg sm:text-xl font-bold text-ink-900 dark:text-ink-50 leading-loose mb-3">
        « {{ question.fullCouplet }} »
      </div>
    </div>

    <!-- چهار گزینه آرایه -->
    <div class="grid grid-cols-2 gap-3">
      <button
        v-for="(opt, idx) in question.options"
        :key="idx"
        @click="selectOption(opt)"
        :disabled="selectedOption !== null"
        class="p-4 rounded-xl text-base font-bold transition-all border text-center shadow-xs"
        :class="[
          selectedOption === null
            ? 'bg-paper-light dark:bg-paper-surface hover:border-brand-500 hover:bg-brand-50/50 border-ink-200 dark:border-paper-border text-ink-800 dark:text-ink-100'
            : opt === question.answer
              ? 'bg-emerald-500/15 border-emerald-500 text-emerald-800 dark:text-emerald-300 ring-2 ring-emerald-500/20'
              : selectedOption === opt
                ? 'bg-rose-500/15 border-rose-500 text-rose-800 dark:text-rose-300'
                : 'opacity-40 border-ink-200 dark:border-paper-border'
        ]"
      >
        {{ opt }}
      </button>
    </div>

    <!-- توضیح آموزشی پس از پاسخ -->
    <div
      v-if="selectedOption && question.literaryExplanation"
      class="p-4 rounded-xl bg-brand-50 dark:bg-brand-950/20 border border-brand-500/30 text-xs text-ink-700 dark:text-ink-300 leading-relaxed"
    >
      <div class="font-bold text-brand-700 dark:text-brand-300 mb-1">
        توضیح آرایه {{ question.answer }}:
      </div>
      <div>{{ question.literaryExplanation }}</div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import type { QuizQuestion } from '../../types/quiz';

var props = defineProps<{
  question: QuizQuestion;
}>();

var emit = defineEmits(['answered']);
var selectedOption = ref<string | null>(null);

function selectOption(opt: string) {
  if (selectedOption.value !== null) return;
  selectedOption.value = opt;
  var isCorrect = opt === props.question.answer;
  setTimeout(function () {
    emit('answered', { isCorrect: isCorrect, answer: opt });
    selectedOption.value = null;
  }, 1800);
}
</script>
