<template>
  <div class="py-16 max-w-lg mx-auto text-center px-4">
    <LoadingState v-if="isLoading" message="در حال دریافت و انتقال به شعر..." />

    <EmptyState
      v-else
      type="book"
      title="شعر مورد نظر در دسترس نیست"
      :description="`شعر با شناسه ${toPersianDigits(targetId)} در دیوان‌های دانلودشده یافت نشد و دریافت آنلاین آن نیز ناموفق بود. لطفاً اتصال اینترنت را بررسی کرده یا عبارت شعر را جست‌وجو کنید.`"
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
import { mapApiPoemToGanjoorPoem, normalizeGanjoorFullUrl } from '../utils/ganjoorPoemMapper';
import { toPersianDigits } from '../utils/persianNormalizer';
import LoadingState from '../components/common/LoadingState.vue';
import EmptyState from '../components/common/EmptyState.vue';

var route = useRoute();
var router = useRouter();

var isLoading = ref<boolean>(true);
var targetId = ref<number>(0);

function buildReadTarget(fullUrl: string, couplet: unknown): string {
  var clean = normalizeGanjoorFullUrl(fullUrl).replace(/^\/+|\/+$/g, '');
  if (!clean) return '';
  var queryPart = couplet !== undefined && couplet !== null && couplet !== '' ? `?couplet=${couplet}` : '';
  return `/read/${clean}${queryPart}`;
}

onMounted(async function () {
  var paramId = route.params.poemId || route.query.poemId;
  var poemId = Number(paramId);
  var couplet = route.query.couplet;
  targetId.value = poemId;

  if (!poemId || isNaN(poemId)) {
    isLoading.value = false;
    return;
  }

  // ۱. بررسی سریع در اشعار دانلودشده محلی
  try {
    var localPoem = await db.poems.get(poemId);
    if (localPoem && localPoem.FullUrl) {
      var localTarget = buildReadTarget(localPoem.FullUrl, couplet);
      if (localTarget) {
        router.replace(localTarget);
        return;
      }
    }
  } catch (e) {}

  // ۲. بررسی کش مسیرهای حل‌شده قبلی
  try {
    var cachedRoute = await db.baseMeta.get(`poem-route:${poemId}`);
    if (cachedRoute && typeof cachedRoute.data === 'string') {
      var cachedTarget = buildReadTarget(cachedRoute.data, couplet);
      if (cachedTarget) {
        router.replace(cachedTarget);
        return;
      }
    }
  } catch (e) {}

  // ۳. دریافت آنلاین مشخصات و نشانی شعر از API گنجور
  try {
    var controller = new AbortController();
    var timeoutId = setTimeout(function () {
      controller.abort();
    }, 6500);

    var url = `https://api.ganjoor.net/api/ganjoor/poem/${poemId}?catInfo=true&catPoems=false&rhymes=true&recitations=false&images=false&songs=false&comments=false&navigation=false`;
    var res = await fetch(url, {
      headers: { 'Accept': 'application/json' },
      signal: controller.signal
    });
    clearTimeout(timeoutId);

    if (res.ok) {
      var raw = await res.json();
      var mapped = mapApiPoemToGanjoorPoem(raw);
      if (mapped && mapped.FullUrl) {
        try {
          await db.baseMeta.put({
            key: `poem-route:${poemId}`,
            data: mapped.FullUrl,
            updatedAt: new Date().toISOString()
          });
          await db.baseMeta.put({
            key: `poem-api:${mapped.FullUrl.replace(/^\/+/, '')}`,
            data: JSON.parse(JSON.stringify(mapped)),
            updatedAt: new Date().toISOString()
          });
        } catch (e) {}

        var remoteTarget = buildReadTarget(mapped.FullUrl, couplet);
        if (remoteTarget) {
          router.replace(remoteTarget);
          return;
        }
      } else if (mapped && mapped.Verses.length > 0) {
        mapped.FullUrl = `/ganjoor/poem-${poemId}`;
        try {
          await db.poems.put(JSON.parse(JSON.stringify(mapped)));
        } catch (e) {}
        router.replace(buildReadTarget(mapped.FullUrl, couplet));
        return;
      }
    }
  } catch (e) {}

  isLoading.value = false;
});
</script>
