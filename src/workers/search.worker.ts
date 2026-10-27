// Web Worker for client-side full-text search in Persian poetry

function normalizePersianText(text: string): string {
  if (!text) return '';
  var res = text;
  // Diacritics
  res = res.replace(/[\u064B-\u065F\u0670]/g, '');
  // Kashida
  res = res.replace(/\u0640/g, '');
  // Arabic chars to Persian
  res = res.replace(/ي|ى/g, 'ی');
  res = res.replace(/ك/g, 'ک');
  res = res.replace(/ة/g, 'ه');
  res = res.replace(/ؤ/g, 'و');
  res = res.replace(/إ|أ|آ/g, 'ا');
  // ZWNJ and multiple spaces
  res = res.replace(/[\u200C\u200B]/g, ' ');
  res = res.replace(/[.,،؛:!؟?()\[\]{}«»"'\-_/\\`~^&*+=|]/g, '');
  res = res.replace(/\s+/g, ' ');
  return res.trim().toLowerCase();
}

interface SearchItem {
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

var indexedItems: SearchItem[] = [];

self.onmessage = function (e: MessageEvent) {
  var data = e.data;
  var action = data.action;

  if (action === 'index_batch') {
    var items = data.items as SearchItem[];
    for (var i = 0; i < items.length; i++) {
      indexedItems.push(items[i]);
    }
    self.postMessage({ type: 'indexed', count: indexedItems.length });
  } else if (action === 'clear') {
    indexedItems = [];
    self.postMessage({ type: 'cleared' });
  } else if (action === 'search') {
    var query = normalizePersianText(data.query || '');
    var poetId = data.poetId;
    var rhythm = data.rhythm;
    var rhyme = data.rhyme;
    var limit = data.limit || 50;

    var results: any[] = [];

    for (var j = 0; j < indexedItems.length; j++) {
      var item = indexedItems[j];

      if (poetId && item.poetId !== poetId) continue;
      if (rhythm && item.rhythm && !item.rhythm.includes(rhythm)) continue;
      if (rhyme && item.rhyme && !item.rhyme.includes(rhyme)) continue;

      if (!query) {
        results.push(item);
      } else {
        var normVerse = normalizePersianText(item.verseText);
        var normTitle = normalizePersianText(item.poemTitle);
        var normPoet = normalizePersianText(item.poetName);

        if (normVerse.includes(query) || normTitle.includes(query) || normPoet.includes(query)) {
          results.push({
            ...item,
            highlightQuery: query
          });
        }
      }

      if (results.length >= limit) break;
    }

    self.postMessage({
      type: 'search_results',
      query: data.query,
      results: results,
      totalMatched: results.length
    });
  }
};
