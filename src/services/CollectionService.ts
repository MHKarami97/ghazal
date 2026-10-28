import { db } from '../db/GhazalDB';
import type { UserCollection, UserCollectionItem } from '../types/user';

export class CollectionService {
  /**
   * دریافت همه مجموعه‌های کاربر
   */
  async getCollections(): Promise<UserCollection[]> {
    var list = await db.userCollections.toArray();
    if (list.length === 0) {
      // ساخت مجموعه پیش‌فرض «شعرهای محبوب من»
      var defaultCol: UserCollection = {
        title: 'شعرهای محبوب من',
        description: 'مجموعه ابیات و غزل‌های برگزیده و دلنشین',
        color: '#b87c2c',
        items: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      var id = await db.userCollections.add(defaultCol);
      defaultCol.id = id;
      return [defaultCol];
    }
    return list;
  }

  async getCollectionById(id: number): Promise<UserCollection | undefined> {
    return db.userCollections.get(id);
  }

  async createCollection(title: string, description?: string, color?: string): Promise<number> {
    var newCol: UserCollection = {
      title: title.trim(),
      description: description?.trim() || '',
      color: color || '#b87c2c',
      items: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    return db.userCollections.add(newCol);
  }

  async updateCollection(id: number, title: string, description?: string, color?: string): Promise<void> {
    await db.userCollections.update(id, {
      title: title.trim(),
      description: description?.trim() || '',
      color: color || '#b87c2c',
      updatedAt: new Date().toISOString()
    });
  }

  async deleteCollection(id: number): Promise<void> {
    await db.userCollections.delete(id);
  }

  async addItemToCollection(collectionId: number, item: UserCollectionItem): Promise<boolean> {
    var col = await db.userCollections.get(collectionId);
    if (!col) return false;

    // بررسی تکراری نبودن بیت در این مجموعه
    var exists = col.items.some(function (i) {
      return i.poemId === item.poemId && i.coupletIndex === item.coupletIndex;
    });
    if (exists) return false;

    col.items.push({
      ...item,
      addedAt: new Date().toISOString()
    });

    await db.userCollections.update(collectionId, {
      items: col.items,
      updatedAt: new Date().toISOString()
    });
    return true;
  }

  async removeItemFromCollection(collectionId: number, poemId: number, coupletIndex?: number): Promise<void> {
    var col = await db.userCollections.get(collectionId);
    if (!col) return;

    col.items = col.items.filter(function (i) {
      if (coupletIndex !== undefined) {
        return !(i.poemId === poemId && i.coupletIndex === coupletIndex);
      }
      return i.poemId !== poemId;
    });

    await db.userCollections.update(collectionId, {
      items: col.items,
      updatedAt: new Date().toISOString()
    });
  }

  /**
   * چاپ مستقیم یا خروجی PDF به وسیله مرورگر با قالب بندی آراسته
   */
  exportCollectionToPdf(collection: UserCollection): void {
    window.print();
  }
}

export const collectionService = new CollectionService();
