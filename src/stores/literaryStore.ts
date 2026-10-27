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
      // بررسی وجود در IndexedDB
      var devRecord = await db.baseMeta.get('devices');
      if (devRecord) {
        devices.value = devRecord.data;
      } else {
        devices.value = await cdnClient.getLiteraryDevices();
        await db.baseMeta.put({ key: 'devices', data: devices.value, updatedAt: new Date().toISOString() });
      }

      var srcRecord = await db.baseMeta.get('sources');
      if (srcRecord) {
        sources.value = srcRecord.data;
      } else {
        sources.value = await cdnClient.getLiterarySources();
        await db.baseMeta.put({ key: 'sources', data: sources.value, updatedAt: new Date().toISOString() });
      }

      var metresRecord = await db.baseMeta.get('metres');
      if (metresRecord) {
        metres.value = metresRecord.data;
      } else {
        metres.value = await cdnClient.getMetres();
        await db.baseMeta.put({ key: 'metres', data: metres.value, updatedAt: new Date().toISOString() });
      }

      var locsRecord = await db.baseMeta.get('locations');
      if (locsRecord) {
        locations.value = locsRecord.data;
      } else {
        locations.value = await cdnClient.getLocations();
        await db.baseMeta.put({ key: 'locations', data: locations.value, updatedAt: new Date().toISOString() });
      }

      var peopleRecord = await db.baseMeta.get('people');
      if (peopleRecord) {
        people.value = peopleRecord.data;
      } else {
        people.value = await cdnClient.getPeople();
        await db.baseMeta.put({ key: 'people', data: people.value, updatedAt: new Date().toISOString() });
      }

      var relsRecord = await db.baseMeta.get('relations');
      if (relsRecord) {
        relations.value = relsRecord.data;
      } else {
        relations.value = await cdnClient.getPersonRelations();
        await db.baseMeta.put({ key: 'relations', data: relations.value, updatedAt: new Date().toISOString() });
      }

      var affsRecord = await db.baseMeta.get('affiliations');
      if (affsRecord) {
        affiliations.value = affsRecord.data;
      } else {
        affiliations.value = await cdnClient.getPersonAffiliations();
        await db.baseMeta.put({ key: 'affiliations', data: affiliations.value, updatedAt: new Date().toISOString() });
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
