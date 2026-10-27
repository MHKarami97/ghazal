import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import { db } from '../db/GhazalDB';
import { cdnClient } from '../services/CDNClient';
import { dataVersionService, type VersionStatus } from '../services/DataVersionService';
import { packageDownloadService, type DownloadProgress } from '../services/PackageDownloadService';
import type { GanjoorManifest, GanjoorPoetRef } from '../types/ganjoor';
import type { DataPackage } from '../types/user';

export const useDataStore = defineStore('data', () => {
  var manifest = ref<GanjoorManifest | null>(null);
  var installedPackages = ref<DataPackage[]>([]);
  var versionStatus = ref<VersionStatus | null>(null);
  var activeProgress = ref<Record<string, DownloadProgress>>({});
  var isLoadingManifest = ref<boolean>(false);
  var error = ref<string | null>(null);

  var poets = computed<GanjoorPoetRef[]>(function () {
    return manifest.value?.Poets || [];
  });

  async function init() {
    await loadInstalledPackages();
    await checkVersion();
    await loadManifest();
  }

  async function checkVersion() {
    versionStatus.value = await dataVersionService.checkVersionCompatibility();
  }

  async function loadManifest() {
    isLoadingManifest.value = true;
    error.value = null;
    try {
      manifest.value = await cdnClient.getManifest();
    } catch (err: any) {
      error.value = err.message;
    } finally {
      isLoadingManifest.value = false;
    }
  }

  async function loadInstalledPackages() {
    installedPackages.value = await db.packages.toArray();
  }

  function isPackageInstalled(packageId: string): boolean {
    return installedPackages.value.some(function (p) {
      return p.id === packageId && p.status === 'ready';
    });
  }

  function isPoetInstalled(poetSlug: string): boolean {
    return isPackageInstalled(`poet:${poetSlug}`);
  }

  function isBasePackageInstalled(): boolean {
    return isPackageInstalled('base:meta');
  }

  async function downloadPoet(poetSlug: string, poetName: string) {
    var pkgId = `poet:${poetSlug}`;
    packageDownloadService.onProgress(pkgId, function (prog) {
      activeProgress.value[pkgId] = prog;
      if (prog.status === 'completed') {
        loadInstalledPackages();
      }
    });

    await packageDownloadService.downloadPoet(poetSlug, poetName);
    await loadInstalledPackages();
  }

  async function downloadCategory(poetSlug: string, catPath: string, catTitle: string) {
    var pkgId = `cat:${poetSlug}:${catPath}`;
    packageDownloadService.onProgress(pkgId, function (prog) {
      activeProgress.value[pkgId] = prog;
      if (prog.status === 'completed') {
        loadInstalledPackages();
      }
    });

    await packageDownloadService.downloadCategory(poetSlug, catPath, catTitle);
    await loadInstalledPackages();
  }

  async function downloadBasePackage() {
    var pkgId = 'base:meta';
    packageDownloadService.onProgress(pkgId, function (prog) {
      activeProgress.value[pkgId] = prog;
      if (prog.status === 'completed') {
        loadInstalledPackages();
      }
    });

    await packageDownloadService.downloadBasePackage();
    await loadInstalledPackages();
  }

  async function removePackage(packageId: string) {
    await packageDownloadService.removePackage(packageId);
    delete activeProgress.value[packageId];
    await loadInstalledPackages();
  }

  return {
    manifest,
    poets,
    installedPackages,
    versionStatus,
    activeProgress,
    isLoadingManifest,
    error,
    init,
    checkVersion,
    loadManifest,
    loadInstalledPackages,
    isPackageInstalled,
    isPoetInstalled,
    isBasePackageInstalled,
    downloadPoet,
    downloadCategory,
    downloadBasePackage,
    removePackage
  };
});
