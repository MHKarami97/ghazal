import { DATA_COMMIT_SHA, SUPPORTED_SCHEMA_VERSION } from '../config/dataConfig';
import { cdnClient } from './CDNClient';
import { db } from '../db/GhazalDB';
import type { GanjoorManifest } from '../types/ganjoor';

export interface VersionStatus {
  isCompatible: boolean;
  appCommitSha: string;
  appSchemaVersion: number;
  remoteSchemaVersion?: number;
  remoteGeneratedAt?: string;
  errorMessage?: string;
  hasUpdates: boolean;
  outdatedPackagesCount: number;
}

export class DataVersionService {
  /**
   * بررسی سازگاری نسخه Schema و وضعیت آپدیت دیتای ریموت
   */
  async checkVersionCompatibility(): Promise<VersionStatus> {
    try {
      var manifest: GanjoorManifest = await cdnClient.getManifest();

      // بررسی نسخه schema
      if (manifest.SchemaVersion !== SUPPORTED_SCHEMA_VERSION) {
        return {
          isCompatible: false,
          appCommitSha: DATA_COMMIT_SHA,
          appSchemaVersion: SUPPORTED_SCHEMA_VERSION,
          remoteSchemaVersion: manifest.SchemaVersion,
          remoteGeneratedAt: manifest.GeneratedAtUtc,
          errorMessage: `نسخه الگوی داده (${manifest.SchemaVersion}) با نسخه پشتیبانی‌شده توسط برنامه (${SUPPORTED_SCHEMA_VERSION}) همخوانی ندارد. به دلیل تغییر در ایندکس‌گذاری ابیات و فیلدها، دانلود متوقف شد.`,
          hasUpdates: false,
          outdatedPackagesCount: 0
        };
      }

      // بررسی بسته‌های قدیمی در دیتابیس محلی
      var installedPackages = await db.packages.toArray();
      var outdatedCount = 0;

      for (var i = 0; i < installedPackages.length; i++) {
        var pkg = installedPackages[i];
        if (pkg.commitSha !== DATA_COMMIT_SHA) {
          outdatedCount++;
          // بروزرسانی وضعیت به آپدیت موجود است
          await db.packages.update(pkg.id, {
            status: 'update_available'
          });
        }
      }

      return {
        isCompatible: true,
        appCommitSha: DATA_COMMIT_SHA,
        appSchemaVersion: SUPPORTED_SCHEMA_VERSION,
        remoteSchemaVersion: manifest.SchemaVersion,
        remoteGeneratedAt: manifest.GeneratedAtUtc,
        hasUpdates: outdatedCount > 0,
        outdatedPackagesCount: outdatedCount
      };
    } catch (err: any) {
      return {
        isCompatible: true, // در حالت آفلاین مانع کار نمی‌شود
        appCommitSha: DATA_COMMIT_SHA,
        appSchemaVersion: SUPPORTED_SCHEMA_VERSION,
        errorMessage: `خطا در دریافت مانیفست: ${err.message}`,
        hasUpdates: false,
        outdatedPackagesCount: 0
      };
    }
  }

  /**
   * دریافت نسخه فعلی دیتابیس و بسته‌ها
   */
  async getInstalledInfo() {
    var packages = await db.packages.toArray();
    var poemCount = await db.poems.count();
    var poetCount = await db.poets.count();
    return {
      packages,
      poemCount,
      poetCount,
      appCommitSha: DATA_COMMIT_SHA,
      schemaVersion: SUPPORTED_SCHEMA_VERSION
    };
  }
}

export const dataVersionService = new DataVersionService();
