import { buildUrl, PRIMARY_DATA_URL, FALLBACK_DATA_URL } from '../config/dataConfig';
import type {
  GanjoorManifest,
  GanjoorPoet,
  GanjoorCategory,
  GanjoorPoem,
  GanjoorLocation,
  GanjoorPerson,
  GanjoorPersonRelation,
  GanjoorPersonAffiliation,
  GanjoorLiteraryDevice,
  GanjoorLiterarySource,
  GanjoorMetre
} from '../types/ganjoor';

export class CDNClient {
  private cache: Map<string, any> = new Map();

  async fetchWithRetry<T>(url: string, retries = 3, delay = 600): Promise<T> {
    if (this.cache.has(url)) {
      return this.cache.get(url) as T;
    }

    var lastError: any = null;
    var urlsToTry = [url];

    if (url.startsWith(PRIMARY_DATA_URL)) {
      urlsToTry.push(url.replace(PRIMARY_DATA_URL, FALLBACK_DATA_URL));
    }

    for (var u = 0; u < urlsToTry.length; u++) {
      var currentUrl = urlsToTry[u];

      for (var attempt = 0; attempt < retries; attempt++) {
        try {
          var response = await fetch(currentUrl, {
            headers: {
              'Accept': 'application/json'
            }
          });

          if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
          }

          var data = await response.json();
          this.cache.set(url, data);
          return data as T;
        } catch (err: any) {
          lastError = err;
          if (attempt < retries - 1) {
            await new Promise(function (resolve) {
              setTimeout(resolve, delay * Math.pow(1.8, attempt));
            });
          }
        }
      }
    }

    throw new Error(`دریافت داده از منبع ناموفق بود: ${lastError?.message || 'خطای شبکه'}`);
  }

  async getManifest(): Promise<GanjoorManifest> {
    return this.fetchWithRetry<GanjoorManifest>(buildUrl.manifest());
  }

  async getPoet(poetSlug: string): Promise<GanjoorPoet> {
    return this.fetchWithRetry<GanjoorPoet>(buildUrl.poet(poetSlug));
  }

  async getCategory(poetSlug: string, catPath?: string): Promise<GanjoorCategory> {
    return this.fetchWithRetry<GanjoorCategory>(buildUrl.category(poetSlug, catPath));
  }

  async getPoem(poetSlug: string, catPath: string, poemSlug: string): Promise<GanjoorPoem> {
    return this.fetchWithRetry<GanjoorPoem>(buildUrl.poem(poetSlug, catPath, poemSlug));
  }

  async getPoemByFullUrl(fullUrl: string): Promise<GanjoorPoem> {
    return this.fetchWithRetry<GanjoorPoem>(buildUrl.poemByFullUrl(fullUrl));
  }

  async getLocations(): Promise<GanjoorLocation[]> {
    return this.fetchWithRetry<GanjoorLocation[]>(buildUrl.locations());
  }

  async getPeople(): Promise<GanjoorPerson[]> {
    return this.fetchWithRetry<GanjoorPerson[]>(buildUrl.people());
  }

  async getPersonRelations(): Promise<GanjoorPersonRelation[]> {
    return this.fetchWithRetry<GanjoorPersonRelation[]>(buildUrl.personRelations());
  }

  async getPersonAffiliations(): Promise<GanjoorPersonAffiliation[]> {
    return this.fetchWithRetry<GanjoorPersonAffiliation[]>(buildUrl.personAffiliations());
  }

  async getLiteraryDevices(): Promise<GanjoorLiteraryDevice[]> {
    return this.fetchWithRetry<GanjoorLiteraryDevice[]>(buildUrl.literaryDevices());
  }

  async getLiterarySources(): Promise<GanjoorLiterarySource[]> {
    return this.fetchWithRetry<GanjoorLiterarySource[]>(buildUrl.literarySources());
  }

  async getMetres(): Promise<GanjoorMetre[]> {
    return this.fetchWithRetry<GanjoorMetre[]>(buildUrl.metres());
  }
}

export const cdnClient = new CDNClient();
