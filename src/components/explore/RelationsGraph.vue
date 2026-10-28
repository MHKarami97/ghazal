<template>
  <div class="space-y-6">
    <!-- زبانه‌های انتخاب حالت: تبارشناسی / گراف دربار و هم‌پیمانی -->
    <div class="flex items-center gap-2 border-b border-ink-200/80 dark:border-paper-border pb-3">
      <button
        @click="activeGraphTab = 'kinship'"
        class="px-4 py-2 rounded-2xl text-xs font-bold transition-all"
        :class="activeGraphTab === 'kinship'
          ? 'bg-brand-600 text-white shadow-soft'
          : 'bg-paper-light dark:bg-paper-surface border border-ink-200/80 dark:border-paper-border text-ink-700 dark:text-ink-300'"
      >
        تبارشناسی و خویشاوندی ({{ toPersianDigits(literaryStore.relations.length) }})
      </button>

      <button
        @click="activeGraphTab = 'court'"
        class="px-4 py-2 rounded-2xl text-xs font-bold transition-all"
        :class="activeGraphTab === 'court'
          ? 'bg-brand-600 text-white shadow-soft'
          : 'bg-paper-light dark:bg-paper-surface border border-ink-200/80 dark:border-paper-border text-ink-700 dark:text-ink-300'"
      >
        گراف دربار، حامیان و ممدوحان ({{ toPersianDigits(literaryStore.affiliations.length) }})
      </button>
    </div>

    <!-- بخش ۱: تبارشناسی و خویشاوندی -->
    <template v-if="activeGraphTab === 'kinship'">
      <!-- فیلتر و جست‌وجوی تبارشناسی -->
      <div class="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 p-4 rounded-2xl bg-paper-warm/80 dark:bg-paper-surface/80 border border-ink-200 dark:border-paper-border">
        <div class="flex-1">
          <h4 class="font-bold text-sm text-ink-900 dark:text-ink-50 mb-1">
            پیوندها و تبارشناسی شخصیت‌های ادبی
          </h4>
          <p class="text-xs text-ink-500">
            جست‌وجوی روابط خویشاوندی و شجره‌نامه‌ها در متون و آثار ادبی
          </p>
        </div>

        <div class="flex flex-wrap items-center gap-2">
          <!-- جست‌وجوی نام شخصیت -->
          <input
            v-model="searchQuery"
            type="text"
            placeholder="جست‌وجوی شخصیت (رستم، سهراب...)"
            class="px-3 py-2 rounded-xl border border-ink-200 dark:border-paper-border bg-paper-light dark:bg-paper-surface text-ink-800 dark:text-ink-100 text-xs outline-hidden focus:ring-2 focus:ring-brand-500"
          />

          <!-- فیلتر بر اساس اثر / منبع -->
          <select
            v-model="selectedMasterCatId"
            class="px-3 py-2 rounded-xl border border-ink-200 dark:border-paper-border bg-paper-light dark:bg-paper-surface text-ink-800 dark:text-ink-100 text-xs font-bold outline-hidden focus:ring-2 focus:ring-brand-500"
          >
            <option :value="0">همهٔ آثار و اسناد ({{ toPersianDigits(literaryStore.relations.length) }})</option>
            <option v-for="cat in availableMasterCats" :key="cat.id" :value="cat.id">
              اثر کد {{ toPersianDigits(cat.id) }} ({{ toPersianDigits(cat.count) }} رابطه)
            </option>
          </select>
        </div>
      </div>

      <!-- حالت لودینگ -->
      <div v-if="literaryStore.isLoading && !literaryStore.relations.length" class="text-center py-12">
        <div class="w-8 h-8 rounded-full border-2 border-brand-500 border-t-transparent animate-spin mx-auto mb-2"></div>
        <p class="text-xs text-ink-500">در حال دریافت داده‌های تبارشناسی و پیوندها...</p>
      </div>

      <!-- حالت خالی -->
      <div v-else-if="!filteredRelations.length" class="text-center py-12 p-6 rounded-2xl bg-paper-warm/50 dark:bg-paper-surface/50 border border-dashed border-ink-300 dark:border-paper-border">
        <p class="text-sm font-bold text-ink-700 dark:text-ink-300 mb-1">هیچ پیوندی با این مشخصات یافت نشد</p>
        <p class="text-xs text-ink-500">می‌توانید عبارت جست‌وجو را تغییر دهید یا فیلتر را روی «همهٔ آثار و اسناد» بگذارید.</p>
      </div>

      <!-- فهرست روابط خانوادگی در این اثر -->
      <div v-else class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div
          v-for="rel in visibleRelations"
          :key="rel.Id"
          class="p-4 rounded-2xl bg-paper-light dark:bg-paper-surface border border-ink-200/80 dark:border-paper-border shadow-xs hover:border-brand-500/40 transition-all"
        >
          <div class="flex items-center justify-between mb-3">
            <router-link
              :to="`/person/${rel.Person1Id}`"
              class="font-bold text-sm text-brand-700 dark:text-brand-300 hover:underline"
            >
              {{ getPersonName(rel.Person1Id) }}
            </router-link>

            <span class="text-xs px-2.5 py-1 rounded-full bg-brand-50 dark:bg-brand-950/30 text-brand-800 dark:text-brand-300 font-medium border border-brand-500/20">
              {{ formatRelationType(rel.RelationType) }}
            </span>

            <router-link
              :to="`/person/${rel.Person2Id}`"
              class="font-bold text-sm text-ink-800 dark:text-ink-100 hover:underline"
            >
              {{ getPersonName(rel.Person2Id) }}
            </router-link>
          </div>

          <!-- ابیات شاهد (Evidence) -->
          <div v-if="rel.Evidence && rel.Evidence.length" class="mt-3 pt-3 border-t border-ink-200/60 dark:border-paper-border space-y-1.5">
            <div class="text-[11px] font-bold text-ink-500 dark:text-ink-400">
              شاهد در متن (Evidence):
            </div>
            <div
              v-for="(ev, eIdx) in rel.Evidence.slice(0, 3)"
              :key="eIdx"
              class="text-[11px] text-ink-600 dark:text-ink-300 flex items-center justify-between bg-paper-warm/50 dark:bg-paper-dark/30 px-2.5 py-1.5 rounded-lg"
            >
              <span>شعر کد {{ toPersianDigits(ev.PoemId) }}، بیت {{ toPersianDigits(ev.CoupletIndex + 1) }}</span>
              <router-link
                :to="`/poem/${ev.PoemId}?couplet=${ev.CoupletIndex}`"
                class="text-brand-600 hover:underline text-[10px]"
              >
                مشاهده شعر
              </router-link>
            </div>
          </div>
        </div>
      </div>

      <!-- دکمه نمایش بیشتر -->
      <div v-if="visibleLimit < filteredRelations.length" class="text-center pt-2">
        <button
          @click="visibleLimit += 40"
          class="px-5 py-2.5 rounded-xl text-xs font-bold bg-paper-warm dark:bg-paper-surface hover:bg-brand-500/10 text-brand-700 dark:text-brand-300 border border-ink-200 dark:border-paper-border transition-colors"
        >
          نمایش موارد بیشتر ({{ toPersianDigits(filteredRelations.length - visibleLimit) }} مورد باقی‌مانده)
        </button>
      </div>
    </template>

    <!-- بخش ۲: گراف دربار و هم‌پیمانی‌ها -->
    <template v-else-if="activeGraphTab === 'court'">
      <div class="space-y-4">
        <div class="p-4 rounded-2xl bg-paper-warm/80 dark:bg-paper-surface/80 border border-ink-200 dark:border-paper-border">
          <h4 class="font-bold text-sm text-ink-900 dark:text-ink-50 mb-1">
            گراف دربار، حامیان، ممدوحان و وزرا
          </h4>
          <p class="text-xs text-ink-500">
            روابط سیاسی، ستایشگری و مناقشات میان شاعران، شاهان و وزیران در دربارها بر پایه person-affiliations
          </p>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div
            v-for="aff in literaryStore.affiliations"
            :key="aff.Id"
            class="p-4 rounded-2xl border border-ink-200/80 dark:border-paper-border bg-paper-light dark:bg-paper-surface text-xs space-y-2 shadow-xs"
          >
            <div class="flex items-center justify-between">
              <div class="flex items-center gap-1.5">
                <router-link :to="`/person/${aff.Person1Id}`" class="font-bold text-sm text-brand-700 dark:text-brand-300 hover:underline">
                  {{ getPersonName(aff.Person1Id) }}
                </router-link>
                <span class="text-ink-400">و</span>
                <router-link :to="`/person/${aff.Person2Id}`" class="font-bold text-sm text-ink-900 dark:text-ink-100 hover:underline">
                  {{ getPersonName(aff.Person2Id) }}
                </router-link>
              </div>

              <span
                class="px-2.5 py-1 rounded-full font-bold text-[10px]"
                :class="aff.AffiliationType === 'Rival' ? 'bg-rose-100 text-rose-800 dark:bg-rose-900/40 dark:text-rose-300' : 'bg-brand-500/10 text-brand-700 dark:text-brand-300'"
              >
                {{ formatAffiliationType(aff.AffiliationType) }}
              </span>
            </div>

            <p v-if="aff.Note" class="text-ink-600 dark:text-ink-400 leading-relaxed text-xs">
              {{ aff.Note }}
            </p>

            <!-- ابیات شاهد برای دربار / حامی -->
            <div v-if="aff.Evidence && aff.Evidence.length" class="pt-2 border-t border-ink-200/50 dark:border-paper-border flex items-center justify-between text-[11px] text-ink-500">
              <span>شاهد در دیوان: بیت {{ toPersianDigits(aff.Evidence[0].CoupletIndex + 1) }}</span>
              <router-link :to="`/poem/${aff.Evidence[0].PoemId}?couplet=${aff.Evidence[0].CoupletIndex}`" class="text-brand-600 font-bold hover:underline">
                مشاهده بیت
              </router-link>
            </div>
          </div>
        </div>
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useLiteraryStore } from '../../stores/literaryStore';
import { toPersianDigits } from '../../utils/persianNormalizer';
import type { GanjoorPersonRelation } from '../../types/ganjoor';

var literaryStore = useLiteraryStore();
var activeGraphTab = ref<'kinship' | 'court'>('kinship');
var selectedMasterCatId = ref<number>(0); // پیش‌فرض نمایش همه پیوندها
var searchQuery = ref<string>('');
var visibleLimit = ref<number>(40);

onMounted(async function () {
  await literaryStore.loadBaseMeta();
});

var availableMasterCats = computed(function () {
  var countMap = new Map<number, number>();
  var rels = literaryStore.relations;
  for (var i = 0; i < rels.length; i++) {
    var rel = rels[i];
    if (rel.Evidence && rel.Evidence.length) {
      for (var j = 0; j < rel.Evidence.length; j++) {
        var catId = rel.Evidence[j].MasterCatId;
        if (catId) {
          countMap.set(catId, (countMap.get(catId) || 0) + 1);
        }
      }
    }
  }

  var list: { id: number; count: number }[] = [];
  countMap.forEach(function (count, id) {
    list.push({ id: id, count: count });
  });

  return list.sort(function (a, b) {
    return b.count - a.count;
  });
});

var filteredRelations = computed(function () {
  var rels = literaryStore.relations;

  if (selectedMasterCatId.value !== 0) {
    rels = rels.filter(function (r) {
      if (!r.Evidence || !r.Evidence.length) return false;
      return r.Evidence.some(function (ev) {
        return ev.MasterCatId === selectedMasterCatId.value;
      });
    });
  }

  if (searchQuery.value.trim()) {
    var q = searchQuery.value.trim();
    rels = rels.filter(function (r) {
      var name1 = getPersonName(r.Person1Id);
      var name2 = getPersonName(r.Person2Id);
      return name1.includes(q) || name2.includes(q);
    });
  }

  return rels;
});

var visibleRelations = computed(function () {
  return filteredRelations.value.slice(0, visibleLimit.value);
});

function getPersonName(id: number): string {
  var person = literaryStore.getPersonById(id);
  return person ? person.Name : `شخص کد ${id}`;
}

function formatRelationType(type: string): string {
  switch (type) {
    case 'Parent': return 'پدر / مادرِ';
    case 'Sibling': return 'برادر / خواهرِ';
    case 'Spouse': return 'همسرِ';
    case 'Ancestor': return 'نیا و تبارِ';
    default: return type;
  }
}

function formatAffiliationType(type: string): string {
  switch (type) {
    case 'Rival': return 'هماورد / دشمنی';
    case 'Ally': return 'هم‌پیمان';
    case 'Patron': return 'حامی و ممدوح';
    case 'Minister': return 'وزیر و رایزن';
    default: return type || 'ارتباط درباری';
  }
}
</script>
