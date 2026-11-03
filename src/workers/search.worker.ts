// Web Worker for client-side full-text search in Persian poetry

function normalizePersianText(text: string): string {
  if (!text) return '';
  var res = text;
  res = res.replace(/[\u064B-\u065F\u0670]/g, '');
  res = res.replace(/\u0640/g, '');
  res = res.replace(/ي|ى/g, 'ی');
  res = res.replace(/ك/g, 'ک');
  res = res.replace(/ة/g, 'ه');
  res = res.replace(/ؤ/g, 'و');
  res = res.replace(/إ|أ|آ/g, 'ا');
  res = res.replace(/[\u200C\u200B]/g, ' ');
  res = res.replace(/[.,،؛:!؟?()\[\]{}«»"'\-_/\\`~^&*+=|]/g, '');
  res = res.replace(/\s+/g, ' ');
  return res.trim().toLowerCase();
}

interface SearchItem {
  key: string;
  id: number;
  poemId: number;
  poetId: number;
  poetName: string;
  poemTitle: string;
  fullUrl?: string;
  coupletIndex: number;
  verseText: string;
  rhythm?: string;
  rhyme?: string;
}

interface IndexedItem {
  item: SearchItem;
  normVerse: string;
  normTitle: string;
  normPoet: string;
}

var indexedItems = new Map<string, IndexedItem>();
var keysByPoem = new Map<number, string[]>();

function addItems(items: SearchItem[]): void {
  for (var i = 0; i < items.length; i++) {
    var item = items[i];
    if (!indexedItems.has(item.key)) {
      var keys = keysByPoem.get(item.poemId);
      if (keys) {
        keys.push(item.key);
      } else {
        keysByPoem.set(item.poemId, [item.key]);
      }
    }
    indexedItems.set(item.key, {
      item: item,
      normVerse: normalizePersianText(item.verseText),
      normTitle: normalizePersianText(item.poemTitle),
      normPoet: normalizePersianText(item.poetName)
    });
  }
}

function removePoems(poemIds: number[]): void {
  for (var i = 0; i < poemIds.length; i++) {
    var keys = keysByPoem.get(poemIds[i]);
    if (!keys) continue;
    for (var k = 0; k < keys.length; k++) {
      indexedItems.delete(keys[k]);
    }
    keysByPoem.delete(poemIds[i]);
  }
}

function search(data: any): void {
  var query = normalizePersianText(data.query || '');
  var poetId = data.poetId;
  var rhythm = data.rhythm;
  var rhyme = data.rhyme;
  var limit = data.limit || 50;
  var results: any[] = [];

  for (var entry of indexedItems.values()) {
    var item = entry.item;

    if (poetId && item.poetId !== poetId) continue;
    if (rhythm && item.rhythm && !item.rhythm.includes(rhythm)) continue;
    if (rhyme && item.rhyme && !item.rhyme.includes(rhyme)) continue;

    if (!query) {
      results.push(item);
    } else if (entry.normVerse.includes(query) || entry.normTitle.includes(query) || entry.normPoet.includes(query)) {
      results.push({ ...item, highlightQuery: query });
    }

    if (results.length >= limit) break;
  }

  self.postMessage({
    type: 'search_results',
    requestId: data.requestId,
    query: data.query,
    results: results,
    totalMatched: results.length
  });
}

self.onmessage = function (e: MessageEvent) {
  var data = e.data;

  if (data.action === 'index_batch') {
    addItems(data.items as SearchItem[]);
    self.postMessage({ type: 'indexed', count: indexedItems.size });
  } else if (data.action === 'remove_poems') {
    removePoems(data.poemIds as number[]);
    self.postMessage({ type: 'removed', count: indexedItems.size });
  } else if (data.action === 'clear') {
    indexedItems.clear();
    keysByPoem.clear();
    self.postMessage({ type: 'cleared' });
  } else if (data.action === 'search') {
    search(data);
  }
};
