<template>
  <div class="space-y-6">
    <div class="text-center p-6 rounded-2xl bg-paper-warm/70 dark:bg-paper-surface/60 border border-ink-200 dark:border-paper-border">
      <div class="text-xs font-bold text-brand-600 dark:text-brand-400 mb-2">
        {{ question.poetName }} » {{ question.poemTitle }}
      </div>
      <div class="text-sm text-ink-600 dark:text-ink-400 mb-2 whitespace-pre-line leading-relaxed font-bold">
        {{ question.prompt }}
      </div>
      <div v-if="question.firstMisra && question.secondMisra && !question.prompt.includes(question.firstMisra)" class="text-lg sm:text-xl font-bold text-ink-900 dark:text-ink-50 leading-relaxed mt-2">
        « {{ question.firstMisra }} / {{ question.secondMisra }} »
      </div>
    </div>

    <!-- گزینه‌ها برای مصرع دوم -->
    <div class="space-y-3">
      <button
        v-for="(opt, idx) in question.options"
        :key="idx"
        @click="selectOption(opt)"
        :disabled="selectedOption !== null"
        class="w-full p-4 rounded-xl text-right font-medium text-base transition-all border shadow-xs"
        :class="[
          selectedOption === null
            ? 'bg-paper-light dark:bg-paper-surface hover:border-brand-500 hover:bg-brand-50/40 border-ink-200 dark:border-paper-border text-ink-900 dark:text-ink-100'
            : opt === question.answer
              ? 'bg-emerald-500/15 border-emerald-500 text-emerald-800 dark:text-emerald-300 ring-2 ring-emerald-500/20'
              : selectedOption === opt
                ? 'bg-rose-500/15 border-rose-500 text-rose-800 dark:text-rose-300'
                : 'opacity-40 border-ink-200 dark:border-paper-border'
        ]"
      >
        <span class="inline-block w-6 text-brand-600 dark:text-brand-400 font-bold ml-2">
          {{ ['الف', 'ب', 'ج', 'د'][idx] }})
        </span>
        {{ opt }}
      </button>
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
  }, 1000);
}
</script>
