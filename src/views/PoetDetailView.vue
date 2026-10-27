<template>
  <div class="space-y-8 pb-12">
    <!-- وضعیت بارگذاری -->
    <LoadingState v-if="isLoading" message="در حال دریافت اطلاعات دیوان و زندگینامه..." />

    <template v-else-if="poet">
      <!-- سربرگ بیوگرافی شاعر -->
      <div class="p-6 sm:p-8 rounded-3xl bg-paper-light dark:bg-paper-surface border border-ink-200/80 dark:border-paper-border shadow-soft">
        <div class="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-4">
          <div class="flex items-center gap-4">
            <div class="w-16 h-16 rounded-2xl bg-gradient-to-br from-brand-500 to-brand-700 text-white flex items-center justify-center font-black text-2xl shadow-md">
              {{ poet.Nickname.slice(0, 1) }}
            </div>
            <div>
              <h2 class="text-2xl font-black text-ink-900 dark:text-ink-50">
                {{ poet.Name || poet.Nickname }}
              </h2>
              <span class="text-xs text-ink-500">
                متخلص به «{{ poet.Nickname }}»
              </span>
            </div>
          </div>

          <!-- دکمه دانلود آفلاین کل دیوان -->
          <div>
            <span
              v-if="dataStore.isPoetInstalled(poetSlug)"
              class="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 font-bold text-xs"
            >
              <CheckCircle class="w-4 h-4" />
              کل دیوان دانلود شده (آفلاین)
            </span>
            <button
              v-else
              @click="downloadPoet"
              :disabled="isDownloading"
              class="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-700 disabled:opacity-50 text-white font-bold text-xs shadow-md transition-colors"
            >
              <Download class="w-4 h-4" />
              <span>{{ isDownloading ? 'در حال دانلود...' : 'دانلود آفلاین کل دیوان' }}</span>
            </button>
          </div>
        </div>

        <!-- متن زندگینامه -->
        <p v-if="poet.Description" class="text-xs sm:text-sm text-ink-700 dark:text-ink-300 leading-relaxed pt-4 border-t border-ink-200/60 dark:border-paper-border">
          {{ poet.Description }}
        </p>
      </div>

      <!-- ساختار دفاتر و بخش‌های دیوان (کتاب‌ها) -->
      <div>
        <h3 class="font-bold text-base text-ink-900 dark:text-ink-50 mb-4">
          دفاتر و بخش‌های دیوان
        </h3>

        <div v-if="category" class="space-y-4">
          <!-- اگر دسته‌های فرزند دارد (مثل غزلیات، قصاید، رباعیات) -->
          <div v-if="category.ChildCats && category.ChildCats.length" class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3.5">
            <div
              v-for="child in category.ChildCats"
              :key="child.Id"
              class="p-4 rounded-2xl bg-paper-light dark:bg-paper-surface border border-ink-200/80 dark:border-paper-border hover:border-brand-500/50 hover:shadow-sm transition-all flex items-center justify-between"
            >
              <router-link
                :to="getCategoryRoute(child.FullUrl)"
                class="font-bold text-sm text-ink-800 dark:text-ink-100 hover:text-brand-600 transition-colors flex-1"
              >
                {{ child.Title }}
              </router-link>

              <button
                @click="downloadChildCategory(child)"
                class="p-1.5 rounded-lg text-ink-400 hover:text-brand-600 hover:bg-ink-100 dark:hover:bg-paper-dark transition-colors"
                title="دانلود آفلاین این دفتر"
              >
                <Download class="w-4 h-4" />
              </button>
            </div>
          </div>

          <!-- اشعار مستقیم ریشه -->
          <div v-if="category.Poems && category.Poems.length" class="mt-6">
            <h4 class="text-sm font-bold text-ink-600 dark:text-ink-400 mb-3">
              اشعار موجود در این بخش:
            </h4>
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <router-link
                v-for="poem in category.Poems"
                :key="poem.Id"
                :to="getPoemRoute(poem.FullUrl)"
                class="p-3 rounded-xl bg-paper-light dark:bg-paper-surface border border-ink-200/80 dark:border-paper-border hover:border-brand-500/50 hover:bg-brand-50/20 text-xs font-medium text-ink-800 dark:text-ink-200 transition-all flex items-center justify-between"
              >
                <span>{{ poem.Title }}</span>
                <ChevronLeft class="w-4 h-4 text-ink-400" />
              </router-link>
            </div>
          </div>
        </div>
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';
import { useRoute } from 'vue-router';
import { cdnClient } from '../services/CDNClient';
import { db } from '../db/GhazalDB';
import { useDataStore } from '../stores/dataStore';
import LoadingState from '../components/common/LoadingState.vue';
import type { GanjoorPoet, GanjoorCategory } from '../types/ganjoor';
import { Download, CheckCircle, ChevronLeft } from 'lucide-vue-next';

var route = useRoute();
var dataStore = useDataStore();

var poetSlug = computed(function () {
  return (route.params.poetSlug as string) || '';
});

var poet = ref<GanjoorPoet | null>(null);
var category = ref<GanjoorCategory | null>(null);
var isLoading = ref<boolean>(true);

onMounted(async function () {
  await loadData();
});

async function loadData() {
  isLoading.value = true;
  try {
    // ابتدا از IndexedDB
    var prefix = `/${poetSlug.value}`;
    poet.value = await db.poets.where('FullUrl').equals(prefix).first() || null;
    if (!poet.value) {
      poet.value = await cdnClient.getPoet(poetSlug.value);
      await db.poets.put(poet.value);
    }

    category.value = await cdnClient.getCategory(poetSlug.value);
  } catch (e) {
    console.error('Error loading poet details:', e);
  } finally {
    isLoading.value = false;
  }
}

var isDownloading = computed(function () {
  var pkgId = `poet:${poetSlug.value}`;
  return dataStore.activeProgress[pkgId]?.status === 'downloading';
});

async function downloadPoet() {
  if (poet.value) {
    await dataStore.downloadPoet(poetSlug.value, poet.value.Nickname);
  }
}

function getCategoryRoute(fullUrl: string): string {
  // /hafez/ghazal -> /poet/hafez/cat/ghazal
  var clean = fullUrl.replace(`/${poetSlug.value}`, '').replace(/^\//, '');
  return `/poet/${poetSlug.value}/cat/${clean}`;
}

function getPoemRoute(fullUrl: string): string {
  var clean = fullUrl.replace(/^\/+|\/+$/g, '');
  return `/read/${clean}`;
}

async function downloadChildCategory(child: { Title: string; FullUrl: string }) {
  var cleanCatPath = child.FullUrl.replace(`/${poetSlug.value}`, '').replace(/^\//, '');
  await dataStore.downloadCategory(poetSlug.value, cleanCatPath, child.Title);
}
</script>
