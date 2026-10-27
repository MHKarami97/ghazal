<template>
  <div class="space-y-8 pb-12">
    <!-- عنوان و تب‌های آموزشی -->
    <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
      <div>
        <h2 class="text-2xl font-black text-ink-900 dark:text-ink-50">
          دانشنامه و آموزش ادبی
        </h2>
        <p class="text-xs text-ink-500 mt-1">
          آشنایی با صنایع بلاغی (بدیع و بیان)، اوزان عروضی و منابع پژوهش دانشگاهی
        </p>
      </div>

      <!-- تب‌های سوئیچ -->
      <div class="flex bg-ink-200/60 dark:bg-paper-surface p-1 rounded-2xl">
        <button
          @click="activeTab = 'devices'"
          class="px-4 py-2 rounded-xl text-xs font-bold transition-all"
          :class="activeTab === 'devices' ? 'bg-paper-light dark:bg-paper-dark text-brand-700 dark:text-brand-300 shadow-xs' : 'text-ink-600 dark:text-ink-400'"
        >
          آرایه‌های ادبی
        </button>
        <button
          @click="activeTab = 'metres'"
          class="px-4 py-2 rounded-xl text-xs font-bold transition-all"
          :class="activeTab === 'metres' ? 'bg-paper-light dark:bg-paper-dark text-brand-700 dark:text-brand-300 shadow-xs' : 'text-ink-600 dark:text-ink-400'"
        >
          اوزان عروضی
        </button>
        <button
          @click="activeTab = 'sources'"
          class="px-4 py-2 rounded-xl text-xs font-bold transition-all"
          :class="activeTab === 'sources' ? 'bg-paper-light dark:bg-paper-dark text-brand-700 dark:text-brand-300 shadow-xs' : 'text-ink-600 dark:text-ink-400'"
        >
          منابع و مجوزها
        </button>
      </div>
    </div>

    <!-- وضعیت لودینگ -->
    <LoadingState v-if="literaryStore.isLoading" message="در حال دریافت داده‌های آموزشی..." />

    <!-- تب ۱: آرایه‌های ادبی -->
    <div v-else-if="activeTab === 'devices'" class="space-y-4">
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div
          v-for="dev in literaryStore.devices"
          :key="dev.Id"
          class="p-5 rounded-3xl bg-paper-light dark:bg-paper-surface border border-ink-200/80 dark:border-paper-border shadow-soft flex flex-col justify-between"
        >
          <div>
            <div class="flex items-center justify-between mb-2">
              <h3 class="font-bold text-base text-brand-800 dark:text-brand-200">
                {{ dev.Name }}
              </h3>
              <span class="text-[11px] px-2.5 py-0.5 rounded-full bg-brand-500/10 text-brand-700 dark:text-brand-300 font-medium">
                {{ dev.Category === 'Bayan' ? 'علم بیان' : 'علم بدیع' }}
              </span>
            </div>

            <p class="text-xs text-ink-700 dark:text-ink-300 leading-relaxed mb-4">
              {{ dev.Definition }}
            </p>

            <!-- اسلات‌های آرایه (اجزا: مشبه، مشبه‌به و...) -->
            <div v-if="dev.Slots && dev.Slots.length" class="mb-4">
              <span class="text-[10px] font-bold text-ink-400 block mb-1.5">ارکان و مؤلفه‌ها:</span>
              <div class="flex flex-wrap gap-1.5">
                <span
                  v-for="s in dev.Slots"
                  :key="s.Id"
                  class="text-[10px] px-2 py-0.5 rounded-md bg-ink-100 dark:bg-paper-dark text-ink-600 dark:text-ink-400"
                >
                  {{ s.Name }}
                </span>
              </div>
            </div>
          </div>

          <!-- مثال شاخص -->
          <div v-if="dev.Example" class="p-3 rounded-2xl bg-paper-warm/80 dark:bg-paper-dark/60 border border-brand-500/20 text-xs">
            <div class="text-[10px] font-bold text-brand-600 dark:text-brand-400 mb-1">
              مثال نمونه:
            </div>
            <div class="text-ink-700 dark:text-ink-300 italic">
              {{ dev.Example }}
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- تب ۲: اوزان عروضی -->
    <div v-else-if="activeTab === 'metres'" class="space-y-4">
      <div class="p-4 rounded-2xl bg-paper-warm/70 dark:bg-paper-surface/60 border border-ink-200 dark:border-paper-border text-xs text-ink-600 dark:text-ink-300">
        وزن شعر، آهنگ و موسیقی کلام موزون پارسی است. در زیر مجموعه‌ای از ۲۱۲ وزن عروضی شعر فارسی ثبت‌شده در گنجور را مشاهده می‌کنید:
      </div>

      <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div
          v-for="m in literaryStore.metres"
          :key="m.Id"
          class="p-4 rounded-2xl bg-paper-light dark:bg-paper-surface border border-ink-200/80 dark:border-paper-border flex items-center justify-between"
        >
          <div>
            <div class="font-bold text-sm text-ink-900 dark:text-ink-100 mb-1">
              {{ m.Rhythm }}
            </div>
            <div class="text-[10px] text-ink-400">
              شناسه وزن عروضی: {{ toPersianDigits(m.Id) }}
            </div>
          </div>

          <router-link
            :to="`/search?rhythm=${encodeURIComponent(m.Rhythm)}`"
            class="text-xs font-bold text-brand-600 dark:text-brand-400 hover:underline"
          >
            اشعار این وزن »
          </router-link>
        </div>
      </div>
    </div>

    <!-- تب ۳: منابع و مجوزهای پژوهشی -->
    <div v-else-if="activeTab === 'sources'" class="space-y-4">
      <div
        v-for="src in literaryStore.sources"
        :key="src.Key"
        class="p-6 rounded-3xl bg-paper-light dark:bg-paper-surface border border-ink-200/80 dark:border-paper-border space-y-4 shadow-soft"
      >
        <div class="flex items-center justify-between">
          <h3 class="font-bold text-base text-brand-800 dark:text-brand-300">
            {{ src.Title }}
          </h3>
          <span class="text-xs px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300 font-bold">
            مجوز {{ src.License }}
          </span>
        </div>

        <div class="text-xs text-ink-600 dark:text-ink-400 whitespace-pre-line leading-relaxed">
          <span class="font-bold">پدیدآورندگان:</span> {{ src.Authors }}
        </div>

        <p class="text-xs text-ink-700 dark:text-ink-300 leading-relaxed">
          {{ src.Description }}
        </p>

        <div class="pt-3 border-t border-ink-200/60 dark:border-paper-border flex items-center justify-between text-xs">
          <a
            :href="src.Url"
            target="_blank"
            rel="noopener noreferrer"
            class="text-brand-600 dark:text-brand-400 font-bold hover:underline"
          >
            مشاهده اصل سند علمی در Zenodo / DOI »
          </a>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useLiteraryStore } from '../stores/literaryStore';
import { toPersianDigits } from '../utils/persianNormalizer';
import LoadingState from '../components/common/LoadingState.vue';

var literaryStore = useLiteraryStore();
var activeTab = ref<'devices' | 'metres' | 'sources'>('devices');

onMounted(async function () {
  await literaryStore.loadBaseMeta();
});
</script>
