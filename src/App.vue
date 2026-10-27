<template>
  <div class="min-h-screen bg-paper-light dark:bg-paper-dark text-ink-900 dark:text-ink-50 flex transition-colors">
    <!-- سایدبار ناوبری ثابت دسکتاپ -->
    <SidebarNav />

    <!-- محتوای اصلی صفحات -->
    <div class="flex-1 flex flex-col min-w-0">
      <AppHeader
        :title="currentTitle"
        :show-back="showBack"
      />

      <main class="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 lg:px-8 pt-6 pb-24 md:pb-12">
        <router-view v-slot="{ Component }">
          <transition name="fade" mode="out-in">
            <component :is="Component" />
          </transition>
        </router-view>
      </main>

      <!-- ناوبری پایین صفحه موبایل -->
      <BottomNav />
    </div>

    <!-- توست به‌روزرسانی PWA -->
    <UpdateToast />
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useAppStore } from './stores/appStore';
import { useDataStore } from './stores/dataStore';
import SidebarNav from './components/common/SidebarNav.vue';
import BottomNav from './components/common/BottomNav.vue';
import AppHeader from './components/common/AppHeader.vue';
import UpdateToast from './components/UpdateToast.vue';

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
