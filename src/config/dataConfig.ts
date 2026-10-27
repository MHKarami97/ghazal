export const DATA_COMMIT_SHA = '34f4ab3e463903f9399d7ca208b9333911389f94';
export const SUPPORTED_SCHEMA_VERSION = 4;

/**
 * تحلیل منبع CDN و سقف ۵۰ مگابایت:
 * ۱. در jsDelivr، درخواست‌های cdn.jsdelivr.net/gh/ کل ریپازیتوری را فشرده می‌کنند؛ به دلیل حجم بیش از ۳۰۰ مگابایتی ganjoor-data، با خطای 50MB Exceeded رد می‌شوند.
 * ۲. cdn.statically.io فایل‌ها را به صورت مستقیم و بدون سقف ۵۰ مگابایت از طریق شبکه لبه Cloudflare/Fastly با CORS باز و سرعت بالا تحویل می‌دهد.
 * ۳. raw.githubusercontent.com به عنوان لایه پشتیبان در دسترس است.
 */
export const PRIMARY_DATA_URL = `https://cdn.statically.io/gh/MHKarami97/ganjoor-data/${DATA_COMMIT_SHA}`;
export const FALLBACK_DATA_URL = `https://raw.githubusercontent.com/MHKarami97/ganjoor-data/${DATA_COMMIT_SHA}`;

export interface UrlBuilder {
  manifest(): string;
  poet(poetSlug: string): string;
  category(poetSlug: string, catPath?: string): string;
  poem(poetSlug: string, catPath: string, poemSlug: string): string;
  poemByFullUrl(fullUrl: string): string;
  locations(): string;
  people(): string;
  personRelations(): string;
  personAffiliations(): string;
  geotags(): string;
  literaryDevices(): string;
  literaryConcepts(): string;
  literarySources(): string;
  metres(): string;
  languages(): string;
  poetIdIndex(): string;
  poemIdIndexShard(bucket: number): string;
}

export const buildUrl: UrlBuilder = {
  manifest() {
    return `${PRIMARY_DATA_URL}/manifest.json`;
  },
  poet(poetSlug: string) {
    var cleanSlug = poetSlug.replace(/^\/+|\/+$/g, '');
    return `${PRIMARY_DATA_URL}/poets/${cleanSlug}/poet.json`;
  },
  category(poetSlug: string, catPath?: string | string[]) {
    var cleanSlug = String(poetSlug || '').replace(/^\/+|\/+$/g, '');
    var pathStr = Array.isArray(catPath) ? catPath.join('/') : String(catPath || '');
    if (!pathStr || pathStr === '' || pathStr === cleanSlug) {
      return `${PRIMARY_DATA_URL}/poets/${cleanSlug}/_cat.json`;
    }
    var cleanPath = pathStr.replace(/^\/+|\/+$/g, '');
    if (cleanPath.startsWith(cleanSlug + '/')) {
      cleanPath = cleanPath.slice(cleanSlug.length + 1);
    }
    return `${PRIMARY_DATA_URL}/poets/${cleanSlug}/${cleanPath}/_cat.json`;
  },
  poem(poetSlug: string, catPath: string | string[], poemSlug: string) {
    var cleanSlug = String(poetSlug || '').replace(/^\/+|\/+$/g, '');
    var catStr = Array.isArray(catPath) ? catPath.join('/') : String(catPath || '');
    var cleanCat = catStr.replace(/^\/+|\/+$/g, '');
    if (cleanCat.startsWith(cleanSlug + '/')) {
      cleanCat = cleanCat.slice(cleanSlug.length + 1);
    }
    var cleanPoem = String(poemSlug || '').replace(/^\/+|\/+$/g, '');
    return `${PRIMARY_DATA_URL}/poets/${cleanSlug}/${cleanCat}/${cleanPoem}.json`;
  },
  poemByFullUrl(fullUrl: string) {
    var path = fullUrl.replace(/^\/+|\/+$/g, '');
    return `${PRIMARY_DATA_URL}/poets/${path}.json`;
  },
  locations() {
    return `${PRIMARY_DATA_URL}/locations.json`;
  },
  people() {
    return `${PRIMARY_DATA_URL}/people.json`;
  },
  personRelations() {
    return `${PRIMARY_DATA_URL}/person-relations.json`;
  },
  personAffiliations() {
    return `${PRIMARY_DATA_URL}/person-affiliations.json`;
  },
  geotags() {
    return `${PRIMARY_DATA_URL}/geotags.json`;
  },
  literaryDevices() {
    return `${PRIMARY_DATA_URL}/literary-devices.json`;
  },
  literaryConcepts() {
    return `${PRIMARY_DATA_URL}/literary-concepts.json`;
  },
  literarySources() {
    return `${PRIMARY_DATA_URL}/literary-sources.json`;
  },
  metres() {
    return `${PRIMARY_DATA_URL}/metres.json`;
  },
  languages() {
    return `${PRIMARY_DATA_URL}/languages.json`;
  },
  poetIdIndex() {
    return `${PRIMARY_DATA_URL}/index/poets-by-id.json`;
  },
  poemIdIndexShard(bucket: number) {
    return `${PRIMARY_DATA_URL}/index/poems-by-id/${bucket}.json`;
  }
};
