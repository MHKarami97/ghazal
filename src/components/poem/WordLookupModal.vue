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
      <div class="w-full sm:max-w-lg rounded-t-3xl sm:rounded-3xl bg-paper-light dark:bg-paper-surface border border-ink-200 dark:border-paper-border shadow-2xl p-5 sm:p-6 space-y-4 max-h-[88vh] flex flex-col">
        <!-- سربرگ -->
        <div class="flex items-start justify-between gap-3 pb-3 border-b border-ink-200/60 dark:border-paper-border shrink-0">
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
              معنی واژه، مشخصات دستوری و پیوند جست‌وجو در فرهنگ‌نامه‌ها
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

        <!-- بخش ۱: نمایش ساختاریافتهٔ معنی کلمه -->
        <div class="rounded-2xl bg-paper-warm/70 dark:bg-paper-dark border border-ink-200/70 dark:border-paper-border flex-1 min-h-0 flex flex-col overflow-hidden">
          <div class="px-4 py-2.5 border-b border-ink-200/50 dark:border-paper-border/60 flex items-center justify-between text-xs font-bold text-brand-700 dark:text-brand-300 shrink-0 bg-paper-warm/90 dark:bg-paper-dark">
            <span class="flex items-center gap-1.5">
              <BookOpen class="w-4 h-4" />
              معنی و شناسنامهٔ واژه
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

          <div class="p-4 overflow-y-auto space-y-4">
            <div v-if="isLoading" class="py-6 flex items-center justify-center gap-2 text-xs text-ink-500">
              <InlineSpinner size="sm" class="text-brand-600" />
              <span>در حال دریافت معنی از واژه‌نامه...</span>
            </div>

            <template v-else-if="lookupResult?.found && lookupResult.sections.length > 0">
              <div
                v-for="(sec, sIdx) in lookupResult.sections"
                :key="sIdx"
                class="rounded-2xl p-3.5 border space-y-3"
                :class="sIdx === 0
                  ? 'bg-paper-light dark:bg-paper-surface border-ink-200/70 dark:border-paper-border shadow-2xs'
                  : 'bg-paper-warm/50 dark:bg-paper-surface/60 border-dashed border-ink-200 dark:border-paper-border/80'"
              >
                <!-- سربرگ زبان + برچسب‌های ریشه و املا -->
                <div class="flex flex-wrap items-center gap-1.5 text-[11px]">
                  <span
                    class="px-2 py-0.5 rounded-lg font-bold"
                    :class="sec.language === 'فارسی'
                      ? 'bg-brand-600 text-white'
                      : 'bg-ink-200/80 dark:bg-ink-800 text-ink-700 dark:text-ink-200'"
                  >
                    {{ sec.language }}
                  </span>

                  <span
                    v-if="sec.etymologies.length > 0"
                    class="px-2 py-0.5 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-800 dark:text-amber-300"
                  >
                    <strong class="font-bold">ریشه: </strong>{{ sec.etymologies.join(' · ') }}
                  </span>

                  <span
                    v-if="sec.altForms.length > 0"
                    class="px-2 py-0.5 rounded-lg bg-ink-100 dark:bg-paper-dark border border-ink-200/60 dark:border-paper-border text-ink-600 dark:text-ink-300"
                  >
                    <strong class="font-bold">گونهٔ دیگر: </strong>{{ sec.altForms.join('، ') }}
                  </span>
                </div>

                <!-- آوایش و تلفظ -->
                <div
                  v-if="sec.pronunciations.length > 0"
                  class="flex flex-wrap items-center gap-1.5 text-[11px] p-2 rounded-xl bg-paper-warm/70 dark:bg-paper-dark border border-ink-200/50 dark:border-paper-border/60"
                >
                  <span class="font-bold text-ink-500 dark:text-ink-400 ml-1">آوایش:</span>
                  <span
                    v-for="(pron, pIdx) in sec.pronunciations"
                    :key="pIdx"
                    class="px-2 py-0.5 rounded-md bg-paper-light dark:bg-paper-surface border border-ink-200/60 dark:border-paper-border text-ink-700 dark:text-ink-200 inline-flex items-center gap-1"
                  >
                    <span class="text-ink-400">{{ pron.label }}:</span>
                    <span class="font-mono font-semibold" dir="auto">{{ pron.value }}</span>
                  </span>
                </div>

                <!-- نقش‌های دستوری و معانی شماره‌دار -->
                <div v-if="sec.entries.length > 0" class="space-y-3">
                  <div
                    v-for="(entry, eIdx) in sec.entries"
                    :key="eIdx"
                    class="space-y-1.5"
                  >
                    <div class="flex flex-wrap items-center gap-2 text-xs">
                      <span class="px-2 py-0.5 rounded-md bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 font-bold text-[11px]">
                        {{ entry.pos }}
                      </span>
                      <span
                        v-if="entry.headword"
                        class="font-black text-sm text-ink-900 dark:text-ink-50"
                      >
                        {{ entry.headword }}
                      </span>
                    </div>

                    <ol class="space-y-1.5 pr-1">
                      <li
                        v-for="(sense, idx) in entry.senses"
                        :key="idx"
                        class="flex items-start gap-2 text-xs text-ink-800 dark:text-ink-200 leading-relaxed"
                      >
                        <span class="w-4 h-4 rounded-full bg-brand-500/15 text-brand-700 dark:text-brand-300 font-bold text-[10px] flex items-center justify-center shrink-0 mt-0.5">
                          {{ toPersianDigits(idx + 1) }}
                        </span>
                        <span class="flex-1">{{ sense }}</span>
                      </li>
                    </ol>
                  </div>
                </div>

                <!-- مترادف‌ها در صورت وجود -->
                <div
                  v-if="sec.synonyms.length > 0"
                  class="pt-2 border-t border-ink-200/40 dark:border-paper-border/50 text-[11px] text-ink-600 dark:text-ink-300"
                >
                  <strong class="text-ink-500 font-bold ml-1">هم‌معنی:</strong>
                  <span>{{ sec.synonyms.join('، ') }}</span>
                </div>
              </div>

              <!-- منابع انتهایی -->
              <div
                v-if="lookupResult.sources.length > 0"
                class="flex flex-wrap items-center gap-1.5 pt-1 text-[10px] text-ink-400"
              >
                <span class="font-bold ml-0.5">منابع:</span>
                <span
                  v-for="(src, sIdx) in lookupResult.sources"
                  :key="sIdx"
                  class="px-2 py-0.5 rounded-md bg-paper-light dark:bg-paper-surface border border-ink-200/60 dark:border-paper-border text-ink-500 dark:text-ink-400"
                >
                  {{ src }}
                </span>
              </div>
            </template>

            <div v-else class="text-xs text-ink-500 dark:text-ink-400 leading-relaxed py-2">
              <span v-if="lookupResult?.offlineError">
                در حال حاضر امکان دریافت برخط معنی وجود ندارد. در صورت دسترسی به اینترنت از دکمه‌های زیر استفاده کنید.
              </span>
              <span v-else>
                مدخل مستقیمی برای «{{ word }}» در ویکی‌واژه یافت نشد؛ می‌توانید از واژه‌یاب (دهخدا و معین) یا گوگل جست‌وجو کنید.
              </span>
            </div>
          </div>
        </div>

        <!-- بخش ۲ و ۳: دکمه‌های جست‌وجو در گوگل و واژه‌یاب -->
        <div class="grid grid-cols-2 gap-2.5 shrink-0">
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
        <div class="pt-3 border-t border-ink-200/60 dark:border-paper-border flex items-center justify-between gap-2 text-[11px] shrink-0">
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
