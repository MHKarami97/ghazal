<template>
  <transition name="dl-pop">
    <button
      v-if="dataStore.hasActiveDownloads && !dataStore.isDownloadPanelOpen"
      type="button"
      class="fixed bottom-20 start-4 z-40 flex items-center gap-2 rounded-full border border-brand-500/40 bg-paper-light px-4 py-2.5 text-xs font-bold text-ink-800 shadow-lifted transition-transform active:scale-95 md:bottom-6 dark:bg-paper-surface dark:text-ink-100"
      @click="dataStore.isDownloadPanelOpen = true"
    >
      <InlineSpinner size="sm" class="text-brand-600" />
      <span>{{ activeCountText }} در حال دانلود</span>
      <span class="text-brand-600">٪{{ toPersianDigits(averagePercent) }}</span>
    </button>
  </transition>

  <transition name="dl-pop">
    <div
      v-if="dataStore.isDownloadPanelOpen && dataStore.downloadList.length > 0"
      class="fixed inset-0 z-50 flex items-end justify-center bg-black/60 p-0 backdrop-blur-xs sm:items-center sm:p-4"
      role="dialog"
      aria-modal="true"
      aria-label="وضعیت دانلود"
      @click.self="dataStore.isDownloadPanelOpen = false"
    >
      <div class="flex max-h-[85vh] w-full max-w-md flex-col rounded-t-3xl border border-ink-200 bg-paper-light shadow-2xl sm:rounded-3xl dark:border-paper-border dark:bg-paper-surface">
        <div class="flex items-center justify-between border-b border-ink-200/60 px-5 py-4 dark:border-paper-border">
          <div class="flex items-center gap-2">
            <Download class="h-5 w-5 text-brand-600" />
            <h3 class="text-sm font-bold text-ink-900 dark:text-ink-50">وضعیت دانلود</h3>
          </div>
          <button
            type="button"
            class="rounded-lg p-1.5 text-ink-500 transition-colors hover:bg-ink-100 dark:hover:bg-paper-dark"
            title="بستن (دانلود در پس‌زمینه ادامه می‌یابد)"
            @click="dataStore.isDownloadPanelOpen = false"
          >
            <X class="h-5 w-5" />
          </button>
        </div>

        <div class="space-y-4 overflow-y-auto p-5">
          <div
            v-for="item in dataStore.downloadList"
            :key="item.packageId"
            class="space-y-3 rounded-2xl border border-ink-200/60 bg-paper-warm/60 p-4 dark:border-paper-border dark:bg-paper-dark"
          >
            <div class="flex items-start justify-between gap-3">
              <div class="min-w-0">
                <div class="truncate text-sm font-bold text-ink-900 dark:text-ink-100">{{ item.title }}</div>
                <div class="mt-0.5 flex items-center gap-1.5 text-[11px] text-ink-500">
                  <InlineSpinner v-if="isRunning(item)" size="xs" class="text-brand-600" />
                  <CheckCircle v-else-if="item.status === 'completed'" class="h-3.5 w-3.5 text-emerald-600" />
                  <AlertTriangle v-else-if="item.status === 'error'" class="h-3.5 w-3.5 text-rose-600" />
                  <span>{{ item.stage }}</span>
                </div>
              </div>
              <span class="shrink-0 text-lg font-black text-brand-600">٪{{ toPersianDigits(item.percent) }}</span>
            </div>

            <ol class="flex items-center gap-1 text-[10px] font-bold">
              <li
                v-for="(step, idx) in steps"
                :key="step"
                class="flex flex-1 items-center gap-1"
                :class="stepClass(item, idx)"
              >
                <span class="flex h-4 w-4 shrink-0 items-center justify-center rounded-full border border-current text-[9px]">
                  {{ stepDone(item, idx) ? '✓' : toPersianDigits(idx + 1) }}
                </span>
                <span class="truncate">{{ step }}</span>
              </li>
            </ol>

            <div
              class="h-2 w-full overflow-hidden rounded-full bg-ink-200 dark:bg-ink-800"
              role="progressbar"
              :aria-valuenow="item.percent"
              aria-valuemin="0"
              aria-valuemax="100"
            >
              <div
                class="h-full rounded-full transition-all duration-300"
                :class="barClass(item)"
                :style="{ width: barWidth(item) }"
              ></div>
            </div>

            <div v-if="item.total > 0" class="flex flex-wrap items-center justify-between gap-2 text-[11px] text-ink-500">
              <span>{{ toPersianDigits(item.completed) }} از {{ toPersianDigits(item.total) }} مورد</span>
              <span v-if="item.bytes > 0">{{ formatBytes(item.bytes) }}</span>
              <span v-if="item.failed > 0" class="text-rose-600">{{ toPersianDigits(item.failed) }} ناموفق</span>
            </div>

            <p v-if="item.error" class="rounded-xl bg-rose-500/10 p-3 text-[11px] leading-relaxed text-rose-700 dark:text-rose-300">
              {{ item.error }}
            </p>

            <div class="flex flex-wrap items-center gap-2 pt-1">
              <template v-if="isRunning(item)">
                <button
                  v-if="item.status === 'downloading'"
                  type="button"
                  class="inline-flex items-center gap-1.5 rounded-xl border border-ink-200 px-3.5 py-2 text-xs font-bold text-ink-700 transition-colors hover:bg-ink-100 dark:border-paper-border dark:text-ink-200 dark:hover:bg-paper-surface"
                  @click="dataStore.pauseDownload(item.packageId)"
                >
                  <Pause class="h-3.5 w-3.5" />
                  توقف
                </button>
                <button
                  v-else-if="item.status === 'paused'"
                  type="button"
                  class="inline-flex items-center gap-1.5 rounded-xl bg-brand-600 px-3.5 py-2 text-xs font-bold text-white transition-colors hover:bg-brand-700"
                  @click="dataStore.resumeDownload(item.packageId)"
                >
                  <Play class="h-3.5 w-3.5" />
                  ادامه
                </button>
                <button
                  v-if="item.status !== 'finalizing'"
                  type="button"
                  class="inline-flex items-center gap-1.5 rounded-xl border border-rose-500/40 px-3.5 py-2 text-xs font-bold text-rose-600 transition-colors hover:bg-rose-500/10"
                  @click="confirmCancel(item)"
                >
                  <XCircle class="h-3.5 w-3.5" />
                  لغو دانلود
                </button>
              </template>

              <template v-else-if="item.status === 'error'">
                <button
                  type="button"
                  class="inline-flex items-center gap-1.5 rounded-xl bg-brand-600 px-3.5 py-2 text-xs font-bold text-white transition-colors hover:bg-brand-700"
                  @click="dataStore.retryDownload(item.packageId)"
                >
                  <RotateCw class="h-3.5 w-3.5" />
                  تلاش مجدد
                </button>
                <button
                  type="button"
                  class="rounded-xl border border-ink-200 px-3.5 py-2 text-xs font-bold text-ink-700 transition-colors hover:bg-ink-100 dark:border-paper-border dark:text-ink-200 dark:hover:bg-paper-surface"
                  @click="dataStore.dismissProgress(item.packageId)"
                >
                  بستن
                </button>
              </template>
            </div>
          </div>
        </div>
      </div>
    </div>
  </transition>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { Download, X, Pause, Play, XCircle, RotateCw, CheckCircle, AlertTriangle } from 'lucide-vue-next';
import { useDataStore } from '../../stores/dataStore';
import type { DownloadProgress } from '../../services/PackageDownloadService';
import { formatBytes } from '../../utils/formatters';
import { toPersianDigits } from '../../utils/persianNormalizer';
import InlineSpinner from './InlineSpinner.vue';

var dataStore = useDataStore();
var steps = ['آماده‌سازی', 'دریافت اشعار', 'ذخیره‌سازی'];

function isRunning(item: DownloadProgress): boolean {
  return ['preparing', 'downloading', 'paused', 'finalizing'].indexOf(item.status) !== -1;
}

var activeItems = computed(function () {
  return dataStore.downloadList.filter(isRunning);
});

var activeCountText = computed(function () {
  return toPersianDigits(activeItems.value.length);
});

var averagePercent = computed(function () {
  if (activeItems.value.length === 0) return 0;
  var sum = activeItems.value.reduce(function (acc, item) { return acc + item.percent; }, 0);
  return Math.round(sum / activeItems.value.length);
});

function currentStep(item: DownloadProgress): number {
  if (item.status === 'completed') return 3;
  if (item.status === 'finalizing') return 2;
  if (item.status === 'downloading' || item.status === 'paused') return 1;
  return 0;
}

function stepDone(item: DownloadProgress, idx: number): boolean {
  return idx < currentStep(item);
}

function stepClass(item: DownloadProgress, idx: number): string {
  if (stepDone(item, idx)) return 'text-emerald-600';
  if (idx === currentStep(item) && item.status !== 'error') return 'text-brand-600';
  return 'text-ink-400';
}

function barClass(item: DownloadProgress): string {
  if (item.status === 'error') return 'bg-rose-500';
  if (item.status === 'completed') return 'bg-emerald-500';
  if (item.status === 'paused') return 'bg-amber-500';
  return 'bg-brand-500';
}

function barWidth(item: DownloadProgress): string {
  if (item.status === 'preparing' && item.percent === 0) return '8%';
  return `${item.percent}%`;
}

function confirmCancel(item: DownloadProgress) {
  if (confirm(`دانلود «${item.title}» لغو شود؟ اشعار دریافت‌شدهٔ همین نوبت حذف می‌شوند.`)) {
    dataStore.cancelDownload(item.packageId);
  }
}
</script>

<style scoped>
.dl-pop-enter-active,
.dl-pop-leave-active {
  transition: opacity 0.18s ease, transform 0.18s ease;
}

.dl-pop-enter-from,
.dl-pop-leave-to {
  opacity: 0;
  transform: translateY(12px);
}
</style>
