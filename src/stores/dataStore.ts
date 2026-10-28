import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import { db } from '../db/GhazalDB';
import { cdnClient } from '../services/CDNClient';
import { dataVersionService, type VersionStatus } from '../services/DataVersionService';
import { packageDownloadService, type DownloadProgress } from '../services/PackageDownloadService';
import type { GanjoorManifest, GanjoorPoetRef } from '../types/ganjoor';
import type { DataPackage } from '../types/user';

var ACTIVE_STATUSES = ['preparing', 'downloading', 'paused', 'finalizing'];
var TERMINAL_DISMISS_DELAY_MS = 4000;

export const useDataStore = defineStore('data', () => {
  var manifest = ref<GanjoorManifest | null>(null);
  var installedPackages = ref<DataPackage[]>([]);
  var versionStatus = ref<VersionStatus | null>(null);
  var activeProgress = ref<Record<string, DownloadProgress>>({});
  var isLoadingManifest = ref<boolean>(false);
  var isDownloadPanelOpen = ref<boolean>(false);
  var error = ref<string | null>(null);

  var isSubscribed = false;
  var dismissTimers = new Map<string, ReturnType<typeof setTimeout>>();

  var poets = computed<GanjoorPoetRef[]>(function () {
    return manifest.value?.Poets || [];
  });

  var downloadList = computed<DownloadProgress[]>(function () {
    return Object.values(activeProgress.value);
  });

  var hasActiveDownloads = computed<boolean>(function () {
    return downloadList.value.some(function (p) {
      return ACTIVE_STATUSES.indexOf(p.status) !== -1;
    });
  });

  function subscribeToDownloads(): void {
    if (isSubscribed) return;
    isSubscribed = true;
    packageDownloadService.onAnyProgress(handleProgress);
  }

  function handleProgress(prog: DownloadProgress): void {
    var isNew = !activeProgress.value[prog.packageId];
    activeProgress.value = { ...activeProgress.value, [prog.packageId]: prog };

    var timer = dismissTimers.get(prog.packageId);
    if (timer) {
      clearTimeout(timer);
      dismissTimers.delete(prog.packageId);
    }

    if (isNew && prog.status === 'preparing') {
      isDownloadPanelOpen.value = true;
    }

    var isTerminal = ACTIVE_STATUSES.indexOf(prog.status) === -1;
    if (!isTerminal) return;

    void loadInstalledPackages();

    if (prog.status !== 'error') {
      dismissTimers.set(
        prog.packageId,
        setTimeout(function () {
          dismissProgress(prog.packageId);
        }, TERMINAL_DISMISS_DELAY_MS)
      );
    }
  }

  function dismissProgress(packageId: string): void {
    var next = { ...activeProgress.value };
    delete next[packageId];
    activeProgress.value = next;
    dismissTimers.delete(packageId);
    if (Object.keys(next).length === 0) {
      isDownloadPanelOpen.value = false;
    }
  }

  async function init() {
    subscribeToDownloads();
    await packageDownloadService.recoverInterruptedPackages();
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

  function getProgress(packageId: string): DownloadProgress | undefined {
    return activeProgress.value[packageId];
  }

  function isDownloadActive(packageId: string): boolean {
    var prog = activeProgress.value[packageId];
    return !!prog && ACTIVE_STATUSES.indexOf(prog.status) !== -1;
  }

  async function downloadPoet(poetSlug: string, poetName: string) {
    subscribeToDownloads();
    await packageDownloadService.downloadPoet(poetSlug, poetName);
    await loadInstalledPackages();
  }

  async function downloadCategory(poetSlug: string, catPath: string, catTitle: string) {
    subscribeToDownloads();
    await packageDownloadService.downloadCategory(poetSlug, catPath, catTitle);
    await loadInstalledPackages();
  }

  async function downloadBasePackage() {
    subscribeToDownloads();
    await packageDownloadService.downloadBasePackage();
    await loadInstalledPackages();
  }

  async function resumePackage(pkg: DataPackage) {
    if (pkg.type === 'poet') {
      await downloadPoet(pkg.slug, pkg.title);
    } else if (pkg.type === 'category') {
      var separator = pkg.slug.indexOf('/');
      await downloadCategory(pkg.slug.slice(0, separator), pkg.slug.slice(separator + 1), pkg.title);
    } else {
      await downloadBasePackage();
    }
  }

  async function retryDownload(packageId: string) {
    var title = activeProgress.value[packageId]?.title || packageId;
    dismissProgress(packageId);

    if (packageId.startsWith('poet:')) {
      await downloadPoet(packageId.slice('poet:'.length), title);
    } else if (packageId.startsWith('cat:')) {
      var rest = packageId.slice('cat:'.length);
      var split = rest.indexOf(':');
      await downloadCategory(rest.slice(0, split), rest.slice(split + 1), title);
    } else {
      await downloadBasePackage();
    }
  }

  function pauseDownload(packageId: string) {
    packageDownloadService.pause(packageId);
  }

  function resumeDownload(packageId: string) {
    packageDownloadService.resume(packageId);
  }

  function cancelDownload(packageId: string) {
    packageDownloadService.cancel(packageId);
  }

  async function removePackage(packageId: string) {
    await packageDownloadService.removePackage(packageId);
    dismissProgress(packageId);
    await loadInstalledPackages();
  }

  return {
    manifest,
    poets,
    installedPackages,
    versionStatus,
    activeProgress,
    downloadList,
    hasActiveDownloads,
    isDownloadPanelOpen,
    isLoadingManifest,
    error,
    init,
    checkVersion,
    loadManifest,
    loadInstalledPackages,
    isPackageInstalled,
    isPoetInstalled,
    isBasePackageInstalled,
    getProgress,
    isDownloadActive,
    downloadPoet,
    downloadCategory,
    downloadBasePackage,
    resumePackage,
    retryDownload,
    pauseDownload,
    resumeDownload,
    cancelDownload,
    dismissProgress,
    removePackage
  };
});
