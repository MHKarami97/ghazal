<template>
  <div class="space-y-4">
    <!-- فیلتر مکان‌ها و جست‌وجوی شهر -->
    <div class="flex items-center gap-3">
      <div class="relative flex-1">
        <input
          v-model="searchQuery"
          type="text"
          placeholder="جست‌وجوی شهر یا دیار در نقشه ادبی..."
          class="w-full pr-10 pl-4 py-2.5 rounded-xl border border-ink-200 dark:border-paper-border bg-paper-light dark:bg-paper-surface text-ink-900 dark:text-ink-100 text-sm focus:ring-2 focus:ring-brand-500 outline-hidden"
        />
        <Search class="w-4 h-4 absolute right-3.5 top-3.5 text-ink-400" />
      </div>

      <span class="text-xs text-ink-500 font-medium whitespace-nowrap">
        {{ toPersianDigits(filteredLocations.length) }} شهر تاریخی
      </span>
    </div>

    <!-- کانتینر نقشه با ارتفاع مناسب -->
    <div class="relative w-full h-[520px] rounded-2xl overflow-hidden border border-ink-200 dark:border-paper-border shadow-md">
      <div id="literary-map-container" class="w-full h-full"></div>

      <!-- وضعیت لودینگ نقشه -->
      <div v-if="isLoading" class="absolute inset-0 bg-paper-light/80 dark:bg-paper-dark/80 flex items-center justify-center z-10">
        <div class="text-center">
          <div class="w-8 h-8 rounded-full border-2 border-brand-500 border-t-transparent animate-spin mx-auto mb-2"></div>
          <span class="text-xs text-ink-600 dark:text-ink-300">در حال آماده‌سازی نقشه ادبی...</span>
        </div>
      </div>
    </div>

    <!-- جزئیات مکان انتخاب‌شده -->
    <div
      v-if="selectedLocation"
      class="p-4 rounded-2xl bg-paper-warm/80 dark:bg-paper-surface/80 border border-brand-500/30 flex items-start justify-between"
    >
      <div>
        <h4 class="font-bold text-base text-brand-800 dark:text-brand-300 mb-1">
          {{ selectedLocation.Name }}
        </h4>
        <p class="text-xs text-ink-600 dark:text-ink-400">
          مختصات جغرافیایی: عرض {{ toPersianDigits(selectedLocation.Latitude.toFixed(2)) }}، طول {{ toPersianDigits(selectedLocation.Longitude.toFixed(2)) }}
        </p>
      </div>

      <button
        @click="selectedLocation = null"
        class="text-xs text-ink-400 hover:text-ink-700 dark:hover:text-ink-200"
      >
        بستن
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed, watch } from 'vue';
import { useLiteraryStore } from '../../stores/literaryStore';
import { toPersianDigits } from '../../utils/persianNormalizer';
import type { GanjoorLocation } from '../../types/ganjoor';
import { Search } from 'lucide-vue-next';

var literaryStore = useLiteraryStore();
var searchQuery = ref<string>('');
var selectedLocation = ref<GanjoorLocation | null>(null);
var isLoading = ref<boolean>(true);
var mapInstance: any = null;
var markersGroup: any = null;

var filteredLocations = computed(function () {
  var locs = literaryStore.locations;
  if (!searchQuery.value.trim()) return locs;
  return locs.filter(function (l) {
    return l.Name.includes(searchQuery.value.trim());
  });
});

onMounted(async function () {
  await literaryStore.loadBaseMeta();
  initMap();
});

async function initMap() {
  try {
    // Dynamic import of Leaflet
    var L = await import('leaflet');
    // Add leaflet styles dynamically if needed
    if (!document.getElementById('leaflet-css')) {
      var link = document.createElement('link');
      link.id = 'leaflet-css';
      link.rel = 'stylesheet';
      link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
      document.head.appendChild(link);
    }

    var container = document.getElementById('literary-map-container');
    if (!container) return;

    // مرکزیت روی فلات ایران و خراسان بزرگ
    mapInstance = L.map(container, {
      center: [32.4279, 53.688],
      zoom: 5,
      minZoom: 3,
      maxZoom: 12
    });

    // کاشی نقشه تیره/روشن
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap contributors'
    }).addTo(mapInstance);

    markersGroup = L.layerGroup().addTo(mapInstance);
    renderMarkers(L);
  } catch (err) {
    console.error('Error loading Leaflet map:', err);
  } finally {
    isLoading.value = false;
  }
}

function renderMarkers(L: any) {
  if (!markersGroup || !L) return;
  markersGroup.clearLayers();

  var locs = filteredLocations.value;
  for (var i = 0; i < locs.length; i++) {
    var loc = locs[i];
    if (loc.Latitude && loc.Longitude) {
      var marker = L.circleMarker([loc.Latitude, loc.Longitude], {
        radius: 7,
        fillColor: '#b87c2c',
        color: '#ffffff',
        weight: 2,
        opacity: 1,
        fillOpacity: 0.85
      });

      marker.bindPopup(`
        <div style="font-family: Vazirmatn, sans-serif; text-align: right; direction: rtl; padding: 4px;">
          <b style="font-size: 14px; color: #b87c2c;">${loc.Name}</b>
          <div style="font-size: 11px; color: #64748b; margin-top: 4px;">دیار و مکان جغرافیایی در ادبیات کهن</div>
        </div>
      `);

      (function (currentLoc) {
        marker.on('click', function () {
          selectedLocation.value = currentLoc;
        });
      })(loc);

      markersGroup.addLayer(marker);
    }
  }
}

watch(filteredLocations, function () {
  import('leaflet').then(function (L) {
    renderMarkers(L);
  });
});
</script>
