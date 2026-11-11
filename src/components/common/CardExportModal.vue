<template>
  <div
    v-if="show"
    class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs"
    @click.self="$emit('close')"
  >
    <div class="bg-paper-light dark:bg-paper-surface w-full max-w-lg max-h-[92vh] overflow-y-auto rounded-2xl border border-ink-200 dark:border-paper-border p-5 sm:p-6 shadow-2xl flex flex-col items-center">
      <!-- هدر مدال -->
      <div class="w-full flex items-center justify-between pb-3.5 border-b border-ink-200/60 dark:border-paper-border mb-4">
        <div class="min-w-0">
          <h3 class="text-base sm:text-lg font-bold text-ink-900 dark:text-ink-50 truncate">
            {{ isPoemMode ? 'اشتراک‌گذاری و خروجی شعر کامل' : 'کارت اشتراک‌گذاری بیت' }}
          </h3>
          <p v-if="poemTitle" class="text-[11px] text-ink-500 dark:text-ink-400 truncate mt-0.5">
            {{ poemTitle }} — {{ poetName }}
          </p>
        </div>
        <button
          @click="$emit('close')"
          type="button"
          class="p-1.5 rounded-lg text-ink-500 hover:bg-ink-100 dark:hover:bg-paper-dark transition-colors shrink-0"
          aria-label="بستن"
        >
          <X class="w-5 h-5" />
        </button>
      </div>

      <!-- هشدار محدودیت ابیات در خروجی تصویر شعرهای بلند -->
      <div
        v-if="isPoemMode && cardMeta.isTruncated"
        class="w-full mb-3.5 p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-[11px] text-amber-800 dark:text-amber-200 flex items-start gap-2 leading-6"
      >
        <AlertTriangle class="w-4 h-4 shrink-0 mt-0.5 text-amber-600 dark:text-amber-400" />
        <span>
          این شعر دارای {{ toPersianDigits(cardMeta.totalCouplets) }} بیت است. برای حفظ خوانایی و کیفیت کارت تصویری، حداکثر
          {{ toPersianDigits(cardMeta.renderedCouplets) }} بیت نخست در تصویر قرار گرفت؛ اما با زدن دکمه «کپی متن»، تمام ابیات شعر کپی می‌شود.
        </span>
      </div>

      <!-- پیش‌نمایش تصویر کارت -->
      <div
        class="w-full rounded-xl overflow-hidden border border-brand-500/30 shadow-md mb-4 flex items-center justify-center bg-paper-warm"
        :class="isPoemMode ? 'min-h-[240px] max-h-[380px] p-2' : 'aspect-square max-h-[360px]'"
      >
        <img
          v-if="cardDataUrl"
          :src="cardDataUrl"
          alt="کارت شعر"
          class="max-w-full max-h-[360px] w-auto h-auto object-contain rounded-lg"
        />
        <div v-else class="text-sm text-ink-500 animate-pulse py-16">
          در حال آماده‌سازی کارت...
        </div>
      </div>

      <!-- نوار لینک اشتراک‌گذاری مستقیم -->
      <div
        v-if="resolvedShareUrl"
        class="w-full mb-4 p-2.5 rounded-xl bg-paper-warm/70 dark:bg-paper-dark/60 border border-ink-200/70 dark:border-paper-border flex items-center justify-between gap-2"
      >
        <div class="flex items-center gap-2 min-w-0 flex-1">
          <Link2 class="w-4 h-4 text-brand-600 dark:text-brand-400 shrink-0" />
          <span
            dir="ltr"
            class="text-[11px] text-ink-600 dark:text-ink-300 truncate font-mono select-all"
          >
            {{ resolvedShareUrl }}
          </span>
        </div>
        <button
          @click="copyShareLink"
          type="button"
          class="px-2.5 py-1.5 rounded-lg text-[11px] font-bold shrink-0 flex items-center gap-1 transition-colors"
          :class="copiedLink
            ? 'bg-emerald-600 text-white'
            : 'bg-paper-light dark:bg-paper-surface border border-ink-200 dark:border-paper-border text-ink-700 dark:text-ink-200 hover:border-brand-500'"
        >
          <Check v-if="copiedLink" class="w-3.5 h-3.5" />
          <Copy v-else class="w-3.5 h-3.5" />
          <span>{{ copiedLink ? 'کپی شد' : 'کپی لینک' }}</span>
        </button>
      </div>

      <!-- دکمه‌های اقدام -->
      <div class="w-full grid grid-cols-1 sm:grid-cols-3 gap-2.5">
        <button
          @click="downloadImage"
          :disabled="!cardDataUrl"
          type="button"
          class="py-2.5 px-3 rounded-xl bg-brand-600 hover:bg-brand-700 disabled:opacity-50 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-sm transition-colors"
        >
          <Download class="w-4 h-4 shrink-0" />
          <span>دانلود تصویر</span>
        </button>

        <button
          @click="copyPoemText"
          type="button"
          class="py-2.5 px-3 rounded-xl border border-ink-200 dark:border-paper-border hover:bg-ink-100 dark:hover:bg-paper-dark font-bold text-xs flex items-center justify-center gap-1.5 transition-colors"
          :class="copiedText ? 'border-emerald-500 text-emerald-700 dark:text-emerald-300 bg-emerald-500/10' : 'text-ink-700 dark:text-ink-200'"
        >
          <Check v-if="copiedText" class="w-4 h-4 shrink-0" />
          <Copy v-else class="w-4 h-4 shrink-0" />
          <span>{{ copiedText ? 'متن کپی شد!' : (isPoemMode ? 'کپی متن کامل' : 'کپی متن') }}</span>
        </button>

        <button
          @click="shareNativeOrLink"
          type="button"
          class="py-2.5 px-3 rounded-xl border border-brand-500/40 bg-brand-500/10 hover:bg-brand-500/20 text-brand-800 dark:text-brand-200 font-bold text-xs flex items-center justify-center gap-1.5 transition-colors"
        >
          <Check v-if="sharedDone" class="w-4 h-4 shrink-0 text-emerald-600" />
          <Share2 v-else class="w-4 h-4 shrink-0" />
          <span>{{ sharedDone ? 'اشتراک آماده شد' : 'اشتراک متن و لینک' }}</span>
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import {
  renderPoemCard,
  renderFullPoemCard,
  MAX_FULL_POEM_IMAGE_COUPLETS
} from '../../services/PoemCardRenderer';
import { toPersianDigits } from '../../utils/persianNormalizer';
import { X, Download, Copy, Check, Link2, Share2, AlertTriangle } from 'lucide-vue-next';

var props = defineProps<{
  show: boolean;
  mode?: 'couplet' | 'poem';
  firstMisra?: string;
  secondMisra?: string;
  couplets?: { firstMisra: string; secondMisra: string }[];
  poetName: string;
  poemTitle?: string;
  shareUrl?: string;
  fontFamily?: string;
}>();

defineEmits(['close']);

var cardDataUrl = ref<string>('');
var cardMeta = ref({
  totalCouplets: 0,
  renderedCouplets: 0,
  isTruncated: false
});
var copiedText = ref<boolean>(false);
var copiedLink = ref<boolean>(false);
var sharedDone = ref<boolean>(false);
var renderToken = 0;

var isPoemMode = computed(function () {
  return props.mode === 'poem';
});

var resolvedShareUrl = computed(function () {
  if (props.shareUrl) return props.shareUrl;
  if (typeof window !== 'undefined') return window.location.href;
  return '';
});

function buildPlainText(includeLink: boolean): string {
  var body = '';
  if (isPoemMode.value && props.couplets && props.couplets.length > 0) {
    var coupletBlocks = props.couplets.map(function (c) {
      return c.secondMisra ? `${c.firstMisra}\n${c.secondMisra}` : c.firstMisra;
    });
    var header = props.poemTitle ? `${props.poemTitle}\n` : '';
    body = `${header}${coupletBlocks.join('\n\n')}\n\n— ${props.poetName}`;
  } else {
    var first = props.firstMisra || '';
    var second = props.secondMisra || '';
    body = second
      ? `${first}\n${second}\n\n— ${props.poetName}`
      : `${first}\n\n— ${props.poetName}`;
  }

  if (includeLink && resolvedShareUrl.value) {
    return `${body}\n\n${resolvedShareUrl.value}`;
  }
  return body;
}

async function generatePreview() {
  if (!props.show) return;
  var token = ++renderToken;
  cardDataUrl.value = '';
  copiedText.value = false;
  copiedLink.value = false;
  sharedDone.value = false;

  if (isPoemMode.value) {
    var items = (props.couplets || []).filter(function (c) {
      return Boolean((c.firstMisra || '').trim() || (c.secondMisra || '').trim());
    });
    cardMeta.value = {
      totalCouplets: items.length,
      renderedCouplets: Math.min(items.length, MAX_FULL_POEM_IMAGE_COUPLETS),
      isTruncated: items.length > MAX_FULL_POEM_IMAGE_COUPLETS
    };
    var res = await renderFullPoemCard(items, props.poetName, props.poemTitle, {
      fontFamily: props.fontFamily,
      maxCouplets: MAX_FULL_POEM_IMAGE_COUPLETS
    });
    if (token !== renderToken) return;
    cardMeta.value = {
      totalCouplets: res.totalCouplets,
      renderedCouplets: res.renderedCouplets,
      isTruncated: res.isTruncated
    };
    cardDataUrl.value = res.canvas.toDataURL('image/png');
  } else {
    cardMeta.value = { totalCouplets: 1, renderedCouplets: 1, isTruncated: false };
    var canvas = await renderPoemCard(
      props.firstMisra || '',
      props.secondMisra || '',
      props.poetName,
      props.poemTitle,
      props.fontFamily
    );
    if (token !== renderToken) return;
    cardDataUrl.value = canvas.toDataURL('image/png');
  }
}

watch(
  function () {
    return [
      props.show,
      props.mode,
      props.firstMisra,
      props.secondMisra,
      props.couplets,
      props.fontFamily
    ];
  },
  function () {
    if (props.show) {
      void generatePreview();
    }
  },
  { immediate: true }
);

function downloadImage() {
  if (!cardDataUrl.value) return;
  var a = document.createElement('a');
  a.href = cardDataUrl.value;
  a.download = isPoemMode.value
    ? `ghazal-poem-${Date.now()}.png`
    : `ghazal-${Date.now()}.png`;
  a.click();
}

async function copyPoemText() {
  var text = buildPlainText(false);
  try {
    await navigator.clipboard.writeText(text);
    copiedText.value = true;
    setTimeout(function () { copiedText.value = false; }, 2200);
  } catch (error) {
    alert('کپی انجام نشد. مجوز دسترسی به کلیپ‌بورد را بررسی کنید.');
  }
}

async function copyShareLink() {
  if (!resolvedShareUrl.value) return;
  try {
    await navigator.clipboard.writeText(resolvedShareUrl.value);
    copiedLink.value = true;
    setTimeout(function () { copiedLink.value = false; }, 2200);
  } catch (error) {
    alert('کپی لینک انجام نشد.');
  }
}

async function shareNativeOrLink() {
  var shareTitle = props.poemTitle
    ? `${props.poemTitle} — ${props.poetName}`
    : props.poetName;
  var shareText = buildPlainText(false);
  var url = resolvedShareUrl.value;

  if (typeof navigator !== 'undefined' && typeof navigator.share === 'function') {
    try {
      await navigator.share({
        title: shareTitle,
        text: shareText,
        url: url
      });
      sharedDone.value = true;
      setTimeout(function () { sharedDone.value = false; }, 2200);
      return;
    } catch (err) {
      // اگر کاربر اشتراک را لغو کرده باشد نیاز به کپی اجباری نیست
      if ((err as { name?: string })?.name === 'AbortError') return;
    }
  }

  try {
    await navigator.clipboard.writeText(buildPlainText(true));
    sharedDone.value = true;
    copiedLink.value = true;
    setTimeout(function () {
      sharedDone.value = false;
      copiedLink.value = false;
    }, 2200);
  } catch (error) {
    alert('کپی متن و لینک انجام نشد.');
  }
}
</script>
