<template>
  <div
    data-couplet-view
    class="group relative px-2 sm:px-4 rounded-2xl transition-all duration-200"
    :class="[
      isCompact ? 'py-1.5 sm:py-2' : 'py-3 sm:py-4',
      highlightMode !== 'none' && isPlayingCouplet
        ? 'bg-brand-500/15 dark:bg-brand-500/20 ring-2 ring-brand-500/40 shadow-sm'
        : isSelected
          ? 'bg-brand-500/10 dark:bg-brand-500/15 ring-1 ring-brand-500/30'
          : 'hover:bg-ink-100/60 dark:hover:bg-paper-surface/50'
    ]"
    @click="$emit('select-couplet', coupletIndex)"
  >
    <!-- نوار اقدام‌های سریع بیت (در حالت انتخاب یا Hover دسکتاپ) -->
    <div
      class="absolute -top-4 left-2 sm:left-4 z-20 flex items-center gap-1 sm:gap-1.5 p-1 sm:p-1.5 rounded-2xl bg-paper-light/95 dark:bg-paper-surface/95 backdrop-blur-md border border-brand-500/25 dark:border-paper-border shadow-md shadow-brand-900/5 dark:shadow-ink-950/40 text-xs transition-all duration-200 ease-out"
      :class="[
        isSelected || (highlightMode !== 'none' && isPlayingCouplet)
          ? 'opacity-100 scale-100 translate-y-0 pointer-events-auto ring-1 ring-brand-500/20'
          : 'opacity-0 scale-95 translate-y-1 pointer-events-none group-hover:opacity-100 group-hover:scale-100 group-hover:translate-y-0 group-hover:pointer-events-auto'
      ]"
    >
      <!-- دکمه پخش صوت از این بیت -->
      <div v-if="hasAudioSync" class="relative group/btn flex items-center">
        <button
          type="button"
          @click.stop="$emit('play-from-couplet', coupletIndex)"
          class="flex items-center gap-1.5 p-2 sm:px-2.5 sm:py-1.5 rounded-xl transition-all duration-150 active:scale-95"
          :class="isPlayingCouplet
            ? 'text-brand-700 dark:text-brand-300 font-bold bg-brand-500/20 dark:bg-brand-500/25 ring-1 ring-brand-500/30'
            : 'text-ink-600 dark:text-ink-300 hover:text-brand-700 dark:hover:text-brand-300 hover:bg-brand-500/10 dark:hover:bg-brand-500/15'"
          :title="isPlayingCouplet ? 'در حال پخش این بیت' : 'پخش صوت از این بیت'"
          :aria-label="isPlayingCouplet ? 'در حال پخش این بیت' : 'پخش صوت از این بیت'"
        >
          <Volume2 class="w-4 h-4 sm:w-3.5 sm:h-3.5 shrink-0" :class="{ 'animate-pulse text-brand-600': isPlayingCouplet }" />
          <span class="hidden sm:inline text-[11px] font-medium leading-none">{{ isPlayingCouplet ? 'در حال پخش' : 'پخش' }}</span>
        </button>
        <span class="sm:hidden pointer-events-none absolute -bottom-7 left-1/2 -translate-x-1/2 whitespace-nowrap px-2 py-0.5 rounded-md bg-ink-900/90 dark:bg-paper-dark text-white dark:text-ink-100 text-[10px] font-medium shadow-md opacity-0 group-hover/btn:opacity-100 group-focus-within/btn:opacity-100 transition-opacity z-30">
          {{ isPlayingCouplet ? 'در حال پخش' : 'پخش از این بیت' }}
        </span>
      </div>

      <div v-if="hasAudioSync" class="w-px h-4 bg-ink-200/80 dark:bg-paper-border mx-0.5 shrink-0"></div>

      <!-- دکمه نشانک‌گذاری بیت -->
      <div class="relative group/btn flex items-center">
        <button
          type="button"
          @click.stop="$emit('toggle-bookmark', coupletIndex)"
          class="flex items-center gap-1.5 p-2 sm:px-2.5 sm:py-1.5 rounded-xl transition-all duration-150 active:scale-95"
          :class="isBookmarked
            ? 'text-brand-700 dark:text-brand-300 font-semibold bg-brand-500/20 dark:bg-brand-500/25 ring-1 ring-brand-500/30'
            : 'text-ink-600 dark:text-ink-300 hover:text-brand-700 dark:hover:text-brand-300 hover:bg-brand-500/10 dark:hover:bg-brand-500/15'"
          :title="isBookmarked ? 'حذف از نشانک‌ها' : 'نشانک‌گذاری بیت'"
          :aria-label="isBookmarked ? 'حذف از نشانک‌ها' : 'نشانک‌گذاری بیت'"
        >
          <Bookmark class="w-4 h-4 sm:w-3.5 sm:h-3.5 shrink-0" :class="{ 'fill-current': isBookmarked }" />
          <span class="hidden sm:inline text-[11px] font-medium leading-none">{{ isBookmarked ? 'نشان‌شده' : 'نشانک' }}</span>
        </button>
        <span class="sm:hidden pointer-events-none absolute -bottom-7 left-1/2 -translate-x-1/2 whitespace-nowrap px-2 py-0.5 rounded-md bg-ink-900/90 dark:bg-paper-dark text-white dark:text-ink-100 text-[10px] font-medium shadow-md opacity-0 group-hover/btn:opacity-100 group-focus-within/btn:opacity-100 transition-opacity z-30">
          {{ isBookmarked ? 'حذف نشانک' : 'نشانک‌گذاری' }}
        </span>
      </div>

      <!-- دکمه جعبه حفظ بیت -->
      <div class="relative group/btn flex items-center">
        <button
          type="button"
          @click.stop="$emit('add-to-memorize', coupletIndex)"
          class="flex items-center gap-1.5 p-2 sm:px-2.5 sm:py-1.5 rounded-xl transition-all duration-150 active:scale-95"
          :class="isMemorized
            ? 'text-brand-700 dark:text-brand-300 font-semibold bg-brand-500/20 dark:bg-brand-500/25 ring-1 ring-brand-500/30'
            : 'text-ink-600 dark:text-ink-300 hover:text-brand-700 dark:hover:text-brand-300 hover:bg-brand-500/10 dark:hover:bg-brand-500/15'"
          :title="isMemorized ? 'حذف از جعبه حفظ' : 'افزودن این بیت به جعبه حفظ'"
          :aria-label="isMemorized ? 'حذف از جعبه حفظ' : 'افزودن این بیت به جعبه حفظ'"
        >
          <Brain class="w-4 h-4 sm:w-3.5 sm:h-3.5 shrink-0" />
          <span class="hidden sm:inline text-[11px] font-medium leading-none">{{ isMemorized ? 'در حفظ' : 'حفظ' }}</span>
        </button>
        <span class="sm:hidden pointer-events-none absolute -bottom-7 left-1/2 -translate-x-1/2 whitespace-nowrap px-2 py-0.5 rounded-md bg-ink-900/90 dark:bg-paper-dark text-white dark:text-ink-100 text-[10px] font-medium shadow-md opacity-0 group-hover/btn:opacity-100 group-focus-within/btn:opacity-100 transition-opacity z-30">
          {{ isMemorized ? 'حذف از حفظ' : 'افزودن به حفظ' }}
        </span>
      </div>

      <!-- دکمه تمرین مرحله‌ای حفظ -->
      <div class="relative group/btn flex items-center">
        <button
          type="button"
          @click.stop="$emit('step-memorize', coupletIndex)"
          class="flex items-center gap-1.5 p-2 sm:px-2.5 sm:py-1.5 rounded-xl text-ink-600 dark:text-ink-300 hover:text-brand-700 dark:hover:text-brand-300 hover:bg-brand-500/10 dark:hover:bg-brand-500/15 transition-all duration-150 active:scale-95"
          title="تمرین و حفظ مرحله‌ای این بیت"
          aria-label="تمرین و حفظ مرحله‌ای این بیت"
        >
          <Sparkles class="w-4 h-4 sm:w-3.5 sm:h-3.5 shrink-0" />
          <span class="hidden sm:inline text-[11px] font-medium leading-none">تمرین</span>
        </button>
        <span class="sm:hidden pointer-events-none absolute -bottom-7 left-1/2 -translate-x-1/2 whitespace-nowrap px-2 py-0.5 rounded-md bg-ink-900/90 dark:bg-paper-dark text-white dark:text-ink-100 text-[10px] font-medium shadow-md opacity-0 group-hover/btn:opacity-100 group-focus-within/btn:opacity-100 transition-opacity z-30">
          تمرین حفظ بیت
        </span>
      </div>

      <!-- دکمه افزودن به مجموعه‌های شخصی -->
      <div class="relative group/btn flex items-center">
        <button
          type="button"
          @click.stop="$emit('add-to-collection', coupletIndex)"
          class="flex items-center gap-1.5 p-2 sm:px-2.5 sm:py-1.5 rounded-xl text-ink-600 dark:text-ink-300 hover:text-brand-700 dark:hover:text-brand-300 hover:bg-brand-500/10 dark:hover:bg-brand-500/15 transition-all duration-150 active:scale-95"
          title="افزودن این بیت به مجموعه‌ها"
          aria-label="افزودن این بیت به مجموعه‌ها"
        >
          <FolderPlus class="w-4 h-4 sm:w-3.5 sm:h-3.5 shrink-0" />
          <span class="hidden sm:inline text-[11px] font-medium leading-none">مجموعه</span>
        </button>
        <span class="sm:hidden pointer-events-none absolute -bottom-7 left-1/2 -translate-x-1/2 whitespace-nowrap px-2 py-0.5 rounded-md bg-ink-900/90 dark:bg-paper-dark text-white dark:text-ink-100 text-[10px] font-medium shadow-md opacity-0 group-hover/btn:opacity-100 group-focus-within/btn:opacity-100 transition-opacity z-30">
          افزودن به مجموعه
        </span>
      </div>

      <!-- دکمه اشتراک‌گذاری کارت تصویر بیت -->
      <div class="relative group/btn flex items-center">
        <button
          type="button"
          @click.stop="$emit('share-card', coupletIndex)"
          class="flex items-center gap-1.5 p-2 sm:px-2.5 sm:py-1.5 rounded-xl text-ink-600 dark:text-ink-300 hover:text-brand-700 dark:hover:text-brand-300 hover:bg-brand-500/10 dark:hover:bg-brand-500/15 transition-all duration-150 active:scale-95"
          title="اشتراک‌گذاری و خروجی کارت تصویر"
          aria-label="اشتراک‌گذاری و خروجی کارت تصویر"
        >
          <Share2 class="w-4 h-4 sm:w-3.5 sm:h-3.5 shrink-0" />
          <span class="hidden sm:inline text-[11px] font-medium leading-none">اشتراک</span>
        </button>
        <span class="sm:hidden pointer-events-none absolute -bottom-7 left-1/2 -translate-x-1/2 whitespace-nowrap px-2 py-0.5 rounded-md bg-ink-900/90 dark:bg-paper-dark text-white dark:text-ink-100 text-[10px] font-medium shadow-md opacity-0 group-hover/btn:opacity-100 group-focus-within/btn:opacity-100 transition-opacity z-30">
          اشتراک کارت تصویر
        </span>
      </div>
    </div>

    <!-- شماره بیت و نمایش ابجد (در صورت فعال بودن) -->
    <div
      class="flex items-center justify-center gap-2 font-bold text-brand-600/60 dark:text-brand-400/60 text-center"
      :class="isCompact ? 'text-[10px] leading-none mb-0.5' : 'text-[11px] mb-1'"
    >
      <span
        v-if="highlightMode !== 'none' && isPlayingCouplet"
        class="inline-flex items-center gap-1 text-brand-700 dark:text-brand-300 font-bold animate-pulse text-[11px] px-2 py-0.5 rounded-full bg-brand-500/15"
      >
        <Headphones class="w-3.5 h-3.5" />
        <span>در حال خوانش</span>
      </span>
      <span>{{ toPersianDigits(coupletIndex + 1) }}</span>
      <span
        v-if="showAbjad"
        class="px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-700 dark:text-amber-300 text-[10px] font-bold"
        :title="`مصرع اول: ${toPersianDigits(rightAbjad.kabir)} | مصرع دوم: ${toPersianDigits(leftAbjad.kabir)}`"
      >
        ابجد کبیر: {{ toPersianDigits(coupletAbjad.kabir) }}
      </span>
    </div>

    <!-- متن ابیات -->
    <div
      ref="beytRef"
      class="poem-beyt mb-0"
      :style="{
        fontSize: `${effectiveFontSize}px`,
        lineHeight: `${fontFamily?.includes('Noto Nastaliq') ? Math.max(lineHeight, 2.35) : (isCompact ? Math.min(lineHeight, 1.9) : lineHeight)}`,
        fontFamily: fontFamily || `'Vazirmatn', system-ui, sans-serif`
      }"
    >
      <!-- مصرع اول (راست) -->
      <div
        class="poem-misra font-medium transition-all duration-300"
        :class="[
          highlightMode === 'misra' && isPlayingCouplet && activePlayingMisra === 1
            ? 'bg-brand-500/12 dark:bg-brand-400/15 rounded-xl px-2 py-0.5 text-ink-950 dark:text-white font-semibold shadow-2xs'
            : (highlightMode === 'word' && isPlayingCouplet && activePlayingMisra === 1
                ? 'text-ink-950 dark:text-white font-semibold'
                : 'text-ink-900 dark:text-ink-100')
        ]"
      >
        <span ref="rightLineRef" :class="singleLineFit ? 'whitespace-nowrap' : ''">
          <template v-for="(token, tIdx) in renderTokens(rightVerseText, 1)" :key="'r-' + tIdx">
            <span class="inline rounded-md transition-all duration-700 ease-out" :class="getWordHighlightClass(1, tIdx)">
              <span
                v-if="token.tag && showLiteraryTags"
                class="literary-highlight"
                :class="{ 'uncertain': token.tag.Uncertain }"
                @click.stop="$emit('select-tag', token.tag)"
                :title="`آرایه ادبی (کد ${token.tag.DeviceId})`"
              >{{ token.word }}</span><span
                v-else-if="wordClickEnabled && cleanWord(token.word)"
                class="cursor-pointer hover:text-brand-600 dark:hover:text-brand-400 hover:bg-brand-500/10 rounded transition-colors"
                @click.stop="$emit('select-word', cleanWord(token.word))"
                title="مشاهده معنی و جست‌وجوی واژه"
              >{{ token.word }}</span><span v-else>{{ token.word }}</span>
            </span>{{ token.trailingSpace }}
          </template>
        </span>
      </div>

      <!-- مصرع دوم (چپ) -->
      <div
        class="poem-misra font-medium transition-all duration-300"
        :class="[
          highlightMode === 'misra' && isPlayingCouplet && activePlayingMisra === 2
            ? 'bg-brand-500/12 dark:bg-brand-400/15 rounded-xl px-2 py-0.5 text-ink-950 dark:text-white font-semibold shadow-2xs'
            : (highlightMode === 'word' && isPlayingCouplet && activePlayingMisra === 2
                ? 'text-ink-950 dark:text-white font-semibold'
                : 'text-ink-900 dark:text-ink-100')
        ]"
      >
        <span ref="leftLineRef" :class="singleLineFit ? 'whitespace-nowrap' : ''">
          <template v-for="(token, tIdx) in renderTokens(leftVerseText, 2)" :key="'l-' + tIdx">
            <span class="inline rounded-md transition-all duration-700 ease-out" :class="getWordHighlightClass(2, tIdx)">
              <span
                v-if="token.tag && showLiteraryTags"
                class="literary-highlight"
                :class="{ 'uncertain': token.tag.Uncertain }"
                @click.stop="$emit('select-tag', token.tag)"
                :title="`آرایه ادبی (کد ${token.tag.DeviceId})`"
              >{{ token.word }}</span><span
                v-else-if="wordClickEnabled && cleanWord(token.word)"
                class="cursor-pointer hover:text-brand-600 dark:hover:text-brand-400 hover:bg-brand-500/10 rounded transition-colors"
                @click.stop="$emit('select-word', cleanWord(token.word))"
                title="مشاهده معنی و جست‌وجوی واژه"
              >{{ token.word }}</span><span v-else>{{ token.word }}</span>
            </span>{{ token.trailingSpace }}
          </template>
        </span>
      </div>
    </div>

    <!-- معنی و خلاصه بیت (در صورت وجود و فعال بودن) -->
    <div
      v-if="cleanedSummary && showSummary"
      class="mt-2.5 text-xs text-ink-500 dark:text-ink-400 bg-brand-50/50 dark:bg-brand-950/20 p-2.5 rounded-xl border-r-2 border-brand-500 text-right leading-relaxed"
    >
      {{ cleanedSummary }}
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch, onMounted, onBeforeUnmount, nextTick } from 'vue';
import { toPersianDigits } from '../../utils/persianNormalizer';
import { calculateAbjad, cleanPoemWord, stripPersianDiacritics } from '../../utils/abjad';
import { cleanPoemSummary } from '../../utils/formatters';
import type { GanjoorLiteraryTag } from '../../types/ganjoor';
import { Bookmark, Brain, Share2, Sparkles, FolderPlus, Volume2, Headphones } from 'lucide-vue-next';

var props = withDefaults(
  defineProps<{
    coupletIndex: number;
    rightVerseText: string;
    leftVerseText: string;
    summary?: string;
    fontSize: number;
    lineHeight: number;
    fontFamily?: string;
    isSelected?: boolean;
    isBookmarked?: boolean;
    isMemorized?: boolean;
    literaryTags?: GanjoorLiteraryTag[];
    showLiteraryTags?: boolean;
    showSummary?: boolean;
    showAbjad?: boolean;
    showDiacritics?: boolean;
    wordClickEnabled?: boolean;
    isPlayingCouplet?: boolean;
    activePlayingMisra?: 1 | 2 | null;
    activePlayingWordIndex?: number | null;
    wordHighlightEnabled?: boolean;
    highlightMode?: 'word' | 'misra' | 'none';
    hasAudioSync?: boolean;
  }>(),
  {
    showLiteraryTags: true,
    showSummary: true,
    showAbjad: false,
    showDiacritics: true,
    wordClickEnabled: true,
    isPlayingCouplet: false,
    activePlayingMisra: null,
    activePlayingWordIndex: null,
    wordHighlightEnabled: true,
    highlightMode: 'word',
    hasAudioSync: false
  }
);

var cleanedSummary = computed(function () {
  return cleanPoemSummary(props.summary);
});

var beytRef = ref<HTMLElement | null>(null);
var rightLineRef = ref<HTMLElement | null>(null);
var leftLineRef = ref<HTMLElement | null>(null);
var effectiveFontSize = ref<number>(props.fontSize);
var singleLineFit = ref<boolean>(false);

var resizeObserver: ResizeObserver | null = null;
var rafId: number | null = null;
var lastMeasuredWidth = 0;

function measureLineWidth(el: HTMLElement): number {
  if (!(el.textContent || '').trim()) return 0;
  return el.getBoundingClientRect().width;
}

function fitCoupletFont() {
  var beytEl = beytRef.value;
  var rEl = rightLineRef.value;
  var lEl = leftLineRef.value;
  if (!beytEl || !rEl || !lEl) {
    effectiveFontSize.value = props.fontSize;
    singleLineFit.value = false;
    return;
  }

  var availableWidth = beytEl.getBoundingClientRect().width;
  if (availableWidth <= 0) return;

  var baseSize = props.fontSize;
  var minSize = Math.max(12, Math.round(baseSize * 0.65));

  var isDesktopWide = availableWidth >= 640;
  var gap = availableWidth >= 1024 ? 28 : (availableWidth >= 640 ? 20 : 0);
  var maxTargetWidth = isDesktopWide ? Math.floor((availableWidth - gap) / 2) - 8 : (availableWidth - 16);

  var rWidth = measureLineWidth(rEl);
  var lWidth = measureLineWidth(lEl);
  var maxMisraWidth = Math.max(rWidth, lWidth);

  var currentSize = effectiveFontSize.value || baseSize;

  if (maxMisraWidth > maxTargetWidth && maxMisraWidth > 0) {
    var ratio = maxTargetWidth / maxMisraWidth;
    var targetSize = Math.floor(currentSize * ratio);
    effectiveFontSize.value = Math.max(minSize, Math.min(baseSize, targetSize));
  } else if (maxMisraWidth < maxTargetWidth * 0.85 && currentSize < baseSize) {
    var upscaleRatio = maxTargetWidth / maxMisraWidth;
    var recoveredSize = Math.min(baseSize, Math.floor(currentSize * Math.min(upscaleRatio, 1.15)));
    effectiveFontSize.value = Math.max(minSize, recoveredSize);
  } else {
    effectiveFontSize.value = baseSize;
  }

  singleLineFit.value = true;
}

function scheduleFit() {
  if (rafId !== null) cancelAnimationFrame(rafId);
  rafId = requestAnimationFrame(function () {
    nextTick(function () {
      fitCoupletFont();
    });
  });
}

onMounted(function () {
  scheduleFit();
  if (typeof ResizeObserver !== 'undefined' && beytRef.value) {
    resizeObserver = new ResizeObserver(function (entries) {
      var w = entries[0]?.contentRect?.width || 0;
      if (Math.abs(w - lastMeasuredWidth) >= 2) {
        lastMeasuredWidth = w;
        scheduleFit();
      }
    });
    resizeObserver.observe(beytRef.value);
  }
  if (typeof document !== 'undefined' && document.fonts) {
    void document.fonts.ready.then(scheduleFit);
    if (typeof document.fonts.addEventListener === 'function') {
      document.fonts.addEventListener('loadingdone', scheduleFit);
    }
  }
});

onBeforeUnmount(function () {
  if (resizeObserver) {
    resizeObserver.disconnect();
    resizeObserver = null;
  }
  if (rafId !== null) {
    cancelAnimationFrame(rafId);
    rafId = null;
  }
  if (typeof document !== 'undefined' && document.fonts && typeof document.fonts.removeEventListener === 'function') {
    document.fonts.removeEventListener('loadingdone', scheduleFit);
  }
});

watch(
  function () {
    return [
      props.fontSize,
      props.fontFamily,
      props.rightVerseText,
      props.leftVerseText,
      props.showDiacritics,
      props.showLiteraryTags
    ];
  },
  function () {
    effectiveFontSize.value = props.fontSize;
    scheduleFit();
  }
);

var isCompact = computed(function () {
  return !props.showLiteraryTags && !props.showSummary;
});

var rightAbjad = computed(function () {
  return calculateAbjad(props.rightVerseText || '');
});

var leftAbjad = computed(function () {
  return calculateAbjad(props.leftVerseText || '');
});

var coupletAbjad = computed(function () {
  return calculateAbjad(`${props.rightVerseText || ''} ${props.leftVerseText || ''}`);
});

function cleanWord(raw: string): string {
  return cleanPoemWord(raw);
}

function getWordHighlightClass(misraNumber: number, tokenIndex: number): string {
  if (
    props.highlightMode !== 'word' ||
    !props.isPlayingCouplet ||
    props.activePlayingMisra !== misraNumber ||
    props.activePlayingWordIndex === null ||
    props.activePlayingWordIndex === undefined
  ) {
    return 'bg-transparent text-inherit shadow-none';
  }
  if (!props.wordHighlightEnabled) {
    return 'bg-transparent text-inherit shadow-none';
  }

  var activeIdx = props.activePlayingWordIndex;
  var diff = activeIdx - tokenIndex;

  // ۱. کلمه در حال خوانده شدن (درخشش کامل بدون خط تیز کادر)
  if (diff === 0) {
    return 'font-extrabold text-brand-700 dark:text-brand-300 bg-brand-500/22 dark:bg-brand-400/26 px-1 py-0.5 rounded shadow-[0_0_12px_rgba(217,119,6,0.30)] dark:shadow-[0_0_14px_rgba(251,191,36,0.28)]';
  }

  // ۲. رد کلمه قبلی (طیف پسین اول با ماندگاری نرم و محو)
  if (diff === 1) {
    return 'font-bold text-brand-700/85 dark:text-brand-300/85 bg-brand-500/12 dark:bg-brand-400/15 px-1 py-0.5 rounded shadow-[0_0_8px_rgba(217,119,6,0.14)] dark:shadow-[0_0_10px_rgba(251,191,36,0.14)]';
  }

  // ۳. رد کلمه ماقبل قبلی (طیف پسین دوم در حال محو شدن کامل)
  if (diff === 2) {
    return 'font-semibold text-brand-700/55 dark:text-brand-300/55 bg-brand-500/6 dark:bg-brand-400/8 px-0.5 py-0.5 rounded shadow-[0_0_5px_rgba(217,119,6,0.06)]';
  }

  return 'bg-transparent text-inherit shadow-none';
}

defineEmits([
  'select-couplet',
  'select-tag',
  'select-word',
  'toggle-bookmark',
  'add-to-memorize',
  'step-memorize',
  'add-to-collection',
  'share-card',
  'play-from-couplet'
]);

interface WordToken {
  word: string;
  trailingSpace: string;
  tag?: GanjoorLiteraryTag;
}

/**
 * تقطیع کلمات مصرع و اعمال هایلایت آرایه‌ها بر اساس WordStart/WordEnd
 */
function renderTokens(text: string, misraNumber: number): WordToken[] {
  if (!text) return [];
  var words = text.split(' ');
  var relevantTags = (props.literaryTags || []).filter(function (tag) {
    return tag.CoupletIndex === props.coupletIndex;
  });

  var tokens: WordToken[] = [];

  for (var i = 0; i < words.length; i++) {
    var word = words[i];
    var wordPos = i + 1; // 1-indexed
    var displayWord = props.showDiacritics === false ? stripPersianDiacritics(word) : word;

    // جست‌وجوی تطبیق با اسلات‌های آرایه
    var matchedTag: GanjoorLiteraryTag | undefined;
    for (var t = 0; t < relevantTags.length; t++) {
      var tag = relevantTags[t];
      for (var p = 0; p < tag.Parts.length; p++) {
        var part = tag.Parts[p];
        if (
          (part.Misra === 0 || part.Misra === misraNumber) &&
          part.WordStart !== undefined &&
          part.WordEnd !== undefined &&
          wordPos >= part.WordStart &&
          wordPos <= part.WordEnd
        ) {
          matchedTag = tag;
          break;
        }
      }
      if (matchedTag) break;
    }

    tokens.push({
      word: displayWord,
      trailingSpace: i < words.length - 1 ? ' ' : '',
      tag: matchedTag
    });
  }

  return tokens;
}
</script>
