<template>
  <div class="pb-16">
    <LoadingState v-if="isBooting || readingStore.isLoading" message="در حال بازگشایی شعر..." />

    <template v-else-if="readingStore.currentPoem">
      <div class="flex flex-col lg:flex-row gap-6">
        <!-- ستون اصلی خواندن شعر -->
        <main class="flex-1 max-w-3xl mx-auto w-full">
          <!-- سربرگ شعر: عنوان، شاعر، وزن و قافیه -->
          <div class="text-center pb-6 mb-6 border-b border-ink-200/60 dark:border-paper-border">
            <div class="text-xs font-bold text-brand-600 dark:text-brand-400 mb-2">
              {{ readingStore.currentPoet?.Nickname || poetSlug }}
            </div>
            <h2 class="text-2xl sm:text-3xl font-black text-ink-900 dark:text-ink-50 mb-3">
              {{ readingStore.currentPoem.Title }}
            </h2>

            <!-- برچسب‌های وزن، قالب و قافیه -->
            <div class="flex flex-wrap items-center justify-center gap-2 text-xs">
              <span
                v-if="poemRhythm"
                class="px-2.5 py-1 rounded-full bg-brand-500/10 text-brand-800 dark:text-brand-300 font-medium border border-brand-500/20"
                :title="poemRhythm"
              >
                وزن: {{ poemRhythm }}
              </span>

              <span
                v-if="readingStore.currentPoem.RhymeLetters"
                class="px-2.5 py-1 rounded-full bg-ink-100 dark:bg-paper-surface text-ink-700 dark:text-ink-300 font-medium"
              >
                قافیه: {{ readingStore.currentPoem.RhymeLetters }}
              </span>
            </div>
          </div>

          <!-- نوار ابزار تنظیمات مطالعه -->
          <ReaderToolbar @toggle-literary-panel="showMobileLiterary = !showMobileLiterary" />

          <!-- متن ابیات شعر -->
          <div class="space-y-4">
            <CoupletView
              v-for="pair in coupletPairs"
              :id="'couplet-' + pair.coupletIndex"
              :key="pair.coupletIndex"
              :couplet-index="pair.coupletIndex"
              :right-verse-text="pair.rightVerse?.Text || ''"
              :left-verse-text="pair.leftVerse?.Text || ''"
              :summary="pair.summary"
              :font-size="appStore.fontSize"
              :line-height="appStore.lineHeight"
              :is-selected="readingStore.activeCoupletIndex === pair.coupletIndex"
              :is-bookmarked="readingStore.isBookmarked(readingStore.currentPoem.Id, pair.coupletIndex)"
              :literary-tags="readingStore.currentPoem.LiteraryTags"
              :show-literary-tags="appStore.showLiteraryTags && !appStore.readingMode"
              :show-summary="appStore.showCoupletSummary && !appStore.readingMode"
              @select-couplet="onSelectCouplet"
              @select-tag="onSelectTag"
              @toggle-bookmark="onToggleBookmark"
              @add-to-memorize="onAddToMemorize"
              @step-memorize="onStepMemorize"
              @add-to-collection="onOpenAddToCollection"
              @share-card="onShareCard"
            />
          </div>

          <!-- بخش اشعار هم‌وزن و هم‌آهنگ -->
          <div v-if="similarPoems.length > 0" class="mt-12 pt-8 border-t border-ink-200/80 dark:border-paper-border space-y-4">
            <div class="flex items-center justify-between">
              <div class="flex items-center gap-2">
                <Music class="w-5 h-5 text-brand-600" />
                <h3 class="font-bold text-base text-ink-900 dark:text-ink-50">
                  اشعار هم‌وزن و هم‌آهنگ با این شعر
                </h3>
              </div>
              <router-link
                v-if="poemRhythm"
                :to="`/search?rhythm=${encodeURIComponent(poemRhythm)}`"
                class="text-xs font-bold text-brand-600 hover:text-brand-700 transition-colors"
              >
                کاوش همه در جست‌وجو
              </router-link>
            </div>
            <p class="text-xs text-ink-500">
              این سروده‌ها از میان دیوان‌های دانلودشده در دیتابیس دستگاه شما با همین ریتم عروضی ({{ poemRhythm }}) شناسایی شده‌اند:
            </p>
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <router-link
                v-for="simPoem in similarPoems"
                :key="simPoem.Id"
                :to="getSimilarPoemLink(simPoem)"
                class="p-4 rounded-2xl bg-paper-light dark:bg-paper-surface border border-ink-200/80 dark:border-paper-border hover:border-brand-500/50 hover:shadow-soft transition-all block group"
              >
                <div class="text-xs font-bold text-brand-700 dark:text-brand-300 mb-1.5 group-hover:text-brand-600 transition-colors">
                  {{ simPoem.FullTitle || simPoem.Title }}
                </div>
                <div v-if="simPoem.Verses && simPoem.Verses.length" class="text-xs text-ink-600 dark:text-ink-300 font-medium truncate">
                  « {{ simPoem.Verses[0]?.Text }} »
                </div>
              </router-link>
            </div>
          </div>
        </main>

        <!-- پنل جانبی آموزش و آرایه‌ها در دسکتاپ (تنها در صورت نبودن در حالت مطالعه) -->
        <aside
          v-if="!appStore.readingMode"
          class="hidden lg:block w-80 sticky top-20 h-[calc(100vh-6rem)] rounded-2xl overflow-hidden shadow-soft border border-ink-200/80 dark:border-paper-border"
        >
          <LiteraryPanel
            :poem-tags="readingStore.currentPoem.LiteraryTags"
            :selected-tag="readingStore.selectedLiteraryTag"
            @select-tag="onSelectTag"
            @clear-selection="readingStore.selectLiteraryTag(null)"
          />
        </aside>
      </div>

      <!-- مدال پنل آرایه‌ها در موبایل (Bottom Sheet) -->
      <div
        v-if="showMobileLiterary"
        class="lg:hidden fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex flex-col justify-end"
      >
        <div class="bg-paper-light dark:bg-paper-surface max-h-[80vh] rounded-t-3xl overflow-hidden flex flex-col shadow-2xl">
          <div class="p-3 border-b border-ink-200 dark:border-paper-border flex items-center justify-between">
            <span class="font-bold text-sm text-ink-900 dark:text-ink-100">تحلیل ادبی و آرایه‌ها</span>
            <button @click="showMobileLiterary = false" class="text-xs text-ink-500 p-1">بستن</button>
          </div>
          <div class="flex-1 overflow-y-auto">
            <LiteraryPanel
              :poem-tags="readingStore.currentPoem.LiteraryTags"
              :selected-tag="readingStore.selectedLiteraryTag"
              @select-tag="onSelectTag"
              @clear-selection="readingStore.selectLiteraryTag(null)"
            />
          </div>
        </div>
      </div>

      <!-- مدال کارت اشتراک -->
      <CardExportModal
        :show="showExportModal"
        :first-misra="activeExportFirst"
        :second-misra="activeExportSecond"
        :poet-name="readingStore.currentPoet?.Nickname || poetSlug"
        :poem-title="readingStore.currentPoem.Title"
        @close="showExportModal = false"
      />

      <!-- مدال حفظ مرحله‌ای بیت -->
      <StepMemorizerModal
        v-if="activeStepCard"
        :is-open="showStepMemorizer"
        :card="activeStepCard"
        @close="showStepMemorizer = false"
      />

      <!-- مدال افزودن به مجموعه‌های شخصی -->
      <div
        v-if="showCollectionModal"
        class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs"
      >
        <div class="bg-paper-light dark:bg-paper-surface w-full max-w-sm rounded-3xl border border-ink-200 dark:border-paper-border p-6 shadow-2xl space-y-4">
          <div class="flex items-center justify-between pb-3 border-b border-ink-200/60 dark:border-paper-border">
            <h3 class="text-sm font-bold text-ink-900 dark:text-ink-50 flex items-center gap-2">
              <FolderPlus class="w-4 h-4 text-brand-600" />
              افزودن به مجموعه شخصی
            </h3>
            <button @click="showCollectionModal = false" class="text-ink-400 hover:text-ink-600">
              <X class="w-4 h-4" />
            </button>
          </div>

          <div class="space-y-2 max-h-56 overflow-y-auto">
            <button
              v-for="col in userCollections"
              :key="col.id"
              @click="saveToCollection(col.id!)"
              class="w-full p-3 rounded-2xl border border-ink-200/80 dark:border-paper-border hover:border-brand-500 hover:bg-brand-500/5 transition-all text-right flex items-center justify-between text-xs"
            >
              <span class="font-bold text-ink-800 dark:text-ink-200">{{ col.title }}</span>
              <span class="text-[10px] text-ink-400">{{ col.items.length }} شعر</span>
            </button>
          </div>
        </div>
      </div>
    </template>

    <EmptyState
      v-else
      type="book"
      title="شعر بارگذاری نشد"
      :description="readingStore.error || 'اتصال اینترنت را بررسی کنید و دوباره تلاش کنید.'"
    >
      <button
        @click="loadPoem"
        class="px-5 py-2 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-bold text-xs shadow-md transition-colors"
      >
        تلاش مجدد
      </button>
    </EmptyState>
  </div>
</template>

<script setup lang="ts">
import EmptyState from '../components/common/EmptyState.vue';
import { ref, computed, onMounted, watch } from 'vue';
import { useRoute } from 'vue-router';
import { useAppStore } from '../stores/appStore';
import { useReadingStore } from '../stores/readingStore';
import { useMemorizeStore } from '../stores/memorizeStore';
import { useLiteraryStore } from '../stores/literaryStore';
import { poetAnalytics } from '../services/PoetAnalyticsService';
import { collectionService } from '../services/CollectionService';
import { groupVersesIntoCouplets, getPoemMetreRhythm } from '../utils/formatters';
import CoupletView from '../components/poem/CoupletView.vue';
import LiteraryPanel from '../components/poem/LiteraryPanel.vue';
import ReaderToolbar from '../components/poem/ReaderToolbar.vue';
import CardExportModal from '../components/common/CardExportModal.vue';
import StepMemorizerModal from '../components/memorize/StepMemorizerModal.vue';
import LoadingState from '../components/common/LoadingState.vue';
import type { GanjoorLiteraryTag, GanjoorPoem } from '../types/ganjoor';
import type { UserCollection, MemorizeCard } from '../types/user';
import { Music, FolderPlus, X } from 'lucide-vue-next';

var route = useRoute();
var appStore = useAppStore();
var readingStore = useReadingStore();
var memorizeStore = useMemorizeStore();
var literaryStore = useLiteraryStore();

var poetSlug = computed(function () { return (route.params.poetSlug as string) || ''; });
var catPath = computed(function () {
  var p = route.params.catPath;
  if (Array.isArray(p)) return p.join('/');
  return String(p || '');
});
var poemSlug = computed(function () { return (route.params.poemSlug as string) || ''; });

var poemRhythm = computed(function () {
  return getPoemMetreRhythm(readingStore.currentPoem);
});

var showMobileLiterary = ref<boolean>(false);
var showExportModal = ref<boolean>(false);
var activeExportFirst = ref<string>('');
var activeExportSecond = ref<string>('');

var similarPoems = ref<GanjoorPoem[]>([]);
var showStepMemorizer = ref<boolean>(false);
var activeStepCard = ref<MemorizeCard | null>(null);

var showCollectionModal = ref<boolean>(false);
var userCollections = ref<UserCollection[]>([]);
var selectedCoupletIndexForCollection = ref<number | null>(null);

var isBooting = ref<boolean>(true);

onMounted(async function () {
  literaryStore.loadBaseMeta().catch(function (err) {
    console.warn('Base meta load failed:', err);
  });
  await loadPoem();
});

watch(() => route.params, loadPoem);

async function loadPoem() {
  if (!poemSlug.value) return;

  isBooting.value = true;
  try {
    await readingStore.loadPoem(poetSlug.value, catPath.value, poemSlug.value);
  } finally {
    isBooting.value = false;
  }

  var coupletParam = route.query.couplet;
  if (coupletParam !== undefined && coupletParam !== null && coupletParam !== '') {
    var cIdx = Number(coupletParam);
    if (!isNaN(cIdx)) {
      readingStore.selectCouplet(cIdx);
      setTimeout(function () {
        var el = document.getElementById('couplet-' + cIdx);
        if (el) {
          el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }, 350);
    }
  }

  // بارگذاری اشعار هم‌وزن از کش
  if (readingStore.currentPoem && poemRhythm.value) {
    similarPoems.value = await poetAnalytics.getSimilarMetrePoems(
      poemRhythm.value,
      readingStore.currentPoem.Id,
      readingStore.currentPoem.RhymeLetters
    );
  } else {
    similarPoems.value = [];
  }
}

var coupletPairs = computed(function () {
  if (!readingStore.currentPoem?.Verses) return [];
  return groupVersesIntoCouplets(readingStore.currentPoem.Verses);
});

function onSelectCouplet(index: number) {
  readingStore.selectCouplet(index);
}

function onSelectTag(tag: GanjoorLiteraryTag) {
  readingStore.selectLiteraryTag(tag);
  if (window.innerWidth < 1024) {
    showMobileLiterary.value = true;
  }
}

async function onToggleBookmark(coupletIndex: number) {
  if (readingStore.currentPoem) {
    await readingStore.toggleBookmark(readingStore.currentPoem.Id, coupletIndex);
  }
}

async function onAddToMemorize(coupletIndex: number) {
  var pair = coupletPairs.value.find(function (p) { return p.coupletIndex === coupletIndex; });
  if (!pair || !readingStore.currentPoem) return;

  await memorizeStore.addCardToDeck({
    poemId: readingStore.currentPoem.Id,
    coupletIndex: coupletIndex,
    poemTitle: readingStore.currentPoem.Title,
    poetName: readingStore.currentPoet?.Nickname || poetSlug.value,
    textFirst: pair.rightVerse?.Text || '',
    textSecond: pair.leftVerse?.Text || ''
  });

  alert('این بیت به فهرست حفظ شما اضافه شد.');
}

function onStepMemorize(coupletIndex: number) {
  var pair = coupletPairs.value.find(function (p) { return p.coupletIndex === coupletIndex; });
  if (!pair || !readingStore.currentPoem) return;

  activeStepCard.value = {
    deckId: 1,
    poemId: readingStore.currentPoem.Id,
    coupletIndex: coupletIndex,
    poemTitle: readingStore.currentPoem.Title,
    poetName: readingStore.currentPoet?.Nickname || poetSlug.value,
    textFirst: pair.rightVerse?.Text || '',
    textSecond: pair.leftVerse?.Text || '',
    status: 'learning',
    repCount: 0,
    intervalDays: 1,
    easeFactor: 2.5,
    dueDate: new Date().toISOString().split('T')[0]
  };
  showStepMemorizer.value = true;
}

async function onOpenAddToCollection(coupletIndex: number) {
  selectedCoupletIndexForCollection.value = coupletIndex;
  userCollections.value = await collectionService.getCollections();
  showCollectionModal.value = true;
}

async function saveToCollection(collectionId: number) {
  if (selectedCoupletIndexForCollection.value === null || !readingStore.currentPoem) return;
  var pair = coupletPairs.value.find(function (p) { return p.coupletIndex === selectedCoupletIndexForCollection.value; });
  if (!pair) return;

  var success = await collectionService.addItemToCollection(collectionId, {
    poemId: readingStore.currentPoem.Id,
    coupletIndex: selectedCoupletIndexForCollection.value,
    poemTitle: readingStore.currentPoem.Title,
    poetName: readingStore.currentPoet?.Nickname || poetSlug.value,
    verseFirst: pair.rightVerse?.Text || '',
    verseSecond: pair.leftVerse?.Text || ''
  });

  showCollectionModal.value = false;
  if (success) {
    alert('بیت با موفقیت به مجموعه افزوده شد.');
  } else {
    alert('این بیت قبلاً در این مجموعه ذخیره شده بود.');
  }
}

function onShareCard(coupletIndex: number) {
  var pair = coupletPairs.value.find(function (p) { return p.coupletIndex === coupletIndex; });
  if (pair) {
    activeExportFirst.value = pair.rightVerse?.Text || '';
    activeExportSecond.value = pair.leftVerse?.Text || '';
    showExportModal.value = true;
  }
}

function getSimilarPoemLink(p: GanjoorPoem): string {
  if (p.FullUrl) {
    var clean = p.FullUrl.replace(/^\/+|\/+$/g, '');
    return `/read/${clean}`;
  }
  return `/poem/${p.Id}`;
}
</script>