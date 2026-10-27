<template>
  <div class="space-y-6 pb-12">
    <!-- سربرگ جست‌وجو -->
    <div>
      <h2 class="text-2xl font-black text-ink-900 dark:text-ink-50">
        کاوش و جست‌وجوی اشعار
      </h2>
      <p class="text-xs text-ink-500 mt-1">
        جست‌وجو در متن ابیات، عناوین، نام شاعران و وزن‌های عروضی (بر پایه بسته‌های دانلودشده)
      </p>
    </div>

    <!-- فرم ورودی جست‌وجو و فیلترها -->
    <div class="p-5 rounded-3xl bg-paper-light dark:bg-paper-surface border border-ink-200/80 dark:border-paper-border shadow-soft space-y-4">
      <div class="relative">
        <input
          v-model="query"
          @input="onSearch"
          type="text"
          placeholder="واژه یا عبارتی از شعر را بنویسید (مثلاً: دوش دیدم که ملائک)..."
          class="w-full pr-11 pl-4 py-3.5 rounded-2xl border border-ink-200 dark:border-paper-border bg-paper-warm/50 dark:bg-paper-dark text-ink-900 dark:text-ink-100 text-sm font-vazir focus:ring-2 focus:ring-brand-500 outline-hidden transition-all"
        />
        <Search class="w-5 h-5 absolute right-4 top-4 text-brand-600" />
      </div>

      <!-- فیلترهای پیشرفته: شاعر، وزن و قافیه -->
      <div class="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
        <!-- فیلتر شاعر -->
        <select
          v-model="selectedPoetId"
          @change="onSearch"
          class="px-3.5 py-2.5 rounded-xl border border-ink-200 dark:border-paper-border bg-paper-light dark:bg-paper-dark text-ink-800 dark:text-ink-200 text-xs font-medium outline-hidden"
        >
          <option :value="undefined">همهٔ شاعران</option>
          <option v-for="p in dataStore.poets" :key="p.Id" :value="p.Id">
            {{ p.Nickname }}
          </option>
        </select>

        <!-- فیلتر وزن عروضی -->
        <input
          v-model="rhythmFilter"
          @input="onSearch"
          type="text"
          placeholder="فیلتر بر اساس وزن عروضی..."
          class="px-3.5 py-2.5 rounded-xl border border-ink-200 dark:border-paper-border bg-paper-light dark:bg-paper-dark text-ink-800 dark:text-ink-200 text-xs font-medium outline-hidden"
        />

        <!-- فیلتر حروف قافیه -->
        <input
          v-model="rhymeFilter"
          @input="onSearch"
          type="text"
          placeholder="فیلتر بر اساس حروف قافیه..."
          class="px-3.5 py-2.5 rounded-xl border border-ink-200 dark:border-paper-border bg-paper-light dark:bg-paper-dark text-ink-800 dark:text-ink-200 text-xs font-medium outline-hidden"
        />
      </div>
    </div>

    <!-- وضعیت لودینگ و نتایج -->
    <LoadingState v-if="isSearching" message="در حال جست‌وجو در گنجینه ابیات..." />

    <div v-else-if="results.length > 0" class="space-y-3">
      <div class="flex items-center justify-between text-xs text-ink-500 px-1">
        <span>یافته‌ها: {{ toPersianDigits(results.length) }} بیت منطبق</span>
      </div>

      <div class="grid grid-cols-1 gap-3">
        <router-link
          v-for="res in results"
          :key="res.id"
          :to="getPoemLink(res)"
          class="p-4 rounded-2xl bg-paper-light dark:bg-paper-surface border border-ink-200/80 dark:border-paper-border hover:border-brand-500/50 hover:shadow-sm transition-all block group"
        >
          <div class="flex items-center justify-between text-xs mb-2 text-ink-500">
            <span class="font-bold text-brand-700 dark:text-brand-300">
              {{ res.poetName }} » {{ res.poemTitle }}
            </span>
            <span>بیت {{ toPersianDigits(res.coupletIndex + 1) }}</span>
          </div>

          <div class="text-sm font-medium text-ink-900 dark:text-ink-100 group-hover:text-brand-600 transition-colors leading-loose">
            « {{ res.verseText }} »
          </div>

          <div v-if="res.rhythm" class="mt-2 text-[11px] text-ink-400">
            وزن: {{ res.rhythm }}
          </div>
        </router-link>
      </div>
    </div>

    <EmptyState
      v-else-if="hasSearched"
      title="بیتی با این مشخصات یافت نشد"
      description="از واژه‌های ساده‌تر استفاده کنید یا اطمینان حاصل کنید دیوان شاعر مورد نظر را از بخش شاعران دانلود کرده‌اید."
      type="search"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useDataStore } from '../stores/dataStore';
import { searchIndexService, type SearchResultItem } from '../services/SearchIndexService';
import { toPersianDigits } from '../utils/persianNormalizer';
import LoadingState from '../components/common/LoadingState.vue';
import EmptyState from '../components/common/EmptyState.vue';
import { Search } from 'lucide-vue-next';

var route = useRoute();
var router = useRouter();
var dataStore = useDataStore();
var query = ref<string>('');
var selectedPoetId = ref<number | undefined>(undefined);
var rhythmFilter = ref<string>('');
var rhymeFilter = ref<string>('');
var results = ref<SearchResultItem[]>([]);
var isSearching = ref<boolean>(false);
var hasSearched = ref<boolean>(false);

var searchTimeout: any = null;

onMounted(async function () {
  var poemId = route.query.poemId;
  if (poemId) {
    router.replace(`/poem/${poemId}`);
    return;
  }

  if (route.query.rhythm) {
    rhythmFilter.value = String(route.query.rhythm);
  }
  if (route.query.q) {
    query.value = String(route.query.q);
  }
  if (route.query.rhyme) {
    rhymeFilter.value = String(route.query.rhyme);
  }
  if (route.query.poetId) {
    selectedPoetId.value = Number(route.query.poetId);
  }

  await dataStore.init();
  await searchIndexService.initializeFromDB();

  if (rhythmFilter.value || query.value || rhymeFilter.value || selectedPoetId.value) {
    onSearch();
  }
});

function getPoemLink(res: SearchResultItem): string {
  if (res.fullUrl) {
    var clean = res.fullUrl.replace(/^\/+|\/+$/g, '');
    var coupletParam = res.coupletIndex !== undefined ? `?couplet=${res.coupletIndex}` : '';
    return `/read/${clean}${coupletParam}`;
  }
  return `/poem/${res.poemId}${res.coupletIndex !== undefined ? '?couplet=' + res.coupletIndex : ''}`;
}

function onSearch() {
  clearTimeout(searchTimeout);
  if (!query.value.trim() && !rhythmFilter.value.trim() && !rhymeFilter.value.trim() && !selectedPoetId.value) {
    results.value = [];
    hasSearched.value = false;
    return;
  }

  searchTimeout = setTimeout(async function () {
    isSearching.value = true;
    hasSearched.value = true;
    try {
      results.value = await searchIndexService.search(query.value, {
        poetId: selectedPoetId.value,
        rhythm: rhythmFilter.value,
        rhyme: rhymeFilter.value,
        limit: 80
      });
    } finally {
      isSearching.value = false;
    }
  }, 350);
}
</script>
