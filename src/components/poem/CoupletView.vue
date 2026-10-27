<template>
  <div
    class="group relative py-4 px-3 sm:px-6 rounded-2xl transition-all duration-200"
    :class="[
      isSelected
        ? 'bg-brand-500/10 dark:bg-brand-500/15 ring-1 ring-brand-500/30'
        : 'hover:bg-ink-100/60 dark:hover:bg-paper-surface/50'
    ]"
    @click="$emit('select-couplet', coupletIndex)"
  >
    <!-- نوار اقدام‌های سریع بیت (در حالت Hover دسکتاپ یا انتخاب) -->
    <div
      class="opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition-opacity absolute -top-3.5 left-4 flex items-center gap-1 bg-paper-light dark:bg-paper-dark px-2 py-1 rounded-full shadow-md border border-ink-200/80 dark:border-paper-border text-xs z-10"
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
        class="p-1 rounded-full hover:bg-ink-100 dark:hover:bg-paper-surface text-ink-600 dark:text-ink-400"
        title="افزودن به فهرست حفظ"
      >
        <Brain class="w-3.5 h-3.5" />
      </button>

      <button
        @click.stop="$emit('share-card', coupletIndex)"
        class="p-1 rounded-full hover:bg-ink-100 dark:hover:bg-paper-surface text-ink-600 dark:text-ink-400"
        title="اشتراک‌گذاری کارت تصویر"
      >
        <Share2 class="w-3.5 h-3.5" />
      </button>
    </div>

    <!-- شماره بیت -->
    <div class="text-[11px] font-bold text-brand-600/60 dark:text-brand-400/60 text-center mb-1">
      {{ toPersianDigits(coupletIndex + 1) }}
    </div>

    <!-- متن ابیات -->
    <div
      class="poem-beyt font-vazir"
      :style="{
        fontSize: `${fontSize}px`,
        lineHeight: `${lineHeight}`
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
          >
            {{ token.text }}
          </span>
          <span v-else>{{ token.text }}</span>
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
          >
            {{ token.text }}
          </span>
          <span v-else>{{ token.text }}</span>
        </template>
      </div>
    </div>

    <!-- معنی و خلاصه بیت (در صورت وجود و فعال بودن) -->
    <div
      v-if="summary && showSummary"
      class="mt-2 text-xs text-ink-500 dark:text-ink-400 bg-brand-50/50 dark:bg-brand-950/20 p-2.5 rounded-xl border-r-2 border-brand-500 text-right leading-relaxed"
    >
      <span class="font-bold text-brand-700 dark:text-brand-300">مفهوم بیت:</span>
      {{ summary }}
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { toPersianDigits } from '../../utils/persianNormalizer';
import type { GanjoorLiteraryTag } from '../../types/ganjoor';
import { Bookmark, Brain, Share2 } from 'lucide-vue-next';

var props = withDefaults(
  defineProps<{
    coupletIndex: number;
    rightVerseText: string;
    leftVerseText: string;
    summary?: string;
    fontSize: number;
    lineHeight: number;
    isSelected?: boolean;
    isBookmarked?: boolean;
    literaryTags?: GanjoorLiteraryTag[];
    showLiteraryTags?: boolean;
    showSummary?: boolean;
  }>(),
  {
    showLiteraryTags: true,
    showSummary: true
  }
);

defineEmits(['select-couplet', 'select-tag', 'toggle-bookmark', 'add-to-memorize', 'share-card']);

interface WordToken {
  text: string;
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
      text: word + (i < words.length - 1 ? ' ' : ''),
      tag: matchedTag
    });
  }

  return tokens;
}
</script>
