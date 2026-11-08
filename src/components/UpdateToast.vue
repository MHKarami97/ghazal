<script setup lang="ts">
import { useRegisterSW } from 'virtual:pwa-register/vue';
import { Sparkles, RefreshCw, X } from 'lucide-vue-next';

var { needRefresh, updateServiceWorker } = useRegisterSW({
  immediate: true,
});

function reload() {
  updateServiceWorker(true);
}

function dismiss() {
  needRefresh.value = false;
}
</script>

<template>
  <div
    v-if="needRefresh"
    class="fixed bottom-20 md:bottom-6 left-1/2 -translate-x-1/2 z-50 w-[calc(100%-2rem)] max-w-md p-3.5 sm:p-4 rounded-3xl bg-paper-light/95 dark:bg-paper-surface/95 backdrop-blur-md border border-brand-500/40 shadow-2xl transition-all"
    role="alert"
    dir="rtl"
  >
    <div class="flex items-start sm:items-center justify-between gap-3">
      <div class="flex items-start sm:items-center gap-2.5 min-w-0">
        <div class="w-8 h-8 rounded-xl bg-brand-500/15 text-brand-600 dark:text-brand-400 flex items-center justify-center shrink-0 mt-0.5 sm:mt-0">
          <Sparkles class="w-4 h-4 animate-pulse" />
        </div>
        <div class="min-w-0">
          <div class="font-bold text-xs text-ink-900 dark:text-ink-50">نسخهٔ جدید غزل آماده است</div>
          <p class="text-[11px] text-ink-500 mt-0.5 leading-relaxed">
            برای اعمال تغییرات و بهبودها، برنامه را به‌روزرسانی کنید.
          </p>
        </div>
      </div>

      <button
        type="button"
        class="p-1 rounded-lg text-ink-400 hover:text-ink-700 dark:hover:text-ink-200 transition-colors shrink-0"
        title="بستن"
        @click="dismiss"
      >
        <X class="w-4 h-4" />
      </button>
    </div>

    <div class="mt-3 flex items-center justify-end gap-2 pt-2 border-t border-ink-200/50 dark:border-paper-border">
      <button
        type="button"
        class="py-1.5 px-3 rounded-xl text-ink-500 hover:text-ink-800 dark:hover:text-ink-200 text-xs font-medium transition-colors"
        @click="dismiss"
      >
        بعداً
      </button>
      <button
        type="button"
        class="py-1.5 px-4 rounded-xl bg-brand-600 hover:bg-brand-700 active:scale-95 text-white font-bold text-xs transition-all shadow-xs flex items-center gap-1.5 shrink-0"
        @click="reload"
      >
        <RefreshCw class="w-3.5 h-3.5" />
        <span>به‌روزرسانی اکنون</span>
      </button>
    </div>
  </div>
</template>
