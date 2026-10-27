<template>
  <div class="max-w-2xl mx-auto space-y-6 pb-16">
    <!-- وضعیت لودینگ سوالات -->
    <LoadingState v-if="isLoading" message="در حال آماده‌سازی جلسه آزمون..." />

    <!-- خلاصه پایان جلسه آزمون -->
    <div
      v-else-if="isFinished"
      class="p-8 rounded-3xl bg-paper-light dark:bg-paper-surface border border-ink-200/80 dark:border-paper-border shadow-soft text-center space-y-6"
    >
      <div class="w-16 h-16 mx-auto rounded-3xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center font-bold text-2xl">
        <Award class="w-8 h-8" />
      </div>

      <div>
        <h3 class="text-2xl font-black text-ink-900 dark:text-ink-50 mb-1">
          جلسه تمرین به پایان رسید!
        </h3>
        <p class="text-xs text-ink-500">
          با مرور مستمر، مسیر تثبیت اشعار در حافظه پایدار شما تکمیل خواهد شد.
        </p>
      </div>

      <!-- آمار عملکرد این جلسه -->
      <div class="grid grid-cols-3 gap-3">
        <div class="p-4 rounded-2xl bg-paper-warm dark:bg-paper-dark border border-ink-200/60 dark:border-paper-border">
          <div class="text-xl font-black text-ink-900 dark:text-ink-100">
            {{ toPersianDigits(questions.length) }}
          </div>
          <div class="text-[11px] text-ink-500 mt-1">تعداد سؤالات</div>
        </div>

        <div class="p-4 rounded-2xl bg-paper-warm dark:bg-paper-dark border border-ink-200/60 dark:border-paper-border">
          <div class="text-xl font-black text-emerald-600">
            {{ toPersianDigits(correctCount) }}
          </div>
          <div class="text-[11px] text-ink-500 mt-1">پاسخ‌های صحیح</div>
        </div>

        <div class="p-4 rounded-2xl bg-paper-warm dark:bg-paper-dark border border-ink-200/60 dark:border-paper-border">
          <div class="text-xl font-black text-brand-600">
            {{ toPersianDigits(accuracyPercent) }}٪
          </div>
          <div class="text-[11px] text-ink-500 mt-1">درصد دقت</div>
        </div>
      </div>

      <div class="flex items-center justify-center gap-3 pt-4">
        <button
          @click="restartQuiz"
          class="py-3 px-6 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-bold text-xs shadow-md transition-colors"
        >
          شروع مجدد همین آزمون
        </button>
        <router-link
          to="/memorize"
          class="py-3 px-6 rounded-xl border border-ink-200 dark:border-paper-border text-ink-700 dark:text-ink-300 font-bold text-xs hover:bg-ink-100 transition-colors"
        >
          بازگشت به بخش حفظ
        </router-link>
      </div>
    </div>

    <!-- جریان سؤالات فعال -->
    <template v-else-if="currentQuestion">
      <!-- نوار پیشرفت بالای سوال -->
      <div class="flex items-center justify-between text-xs text-ink-500 mb-2">
        <span>سؤال {{ toPersianDigits(currentIndex + 1) }} از {{ toPersianDigits(questions.length) }}</span>
        <span>دقت: {{ toPersianDigits(accuracyPercent) }}٪</span>
      </div>
      <div class="w-full bg-ink-200 dark:bg-ink-800 h-2 rounded-full overflow-hidden">
        <div
          class="bg-brand-500 h-full rounded-full transition-all duration-300"
          :style="{ width: `${((currentIndex + 1) / questions.length) * 100}%` }"
        ></div>
      </div>

      <!-- کامپوننت آزمون متناسب با Mode -->
      <div class="mt-6">
        <QuizCloze
          v-if="mode === 'cloze'"
          :question="currentQuestion"
          @answered="handleAnswer"
        />
        <QuizReorder
          v-else-if="mode === 'reorder'"
          :question="currentQuestion"
          @answered="handleAnswer"
        />
        <QuizMultipleChoice
          v-else-if="mode === 'multiple_choice'"
          :question="currentQuestion"
          @answered="handleAnswer"
        />
        <QuizTyping
          v-else-if="mode === 'typing'"
          :question="currentQuestion"
          @answered="handleAnswer"
        />
        <QuizGuessPoet
          v-else-if="mode === 'guess_poet'"
          :question="currentQuestion"
          @answered="handleAnswer"
        />
        <QuizGuessDevice
          v-else-if="mode === 'guess_device'"
          :question="currentQuestion"
          @answered="handleAnswer"
        />
        <QuizWordHiding
          v-else-if="mode === 'word_hiding'"
          :question="currentQuestion"
          @answered="handleAnswer"
        />
      </div>
    </template>

    <!-- در صورت نبود هیچ سوالی -->
    <div
      v-else
      class="p-8 rounded-3xl bg-paper-light dark:bg-paper-surface border border-ink-200/80 dark:border-paper-border text-center space-y-4"
    >
      <h4 class="font-bold text-base text-ink-900 dark:text-ink-100">سؤالی برای این آزمون یافت نشد</h4>
      <p class="text-xs text-ink-500 max-w-md mx-auto leading-relaxed">
        برای تمرین در این حالت، می‌توانید ابیاتی را به فهرست حفظ اضافه نمایید یا از بخش شاعران، دیوان شعر دلخواهتان را برای استفاده آفلاین دانلود فرمایید.
      </p>
      <router-link
        to="/memorize"
        class="inline-block py-2.5 px-6 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-bold text-xs shadow-md transition-colors"
      >
        رفتن به بخش حفظ شعر
      </router-link>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useRoute } from 'vue-router';
import { quizService } from '../services/QuizService';
import { useMemorizeStore } from '../stores/memorizeStore';
import { toPersianDigits } from '../utils/persianNormalizer';
import type { QuizMode, QuizQuestion } from '../types/quiz';
import LoadingState from '../components/common/LoadingState.vue';
import QuizCloze from '../components/memorize/QuizCloze.vue';
import QuizReorder from '../components/memorize/QuizReorder.vue';
import QuizMultipleChoice from '../components/memorize/QuizMultipleChoice.vue';
import QuizTyping from '../components/memorize/QuizTyping.vue';
import QuizGuessPoet from '../components/memorize/QuizGuessPoet.vue';
import QuizGuessDevice from '../components/memorize/QuizGuessDevice.vue';
import QuizWordHiding from '../components/memorize/QuizWordHiding.vue';
import { Award } from 'lucide-vue-next';

var route = useRoute();
var memorizeStore = useMemorizeStore();

var mode = computed(function () {
  return (route.params.mode as QuizMode) || 'multiple_choice';
});

var questions = ref<QuizQuestion[]>([]);
var currentIndex = ref<number>(0);
var correctCount = ref<number>(0);
var isLoading = ref<boolean>(true);
var isFinished = ref<boolean>(false);

onMounted(startQuiz);

async function startQuiz() {
  isLoading.value = true;
  isFinished.value = false;
  currentIndex.value = 0;
  correctCount.value = 0;

  try {
    questions.value = await quizService.generateQuestions(mode.value, 10);
  } finally {
    isLoading.value = false;
  }
}

var currentQuestion = computed(function () {
  return questions.value[currentIndex.value] || null;
});

var accuracyPercent = computed(function () {
  if (currentIndex.value === 0) return 0;
  return Math.round((correctCount.value / currentIndex.value) * 100);
});

async function handleAnswer(payload: { isCorrect: boolean; answer: string }) {
  if (payload.isCorrect) {
    correctCount.value++;
  }

  // اگر سوال مربوط به کارت است، الگوریتم SM-2 را به روزرسانی کن
  if (currentQuestion.value?.cardId) {
    var card = memorizeStore.cards.find(function (c) {
      return c.id === currentQuestion.value?.cardId;
    });
    if (card) {
      var grade = payload.isCorrect ? 4 : 0;
      await memorizeStore.reviewCard(card, grade as any);
    }
  }

  if (currentIndex.value < questions.value.length - 1) {
    currentIndex.value++;
  } else {
    isFinished.value = true;
    triggerConfetti();
  }
}

function restartQuiz() {
  startQuiz();
}

function triggerConfetti() {
  import('canvas-confetti').then(function (confetti) {
    confetti.default({
      particleCount: 80,
      spread: 70,
      origin: { y: 0.6 }
    });
  }).catch(function () {});
}
</script>
