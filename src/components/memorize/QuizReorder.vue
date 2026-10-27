<template>
  <div class="space-y-6">
    <div class="text-center">
      <div class="text-xs font-bold text-brand-600 dark:text-brand-400 mb-1">
        {{ question.poetName }} » {{ question.poemTitle }}
      </div>
      <p class="text-sm text-ink-600 dark:text-ink-400">
        کلمات را به ترتیب صحیح لمس کنید تا بیت کامل شود:
      </p>
    </div>

    <!-- جایگاه ساخت بیت مرتب‌شده -->
    <div class="min-h-[90px] p-4 rounded-2xl bg-paper-warm/80 dark:bg-paper-surface/80 border-2 border-dashed border-brand-500/40 flex flex-wrap gap-2 items-center justify-center">
      <span
        v-for="(word, idx) in selectedWords"
        :key="'s-' + idx"
        @click="returnWord(idx)"
        class="px-3 py-1.5 rounded-xl bg-brand-600 text-white font-medium text-sm cursor-pointer shadow-xs hover:bg-brand-700 transition-transform active:scale-95"
      >
        {{ word }}
      </span>
      <span v-if="selectedWords.length === 0" class="text-xs text-ink-400 italic">
        کلمات از کادر پایین انتخاب می‌شوند...
      </span>
    </div>

    <!-- استخر کلمات درهم‌ریخته -->
    <div class="flex flex-wrap gap-2.5 justify-center p-4 rounded-2xl bg-paper-light dark:bg-paper-dark border border-ink-200 dark:border-paper-border">
      <button
        v-for="(word, idx) in availableWords"
        :key="'a-' + idx"
        @click="pickWord(idx)"
        class="px-3.5 py-2 rounded-xl bg-ink-100 dark:bg-paper-surface hover:bg-brand-500/10 text-ink-800 dark:text-ink-200 font-medium text-sm border border-ink-200/80 dark:border-paper-border transition-all active:scale-95"
      >
        {{ word }}
      </button>
    </div>

    <!-- دکمه تایید پاسخ -->
    <div class="flex justify-center">
      <button
        @click="checkAnswer"
        :disabled="availableWords.length > 0"
        class="py-3 px-8 rounded-xl font-bold text-sm text-white shadow-md transition-all"
        :class="[
          availableWords.length === 0
            ? 'bg-brand-600 hover:bg-brand-700'
            : 'bg-ink-300 dark:bg-ink-700 cursor-not-allowed opacity-60'
        ]"
      >
        بررسی ترتیب کلمات
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue';
import type { QuizQuestion } from '../../types/quiz';
import { normalizePersian } from '../../utils/persianNormalizer';

var props = defineProps<{
  question: QuizQuestion;
}>();

var emit = defineEmits(['answered']);

var availableWords = ref<string[]>([]);
var selectedWords = ref<string[]>([]);

watch(
  () => props.question,
  function (newQ) {
    availableWords.value = [...(newQ.scrambledItems || [])];
    selectedWords.value = [];
  },
  { immediate: true }
);

function pickWord(index: number) {
  var word = availableWords.value.splice(index, 1)[0];
  selectedWords.value.push(word);
}

function returnWord(index: number) {
  var word = selectedWords.value.splice(index, 1)[0];
  availableWords.value.push(word);
}

function checkAnswer() {
  var userSentence = selectedWords.value.join(' ');
  var normUser = normalizePersian(userSentence, true);
  var normTarget = normalizePersian(props.question.answer, true);

  var isCorrect = normUser === normTarget;
  emit('answered', { isCorrect: isCorrect, answer: userSentence });
}
</script>
