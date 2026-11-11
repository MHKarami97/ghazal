<template>
  <section
    v-if="quotations.length > 0"
    class="mt-10 pt-8 border-t border-ink-200/80 dark:border-paper-border space-y-4"
  >
    <div class="flex items-center justify-between gap-2">
      <div class="flex items-center gap-2">
        <div class="w-8 h-8 rounded-xl bg-amber-500/15 text-amber-700 dark:text-amber-300 flex items-center justify-center shrink-0">
          <Quote class="w-4 h-4" />
        </div>
        <div>
          <h3 class="font-bold text-base text-ink-900 dark:text-ink-50">
            نقل‌قول‌ها، استقبال‌ها و تضمین‌ها
          </h3>
          <p class="text-[11px] text-ink-500">
            اشعار مرتبطی که ابیاتی از این سروده را تضمین یا از آن استقبال کرده‌اند (گنجور)
          </p>
        </div>
      </div>
      <span class="px-2.5 py-1 rounded-full bg-amber-500/10 text-amber-700 dark:text-amber-300 text-[11px] font-bold shrink-0">
        {{ toPersianDigits(quotations.length) }} مورد
      </span>
    </div>

    <div class="grid grid-cols-1 gap-3">
      <div
        v-for="(q, idx) in quotations"
        :key="q.id || idx"
        class="p-4 rounded-2xl bg-paper-light dark:bg-paper-surface border border-ink-200/80 dark:border-paper-border hover:border-brand-500/40 transition-all space-y-2.5 shadow-2xs"
      >
        <div class="flex flex-wrap items-center justify-between gap-2 text-xs">
          <div class="flex flex-wrap items-center gap-2 min-w-0">
            <span class="px-2 py-0.5 rounded-lg bg-brand-500/10 text-brand-700 dark:text-brand-300 font-bold text-[11px]">
              {{ q.relatedPoetName }}
            </span>
            <span class="font-bold text-ink-900 dark:text-ink-100 truncate">
              {{ q.relatedPoemTitle }}
            </span>
            <span
              v-if="typeof q.coupletIndex === 'number' && q.coupletIndex >= 0"
              class="text-[10px] px-2 py-0.5 rounded-md bg-ink-100 dark:bg-paper-dark text-ink-500"
            >
              بیت {{ toPersianDigits(q.coupletIndex + 1) }} همین شعر
            </span>
          </div>

          <span
            v-if="typeof q.isPriorToRelated === 'boolean'"
            class="text-[10px] px-2 py-0.5 rounded-full font-medium"
            :class="q.isPriorToRelated
              ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300'
              : 'bg-sky-500/10 text-sky-700 dark:text-sky-300'"
          >
            {{ q.isPriorToRelated ? 'شاهد متقدم / منبع الهام' : 'تضمین یا استقبال از این سروده' }}
          </span>
        </div>

        <!-- ابیات شاهد در شعر مرتبط یا شعر فعلی -->
        <div
          v-if="q.relatedCoupletVerse1 || q.coupletVerse1"
          class="p-3 rounded-xl bg-paper-warm/70 dark:bg-paper-dark border border-ink-200/50 dark:border-paper-border/60 text-xs sm:text-sm space-y-1 text-ink-800 dark:text-ink-200 leading-relaxed"
        >
          <div v-if="q.relatedCoupletVerse1" class="font-medium">
            {{ q.relatedCoupletVerse1 }}
          </div>
          <div v-if="q.relatedCoupletVerse2" class="font-medium text-ink-600 dark:text-ink-300">
            {{ q.relatedCoupletVerse2 }}
          </div>
          <div v-if="!q.relatedCoupletVerse1 && q.coupletVerse1" class="font-medium">
            {{ q.coupletVerse1 }}
          </div>
          <div v-if="!q.relatedCoupletVerse1 && q.coupletVerse2" class="font-medium text-ink-600 dark:text-ink-300">
            {{ q.coupletVerse2 }}
          </div>
        </div>

        <p v-if="q.note" class="text-xs text-ink-500 dark:text-ink-400 leading-relaxed">
          {{ q.note }}
        </p>

        <div v-if="getRelatedRoute(q)" class="flex justify-end pt-1">
          <router-link
            :to="getRelatedRoute(q)"
            class="text-xs font-bold text-brand-600 dark:text-brand-400 hover:underline inline-flex items-center gap-1"
          >
            <span>مطالعه شعر مرتبط</span>
            <ArrowLeft class="w-3.5 h-3.5" />
          </router-link>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import type { PoemQuotationItem } from '../../services/QuotationService';
import { toPersianDigits } from '../../utils/persianNormalizer';
import { Quote, ArrowLeft } from 'lucide-vue-next';

defineProps<{
  quotations: PoemQuotationItem[];
}>();

function getRelatedRoute(q: PoemQuotationItem): string {
  var coupletQuery = typeof q.relatedCoupletIndex === 'number' && q.relatedCoupletIndex >= 0
    ? `?couplet=${q.relatedCoupletIndex}`
    : '';
  if (q.relatedPoemFullUrl) {
    var clean = q.relatedPoemFullUrl.replace(/^\/+|\/+$/g, '');
    if (clean) return `/read/${clean}${coupletQuery}`;
  }
  if (q.relatedPoemId > 0) {
    return `/poem/${q.relatedPoemId}${coupletQuery}`;
  }
  return '';
}
</script>
