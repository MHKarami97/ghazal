<template>
  <div class="space-y-4">
    <!-- فیلتر مکان‌ها و جست‌وجوی شهر -->
    <div class="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
      <div class="relative flex-1">
        <input
          v-model="searchQuery"
          type="text"
          placeholder="جست‌وجوی شهر، دیار یا ولایت تاریخی (شیراز، نیشابور، بلخ، تبریز...)"
          class="w-full pr-10 pl-4 py-2.5 rounded-xl border border-ink-200 dark:border-paper-border bg-paper-light dark:bg-paper-surface text-ink-900 dark:text-ink-100 text-sm focus:ring-2 focus:ring-brand-500 outline-hidden"
        />
        <Search class="w-4 h-4 absolute right-3.5 top-3.5 text-ink-400" />
      </div>

      <span class="text-xs text-ink-500 font-medium whitespace-nowrap self-end sm:self-center">
        {{ toPersianDigits(filteredLocations.length) }} دیار و مکان تاریخی
      </span>
    </div>

    <!-- کانتینر نقشه با ارتفاع مناسب -->
    <div class="relative w-full h-[520px] rounded-2xl overflow-hidden border border-ink-200 dark:border-paper-border shadow-md bg-paper-warm/40 dark:bg-paper-surface/40">
      <div ref="mapContainer" class="w-full h-full z-0"></div>

      <!-- وضعیت لودینگ نقشه -->
      <div v-if="isLoading" class="absolute inset-0 bg-paper-light/80 dark:bg-paper-dark/80 flex items-center justify-center z-10">
        <div class="text-center">
          <div class="w-8 h-8 rounded-full border-2 border-brand-500 border-t-transparent animate-spin mx-auto mb-2"></div>
          <span class="text-xs text-ink-600 dark:text-ink-300">در حال آماده‌سازی نقشه و مختصات دیارها...</span>
        </div>
      </div>
    </div>

    <!-- جزئیات مکان انتخاب‌شده -->
    <div
      v-if="selectedLocation"
      class="p-4 rounded-2xl bg-paper-warm/90 dark:bg-paper-surface/90 border border-brand-500/40 shadow-xs flex items-start justify-between"
    >
      <div>
        <div class="flex items-center gap-2 mb-1">
          <MapPin class="w-4 h-4 text-brand-600" />
          <h4 class="font-bold text-base text-brand-800 dark:text-brand-300">
            {{ selectedLocation.Name }}
          </h4>
        </div>
        <p class="text-xs text-ink-600 dark:text-ink-400">
          مختصات جغرافیایی: عرض جغرافیایی {{ toPersianDigits(Number(selectedLocation.Latitude).toFixed(2)) }}، طول جغرافیایی {{ toPersianDigits(Number(selectedLocation.Longitude).toFixed(2)) }}
        </p>
      </div>

      <button
        @click="selectedLocation = null"
        class="text-xs text-ink-400 hover:text-ink-700 dark:hover:text-ink-200 px-2 py-1 rounded-lg"
      >
        بستن
      </button>
    </div>

    <!-- فهرست شهرهای تاریخی جهت انتخاب سریع -->
    <div class="pt-2">
      <h4 class="font-bold text-xs text-ink-700 dark:text-ink-300 mb-3 flex items-center gap-1.5">
        <span>فهرست شهرهای ثبت‌شده در ادب پارسی</span>
        <span class="text-[10px] text-ink-400">(برای تمرکز نقشه روی هر شهر کلیک کنید)</span>
      </h4>

      <div class="flex flex-wrap gap-2 max-h-48 overflow-y-auto p-1">
        <button
          v-for="loc in filteredLocations.slice(0, 50)"
          :key="loc.Id"
          @click="focusLocation(loc)"
          class="px-3 py-1.5 rounded-xl text-xs bg-paper-light dark:bg-paper-surface border border-ink-200 dark:border-paper-border hover:border-brand-500 hover:text-brand-600 dark:hover:text-brand-300 text-ink-800 dark:text-ink-200 transition-all shadow-2xs flex items-center gap-1"
        >
          <MapPin class="w-3 h-3 text-brand-500/70" />
          <span>{{ loc.Name }}</span>
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, computed, watch, nextTick } from 'vue';
import { useLiteraryStore } from '../../stores/literaryStore';
import { toPersianDigits } from '../../utils/persianNormalizer';
import type { GanjoorLocation } from '../../types/ganjoor';
import { Search, MapPin } from 'lucide-vue-next';
import 'leaflet/dist/leaflet.css';

var literaryStore = useLiteraryStore();
var mapContainer = ref<HTMLElement | null>(null);
var searchQuery = ref<string>('');
var selectedLocation = ref<GanjoorLocation | null>(null);
var isLoading = ref<boolean>(true);
var mapInstance: any = null;
var markersGroup: any = null;
var LeafletLib: any = null;

var filteredLocations = computed(function () {
  var locs = literaryStore.locations;
  if (!searchQuery.value.trim()) return locs;
  var q = searchQuery.value.trim();
  return locs.filter(function (l) {
    return l.Name && l.Name.includes(q);
  });
});

onMounted(async function () {
  await literaryStore.loadBaseMeta();
  await nextTick();
  await initMap();
});

onUnmounted(function () {
  if (mapInstance) {
    mapInstance.remove();
    mapInstance = null;
  }
});

async function initMap() {
  try {
    LeafletLib = await import('leaflet');
    var L = LeafletLib.default || LeafletLib;

    if (!mapContainer.value) return;

    // ایجاد نقشه با تنظیمات بهینه
    mapInstance = L.map(mapContainer.value, {
      center: [32.4279, 53.688],
      zoom: 5,
      minZoom: 3,
      maxZoom: 14
    });

    // کاشی نقشه استاندارد OpenStreetMap
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap contributors',
      maxZoom: 18
    }).addTo(mapInstance);

    markersGroup = L.layerGroup().addTo(mapInstance);

    renderMarkers();

    // فراخوانی invalidateSize جهت رفع مشکل خاکستری شدن در بارگذاری اولیه تب‌ها
    setTimeout(function () {
      if (mapInstance) {
        mapInstance.invalidateSize();
      }
    }, 200);

    setTimeout(function () {
      if (mapInstance) {
        mapInstance.invalidateSize();
      }
    }, 600);
  } catch (err) {
    console.error('Error initializing Leaflet map:', err);
  } finally {
    isLoading.value = false;
  }
}

function renderMarkers() {
  if (!markersGroup || !LeafletLib || !mapInstance) return;
  var L = LeafletLib.default || LeafletLib;

  markersGroup.clearLayers();

  var locs = filteredLocations.value;
  for (var i = 0; i < locs.length; i++) {
    var loc = locs[i];
    var lat = Number(loc.Latitude);
    var lng = Number(loc.Longitude);

    if (!isNaN(lat) && !isNaN(lng) && lat !== 0 && lng !== 0) {
      var marker = L.circleMarker([lat, lng], {
        radius: 8,
        fillColor: '#c2410c',
        color: '#ffffff',
        weight: 2,
        opacity: 1,
        fillOpacity: 0.9
      });

      marker.bindPopup(`
        <div style="font-family: Vazirmatn, sans-serif; text-align: right; direction: rtl; padding: 4px;">
          <b style="font-size: 14px; color: #c2410c;">${loc.Name}</b>
          <div style="font-size: 11px; color: #64748b; margin-top: 4px;">دیار و مکان تاریخی در ادبیات فارسی</div>
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

function focusLocation(loc: GanjoorLocation) {
  selectedLocation.value = loc;
  var lat = Number(loc.Latitude);
  var lng = Number(loc.Longitude);
  if (mapInstance && !isNaN(lat) && !isNaN(lng)) {
    mapInstance.flyTo([lat, lng], 8, { duration: 1 });
  }
}

watch(filteredLocations, function () {
  renderMarkers();
});

watch(
  function () {
    return literaryStore.locations;
  },
  function () {
    renderMarkers();
  }
);
</script>
