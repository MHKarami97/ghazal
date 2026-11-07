<template>
  <div v-if="recitations && recitations.length > 0" class="my-4 p-3.5 sm:p-4 rounded-2xl bg-gradient-to-r from-amber-500/10 via-brand-500/10 to-paper-warm/70 dark:to-paper-surface border border-brand-500/30 shadow-xs transition-all">
    <!-- سربرگ خوانشگر و عنوان صوت -->
    <div class="flex flex-wrap items-center justify-between gap-2 mb-3">
      <div class="flex items-center gap-2">
        <div class="w-8 h-8 rounded-xl bg-brand-600 text-white flex items-center justify-center shadow-xs">
          <Headphones class="w-4 h-4" :class="{ 'animate-pulse': isPlaying }" />
        </div>
        <div>
          <div class="flex items-center gap-1.5">
            <span class="text-xs font-bold text-ink-900 dark:text-ink-50">خوانش و دکلمهٔ صوتی</span>
            <span class="text-[10px] px-2 py-0.2 rounded-full bg-brand-500/15 text-brand-700 dark:text-brand-300 font-bold">
              گنجور
            </span>
          </div>
          <div class="text-[11px] text-ink-500">
            با صدای: <strong class="text-brand-700 dark:text-brand-400">{{ activeRecitation?.audioArtist || 'نامشخص' }}</strong>
          </div>
        </div>
      </div>

      <!-- انتخاب خوانشگر (اگر چند خوانشگر وجود دارد) -->
      <div v-if="recitations.length > 1" class="flex items-center gap-1.5 text-xs">
        <span class="text-ink-500 text-[11px]">تغییر راوی:</span>
        <select
          v-model="selectedRecitationId"
          class="px-2.5 py-1 rounded-xl text-xs font-bold border border-ink-200/80 dark:border-paper-border bg-paper-light dark:bg-paper-dark text-ink-900 dark:text-ink-100 outline-hidden cursor-pointer"
        >
          <option v-for="r in recitations" :key="r.id" :value="r.id">
            {{ r.audioArtist }} ({{ r.audioTitle }})
          </option>
        </select>
      </div>
    </div>

    <!-- پلیر و کنترل‌ها -->
    <div class="space-y-2">
      <!-- نوار پیشرفت -->
      <div class="flex items-center gap-2.5 text-[11px] font-mono text-ink-500">
        <span class="w-10 text-left">{{ toPersianDigits(formatTime(currentTime)) }}</span>
        <div class="relative flex-1 h-2 rounded-full bg-ink-200/80 dark:bg-paper-dark overflow-hidden cursor-pointer" @click="seek">
          <div
            class="h-full bg-gradient-to-r from-brand-500 to-amber-500 rounded-full transition-all"
            :style="{ width: `${progressPercent}%` }"
          ></div>
        </div>
        <span class="w-10 text-right">{{ toPersianDigits(formatTime(duration)) }}</span>
      </div>

      <!-- دکمه‌های کنترل پخش -->
      <div class="flex items-center justify-between pt-1">
        <div class="flex items-center gap-2">
          <!-- دکمه پخش / توقف -->
          <button
            @click="togglePlay"
            type="button"
            class="w-9 h-9 rounded-xl bg-brand-600 hover:bg-brand-700 text-white flex items-center justify-center shadow-sm transition-transform active:scale-95"
            :title="isPlaying ? 'توقف پخش' : 'پخش دکلمه'"
          >
            <Loader2 v-if="isLoadingAudio" class="w-4 h-4 animate-spin" />
            <Pause v-else-if="isPlaying" class="w-4 h-4" />
            <Play v-else class="w-4 h-4 translate-x-[-1px]" />
          </button>

          <!-- دکمه ۱۰ ثانیه به عقب / جلو -->
          <button
            @click="skipTime(-10)"
            type="button"
            class="p-1.5 rounded-lg text-ink-500 hover:text-ink-900 dark:hover:text-ink-100 hover:bg-ink-100 dark:hover:bg-paper-dark transition-colors"
            title="۱۰ ثانیه قبل"
          >
            <RotateCcw class="w-4 h-4" />
          </button>
          <button
            @click="skipTime(10)"
            type="button"
            class="p-1.5 rounded-lg text-ink-500 hover:text-ink-900 dark:hover:text-ink-100 hover:bg-ink-100 dark:hover:bg-paper-dark transition-colors"
            title="۱۰ ثانیه بعد"
          >
            <RotateCw class="w-4 h-4" />
          </button>
        </div>

        <div class="flex items-center gap-3">
          <!-- سرعت پخش -->
          <button
            @click="cycleSpeed"
            type="button"
            class="px-2 py-0.5 rounded-lg text-[11px] font-bold border border-ink-200 dark:border-paper-border hover:bg-ink-100 dark:hover:bg-paper-dark text-ink-600 dark:text-ink-300"
            title="سرعت پخش"
          >
            {{ playbackRate }}x
          </button>

          <!-- صدا / بی‌صدا -->
          <button
            @click="toggleMute"
            type="button"
            class="p-1.5 rounded-lg text-ink-500 hover:text-ink-900 dark:hover:text-ink-100 transition-colors"
            :title="isMuted ? 'وصل صدا' : 'قطع صدا'"
          >
            <VolumeX v-if="isMuted" class="w-4 h-4 text-rose-500" />
            <Volume2 v-else class="w-4 h-4" />
          </button>

          <!-- لینک فایل صوتی -->
          <a
            v-if="activeRecitation?.mp3Url"
            :href="activeRecitation.mp3Url"
            target="_blank"
            download
            class="p-1.5 rounded-lg text-ink-400 hover:text-brand-600 transition-colors"
            title="دریافت فایل صوتی MP3"
          >
            <Download class="w-4 h-4" />
          </a>
        </div>
      </div>
    </div>

    <!-- المنت نامرئی audio -->
    <audio
      ref="audioElement"
      :src="activeRecitation?.mp3Url"
      preload="metadata"
      @play="onAudioPlay"
      @pause="onAudioPause"
      @timeupdate="onTimeUpdate"
      @loadedmetadata="onLoadedMetadata"
      @waiting="isLoadingAudio = true"
      @canplay="isLoadingAudio = false"
      @ended="onAudioEnded"
      @error="onAudioError"
    ></audio>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onBeforeUnmount } from 'vue';
import type { PoemRecitation } from '../../services/RecitationService';
import { toPersianDigits } from '../../utils/persianNormalizer';
import {
  Headphones,
  Play,
  Pause,
  RotateCcw,
  RotateCw,
  Volume2,
  VolumeX,
  Download,
  Loader2
} from 'lucide-vue-next';

var props = defineProps<{
  recitations: PoemRecitation[];
}>();

var audioElement = ref<HTMLAudioElement | null>(null);
var selectedRecitationId = ref<number | null>(null);
var isPlaying = ref<boolean>(false);
var isLoadingAudio = ref<boolean>(false);
var currentTime = ref<number>(0);
var duration = ref<number>(0);
var isMuted = ref<boolean>(false);
var playbackRate = ref<number>(1);

var speeds = [1, 1.25, 1.5, 0.8];

var activeRecitation = computed(function () {
  if (!props.recitations || props.recitations.length === 0) return null;
  if (selectedRecitationId.value) {
    var found = props.recitations.find(function (r) { return r.id === selectedRecitationId.value; });
    if (found) return found;
  }
  return props.recitations[0];
});

watch(
  () => props.recitations,
  function (newList) {
    if (newList && newList.length > 0) {
      if (!selectedRecitationId.value || !newList.some(function (r) { return r.id === selectedRecitationId.value; })) {
        selectedRecitationId.value = newList[0].id;
      }
    } else {
      selectedRecitationId.value = null;
    }
    stopAndReset();
  },
  { immediate: true }
);

watch(selectedRecitationId, function () {
  stopAndReset();
});

var progressPercent = computed(function () {
  if (!duration.value || duration.value === 0) return 0;
  return Math.min(100, Math.max(0, (currentTime.value / duration.value) * 100));
});

function togglePlay() {
  if (!audioElement.value) return;
  if (isPlaying.value) {
    audioElement.value.pause();
  } else {
    audioElement.value.play().catch(function (err) {
      console.warn('Playback prevented or failed:', err);
    });
  }
}

function stopAndReset() {
  if (audioElement.value) {
    audioElement.value.pause();
    audioElement.value.currentTime = 0;
  }
  isPlaying.value = false;
  currentTime.value = 0;
}

function onAudioPlay() {
  isPlaying.value = true;
  isLoadingAudio.value = false;
}

function onAudioPause() {
  isPlaying.value = false;
}

function onTimeUpdate() {
  if (audioElement.value) {
    currentTime.value = audioElement.value.currentTime;
  }
}

function onLoadedMetadata() {
  if (audioElement.value) {
    duration.value = audioElement.value.duration || 0;
  }
}

function onAudioEnded() {
  isPlaying.value = false;
  currentTime.value = 0;
}

function onAudioError() {
  isLoadingAudio.value = false;
  isPlaying.value = false;
}

function seek(e: MouseEvent) {
  if (!audioElement.value || !duration.value) return;
  var rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
  var clickX = e.clientX - rect.left;
  var ratio = Math.max(0, Math.min(1, clickX / rect.width));
  var newTime = ratio * duration.value;
  audioElement.value.currentTime = newTime;
  currentTime.value = newTime;
}

function skipTime(delta: number) {
  if (!audioElement.value) return;
  var next = Math.max(0, Math.min(duration.value, audioElement.value.currentTime + delta));
  audioElement.value.currentTime = next;
  currentTime.value = next;
}

function cycleSpeed() {
  var idx = speeds.indexOf(playbackRate.value);
  var nextSpeed = speeds[(idx + 1) % speeds.length];
  playbackRate.value = nextSpeed;
  if (audioElement.value) {
    audioElement.value.playbackRate = nextSpeed;
  }
}

function toggleMute() {
  if (!audioElement.value) return;
  audioElement.value.muted = !audioElement.value.muted;
  isMuted.value = audioElement.value.muted;
}

function formatTime(secs: number): string {
  if (isNaN(secs) || secs < 0) return '00:00';
  var m = Math.floor(secs / 60);
  var s = Math.floor(secs % 60);
  var mm = m < 10 ? '0' + m : String(m);
  var ss = s < 10 ? '0' + s : String(s);
  return `${mm}:${ss}`;
}

onBeforeUnmount(function () {
  stopAndReset();
});
</script>
