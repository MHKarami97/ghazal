<template>
  <div class="pb-16">
    <LoadingState v-if="readingStore.isLoading" message="در حال بازگشایی شعر..." />

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
              @select-couplet="onSelectCouplet"
              @select-tag="onSelectTag"
              @toggle-bookmark="onToggleBookmark"
              @add-to-memorize="onAddToMemorize"
              @share-card="onShareCard"
            />
          </div>
        </main>

        <!-- پنل جانبی آموزش و آرایه‌ها در دسکتاپ -->
        <aside class="hidden lg:block w-80 sticky top-20 h-[calc(100vh-6rem)] rounded-2xl overflow-hidden shadow-soft border border-ink-200/80 dark:border-paper-border">
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
    </template>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue';
import { useRoute } from 'vue-router';
import { useAppStore } from '../stores/appStore';
import { useReadingStore } from '../stores/readingStore';
import { useMemorizeStore } from '../stores/memorizeStore';
import { useLiteraryStore } from '../stores/literaryStore';
import { groupVersesIntoCouplets, getPoemMetreRhythm } from '../utils/formatters';
import CoupletView from '../components/poem/CoupletView.vue';
import LiteraryPanel from '../components/poem/LiteraryPanel.vue';
import ReaderToolbar from '../components/poem/ReaderToolbar.vue';
import CardExportModal from '../components/common/CardExportModal.vue';
import LoadingState from '../components/common/LoadingState.vue';
import type { GanjoorLiteraryTag } from '../types/ganjoor';

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

onMounted(async function () {
  await literaryStore.loadBaseMeta();
  await loadPoem();
});

watch(() => route.params, loadPoem);

async function loadPoem() {
  await readingStore.loadPoem(poetSlug.value, catPath.value, poemSlug.value);
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

function onShareCard(coupletIndex: number) {
  var pair = coupletPairs.value.find(function (p) { return p.coupletIndex === coupletIndex; });
  if (pair) {
    activeExportFirst.value = pair.rightVerse?.Text || '';
    activeExportSecond.value = pair.leftVerse?.Text || '';
    showExportModal.value = true;
  }
}
</script>
