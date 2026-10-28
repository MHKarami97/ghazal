import { db } from '../db/GhazalDB';
import { cdnClient } from './CDNClient';
import { DATA_COMMIT_SHA, SUPPORTED_SCHEMA_VERSION, buildUrl } from '../config/dataConfig';
import type { DataPackage } from '../types/user';
import type { GanjoorPoem } from '../types/ganjoor';
import { searchIndexService } from './SearchIndexService';

export type DownloadStatus =
  | 'preparing'
  | 'downloading'
  | 'paused'
  | 'finalizing'
  | 'completed'
  | 'cancelled'
  | 'error';

export interface DownloadProgress {
  packageId: string;
  title: string;
  stage: string;
  total: number;
  completed: number;
  failed: number;
  percent: number;
  bytes: number;
  status: DownloadStatus;
  error?: string;
}

export type ProgressCallback = (progress: DownloadProgress) => void;

interface TaskBaseline {
  alreadyCompleted: number;
  alreadyBytes: number;
}

class DownloadCancelledError extends Error {
  constructor() {
    super('download cancelled');
  }
}

var ACTIVE_STATUSES: DownloadStatus[] = ['preparing', 'downloading', 'paused', 'finalizing'];
var CATEGORY_CRAWL_CONCURRENCY = 4;

export class PackageDownloadService {
  private worker: Worker | null = null;
  private listeners: Map<string, ProgressCallback[]> = new Map();
  private globalListeners: ProgressCallback[] = [];
  private currentProgress: Map<string, DownloadProgress> = new Map();
  private sessionSavedIds: Map<string, number[]> = new Map();
  private baselines: Map<string, TaskBaseline> = new Map();
  private cancelRequested: Set<string> = new Set();
  private messageQueue: Promise<void> = Promise.resolve();
  private recovered = false;

  constructor() {
    this.initWorker();
  }

  private initWorker(): void {
    try {
      this.worker = new Worker(
        new URL('../workers/downloader.worker.ts', import.meta.url),
        { type: 'module' }
      );

      var self = this;
      this.worker.onmessage = function (e: MessageEvent) {
        var msg = e.data;

        if (msg.type === 'completed') {
          self.publish(msg.packageId, { status: 'finalizing', stage: 'ذخیره‌سازی نهایی و ایندکس جست‌وجو' });
        }

        self.messageQueue = self.messageQueue
          .then(function () {
            return self.handleWorkerMessage(msg);
          })
          .catch(function (err) {
            console.error('Download message handling failed:', err);
            self.fail(msg.packageId, err);
          });
      };

      this.worker.onerror = function (ev) {
        console.error('Download worker crashed:', ev.message);
        self.currentProgress.forEach(function (prog, id) {
          if (ACTIVE_STATUSES.indexOf(prog.status) !== -1) {
            self.fail(id, new Error('پردازشگر دانلود به‌طور غیرمنتظره متوقف شد.'));
          }
        });
        self.worker = null;
      };
    } catch (err) {
      console.error('Failed to initialize download worker:', err);
    }
  }

  private async handleWorkerMessage(msg: any): Promise<void> {
    var pkgId: string = msg.packageId;

    if (msg.type === 'progress') {
      var current = this.currentProgress.get(pkgId);
      if (!current || ACTIVE_STATUSES.indexOf(current.status) === -1 || current.status === 'finalizing') return;
      this.publish(pkgId, {
        status: current.status === 'paused' ? 'paused' : 'downloading',
        stage: this.cancelRequested.has(pkgId)
          ? 'در حال لغو...'
          : current.status === 'paused' ? 'متوقف‌شده' : 'در حال دریافت اشعار',
        total: msg.total,
        completed: msg.completed,
        failed: msg.failed,
        bytes: msg.bytes
      });
    } else if (msg.type === 'batch') {
      var poems: GanjoorPoem[] = msg.items;
      await db.poems.bulkPut(poems);

      var saved = this.sessionSavedIds.get(pkgId) || [];
      for (var i = 0; i < poems.length; i++) saved.push(poems[i].Id);
      this.sessionSavedIds.set(pkgId, saved);

      await db.packages.update(pkgId, { downloadedPoems: msg.completed, sizeBytes: msg.bytes });
      await searchIndexService.indexPoems(poems);
    } else if (msg.type === 'completed') {
      await this.finishTask(pkgId, msg);
    } else if (msg.type === 'cancelled') {
      await this.finishCancelled(pkgId);
    }
  }

  private async finishTask(pkgId: string, msg: any): Promise<void> {
    var hasFailures = msg.failed > 0;

    await db.packages.update(pkgId, {
      status: hasFailures ? 'interrupted' : 'ready',
      downloadedPoems: msg.completed,
      sizeBytes: msg.bytes,
      installedAt: new Date().toISOString()
    });

    this.cleanupTask(pkgId);

    if (hasFailures) {
      this.publish(pkgId, {
        status: 'error',
        stage: 'دانلود ناقص ماند',
        total: msg.total,
        completed: msg.completed,
        failed: msg.failed,
        bytes: msg.bytes,
        error: `${msg.failed} شعر دریافت نشد. اتصال را بررسی و دوباره تلاش کنید؛ فقط موارد باقی‌مانده دانلود می‌شوند.`
      });
      return;
    }

    this.publish(pkgId, {
      status: 'completed',
      stage: 'دانلود کامل شد',
      total: msg.total,
      completed: msg.total,
      failed: 0,
      bytes: msg.bytes
    });
  }

  private async finishCancelled(pkgId: string): Promise<void> {
    var saved = this.sessionSavedIds.get(pkgId) || [];
    if (saved.length > 0) {
      await db.poems.bulkDelete(saved);
    }

    var baseline = this.baselines.get(pkgId);
    var previous = await db.packages.get(pkgId);

    if (baseline && baseline.alreadyCompleted > 0) {
      await db.packages.update(pkgId, {
        status: 'interrupted',
        downloadedPoems: baseline.alreadyCompleted,
        sizeBytes: baseline.alreadyBytes
      });
    } else if (!baseline && previous && previous.downloadedPoems > 0) {
      await db.packages.update(pkgId, { status: 'interrupted' });
    } else if (previous) {
      await db.packages.delete(pkgId);
    }

    this.cleanupTask(pkgId);
    this.publish(pkgId, { status: 'cancelled', stage: 'دانلود لغو شد' });
  }

  private cleanupTask(pkgId: string): void {
    this.sessionSavedIds.delete(pkgId);
    this.baselines.delete(pkgId);
    this.cancelRequested.delete(pkgId);
  }

  onProgress(packageId: string, callback: ProgressCallback): void {
    if (!this.listeners.has(packageId)) {
      this.listeners.set(packageId, []);
    }
    this.listeners.get(packageId)!.push(callback);
    if (this.currentProgress.has(packageId)) {
      callback(this.currentProgress.get(packageId)!);
    }
  }

  onAnyProgress(callback: ProgressCallback): void {
    this.globalListeners.push(callback);
    this.currentProgress.forEach(function (prog) {
      callback(prog);
    });
  }

  getProgress(packageId: string): DownloadProgress | undefined {
    return this.currentProgress.get(packageId);
  }

  isActive(packageId: string): boolean {
    var prog = this.currentProgress.get(packageId);
    return !!prog && ACTIVE_STATUSES.indexOf(prog.status) !== -1;
  }

  private publish(packageId: string, patch: Partial<DownloadProgress>): DownloadProgress {
    var previous = this.currentProgress.get(packageId) || {
      packageId: packageId,
      title: packageId,
      stage: '',
      total: 0,
      completed: 0,
      failed: 0,
      percent: 0,
      bytes: 0,
      status: 'preparing' as DownloadStatus
    };

    var next: DownloadProgress = { ...previous, ...patch };
    if (next.total > 0) {
      next.percent = Math.min(100, Math.round((next.completed / next.total) * 100));
    }
    if (next.status === 'completed') next.percent = 100;

    this.currentProgress.set(packageId, next);
    this.notify(packageId, next);
    return next;
  }

  private notify(packageId: string, progress: DownloadProgress): void {
    var snapshot = { ...progress };
    var cbs = this.listeners.get(packageId) || [];
    for (var i = 0; i < cbs.length; i++) cbs[i](snapshot);
    for (var g = 0; g < this.globalListeners.length; g++) this.globalListeners[g](snapshot);
  }

  private fail(packageId: string, err: unknown): void {
    if (err instanceof DownloadCancelledError) {
      void this.finishCancelled(packageId);
      return;
    }

    var message = err instanceof Error ? err.message : String(err);
    void db.packages.get(packageId).then(function (pkg) {
      if (pkg) {
        return db.packages.update(packageId, { status: pkg.type === 'base' ? 'error' : 'interrupted' });
      }
    });

    this.cleanupTask(packageId);
    this.publish(packageId, { status: 'error', stage: 'دانلود با خطا متوقف شد', error: message });
  }

  async downloadPoet(poetSlug: string, poetName: string): Promise<void> {
    var pkgId = `poet:${poetSlug}`;
    if (this.isActive(pkgId)) return;

    this.begin(pkgId, poetName, 'دریافت مشخصات شاعر');

    try {
      var poet = await cdnClient.getPoet(poetSlug);
      await db.poets.put(JSON.parse(JSON.stringify(poet)));
      this.throwIfCancelled(pkgId);

      var fullUrls = await this.collectPoemUrls(pkgId, poetSlug, '');
      await this.startPoemTask(pkgId, {
        type: 'poet',
        slug: poetSlug,
        title: poetName || poet.Name,
        prefix: `/${poetSlug}/`,
        fullUrls: fullUrls
      });
    } catch (err) {
      this.fail(pkgId, err);
    }
  }

  async downloadCategory(poetSlug: string, catPath: string, catTitle: string): Promise<void> {
    var pkgId = `cat:${poetSlug}:${catPath}`;
    if (this.isActive(pkgId)) return;

    this.begin(pkgId, catTitle || catPath, 'بررسی فهرست اشعار دفتر');

    try {
      var fullUrls = await this.collectPoemUrls(pkgId, poetSlug, catPath);
      await this.startPoemTask(pkgId, {
        type: 'category',
        slug: `${poetSlug}/${catPath}`,
        title: catTitle || catPath,
        prefix: `/${poetSlug}/${catPath}/`,
        fullUrls: fullUrls
      });
    } catch (err) {
      this.fail(pkgId, err);
    }
  }

  async downloadBasePackage(): Promise<void> {
    var pkgId = 'base:meta';
    if (this.isActive(pkgId)) return;

    var title = 'بسته پایه (اشخاص، مکان‌ها، آرایه‌های ادبی و اوزان عروضی)';
    this.begin(pkgId, title, 'آماده‌سازی');

    var steps: { key: string; label: string; load: () => Promise<unknown> }[] = [
      { key: 'locations', label: 'مکان‌ها', load: function () { return cdnClient.getLocations(); } },
      { key: 'people', label: 'اشخاص', load: function () { return cdnClient.getPeople(); } },
      { key: 'relations', label: 'روابط اشخاص', load: function () { return cdnClient.getPersonRelations(); } },
      { key: 'affiliations', label: 'وابستگی‌ها', load: function () { return cdnClient.getPersonAffiliations(); } },
      { key: 'devices', label: 'آرایه‌های ادبی', load: function () { return cdnClient.getLiteraryDevices(); } },
      { key: 'sources', label: 'منابع پژوهشی', load: function () { return cdnClient.getLiterarySources(); } },
      { key: 'metres', label: 'اوزان عروضی', load: function () { return cdnClient.getMetres(); } }
    ];

    try {
      await db.packages.put(this.createPackageRecord(pkgId, 'base', 'base', title, 0, 0, 0));
      var totalBytes = 0;

      for (var i = 0; i < steps.length; i++) {
        this.throwIfCancelled(pkgId);
        this.publish(pkgId, {
          status: 'downloading',
          stage: `دریافت ${steps[i].label}`,
          total: steps.length,
          completed: i,
          bytes: totalBytes
        });

        var data = await steps[i].load();
        totalBytes += JSON.stringify(data).length;
        await db.baseMeta.put({
          key: steps[i].key,
          data: JSON.parse(JSON.stringify(data)),
          updatedAt: new Date().toISOString()
        });
      }

      await db.packages.update(pkgId, {
        status: 'ready',
        sizeBytes: totalBytes,
        installedAt: new Date().toISOString()
      });
      this.cleanupTask(pkgId);
      this.publish(pkgId, {
        status: 'completed',
        stage: 'دانلود کامل شد',
        total: steps.length,
        completed: steps.length,
        bytes: totalBytes
      });
    } catch (err) {
      if (err instanceof DownloadCancelledError) {
        await db.packages.delete(pkgId);
        this.cleanupTask(pkgId);
        this.publish(pkgId, { status: 'cancelled', stage: 'دانلود لغو شد' });
        return;
      }
      this.fail(pkgId, err);
    }
  }

  pause(packageId: string): void {
    var prog = this.currentProgress.get(packageId);
    if (!prog || prog.status !== 'downloading') return;
    this.worker?.postMessage({ action: 'pause', packageId: packageId });
    this.publish(packageId, { status: 'paused', stage: 'متوقف‌شده' });
  }

  resume(packageId: string): void {
    var prog = this.currentProgress.get(packageId);
    if (!prog || prog.status !== 'paused') return;
    this.worker?.postMessage({ action: 'resume', packageId: packageId });
    this.publish(packageId, { status: 'downloading', stage: 'در حال دریافت اشعار' });
  }

  cancel(packageId: string): void {
    if (!this.isActive(packageId)) return;
    this.cancelRequested.add(packageId);
    this.publish(packageId, { stage: 'در حال لغو...' });
    this.worker?.postMessage({ action: 'cancel', packageId: packageId });
  }

  async recoverInterruptedPackages(): Promise<void> {
    if (this.recovered) return;
    this.recovered = true;

    var stuck = await db.packages.where('status').anyOf('downloading', 'paused').toArray();
    for (var i = 0; i < stuck.length; i++) {
      var pkg = stuck[i];
      if (this.isActive(pkg.id)) continue;

      var stats = await this.measurePackage(pkg);
      await db.packages.update(pkg.id, {
        status: 'interrupted',
        downloadedPoems: stats.count,
        sizeBytes: stats.bytes
      });
    }
  }

  async removePackage(packageId: string): Promise<void> {
    if (this.isActive(packageId)) return;

    var pkg = await db.packages.get(packageId);
    if (!pkg) return;

    var prefix = this.prefixOf(pkg);
    if (prefix) {
      var ids = (await db.poems.where('FullUrl').startsWith(prefix).primaryKeys()) as number[];
      await db.poems.bulkDelete(ids);
    }

    if (pkg.type === 'poet') {
      var poet = await db.poets.where('FullUrl').equals(`/${pkg.slug}`).first();
      if (poet) await db.poets.delete(poet.Id);
    } else if (pkg.type === 'base') {
      await db.baseMeta.clear();
    }

    await db.packages.delete(packageId);
    this.currentProgress.delete(packageId);
  }

  private begin(pkgId: string, title: string, stage: string): void {
    this.cancelRequested.delete(pkgId);
    this.currentProgress.delete(pkgId);
    this.publish(pkgId, { title: title, stage: stage, status: 'preparing' });
  }

  private throwIfCancelled(pkgId: string): void {
    if (this.cancelRequested.has(pkgId)) {
      throw new DownloadCancelledError();
    }
  }

  private async collectPoemUrls(pkgId: string, poetSlug: string, startPath: string): Promise<string[]> {
    var queue: string[] = [startPath];
    var fullUrls: string[] = [];
    var visited = 0;

    while (queue.length > 0) {
      this.throwIfCancelled(pkgId);

      var level = queue.splice(0, CATEGORY_CRAWL_CONCURRENCY);
      var categories = await Promise.all(
        level.map(function (path) {
          return cdnClient.getCategory(poetSlug, path);
        })
      );

      for (var i = 0; i < categories.length; i++) {
        var cat = categories[i];
        await db.categories.put(JSON.parse(JSON.stringify(cat)));

        var poems = cat.Poems || [];
        for (var p = 0; p < poems.length; p++) fullUrls.push(poems[p].FullUrl);

        var children = cat.ChildCats || [];
        for (var c = 0; c < children.length; c++) {
          queue.push(children[c].FullUrl.replace(`/${poetSlug}`, '').replace(/^\//, ''));
        }
      }

      visited += level.length;
      this.publish(pkgId, {
        stage: `بررسی ساختار دیوان (${visited} بخش، ${fullUrls.length} شعر)`
      });
    }

    return fullUrls;
  }

  private async startPoemTask(
    pkgId: string,
    info: { type: 'poet' | 'category'; slug: string; title: string; prefix: string; fullUrls: string[] }
  ): Promise<void> {
    this.throwIfCancelled(pkgId);
    this.publish(pkgId, { stage: 'بررسی اشعار ذخیره‌شده' });

    var existingKeys = (await db.poems.where('FullUrl').startsWith(info.prefix).keys()) as string[];
    var existing = new Set<string>(existingKeys.map((u) => this.normalizeUrl(u)));
    var missing = info.fullUrls.filter((u) => !existing.has(this.normalizeUrl(u)));
    var alreadyCompleted = info.fullUrls.length - missing.length;

    var previous = await db.packages.get(pkgId);
    var alreadyBytes = 0;
    if (alreadyCompleted > 0) {
      alreadyBytes = previous && previous.sizeBytes > 0
        ? previous.sizeBytes
        : (await this.measurePrefix(info.prefix)).bytes;
    }

    await db.packages.put(
      this.createPackageRecord(pkgId, info.type, info.slug, info.title, info.fullUrls.length, alreadyCompleted, alreadyBytes)
    );

    this.baselines.set(pkgId, { alreadyCompleted: alreadyCompleted, alreadyBytes: alreadyBytes });
    this.throwIfCancelled(pkgId);

    if (missing.length === 0) {
      await db.packages.update(pkgId, { status: 'ready' });
      this.cleanupTask(pkgId);
      this.publish(pkgId, {
        status: 'completed',
        stage: 'همهٔ اشعار از قبل ذخیره شده بود',
        total: info.fullUrls.length,
        completed: info.fullUrls.length,
        bytes: alreadyBytes
      });
      return;
    }

    if (!this.worker) this.initWorker();
    if (!this.worker) throw new Error('امکان اجرای پردازشگر دانلود در این مرورگر وجود ندارد.');

    this.publish(pkgId, {
      status: 'downloading',
      stage: 'در حال دریافت اشعار',
      total: info.fullUrls.length,
      completed: alreadyCompleted,
      failed: 0,
      bytes: alreadyBytes
    });

    this.worker.postMessage({
      action: 'start',
      task: {
        packageId: pkgId,
        urls: missing.map((u) => buildUrl.poemByFullUrl(u)),
        alreadyCompleted: alreadyCompleted,
        alreadyBytes: alreadyBytes
      }
    });
  }

  private createPackageRecord(
    id: string,
    type: DataPackage['type'],
    slug: string,
    title: string,
    totalPoems: number,
    downloadedPoems: number,
    sizeBytes: number
  ): DataPackage {
    return {
      id: id,
      type: type,
      slug: slug,
      title: title,
      totalPoems: totalPoems,
      downloadedPoems: downloadedPoems,
      sizeBytes: sizeBytes,
      commitSha: DATA_COMMIT_SHA,
      schemaVersion: SUPPORTED_SCHEMA_VERSION,
      installedAt: new Date().toISOString(),
      status: 'downloading'
    };
  }

  private normalizeUrl(url: string): string {
    return url.replace(/\/+$/, '');
  }

  private prefixOf(pkg: DataPackage): string | null {
    if (pkg.type === 'poet' || pkg.type === 'category') return `/${pkg.slug}/`;
    return null;
  }

  private async measurePackage(pkg: DataPackage): Promise<{ count: number; bytes: number }> {
    var prefix = this.prefixOf(pkg);
    if (!prefix) return { count: 0, bytes: 0 };
    return this.measurePrefix(prefix);
  }

  private async measurePrefix(prefix: string): Promise<{ count: number; bytes: number }> {
    var count = 0;
    var bytes = 0;
    await db.poems.where('FullUrl').startsWith(prefix).each(function (poem) {
      count++;
      bytes += JSON.stringify(poem).length;
    });
    return { count: count, bytes: bytes };
  }
}

export const packageDownloadService = new PackageDownloadService();
