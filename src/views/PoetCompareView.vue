<template>
  <div class="space-y-8 pb-16">
    <!-- سربرگ مقایسه -->
    <div>
      <h2 class="text-2xl font-black text-ink-900 dark:text-ink-50 flex items-center gap-2">
        <Scale class="w-6 h-6 text-brand-600" />
        مقایسه تطبیقی دو شاعر
      </h2>
      <p class="text-xs text-ink-500 mt-1">
        سنجش بسامد اوزان عروضی، واژگان پرتکرار و وجوه اشتراک و افتراق در اشعار دانلودشده
      </p>
    </div>

    <!-- فرم انتخاب دو شاعر -->
    <div class="p-6 rounded-3xl bg-paper-light dark:bg-paper-surface border border-ink-200/80 dark:border-paper-border shadow-soft space-y-4">
      <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <!-- شاعر اول -->
        <div>
          <label class="block text-xs font-bold text-ink-700 dark:text-ink-300 mb-1.5">شاعر اول:</label>
          <select
            v-model="selectedPoet1Slug"
            @change="onCompare"
            class="w-full px-3.5 py-2.5 rounded-xl border border-ink-200 dark:border-paper-border bg-paper-warm/50 dark:bg-paper-dark text-ink-900 dark:text-ink-100 text-xs font-bold outline-hidden focus:ring-2 focus:ring-brand-500"
          >
            <option value="" disabled>شاعر اول را انتخاب کنید...</option>
            <option v-for="p in availablePoets" :key="p.Id" :value="getSlug(p)">
              {{ p.Nickname }}
            </option>
          </select>
        </div>

        <!-- شاعر دوم -->
        <div>
          <label class="block text-xs font-bold text-ink-700 dark:text-ink-300 mb-1.5">شاعر دوم:</label>
          <select
            v-model="selectedPoet2Slug"
            @change="onCompare"
            class="w-full px-3.5 py-2.5 rounded-xl border border-ink-200 dark:border-paper-border bg-paper-warm/50 dark:bg-paper-dark text-ink-900 dark:text-ink-100 text-xs font-bold outline-hidden focus:ring-2 focus:ring-brand-500"
          >
            <option value="" disabled>شاعر دوم را انتخاب کنید...</option>
            <option v-for="p in availablePoets" :key="p.Id" :value="getSlug(p)">
              {{ p.Nickname }}
            </option>
          </select>
        </div>
      </div>
    </div>

    <!-- وضعیت لودینگ -->
    <LoadingState v-if="isLoading" message="در حال محاسبه و مقایسه آمار اشعار..." />

    <!-- نتایج مقایسه -->
    <template v-else-if="comparison">
      <!-- کارت‌های آماری کلی -->
      <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <!-- آمار شاعر اول -->
        <div class="p-6 rounded-3xl bg-paper-light dark:bg-paper-surface border border-brand-500/30 shadow-soft space-y-4">
          <div class="flex items-center justify-between pb-3 border-b border-ink-200/50 dark:border-paper-border">
            <h3 class="text-lg font-black text-brand-700 dark:text-brand-300">
              {{ comparison.poet1.poetName }}
            </h3>
            <span class="text-xs px-2.5 py-1 rounded-full bg-brand-500/10 text-brand-700 dark:text-brand-300 font-bold">
              {{ toPersianDigits(comparison.poet1.totalPoems) }} شعر دانلودشده
            </span>
          </div>

          <div class="text-xs text-ink-600 dark:text-ink-300 space-y-1.5">
            <div>کل ابیات موجود: <strong>{{ toPersianDigits(comparison.poet1.totalVerses) }}</strong></div>
            <div>تنوع اوزان عروضی: <strong>{{ toPersianDigits(comparison.poet1.topMetres.length) }}</strong> وزن شاخص</div>
          </div>

          <!-- واژگان پرتکرار -->
          <div class="pt-2">
            <span class="text-[11px] text-ink-400 block mb-2 font-bold">واژگان پربسامد و کلیدی:</span>
            <div class="flex flex-wrap gap-1.5">
              <span
                v-for="kw in comparison.poet1.topKeywords"
                :key="kw.word"
                class="px-2 py-0.5 rounded-lg bg-paper-warm dark:bg-paper-dark text-ink-700 dark:text-ink-300 text-[11px]"
              >
                {{ kw.word }} ({{ toPersianDigits(kw.count) }})
              </span>
            </div>
          </div>
        </div>

        <!-- آمار شاعر دوم -->
        <div class="p-6 rounded-3xl bg-paper-light dark:bg-paper-surface border border-indigo-500/30 shadow-soft space-y-4">
          <div class="flex items-center justify-between pb-3 border-b border-ink-200/50 dark:border-paper-border">
            <h3 class="text-lg font-black text-indigo-700 dark:text-indigo-300">
              {{ comparison.poet2.poetName }}
            </h3>
            <span class="text-xs px-2.5 py-1 rounded-full bg-indigo-500/10 text-indigo-700 dark:text-indigo-300 font-bold">
              {{ toPersianDigits(comparison.poet2.totalPoems) }} شعر دانلودشده
            </span>
          </div>

          <div class="text-xs text-ink-600 dark:text-ink-300 space-y-1.5">
            <div>کل ابیات موجود: <strong>{{ toPersianDigits(comparison.poet2.totalVerses) }}</strong></div>
            <div>تنوع اوزان عروضی: <strong>{{ toPersianDigits(comparison.poet2.topMetres.length) }}</strong> وزن شاخص</div>
          </div>

          <!-- واژگان پرتکرار -->
          <div class="pt-2">
            <span class="text-[11px] text-ink-400 block mb-2 font-bold">واژگان پربسامد و کلیدی:</span>
            <div class="flex flex-wrap gap-1.5">
              <span
                v-for="kw in comparison.poet2.topKeywords"
                :key="kw.word"
                class="px-2 py-0.5 rounded-lg bg-paper-warm dark:bg-paper-dark text-ink-700 dark:text-ink-300 text-[11px]"
              >
                {{ kw.word }} ({{ toPersianDigits(kw.count) }})
              </span>
            </div>
          </div>
        </div>
      </div>

      <!-- اوزان مشترک دو سخن‌سرا -->
      <div class="p-6 rounded-3xl bg-paper-light dark:bg-paper-surface border border-ink-200/80 dark:border-paper-border shadow-soft space-y-4">
        <h3 class="text-sm font-bold text-ink-900 dark:text-ink-50 flex items-center gap-2">
          <Music class="w-4 h-4 text-brand-600" />
          <span>اوزان عروضی مشترک بین هر دو شاعر</span>
        </h3>

        <div v-if="comparison.sharedMetres.length > 0" class="overflow-x-auto">
          <table class="w-full text-right text-xs">
            <thead>
              <tr class="border-b border-ink-200/60 dark:border-paper-border text-ink-400">
                <th class="py-2.5 px-3">ریتم و ارکان عروضی</th>
                <th class="py-2.5 px-3 text-center">{{ comparison.poet1.poetName }}</th>
                <th class="py-2.5 px-3 text-center">{{ comparison.poet2.poetName }}</th>
                <th class="py-2.5 px-3 text-left">عملیات</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-ink-200/40 dark:divide-paper-border">
              <tr
                v-for="sm in comparison.sharedMetres"
                :key="sm.rhythm"
                class="hover:bg-paper-warm/40 dark:hover:bg-paper-dark/40"
              >
                <td class="py-3 px-3 font-mono font-medium text-ink-800 dark:text-ink-200">
                  {{ sm.rhythm }}
                </td>
                <td class="py-3 px-3 text-center font-bold text-brand-600">
                  {{ toPersianDigits(sm.count1) }} شعر
                </td>
                <td class="py-3 px-3 text-center font-bold text-indigo-600">
                  {{ toPersianDigits(sm.count2) }} شعر
                </td>
                <td class="py-3 px-3 text-left">
                  <router-link
                    :to="`/search?rhythm=${encodeURIComponent(sm.rhythm)}`"
                    class="text-xs font-bold text-brand-600 hover:underline"
                  >
                    مشاهده اشعار
                  </router-link>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <div v-else class="text-xs text-ink-400 text-center py-4">
          وزن عروضی مشترک شاخصی در اشعار دانلودشده این دو شاعر یافت نشد.
        </div>
      </div>
    </template>

    <!-- راهنمای انتخاب -->
    <div
      v-else-if="!isLoading"
      class="p-12 rounded-3xl bg-paper-light dark:bg-paper-surface border border-ink-200/80 dark:border-paper-border text-center space-y-3"
    >
      <Scale class="w-12 h-12 text-ink-300 mx-auto" />
      <h3 class="text-base font-bold text-ink-800 dark:text-ink-200">
        دو شاعر را برای مقایسه برگزینید
      </h3>
      <p class="text-xs text-ink-500 max-w-sm mx-auto">
        مثلاً مقایسه «حافظ» و «سعدی» یا «فردوسی» و «نظامی» را بررسی کنید تا تفاوت سبک و وزن‌های محبوب آن‌ها را مشاهده نمایید.
      </p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useRoute } from 'vue-router';
import { useDataStore } from '../stores/dataStore';
import { poetAnalytics, type PoetComparisonResult } from '../services/PoetAnalyticsService';
import { toPersianDigits } from '../utils/persianNormalizer';
import LoadingState from '../components/common/LoadingState.vue';
import { Scale, Music } from 'lucide-vue-next';

var route = useRoute();
var dataStore = useDataStore();

var selectedPoet1Slug = ref<string>('');
var selectedPoet2Slug = ref<string>('');
var isLoading = ref<boolean>(false);
var comparison = ref<PoetComparisonResult | null>(null);

var availablePoets = computed(function () {
  return dataStore.poets;
});

function getSlug(p: any): string {
  if (!p) return '';
  return p.FullUrl ? p.FullUrl.replace(/^\/+|\/+$/g, '') : (p.Slug || '');
}

onMounted(async function () {
  await dataStore.init();

  if (route.query.poet1) {
    selectedPoet1Slug.value = String(route.query.poet1);
  }
  if (route.query.poet2) {
    selectedPoet2Slug.value = String(route.query.poet2);
  }

  // انتخاب پیش‌فرض اگر شاعر مشخص نشده بود
  if (!selectedPoet1Slug.value && availablePoets.value.length > 0) {
    selectedPoet1Slug.value = getSlug(availablePoets.value[0]);
  }
  if (!selectedPoet2Slug.value && availablePoets.value.length > 1) {
    selectedPoet2Slug.value = getSlug(availablePoets.value[1]);
  }

  if (selectedPoet1Slug.value && selectedPoet2Slug.value) {
    await onCompare();
  }
});

async function onCompare() {
  if (!selectedPoet1Slug.value || !selectedPoet2Slug.value) return;
  isLoading.value = true;
  try {
    comparison.value = await poetAnalytics.comparePoets(
      selectedPoet1Slug.value,
      selectedPoet2Slug.value
    );
  } finally {
    isLoading.value = false;
  }
}
</script>
