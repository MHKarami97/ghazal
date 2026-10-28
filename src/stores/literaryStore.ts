import { defineStore } from 'pinia';
import { ref } from 'vue';
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

  async function loadBaseMeta() {
    if (isLoaded.value) return;
    isLoading.value = true;

    try {
      // بررسی و بارگذاری ابزارها و صنایع ادبی
      try {
        var devRecord = await db.baseMeta.get('devices');
        if (devRecord && devRecord.data) {
          devices.value = devRecord.data;
        } else {
          var rawDev = await cdnClient.getLiteraryDevices();
          if (rawDev) {
            await db.baseMeta.put({ key: 'devices', data: JSON.parse(JSON.stringify(rawDev)), updatedAt: new Date().toISOString() });
            devices.value = rawDev;
          }
        }
      } catch (eDev) {
        console.warn('Could not load literary devices:', eDev);
      }

      // منابع ادبی
      try {
        var srcRecord = await db.baseMeta.get('sources');
        if (srcRecord && srcRecord.data) {
          sources.value = srcRecord.data;
        } else {
          var rawSrc = await cdnClient.getLiterarySources();
          if (rawSrc) {
            await db.baseMeta.put({ key: 'sources', data: JSON.parse(JSON.stringify(rawSrc)), updatedAt: new Date().toISOString() });
            sources.value = rawSrc;
          }
        }
      } catch (eSrc) {
        console.warn('Could not load literary sources:', eSrc);
      }

      // اوزان عروضی
      try {
        var metresRecord = await db.baseMeta.get('metres');
        if (metresRecord && metresRecord.data) {
          metres.value = metresRecord.data;
        } else {
          var rawMetres = await cdnClient.getMetres();
          if (rawMetres) {
            await db.baseMeta.put({ key: 'metres', data: JSON.parse(JSON.stringify(rawMetres)), updatedAt: new Date().toISOString() });
            metres.value = rawMetres;
          }
        }
      } catch (eMetres) {
        console.warn('Could not load metres:', eMetres);
      }

      // مکان‌ها و دیارها
      try {
        var locsRecord = await db.baseMeta.get('locations');
        if (locsRecord && locsRecord.data) {
          locations.value = locsRecord.data;
        } else {
          var rawLocs = await cdnClient.getLocations();
          if (rawLocs) {
            await db.baseMeta.put({ key: 'locations', data: JSON.parse(JSON.stringify(rawLocs)), updatedAt: new Date().toISOString() });
            locations.value = rawLocs;
          }
        }
      } catch (eLocs) {
        console.warn('Could not load locations:', eLocs);
      }

      // اشخاص و مفاخر
      try {
        var peopleRecord = await db.baseMeta.get('people');
        if (peopleRecord && peopleRecord.data) {
          people.value = peopleRecord.data;
        } else {
          var rawPeople = await cdnClient.getPeople();
          if (rawPeople) {
            await db.baseMeta.put({ key: 'people', data: JSON.parse(JSON.stringify(rawPeople)), updatedAt: new Date().toISOString() });
            people.value = rawPeople;
          }
        }
      } catch (ePeople) {
        console.warn('Could not load people:', ePeople);
      }

      // روابط و تبارشناسی اشخاص
      try {
        var relsRecord = await db.baseMeta.get('relations');
        if (relsRecord && relsRecord.data) {
          relations.value = relsRecord.data;
        } else {
          var rawRels = await cdnClient.getPersonRelations();
          if (rawRels) {
            await db.baseMeta.put({ key: 'relations', data: JSON.parse(JSON.stringify(rawRels)), updatedAt: new Date().toISOString() });
            relations.value = rawRels;
          }
        }
      } catch (eRels) {
        console.warn('Could not load relations:', eRels);
      }

      // وابستگی‌ها و هم‌پیمانی‌ها
      try {
        var affsRecord = await db.baseMeta.get('affiliations');
        if (affsRecord && affsRecord.data) {
          affiliations.value = affsRecord.data;
        } else {
          var rawAffs = await cdnClient.getPersonAffiliations();
          if (rawAffs) {
            await db.baseMeta.put({ key: 'affiliations', data: JSON.parse(JSON.stringify(rawAffs)), updatedAt: new Date().toISOString() });
            affiliations.value = rawAffs;
          }
        }
      } catch (eAffs) {
        console.warn('Could not load affiliations:', eAffs);
      }

      // برچسب‌های جغرافیایی ابیات
      try {
        var geoRecord = await db.baseMeta.get('geotags');
        if (geoRecord && geoRecord.data) {
          geotags.value = geoRecord.data;
        } else {
          var rawGeo = await cdnClient.getGeotags();
          if (rawGeo) {
            await db.baseMeta.put({ key: 'geotags', data: JSON.parse(JSON.stringify(rawGeo)), updatedAt: new Date().toISOString() });
            geotags.value = rawGeo;
          }
        }
      } catch (eGeo) {
        console.warn('Could not load geotags:', eGeo);
      }

      // زبان‌ها و گویش‌ها
      try {
        var langRecord = await db.baseMeta.get('languages');
        if (langRecord && langRecord.data) {
          languages.value = langRecord.data;
        } else {
          var rawLang = await cdnClient.getLanguages();
          if (rawLang) {
            await db.baseMeta.put({ key: 'languages', data: JSON.parse(JSON.stringify(rawLang)), updatedAt: new Date().toISOString() });
            languages.value = rawLang;
          }
        }
      } catch (eLang) {
        console.warn('Could not load languages:', eLang);
      }

      // مفاهیم ادبی
      try {
        var conceptRecord = await db.baseMeta.get('concepts');
        if (conceptRecord && conceptRecord.data) {
          concepts.value = conceptRecord.data;
        } else {
          var rawConcepts = await cdnClient.getLiteraryConcepts();
          if (rawConcepts) {
            await db.baseMeta.put({ key: 'concepts', data: JSON.parse(JSON.stringify(rawConcepts)), updatedAt: new Date().toISOString() });
            concepts.value = rawConcepts;
          }
        }
      } catch (eConcept) {
        console.warn('Could not load concepts:', eConcept);
      }

      isLoaded.value = true;
    } catch (err) {
      console.error('Error loading literary base meta:', err);
    } finally {
      isLoading.value = false;
    }
  }

  function getDeviceById(id: number): GanjoorLiteraryDevice | undefined {
    return devices.value.find(function (d) {
      return d.Id === id;
    });
  }

  function getSourceByKey(key: string): GanjoorLiterarySource | undefined {
    return sources.value.find(function (s) {
      return s.Key === key;
    });
  }

  function getPersonById(id: number): GanjoorPerson | undefined {
    return people.value.find(function (p) {
      return p.Id === id;
    });
  }

  function getLocationById(id: number): GanjoorLocation | undefined {
    return locations.value.find(function (l) {
      return l.Id === id;
    });
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
