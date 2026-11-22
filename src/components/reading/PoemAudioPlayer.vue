<template>
  <div v-if="recitations && recitations.length > 0" class="my-4 p-3.5 sm:p-4 rounded-2xl bg-gradient-to-r from-amber-500/10 via-brand-500/10 to-paper-warm/70 dark:to-paper-surface border border-brand-500/30 shadow-xs transition-all">
    <!-- ۱. حالت فشرده و کوچک نوار خوانش صوت (Collapsed) -->
    <div v-if="isCollapsed" class="flex items-center justify-between gap-3">
      <div
        class="flex items-center gap-2.5 min-w-0 cursor-pointer flex-1 group"
        @click="appStore.toggleSectionCollapsed('audioPlayer')"
      >
        <div class="w-8 h-8 rounded-xl bg-brand-600 text-white flex items-center justify-center shadow-xs shrink-0 group-hover:scale-105 transition-transform">
          <Headphones class="w-4 h-4" :class="{ 'animate-pulse': isPlaying }" />
        </div>
        <div class="min-w-0">
          <div class="flex items-center gap-1.5">
            <span class="text-xs font-bold text-ink-900 dark:text-ink-50 group-hover:text-brand-600 dark:group-hover:text-brand-400 transition-colors">
              {{ activeAudioTab === 'commentary' ? 'شرح صوتی و تفسیر' : 'خوانش و دکلمه صوتی' }}
            </span>
            <span
              v-if="hasSyncData"
              class="hidden sm:inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 font-bold"
              title="همگامی هوشمند بیت به بیت و کلمه به کلمه فعال است"
            >
              <Sparkles class="w-3 h-3 text-amber-500" />
              همگام
            </span>
            <span
              v-if="isPlaying"
              class="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full bg-brand-500/15 text-brand-700 dark:text-brand-300 font-bold animate-pulse"
            >
              در حال پخش...
            </span>
          </div>
          <div v-if="activeRecitation" class="text-[11px] text-ink-500 truncate">
            با صدای: <strong class="text-brand-700 dark:text-brand-400 font-bold">{{ activeRecitation?.audioArtist || 'نامشخص' }}</strong>
          </div>
        </div>
      </div>

      <div class="flex items-center gap-2 shrink-0">
        <!-- دکمه مینی پخش / توقف در حالت فشرده -->
        <button
          v-if="currentTabList.length > 0"
          type="button"
          @click.stop="togglePlay"
          class="w-8 h-8 rounded-xl bg-brand-600 hover:bg-brand-700 active:scale-95 text-white flex items-center justify-center shadow-xs transition-all"
          :title="isPlaying ? 'توقف پخش' : 'پخش دکلمه'"
        >
          <Loader2 v-if="isLoadingAudio" class="w-3.5 h-3.5 animate-spin" />
          <Pause v-else-if="isPlaying" class="w-3.5 h-3.5" />
          <Play v-else class="w-3.5 h-3.5 translate-x-[-1px]" />
        </button>

        <!-- دکمه باز کردن پنل کامل -->
        <button
          type="button"
          @click="appStore.toggleSectionCollapsed('audioPlayer')"
          class="p-1.5 sm:px-2.5 sm:py-1.5 rounded-xl border border-ink-200/80 dark:border-paper-border bg-paper-light dark:bg-paper-dark hover:bg-brand-500/10 hover:border-brand-500/40 text-ink-700 dark:text-ink-200 hover:text-brand-600 transition-colors flex items-center gap-1 text-xs font-bold shadow-2xs"
          title="باز کردن پنل کامل خوانش صوت"
        >
          <span class="hidden sm:inline text-[11px]">باز کردن</span>
          <ChevronDown class="w-4 h-4 text-brand-600" />
        </button>
      </div>
    </div>

    <!-- ۲. حالت کامل و گسترده نوار خوانش صوت (Expanded) -->
    <template v-else>
      <!-- سربرگ و سوئیچ خوانش / شرح صوتی -->
      <div class="flex flex-wrap items-center justify-between gap-2.5 mb-3">
        <div class="flex items-center gap-2">
          <div class="w-8 h-8 rounded-xl bg-brand-600 text-white flex items-center justify-center shadow-xs shrink-0">
            <Headphones class="w-4 h-4" :class="{ 'animate-pulse': isPlaying }" />
          </div>
          <div>
            <div class="flex items-center gap-1.5">
              <span class="text-xs font-bold text-ink-900 dark:text-ink-50">
                {{ activeAudioTab === 'commentary' ? 'شرح صوتی و تفسیر' : 'خوانش و دکلمه صوتی' }}
              </span>
              <span
                v-if="hasSyncData"
                class="hidden sm:inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 font-bold"
                title="همگامی هوشمند بیت به بیت و کلمه به کلمه فعال است"
              >
                <Sparkles class="w-3 h-3 text-amber-500" />
                همگام با متن
              </span>
            </div>
            <div v-if="activeRecitation" class="text-[11px] text-ink-500">
              با صدای: <strong class="text-brand-700 dark:text-brand-400">{{ activeRecitation?.audioArtist || 'نامشخص' }}</strong>
            </div>
          </div>
        </div>

        <div class="flex items-center gap-2">
          <!-- تب تغییر بین خوانش‌ها و شرح‌های صوتی -->
          <div class="flex items-center p-0.5 rounded-xl bg-paper-light/80 dark:bg-paper-dark border border-ink-200/70 dark:border-paper-border text-[11px]">
            <button
              type="button"
              @click="activeAudioTab = 'normal'"
              class="px-2.5 py-1 rounded-lg font-bold transition-all whitespace-nowrap"
              :class="activeAudioTab === 'normal' ? 'bg-brand-600 text-white shadow-xs' : 'text-ink-600 dark:text-ink-400 hover:text-ink-900'"
            >
              خوانش ({{ toPersianDigits(normalRecitations.length) }})
            </button>
            <button
              type="button"
              @click="activeAudioTab = 'commentary'"
              class="px-2.5 py-1 rounded-lg font-bold transition-all whitespace-nowrap"
              :class="activeAudioTab === 'commentary' ? 'bg-brand-600 text-white shadow-xs' : 'text-ink-600 dark:text-ink-400 hover:text-ink-900'"
            >
              شرح‌های صوتی ({{ toPersianDigits(commentaryRecitations.length) }})
            </button>
          </div>

          <!-- دکمه بستن و کوچک کردن نوار -->
          <button
            type="button"
            @click="appStore.toggleSectionCollapsed('audioPlayer')"
            class="p-1.5 rounded-xl border border-ink-200/80 dark:border-paper-border bg-paper-light/90 dark:bg-paper-dark hover:bg-brand-500/10 hover:border-brand-500/40 text-ink-600 dark:text-ink-300 hover:text-brand-600 transition-colors shadow-2xs shrink-0"
            title="بستن و کوچک کردن نوار خوانش صوت"
          >
            <ChevronUp class="w-4 h-4" />
          </button>
        </div>
      </div>

    <!-- انتخاب خوانشگر / شارح در صورت تعدد -->
    <div v-if="currentTabList.length > 1" class="flex items-center gap-1.5 text-xs mb-3">
      <span class="text-ink-500 text-[11px] shrink-0">
        {{ activeAudioTab === 'commentary' ? 'انتخاب شرح:' : 'تغییر راوی:' }}
      </span>
      <select
        v-model="selectedRecitationId"
        class="px-2.5 py-1 rounded-xl text-xs font-bold border border-ink-200/80 dark:border-paper-border bg-paper-light dark:bg-paper-dark text-ink-900 dark:text-ink-100 outline-hidden cursor-pointer max-w-[200px] sm:max-w-xs truncate"
      >
        <option v-for="r in currentTabList" :key="r.id" :value="r.id">
          {{ r.audioArtist }} ({{ r.audioTitle }})
        </option>
      </select>
    </div>

    <!-- پیام در صورت خالی بودن تب فعلی -->
    <div
      v-if="currentTabList.length === 0"
      class="py-3 px-4 rounded-xl bg-paper-light/60 dark:bg-paper-dark/60 border border-dashed border-ink-200 dark:border-paper-border text-center text-xs text-ink-500"
    >
      {{ activeAudioTab === 'commentary' ? 'برای این شعر هنوز شرح صوتی در گنجور ثبت نشده است.' : 'برای این شعر هنوز خوانش عادی ثبت نشده است.' }}
    </div>

    <!-- پلیر و کنترل‌ها -->
    <div v-else class="space-y-2">
      <!-- نوار پیشرفت -->
      <div class="flex items-center gap-2.5 text-[11px] font-mono text-ink-500">
        <span class="w-10 text-left">{{ toPersianDigits(formatTime(currentTime)) }}</span>
        <div class="relative flex-1 h-2 rounded-full bg-ink-200/80 dark:bg-paper-dark overflow-hidden cursor-pointer" @click="seek">
          <div
            class="h-full bg-gradient-to-r from-brand-500 to-amber-500 rounded-full transition-all"
            :style="{ width: `${progressPercent}%` }"
          ></div>
        </div>
        <span class="w-10 text-right">{{ toPersianDigits(formatTime(duration)) }}</span>
      </div>

      <!-- دکمه‌های کنترل پخش -->
      <div class="flex items-center justify-between pt-1">
        <div class="flex items-center gap-2">
          <!-- دکمه پخش / توقف -->
          <button
            @click="togglePlay"
            type="button"
            class="w-9 h-9 rounded-xl bg-brand-600 hover:bg-brand-700 text-white flex items-center justify-center shadow-sm transition-transform active:scale-95"
            :title="isPlaying ? 'توقف پخش' : 'پخش دکلمه'"
          >
            <Loader2 v-if="isLoadingAudio" class="w-4 h-4 animate-spin" />
            <Pause v-else-if="isPlaying" class="w-4 h-4" />
            <Play v-else class="w-4 h-4 translate-x-[-1px]" />
          </button>

          <!-- دکمه ۱۰ ثانیه به عقب / جلو -->
          <button
            @click="skipTime(-10)"
            type="button"
            class="p-1.5 rounded-lg text-ink-500 hover:text-ink-900 dark:hover:text-ink-100 hover:bg-ink-100 dark:hover:bg-paper-dark transition-colors"
            title="۱۰ ثانیه قبل"
          >
            <RotateCcw class="w-4 h-4" />
          </button>
          <button
            @click="skipTime(10)"
            type="button"
            class="p-1.5 rounded-lg text-ink-500 hover:text-ink-900 dark:hover:text-ink-100 hover:bg-ink-100 dark:hover:bg-paper-dark transition-colors"
            title="۱۰ ثانیه بعد"
          >
            <RotateCw class="w-4 h-4" />
          </button>
        </div>

        <div class="flex items-center gap-3">
          <!-- سرعت پخش -->
          <button
            @click="cycleSpeed"
            type="button"
            class="px-2 py-0.5 rounded-lg text-[11px] font-bold border border-ink-200 dark:border-paper-border hover:bg-ink-100 dark:hover:bg-paper-dark text-ink-600 dark:text-ink-300"
            title="سرعت پخش"
          >
            {{ playbackRate }}x
          </button>

          <!-- صدا / بی‌صدا -->
          <button
            @click="toggleMute"
            type="button"
            class="p-1.5 rounded-lg text-ink-500 hover:text-ink-900 dark:hover:text-ink-100 transition-colors"
            :title="isMuted ? 'وصل صدا' : 'قطع صدا'"
          >
            <VolumeX v-if="isMuted" class="w-4 h-4 text-rose-500" />
            <Volume2 v-else class="w-4 h-4" />
          </button>

          <!-- لینک فایل صوتی -->
          <a
            v-if="activeRecitation?.mp3Url"
            :href="activeRecitation.mp3Url"
            target="_blank"
            download
            class="p-1.5 rounded-lg text-ink-400 hover:text-brand-600 transition-colors"
            title="دریافت فایل صوتی MP3"
          >
            <Download class="w-4 h-4" />
          </a>
        </div>
      </div>

      <!-- نوار وضعیت همگامی متن، پیمایش خودکار و بولد کلمه به کلمه -->
      <div class="flex flex-wrap items-center justify-between gap-2 pt-2.5 mt-2 border-t border-brand-500/20 text-[11px]">
        <div class="flex items-center gap-1.5">
          <template v-if="isLoadingSync">
            <Loader2 class="w-3.5 h-3.5 animate-spin text-brand-600" />
            <span class="text-ink-500 text-[11px]">در حال دریافت داده‌های همگامی متن...</span>
          </template>
          <template v-else-if="hasSyncData">
            <span class="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            <span class="font-bold text-emerald-800 dark:text-emerald-300">
              {{ isPlaying && activePosition ? `در حال خوانش: بیت ${toPersianDigits(activePosition.coupletIndex + 1)} (${activePosition.misra === 1 ? 'مصرع اول' : 'مصرع دوم'})` : 'همگام با متن فعال است' }}
            </span>
          </template>
          <template v-else>
            <Info class="w-3.5 h-3.5 text-ink-400" />
            <span class="text-ink-500">فاقد داده همگامی متنی در گنجور</span>
          </template>
        </div>

        <!-- کنترل‌های تنظیمات همگامی -->
        <div v-if="hasSyncData" class="flex flex-wrap items-center gap-2">
          <!-- انتخاب حالت هایلایت: کلمه به کلمه / مصرع به مصرع / بدون هایلایت -->
          <div class="flex items-center p-0.5 rounded-xl bg-paper-light dark:bg-paper-dark border border-ink-200/80 dark:border-paper-border text-[11px] shadow-2xs">
            <button
              type="button"
              @click="readingStore.setAudioHighlightMode('word')"
              class="px-2 py-0.5 rounded-lg transition-all"
              :class="readingStore.audioHighlightMode === 'word' ? 'bg-brand-600 text-white font-bold shadow-xs' : 'text-ink-600 dark:text-ink-400 hover:text-ink-900'"
              title="هایلایت کلمه به کلمه با رد ملایم"
            >
              کلمه به کلمه
            </button>
            <button
              type="button"
              @click="readingStore.setAudioHighlightMode('misra')"
              class="px-2 py-0.5 rounded-lg transition-all"
              :class="readingStore.audioHighlightMode === 'misra' ? 'bg-brand-600 text-white font-bold shadow-xs' : 'text-ink-600 dark:text-ink-400 hover:text-ink-900'"
              title="هایلایت کلی مصرع به مصرع"
            >
              مصرع به مصرع
            </button>
            <button
              type="button"
              @click="readingStore.setAudioHighlightMode('none')"
              class="px-2 py-0.5 rounded-lg transition-all"
              :class="readingStore.audioHighlightMode === 'none' ? 'bg-rose-500/15 text-rose-700 dark:text-rose-300 font-bold' : 'text-ink-400 hover:text-ink-700'"
              title="غیرفعال کردن هرگونه هایلایت روی متن"
            >
              بدون هایلایت
            </button>
          </div>

          <!-- دکمه پیمایش خودکار متن -->
          <button
            type="button"
            @click="readingStore.toggleAutoScrollAudio()"
            class="px-2.5 py-1 rounded-xl border text-[11px] font-medium transition-colors flex items-center gap-1 shadow-2xs"
            :class="readingStore.autoScrollAudio ? 'bg-brand-500/15 border-brand-500/40 text-brand-700 dark:text-brand-300 font-bold' : 'border-ink-200 dark:border-paper-border text-ink-500 hover:text-ink-800'"
            title="پیمایش خودکار صفحه همگام با ابیات"
          >
            <Navigation class="w-3 h-3" />
            <span>پیمایش خودکار</span>
          </button>
        </div>
      </div>
    </div>
  </template>

    <!-- خطای پخش صوت -->
    <div
      v-if="audioError"
      class="mt-2 p-2 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-700 dark:text-rose-300 text-[11px] flex items-center justify-between"
    >
      <span>پخش این فایل صوتی با خطا مواجه شد (ممکن است در حالت آفلاین باشید).</span>
      <button @click="audioError = false" class="text-rose-500 font-bold px-1.5">✕</button>
    </div>

    <!-- المنت نامرئی audio -->
    <audio
      v-if="activeRecitation?.mp3Url"
      ref="audioElement"
      :src="activeRecitation.mp3Url"
      preload="metadata"
      @play="onAudioPlay"
      @pause="onAudioPause"
      @timeupdate="onTimeUpdate"
      @loadedmetadata="onLoadedMetadata"
      @waiting="isLoadingAudio = true"
      @canplay="isLoadingAudio = false"
      @ended="onAudioEnded"
      @error="onAudioError"
    ></audio>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onBeforeUnmount } from 'vue';
import { isCommentaryRecitation, recitationService, type PoemRecitation, type RecitationSyncPoint } from '../../services/RecitationService';
import { useAppStore } from '../../stores/appStore';
import { useReadingStore } from '../../stores/readingStore';
import { calculateAudioPosition, findCoupletSyncPoint, type ActiveAudioPosition } from '../../utils/audioSync';
import { toPersianDigits } from '../../utils/persianNormalizer';
import {
  Headphones,
  Play,
  Pause,
  RotateCcw,
  RotateCw,
  Volume2,
  VolumeX,
  Download,
  Loader2,
  Sparkles,
  Highlighter,
  Navigation,
  Info,
  ChevronDown,
  ChevronUp
} from 'lucide-vue-next';

var props = defineProps<{
  recitations: PoemRecitation[];
}>();

var appStore = useAppStore();
var readingStore = useReadingStore();

var isCollapsed = computed(function () {
  return appStore.isSectionCollapsed('audioPlayer');
});

var audioElement = ref<HTMLAudioElement | null>(null);
var activeAudioTab = ref<'normal' | 'commentary'>('normal');
var selectedRecitationId = ref<number | null>(null);
var isPlaying = ref<boolean>(false);
var isLoadingAudio = ref<boolean>(false);
var audioError = ref<boolean>(false);
var currentTime = ref<number>(0);
var duration = ref<number>(0);
var isMuted = ref<boolean>(false);
var playbackRate = ref<number>(1);

var syncPoints = ref<RecitationSyncPoint[]>([]);
var isLoadingSync = ref<boolean>(false);
var activePosition = ref<ActiveAudioPosition | null>(null);
var lastScrolledCoupletIndex = ref<number | null>(null);

var speeds = [1, 1.25, 1.5, 0.8];
var rafId: number | null = null;

var normalRecitations = computed(function () {
  return (props.recitations || []).filter(function (r) {
    return !isCommentaryRecitation(r);
  });
});

var commentaryRecitations = computed(function () {
  return (props.recitations || []).filter(function (r) {
    return isCommentaryRecitation(r);
  });
});

var currentTabList = computed(function () {
  return activeAudioTab.value === 'commentary'
    ? commentaryRecitations.value
    : normalRecitations.value;
});

var activeRecitation = computed(function () {
  var list = currentTabList.value;
  if (!list || list.length === 0) return null;
  if (selectedRecitationId.value) {
    var found = list.find(function (r) { return r.id === selectedRecitationId.value; });
    if (found) return found;
  }
  return list[0];
});

var hasSyncData = computed(function () {
  return syncPoints.value.length > 0;
});

var progressPercent = computed(function () {
  if (!duration.value || duration.value === 0) return 0;
  return Math.min(100, Math.max(0, (currentTime.value / duration.value) * 100));
});

// بارگذاری نقاط همگامی هنگام تغییر فایل صوتی انتخاب‌شده
watch(
  activeRecitation,
  async function (newRec) {
    syncPoints.value = [];
    activePosition.value = null;
    lastScrolledCoupletIndex.value = null;
    if (!newRec) return;

    isLoadingSync.value = true;
    try {
      var syncData = await recitationService.getRecitationSync(newRec);
      if (syncData && syncData.points && syncData.points.length > 0) {
        syncPoints.value = syncData.points;
      }
    } catch (e) {
      syncPoints.value = [];
    } finally {
      isLoadingSync.value = false;
    }
  },
  { immediate: true }
);

watch(
  () => props.recitations,
  function () {
    if (normalRecitations.value.length > 0) {
      activeAudioTab.value = 'normal';
    } else if (commentaryRecitations.value.length > 0) {
      activeAudioTab.value = 'commentary';
    }
    var list = currentTabList.value;
    selectedRecitationId.value = list.length > 0 ? list[0].id : null;
    stopAndReset();
  },
  { immediate: true }
);

watch(activeAudioTab, function () {
  var list = currentTabList.value;
  selectedRecitationId.value = list.length > 0 ? list[0].id : null;
  stopAndReset();
});

watch(selectedRecitationId, function () {
  stopAndReset();
});

// پاسخ به درخواست پرش به یک بیت از داخل CoupletView
watch(
  () => readingStore.seekCoupletRequest,
  function (targetCoupletIndex) {
    if (targetCoupletIndex === null || targetCoupletIndex === undefined) return;
    seekToCouplet(targetCoupletIndex);
    readingStore.clearSeekCoupletRequest();
  }
);

function handleAutoScroll(coupletIndex: number) {
  if (!readingStore.autoScrollAudio) return;
  if (lastScrolledCoupletIndex.value === coupletIndex) return;
  lastScrolledCoupletIndex.value = coupletIndex;

  var el = document.getElementById('couplet-' + coupletIndex);
  if (!el) return;

  var rect = el.getBoundingClientRect();
  var windowHeight = window.innerHeight || document.documentElement.clientHeight;
  // تنها در صورتی که بیت خارج از محدوده راحت مطالعه باشد، اسکرول نرم انجام شود تا پرش مکرر رخ ندهد
  var isOutOfComfortZone = rect.top < windowHeight * 0.18 || rect.bottom > windowHeight * 0.82;
  if (isOutOfComfortZone) {
    el.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }
}

function updateSyncPosition() {
  if (!audioElement.value) return;
  var currSec = audioElement.value.currentTime;
  currentTime.value = currSec;
  var currMs = currSec * 1000;
  var durMs = (duration.value || audioElement.value.duration || 0) * 1000;

  if (syncPoints.value.length > 0) {
    var verses = readingStore.currentPoem?.Verses || [];
    var pos = calculateAudioPosition(currMs, durMs, syncPoints.value, verses);
    activePosition.value = pos;

    if (pos) {
      readingStore.setAudioPlaybackState({
        isPlaying: isPlaying.value,
        hasSync: true,
        coupletIndex: pos.coupletIndex,
        misra: pos.misra,
        wordIndex: pos.wordIndex,
        verseOrder: pos.verseOrder
      });

      if (pos.coupletIndex !== null) {
        handleAutoScroll(pos.coupletIndex);
      }
    } else {
      readingStore.setAudioPlaybackState({
        isPlaying: isPlaying.value,
        hasSync: true,
        coupletIndex: null,
        misra: null,
        wordIndex: null,
        verseOrder: null
      });
    }
  } else {
    readingStore.setAudioPlaybackState({
      isPlaying: isPlaying.value,
      hasSync: false,
      coupletIndex: null,
      misra: null,
      wordIndex: null,
      verseOrder: null
    });
  }
}

function startTicker() {
  stopTicker();
  function tick() {
    if (!isPlaying.value || !audioElement.value) {
      stopTicker();
      return;
    }
    updateSyncPosition();
    rafId = requestAnimationFrame(tick);
  }
  rafId = requestAnimationFrame(tick);
}

function stopTicker() {
  if (rafId !== null) {
    cancelAnimationFrame(rafId);
    rafId = null;
  }
}

function seekToCouplet(coupletIndex: number) {
  if (!syncPoints.value || syncPoints.value.length === 0) return;
  var pt = findCoupletSyncPoint(
    coupletIndex,
    syncPoints.value,
    readingStore.currentPoem?.Verses || []
  );
  if (!pt) return;

  var newTime = pt.audioMs / 1000;
  if (audioElement.value) {
    audioElement.value.currentTime = newTime;
    currentTime.value = newTime;
    updateSyncPosition();
    if (!isPlaying.value) {
      togglePlay();
    }
  }
}

function togglePlay() {
  if (!audioElement.value) return;
  audioError.value = false;
  if (isPlaying.value) {
    audioElement.value.pause();
  } else {
    isLoadingAudio.value = true;
    audioElement.value.play().catch(function (err) {
      console.warn('Playback prevented or failed:', err);
      isLoadingAudio.value = false;
      isPlaying.value = false;
      audioError.value = true;
    });
  }
}

function stopAndReset() {
  audioError.value = false;
  isLoadingAudio.value = false;
  stopTicker();
  if (audioElement.value) {
    audioElement.value.pause();
    audioElement.value.currentTime = 0;
  }
  isPlaying.value = false;
  currentTime.value = 0;
  duration.value = 0;
  activePosition.value = null;
  lastScrolledCoupletIndex.value = null;
  readingStore.resetAudioPlaybackState();
}

function onAudioPlay() {
  isPlaying.value = true;
  isLoadingAudio.value = false;
  audioError.value = false;
  startTicker();
}

function onAudioPause() {
  isPlaying.value = false;
  stopTicker();
  updateSyncPosition();
}

function onTimeUpdate() {
  if (audioElement.value) {
    currentTime.value = audioElement.value.currentTime;
    if (!isPlaying.value) {
      updateSyncPosition();
    }
  }
}

function onLoadedMetadata() {
  if (audioElement.value) {
    duration.value = audioElement.value.duration || 0;
    updateSyncPosition();
  }
}

function onAudioEnded() {
  isPlaying.value = false;
  currentTime.value = 0;
  stopTicker();
  activePosition.value = null;
  lastScrolledCoupletIndex.value = null;
  readingStore.resetAudioPlaybackState();
}

function onAudioError() {
  isLoadingAudio.value = false;
  isPlaying.value = false;
  audioError.value = true;
  stopTicker();
}

function seek(e: MouseEvent) {
  if (!audioElement.value || !duration.value) return;
  var rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
  var clickX = e.clientX - rect.left;
  var ratio = Math.max(0, Math.min(1, clickX / rect.width));
  var newTime = ratio * duration.value;
  audioElement.value.currentTime = newTime;
  currentTime.value = newTime;
  updateSyncPosition();
}

function skipTime(delta: number) {
  if (!audioElement.value) return;
  var next = Math.max(0, Math.min(duration.value, audioElement.value.currentTime + delta));
  audioElement.value.currentTime = next;
  currentTime.value = next;
  updateSyncPosition();
}

function cycleSpeed() {
  var idx = speeds.indexOf(playbackRate.value);
  var nextSpeed = speeds[(idx + 1) % speeds.length];
  playbackRate.value = nextSpeed;
  if (audioElement.value) {
    audioElement.value.playbackRate = nextSpeed;
  }
}

function toggleMute() {
  if (!audioElement.value) return;
  audioElement.value.muted = !audioElement.value.muted;
  isMuted.value = audioElement.value.muted;
}

function formatTime(secs: number): string {
  if (isNaN(secs) || secs < 0) return '00:00';
  var m = Math.floor(secs / 60);
  var s = Math.floor(secs % 60);
  var mm = m < 10 ? '0' + m : String(m);
  var ss = s < 10 ? '0' + s : String(s);
  return `${mm}:${ss}`;
}

onBeforeUnmount(function () {
  stopAndReset();
});
</script>
