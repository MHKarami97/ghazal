<template>
  <teleport to="body">
    <div
      v-if="show && word"
      class="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/60 backdrop-blur-xs"
      role="dialog"
      aria-modal="true"
      aria-label="اطلاعات و معنی واژه"
      @click.self="$emit('close')"
    >
      <div class="w-full sm:max-w-md rounded-t-3xl sm:rounded-3xl bg-paper-light dark:bg-paper-surface border border-ink-200 dark:border-paper-border shadow-2xl p-5 sm:p-6 space-y-4">
        <!-- سربرگ -->
        <div class="flex items-start justify-between gap-3 pb-3 border-b border-ink-200/60 dark:border-paper-border">
          <div class="min-w-0">
            <div class="flex flex-wrap items-center gap-2">
              <h3 class="text-xl font-black text-ink-900 dark:text-ink-50">
                «{{ word }}»
              </h3>
              <span class="px-2 py-0.5 rounded-full bg-brand-500/10 text-brand-700 dark:text-brand-300 text-[11px] font-bold">
                ابجد کبیر: {{ toPersianDigits(wordAbjad.kabir) }}
              </span>
            </div>
            <p class="text-[11px] text-ink-400 mt-1">
              فرهنگ واژگان، جست‌وجوی سریع و مرجع لغت‌نامه
            </p>
          </div>

          <button
            type="button"
            @click="$emit('close')"
            class="p-1.5 rounded-xl text-ink-500 hover:bg-ink-100 dark:hover:bg-paper-dark transition-colors shrink-0"
            title="بستن"
          >
            <X class="w-5 h-5" />
          </button>
        </div>

        <!-- بخش ۱: نمایش معنی کلمه -->
        <div class="p-4 rounded-2xl bg-paper-warm/80 dark:bg-paper-dark border border-ink-200/70 dark:border-paper-border space-y-2.5">
          <div class="flex items-center justify-between text-xs font-bold text-brand-700 dark:text-brand-300">
            <span class="flex items-center gap-1.5">
              <BookOpen class="w-4 h-4" />
              معنی کلمه
            </span>
            <a
              v-if="lookupResult?.sourceUrl && lookupResult.found"
              :href="lookupResult.sourceUrl"
              target="_blank"
              rel="noopener noreferrer"
              class="text-[10px] font-normal text-ink-400 hover:text-brand-600 flex items-center gap-1"
            >
              <span>ویکی‌واژه</span>
              <ExternalLink class="w-3 h-3" />
            </a>
          </div>

          <div v-if="isLoading" class="py-4 flex items-center justify-center gap-2 text-xs text-ink-500">
            <InlineSpinner size="sm" class="text-brand-600" />
            <span>در حال دریافت معنی از واژه‌نامه...</span>
          </div>

          <div v-else-if="lookupResult?.found && lookupResult.definitions.length > 0" class="max-h-48 overflow-y-auto space-y-1.5 pr-1">
            <p
              v-for="(defLine, idx) in lookupResult.definitions"
              :key="idx"
              class="text-xs text-ink-800 dark:text-ink-200 leading-relaxed"
            >
              {{ defLine }}
            </p>
          </div>

          <div v-else class="text-xs text-ink-500 dark:text-ink-400 leading-relaxed py-1">
            <span v-if="lookupResult?.offlineError">
              در حال حاضر امکان دریافت برخط معنی وجود ندارد. در صورت دسترسی به اینترنت از دکمه‌های زیر استفاده کنید.
            </span>
            <span v-else>
              مدخل مستقیمی برای «{{ word }}» در ویکی‌واژه یافت نشد؛ می‌توانید از واژه‌یاب (دهخدا و معین) یا گوگل جست‌وجو کنید.
            </span>
          </div>
        </div>

        <!-- بخش ۲ و ۳: دکمه‌های جست‌وجو در گوگل و واژه‌یاب -->
        <div class="grid grid-cols-2 gap-2.5">
          <a
            :href="vajehyabUrl"
            target="_blank"
            rel="noopener noreferrer"
            class="py-2.5 px-3 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-xs transition-colors"
          >
            <BookText class="w-4 h-4" />
            <span>جست‌وجو در واژه‌یاب</span>
            <ExternalLink class="w-3 h-3 opacity-80" />
          </a>

          <a
            :href="googleUrl"
            target="_blank"
            rel="noopener noreferrer"
            class="py-2.5 px-3 rounded-xl border border-ink-200 dark:border-paper-border hover:bg-ink-100 dark:hover:bg-paper-dark text-ink-800 dark:text-ink-100 font-bold text-xs flex items-center justify-center gap-1.5 transition-colors"
          >
            <Search class="w-4 h-4 text-brand-600" />
            <span>جست‌وجو در گوگل</span>
            <ExternalLink class="w-3 h-3 opacity-60" />
          </a>
        </div>

        <!-- بخش ۴: امکان غیرفعال کردن کلیک روی کلمه -->
        <div class="pt-3 border-t border-ink-200/60 dark:border-paper-border flex items-center justify-between gap-2 text-[11px]">
          <span class="text-ink-400 leading-relaxed">
            برای فعال‌سازی مجدد می‌توانید به بخش تنظیمات مراجعه کنید.
          </span>
          <button
            type="button"
            @click="$emit('disable')"
            class="shrink-0 px-2.5 py-1.5 rounded-lg text-rose-600 dark:text-rose-400 hover:bg-rose-500/10 font-bold flex items-center gap-1 transition-colors"
          >
            <EyeOff class="w-3.5 h-3.5" />
            <span>غیرفعال کردن</span>
          </button>
        </div>
      </div>
    </div>
  </teleport>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue';
import { wordLookupService, type WordMeaningResult } from '../../services/WordLookupService';
import { calculateAbjad } from '../../utils/abjad';
import { toPersianDigits } from '../../utils/persianNormalizer';
import InlineSpinner from '../common/InlineSpinner.vue';
import { X, BookOpen, BookText, Search, ExternalLink, EyeOff } from 'lucide-vue-next';

var props = defineProps<{
  show: boolean;
  word: string;
}>();

defineEmits(['close', 'disable']);

var isLoading = ref<boolean>(false);
var lookupResult = ref<WordMeaningResult | null>(null);

var wordAbjad = computed(function () {
  return calculateAbjad(props.word || '');
});

var googleUrl = computed(function () {
  return `https://www.google.com/search?q=${encodeURIComponent(props.word)}`;
});

var vajehyabUrl = computed(function () {
  return `https://www.vajehyab.com/?q=${encodeURIComponent(props.word)}`;
});

var activeRequestId = 0;

watch(
  () => [props.show, props.word],
  async function () {
    if (!props.show || !props.word) return;
    var reqId = ++activeRequestId;
    isLoading.value = true;
    lookupResult.value = null;

    var res = await wordLookupService.lookup(props.word);
    if (reqId === activeRequestId) {
      lookupResult.value = res;
      isLoading.value = false;
    }
  },
  { immediate: true }
);
</script>
