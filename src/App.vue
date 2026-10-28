<template>
  <div class="min-h-screen bg-paper-light dark:bg-paper-dark text-ink-900 dark:text-ink-50 flex transition-colors">
    <!-- نوار شناور خروج از حالت مطالعه هنگام فعال بودن Reading Mode -->
    <div
      v-if="appStore.readingMode"
      class="fixed top-4 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 p-2 rounded-2xl bg-paper-light/95 dark:bg-paper-surface/95 border border-brand-500/40 shadow-xl backdrop-blur-md text-xs font-medium"
    >
      <button
        @click="appStore.readingMode = false"
        class="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-bold transition-all active:scale-95 shadow-xs"
        title="خروج از حالت مطالعه متمرکز"
      >
        <Minimize2 class="w-3.5 h-3.5" />
        <span>خروج از حالت مطالعه</span>
      </button>

      <button
        @click="appStore.showLiteraryTags = !appStore.showLiteraryTags"
        class="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-ink-200 dark:border-paper-border hover:bg-ink-100 dark:hover:bg-paper-dark text-ink-700 dark:text-ink-300 transition-colors"
        :title="appStore.showLiteraryTags ? 'مخفی‌سازی خط‌چین و نشانگر آرایه‌ها' : 'نمایش نشانگر آرایه‌های ادبی'"
      >
        <Sparkles v-if="appStore.showLiteraryTags" class="w-3.5 h-3.5 text-brand-600" />
        <EyeOff v-else class="w-3.5 h-3.5 text-ink-500" />
        <span>{{ appStore.showLiteraryTags ? 'آرایه‌ها روشن' : 'آرایه‌ها خاموش' }}</span>
      </button>

      <button
        @click="appStore.showCoupletSummary = !appStore.showCoupletSummary"
        class="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-ink-200 dark:border-paper-border hover:bg-ink-100 dark:hover:bg-paper-dark text-ink-700 dark:text-ink-300 transition-colors"
        :title="appStore.showCoupletSummary ? 'مخفی‌سازی کادرهای شرح و مفهوم زیر بیت‌ها' : 'نمایش شرح و مفهوم زیر ابیات'"
      >
        <BookOpenText v-if="appStore.showCoupletSummary" class="w-3.5 h-3.5 text-brand-600" />
        <FileText v-else class="w-3.5 h-3.5 text-ink-400" />
        <span>{{ appStore.showCoupletSummary ? 'مفهوم روشن' : 'مفهوم خاموش' }}</span>
      </button>

      <div class="flex items-center gap-1 border-r border-ink-200/60 dark:border-paper-border pr-2">
        <button
          @click="appStore.fontSize > 16 && (appStore.fontSize -= 2)"
          class="w-6 h-6 rounded-lg border border-ink-200 dark:border-paper-border flex items-center justify-center font-bold"
        >
          -
        </button>
        <span class="w-5 text-center font-bold text-brand-600">{{ toPersianDigits(appStore.fontSize) }}</span>
        <button
          @click="appStore.fontSize < 32 && (appStore.fontSize += 2)"
          class="w-6 h-6 rounded-lg border border-ink-200 dark:border-paper-border flex items-center justify-center font-bold"
        >
          +
        </button>
      </div>
    </div>

    <!-- سایدبار ناوبری دسکتاپ (تنها در حالت غیر مطالعه) -->
    <SidebarNav v-if="!appStore.readingMode" />

    <!-- محتوای اصلی صفحات -->
    <div class="flex-1 flex flex-col min-w-0">
      <AppHeader
        v-if="!appStore.readingMode"
        :title="currentTitle"
        :show-back="showBack"
      />

      <main
        class="flex-1 w-full mx-auto px-4 sm:px-6 lg:px-8 transition-all"
        :class="[
          appStore.readingMode
            ? 'max-w-4xl pt-16 pb-16'
            : 'max-w-6xl pt-6 pb-24 md:pb-12'
        ]"
      >
        <router-view v-slot="{ Component }">
          <transition name="fade" mode="out-in">
            <component :is="Component" />
          </transition>
        </router-view>
      </main>

      <!-- ناوبری پایین صفحه موبایل (تنها در حالت غیر مطالعه) -->
      <BottomNav v-if="!appStore.readingMode" />
    </div>

    <!-- توست به‌روزرسانی PWA -->
    <UpdateToast />

    <!-- نشانگر سراسری ارتباط با سرور و پنجرهٔ وضعیت دانلود -->
    <GlobalActivityIndicator />
    <DownloadProgressModal />
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useAppStore } from './stores/appStore';
import { useDataStore } from './stores/dataStore';
import { toPersianDigits } from './utils/persianNormalizer';
import SidebarNav from './components/common/SidebarNav.vue';
import BottomNav from './components/common/BottomNav.vue';
import AppHeader from './components/common/AppHeader.vue';
import UpdateToast from './components/UpdateToast.vue';
import GlobalActivityIndicator from './components/common/GlobalActivityIndicator.vue';
import DownloadProgressModal from './components/common/DownloadProgressModal.vue';
import { Minimize2, Eye, EyeOff, Sparkles, BookOpenText, FileText } from 'lucide-vue-next';

var route = useRoute();
var router = useRouter();
var appStore = useAppStore();
var dataStore = useDataStore();

onMounted(async function () {
  await dataStore.init();

  // میانبر کیبورد دسکتاپ برای جست‌وجو (Ctrl+K)
  window.addEventListener('keydown', function (e) {
    if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
      e.preventDefault();
      router.push('/search');
    }
    // خروج از حالت مطالعه با دکمه Escape
    if (e.key === 'Escape' && appStore.readingMode) {
      appStore.readingMode = false;
    }
  });
});

var showBack = computed(function () {
  return route.path !== '/';
});

var currentTitle = computed(function () {
  if (route.name === 'Home') return 'غـــــزل';
  if (route.name === 'Poets') return 'شاعران و دیوان‌ها';
  if (route.name === 'Search') return 'جست‌وجوی شعر';
  if (route.name === 'Faal') return 'فال حافظ';
  if (route.name === 'Memorize') return 'حفظ شعر و آزمون';
  if (route.name === 'Education') return 'آموزش و آرایه‌ها';
  if (route.name === 'Explore') return 'کاوش و تبارشناسی';
  if (route.name === 'Settings') return 'تنظیمات و داده‌ها';
  return '';
});
</script>

<style>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.15s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>