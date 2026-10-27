<template>
  <div class="max-w-3xl mx-auto space-y-6 pb-12">
    <LoadingState v-if="isLoading" message="در حال دریافت اطلاعات شخصیت..." />

    <template v-else-if="person">
      <!-- کارت بیوگرافی شخص -->
      <div class="p-6 sm:p-8 rounded-3xl bg-paper-light dark:bg-paper-surface border border-ink-200/80 dark:border-paper-border shadow-soft">
        <div class="flex items-center justify-between mb-4">
          <div class="flex items-center gap-3">
            <div class="w-14 h-14 rounded-2xl bg-gradient-to-br from-brand-400 to-brand-600 text-white flex items-center justify-center font-black text-xl shadow-md">
              {{ person.Name.slice(0, 1) }}
            </div>
            <div>
              <h2 class="text-2xl font-black text-ink-900 dark:text-ink-50">
                {{ person.Name }}
              </h2>
              <div class="text-xs text-ink-500 mt-0.5">
                {{ person.FamilyTreeCaption || 'شخصیت اساطیری و تاریخی' }}
              </div>
            </div>
          </div>

          <span
            v-if="person.Importance === 'Important'"
            class="text-xs px-3 py-1 rounded-full bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300 font-bold"
          >
            شخصیت برجسته
          </span>
        </div>

        <!-- زمانه و مکان زندگی -->
        <div class="grid grid-cols-2 gap-3 py-3 border-y border-ink-200/60 dark:border-paper-border my-4 text-xs">
          <div>
            <span class="text-ink-400 block mb-0.5">دوران زندگی:</span>
            <span class="font-bold text-ink-800 dark:text-ink-200">{{ formatLifeDates(person) }}</span>
          </div>
          <div v-if="birthPlace">
            <span class="text-ink-400 block mb-0.5">زادگاه / دیار:</span>
            <span class="font-bold text-brand-600 dark:text-brand-400">{{ birthPlace.Name }}</span>
          </div>
        </div>

        <p v-if="person.Description" class="text-xs sm:text-sm text-ink-700 dark:text-ink-300 leading-relaxed">
          {{ person.Description }}
        </p>
      </div>

      <!-- پیوندها و روابط خانوادگی شخص -->
      <div v-if="personRelations.length > 0" class="space-y-3">
        <h3 class="font-bold text-sm text-ink-900 dark:text-ink-50">
          پیوندها و تبارشناسی:
        </h3>
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div
            v-for="rel in personRelations"
            :key="rel.Id"
            class="p-3.5 rounded-xl border border-ink-200/80 dark:border-paper-border bg-paper-light dark:bg-paper-surface flex items-center justify-between text-xs"
          >
            <span class="text-ink-500">{{ formatRelationType(rel.RelationType) }}:</span>
            <router-link
              :to="`/person/${getRelatedPersonId(rel)}`"
              class="font-bold text-brand-700 dark:text-brand-300 hover:underline"
            >
              {{ getRelatedPersonName(rel) }}
            </router-link>
          </div>
        </div>
      </div>

      <!-- تفکیک ابیات ذکرکننده: حضور مستقیم (Participant) و تلمیح (Allusion) -->
      <div class="space-y-4">
        <h3 class="font-bold text-sm text-ink-900 dark:text-ink-50">
          ابیات شاهد و ذکر نام در اشعار:
        </h3>

        <!-- تب‌های تفکیک نقش -->
        <div class="flex gap-2 text-xs">
          <button
            @click="mentionTab = 'all'"
            class="px-3.5 py-1.5 rounded-xl font-bold transition-all border"
            :class="mentionTab === 'all' ? 'bg-brand-600 text-white border-brand-600' : 'bg-paper-light dark:bg-paper-surface border-ink-200 dark:border-paper-border text-ink-600'"
          >
            همهٔ ارجاعات
          </button>
          <button
            @click="mentionTab = 'participant'"
            class="px-3.5 py-1.5 rounded-xl font-bold transition-all border"
            :class="mentionTab === 'participant' ? 'bg-brand-600 text-white border-brand-600' : 'bg-paper-light dark:bg-paper-surface border-ink-200 dark:border-paper-border text-ink-600'"
          >
            حضور مستقیم (Participant)
          </button>
          <button
            @click="mentionTab = 'allusion'"
            class="px-3.5 py-1.5 rounded-xl font-bold transition-all border"
            :class="mentionTab === 'allusion' ? 'bg-brand-600 text-white border-brand-600' : 'bg-paper-light dark:bg-paper-surface border-ink-200 dark:border-paper-border text-ink-600'"
          >
            تلمیح و اشارهٔ ادبی (Allusion)
          </button>
        </div>

        <!-- فهرست ابیات شاهد استخراج‌شده از اسناد تبارشناسی -->
        <div v-if="evidenceItems.length > 0" class="space-y-2">
          <div
            v-for="(ev, idx) in evidenceItems"
            :key="idx"
            class="p-3.5 rounded-2xl bg-paper-light dark:bg-paper-surface border border-ink-200/80 dark:border-paper-border flex items-center justify-between text-xs"
          >
            <div>
              <span class="font-bold text-ink-800 dark:text-ink-200 block mb-0.5">
                {{ ev.relDesc }}
              </span>
              <span class="text-[11px] text-ink-400">
                شعر کد {{ toPersianDigits(ev.poemId) }}، بیت {{ toPersianDigits(ev.coupletIndex + 1) }}
              </span>
            </div>

            <router-link
              :to="`/poem/${ev.poemId}?couplet=${ev.coupletIndex}`"
              class="px-3 py-1.5 rounded-xl bg-brand-500/10 hover:bg-brand-500/20 text-brand-700 dark:text-brand-300 font-bold text-xs transition-colors"
            >
              مشاهده در متن شعر »
            </router-link>
          </div>
        </div>

        <!-- دکمه کاوش در اشعار دانلودشده -->
        <div class="p-4 rounded-2xl bg-paper-warm/70 dark:bg-paper-surface/60 border border-ink-200 dark:border-paper-border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
          <span class="text-ink-600 dark:text-ink-300 leading-relaxed">
            جست‌وجوی کلیه ابیات و اشعاری که نام «{{ person.Name }}» در آن‌ها به کار رفته است:
          </span>
          <router-link
            :to="`/search?q=${encodeURIComponent(person.Name)}`"
            class="px-4 py-2 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-bold whitespace-nowrap shadow-xs transition-colors"
          >
            جست‌وجوی ابیات «{{ person.Name }}» »
          </router-link>
        </div>
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed, watch } from 'vue';
import { useRoute } from 'vue-router';
import { useLiteraryStore } from '../stores/literaryStore';
import { toPersianDigits } from '../utils/persianNormalizer';
import type { GanjoorPerson, GanjoorPersonRelation } from '../types/ganjoor';
import LoadingState from '../components/common/LoadingState.vue';

var route = useRoute();
var literaryStore = useLiteraryStore();

var personId = computed(function () {
  return Number(route.params.personId);
});

var person = ref<GanjoorPerson | null>(null);
var isLoading = ref<boolean>(true);
var mentionTab = ref<'all' | 'participant' | 'allusion'>('all');

onMounted(loadPerson);
watch(personId, loadPerson);

async function loadPerson() {
  isLoading.value = true;
  await literaryStore.loadBaseMeta();
  person.value = literaryStore.getPersonById(personId.value) || null;
  isLoading.value = false;
}

var birthPlace = computed(function () {
  if (!person.value?.BirthPlaceId) return null;
  return literaryStore.getLocationById(person.value.BirthPlaceId);
});

var personRelations = computed(function () {
  return literaryStore.relations.filter(function (r) {
    return r.Person1Id === personId.value || r.Person2Id === personId.value;
  });
});

var evidenceItems = computed(function () {
  var list: { poemId: number; coupletIndex: number; relDesc: string }[] = [];
  var rels = personRelations.value;
  for (var i = 0; i < rels.length; i++) {
    var rel = rels[i];
    if (rel.Evidence && rel.Evidence.length) {
      var otherName = getRelatedPersonName(rel);
      var typeDesc = formatRelationType(rel.RelationType);
      for (var j = 0; j < rel.Evidence.length; j++) {
        var ev = rel.Evidence[j];
        list.push({
          poemId: ev.PoemId,
          coupletIndex: ev.CoupletIndex,
          relDesc: `${typeDesc} ${otherName}`
        });
      }
    }
  }
  return list;
});

function getRelatedPersonId(rel: GanjoorPersonRelation): number {
  return rel.Person1Id === personId.value ? rel.Person2Id : rel.Person1Id;
}

function getRelatedPersonName(rel: GanjoorPersonRelation): string {
  var targetId = getRelatedPersonId(rel);
  var target = literaryStore.getPersonById(targetId);
  return target ? target.Name : `شخص کد ${targetId}`;
}

function formatRelationType(type: string): string {
  switch (type) {
    case 'Parent': return 'نسبت والد / فرزند';
    case 'Sibling': return 'برادر / خواهر';
    case 'Spouse': return 'همسر';
    case 'Ancestor': return 'نیا و تبار';
    default: return type;
  }
}

function formatLifeDates(p: GanjoorPerson): string {
  if (p.BirthYearInLHijri && p.DeathYearInLHijri) {
    return `${toPersianDigits(p.BirthYearInLHijri)} تا ${toPersianDigits(p.DeathYearInLHijri)} هجری قمری`;
  }
  return 'اساطیری یا نامشخص';
}
</script>
