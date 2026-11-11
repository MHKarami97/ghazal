<template>
  <div
    v-if="vocabulary.totalWords > 0"
    class="mt-8 p-5 rounded-2xl bg-paper-light dark:bg-paper-surface border border-ink-200/80 dark:border-paper-border shadow-xs space-y-4"
  >
    <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-ink-200/60 dark:border-paper-border">
      <div>
        <div class="flex items-center gap-2">
          <BarChart3 class="w-4 h-4 text-brand-600 dark:text-brand-400" />
          <h3 class="font-bold text-sm sm:text-base text-ink-900 dark:text-ink-50">
            واژگان و بسامد کلمات این شعر
          </h3>
        </div>
        <p class="text-[11px] text-ink-500 mt-0.5">
          کل واژگان شعر: <strong>{{ toPersianDigits(vocabulary.totalWords) }}</strong> واژه · واژگان یکتا: <strong>{{ toPersianDigits(vocabulary.uniqueWords) }}</strong> کلمه
        </p>
      </div>

      <div class="relative w-full sm:w-52">
        <input
          v-model="filterQuery"
          type="text"
          placeholder="جست‌وجوی واژه در این شعر..."
          class="w-full py-1.5 pr-8 pl-3 rounded-xl border border-ink-200 dark:border-paper-border bg-paper-warm/50 dark:bg-paper-dark text-xs outline-hidden focus:border-brand-500"
        />
        <Search class="w-3.5 h-3.5 text-ink-400 absolute right-2.5 top-2" />
      </div>
    </div>

    <!-- جدول/کارت‌های بسامد واژگان -->
    <div v-if="displayedItems.length > 0" class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5">
      <button
        v-for="item in displayedItems"
        :key="item.word"
        type="button"
        @click="$emit('select-word', item.word)"
        class="p-2.5 rounded-xl bg-paper-warm/60 dark:bg-paper-dark border border-ink-200/60 dark:border-paper-border hover:border-brand-500/50 transition-all text-right space-y-1.5 group"
        title="کلیک برای مشاهده معنی و جست‌وجوی این واژه"
      >
        <div class="flex items-center justify-between gap-2 text-xs">
          <span class="font-bold text-ink-900 dark:text-ink-100 group-hover:text-brand-600 dark:group-hover:text-brand-400 truncate">
            {{ item.word }}
          </span>
          <div class="flex items-center gap-1.5 shrink-0 text-[11px]">
            <span class="px-1.5 py-0.5 rounded-md bg-brand-500/10 text-brand-700 dark:text-brand-300 font-bold">
              {{ toPersianDigits(item.count) }} بار
            </span>
            <span class="text-ink-500 font-medium">
              ٪{{ toPersianDigits(item.percentage.toFixed(1)) }}
            </span>
          </div>
        </div>

        <div class="h-1 w-full rounded-full bg-ink-200/70 dark:bg-ink-800 overflow-hidden">
          <div
            class="h-full rounded-full bg-brand-500/70 transition-all"
            :style="{ width: `${Math.min(100, (item.count / maxCount) * 100)}%` }"
          ></div>
        </div>
      </button>
    </div>

    <div v-else class="text-center py-4 text-xs text-ink-400">
      واژه‌ای مطابق جست‌وجوی شما در این شعر یافت نشد.
    </div>

    <!-- دکمه نمایش همه واژگان -->
    <div v-if="filteredItems.length > 18" class="pt-1 text-center">
      <button
        type="button"
        @click="showAll = !showAll"
        class="px-4 py-1.5 rounded-xl border border-ink-200 dark:border-paper-border text-xs font-bold text-brand-600 dark:text-brand-400 hover:bg-brand-500/5 transition-colors"
      >
        {{
          showAll
            ? 'نمایش خلاصه (۱۸ واژهٔ نخست)'
            : `نمایش همه واژگان (${toPersianDigits(filteredItems.length)} کلمه)`
        }}
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import type { PoemVocabularyStats } from '../../utils/abjad';
import { toPersianDigits } from '../../utils/persianNormalizer';
import { BarChart3, Search } from 'lucide-vue-next';

var props = defineProps<{
  vocabulary: PoemVocabularyStats;
}>();

defineEmits(['select-word']);

var filterQuery = ref<string>('');
var showAll = ref<boolean>(false);

var maxCount = computed(function () {
  if (!props.vocabulary.items.length) return 1;
  return props.vocabulary.items[0].count || 1;
});

var filteredItems = computed(function () {
  var q = filterQuery.value.trim();
  if (!q) return props.vocabulary.items;
  return props.vocabulary.items.filter(function (item) {
    return item.word.includes(q);
  });
});

var displayedItems = computed(function () {
  if (showAll.value || filterQuery.value.trim()) {
    return filteredItems.value;
  }
  return filteredItems.value.slice(0, 18);
});
</script>
