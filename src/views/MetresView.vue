<template>
  <div class="space-y-8 pb-16">
    <!-- سربرگ صفحه وزن‌ها -->
    <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
      <div>
        <h2 class="text-2xl font-black text-ink-900 dark:text-ink-50 flex items-center gap-2">
          <Music class="w-6 h-6 text-brand-600" />
          موسیقی شعر و وزن‌های مشهور
        </h2>
        <p class="text-xs text-ink-500 mt-1">
          کاوش در اوزان عروضی کهن، شاهکارهای هم‌وزن و آزمون شنوایی ریتم شعر فارسی
        </p>
      </div>

      <!-- دکمه ورود به آزمون تشخیص وزن -->
      <router-link
        to="/memorize/quiz/guess_metre"
        class="inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-brand-600 hover:bg-brand-700 text-white font-medium text-xs shadow-soft transition-colors shrink-0"
      >
        <Sparkles class="w-4 h-4" />
        آزمون تشخیص وزن شعر
      </router-link>
    </div>

    <!-- کارت‌های اوزان مشهور زبان فارسی -->
    <div class="grid grid-cols-1 md:grid-cols-2 gap-5">
      <div
        v-for="metre in famousMetres"
        :key="metre.id"
        class="p-6 rounded-3xl bg-paper-light dark:bg-paper-surface border border-ink-200/80 dark:border-paper-border hover:border-brand-500/50 hover:shadow-soft transition-all flex flex-col justify-between group"
      >
        <div class="space-y-3">
          <div class="flex items-start justify-between gap-3">
            <div>
              <h3 class="text-base font-bold text-ink-900 dark:text-ink-50 group-hover:text-brand-600 transition-colors">
                {{ metre.name }}
              </h3>
              <span class="inline-block mt-1 text-xs px-2.5 py-0.5 rounded-md bg-brand-500/10 text-brand-700 dark:text-brand-300 font-mono">
                {{ metre.bahr }}
              </span>
            </div>
            <span class="p-2 rounded-xl bg-paper-warm dark:bg-paper-dark text-brand-600">
              <BookOpen class="w-4 h-4" />
            </span>
          </div>

          <!-- ارکان و هجاها -->
          <div class="p-3 rounded-2xl bg-paper-warm/60 dark:bg-paper-dark/60 border border-ink-200/40 dark:border-paper-border text-center">
            <span class="text-xs font-bold text-ink-700 dark:text-ink-300 tracking-wide font-mono">
              {{ metre.rhythm }}
            </span>
          </div>

          <!-- توضیح و نمونه -->
          <p class="text-xs text-ink-600 dark:text-ink-400 leading-relaxed">
            {{ metre.description }}
          </p>

          <div class="pt-2 text-xs text-ink-700 dark:text-ink-200 font-medium italic border-r-2 border-brand-500 pr-3">
            « {{ metre.sample }} »
          </div>
        </div>

        <!-- دکمه کاوش اشعار هم‌وزن -->
        <div class="mt-6 pt-4 border-t border-ink-200/60 dark:border-paper-border flex items-center justify-between">
          <span class="text-[11px] text-ink-400">جست‌وجوی اشعار با این ریتم:</span>
          <router-link
            :to="`/search?rhythm=${encodeURIComponent(metre.rhythm)}`"
            class="inline-flex items-center gap-1.5 text-xs font-bold text-brand-600 hover:text-brand-700 dark:text-brand-400 transition-colors"
          >
            <span>یافتن اشعار هم‌وزن</span>
            <ArrowLeft class="w-3.5 h-3.5" />
          </router-link>
        </div>
      </div>
    </div>

    <!-- راهنمای ساده تقطیع و ارکان عروضی -->
    <div class="p-6 rounded-3xl bg-brand-500/5 border border-brand-500/20 space-y-4">
      <h3 class="text-sm font-bold text-brand-800 dark:text-brand-300 flex items-center gap-2">
        <Sparkles class="w-4 h-4" />
        چگونه وزن شعر را با گوش تشخیص دهیم؟
      </h3>
      <div class="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs text-ink-700 dark:text-ink-300">
        <div class="p-3 rounded-2xl bg-paper-light dark:bg-paper-surface border border-brand-500/10">
          <strong class="block mb-1 text-ink-900 dark:text-ink-50">۱. ضرب‌آهنگ (ریتم)</strong>
          شعر فارسی دارای تکیه و ریتم مشخصی است. با زمزمه آرام و ریتمیک بیت، تکرار پایه‌ها (مثلاً «تَن تَن تَن») را پیدا کنید.
        </div>
        <div class="p-3 rounded-2xl bg-paper-light dark:bg-paper-surface border border-brand-500/10">
          <strong class="block mb-1 text-ink-900 dark:text-ink-50">۲. مقایسه با شاهکارها</strong>
          اگر بیت حماسی و رزمی است شبیه شاهنامه است، اگر دوبیتی محلی و کوته‌قامت است شبیه دوبیتی‌های باباطاهر است.
        </div>
        <div class="p-3 rounded-2xl bg-paper-light dark:bg-paper-surface border border-brand-500/10">
          <strong class="block mb-1 text-ink-900 dark:text-ink-50">۳. تکرار و آزمون</strong>
          در بخش «آزمون وزن»، بیت‌های مختلف را بشنوید و گزینه‌های صحیح را حدس بزنید تا گوش شما با اوزان مأنوس شود.
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useLiteraryStore } from '../stores/literaryStore';
import { Music, Sparkles, BookOpen, ArrowLeft } from 'lucide-vue-next';

var literaryStore = useLiteraryStore();

var famousMetres = computed(function () {
  return literaryStore.getFamousMetres();
});
</script>
