<template>
  <div class="py-16 max-w-lg mx-auto text-center px-4">
    <LoadingState v-if="isLoading" message="در حال جست‌وجو و انتقال به شعر..." />

    <EmptyState
      v-else
      type="book"
      title="شعر مورد نظر در دیوان‌های دانلودشده یافت نشد"
      :description="`شعر با شناسه ${toPersianDigits(targetId)} هنوز در پایگاه داده این دستگاه دانلود نشده است. لطفاً ابتدا دیوان شاعر مربوطه را دریافت نمایید یا عبارت مورد نظرتان را جست‌وجو فرمایید.`"
    >
      <div class="flex flex-wrap items-center justify-center gap-2 pt-2">
        <router-link
          to="/search"
          class="px-4 py-2 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-bold text-xs transition-colors shadow-xs"
        >
          جست‌وجوی شعر
        </router-link>
        <router-link
          to="/poets"
          class="px-4 py-2 rounded-xl border border-ink-200 dark:border-paper-border hover:bg-paper-warm text-ink-800 dark:text-ink-200 font-bold text-xs transition-colors"
        >
          فهرست دیوان‌ها
        </router-link>
      </div>
    </EmptyState>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { db } from '../db/GhazalDB';
import { toPersianDigits } from '../utils/persianNormalizer';
import LoadingState from '../components/common/LoadingState.vue';
import EmptyState from '../components/common/EmptyState.vue';

var route = useRoute();
var router = useRouter();

var isLoading = ref<boolean>(true);
var targetId = ref<number>(0);

onMounted(async function () {
  var paramId = route.params.poemId || route.query.poemId;
  var poemId = Number(paramId);
  var couplet = route.query.couplet;
  targetId.value = poemId;

  if (poemId && !isNaN(poemId)) {
    var poem = await db.poems.get(poemId);

    if (poem && poem.FullUrl) {
      var clean = poem.FullUrl.replace(/^\/+|\/+$/g, '');
      var queryPart = couplet !== undefined && couplet !== null ? `?couplet=${couplet}` : '';
      router.replace(`/read/${clean}${queryPart}`);
      return;
    }
  }

  isLoading.value = false;
});
</script>
