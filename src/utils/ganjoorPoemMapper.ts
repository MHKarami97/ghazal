import type { GanjoorPoem, GanjoorVerse } from '../types/ganjoor';

/**
 * پاک‌سازی نشانی کامل شعر گنجور به مسیر نسبی استاندارد (مثلاً `/hafez/ghazal/sh1`)
 */
export function normalizeGanjoorFullUrl(rawUrl: string): string {
  if (!rawUrl) return '';
  var stripped = String(rawUrl)
    .trim()
    .replace(/^https?:\/\/[^/]+/i, '')
    .replace(/^\/+|\/+$/g, '');
  return stripped ? `/${stripped}` : '';
}

function mapVersePosition(rawPos: unknown, vOrder: number): string {
  if (typeof rawPos === 'string' && rawPos.trim()) {
    return rawPos.trim();
  }
  if (rawPos === 0 || rawPos === 2) return 'Right';
  if (rawPos === 1 || rawPos === 3) return 'Left';
  if (rawPos === 4 || rawPos === 5) return 'Single';
  return vOrder % 2 === 1 ? 'Right' : 'Left';
}

/**
 * تبدیل پاسخ API رسمی گنجور (camelCase) به ساختار استاندارد `GanjoorPoem` اپلیکیشن
 */
export function mapApiPoemToGanjoorPoem(raw: any): GanjoorPoem | null {
  if (!raw) return null;

  var poemId = Number(raw.id || raw.Id || 0);
  if (!poemId) return null;

  var rawFullUrl = String(
    raw.fullUrl ||
    raw.FullUrl ||
    raw.urlSlug ||
    raw.url ||
    ''
  ).trim();

  if (!rawFullUrl && raw.category?.fullUrl && raw.urlSlug) {
    rawFullUrl = `${String(raw.category.fullUrl).replace(/\/+$/g, '')}/${String(raw.urlSlug).replace(/^\/+/g, '')}`;
  }

  var normalizedFullUrl = normalizeGanjoorFullUrl(rawFullUrl);
  var rawVerses = Array.isArray(raw.verses || raw.Verses) ? (raw.verses || raw.Verses) : [];

  var verses: GanjoorVerse[] = [];
  for (var i = 0; i < rawVerses.length; i++) {
    var rv = rawVerses[i];
    if (!rv) continue;
    var text = String(rv.text || rv.Text || '').trim();
    var vOrder = Number(rv.vOrder ?? rv.VOrder ?? rv.vorder ?? i + 1);
    var coupletIndex = typeof rv.coupletIndex === 'number'
      ? rv.coupletIndex
      : (typeof rv.CoupletIndex === 'number' ? rv.CoupletIndex : Math.floor(i / 2));

    verses.push({
      VOrder: vOrder,
      Position: mapVersePosition(rv.versePosition ?? rv.Position ?? rv.position, vOrder),
      Text: text,
      CoupletIndex: coupletIndex,
      CoupletSummary: rv.coupletSummary || rv.CoupletSummary || undefined
    });
  }

  var poetObj = raw.poet || raw.category?.poet || {};
  var poetId = Number(raw.poetId || raw.PoetId || poetObj.id || poetObj.Id || 0) || undefined;
  var catId = Number(raw.catId || raw.CatId || raw.category?.id || 0);
  var poetFullUrl = normalizeGanjoorFullUrl(String(poetObj.fullUrl || ''));
  var poetSlug = poetFullUrl ? poetFullUrl.replace(/^\//, '').split('/')[0] : undefined;

  if (!poetSlug && normalizedFullUrl) {
    var parts = normalizedFullUrl.replace(/^\//, '').split('/');
    if (parts.length > 0 && parts[0]) poetSlug = parts[0];
  }

  var metreObj = raw.ganjoorMetre || raw.metre || raw.Metre;
  var rhythm = '';
  if (typeof metreObj === 'string') {
    rhythm = metreObj;
  } else if (metreObj && (metreObj.rhythm || metreObj.Rhythm)) {
    rhythm = String(metreObj.rhythm || metreObj.Rhythm);
  } else if (raw.rhythm || raw.Rhythm) {
    rhythm = String(raw.rhythm || raw.Rhythm);
  }

  return {
    Id: poemId,
    CatId: catId,
    PoetId: poetId,
    PoetSlug: poetSlug,
    Title: String(raw.title || raw.Title || 'شعر'),
    FullTitle: String(raw.fullTitle || raw.FullTitle || raw.title || raw.Title || 'شعر'),
    FullUrl: normalizedFullUrl,
    RhymeLetters: raw.rhymeLetters || raw.RhymeLetters || undefined,
    SourceName: raw.sourceName || raw.SourceName || undefined,
    SourceUrlSlug: raw.sourceUrlSlug || raw.SourceUrlSlug || undefined,
    PoemSummary: raw.poemSummary || raw.PoemSummary || undefined,
    Rhythm: rhythm || undefined,
    Verses: verses
  };
}
