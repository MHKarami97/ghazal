<template>
  <div
    class="group relative px-3 sm:px-6 rounded-2xl transition-all duration-200"
    :class="[
      isCompact ? 'py-1.5 sm:py-2' : 'py-3 sm:py-4',
      isSelected
        ? 'bg-brand-500/10 dark:bg-brand-500/15 ring-1 ring-brand-500/30'
        : 'hover:bg-ink-100/60 dark:hover:bg-paper-surface/50'
    ]"
    @click="$emit('select-couplet', coupletIndex)"
  >
    <!-- نوار اقدام‌های سریع بیت (در حالت انتخاب یا Hover دسکتاپ) -->
    <div
      class="transition-opacity absolute -top-3.5 left-4 flex items-center gap-1 bg-paper-light dark:bg-paper-dark px-2.5 py-1 rounded-full shadow-md border border-ink-200/80 dark:border-paper-border text-xs z-10"
      :class="[
        isSelected
          ? 'opacity-100 pointer-events-auto'
          : 'opacity-0 group-hover:opacity-100 focus-within:opacity-100 pointer-events-none group-hover:pointer-events-auto'
      ]"
    >
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
      class="poem-beyt mb-0"
      :style="{
        fontSize: `${fontSize}px`,
        lineHeight: `${fontFamily?.includes('Noto Nastaliq') ? Math.max(lineHeight, 2.35) : (isCompact ? Math.min(lineHeight, 1.9) : lineHeight)}`,
        fontFamily: fontFamily || `'Vazirmatn', system-ui, sans-serif`
      }"
    >
      <!-- مصرع اول (راست) -->
      <div class="poem-misra font-medium text-ink-900 dark:text-ink-100">
        <template v-for="(token, tIdx) in renderTokens(rightVerseText, 1)" :key="'r-' + tIdx">
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
          >{{ token.word }}</span><span v-else>{{ token.word }}</span>{{ token.trailingSpace }}
        </template>
      </div>

      <!-- مصرع دوم (چپ) -->
      <div class="poem-misra font-medium text-ink-900 dark:text-ink-100">
        <template v-for="(token, tIdx) in renderTokens(leftVerseText, 2)" :key="'l-' + tIdx">
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
          >{{ token.word }}</span><span v-else>{{ token.word }}</span>{{ token.trailingSpace }}
        </template>
      </div>
    </div>

    <!-- معنی و خلاصه بیت (در صورت وجود و فعال بودن) -->
    <div
      v-if="summary && showSummary"
      class="mt-2.5 text-xs text-ink-500 dark:text-ink-400 bg-brand-50/50 dark:bg-brand-950/20 p-2.5 rounded-xl border-r-2 border-brand-500 text-right leading-relaxed"
    >
      <span class="font-bold text-brand-700 dark:text-brand-300">مفهوم بیت:</span>
      {{ summary }}
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { toPersianDigits } from '../../utils/persianNormalizer';
import { calculateAbjad, cleanPoemWord, stripPersianDiacritics } from '../../utils/abjad';
import type { GanjoorLiteraryTag } from '../../types/ganjoor';
import { Bookmark, Brain, Share2, Sparkles, FolderPlus } from 'lucide-vue-next';

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
  }>(),
  {
    showLiteraryTags: true,
    showSummary: true,
    showAbjad: false,
    showDiacritics: true,
    wordClickEnabled: true
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

defineEmits([
  'select-couplet',
  'select-tag',
  'select-word',
  'toggle-bookmark',
  'add-to-memorize',
  'step-memorize',
  'add-to-collection',
  'share-card'
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
