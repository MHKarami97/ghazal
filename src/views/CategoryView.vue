<template>
  <div class="space-y-6 pb-12">
    <!-- وضعیت لودینگ -->
    <LoadingState v-if="isLoading" message="در حال بارگذاری اشعار دفتر..." />

    <template v-else-if="category">
      <!-- سربرگ دفتر -->
      <div class="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-6 rounded-3xl bg-paper-light dark:bg-paper-surface border border-ink-200/80 dark:border-paper-border shadow-soft">
        <div>
          <h2 class="text-xl sm:text-2xl font-black text-ink-900 dark:text-ink-50">
            {{ category.Title }}
          </h2>
          <p v-if="category.Description" class="text-xs text-ink-500 mt-1">
            {{ category.Description }}
          </p>
        </div>

        <!-- دکمه دانلود آفلاین این دفتر -->
        <button
          @click="downloadThisCategory"
          :disabled="isDownloading"
          class="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-brand-600 hover:bg-brand-700 disabled:opacity-50 text-white font-bold text-xs shadow-sm transition-colors"
        >
          <Download class="w-4 h-4" />
          <span>{{ isDownloading ? 'در حال دانلود...' : 'دانلود آفلاین این دفتر' }}</span>
        </button>
      </div>

      <!-- اگر زیردسته‌های بیشتری دارد -->
      <div v-if="category.ChildCats && category.ChildCats.length" class="space-y-3">
        <h3 class="text-sm font-bold text-ink-600 dark:text-ink-400">
          بخش‌های فرعی:
        </h3>
        <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
          <router-link
            v-for="sub in category.ChildCats"
            :key="sub.Id"
            :to="getCategoryRoute(sub.FullUrl)"
            class="p-4 rounded-xl bg-paper-light dark:bg-paper-surface border border-ink-200/80 dark:border-paper-border hover:border-brand-500/50 text-xs font-bold text-ink-800 dark:text-ink-200 transition-all flex items-center justify-between"
          >
            <span>{{ sub.Title }}</span>
            <ChevronLeft class="w-4 h-4 text-ink-400" />
          </router-link>
        </div>
      </div>

      <!-- فهرست اشعار دفتر -->
      <div v-if="category.Poems && category.Poems.length" class="space-y-3">
        <div class="flex items-center justify-between text-xs text-ink-500">
          <span>شامل {{ toPersianDigits(category.Poems.length) }} شعر</span>
        </div>

        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          <router-link
            v-for="poem in category.Poems"
            :key="poem.Id"
            :to="getPoemRoute(poem.FullUrl)"
            class="p-4 rounded-xl bg-paper-light dark:bg-paper-surface border border-ink-200/80 dark:border-paper-border hover:border-brand-500/50 hover:bg-brand-50/20 text-xs font-medium text-ink-900 dark:text-ink-100 transition-all flex items-center justify-between shadow-2xs"
          >
            <span class="line-clamp-1">{{ poem.Title }}</span>
            <ChevronLeft class="w-4 h-4 text-ink-400 flex-shrink-0" />
          </router-link>
        </div>
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed, watch } from 'vue';
import { useRoute } from 'vue-router';
import { cdnClient } from '../services/CDNClient';
import { useDataStore } from '../stores/dataStore';
import { toPersianDigits } from '../utils/persianNormalizer';
import LoadingState from '../components/common/LoadingState.vue';
import type { GanjoorCategory } from '../types/ganjoor';
import { Download, ChevronLeft } from 'lucide-vue-next';

var route = useRoute();
var dataStore = useDataStore();

var poetSlug = computed(function () {
  return (route.params.poetSlug as string) || '';
});

var catPath = computed(function () {
  var p = route.params.catPath;
  if (Array.isArray(p)) return p.join('/');
  return String(p || '');
});

var category = ref<GanjoorCategory | null>(null);
var isLoading = ref<boolean>(true);

onMounted(loadCategory);
watch(() => route.params, loadCategory);

async function loadCategory() {
  isLoading.value = true;
  try {
    category.value = await cdnClient.getCategory(poetSlug.value, catPath.value);
  } catch (err) {
    console.error('Error loading category:', err);
  } finally {
    isLoading.value = false;
  }
}

var isDownloading = computed(function () {
  var pkgId = `cat:${poetSlug.value}:${catPath.value}`;
  return dataStore.activeProgress[pkgId]?.status === 'downloading';
});

async function downloadThisCategory() {
  if (category.value) {
    await dataStore.downloadCategory(poetSlug.value, catPath.value, category.value.Title);
  }
}

function getCategoryRoute(fullUrl: string): string {
  var clean = fullUrl.replace(`/${poetSlug.value}`, '').replace(/^\//, '');
  return `/poet/${poetSlug.value}/cat/${clean}`;
}

function getPoemRoute(fullUrl: string): string {
  var clean = fullUrl.replace(/^\/+|\/+$/g, '');
  return `/read/${clean}`;
}
</script>
