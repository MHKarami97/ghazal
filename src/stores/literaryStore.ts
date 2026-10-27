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
  GanjoorPersonAffiliation
} from '../types/ganjoor';

export const useLiteraryStore = defineStore('literary', () => {
  var devices = ref<GanjoorLiteraryDevice[]>([]);
  var sources = ref<GanjoorLiterarySource[]>([]);
  var metres = ref<GanjoorMetre[]>([]);
  var locations = ref<GanjoorLocation[]>([]);
  var people = ref<GanjoorPerson[]>([]);
  var relations = ref<GanjoorPersonRelation[]>([]);
  var affiliations = ref<GanjoorPersonAffiliation[]>([]);
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

  return {
    devices,
    sources,
    metres,
    locations,
    people,
    relations,
    affiliations,
    isLoaded,
    isLoading,
    loadBaseMeta,
    getDeviceById,
    getSourceByKey,
    getPersonById,
    getLocationById
  };
});
