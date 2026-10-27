<template>
  <div class="space-y-6">
    <div class="text-center p-6 rounded-2xl bg-paper-warm/70 dark:bg-paper-surface/60 border border-ink-200 dark:border-paper-border">
      <div class="text-xs font-bold text-brand-600 dark:text-brand-400 mb-2">
        {{ question.poetName }} » {{ question.poemTitle }}
      </div>
      <div class="text-sm text-ink-500 mb-2">
        مصرع نخست:
      </div>
      <div class="text-xl sm:text-2xl font-bold text-ink-900 dark:text-ink-50 leading-relaxed mb-4">
        « {{ question.firstMisra }} »
      </div>
      <p class="text-xs text-ink-500">
        مصرع دوم را از حفظ تایپ کنید (خطاهای جزئی املایی و فاصله‌گذاری نادیده گرفته می‌شوند):
      </p>
    </div>

    <!-- ورودی تایپ کاربر -->
    <div class="space-y-3">
      <input
        v-model="inputAnswer"
        @keyup.enter="submit"
        :disabled="isSubmitted"
        type="text"
        placeholder="مصرع دوم را اینجا بنویسید..."
        class="w-full px-4 py-3.5 rounded-xl border border-ink-200 dark:border-paper-border bg-paper-light dark:bg-paper-surface text-ink-900 dark:text-ink-100 text-lg text-center font-vazir focus:ring-2 focus:ring-brand-500 outline-hidden transition-all"
        autofocus
      />

      <div class="flex items-center gap-3">
        <button
          @click="submit"
          :disabled="!inputAnswer.trim() || isSubmitted"
          class="flex-1 py-3 rounded-xl bg-brand-600 hover:bg-brand-700 disabled:opacity-50 text-white font-bold text-sm shadow-md transition-colors"
        >
          ثبت پاسخ
        </button>
        <button
          @click="revealHint"
          class="py-3 px-4 rounded-xl border border-ink-200 dark:border-paper-border text-ink-600 dark:text-ink-400 text-xs font-medium hover:bg-ink-100 dark:hover:bg-paper-dark transition-colors"
        >
          نمایش راهنما
        </button>
      </div>

      <!-- راهنمای کلمه اول در صورت تقاضا -->
      <div v-if="hintText" class="text-center text-xs text-brand-600 dark:text-brand-400 font-medium">
        راهنما: مصرع با کلمهٔ «{{ hintText }}» آغاز می‌شود.
      </div>

      <!-- نتیجه ارزیابی پس از ثبت -->
      <div
        v-if="feedback"
        class="p-4 rounded-xl text-center text-sm font-bold border"
        :class="[
          feedback.isCorrect
            ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-700 dark:text-emerald-300'
            : 'bg-rose-500/10 border-rose-500/30 text-rose-700 dark:text-rose-300'
        ]"
      >
        <div class="mb-1">
          {{ feedback.isCorrect ? 'آفرین! پاسخ شما صحیح است.' : 'پاسخ دقیق‌تر:' }}
        </div>
        <div class="text-xs font-normal">
          « {{ question.answer }} »
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import type { QuizQuestion } from '../../types/quiz';
import { quizService } from '../../services/QuizService';

var props = defineProps<{
  question: QuizQuestion;
}>();

var emit = defineEmits(['answered']);

var inputAnswer = ref<string>('');
var isSubmitted = ref<boolean>(false);
var hintText = ref<string>('');
var feedback = ref<{ isCorrect: boolean } | null>(null);

function revealHint() {
  var words = (props.question.answer || '').split(/\s+/);
  if (words.length > 0) {
    hintText.value = words[0];
  }
}

function submit() {
  if (!inputAnswer.value.trim() || isSubmitted.value) return;
  isSubmitted.value = true;

  var isCorrect = quizService.evaluateAnswer(props.question, inputAnswer.value);
  feedback.value = { isCorrect: isCorrect };

  setTimeout(function () {
    emit('answered', { isCorrect: isCorrect, answer: inputAnswer.value });
    inputAnswer.value = '';
    isSubmitted.value = false;
    hintText.value = '';
    feedback.value = null;
  }, 1800);
}
</script>
