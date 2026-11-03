import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import { db } from '../db/GhazalDB';
import { cdnClient } from '../services/CDNClient';
import type {
  GanjoorLiteraryDevice,
  GanjoorLiterarySource,
  GanjoorMetre,
  GanjoorLocation,
  GanjoorPerson,
  GanjoorPersonRelation,
  GanjoorPersonAffiliation,
  GanjoorGeotag,
  GanjoorLanguage,
  GanjoorLiteraryConcept
} from '../types/ganjoor';

var RETRY_INTERVAL_MS = 60 * 1000;

export const useLiteraryStore = defineStore('literary', () => {
  var devices = ref<GanjoorLiteraryDevice[]>([]);
  var sources = ref<GanjoorLiterarySource[]>([]);
  var metres = ref<GanjoorMetre[]>([]);
  var locations = ref<GanjoorLocation[]>([]);
  var people = ref<GanjoorPerson[]>([]);
  var relations = ref<GanjoorPersonRelation[]>([]);
  var affiliations = ref<GanjoorPersonAffiliation[]>([]);
  var geotags = ref<GanjoorGeotag[]>([]);
  var languages = ref<GanjoorLanguage[]>([]);
  var concepts = ref<GanjoorLiteraryConcept[]>([]);
  var isLoaded = ref<boolean>(false);
  var isLoading = ref<boolean>(false);

  var failedKeys: string[] = [];
  var lastAttemptAt = 0;
  var loadPromise: Promise<void> | null = null;

  var personById = computed(function () {
    return new Map<number, GanjoorPerson>(people.value.map(function (p) { return [p.Id, p] as [number, GanjoorPerson]; }));
  });
  var locationById = computed(function () {
    return new Map<number, GanjoorLocation>(locations.value.map(function (l) { return [l.Id, l] as [number, GanjoorLocation]; }));
  });
  var deviceById = computed(function () {
    return new Map<number, GanjoorLiteraryDevice>(devices.value.map(function (d) { return [d.Id, d] as [number, GanjoorLiteraryDevice]; }));
  });

  interface MetaLoader {
    key: string;
    fetch: () => Promise<unknown>;
    assign: (data: any) => void;
  }

  var metaLoaders: MetaLoader[] = [
    { key: 'devices', fetch: function () { return cdnClient.getLiteraryDevices(); }, assign: function (d) { devices.value = d; } },
    { key: 'sources', fetch: function () { return cdnClient.getLiterarySources(); }, assign: function (d) { sources.value = d; } },
    { key: 'metres', fetch: function () { return cdnClient.getMetres(); }, assign: function (d) { metres.value = d; } },
    { key: 'locations', fetch: function () { return cdnClient.getLocations(); }, assign: function (d) { locations.value = d; } },
    { key: 'people', fetch: function () { return cdnClient.getPeople(); }, assign: function (d) { people.value = d; } },
    { key: 'relations', fetch: function () { return cdnClient.getPersonRelations(); }, assign: function (d) { relations.value = d; } },
    { key: 'affiliations', fetch: function () { return cdnClient.getPersonAffiliations(); }, assign: function (d) { affiliations.value = d; } },
    { key: 'geotags', fetch: function () { return cdnClient.getGeotags(); }, assign: function (d) { geotags.value = d; } },
    { key: 'languages', fetch: function () { return cdnClient.getLanguages(); }, assign: function (d) { languages.value = d; } },
    { key: 'concepts', fetch: function () { return cdnClient.getLiteraryConcepts(); }, assign: function (d) { concepts.value = d; } }
  ];

  /** ابتدا IndexedDB، سپس شبکه؛ نتیجهٔ موفق در IndexedDB ذخیره می‌شود */
  async function loadMeta(loader: MetaLoader): Promise<boolean> {
    try {
      var record = await db.baseMeta.get(loader.key);
      if (record && record.data) {
        loader.assign(record.data);
        return true;
      }

      var raw = await loader.fetch();
      if (!raw) return false;

      await db.baseMeta.put({
        key: loader.key,
        data: JSON.parse(JSON.stringify(raw)),
        updatedAt: new Date().toISOString()
      });
      loader.assign(raw);
      return true;
    } catch (err) {
      console.warn(`Could not load ${loader.key}:`, err);
      return false;
    }
  }

  async function runLoad(): Promise<void> {
    isLoading.value = true;
    try {
      var results = await Promise.all(metaLoaders.map(loadMeta));
      failedKeys = metaLoaders
        .filter(function (_loader, index) { return !results[index]; })
        .map(function (loader) { return loader.key; });
      isLoaded.value = true;
    } finally {
      lastAttemptAt = Date.now();
      isLoading.value = false;
    }
  }

  /**
   * بارگذاری موازی و بدون تکرار. موارد ناموفق (مثلاً آفلاین) حداکثر هر ۶۰ ثانیه دوباره امتحان می‌شوند.
   */
  function loadBaseMeta(): Promise<void> {
    if (loadPromise) return loadPromise;

    var isFresh = isLoaded.value && (failedKeys.length === 0 || Date.now() - lastAttemptAt < RETRY_INTERVAL_MS);
    if (isFresh) return Promise.resolve();

    loadPromise = runLoad().finally(function () {
      loadPromise = null;
    });
    return loadPromise;
  }

  function getDeviceById(id: number): GanjoorLiteraryDevice | undefined {
    return deviceById.value.get(id);
  }

  function getSourceByKey(key: string): GanjoorLiterarySource | undefined {
    return sources.value.find(function (s) {
      return s.Key === key;
    });
  }

  function getPersonById(id: number): GanjoorPerson | undefined {
    return personById.value.get(id);
  }

  function getLocationById(id: number): GanjoorLocation | undefined {
    return locationById.value.get(id);
  }

  function getGeotagsForLocation(locId: number): GanjoorGeotag[] {
    return geotags.value.filter(function (g) {
      return g.LocationId === locId;
    });
  }

  function getFamousMetres() {
    return [
      {
        id: 'shahnameh',
        name: 'وزن شاهنامه و بوستان (حماسی)',
        rhythm: 'فعولن فعولن فعولن فعل',
        bahr: 'متقارب مثمن محذوف',
        description: 'آهنگ حماسهٔ ملی ایران، شاهنامه فردوسی، بوستان سعدی و اسکندرنامه نظامی',
        sample: 'به نام خداوند جان و خرد / کزین برتر اندیشه برنگذرد'
      },
      {
        id: 'dobeiti',
        name: 'وزن دوبیتی و فهلویات (عاشقانه-محلی)',
        rhythm: 'مفاعیلن مفاعیلن فعولن',
        bahr: 'هزج مسدس محذوف',
        description: 'آهنگ پرشور دوبیتی‌های باباطاهر، ترانه‌های محلی و ویس و رامین',
        sample: 'ز دست دیده و دل هر دو فریاد / که هر چه دیده بیند دل کند یاد'
      },
      {
        id: 'masnavi',
        name: 'وزن مثنوی معنوی و منطق‌الطیر (عرفانی)',
        rhythm: 'فاعلاتن فاعلاتن فاعلن',
        bahr: 'رمل مسدس محذوف',
        description: 'آهنگ شاهکارهای عرفانی مولانا و عطار نیشابوری',
        sample: 'بشنو این نی چون شکایت می‌کند / از جدایی‌ها حکایت می‌کند'
      },
      {
        id: 'hafez_mojtas',
        name: 'وزن پرکاربرد غزلیات حافظ و سعدی',
        rhythm: 'مفاعلن فعلاتن مفاعلن فعلن',
        bahr: 'مجتث مثمن مخبون محذوف',
        description: 'رایج‌ترین و موسیقایی‌ترین وزن غزل‌های عاشقانه و رندانه فارسی',
        sample: 'الا یا ایها الساقی ادر کأسا و ناولها / که عشق آسان نمود اول ولی افتاد مشکل‌ها'
      },
      {
        id: 'nezami_khorram',
        name: 'وزن خسرو و شیرین و نظامی',
        rhythm: 'مفاعیلن مفاعیلن مفاعیل',
        bahr: 'هزج مسدس مقصور',
        description: 'آهنگ منظومه‌های داستانی و بزم‌های عاشقانه نظامی گنجوی',
        sample: 'خداوندا در توفیق بگشای / نظامی را ره تحقیق بنمای'
      },
      {
        id: 'shams_motavi',
        name: 'وزن رقصان و طرب‌انگیز دیوان شمس',
        rhythm: 'مفتعلن مفتعلن مفتعلن مفتعلن',
        bahr: 'رجز مثمن مطوی',
        description: 'وزن شورانگیز و ضربی غزل‌های مولانا در وجد و سماع',
        sample: 'مرده بدم زنده شدم، گریه بدم خنده شدم / دولت عشق آمد و من دولت پاینده شدم'
      }
    ];
  }

  return {
    devices,
    sources,
    metres,
    locations,
    people,
    relations,
    affiliations,
    geotags,
    languages,
    concepts,
    isLoaded,
    isLoading,
    loadBaseMeta,
    getDeviceById,
    getSourceByKey,
    getPersonById,
    getLocationById,
    getGeotagsForLocation,
    getFamousMetres
  };
});
