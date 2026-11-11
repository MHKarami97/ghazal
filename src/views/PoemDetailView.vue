<template>
  <div class="pb-16">
    <LoadingState v-if="isBooting || readingStore.isLoading" message="در حال بازگشایی شعر..." />

    <template v-else-if="readingStore.currentPoem">
      <div class="flex flex-col lg:flex-row gap-5 lg:gap-6">
        <!-- ستون اصلی خواندن شعر -->
        <main class="flex-1 max-w-4xl mx-auto w-full min-w-0">
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

          <!-- نوار پخش صوت و دکلمه گنجور -->
          <PoemAudioPlayer v-if="recitations.length > 0" :recitations="recitations" />

          <!-- نوار ابزار تنظیمات مطالعه -->
          <ReaderToolbar @toggle-literary-panel="showMobileLiterary = !showMobileLiterary" />

          <!-- نوار محاسبه ابجد کل شعر -->
          <div
            v-if="appStore.showAbjad && !appStore.readingMode && poemAbjad.kabir > 0"
            class="mb-4 p-3.5 rounded-2xl bg-amber-500/10 dark:bg-amber-500/5 border border-amber-500/30 flex flex-wrap items-center justify-between gap-3 text-xs"
          >
            <div class="flex items-center gap-2">
              <div class="w-7 h-7 rounded-lg bg-amber-500/20 text-amber-700 dark:text-amber-300 flex items-center justify-center shrink-0">
                <Calculator class="w-4 h-4" />
              </div>
              <div>
                <span class="font-bold text-ink-900 dark:text-ink-50">حساب ابجد کل شعر</span>
                <span class="text-ink-500 dark:text-ink-400 mr-1.5">
                  ({{ formatAbjadNumber(poemAbjad.letterCount) }} حرف)
                </span>
              </div>
            </div>

            <div class="flex flex-wrap items-center gap-2">
              <span class="px-2.5 py-1 rounded-lg bg-paper-light dark:bg-paper-dark border border-amber-500/25 font-bold text-amber-800 dark:text-amber-200">
                ابجد کبیر کل: {{ formatAbjadNumber(poemAbjad.kabir) }}
              </span>
              <span
                v-if="titleAbjad.kabir > 0"
                class="px-2.5 py-1 rounded-lg bg-paper-light dark:bg-paper-dark border border-ink-200/60 dark:border-paper-border text-ink-700 dark:text-ink-300"
              >
                عنوان: {{ formatAbjadNumber(titleAbjad.kabir) }}
              </span>
              <span class="px-2.5 py-1 rounded-lg bg-paper-light dark:bg-paper-dark border border-ink-200/60 dark:border-paper-border text-ink-600 dark:text-ink-400">
                صغیر (۹ / ۱۲): {{ toPersianDigits(poemAbjad.saghir9) }} / {{ toPersianDigits(poemAbjad.saghir12) }}
              </span>
            </div>
          </div>

          <!-- نوار اقدام‌های کل شعر (حفظ کامل و اشتراک‌گذاری/خروجی) -->
          <div class="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 p-3.5 rounded-2xl bg-paper-warm/70 dark:bg-paper-surface border border-ink-200/60 dark:border-paper-border text-xs mb-4">
            <div class="flex items-center gap-2 min-w-0">
              <div class="w-7 h-7 rounded-lg bg-purple-500/15 text-purple-600 dark:text-purple-400 flex items-center justify-center font-bold shrink-0">
                <Brain class="w-4 h-4" />
              </div>
              <span v-if="memorizedCoupletCount > 0" class="font-bold text-ink-900 dark:text-ink-50 truncate">
                {{ toPersianDigits(memorizedCoupletCount) }} از {{ toPersianDigits(coupletPairs.length) }} بیت در جعبه حفظ شما قرار دارد
              </span>
              <span v-else class="text-ink-500 truncate">
                این شعر هنوز به جعبه حفظ اضافه نشده است
              </span>
            </div>

            <div class="flex flex-wrap items-center gap-2 shrink-0">
              <button
                @click="onShareFullPoem"
                type="button"
                class="flex-1 sm:flex-none justify-center px-3 py-1.5 rounded-xl border border-brand-500/40 bg-paper-light dark:bg-paper-dark hover:bg-brand-500/10 text-brand-700 dark:text-brand-300 font-bold transition-colors flex items-center gap-1.5 shadow-2xs"
                title="خروجی تصویر، متن کامل و لینک اشتراک کل شعر"
              >
                <Share2 class="w-3.5 h-3.5" />
                <span>اشتراک و خروجی شعر</span>
              </button>

              <button
                v-if="memorizedCoupletCount > 0"
                @click="onRemoveEntirePoemFromMemorize"
                type="button"
                class="flex-1 sm:flex-none justify-center px-3 py-1.5 rounded-xl border border-rose-500/40 text-rose-600 dark:text-rose-400 font-bold hover:bg-rose-500/10 transition-colors flex items-center gap-1.5"
                title="حذف تمام ابیات این شعر از فهرست حفظ"
              >
                <Trash2 class="w-3.5 h-3.5" />
                <span>حذف کامل از حفظ</span>
              </button>
              <button
                v-else
                @click="onAddEntirePoemToMemorize"
                type="button"
                class="flex-1 sm:flex-none justify-center px-3 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold transition-all shadow-xs flex items-center gap-1.5"
                title="افزودن تمام ابیات این شعر به فهرست حفظ"
              >
                <Brain class="w-3.5 h-3.5" />
                <span>حفظ کامل این شعر ({{ toPersianDigits(coupletPairs.length) }} بیت)</span>
              </button>
            </div>
          </div>

          <!-- متن ابیات شعر -->
          <div :class="isCompactCouplets ? 'space-y-0.5 sm:space-y-1' : 'space-y-3 sm:space-y-4'">
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
              :font-family="appStore.poemFontFamily"
              :is-selected="readingStore.activeCoupletIndex === pair.coupletIndex"
              :is-bookmarked="readingStore.isBookmarked(readingStore.currentPoem.Id, pair.coupletIndex)"
              :is-memorized="memorizeStore.isCoupletMemorized(readingStore.currentPoem.Id, pair.coupletIndex)"
              :literary-tags="readingStore.currentPoem.LiteraryTags"
              :show-literary-tags="appStore.showLiteraryTags && !appStore.readingMode"
              :show-summary="appStore.showCoupletSummary && !appStore.readingMode"
              :show-diacritics="appStore.showDiacritics"
              :show-abjad="appStore.showAbjad && !appStore.readingMode"
              :word-click-enabled="appStore.wordClickEnabled"
              @select-couplet="onSelectCouplet"
              @select-tag="onSelectTag"
              @select-word="onSelectWord"
              @toggle-bookmark="onToggleBookmark"
              @add-to-memorize="onAddToMemorize"
              @step-memorize="onStepMemorize"
              @add-to-collection="onOpenAddToCollection"
              @share-card="onShareCard"
            />
          </div>

          <!-- خلاصه شعر (در انتهای ابیات) -->
          <section
            v-if="poemSummaryText"
            class="mt-10 p-5 rounded-2xl bg-paper-warm/70 dark:bg-paper-surface border border-ink-200/80 dark:border-paper-border space-y-2.5 shadow-2xs"
          >
            <div class="flex items-center gap-2">
              <div class="w-7 h-7 rounded-lg bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 flex items-center justify-center shrink-0">
                <BookOpen class="w-4 h-4" />
              </div>
              <h3 class="font-bold text-sm text-ink-900 dark:text-ink-50">
                خلاصه شعر
              </h3>
            </div>
            <p class="text-xs sm:text-sm text-ink-700 dark:text-ink-300 leading-7 whitespace-pre-line">
              {{ poemSummaryText }}
            </p>
          </section>

          <!-- ترانه‌ها و آثار موسیقایی مرتبط -->
          <PoemSongsCard :songs="songs" />

          <!-- بخش واژگان و بسامد کلمات شعر -->
          <PoemVocabularyCard
            v-if="poemVocabulary.totalWords > 0"
            :vocabulary="poemVocabulary"
            @select-word="onSelectWord"
          />

          <!-- بخش نقل‌قول‌ها، تضمین‌ها و اشعار هم‌مضمون -->
          <PoemQuotationsCard :quotations="quotations" />

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

          <!-- ناوبری شعر بعدی و شعر قبلی در دفتر -->
          <nav
            v-if="prevPoem || nextPoem"
            class="mt-10 pt-6 border-t border-ink-200/80 dark:border-paper-border flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 text-xs"
            aria-label="پیمایش اشعار این دفتر"
          >
            <router-link
              v-if="prevPoem"
              :to="prevPoem.route"
              class="flex-1 p-3.5 rounded-2xl bg-paper-light dark:bg-paper-surface border border-ink-200/80 dark:border-paper-border hover:border-brand-500/50 hover:bg-brand-50/10 transition-all flex items-center gap-2.5 group"
            >
              <ArrowRight class="w-4 h-4 text-brand-600 shrink-0 group-hover:translate-x-1 transition-transform" />
              <div class="min-w-0 flex-1 text-right">
                <span class="text-[11px] text-ink-400 block mb-0.5">شعر قبلی:</span>
                <span class="font-bold text-ink-900 dark:text-ink-50 truncate block group-hover:text-brand-600 transition-colors">
                  {{ prevPoem.title }}
                </span>
              </div>
            </router-link>
            <div v-else class="flex-1 hidden sm:block"></div>

            <router-link
              v-if="nextPoem"
              :to="nextPoem.route"
              class="flex-1 p-3.5 rounded-2xl bg-paper-light dark:bg-paper-surface border border-ink-200/80 dark:border-paper-border hover:border-brand-500/50 hover:bg-brand-50/10 transition-all flex items-center justify-between gap-2.5 group"
            >
              <div class="min-w-0 flex-1 text-left">
                <span class="text-[11px] text-ink-400 block mb-0.5">شعر بعدی:</span>
                <span class="font-bold text-ink-900 dark:text-ink-50 truncate block group-hover:text-brand-600 transition-colors">
                  {{ nextPoem.title }}
                </span>
              </div>
              <ArrowLeft class="w-4 h-4 text-brand-600 shrink-0 group-hover:-translate-x-1 transition-transform" />
            </router-link>
            <div v-else class="flex-1 hidden sm:block"></div>
          </nav>
        </main>

        <!-- پنل جانبی آموزش و آرایه‌ها در دسکتاپ (تنها در صورت نبودن در حالت مطالعه) -->
        <aside
          v-if="!appStore.readingMode"
          class="hidden lg:block w-80 sticky top-20 h-[calc(100vh-6rem)] rounded-2xl overflow-hidden shadow-soft border border-ink-200/80 dark:border-paper-border"
        >
          <LiteraryPanel
            :poem="readingStore.currentPoem"
            :poem-tags="readingStore.currentPoem.LiteraryTags"
            :selected-tag="readingStore.selectedLiteraryTag"
            @select-tag="onSelectTag"
            @clear-selection="readingStore.selectLiteraryTag(null)"
            @jump-couplet="onJumpToCouplet"
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
              :poem="readingStore.currentPoem"
              :poem-tags="readingStore.currentPoem.LiteraryTags"
              :selected-tag="readingStore.selectedLiteraryTag"
              @select-tag="onSelectTag"
              @clear-selection="readingStore.selectLiteraryTag(null)"
              @jump-couplet="onJumpToCouplet"
            />
          </div>
        </div>
      </div>

      <!-- مدال کارت اشتراک -->
      <CardExportModal
        :show="showExportModal"
        :mode="exportMode"
        :first-misra="activeExportFirst"
        :second-misra="activeExportSecond"
        :couplets="exportCouplets"
        :poet-name="readingStore.currentPoet?.Nickname || poetSlug"
        :poem-title="readingStore.currentPoem.Title"
        :share-url="exportShareUrl"
        :font-family="appStore.poemFontFamily"
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

      <!-- مدال معنی و جست‌وجوی کلمه -->
      <WordLookupModal
        :show="showWordModal"
        :word="selectedWord"
        @close="showWordModal = false"
        @disable="onDisableWordClick"
      />
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
import { loadCategoryData } from '../services/CategoryRepository';
import { groupVersesIntoCouplets, getPoemMetreRhythm } from '../utils/formatters';
import { toLocalDateString } from '../utils/dateUtils';
import CoupletView from '../components/poem/CoupletView.vue';
import LiteraryPanel from '../components/poem/LiteraryPanel.vue';
import ReaderToolbar from '../components/poem/ReaderToolbar.vue';
import PoemSongsCard from '../components/poem/PoemSongsCard.vue';
import PoemVocabularyCard from '../components/poem/PoemVocabularyCard.vue';
import PoemQuotationsCard from '../components/poem/PoemQuotationsCard.vue';
import WordLookupModal from '../components/poem/WordLookupModal.vue';
import CardExportModal from '../components/common/CardExportModal.vue';
import StepMemorizerModal from '../components/memorize/StepMemorizerModal.vue';
import LoadingState from '../components/common/LoadingState.vue';
import PoemAudioPlayer from '../components/reading/PoemAudioPlayer.vue';
import { recitationService, type PoemRecitation } from '../services/RecitationService';
import { songService, type PoemSongTrack } from '../services/SongService';
import { quotationService, type PoemQuotationItem } from '../services/QuotationService';
import { calculateAbjad, analyzePoemVocabulary, stripPersianDiacritics } from '../utils/abjad';
import { toPersianDigits } from '../utils/persianNormalizer';
import type { GanjoorLiteraryTag, GanjoorPoem } from '../types/ganjoor';
import type { UserCollection, MemorizeCard } from '../types/user';
import {
  Music,
  FolderPlus,
  X,
  Brain,
  Trash2,
  ArrowRight,
  ArrowLeft,
  Calculator,
  BookOpen,
  Share2
} from 'lucide-vue-next';

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
var exportMode = ref<'couplet' | 'poem'>('couplet');
var activeExportFirst = ref<string>('');
var activeExportSecond = ref<string>('');
var exportCouplets = ref<{ firstMisra: string; secondMisra: string }[]>([]);
var exportShareUrl = ref<string>('');

var similarPoems = ref<GanjoorPoem[]>([]);
var recitations = ref<PoemRecitation[]>([]);
var songs = ref<PoemSongTrack[]>([]);
var quotations = ref<PoemQuotationItem[]>([]);
var fetchedPoemSummary = ref<string>('');
var showWordModal = ref<boolean>(false);
var selectedWord = ref<string>('');
var prevPoem = ref<{ title: string; route: string } | null>(null);
var nextPoem = ref<{ title: string; route: string } | null>(null);
var showStepMemorizer = ref<boolean>(false);
var activeStepCard = ref<MemorizeCard | null>(null);

var showCollectionModal = ref<boolean>(false);
var userCollections = ref<UserCollection[]>([]);
var selectedCoupletIndexForCollection = ref<number | null>(null);

var isBooting = ref<boolean>(true);

var poemSummaryText = computed(function () {
  return (readingStore.currentPoem?.PoemSummary || fetchedPoemSummary.value || '').trim();
});

var poemAbjad = computed(function () {
  var verses = readingStore.currentPoem?.Verses || [];
  var combined = verses.map(function (v) { return v.Text || ''; }).join(' ');
  return calculateAbjad(combined);
});

var titleAbjad = computed(function () {
  return calculateAbjad(readingStore.currentPoem?.Title || '');
});

var poemVocabulary = computed(function () {
  return analyzePoemVocabulary(readingStore.currentPoem?.Verses || []);
});

onMounted(async function () {
  literaryStore.loadBaseMeta().catch(function (err) {
    console.warn('Base meta load failed:', err);
  });
  await loadPoem();
});

watch(() => route.params, loadPoem);

var latestLoadId = 0;

async function loadPoem() {
  if (!poemSlug.value) return;

  var loadId = ++latestLoadId;
  var isStale = function () { return loadId !== latestLoadId; };

  isBooting.value = true;
  songs.value = [];
  quotations.value = [];
  fetchedPoemSummary.value = '';
  recitations.value = [];
  showWordModal.value = false;
  try {
    await readingStore.loadPoem(poetSlug.value, catPath.value, poemSlug.value);
  } finally {
    if (!isStale()) isBooting.value = false;
  }
  if (isStale()) return;

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
  } else {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  // بارگذاری دفتر برای ناوبری شعر بعدی و شعر قبلی
  if (poetSlug.value && catPath.value) {
    loadCategoryData(poetSlug.value, catPath.value).then(function (cat) {
      if (isStale() || !cat || !cat.Poems || cat.Poems.length === 0) {
        prevPoem.value = null;
        nextPoem.value = null;
        return;
      }
      var currentUrlSlug = poemSlug.value;
      var idx = cat.Poems.findIndex(function (p) {
        var clean = p.FullUrl.replace(/^\/+|\/+$/g, '');
        return clean.endsWith('/' + currentUrlSlug) || clean === currentUrlSlug;
      });
      if (idx !== -1) {
        if (idx > 0) {
          var prev = cat.Poems[idx - 1];
          prevPoem.value = {
            title: prev.Title,
            route: `/read/${prev.FullUrl.replace(/^\/+|\/+$/g, '')}`
          };
        } else {
          prevPoem.value = null;
        }

        if (idx < cat.Poems.length - 1) {
          var next = cat.Poems[idx + 1];
          nextPoem.value = {
            title: next.Title,
            route: `/read/${next.FullUrl.replace(/^\/+|\/+$/g, '')}`
          };
        } else {
          nextPoem.value = null;
        }
      } else {
        prevPoem.value = null;
        nextPoem.value = null;
      }
    }).catch(function () {
      prevPoem.value = null;
      nextPoem.value = null;
    });
  } else {
    prevPoem.value = null;
    nextPoem.value = null;
  }

  // بارگذاری اشعار هم‌وزن از کش
  if (readingStore.currentPoem && poemRhythm.value) {
    var similar = await poetAnalytics.getSimilarMetrePoems(
      poemRhythm.value,
      readingStore.currentPoem.Id,
      readingStore.currentPoem.RhymeLetters
    );
    if (!isStale()) similarPoems.value = similar;
  } else {
    similarPoems.value = [];
  }

  // بارگذاری فایل‌های صوتی، دکلمه‌ها، ترانه‌ها، نقل‌قول‌ها و خلاصه شعر از گنجور
  if (readingStore.currentPoem) {
    var activePoemId = readingStore.currentPoem.Id;
    recitationService.getRecitations(activePoemId).then(function (list) {
      if (!isStale()) recitations.value = list;
    });
    songService.getSongs(activePoemId).then(function (list) {
      if (!isStale()) songs.value = list;
    });
    quotationService.getQuotations(activePoemId).then(function (list) {
      if (!isStale()) quotations.value = list;
    });
    if (!readingStore.currentPoem.PoemSummary) {
      songService.getPoemSummaryFallback(activePoemId).then(function (summary) {
        if (!isStale()) fetchedPoemSummary.value = summary;
      });
    }
  } else {
    recitations.value = [];
    songs.value = [];
    quotations.value = [];
    fetchedPoemSummary.value = '';
  }
}

var isCompactCouplets = computed(function () {
  return (!appStore.showLiteraryTags && !appStore.showCoupletSummary) || appStore.readingMode;
});

var coupletPairs = computed(function () {
  if (!readingStore.currentPoem?.Verses) return [];
  return groupVersesIntoCouplets(readingStore.currentPoem.Verses);
});

var memorizedCoupletCount = computed(function () {
  if (!readingStore.currentPoem) return 0;
  var poemId = readingStore.currentPoem.Id;
  return coupletPairs.value.filter(function (p) {
    return memorizeStore.isCoupletMemorized(poemId, p.coupletIndex);
  }).length;
});

function formatAbjadNumber(num: number): string {
  return toPersianDigits(num.toLocaleString('en-US').replace(/,/g, '٬'));
}

function onSelectWord(word: string) {
  if (!word) return;
  selectedWord.value = word;
  showWordModal.value = true;
}

function onDisableWordClick() {
  appStore.wordClickEnabled = false;
  showWordModal.value = false;
}

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

  await memorizeStore.toggleCoupletMemorize({
    poemId: readingStore.currentPoem.Id,
    coupletIndex: coupletIndex,
    poemTitle: readingStore.currentPoem.Title,
    poetName: readingStore.currentPoet?.Nickname || poetSlug.value,
    textFirst: pair.rightVerse?.Text || '',
    textSecond: pair.leftVerse?.Text || ''
  });
}

async function onAddEntirePoemToMemorize() {
  if (!readingStore.currentPoem) return;
  var poem = readingStore.currentPoem;
  var poetName = readingStore.currentPoet?.Nickname || poetSlug.value;
  var list = coupletPairs.value.map(function (pair) {
    return {
      poemId: poem.Id,
      coupletIndex: pair.coupletIndex,
      poemTitle: poem.Title,
      poetName: poetName,
      textFirst: pair.rightVerse?.Text || '',
      textSecond: pair.leftVerse?.Text || ''
    };
  });
  var res = await memorizeStore.addPoemCards(list);
  alert(`تمام ${toPersianDigits(res.added)} بیت این شعر به جعبه حفظ شما افزوده شد.`);
}

async function onRemoveEntirePoemFromMemorize() {
  if (!readingStore.currentPoem) return;
  if (!confirm('آیا مایلید تمام ابیات این شعر از فهرست حفظ شما حذف شود؟')) return;
  await memorizeStore.deletePoemCards(readingStore.currentPoem.Id);
}

async function onStepMemorize(coupletIndex: number) {
  var pair = coupletPairs.value.find(function (p) { return p.coupletIndex === coupletIndex; });
  if (!pair || !readingStore.currentPoem) return;

  var existingCard = await memorizeStore.findCard(readingStore.currentPoem.Id, coupletIndex);
  activeStepCard.value = existingCard || {
    deckId: memorizeStore.activeDeckId ?? 0,
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
    dueDate: toLocalDateString()
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

function onJumpToCouplet(coupletIndex: number) {
  readingStore.selectCouplet(coupletIndex);
  showMobileLiterary.value = false;
  var el = document.getElementById('couplet-' + coupletIndex);
  if (el) {
    el.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }
}

function buildShareUrl(coupletIndex?: number): string {
  if (typeof window === 'undefined') return '';
  try {
    var url = new URL(window.location.href);
    if (coupletIndex !== undefined) {
      url.searchParams.set('couplet', String(coupletIndex));
    } else {
      url.searchParams.delete('couplet');
    }
    return url.toString();
  } catch (e) {
    return window.location.href;
  }
}

function formatExportText(text: string): string {
  return appStore.showDiacritics ? text : stripPersianDiacritics(text);
}

function onShareCard(coupletIndex: number) {
  var pair = coupletPairs.value.find(function (p) { return p.coupletIndex === coupletIndex; });
  if (!pair) return;
  exportMode.value = 'couplet';
  activeExportFirst.value = formatExportText(pair.rightVerse?.Text || '');
  activeExportSecond.value = formatExportText(pair.leftVerse?.Text || '');
  exportCouplets.value = [];
  exportShareUrl.value = buildShareUrl(coupletIndex);
  showExportModal.value = true;
}

function onShareFullPoem() {
  if (!readingStore.currentPoem || coupletPairs.value.length === 0) return;
  exportMode.value = 'poem';
  exportCouplets.value = coupletPairs.value.map(function (pair) {
    return {
      firstMisra: formatExportText(pair.rightVerse?.Text || ''),
      secondMisra: formatExportText(pair.leftVerse?.Text || '')
    };
  });
  activeExportFirst.value = '';
  activeExportSecond.value = '';
  exportShareUrl.value = buildShareUrl();
  showExportModal.value = true;
}

function getSimilarPoemLink(p: GanjoorPoem): string {
  if (p.FullUrl) {
    var clean = p.FullUrl.replace(/^\/+|\/+$/g, '');
    return `/read/${clean}`;
  }
  return `/poem/${p.Id}`;
}
</script>
