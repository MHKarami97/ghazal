<template>
  <div class="py-16">
    <LoadingState message="در حال انتقال به شعر..." />
  </div>
</template>

<script setup lang="ts">
import { onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { db } from '../db/GhazalDB';
import LoadingState from '../components/common/LoadingState.vue';

var route = useRoute();
var router = useRouter();

onMounted(async function () {
  var paramId = route.params.poemId || route.query.poemId;
  var poemId = Number(paramId);
  var couplet = route.query.couplet;

  if (poemId && !isNaN(poemId)) {
    // ۱. بررسی در IndexedDB
    var poem = await db.poems.get(poemId);
    if (!poem) {
      var all = await db.poems.toArray();
      poem = all.find(function (p) { return p.Id === poemId; });
    }

    if (poem && poem.FullUrl) {
      var clean = poem.FullUrl.replace(/^\/+|\/+$/g, '');
      var queryPart = couplet !== undefined && couplet !== null ? `?couplet=${couplet}` : '';
      router.replace(`/read/${clean}${queryPart}`);
      return;
    }
  }

  // در صورت عدم یافتن، هدایت به صفحه شاعران
  router.replace('/poets');
});
</script>
