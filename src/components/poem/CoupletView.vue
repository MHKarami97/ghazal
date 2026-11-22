<template>
  <div
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
      class="transition-opacity absolute -top-3.5 left-4 flex items-center gap-1 bg-paper-light dark:bg-paper-dark px-2.5 py-1 rounded-full shadow-md border border-ink-200/80 dark:border-paper-border text-xs z-10"
      :class="[
        isSelected || (highlightMode !== 'none' && isPlayingCouplet)
          ? 'opacity-100 pointer-events-auto'
          : 'opacity-0 group-hover:opacity-100 focus-within:opacity-100 pointer-events-none group-hover:pointer-events-auto'
      ]"
    >
      <!-- دکمه پخش صوت از این بیت -->
      <button
        v-if="hasAudioSync"
        @click.stop="$emit('play-from-couplet', coupletIndex)"
        class="p-1 rounded-full hover:bg-brand-500/10 transition-colors"
        :class="isPlayingCouplet ? 'text-amber-600 dark:text-amber-400 font-bold bg-amber-500/15' : 'text-brand-600 dark:text-brand-400'"
        :title="isPlayingCouplet ? 'در حال پخش این بیت' : 'پخش صوت از این بیت'"
      >
        <Volume2 class="w-3.5 h-3.5" :class="{ 'animate-pulse': isPlayingCouplet }" />
      </button>

      <button
        @click.stop="$emit('toggle-bookmark', coupletIndex)"
        class="p-1 rounded-full hover:bg-ink-100 dark:hover:bg-paper-surface text-ink-600 dark:text-ink-400"
        :class="{ 'text-amber-500 fill-amber-500': isBookmarked }"
        title="نشانک‌گذاری بیت"
      >
        <Bookmark class="w-3.5 h-3.5" :class="{ 'fill-amber-500': isBookmarked }" />
      </button>

      <button
        @click.stop="$emit('add-to-memorize', coupletIndex)"
        class="p-1 rounded-full hover:bg-ink-100 dark:hover:bg-paper-surface transition-colors"
        :class="isMemorized ? 'text-purple-600 dark:text-purple-400 bg-purple-500/15' : 'text-ink-600 dark:text-ink-400'"
        :title="isMemorized ? 'حذف این بیت از جعبه حفظ' : 'افزودن این بیت به جعبه حفظ'"
      >
        <Brain class="w-3.5 h-3.5" :class="{ 'text-purple-600 dark:text-purple-400': isMemorized }" />
      </button>

      <button
        @click.stop="$emit('step-memorize', coupletIndex)"
        class="p-1 rounded-full hover:bg-ink-100 dark:hover:bg-paper-surface text-ink-600 dark:text-ink-400"
        title="تمرین و حفظ مرحله‌ای این بیت"
      >
        <Sparkles class="w-3.5 h-3.5 text-brand-600" />
      </button>

      <button
        @click.stop="$emit('add-to-collection', coupletIndex)"
        class="p-1 rounded-full hover:bg-ink-100 dark:hover:bg-paper-surface text-ink-600 dark:text-ink-400"
        title="افزودن به مجموعه‌های شخصی"
      >
        <FolderPlus class="w-3.5 h-3.5" />
      </button>

      <button
        @click.stop="$emit('share-card', coupletIndex)"
        class="p-1 rounded-full hover:bg-ink-100 dark:hover:bg-paper-surface text-ink-600 dark:text-ink-400"
        title="اشتراک‌گذاری کارت تصویر"
      >
        <Share2 class="w-3.5 h-3.5" />
      </button>
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
            <span class="inline rounded-md px-1 py-0 transition-all duration-700 ease-out" :class="getWordHighlightClass(1, tIdx)">
              <span
                v-if="token.tag && showLiteraryTags"
                class="literary-highlight"
                :class="{ 'uncertain': token.tag.Uncertain }"
                @click.stop="$emit('select-tag', token.tag)"
                :title="`آرایه ادبی (کد ${token.tag.DeviceId})`"
              >{{ token.word }}</span><span
                v-else-if="wordClickEnabled && cleanWord(token.word)"
                class="cursor-pointer hover:text-brand-600 dark:hover:text-brand-400 hover:bg-brand-500/10 rounded px-0.5 transition-colors"
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
            <span class="inline rounded-md px-1 py-0 transition-all duration-700 ease-out" :class="getWordHighlightClass(2, tIdx)">
              <span
                v-if="token.tag && showLiteraryTags"
                class="literary-highlight"
                :class="{ 'uncertain': token.tag.Uncertain }"
                @click.stop="$emit('select-tag', token.tag)"
                :title="`آرایه ادبی (کد ${token.tag.DeviceId})`"
              >{{ token.word }}</span><span
                v-else-if="wordClickEnabled && cleanWord(token.word)"
                class="cursor-pointer hover:text-brand-600 dark:hover:text-brand-400 hover:bg-brand-500/10 rounded px-0.5 transition-colors"
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
  var minSize = Math.max(12, Math.round(baseSize * 0.72));

  var rWidth = measureLineWidth(rEl);
  var lWidth = measureLineWidth(lEl);
  var maxMisraWidth = Math.max(rWidth, lWidth);

  var isDesktopWide = availableWidth >= 640;
  var maxTargetWidth = isDesktopWide ? (availableWidth * 0.48) : (availableWidth - 16);

  if (maxMisraWidth > maxTargetWidth && maxMisraWidth > 0) {
    var ratio = maxTargetWidth / maxMisraWidth;
    var targetSize = Math.floor(baseSize * ratio);
    effectiveFontSize.value = Math.max(minSize, Math.min(baseSize, targetSize));
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
    return 'font-extrabold text-brand-700 dark:text-brand-300 bg-brand-500/22 dark:bg-brand-400/26 shadow-[0_0_12px_rgba(217,119,6,0.30)] dark:shadow-[0_0_14px_rgba(251,191,36,0.28)]';
  }

  // ۲. رد کلمه قبلی (طیف پسین اول با ماندگاری نرم و محو)
  if (diff === 1) {
    return 'font-bold text-brand-700/85 dark:text-brand-300/85 bg-brand-500/12 dark:bg-brand-400/15 shadow-[0_0_8px_rgba(217,119,6,0.14)] dark:shadow-[0_0_10px_rgba(251,191,36,0.14)]';
  }

  // ۳. رد کلمه ماقبل قبلی (طیف پسین دوم در حال محو شدن کامل)
  if (diff === 2) {
    return 'font-semibold text-brand-700/55 dark:text-brand-300/55 bg-brand-500/6 dark:bg-brand-400/8 shadow-[0_0_5px_rgba(217,119,6,0.06)]';
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
