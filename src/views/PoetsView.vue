<template>
  <div class="space-y-6 pb-12">
    <!-- عنوان و توضیح صفحه -->
    <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
      <div>
        <h2 class="text-2xl font-black text-ink-900 dark:text-ink-50">
          شاعران و سخن‌سرایان پارسی
        </h2>
        <p class="text-xs text-ink-500 mt-1">
          مجموعهٔ ۲۴۲ شاعر از گنجینهٔ ادبیات کهن و معاصر ایران‌زمین
        </p>
      </div>

      <!-- جست‌وجوی شاعر -->
      <div class="relative w-full sm:w-72">
        <input
          v-model="search"
          type="text"
          placeholder="جست‌وجوی نام شاعر..."
          class="w-full pr-10 pl-4 py-2.5 rounded-xl border border-ink-200 dark:border-paper-border bg-paper-light dark:bg-paper-surface text-ink-900 dark:text-ink-100 text-sm focus:ring-2 focus:ring-brand-500 outline-hidden"
        />
        <Search class="w-4 h-4 absolute right-3.5 top-3.5 text-ink-400" />
      </div>
    </div>

    <!-- وضعیت لودینگ اولیه -->
    <LoadingState v-if="dataStore.isLoadingManifest" message="در حال دریافت فهرست شاعران..." />

    <!-- شبکه کارت‌های شاعران -->
    <div v-else class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3.5">
      <div
        v-for="poet in filteredPoets"
        :key="poet.Id"
        class="group p-4 rounded-2xl bg-paper-light dark:bg-paper-surface border border-ink-200/80 dark:border-paper-border hover:border-brand-500/50 hover:shadow-md transition-all flex flex-col justify-between"
      >
        <router-link :to="`/poet${poet.FullUrl}`" class="block mb-3">
          <!-- نماد دایره‌ای با حرف اول -->
          <div class="w-12 h-12 rounded-2xl bg-gradient-to-br from-brand-50 to-brand-100 dark:from-paper-dark dark:to-paper-border border border-brand-500/20 text-brand-700 dark:text-brand-300 flex items-center justify-center font-black text-lg mb-3 group-hover:scale-105 transition-transform">
            {{ poet.Nickname.slice(0, 1) }}
          </div>

          <h3 class="font-bold text-sm text-ink-900 dark:text-ink-50 group-hover:text-brand-600 transition-colors line-clamp-1">
            {{ poet.Nickname }}
          </h3>
          <span class="text-[11px] text-ink-400">
            ورود به اشعار
          </span>
        </router-link>

        <!-- وضعیت دانلود آفلاین -->
        <div class="pt-2.5 border-t border-ink-200/60 dark:border-paper-border flex items-center justify-between text-xs">
          <span
            v-if="isDownloaded(poet.FullUrl)"
            class="text-[11px] font-bold text-emerald-600 flex items-center gap-1"
          >
            <CheckCircle class="w-3.5 h-3.5" />
            آفلاین
          </span>
          <button
            v-else
            @click="downloadPoet(poet)"
            :disabled="isDownloading(poet.FullUrl)"
            class="text-[11px] font-bold text-brand-600 dark:text-brand-400 hover:underline flex items-center gap-1"
          >
            <Download class="w-3.5 h-3.5" />
            <span>{{ isDownloading(poet.FullUrl) ? 'در حال دانلود...' : 'دانلود' }}</span>
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useDataStore } from '../stores/dataStore';
import LoadingState from '../components/common/LoadingState.vue';
import type { GanjoorPoetRef } from '../types/ganjoor';
import { Search, Download, CheckCircle } from 'lucide-vue-next';

var dataStore = useDataStore();
var search = ref<string>('');

onMounted(async function () {
  await dataStore.init();
});

var filteredPoets = computed(function () {
  var list = dataStore.poets;
  if (!search.value.trim()) return list;
  var q = search.value.trim();
  return list.filter(function (p) {
    return p.Nickname.includes(q);
  });
});

function getPoetSlug(fullUrl: string): string {
  return fullUrl.replace(/^\/+|\/+$/g, '');
}

function isDownloaded(fullUrl: string): boolean {
  var slug = getPoetSlug(fullUrl);
  return dataStore.isPoetInstalled(slug);
}

function isDownloading(fullUrl: string): boolean {
  var slug = getPoetSlug(fullUrl);
  var pkgId = `poet:${slug}`;
  return dataStore.activeProgress[pkgId]?.status === 'downloading';
}

async function downloadPoet(poet: GanjoorPoetRef) {
  var slug = getPoetSlug(poet.FullUrl);
  await dataStore.downloadPoet(slug, poet.Nickname);
}
</script>
