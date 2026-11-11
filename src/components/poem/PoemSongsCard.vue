<template>
  <section
    v-if="songs.length > 0"
    class="mt-10 pt-8 border-t border-ink-200/80 dark:border-paper-border space-y-4"
  >
    <div class="flex items-center justify-between gap-2">
      <div class="flex items-center gap-2">
        <div class="w-8 h-8 rounded-xl bg-brand-500/15 text-brand-600 dark:text-brand-400 flex items-center justify-center shrink-0">
          <Music class="w-4 h-4" />
        </div>
        <div>
          <h3 class="font-bold text-base text-ink-900 dark:text-ink-50">
            ترانه‌ها و آثار موسیقایی مرتبط
          </h3>
          <p class="text-[11px] text-ink-500">
            تصنیف‌ها و قطعات موسیقی اجراشده بر پایهٔ این شعر (برگرفته از گنجور)
          </p>
        </div>
      </div>
      <span class="px-2.5 py-1 rounded-full bg-brand-500/10 text-brand-700 dark:text-brand-300 text-[11px] font-bold shrink-0">
        {{ toPersianDigits(songs.length) }} اثر
      </span>
    </div>

    <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
      <div
        v-for="(song, idx) in songs"
        :key="song.id || idx"
        class="p-4 rounded-2xl bg-paper-light dark:bg-paper-surface border border-ink-200/80 dark:border-paper-border hover:border-brand-500/40 transition-all flex flex-col justify-between gap-2.5 shadow-2xs"
      >
        <div class="space-y-1.5">
          <div class="flex items-start justify-between gap-2">
            <a
              v-if="safeUrl(song.trackUrl)"
              :href="safeUrl(song.trackUrl)"
              target="_blank"
              rel="noopener noreferrer"
              class="font-bold text-sm text-brand-700 dark:text-brand-300 hover:text-brand-600 hover:underline inline-flex items-center gap-1.5 leading-snug"
            >
              <span>{{ song.trackName }}</span>
              <ExternalLink class="w-3.5 h-3.5 shrink-0 opacity-75" />
            </a>
            <div v-else class="font-bold text-sm text-ink-900 dark:text-ink-100 leading-snug">
              {{ song.trackName }}
            </div>
          </div>

          <div class="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-ink-600 dark:text-ink-300">
            <span>
              <span class="text-ink-400">هنرمند: </span>
              <a
                v-if="safeUrl(song.artistUrl)"
                :href="safeUrl(song.artistUrl)"
                target="_blank"
                rel="noopener noreferrer"
                class="font-bold hover:text-brand-600 dark:hover:text-brand-400 hover:underline"
              >
                {{ song.artistName }}
              </a>
              <span v-else class="font-bold">{{ song.artistName }}</span>
            </span>

            <span v-if="song.albumName">
              <span class="text-ink-400">آلبوم: </span>
              <a
                v-if="safeUrl(song.albumUrl)"
                :href="safeUrl(song.albumUrl)"
                target="_blank"
                rel="noopener noreferrer"
                class="font-medium hover:text-brand-600 dark:hover:text-brand-400 hover:underline"
              >
                {{ song.albumName }}
              </a>
              <span v-else class="font-medium">{{ song.albumName }}</span>
            </span>
          </div>

          <p
            v-if="song.description"
            class="text-xs text-ink-500 dark:text-ink-400 leading-relaxed pt-1"
          >
            {{ song.description }}
          </p>
        </div>

        <div v-if="safeUrl(song.trackUrl)" class="pt-2 border-t border-ink-200/50 dark:border-paper-border/60 flex justify-end">
          <a
            :href="safeUrl(song.trackUrl)"
            target="_blank"
            rel="noopener noreferrer"
            class="text-[11px] font-bold text-brand-600 dark:text-brand-400 hover:underline inline-flex items-center gap-1"
          >
            <span>شنیدن یا مشاهده اطلاعات اثر</span>
            <ExternalLink class="w-3 h-3" />
          </a>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import type { PoemSongTrack } from '../../services/SongService';
import { toPersianDigits } from '../../utils/persianNormalizer';
import { Music, ExternalLink } from 'lucide-vue-next';

defineProps<{
  songs: PoemSongTrack[];
}>();

function safeUrl(url?: string): string {
  if (!url) return '';
  var trimmed = String(url).trim();
  if (/^https?:\/\//i.test(trimmed)) {
    return trimmed;
  }
  return '';
}
</script>
