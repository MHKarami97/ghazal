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

      <div v-if="wrongAnswers.length > 0" class="text-right space-y-2">
        <h4 class="text-sm font-bold text-ink-900 dark:text-ink-100">موارد نیازمند مرور</h4>
        <div
          v-for="item in wrongAnswers"
          :key="item.question.id"
          class="p-3 rounded-xl bg-rose-500/5 border border-rose-500/20 text-xs leading-relaxed"
        >
          <div class="font-bold text-brand-700 dark:text-brand-300 mb-1">
            {{ item.question.poetName }} » {{ item.question.poemTitle }}
          </div>
          <div class="text-ink-700 dark:text-ink-300">{{ item.question.answer }}</div>
        </div>
      </div>

      <div class="flex flex-wrap items-center justify-center gap-3 pt-4">
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
      <div class="mt-6" :key="currentQuestion.id">
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
          v-else-if="mode === 'multiple_choice' || mode === 'guess_metre' || mode === 'next_couplet' || mode === 'rhyme_match'"
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
      <h4 class="font-bold text-base text-ink-900 dark:text-ink-100">
        {{ isDueOnly ? 'کارتی برای مرور امروز وجود ندارد' : 'سؤالی برای این آزمون یافت نشد' }}
      </h4>
      <p class="text-xs text-ink-500 max-w-md mx-auto leading-relaxed">
        {{ isDueOnly
          ? 'همهٔ کارت‌های این فهرست مرور شده‌اند. می‌توانید یکی از حالت‌های تمرین آزاد را انتخاب کنید.'
          : 'برای تمرین در این حالت، می‌توانید ابیاتی را به فهرست حفظ اضافه نمایید یا از بخش شاعران، دیوان شعر دلخواهتان را برای استفاده آفلاین دانلود فرمایید.' }}
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
import { ref, computed, onMounted, watch } from 'vue';
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

interface WrongAnswer {
  question: QuizQuestion;
  answer: string;
}

var QUESTION_COUNT = 10;
var GRADE_CORRECT = 4;
var GRADE_WRONG = 0;

var route = useRoute();
var memorizeStore = useMemorizeStore();

var mode = computed(function () {
  return (route.params.mode as QuizMode) || 'multiple_choice';
});

var deckId = computed<number | undefined>(function () {
  var raw = Array.isArray(route.query.deck) ? route.query.deck[0] : route.query.deck;
  if (raw === undefined || raw === null || raw === '') return undefined;
  var parsed = Number(raw);
  return Number.isFinite(parsed) ? parsed : undefined;
});

var isDueOnly = computed(function () {
  return route.query.due === '1';
});

var questions = ref<QuizQuestion[]>([]);
var wrongAnswers = ref<WrongAnswer[]>([]);
var currentIndex = ref<number>(0);
var correctCount = ref<number>(0);
var answeredCount = ref<number>(0);
var isLoading = ref<boolean>(true);
var isFinished = ref<boolean>(false);
var isProcessing = ref<boolean>(false);
var sessionToken = 0;

onMounted(startQuiz);

watch(
  function () {
    return route.fullPath;
  },
  function () {
    startQuiz();
  }
);

async function startQuiz() {
  var token = ++sessionToken;
  isLoading.value = true;
  isFinished.value = false;
  isProcessing.value = false;
  currentIndex.value = 0;
  correctCount.value = 0;
  answeredCount.value = 0;
  wrongAnswers.value = [];

  try {
    var generated = await quizService.generateQuestions(mode.value, QUESTION_COUNT, deckId.value, isDueOnly.value);
    if (token !== sessionToken) return;
    questions.value = generated;
  } catch (error) {
    console.error('Quiz generation failed', error);
    if (token === sessionToken) questions.value = [];
  } finally {
    if (token === sessionToken) isLoading.value = false;
  }
}

var currentQuestion = computed(function () {
  return questions.value[currentIndex.value] || null;
});

var accuracyPercent = computed(function () {
  if (answeredCount.value === 0) return 0;
  return Math.min(100, Math.round((correctCount.value / answeredCount.value) * 100));
});

async function updateSchedule(question: QuizQuestion, isCorrect: boolean) {
  if (question.cardId === undefined) return;
  try {
    await memorizeStore.reviewCardById(question.cardId, isCorrect ? GRADE_CORRECT : GRADE_WRONG);
  } catch (error) {
    console.error('SM-2 update failed', error);
  }
}

async function handleAnswer(payload: { isCorrect: boolean; answer: string }) {
  var question = currentQuestion.value;
  if (!question || isFinished.value || isProcessing.value) return;

  isProcessing.value = true;
  try {
    answeredCount.value++;
    if (payload.isCorrect) {
      correctCount.value++;
    } else {
      wrongAnswers.value.push({ question: question, answer: payload.answer });
    }

    await updateSchedule(question, payload.isCorrect);

    if (currentIndex.value < questions.value.length - 1) {
      currentIndex.value++;
    } else {
      isFinished.value = true;
      triggerConfetti();
    }
  } finally {
    isProcessing.value = false;
  }
}

function restartQuiz() {
  startQuiz();
}

function triggerConfetti() {
  if (correctCount.value === 0) return;
  import('canvas-confetti').then(function (confetti) {
    confetti.default({
      particleCount: 80,
      spread: 70,
      origin: { y: 0.6 }
    });
  }).catch(function () {});
}
</script>
