import { db } from '../db/GhazalDB';
import { cdnClient } from './CDNClient';
import type { GanjoorCategory } from '../types/ganjoor';

/**
 * ابتدا دفتر ذخیره‌شده در IndexedDB (سریع و آفلاین)، و در نبود آن از CDN.
 * داده به یک commit مشخص قفل شده، پس نسخهٔ محلی از نظر محتوا معتبر است.
 */
export async function loadCategoryData(poetSlug: string, catPath?: string): Promise<GanjoorCategory> {
  var cleanPath = (catPath || '').replace(/^\/+|\/+$/g, '');
  var fullUrl = cleanPath ? `/${poetSlug}/${cleanPath}` : `/${poetSlug}`;

  var local = await db.categories.where('FullUrl').equals(fullUrl).first();
  if (local) return local;

  var remote = await cdnClient.getCategory(poetSlug, catPath);
  if (remote) {
    try {
      await db.categories.put(JSON.parse(JSON.stringify(remote)));
    } catch (e) {}
  }
  return remote;
}
