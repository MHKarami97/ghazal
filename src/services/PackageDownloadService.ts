import { db } from '../db/GhazalDB';
import { cdnClient } from './CDNClient';
import { DATA_COMMIT_SHA, SUPPORTED_SCHEMA_VERSION, buildUrl } from '../config/dataConfig';
import type { DataPackage } from '../types/user';
import type { GanjoorPoem } from '../types/ganjoor';
import { searchIndexService } from './SearchIndexService';

export interface DownloadProgress {
  packageId: string;
  total: number;
  completed: number;
  percent: number;
  bytes: number;
  status: 'downloading' | 'paused' | 'completed' | 'cancelled' | 'error';
  error?: string;
}

export type ProgressCallback = (progress: DownloadProgress) => void;

export class PackageDownloadService {
  private worker: Worker | null = null;
  private listeners: Map<string, ProgressCallback[]> = new Map();
  private currentProgress: Map<string, DownloadProgress> = new Map();

  constructor() {
    this.initWorker();
  }

  private initWorker() {
    try {
      this.worker = new Worker(
        new URL('../workers/downloader.worker.ts', import.meta.url),
        { type: 'module' }
      );

      this.worker.onmessage = async (e) => {
        var msg = e.data;
        var pkgId = msg.packageId;

        if (msg.type === 'progress') {
          var prog: DownloadProgress = {
            packageId: pkgId,
            total: msg.total,
            completed: msg.completed,
            percent: msg.total > 0 ? Math.round((msg.completed / msg.total) * 100) : 0,
            bytes: msg.bytes,
            status: 'downloading'
          };
          this.currentProgress.set(pkgId, prog);
          this.notify(pkgId, prog);
        } else if (msg.type === 'batch') {
          var poems: GanjoorPoem[] = msg.items;
          // ذخیره اشعار در IndexedDB
          await db.poems.bulkPut(poems);
          // افزودن به ایندکس جست‌وجو
          await searchIndexService.indexPoems(poems);
        } else if (msg.type === 'completed') {
          var completedProg: DownloadProgress = {
            packageId: pkgId,
            total: msg.total,
            completed: msg.total,
            percent: 100,
            bytes: msg.bytes,
            status: 'completed'
          };
          this.currentProgress.set(pkgId, completedProg);
          this.notify(pkgId, completedProg);

          // به روزرسانی وضعیت بسته در IndexedDB
          await db.packages.update(pkgId, {
            status: 'ready',
            downloadedPoems: msg.total,
            sizeBytes: msg.bytes,
            installedAt: new Date().toISOString()
          });
        } else if (msg.type === 'cancelled') {
          var cancProg: DownloadProgress = {
            packageId: pkgId,
            total: 0,
            completed: 0,
            percent: 0,
            bytes: 0,
            status: 'cancelled'
          };
          this.currentProgress.set(pkgId, cancProg);
          this.notify(pkgId, cancProg);
        }
      };
    } catch (err) {
      console.error('Failed to initialize download worker:', err);
    }
  }

  onProgress(packageId: string, callback: ProgressCallback) {
    if (!this.listeners.has(packageId)) {
      this.listeners.set(packageId, []);
    }
    this.listeners.get(packageId)!.push(callback);
    // اگر وضعیتی در جریان است بلافاصله گزارش بده
    if (this.currentProgress.has(packageId)) {
      callback(this.currentProgress.get(packageId)!);
    }
  }

  private notify(packageId: string, progress: DownloadProgress) {
    var cbs = this.listeners.get(packageId) || [];
    for (var i = 0; i < cbs.length; i++) {
      cbs[i](progress);
    }
  }

  /**
   * دانلود کامل یک شاعر به همراه تمام دفاتر و اشعار
   */
  async downloadPoet(poetSlug: string, poetName: string): Promise<void> {
    var pkgId = `poet:${poetSlug}`;

    // ۱. دریافت مشخصات شاعر و ذخیره در دیتابیس
    var poet = await cdnClient.getPoet(poetSlug);
    await db.poets.put(poet);

    // ۲. جمع‌آوری تمام آدرس‌های اشعار شاعر با پیمایش بازگشتی دفاتر
    var poemUrls: string[] = [];
    var categoriesToVisit: string[] = ['']; // root

    while (categoriesToVisit.length > 0) {
      var currentCatPath = categoriesToVisit.shift()!;
      try {
        var cat = await cdnClient.getCategory(poetSlug, currentCatPath);
        await db.categories.put(cat);

        if (cat.Poems && cat.Poems.length) {
          for (var p = 0; p < cat.Poems.length; p++) {
            poemUrls.push(buildUrl.poemByFullUrl(cat.Poems[p].FullUrl));
          }
        }

        if (cat.ChildCats && cat.ChildCats.length) {
          for (var c = 0; c < cat.ChildCats.length; c++) {
            var childUrl = cat.ChildCats[c].FullUrl.replace(`/${poetSlug}`, '').replace(/^\//, '');
            categoriesToVisit.push(childUrl);
          }
        }
      } catch (e) {
        console.warn('Error fetching cat:', currentCatPath, e);
      }
    }

    // ایجاد رکورد اولیه بسته
    var newPkg: DataPackage = {
      id: pkgId,
      type: 'poet',
      slug: poetSlug,
      title: poetName || poet.Name,
      totalPoems: poemUrls.length,
      downloadedPoems: 0,
      sizeBytes: 0,
      commitSha: DATA_COMMIT_SHA,
      schemaVersion: SUPPORTED_SCHEMA_VERSION,
      installedAt: new Date().toISOString(),
      status: 'downloading'
    };
    await db.packages.put(newPkg);

    // ارسال وظیفه به ورکر
    if (!this.worker) this.initWorker();
    this.worker?.postMessage({
      action: 'start',
      task: {
        packageId: pkgId,
        type: 'poet',
        slug: poetSlug,
        title: poetName,
        urls: poemUrls,
        commitSha: DATA_COMMIT_SHA,
        schemaVersion: SUPPORTED_SCHEMA_VERSION
      }
    });
  }

  /**
   * دانلود یک دفتر خاص از یک شاعر
   */
  async downloadCategory(poetSlug: string, catPath: string, catTitle: string): Promise<void> {
    var pkgId = `cat:${poetSlug}:${catPath}`;
    var cat = await cdnClient.getCategory(poetSlug, catPath);
    await db.categories.put(cat);

    var poemUrls: string[] = [];
    if (cat.Poems) {
      for (var i = 0; i < cat.Poems.length; i++) {
        poemUrls.push(buildUrl.poemByFullUrl(cat.Poems[i].FullUrl));
      }
    }

    var newPkg: DataPackage = {
      id: pkgId,
      type: 'category',
      slug: `${poetSlug}/${catPath}`,
      title: catTitle || cat.Title,
      totalPoems: poemUrls.length,
      downloadedPoems: 0,
      sizeBytes: 0,
      commitSha: DATA_COMMIT_SHA,
      schemaVersion: SUPPORTED_SCHEMA_VERSION,
      installedAt: new Date().toISOString(),
      status: 'downloading'
    };
    await db.packages.put(newPkg);

    if (!this.worker) this.initWorker();
    this.worker?.postMessage({
      action: 'start',
      task: {
        packageId: pkgId,
        type: 'category',
        slug: catPath,
        title: catTitle,
        urls: poemUrls,
        commitSha: DATA_COMMIT_SHA,
        schemaVersion: SUPPORTED_SCHEMA_VERSION
      }
    });
  }

  /**
   * دانلود بسته پایه (اشخاص، مکان‌ها، آرایه‌ها، اوزان عروضی)
   */
  async downloadBasePackage(): Promise<void> {
    var pkgId = 'base:meta';
    var newPkg: DataPackage = {
      id: pkgId,
      type: 'base',
      slug: 'base',
      title: 'بسته پایه (اشخاص، مکان‌ها، آرایه‌های ادبی و اوزان عروضی)',
      totalPoems: 0,
      downloadedPoems: 0,
      sizeBytes: 0,
      commitSha: DATA_COMMIT_SHA,
      schemaVersion: SUPPORTED_SCHEMA_VERSION,
      installedAt: new Date().toISOString(),
      status: 'downloading'
    };
    await db.packages.put(newPkg);

    var prog: DownloadProgress = {
      packageId: pkgId,
      total: 7,
      completed: 0,
      percent: 0,
      bytes: 0,
      status: 'downloading'
    };
    this.notify(pkgId, prog);

    try {
      var totalBytes = 0;
      var locs = await cdnClient.getLocations();
      totalBytes += JSON.stringify(locs).length;
      await db.baseMeta.put({ key: 'locations', data: locs, updatedAt: new Date().toISOString() });
      prog.completed = 1; prog.percent = 15; this.notify(pkgId, prog);

      var people = await cdnClient.getPeople();
      totalBytes += JSON.stringify(people).length;
      await db.baseMeta.put({ key: 'people', data: people, updatedAt: new Date().toISOString() });
      prog.completed = 2; prog.percent = 30; this.notify(pkgId, prog);

      var rels = await cdnClient.getPersonRelations();
      totalBytes += JSON.stringify(rels).length;
      await db.baseMeta.put({ key: 'relations', data: rels, updatedAt: new Date().toISOString() });
      prog.completed = 3; prog.percent = 45; this.notify(pkgId, prog);

      var affs = await cdnClient.getPersonAffiliations();
      totalBytes += JSON.stringify(affs).length;
      await db.baseMeta.put({ key: 'affiliations', data: affs, updatedAt: new Date().toISOString() });
      prog.completed = 4; prog.percent = 60; this.notify(pkgId, prog);

      var devices = await cdnClient.getLiteraryDevices();
      totalBytes += JSON.stringify(devices).length;
      await db.baseMeta.put({ key: 'devices', data: devices, updatedAt: new Date().toISOString() });
      prog.completed = 5; prog.percent = 75; this.notify(pkgId, prog);

      var sources = await cdnClient.getLiterarySources();
      totalBytes += JSON.stringify(sources).length;
      await db.baseMeta.put({ key: 'sources', data: sources, updatedAt: new Date().toISOString() });
      prog.completed = 6; prog.percent = 90; this.notify(pkgId, prog);

      var metres = await cdnClient.getMetres();
      totalBytes += JSON.stringify(metres).length;
      await db.baseMeta.put({ key: 'metres', data: metres, updatedAt: new Date().toISOString() });

      prog.completed = 7; prog.percent = 100; prog.status = 'completed'; prog.bytes = totalBytes;
      this.notify(pkgId, prog);

      await db.packages.update(pkgId, {
        status: 'ready',
        sizeBytes: totalBytes,
        installedAt: new Date().toISOString()
      });
    } catch (e: any) {
      prog.status = 'error';
      prog.error = e.message;
      this.notify(pkgId, prog);
      await db.packages.update(pkgId, { status: 'error' });
    }
  }

  pause(packageId: string) {
    this.worker?.postMessage({ action: 'pause' });
    var prog = this.currentProgress.get(packageId);
    if (prog) {
      prog.status = 'paused';
      this.notify(packageId, prog);
    }
  }

  resume(packageId: string) {
    this.worker?.postMessage({ action: 'resume' });
    var prog = this.currentProgress.get(packageId);
    if (prog) {
      prog.status = 'downloading';
      this.notify(packageId, prog);
    }
  }

  cancel(packageId: string) {
    this.worker?.postMessage({ action: 'cancel' });
  }

  /**
   * حذف بسته دانلودی و آزادسازی حافظه
   */
  async removePackage(packageId: string): Promise<void> {
    var pkg = await db.packages.get(packageId);
    if (!pkg) return;

    if (pkg.type === 'poet') {
      var poetSlug = pkg.slug;
      // حذف اشعاری که آدرسشان با این اسلاگ شروع می‌شود
      var prefix = `/${poetSlug}`;
      var allPoems = await db.poems.toArray();
      var toDelete = allPoems.filter(function (p) {
        return p.FullUrl.startsWith(prefix);
      }).map(function (p) {
        return p.Id;
      });
      await db.poems.bulkDelete(toDelete);
      // حذف بیوگرافی شاعر
      var poet = await db.poets.where('FullUrl').equals(prefix).first();
      if (poet) await db.poets.delete(poet.Id);
    } else if (pkg.type === 'base') {
      await db.baseMeta.clear();
    }

    await db.packages.delete(packageId);
  }
}

export const packageDownloadService = new PackageDownloadService();
