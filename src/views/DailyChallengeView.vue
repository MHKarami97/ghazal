<template>
  <div class="space-y-8 max-w-2xl mx-auto pb-16">
    <!-- سربرگ چالش روزانه -->
    <div class="flex items-center justify-between border-b border-ink-200/60 dark:border-paper-border pb-4">
      <div>
        <h2 class="text-2xl font-black text-ink-900 dark:text-ink-50 flex items-center gap-2">
          <CalendarDays class="w-6 h-6 text-brand-600" />
          چالش روزانه شعر
        </h2>
        <p class="text-xs text-ink-500 mt-1">
          هر روز یک بیت، یک پرسش ادبی؛ ذوق‌آزمایی و حفظ استمرار
        </p>
      </div>

      <!-- آمار زنجیره و امتیاز -->
      <div class="flex items-center gap-3">
        <div class="flex items-center gap-1.5 px-3 py-1.5 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-700 dark:text-amber-300 text-xs font-bold">
          <Flame class="w-4 h-4 text-amber-500" />
          <span>{{ toPersianDigits(status?.streakDays || 0) }} روز تداوم</span>
        </div>
        <div class="flex items-center gap-1.5 px-3 py-1.5 rounded-2xl bg-brand-500/10 border border-brand-500/20 text-brand-700 dark:text-brand-300 text-xs font-bold">
          <Award class="w-4 h-4 text-brand-600" />
          <span>{{ toPersianDigits(status?.totalScore || 0) }} امتیاز</span>
        </div>
      </div>
    </div>

    <!-- وضعیت لودینگ -->
    <LoadingState v-if="isLoading" message="در حال دریافت معمای روز..." />

    <!-- محتوای چالش روز -->
    <template v-else-if="status?.todayRecord">
      <div class="p-6 sm:p-8 rounded-3xl bg-paper-light dark:bg-paper-surface border border-ink-200/80 dark:border-paper-border shadow-soft space-y-6">
        <!-- کارت بیت روز -->
        <div class="p-6 rounded-2xl bg-paper-warm/70 dark:bg-paper-dark/70 border border-ink-200/60 dark:border-paper-border text-center space-y-3">
          <div class="text-xs font-bold text-brand-700 dark:text-brand-400">
            {{ status.todayRecord.poetName }} » {{ status.todayRecord.poemTitle }}
          </div>
          <div class="text-base sm:text-lg font-bold text-ink-900 dark:text-ink-50 leading-loose">
            <div>« {{ status.todayRecord.verseFirst }} »</div>
            <div>« {{ status.todayRecord.verseSecond }} »</div>
          </div>
        </div>

        <!-- پرسش چالش -->
        <div class="space-y-4">
          <div class="flex items-center gap-2 text-sm font-bold text-ink-900 dark:text-ink-100">
            <HelpCircle class="w-5 h-5 text-brand-600" />
            <span>{{ status.todayRecord.question }}</span>
          </div>

          <!-- گزینه‌های پاسخ -->
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <button
              v-for="opt in status.todayRecord.options"
              :key="opt"
              @click="onSelectOption(opt)"
              :disabled="hasAnswered"
              class="p-4 rounded-2xl border text-sm font-medium transition-all text-right flex items-center justify-between"
              :class="getOptionClass(opt)"
            >
              <span>{{ opt }}</span>
              <CheckCircle2
                v-if="hasAnswered && opt === status.todayRecord.correctAnswer"
                class="w-5 h-5 text-emerald-600 shrink-0"
              />
              <XCircle
                v-else-if="hasAnswered && selectedAnswer === opt && opt !== status.todayRecord.correctAnswer"
                class="w-5 h-5 text-rose-500 shrink-0"
              />
            </button>
          </div>
        </div>

        <!-- پیام نتیجه پس از پاسخ -->
        <div
          v-if="hasAnswered"
          class="p-4 rounded-2xl flex items-center gap-3"
          :class="isCorrect
            ? 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-800 dark:text-emerald-200'
            : 'bg-rose-500/10 border border-rose-500/20 text-rose-800 dark:text-rose-200'"
        >
          <Sparkles class="w-6 h-6 shrink-0" />
          <div class="text-xs leading-relaxed">
            <strong class="block text-sm font-bold mb-0.5">
              {{ isCorrect ? 'آفرین! پاسخ شما کاملاً درست بود.' : 'متأسفانه پاسخ اشتباه بود.' }}
            </strong>
            <span>
              {{ isCorrect ? '۱۵ امتیاز دریافت کردید و زنجیره تداوم روزانه شما حفظ شد!' : `پاسخ صحیح: «${status.todayRecord.correctAnswer}» است.` }}
            </span>
          </div>
        </div>
      </div>

      <!-- تاریخچه چالش‌های اخیر -->
      <div v-if="history.length > 0" class="space-y-3">
        <h3 class="text-sm font-bold text-ink-800 dark:text-ink-200 flex items-center gap-2">
          <History class="w-4 h-4 text-brand-600" />
          کارنامه چالش‌های گذشته
        </h3>

        <div class="space-y-2">
          <div
            v-for="h in history"
            :key="h.id || h.date"
            class="p-4 rounded-2xl bg-paper-light dark:bg-paper-surface border border-ink-200/70 dark:border-paper-border flex items-center justify-between text-xs"
          >
            <div>
              <span class="font-bold text-ink-800 dark:text-ink-100">
                {{ h.poetName }} ({{ h.date }})
              </span>
              <p class="text-[11px] text-ink-500 mt-0.5">
                {{ h.question }}
              </p>
            </div>

            <div class="flex items-center gap-2">
              <span
                v-if="h.isCorrect"
                class="px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 font-bold"
              >
                +{{ toPersianDigits(h.score || 15) }} امتیاز
              </span>
              <span
                v-else
                class="px-2.5 py-1 rounded-full bg-rose-500/10 text-rose-700 dark:text-rose-300"
              >
                نادرست
              </span>
            </div>
          </div>
        </div>
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { dailyChallengeService, type DailyChallengeStatus } from '../services/DailyChallengeService';
import { toPersianDigits } from '../utils/persianNormalizer';
import type { DailyChallengeRecord } from '../types/user';
import LoadingState from '../components/common/LoadingState.vue';
import {
  CalendarDays,
  Flame,
  Award,
  HelpCircle,
  CheckCircle2,
  XCircle,
  Sparkles,
  History
} from 'lucide-vue-next';

var isLoading = ref<boolean>(true);
var status = ref<DailyChallengeStatus | null>(null);
var history = ref<DailyChallengeRecord[]>([]);
var selectedAnswer = ref<string>('');
var hasAnswered = ref<boolean>(false);
var isCorrect = ref<boolean>(false);

onMounted(async function () {
  await loadChallenge();
});

async function loadChallenge() {
  isLoading.value = true;
  try {
    status.value = await dailyChallengeService.getTodayChallenge();
    if (status.value && status.value.hasAnsweredToday) {
      hasAnswered.value = true;
      selectedAnswer.value = status.value.todayRecord.userAnswer || '';
      isCorrect.value = !!status.value.todayRecord.isCorrect;
    }
    history.value = await dailyChallengeService.getChallengeHistory();
  } finally {
    isLoading.value = false;
  }
}

async function onSelectOption(opt: string) {
  if (hasAnswered.value || !status.value?.todayRecord.id) return;
  selectedAnswer.value = opt;

  var res = await dailyChallengeService.submitAnswer(status.value.todayRecord.id, opt);
  hasAnswered.value = true;
  isCorrect.value = res.isCorrect;

  // تازه کردن وضعیت و سابقه
  status.value = await dailyChallengeService.getTodayChallenge();
  history.value = await dailyChallengeService.getChallengeHistory();
}

function getOptionClass(opt: string): string {
  if (!hasAnswered.value) {
    return 'bg-paper-warm/50 dark:bg-paper-dark/50 border-ink-200 dark:border-paper-border hover:border-brand-500 hover:bg-brand-500/5 text-ink-900 dark:text-ink-100 cursor-pointer';
  }

  if (opt === status.value?.todayRecord.correctAnswer) {
    return 'bg-emerald-500/10 border-emerald-500 text-emerald-800 dark:text-emerald-200 font-bold';
  }

  if (selectedAnswer.value === opt && !isCorrect.value) {
    return 'bg-rose-500/10 border-rose-500 text-rose-800 dark:text-rose-200';
  }

  return 'bg-paper-warm/30 dark:bg-paper-dark/30 border-ink-200/50 dark:border-paper-border/50 text-ink-400 opacity-60';
}
</script>
