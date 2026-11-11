<template>
  <section
    id="poem-songs-section"
    class="mt-10 pt-8 border-t border-ink-200/80 dark:border-paper-border space-y-4"
  >
    <div class="flex flex-wrap items-center justify-between gap-2">
      <button
        type="button"
        @click="appStore.toggleSectionCollapsed('songs')"
        :aria-expanded="!isCollapsed"
        class="flex items-center gap-2.5 text-right group min-w-0 flex-1"
      >
        <div class="w-8 h-8 rounded-xl bg-rose-500/15 text-rose-700 dark:text-rose-300 flex items-center justify-center shrink-0">
          <Disc3 class="w-4 h-4" />
        </div>
        <div class="min-w-0">
          <h3 class="font-bold text-sm sm:text-base text-ink-900 dark:text-ink-50 group-hover:text-brand-600 dark:group-hover:text-brand-400 transition-colors">
            ترانه‌ها و آثار موسیقایی مرتبط
          </h3>
          <p class="text-[11px] text-ink-500 truncate">
            <template v-if="isLoading && songs.length === 0">
              در حال دریافت آثار موسیقی ثبت‌شده برای این شعر...
            </template>
            <template v-else-if="songs.length > 0">
              آهنگ‌ها و تصنیف‌هایی که خوانندگان از این سروده اجرا کرده‌اند
            </template>
            <template v-else>
              آهنگ شناخته‌شده‌ای برای این سروده در گنجور ثبت نشده است
            </template>
          </p>
        </div>
      </button>

      <div class="flex items-center gap-2 shrink-0">
        <span
          v-if="songs.length > 0"
          class="px-2.5 py-1 rounded-full bg-rose-500/10 text-rose-700 dark:text-rose-300 text-[11px] font-bold"
        >
          {{ toPersianDigits(songs.length) }} اثر
        </span>

        <router-link
          :to="poetSongsRoute"
          class="px-2.5 py-1 rounded-xl border border-ink-200 dark:border-paper-border bg-paper-light dark:bg-paper-surface hover:border-brand-500/60 text-[11px] font-bold text-ink-700 dark:text-ink-300 hover:text-brand-600 dark:hover:text-brand-400 transition-colors flex items-center gap-1"
        >
          <span>بخش ترانه‌ها</span>
          <ArrowLeft class="w-3 h-3" />
        </router-link>

        <button
          type="button"
          @click="appStore.toggleSectionCollapsed('songs')"
          :aria-expanded="!isCollapsed"
          :title="isCollapsed ? 'باز کردن بخش ترانه‌ها' : 'بستن بخش ترانه‌ها'"
          class="p-1.5 rounded-xl border border-ink-200 dark:border-paper-border bg-paper-light dark:bg-paper-surface hover:bg-paper-warm dark:hover:bg-paper-dark text-ink-600 dark:text-ink-300 transition-colors"
        >
          <ChevronDown v-if="isCollapsed" class="w-4 h-4" />
          <ChevronUp v-else class="w-4 h-4" />
        </button>
      </div>
    </div>

    <div v-show="!isCollapsed" class="space-y-3">
      <div
        v-if="isLoading && songs.length === 0"
        class="p-4 rounded-2xl bg-paper-light dark:bg-paper-surface border border-ink-200/70 dark:border-paper-border flex items-center gap-3 text-xs text-ink-500"
      >
        <Loader2 class="w-4 h-4 animate-spin text-rose-600 shrink-0" />
        <span>در حال بررسی و دریافت فهرست ترانه‌ها از پایگاه گنجور...</span>
      </div>

      <div
        v-else-if="songs.length === 0"
        class="p-4 rounded-2xl bg-paper-warm/50 dark:bg-paper-surface border border-ink-200/70 dark:border-paper-border flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
      >
        <p class="text-ink-500 leading-relaxed">
          برای این سروده فعلاً آهنگی در فهرست ترانه‌های گنجور ثبت نشده است. می‌توانید همهٔ ترانه‌های گردآوری‌شده یا ترانه‌های سایر اشعار
          <span v-if="poetName" class="font-bold text-ink-700 dark:text-ink-200">{{ poetName }}</span>
          را در بخش ترانه‌ها جست‌وجو کنید.
        </p>
        <div class="flex flex-wrap items-center gap-2 shrink-0">
          <router-link
            v-if="poetSlug"
            :to="`/songs?poet=${encodeURIComponent(poetSlug)}`"
            class="px-3 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-[11px] font-bold transition-colors"
          >
            ترانه‌های {{ poetName || 'این شاعر' }}
          </router-link>
          <router-link
            to="/songs"
            class="px-3 py-1.5 rounded-xl border border-ink-200 dark:border-paper-border bg-paper-light dark:bg-paper-dark hover:border-brand-500/60 text-ink-700 dark:text-ink-200 text-[11px] font-bold transition-colors"
          >
            کل ترانه‌ها
          </router-link>
        </div>
      </div>

      <div v-else class="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div
          v-for="song in songs"
          :key="`${song.id}-${song.trackName}-${song.artistName}`"
          class="p-4 rounded-2xl bg-paper-light dark:bg-paper-surface border border-ink-200/80 dark:border-paper-border flex flex-col justify-between gap-3 shadow-2xs"
        >
          <div class="space-y-2">
            <div class="flex items-start justify-between gap-2">
              <h4 class="font-bold text-xs sm:text-sm text-ink-900 dark:text-ink-50 leading-6">
                {{ song.trackName }}
              </h4>
              <span class="px-2 py-0.5 rounded-lg bg-rose-500/10 text-rose-700 dark:text-rose-300 text-[10px] font-bold shrink-0">
                {{ detectSongPlatformLabel(song) }}
              </span>
            </div>

            <div class="flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-ink-600 dark:text-ink-300">
              <router-link
                :to="`/songs?artist=${encodeURIComponent(song.artistName)}`"
                class="inline-flex items-center gap-1 font-bold text-brand-700 dark:text-brand-400 hover:underline"
                title="نمایش ترانه‌های این خواننده در غزل"
              >
                <Mic2 class="w-3.5 h-3.5 shrink-0" />
                <span>{{ song.artistName }}</span>
              </router-link>

              <span v-if="song.albumName" class="inline-flex items-center gap-1 text-ink-500">
                <Music class="w-3.5 h-3.5 shrink-0" />
                <span>آلبوم: {{ song.albumName }}</span>
              </span>
            </div>

            <p v-if="song.description" class="text-[11px] text-ink-500 leading-relaxed">
              {{ song.description }}
            </p>
          </div>

          <div class="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-ink-200/50 dark:border-paper-border text-[11px]">
            <a
              v-if="primarySongUrl(song)"
              :href="primarySongUrl(song)"
              target="_blank"
              rel="noopener noreferrer"
              class="inline-flex items-center gap-1.5 font-bold text-rose-700 dark:text-rose-300 hover:underline"
            >
              <ExternalLink class="w-3.5 h-3.5" />
              <span>شنیدن یا مشاهده در منبع</span>
            </a>
            <span v-else class="text-ink-400">
              بدون پیوند شنیداری مستقیم
            </span>

            <router-link
              :to="`/songs?artist=${encodeURIComponent(song.artistName)}`"
              class="text-ink-500 hover:text-brand-600 dark:hover:text-brand-400 transition-colors"
            >
              سایر آثار خواننده
            </router-link>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useAppStore } from '../../stores/appStore';
import {
  detectSongPlatformLabel,
  safeSongExternalUrl,
  type PoemSongTrack
} from '../../services/SongService';
import { toPersianDigits } from '../../utils/persianNormalizer';
import {
  Disc3,
  ChevronDown,
  ChevronUp,
  ExternalLink,
  Loader2,
  Mic2,
  Music,
  ArrowLeft
} from 'lucide-vue-next';

var props = defineProps<{
  songs: PoemSongTrack[];
  isLoading?: boolean;
  poetSlug?: string;
  poetName?: string;
}>();

var appStore = useAppStore();

var isCollapsed = computed(function () {
  return appStore.isSectionCollapsed('songs');
});

var poetSongsRoute = computed(function () {
  if (props.poetSlug) {
    return `/songs?poet=${encodeURIComponent(props.poetSlug)}`;
  }
  return '/songs';
});

function primarySongUrl(song: PoemSongTrack): string {
  return safeSongExternalUrl(song.trackUrl) || safeSongExternalUrl(song.albumUrl) || safeSongExternalUrl(song.artistUrl);
}
</script>
