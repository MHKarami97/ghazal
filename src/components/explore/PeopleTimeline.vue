<template>
  <div class="space-y-4">
    <div class="relative">
      <input
        v-model="search"
        type="text"
        placeholder="جست‌وجوی شخصیت تاریخی، اساطیری یا شاعر..."
        class="w-full pr-10 pl-4 py-2.5 rounded-xl border border-ink-200 dark:border-paper-border bg-paper-light dark:bg-paper-surface text-ink-900 dark:text-ink-100 text-sm focus:ring-2 focus:ring-brand-500 outline-hidden"
      />
      <Search class="w-4 h-4 absolute right-3.5 top-3.5 text-ink-400" />
    </div>

    <!-- خط زمان عمودی -->
    <div class="relative border-r-2 border-brand-500/30 pr-6 mr-3 space-y-6">
      <div
        v-for="person in filteredPeople"
        :key="person.Id"
        class="relative group"
      >
        <!-- نشانگر دایره‌ای روی خط زمان -->
        <div class="absolute -right-[31px] top-1.5 w-3.5 h-3.5 rounded-full bg-brand-500 border-2 border-paper-light dark:border-paper-dark group-hover:scale-125 transition-transform"></div>

        <router-link
          :to="`/person/${person.Id}`"
          class="block p-4 rounded-2xl bg-paper-light dark:bg-paper-surface border border-ink-200/80 dark:border-paper-border hover:border-brand-500/50 shadow-xs transition-all"
        >
          <div class="flex items-center justify-between mb-1.5">
            <h4 class="font-bold text-sm text-ink-900 dark:text-ink-50 group-hover:text-brand-600 transition-colors">
              {{ person.Name }}
            </h4>
            <span
              v-if="person.ValidBirthDate || person.BirthYearInLHijri"
              class="text-xs px-2.5 py-0.5 rounded-full bg-brand-500/10 text-brand-700 dark:text-brand-300 font-bold"
            >
              {{ formatYears(person) }}
            </span>
          </div>

          <p v-if="person.Description" class="text-xs text-ink-600 dark:text-ink-400 line-clamp-2 leading-relaxed mb-2">
            {{ person.Description }}
          </p>

          <div class="flex items-center gap-2 text-[11px] text-ink-400">
            <span v-if="person.FamilyTreeCaption" class="bg-ink-100 dark:bg-ink-800 px-2 py-0.5 rounded-md">
              {{ person.FamilyTreeCaption }}
            </span>
            <span v-if="person.Importance === 'Important'" class="text-amber-500 font-medium">
              شخصیت شاخص
            </span>
          </div>
        </router-link>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { useLiteraryStore } from '../../stores/literaryStore';
import { toPersianDigits } from '../../utils/persianNormalizer';
import type { GanjoorPerson } from '../../types/ganjoor';
import { Search } from 'lucide-vue-next';

var literaryStore = useLiteraryStore();
var search = ref<string>('');

var filteredPeople = computed(function () {
  var list = literaryStore.people;
  if (search.value.trim()) {
    var q = search.value.trim();
    list = list.filter(function (p) {
      return p.Name.includes(q) || (p.Description && p.Description.includes(q));
    });
  }

  // مرتب‌سازی بر اساس سال تولد/زندگی هجری قمری
  return [...list].sort(function (a, b) {
    var yA = a.BirthYearInLHijri || 0;
    var yB = b.BirthYearInLHijri || 0;
    return yA - yB;
  });
});

function formatYears(person: GanjoorPerson): string {
  if (person.BirthYearInLHijri && person.DeathYearInLHijri) {
    return `${toPersianDigits(person.BirthYearInLHijri)} تا ${toPersianDigits(person.DeathYearInLHijri)} هـ.ق`;
  }
  if (person.BirthYearInLHijri) {
    return `زادهٔ ${toPersianDigits(person.BirthYearInLHijri)} هـ.ق`;
  }
  return 'اساطیری / کهن';
}
</script>
