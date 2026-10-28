<template>
  <div v-if="isOpen" class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
    <div class="relative w-full max-w-xl p-6 sm:p-8 rounded-3xl bg-paper-light dark:bg-paper-surface border border-brand-500/30 shadow-2xl space-y-6">
      <!-- هدر مدال -->
      <div class="flex items-center justify-between pb-3 border-b border-ink-200/60 dark:border-paper-border">
        <div class="flex items-center gap-2">
          <Brain class="w-5 h-5 text-brand-600" />
          <h3 class="font-bold text-base text-ink-900 dark:text-ink-50">
            حفظ مرحله‌ای و فعال بیت
          </h3>
        </div>
        <button @click="$emit('close')" class="p-1.5 rounded-xl text-ink-400 hover:text-ink-700 dark:hover:text-ink-200">
          <X class="w-5 h-5" />
        </button>
      </div>

      <!-- نشانگر مراحل چهارگانه -->
      <div class="flex items-center justify-between gap-1 text-xs font-bold text-ink-500">
        <span :class="{ 'text-brand-600': step === 1 }">۱. دیدن کامل</span>
        <span>←</span>
        <span :class="{ 'text-brand-600': step === 2 }">۲. پنهان مصرع دوم</span>
        <span>←</span>
        <span :class="{ 'text-brand-600': step === 3 }">۳. محوشدن تدریجی</span>
        <span>←</span>
        <span :class="{ 'text-brand-600': step === 4 }">۴. تثبیت نهایی</span>
      </div>

      <!-- محتوای بیت بر اساس مرحله -->
      <div class="p-6 rounded-2xl bg-paper-warm/60 dark:bg-paper-dark border border-ink-200/80 dark:border-paper-border text-center space-y-4">
        <div class="text-xs text-brand-600 font-bold mb-1">
          {{ card.poetName }} » {{ card.poemTitle }}
        </div>

        <!-- مرحله ۱: نمایش کامل -->
        <template v-if="step === 1">
          <div class="text-lg sm:text-xl font-bold text-ink-900 dark:text-ink-50 leading-loose">
            <div>« {{ card.textFirst }} »</div>
            <div>« {{ card.textSecond }} »</div>
          </div>
          <p class="text-xs text-ink-500 mt-2">
            بیت را با طمأنینه ۲ بار با صدای رسا بخوانید و به ارتباط معنایی مصراع‌ها توجه کنید.
          </p>
        </template>

        <!-- مرحله ۲: پنهان‌سازی مصراع دوم -->
        <template v-else-if="step === 2">
          <div class="text-lg sm:text-xl font-bold text-ink-900 dark:text-ink-50 leading-loose">
            <div>« {{ card.textFirst }} »</div>
            <div class="text-brand-600/70 dark:text-brand-400/70 font-mono tracking-widest mt-2">
              {{ revealSecond ? `« ${card.textSecond} »` : '[ . . . مصرع دوم را در ذهن بازگو کنید . . . ]' }}
            </div>
          </div>
          <button
            v-if="!revealSecond"
            @click="revealSecond = true"
            class="text-xs text-brand-600 font-bold hover:underline mt-2 inline-block"
          >
            آشکارسازی مصرع دوم جهت اطمینان
          </button>
        </template>

        <!-- مرحله ۳: محوشدن تدریجی ۵۰٪ کلمات -->
        <template v-else-if="step === 3">
          <div class="text-lg sm:text-xl font-bold text-ink-900 dark:text-ink-50 leading-loose">
            <div>« {{ maskWords(card.textFirst, 0.45) }} »</div>
            <div>« {{ maskWords(card.textSecond, 0.55) }} »</div>
          </div>
          <p class="text-xs text-ink-500 mt-2">
            کلمات محوشده را در ذهن جای‌گذاری و بیت را کامل در یاد خود مجسم کنید.
          </p>
        </template>

        <!-- مرحله ۴: تثبیت نهایی و ارزیابی SM-2 -->
        <template v-else-if="step === 4">
          <div class="text-lg sm:text-xl font-bold text-ink-900 dark:text-ink-50 leading-loose">
            <div class="text-ink-400">[ . . . بیت کامل را از حفظ در ذهن بخوانید . . . ]</div>
            <div v-if="revealFinal" class="mt-4 p-4 rounded-xl bg-paper-light dark:bg-paper-surface border border-emerald-500/40 text-ink-900 dark:text-ink-100">
              <div>« {{ card.textFirst }} »</div>
              <div>« {{ card.textSecond }} »</div>
            </div>
          </div>

          <button
            v-if="!revealFinal"
            @click="revealFinal = true"
            class="text-xs text-brand-600 font-bold hover:underline mt-2 inline-block"
          >
            مشاهده متن کامل برای بررسی درستی
          </button>
        </template>
      </div>

      <!-- دکمه‌های کنترل مراحل -->
      <div class="flex items-center justify-between pt-2">
        <button
          v-if="step > 1"
          @click="step--"
          class="px-4 py-2 rounded-xl text-xs font-bold border border-ink-200 dark:border-paper-border text-ink-600 dark:text-ink-400"
        >
          مرحله قبل
        </button>
        <span v-else></span>

        <button
          v-if="step < 4"
          @click="step++; revealSecond = false"
          class="px-6 py-2.5 rounded-xl text-xs font-bold bg-brand-600 hover:bg-brand-700 text-white shadow-md transition-colors"
        >
          مرحله بعد »
        </button>

          <!-- ثبت ارزیابی در مرحله ۴ بر اساس SM-2 -->
          <div v-else class="flex gap-2">
            <button
              @click="finish(0)"
              class="px-3 py-2 rounded-xl text-xs font-bold bg-rose-500/10 text-rose-700 hover:bg-rose-500/20"
            >
              نیاز به تکرار
            </button>
            <button
              @click="finish(3)"
              class="px-3 py-2 rounded-xl text-xs font-bold bg-amber-500/10 text-amber-700 hover:bg-amber-500/20"
            >
              سخت بود
            </button>
            <button
              @click="finish(5)"
              class="px-4 py-2 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs"
            >
              عالی حفظ شد ✓
            </button>
          </div>
        </div>
      </div>
    </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import type { MemorizeCard } from '../../types/user';
import type { ReviewGrade } from '../../services/SpacedRepetitionService';
import { useMemorizeStore } from '../../stores/memorizeStore';
import { Brain, X } from 'lucide-vue-next';

var props = defineProps<{
  isOpen: boolean;
  card: MemorizeCard;
}>();

var emit = defineEmits(['close', 'reviewed']);
var memorizeStore = useMemorizeStore();

var step = ref<number>(1);
var revealSecond = ref<boolean>(false);
var revealFinal = ref<boolean>(false);

function maskWords(text: string, ratio = 0.5): string {
  if (!text) return '';
  var words = text.split(/\s+/);
  return words.map(function (w, idx) {
    return (idx % 2 === 1) ? '.....' : w;
  }).join(' ');
}

async function finish(quality: ReviewGrade) {
  if (props.card.id) {
    await memorizeStore.reviewCard(props.card, quality);
  }
  emit('reviewed');
  emit('close');
  step.value = 1;
  revealSecond.value = false;
  revealFinal.value = false;
}
</script>
