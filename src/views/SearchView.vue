<template>
  <div class="space-y-6 pb-12">
    <!-- سربرگ جست‌وجو -->
    <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
      <div>
        <h2 class="text-2xl font-black text-ink-900 dark:text-ink-50">
          کاوش و جست‌وجوی اشعار
        </h2>
        <p class="text-xs text-ink-500 mt-1">
          جست‌وجو در کل گنجینه اشعار گنجور (آنلاین) و دیوان‌های ذخیره‌شده روی دستگاه (آفلاین)
        </p>
      </div>

      <!-- کلید انتخاب محدوده جست‌وجو -->
      <div class="inline-flex items-center p-1 rounded-2xl bg-paper-warm/80 dark:bg-paper-surface border border-ink-200/80 dark:border-paper-border text-xs self-start sm:self-auto">
        <button
          @click="setSearchScope('all')"
          type="button"
          class="px-3 py-1.5 rounded-xl font-bold flex items-center gap-1.5 transition-all"
          :class="searchScope === 'all'
            ? 'bg-brand-600 text-white shadow-xs'
            : 'text-ink-600 dark:text-ink-300 hover:text-ink-900'"
        >
          <Globe class="w-3.5 h-3.5" />
          <span>کل سایت (آنلاین + آفلاین)</span>
        </button>
        <button
          @click="setSearchScope('local')"
          type="button"
          class="px-3 py-1.5 rounded-xl font-bold flex items-center gap-1.5 transition-all"
          :class="searchScope === 'local'
            ? 'bg-brand-600 text-white shadow-xs'
            : 'text-ink-600 dark:text-ink-300 hover:text-ink-900'"
        >
          <HardDrive class="w-3.5 h-3.5" />
          <span>فقط دانلودشده‌ها</span>
        </button>
      </div>
    </div>

    <!-- هشدار حالت آفلاین یا راهنمای جست‌وجوی تنها با وزن/قافیه -->
    <div
      v-if="searchScope === 'all' && !appStore.isOnline"
      class="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/25 text-xs text-amber-800 dark:text-amber-200 flex items-center gap-2.5"
    >
      <WifiOff class="w-4 h-4 shrink-0" />
      <span>شما در حالت آفلاین هستید؛ جست‌وجو به‌صورت خودکار روی دیوان‌های دانلودشده انجام می‌شود.</span>
    </div>

    <div
      v-else-if="searchScope === 'local'"
      class="p-4 rounded-2xl bg-brand-500/10 border border-brand-500/20 text-xs text-brand-900 dark:text-brand-200 flex flex-col sm:flex-row sm:items-center gap-3"
    >
      <div class="flex-1 leading-relaxed">
        <strong>حالت آفلاین:</strong> جست‌وجو تنها روی دیوان‌هایی انجام می‌شود که قبلاً روی این دستگاه دانلود کرده‌اید.
      </div>
      <router-link
        to="/poets"
        class="shrink-0 self-start sm:self-auto px-3 py-1.5 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-medium text-xs transition-colors"
      >
        دریافت دیوان‌ها
      </router-link>
    </div>

    <!-- فرم ورودی جست‌وجو و فیلترها -->
    <div class="p-5 rounded-3xl bg-paper-light dark:bg-paper-surface border border-ink-200/80 dark:border-paper-border shadow-soft space-y-4">
      <div class="relative">
        <input
          v-model="query"
          @input="onSearch"
          @keydown.enter="onSearchNow"
          type="text"
          placeholder="واژه یا عبارتی از شعر را بنویسید (مثلاً: دوش دیدم که ملائک)..."
          class="w-full pr-11 pl-4 py-3.5 rounded-2xl border border-ink-200 dark:border-paper-border bg-paper-warm/50 dark:bg-paper-dark text-ink-900 dark:text-ink-100 text-sm font-vazir focus:ring-2 focus:ring-brand-500 outline-hidden transition-all"
        />
        <Search class="w-5 h-5 absolute right-4 top-4 text-brand-600" />
      </div>

      <!-- فیلترهای پیشرفته: شاعر، وزن و قافیه -->
      <div class="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
        <!-- فیلتر شاعر -->
        <select
          v-model="selectedPoetId"
          @change="onSearchNow"
          class="px-3.5 py-2.5 rounded-xl border border-ink-200 dark:border-paper-border bg-paper-light dark:bg-paper-dark text-ink-800 dark:text-ink-200 text-xs font-medium outline-hidden"
        >
          <option :value="undefined">همه شاعران</option>
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

      <p
        v-if="searchScope === 'all' && !query.trim() && (rhythmFilter.trim() || rhymeFilter.trim())"
        class="text-[11px] text-ink-500 dark:text-ink-400"
      >
        فیلتر وزن یا قافیه بدون نوشتن واژه روی دیوان‌های دانلودشده جست‌وجو می‌شود؛ برای جست‌وجوی سراسر گنجور، عبارتی را نیز در کادر بالا وارد کنید.
      </p>
    </div>

    <!-- وضعیت خطای موقت آنلاین -->
    <div
      v-if="onlineError"
      class="p-3 rounded-2xl bg-amber-500/10 border border-amber-500/25 text-xs text-amber-800 dark:text-amber-200"
    >
      {{ onlineError }}
    </div>

    <!-- وضعیت لودینگ و نتایج -->
    <LoadingState v-if="isSearching && results.length === 0" message="در حال جست‌وجو در گنجینه ابیات..." />

    <div v-else-if="results.length > 0" class="space-y-3">
      <div class="flex flex-wrap items-center justify-between gap-2 text-xs text-ink-500 px-1">
        <span>
          یافته‌ها: {{ toPersianDigits(results.length) }} مورد
          <template v-if="totalOnlineCount && totalOnlineCount > results.length">
            (از مجموع {{ toPersianDigits(totalOnlineCount) }} نتیجهٔ آنلاین)
          </template>
        </span>
        <span v-if="isSearchingOnline" class="text-brand-600 dark:text-brand-400 font-medium animate-pulse">
          در حال دریافت نتایج بیشتر از گنجور...
        </span>
      </div>

      <div class="grid grid-cols-1 gap-3">
        <router-link
          v-for="res in results"
          :key="`${res.poemId}-${res.coupletIndex}-${res.source || 'local'}`"
          :to="getPoemLink(res)"
          class="p-4 rounded-2xl bg-paper-light dark:bg-paper-surface border border-ink-200/80 dark:border-paper-border hover:border-brand-500/50 hover:shadow-sm transition-all block group"
        >
          <div class="flex flex-wrap items-center justify-between gap-2 text-xs mb-2 text-ink-500">
            <span class="font-bold text-brand-700 dark:text-brand-300">
              {{ res.poetName }} » {{ res.poemTitle }}
            </span>
            <div class="flex items-center gap-2">
              <span
                class="px-2 py-0.5 rounded-full text-[10px] font-bold"
                :class="res.source === 'online'
                  ? 'bg-sky-500/10 text-sky-700 dark:text-sky-300'
                  : 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300'"
              >
                {{ res.source === 'online' ? 'آنلاین' : 'آفلاین' }}
              </span>
              <span>بیت {{ toPersianDigits(res.coupletIndex + 1) }}</span>
            </div>
          </div>

          <div class="text-sm font-medium text-ink-900 dark:text-ink-100 group-hover:text-brand-600 transition-colors leading-loose">
            « {{ res.verseText }} »
          </div>

          <div v-if="res.rhythm" class="mt-2 text-[11px] text-ink-400">
            وزن: {{ res.rhythm }}
          </div>
        </router-link>
      </div>

      <!-- دکمه بارگذاری صفحه بعدی نتایج آنلاین -->
      <div v-if="hasMoreOnline && searchScope === 'all'" class="flex justify-center pt-2">
        <button
          @click="loadMoreOnline"
          :disabled="isLoadingMore"
          type="button"
          class="px-5 py-2.5 rounded-2xl border border-brand-500/40 bg-brand-500/10 hover:bg-brand-500/20 disabled:opacity-50 text-brand-800 dark:text-brand-200 font-bold text-xs flex items-center gap-2 transition-colors"
        >
          <ArrowDown class="w-4 h-4" />
          <span>{{ isLoadingMore ? 'در حال دریافت...' : 'نمایش نتایج بیشتر از کل سایت' }}</span>
        </button>
      </div>
    </div>

    <!-- نتیجه‌ای یافت نشد -->
    <div
      v-else-if="hasSearched && !isSearching"
      class="p-8 rounded-3xl bg-paper-light dark:bg-paper-surface border border-ink-200/80 dark:border-paper-border text-center space-y-4"
    >
      <div class="w-16 h-16 mx-auto rounded-full bg-amber-500/10 flex items-center justify-center text-amber-600">
        <Search class="w-8 h-8" />
      </div>
      <div>
        <h3 class="text-lg font-bold text-ink-900 dark:text-ink-100">
          {{ searchScope === 'local' || !appStore.isOnline
            ? 'بیتی با این مشخصات در اشعار دانلودشده یافت نشد'
            : 'شعری با این مشخصات یافت نشد' }}
        </h3>
        <p class="text-xs text-ink-500 max-w-md mx-auto mt-2 leading-relaxed">
          {{ searchScope === 'local'
            ? 'جست‌وجوی آفلاین تنها بر روی دیوان‌هایی انجام می‌شود که قبلاً دانلود کرده‌اید. می‌توانید جست‌وجو را به حالت «کل سایت» تغییر دهید یا دیوان‌های بیشتری دریافت کنید.'
            : 'املا، فاصله‌ها یا ترکیب کلمات را ساده‌تر امتحان کنید تا نتایج بیشتری از سراسر گنجور پیدا شود.' }}
        </p>
      </div>
      <div class="flex flex-wrap items-center justify-center gap-2">
        <button
          v-if="searchScope === 'local' && appStore.isOnline"
          @click="setSearchScope('all')"
          type="button"
          class="px-5 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-medium text-xs shadow-sm transition-colors"
        >
          جست‌وجو در کل سایت
        </button>
        <router-link
          to="/poets"
          class="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl border border-ink-200 dark:border-paper-border hover:bg-paper-warm text-ink-800 dark:text-ink-200 font-medium text-xs transition-colors"
        >
          مشاهده و دریافت دیوان شاعران
        </router-link>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useAppStore } from '../stores/appStore';
import { useDataStore } from '../stores/dataStore';
import { searchIndexService, type SearchResultItem } from '../services/SearchIndexService';
import { onlineSearchService } from '../services/OnlineSearchService';
import { normalizeGanjoorFullUrl } from '../utils/ganjoorPoemMapper';
import { toPersianDigits } from '../utils/persianNormalizer';
import LoadingState from '../components/common/LoadingState.vue';
import { Search, Globe, HardDrive, WifiOff, ArrowDown } from 'lucide-vue-next';

var route = useRoute();
var router = useRouter();
var appStore = useAppStore();
var dataStore = useDataStore();

var searchScope = ref<'all' | 'local'>('all');
var query = ref<string>('');
var selectedPoetId = ref<number | undefined>(undefined);
var rhythmFilter = ref<string>('');
var rhymeFilter = ref<string>('');

var results = ref<SearchResultItem[]>([]);
var isSearching = ref<boolean>(false);
var isSearchingOnline = ref<boolean>(false);
var isLoadingMore = ref<boolean>(false);
var hasSearched = ref<boolean>(false);
var hasMoreOnline = ref<boolean>(false);
var totalOnlineCount = ref<number | undefined>(undefined);
var onlineError = ref<string>('');
var currentOnlinePage = ref<number>(1);

var searchTimeout: any = null;
var activeAbortController: AbortController | null = null;
var latestSearchId = 0;

onBeforeUnmount(function () {
  clearTimeout(searchTimeout);
  if (activeAbortController) {
    activeAbortController.abort();
    activeAbortController = null;
  }
});

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
    onSearchNow();
  }
});

function setSearchScope(scope: 'all' | 'local') {
  if (searchScope.value === scope) return;
  searchScope.value = scope;
  if (query.value.trim() || rhythmFilter.value.trim() || rhymeFilter.value.trim() || selectedPoetId.value) {
    onSearchNow();
  }
}

function getPoemLink(res: SearchResultItem): string {
  var coupletParam = res.coupletIndex !== undefined ? `?couplet=${res.coupletIndex}` : '';
  if (res.fullUrl) {
    var clean = normalizeGanjoorFullUrl(res.fullUrl).replace(/^\/+|\/+$/g, '');
    if (clean) return `/read/${clean}${coupletParam}`;
  }
  return `/poem/${res.poemId}${coupletParam}`;
}

function mergeResults(localItems: SearchResultItem[], onlineItems: SearchResultItem[]): SearchResultItem[] {
  var seen = new Set<string>();
  var merged: SearchResultItem[] = [];

  for (var i = 0; i < localItems.length; i++) {
    var loc = localItems[i];
    var key = `${loc.poemId}:${loc.coupletIndex}`;
    seen.add(key);
    merged.push({ ...loc, source: 'local' });
  }

  for (var j = 0; j < onlineItems.length; j++) {
    var onl = onlineItems[j];
    var onlKey = `${onl.poemId}:${onl.coupletIndex}`;
    if (seen.has(onlKey)) continue;
    seen.add(onlKey);
    merged.push({ ...onl, source: 'online' });
  }

  return merged;
}

function onSearch() {
  clearTimeout(searchTimeout);
  searchTimeout = setTimeout(executeSearch, 400);
}

function onSearchNow() {
  clearTimeout(searchTimeout);
  void executeSearch();
}

async function executeSearch() {
  if (activeAbortController) {
    activeAbortController.abort();
    activeAbortController = null;
  }

  var q = query.value.trim();
  var rhm = rhythmFilter.value.trim();
  var rhy = rhymeFilter.value.trim();
  var poetId = selectedPoetId.value;

  if (!q && !rhm && !rhy && !poetId) {
    results.value = [];
    hasSearched.value = false;
    hasMoreOnline.value = false;
    totalOnlineCount.value = undefined;
    onlineError.value = '';
    return;
  }

  var searchId = ++latestSearchId;
  isSearching.value = true;
  hasSearched.value = true;
  onlineError.value = '';
  hasMoreOnline.value = false;
  totalOnlineCount.value = undefined;
  currentOnlinePage.value = 1;

  var localFound: SearchResultItem[] = [];
  try {
    localFound = await searchIndexService.search(q, {
      poetId: poetId,
      rhythm: rhm,
      rhyme: rhy,
      limit: 60
    });
    if (searchId !== latestSearchId) return;
    results.value = mergeResults(localFound, []);
  } finally {
    if (searchId === latestSearchId && (searchScope.value === 'local' || !appStore.isOnline || q.length < 2)) {
      isSearching.value = false;
    }
  }

  if (searchScope.value !== 'all' || !appStore.isOnline || q.length < 2) {
    isSearchingOnline.value = false;
    return;
  }

  var controller = new AbortController();
  activeAbortController = controller;
  isSearchingOnline.value = true;

  try {
    var remoteRes = await onlineSearchService.searchAllPoems(q, {
      poetId: poetId,
      pageNumber: 1,
      pageSize: 25,
      rhythm: rhm,
      rhyme: rhy,
      signal: controller.signal
    });

    if (searchId !== latestSearchId) return;

    results.value = mergeResults(localFound, remoteRes.items);
    hasMoreOnline.value = remoteRes.hasMore;
    totalOnlineCount.value = remoteRes.totalCount;
  } catch (err: any) {
    if (err?.name === 'AbortError' || searchId !== latestSearchId) return;
    onlineError.value = localFound.length > 0
      ? 'دریافت نتایج آنلاین موقتاً ناموفق بود؛ نتایج دیوان‌های دانلودشده نمایش داده شدند.'
      : 'دریافت نتایج آنلاین از گنجور ناموفق بود. لطفاً اتصال اینترنت را بررسی کرده و دوباره تلاش کنید.';
  } finally {
    if (searchId === latestSearchId) {
      isSearching.value = false;
      isSearchingOnline.value = false;
      if (activeAbortController === controller) {
        activeAbortController = null;
      }
    }
  }
}

async function loadMoreOnline() {
  if (isLoadingMore.value || !hasMoreOnline.value || searchScope.value !== 'all' || !appStore.isOnline) return;
  var q = query.value.trim();
  if (q.length < 2) return;

  var searchId = latestSearchId;
  var nextPage = currentOnlinePage.value + 1;
  isLoadingMore.value = true;

  try {
    var remoteRes = await onlineSearchService.searchAllPoems(q, {
      poetId: selectedPoetId.value,
      pageNumber: nextPage,
      pageSize: 25,
      rhythm: rhythmFilter.value.trim(),
      rhyme: rhymeFilter.value.trim()
    });
    if (searchId !== latestSearchId) return;

    currentOnlinePage.value = nextPage;
    hasMoreOnline.value = remoteRes.hasMore;
    if (typeof remoteRes.totalCount === 'number') {
      totalOnlineCount.value = remoteRes.totalCount;
    }

    var localOnly = results.value.filter(function (r) { return r.source !== 'online'; });
    var existingOnline = results.value.filter(function (r) { return r.source === 'online'; });
    results.value = mergeResults(localOnly, existingOnline.concat(remoteRes.items));
  } catch (err) {
    hasMoreOnline.value = false;
  } finally {
    isLoadingMore.value = false;
  }
}
</script>
