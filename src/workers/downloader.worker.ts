// Web Worker for downloading Ganjoor poetry packages with concurrency control

interface DownloadTask {
  packageId: string;
  type: 'poet' | 'category' | 'base';
  slug: string;
  title: string;
  urls: string[];
  commitSha: string;
  schemaVersion: number;
}

var isPaused = false;
var isCancelled = false;
var activeDownloads = 0;
var concurrencyLimit = 3;

self.onmessage = async function (e: MessageEvent) {
  var data = e.data;
  var action = data.action;

  if (action === 'start') {
    isPaused = false;
    isCancelled = false;
    await processDownloads(data.task as DownloadTask);
  } else if (action === 'pause') {
    isPaused = true;
  } else if (action === 'resume') {
    isPaused = false;
  } else if (action === 'cancel') {
    isCancelled = true;
  }
};

async function processDownloads(task: DownloadTask) {
  var urls = task.urls;
  var total = urls.length;
  var completed = 0;
  var totalBytes = 0;
  var batchSize = 15;
  var batch: any[] = [];

  var index = 0;

  async function downloadNext(): Promise<void> {
    if (index >= total || isCancelled) return;
    if (isPaused) {
      await new Promise(function (resolve) {
        var interval = setInterval(function () {
          if (!isPaused || isCancelled) {
            clearInterval(interval);
            resolve(true);
          }
        }, 300);
      });
      if (isCancelled) return;
    }

    var currentIndex = index++;
    var url = urls[currentIndex];

    try {
      var res = await fetch(url);
      if (res.ok) {
        var json = await res.json();
        var bytes = JSON.stringify(json).length;
        totalBytes += bytes;
        completed++;
        batch.push(json);

        if (batch.length >= batchSize || completed === total) {
          self.postMessage({
            type: 'batch',
            packageId: task.packageId,
            items: [...batch],
            completed: completed,
            total: total,
            bytes: totalBytes
          });
          batch = [];
        }

        self.postMessage({
          type: 'progress',
          packageId: task.packageId,
          completed: completed,
          total: total,
          bytes: totalBytes
        });
      }
    } catch (err: any) {
      self.postMessage({
        type: 'item_error',
        packageId: task.packageId,
        url: url,
        error: err.message
      });
    }

    if (index < total && !isCancelled) {
      await downloadNext();
    }
  }

  var pool: Promise<void>[] = [];
  for (var i = 0; i < Math.min(concurrencyLimit, total); i++) {
    pool.push(downloadNext());
  }

  await Promise.all(pool);

  if (isCancelled) {
    self.postMessage({
      type: 'cancelled',
      packageId: task.packageId
    });
  } else {
    self.postMessage({
      type: 'completed',
      packageId: task.packageId,
      total: total,
      bytes: totalBytes
    });
  }
}
