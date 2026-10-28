<template>
  <div class="space-y-8 pb-12">
    <!-- بخش سربرگ خوش‌آمدگویی و بنر فال -->
    <div class="relative overflow-hidden rounded-3xl bg-gradient-to-br from-brand-600 via-brand-700 to-brand-900 text-white p-6 sm:p-8 shadow-xl">
      <div class="relative z-10 max-w-xl">
        <span class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-white/20 text-white mb-4 backdrop-blur-xs">
          <Sparkles class="w-3.5 h-3.5" />
          تفأل به لسان‌الغیب
        </span>
        <h2 class="text-2xl sm:text-3xl font-black mb-2 leading-tight">
          فال حافظ؛ نیت کن و بگشای
        </h2>
        <p class="text-white/80 text-sm mb-6 leading-relaxed">
          نیت خیری در دل بنشان و با زمزمهٔ فاتحه‌ای، صفحه‌ای از دیوان حافظ شیرازی را باز کن.
        </p>
        <router-link
          to="/faal"
          class="inline-flex items-center gap-2 py-3 px-6 rounded-2xl bg-white text-brand-900 font-bold text-sm shadow-lg hover:bg-brand-50 transition-all active:scale-95"
        >
          نیت و گرفتن فال
          <ChevronLeft class="w-4 h-4" />
        </router-link>
      </div>

      <!-- نقش تزیینی ترنج در پس‌زمینه -->
      <div class="absolute -left-12 -bottom-12 w-64 h-64 rounded-full bg-white/5 pointer-events-none blur-xl"></div>
    </div>

    <!-- کارت شعر امروز -->
    <div
      v-if="isPoemLoading"
      class="p-6 rounded-3xl bg-paper-light dark:bg-paper-surface border border-ink-200/80 dark:border-paper-border shadow-soft"
    >
      <div class="flex items-center gap-2 mb-2">
        <Calendar class="w-4 h-4 text-brand-600" />
        <h3 class="font-bold text-sm text-ink-900 dark:text-ink-50">شعر امروز</h3>
      </div>
      <LoadingState message="در حال دریافت شعر امروز..." />
    </div>
    <div
      v-else-if="!poemOfTheDay"
      class="p-6 rounded-3xl bg-paper-light dark:bg-paper-surface border border-ink-200/80 dark:border-paper-border shadow-soft text-center space-y-3"
    >
      <p class="text-sm text-ink-600 dark:text-ink-300">دریافت شعر امروز ناموفق بود. اتصال اینترنت را بررسی کنید.</p>
      <button
        @click="loadPoemOfTheDay"
        class="inline-flex items-center gap-2 px-5 py-2 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-bold text-xs shadow-md transition-colors"
      >
        تلاش مجدد
      </button>
    </div>
    <div v-else class="p-6 rounded-3xl bg-paper-light dark:bg-paper-surface border border-ink-200/80 dark:border-paper-border shadow-soft">
      <div class="flex items-center justify-between mb-4 pb-3 border-b border-ink-200/60 dark:border-paper-border">
        <div class="flex items-center gap-2">
          <Calendar class="w-4 h-4 text-brand-600" />
          <h3 class="font-bold text-sm text-ink-900 dark:text-ink-50">
            شعر امروز
          </h3>
        </div>
        <router-link
          :to="getPoemRoute(poemOfTheDay.FullUrl)"
          class="text-xs font-bold text-brand-600 dark:text-brand-400 hover:underline flex items-center gap-1"
        >
          خواندن کامل غزل
          <ChevronLeft class="w-3.5 h-3.5" />
        </router-link>
      </div>

      <div class="poem-beyt font-vazir text-center my-6" :style="{ fontSize: `${appStore.fontSize}px` }">
        <div class="poem-misra font-bold text-ink-900 dark:text-ink-50">
          {{ poemOfTheDay.Verses[0]?.Text }}
        </div>
        <div class="poem-misra font-bold text-ink-900 dark:text-ink-50">
          {{ poemOfTheDay.Verses[1]?.Text }}
        </div>
      </div>

      <div class="flex items-center justify-between text-xs text-ink-500 pt-3 border-t border-ink-200/60 dark:border-paper-border">
        <span>{{ poemOfTheDay.FullTitle }}</span>
        <button
          @click="openCardExport(poemOfTheDay.Verses[0]?.Text, poemOfTheDay.Verses[1]?.Text, poemOfTheDay.FullTitle?.split('»')?.[0]?.trim() || 'حافظ')"
          class="flex items-center gap-1 text-brand-600 hover:underline"
        >
          <Share2 class="w-3.5 h-3.5" />
          کارت اشتراک
        </button>
      </div>
    </div>

    <!-- میانبر مرور کارت‌های حفظ روزانه -->
    <div
      v-if="memorizeStore.dueCards.length > 0"
      class="p-5 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-between"
    >
      <div class="flex items-center gap-3">
        <div class="w-10 h-10 rounded-xl bg-amber-500 text-white flex items-center justify-center font-bold">
          <Brain class="w-5 h-5" />
        </div>
        <div>
          <h4 class="font-bold text-sm text-ink-900 dark:text-ink-100">
            {{ toPersianDigits(memorizeStore.dueCards.length) }} بیت آماده برای مرور امروز
          </h4>
          <p class="text-xs text-ink-500">
            با مرور به موقع بر اساس الگوریتم تکرار فاصله‌دار SM-2، اشعار را در حافظه بلندمدت تثبیت کنید.
          </p>
        </div>
      </div>
      <router-link
        to="/memorize"
        class="py-2.5 px-4 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs transition-colors shadow-xs"
      >
        شروع مرور
      </router-link>
    </div>

    <!-- بخش کشف و امکانات نوین غزل -->
    <div>
      <div class="flex items-center justify-between mb-4">
        <h3 class="font-bold text-base text-ink-900 dark:text-ink-50">
          امکانات و گنجینه‌های ویژه غزل
        </h3>
        <span class="text-xs text-ink-500">ابزارهای نوین مطالعه، یادگیری و اشتراک</span>
      </div>

      <div class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        <router-link
          to="/memorize/daily-challenge"
          class="p-4 rounded-2xl bg-paper-light dark:bg-paper-surface border border-ink-200/80 dark:border-paper-border hover:border-amber-500/50 hover:shadow-soft transition-all text-center space-y-2 group"
        >
          <div class="w-10 h-10 mx-auto rounded-xl bg-amber-500/10 text-amber-600 flex items-center justify-center font-bold group-hover:scale-110 transition-transform">
            <CalendarDays class="w-5 h-5" />
          </div>
          <div class="text-xs font-bold text-ink-900 dark:text-ink-100 group-hover:text-amber-600 transition-colors">
            چالش روزانه
          </div>
          <div class="text-[10px] text-ink-400">یک بیت، یک معما</div>
        </router-link>

        <router-link
          to="/metres"
          class="p-4 rounded-2xl bg-paper-light dark:bg-paper-surface border border-ink-200/80 dark:border-paper-border hover:border-brand-500/50 hover:shadow-soft transition-all text-center space-y-2 group"
        >
          <div class="w-10 h-10 mx-auto rounded-xl bg-brand-500/10 text-brand-600 flex items-center justify-center font-bold group-hover:scale-110 transition-transform">
            <Music class="w-5 h-5" />
          </div>
          <div class="text-xs font-bold text-ink-900 dark:text-ink-100 group-hover:text-brand-600 transition-colors">
            موسیقی و وزن‌ها
          </div>
          <div class="text-[10px] text-ink-400">شاهنامه، مثنوی، دوبیتی</div>
        </router-link>

        <router-link
          to="/dialects"
          class="p-4 rounded-2xl bg-paper-light dark:bg-paper-surface border border-ink-200/80 dark:border-paper-border hover:border-brand-500/50 hover:shadow-soft transition-all text-center space-y-2 group"
        >
          <div class="w-10 h-10 mx-auto rounded-xl bg-brand-500/10 text-brand-600 flex items-center justify-center font-bold group-hover:scale-110 transition-transform">
            <Globe2 class="w-5 h-5" />
          </div>
          <div class="text-xs font-bold text-ink-900 dark:text-ink-100 group-hover:text-brand-600 transition-colors">
            شعر در گویش‌ها
          </div>
          <div class="text-[10px] text-ink-400">طبری، ترکی، کردی و...</div>
        </router-link>

        <router-link
          to="/collections"
          class="p-4 rounded-2xl bg-paper-light dark:bg-paper-surface border border-ink-200/80 dark:border-paper-border hover:border-brand-500/50 hover:shadow-soft transition-all text-center space-y-2 group"
        >
          <div class="w-10 h-10 mx-auto rounded-xl bg-brand-500/10 text-brand-600 flex items-center justify-center font-bold group-hover:scale-110 transition-transform">
            <BookmarkCheck class="w-5 h-5" />
          </div>
          <div class="text-xs font-bold text-ink-900 dark:text-ink-100 group-hover:text-brand-600 transition-colors">
            مجموعه‌های من
          </div>
          <div class="text-[10px] text-ink-400">دفترها و خروجی PDF</div>
        </router-link>

        <router-link
          to="/compare"
          class="p-4 rounded-2xl bg-paper-light dark:bg-paper-surface border border-ink-200/80 dark:border-paper-border hover:border-brand-500/50 hover:shadow-soft transition-all text-center space-y-2 group"
        >
          <div class="w-10 h-10 mx-auto rounded-xl bg-brand-500/10 text-brand-600 flex items-center justify-center font-bold group-hover:scale-110 transition-transform">
            <Scale class="w-5 h-5" />
          </div>
          <div class="text-xs font-bold text-ink-900 dark:text-ink-100 group-hover:text-brand-600 transition-colors">
            مقایسه دو شاعر
          </div>
          <div class="text-[10px] text-ink-400">سنجش سبک و اوزان</div>
        </router-link>
      </div>
    </div>

    <!-- بسته‌های محبوب شعر پارسی با وضعیت آفلاین -->
    <div>
      <div class="flex items-center justify-between mb-4">
        <div>
          <h3 class="font-bold text-base text-ink-900 dark:text-ink-50">
            دیوان‌های پیشنهادی
          </h3>
          <p class="text-xs text-ink-500">
            برای استفاده بدون نیاز به اینترنت، شاعر مورد نظر خود را دانلود کنید.
          </p>
        </div>
        <router-link to="/poets" class="text-xs font-bold text-brand-600 dark:text-brand-400 hover:underline">
          مشاهده همه شاعران
        </router-link>
      </div>

      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <div
          v-for="poet in featuredPoets"
          :key="poet.slug"
          class="p-5 rounded-2xl bg-paper-light dark:bg-paper-surface border border-ink-200/80 dark:border-paper-border hover:border-brand-500/40 shadow-xs transition-all flex flex-col justify-between"
        >
          <div class="flex items-start justify-between mb-3">
            <div>
              <router-link :to="`/poet/${poet.slug}`" class="font-bold text-base text-ink-900 dark:text-ink-100 hover:text-brand-600">
                {{ poet.name }}
              </router-link>
              <div class="text-xs text-ink-500 mt-0.5">
                {{ poet.period }}
              </div>
            </div>
            <div class="w-8 h-8 rounded-full bg-brand-500/10 text-brand-600 flex items-center justify-center font-bold text-xs">
              {{ poet.name.slice(0, 1) }}
            </div>
          </div>

          <div class="flex items-center justify-between pt-3 border-t border-ink-200/60 dark:border-paper-border text-xs">
            <!-- وضعیت نصب -->
            <span
              v-if="dataStore.isPoetInstalled(poet.slug)"
              class="inline-flex items-center gap-1 text-emerald-600 font-medium"
            >
              <CheckCircle class="w-4 h-4" />
              آفلاین و آماده
            </span>
            <DownloadButton
              v-else
              variant="link"
              :package-id="`poet:${poet.slug}`"
              :idle-label="`دانلود آفلاین (${poet.approxSize})`"
              @start="downloadPoet(poet)"
            />

            <router-link
              :to="`/poet/${poet.slug}`"
              class="text-ink-500 hover:text-ink-800 dark:hover:text-ink-200"
            >
              ورود به دیوان »
            </router-link>
          </div>
        </div>
      </div>
    </div>

    <!-- مدال تولید کارت شعر -->
    <CardExportModal
      :show="showCardModal"
      :first-misra="cardFirst"
      :second-misra="cardSecond"
      :poet-name="cardPoet"
      @close="showCardModal = false"
    />
  </div>
</template>

<script setup lang="ts">
import LoadingState from '../components/common/LoadingState.vue';
import DownloadButton from '../components/common/DownloadButton.vue';
import { ref, onMounted } from 'vue';
import { useAppStore } from '../stores/appStore';
import { useDataStore } from '../stores/dataStore';
import { useMemorizeStore } from '../stores/memorizeStore';
import { fortuneService } from '../services/FortuneService';
import { toPersianDigits } from '../utils/persianNormalizer';
import CardExportModal from '../components/common/CardExportModal.vue';
import type { GanjoorPoem } from '../types/ganjoor';
import {
  Sparkles,
  ChevronLeft,
  Calendar,
  Share2,
  Brain,
  Download,
  CheckCircle,
  CalendarDays,
  Music,
  Globe2,
  BookmarkCheck,
  Scale
} from 'lucide-vue-next';

var appStore = useAppStore();
var dataStore = useDataStore();
var memorizeStore = useMemorizeStore();

var poemOfTheDay = ref<GanjoorPoem | null>(null);
var isPoemLoading = ref<boolean>(true);

var showCardModal = ref<boolean>(false);
var cardFirst = ref<string>('');
var cardSecond = ref<string>('');
var cardPoet = ref<string>('');

var featuredPoets = [
  { name: 'حافظ شیرازی', slug: 'hafez', period: 'قرن هشتم هجری', approxSize: '۲ مگابایت' },
  { name: 'سعدی شیرازی', slug: 'saadi', period: 'قرن هفتم هجری', approxSize: '۳ مگابایت' },
  { name: 'مولانا جلال‌الدین', slug: 'moulavi', period: 'قرن هفتم هجری', approxSize: '۶ مگابایت' },
  { name: 'خیام نیشابوری', slug: 'khayyam', period: 'قرن پنجم هجری', approxSize: '۱۰۰ کیلوبایت' },
  { name: 'فردوسی طوسی', slug: 'ferdousi', period: 'قرن چهارم هجری', approxSize: '۱۰ مگابایت' },
  { name: 'پروین اعتصامی', slug: 'parvin', period: 'معاصر', approxSize: '۵۰۰ کیلوبایت' }
];

onMounted(async function () {
  await Promise.all([
    loadPoemOfTheDay(),
    dataStore.init(),
    memorizeStore.init()
  ]);
});

async function loadPoemOfTheDay() {
  isPoemLoading.value = true;
  try {
    poemOfTheDay.value = await fortuneService.getPoemOfTheDay();
  } catch (e) {
    poemOfTheDay.value = null;
    console.error('Poem of the day error:', e);
  } finally {
    isPoemLoading.value = false;
  }
}

function getPoemRoute(fullUrl: string): string {
  // e.g. /hafez/ghazal/sh1 -> /read/hafez/ghazal/sh1
  var clean = fullUrl.replace(/^\/+|\/+$/g, '');
  return `/read/${clean}`;
}

function openCardExport(first: string, second: string, poet: string) {
  cardFirst.value = first;
  cardSecond.value = second;
  cardPoet.value = poet;
  showCardModal.value = true;
}

async function downloadPoet(poet: { name: string; slug: string }) {
  await dataStore.downloadPoet(poet.slug, poet.name);
}
</script>