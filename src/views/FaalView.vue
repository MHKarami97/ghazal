<template>
  <div class="max-w-2xl mx-auto space-y-8 pb-12">
    <!-- مرحله ۱: نیت و گشودن دیوان -->
    <div
      v-if="!currentFortune"
      class="p-6 sm:p-10 rounded-3xl bg-paper-light dark:bg-paper-surface border border-ink-200/80 dark:border-paper-border shadow-soft text-center space-y-6"
    >
      <div class="w-20 h-20 mx-auto rounded-3xl bg-gradient-to-br from-brand-400 to-brand-600 text-white flex items-center justify-center font-bold text-3xl shadow-lg shadow-brand-500/20">
        <Sparkles class="w-10 h-10" />
      </div>

      <div>
        <h2 class="text-2xl font-black text-ink-900 dark:text-ink-50 mb-2">
          تفأل به دیوان حافظ شیرازی
        </h2>
        <p class="text-xs sm:text-sm text-ink-600 dark:text-ink-400 leading-relaxed max-w-md mx-auto">
          ای حافظ شیرازی! تو محرم هر رازی؛ تو را به شاخ نباتت قسم می‌دهم که راز مرا بگشایی و مرا از سرانجام کارم آگاه سازی...
        </p>
      </div>

      <!-- ورودی نیت (اختیاری) -->
      <div class="max-w-md mx-auto">
        <input
          v-model="intention"
          type="text"
          placeholder="نیت یا خواستهٔ خود را بنویسید (اختیاری)..."
          class="w-full px-4 py-3 rounded-2xl border border-ink-200 dark:border-paper-border bg-paper-warm/50 dark:bg-paper-dark text-center text-sm font-vazir focus:ring-2 focus:ring-brand-500 outline-hidden"
        />
      </div>

      <!-- دکمه تفأل -->
      <div>
        <button
          @click="takeFortune"
          :disabled="isConsulting"
          class="py-3.5 px-8 rounded-2xl bg-brand-600 hover:bg-brand-700 disabled:opacity-50 text-white font-bold text-sm shadow-md transition-all active:scale-95"
        >
          <span v-if="!isConsulting">نیت کردم؛ گشودن فال</span>
          <span v-else class="flex items-center gap-2">
            <span class="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
            در حال گشودن دیوان حافظ...
          </span>
        </button>
      </div>
    </div>

    <!-- مرحله ۲: نتیجه فال و تعبیر -->
    <div v-else class="space-y-6">
      <div class="p-6 sm:p-8 rounded-3xl bg-paper-light dark:bg-paper-surface border border-brand-500/30 shadow-soft">
        <div class="flex items-center justify-between pb-4 border-b border-ink-200/60 dark:border-paper-border mb-6">
          <div>
            <span class="text-xs text-brand-600 font-bold">پاسخ لسان‌الغیب به نیت شما:</span>
            <h3 class="text-xl font-black text-ink-900 dark:text-ink-50 mt-1">
              {{ currentFortune.poem.Title }}
            </h3>
          </div>
          <button
            @click="currentFortune = null"
            class="text-xs text-ink-500 hover:text-brand-600 transition-colors"
          >
            تفأل مجدد
          </button>
        </div>

        <!-- ابیات غزل فال -->
        <div class="space-y-4 my-8">
          <div
            v-for="(pair, idx) in couplets"
            :key="idx"
            class="poem-beyt font-vazir text-center"
            :style="{ fontSize: `${appStore.fontSize}px` }"
          >
            <div class="poem-misra font-medium text-ink-900 dark:text-ink-100">
              {{ pair.rightVerse?.Text }}
            </div>
            <div class="poem-misra font-medium text-ink-900 dark:text-ink-100">
              {{ pair.leftVerse?.Text }}
            </div>
          </div>
        </div>

        <!-- تعبیر فال -->
        <div class="p-5 rounded-2xl bg-brand-50 dark:bg-brand-950/20 border border-brand-500/20 text-xs sm:text-sm text-ink-800 dark:text-ink-200 leading-relaxed space-y-3">
          <div class="font-bold text-brand-800 dark:text-brand-300 flex items-center gap-1.5">
            <Sparkles class="w-4 h-4" />
            <span>تعبیر و پیام این غزل:</span>
          </div>
          <p>{{ currentFortune.interpretation }}</p>

          <div class="pt-2 border-t border-brand-500/20 flex justify-end">
            <router-link
              :to="'/read/' + currentFortune.poem.FullUrl.replace(/^\/+/, '')"
              class="text-xs font-bold text-brand-700 dark:text-brand-300 hover:underline"
            >
              مطالعه کامل این غزل و آرایه‌های آن »
            </router-link>
          </div>
        </div>
      </div>
    </div>

    <!-- تاریخچه فال‌های گذشته -->
    <div v-if="history.length > 0" class="space-y-3">
      <h4 class="font-bold text-sm text-ink-900 dark:text-ink-50">
        تاریخچه فال‌های گذشته شما
      </h4>
      <div class="space-y-2">
        <router-link
          v-for="item in history"
          :key="item.id"
          :to="'/read/' + item.fullUrl.replace(/^\/+/, '')"
          class="p-3.5 rounded-xl bg-paper-light dark:bg-paper-surface border border-ink-200/80 dark:border-paper-border hover:border-brand-500/40 flex items-center justify-between text-xs transition-colors block"
        >
          <div>
            <span class="font-bold text-ink-800 dark:text-ink-200 ml-2">{{ item.poemTitle }}</span>
            <span v-if="item.faalNiat" class="text-ink-500 italic">({{ item.faalNiat }})</span>
          </div>
          <span class="text-ink-400 text-[11px]">{{ formatRelativeDate(item.viewedAt) }}</span>
        </router-link>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';
import { useAppStore } from '../stores/appStore';
import { fortuneService, type FortuneResult } from '../services/FortuneService';
import { groupVersesIntoCouplets, formatRelativeDate } from '../utils/formatters';
import type { UserHistoryItem } from '../types/user';
import { Sparkles } from 'lucide-vue-next';

var appStore = useAppStore();
var intention = ref<string>('');
var isConsulting = ref<boolean>(false);
var currentFortune = ref<FortuneResult | null>(null);
var history = ref<UserHistoryItem[]>([]);

onMounted(loadHistory);

async function loadHistory() {
  history.value = await fortuneService.getFortuneHistory();
}

async function takeFortune() {
  isConsulting.value = true;
  try {
    currentFortune.value = await fortuneService.getFaalHafez(intention.value);
    await loadHistory();
    intention.value = '';
  } finally {
    isConsulting.value = false;
  }
}

var couplets = computed(function () {
  if (!currentFortune.value?.poem.Verses) return [];
  return groupVersesIntoCouplets(currentFortune.value.poem.Verses);
});
</script>
