import { PRIMARY_DATA_URL, FALLBACK_DATA_URL } from '../config/dataConfig';

interface DownloadTask {
  packageId: string;
  urls: string[];
  alreadyCompleted: number;
  alreadyBytes: number;
}

interface TaskState {
  paused: boolean;
  cancelled: boolean;
  wake: (() => void) | null;
}

var CONCURRENCY = 4;
var BATCH_SIZE = 15;
var MAX_ATTEMPTS = 3;
var PROGRESS_INTERVAL_MS = 120;

var tasks = new Map<string, TaskState>();

self.onmessage = function (e: MessageEvent) {
  var data = e.data;
  var state = tasks.get(data.packageId);

  if (data.action === 'start') {
    void runTask(data.task as DownloadTask);
  } else if (data.action === 'pause' && state) {
    state.paused = true;
  } else if (data.action === 'resume' && state) {
    state.paused = false;
    wake(state);
  } else if (data.action === 'cancel' && state) {
    state.cancelled = true;
    wake(state);
  }
};

function wake(state: TaskState): void {
  if (state.wake) {
    state.wake();
    state.wake = null;
  }
}

async function waitWhilePaused(state: TaskState): Promise<void> {
  while (state.paused && !state.cancelled) {
    await new Promise<void>(function (resolve) {
      state.wake = resolve;
    });
  }
}

function sleep(ms: number): Promise<void> {
  return new Promise(function (resolve) {
    setTimeout(resolve, ms);
  });
}

async function fetchPoemText(url: string): Promise<string | null> {
  var candidates = [url];
  if (url.startsWith(PRIMARY_DATA_URL)) {
    candidates.push(url.replace(PRIMARY_DATA_URL, FALLBACK_DATA_URL));
  }

  for (var c = 0; c < candidates.length; c++) {
    for (var attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
      try {
        var res = await fetch(candidates[c]);
        if (res.ok) {
          return await res.text();
        }
        if (res.status === 404) {
          break;
        }
      } catch (err) {
        // شبکه قطع است؛ تلاش مجدد با تاخیر افزایشی
      }
      await sleep(400 * Math.pow(2, attempt));
    }
  }
  return null;
}

async function runTask(task: DownloadTask): Promise<void> {
  var state: TaskState = { paused: false, cancelled: false, wake: null };
  tasks.set(task.packageId, state);

  var total = task.alreadyCompleted + task.urls.length;
  var completed = task.alreadyCompleted;
  var failed = 0;
  var totalBytes = task.alreadyBytes;
  var cursor = 0;
  var batch: any[] = [];
  var lastProgressAt = 0;

  function postProgress(force: boolean): void {
    var now = Date.now();
    if (!force && now - lastProgressAt < PROGRESS_INTERVAL_MS) return;
    lastProgressAt = now;
    self.postMessage({
      type: 'progress',
      packageId: task.packageId,
      completed: completed,
      failed: failed,
      total: total,
      bytes: totalBytes
    });
  }

  function flushBatch(): void {
    if (batch.length === 0) return;
    self.postMessage({
      type: 'batch',
      packageId: task.packageId,
      items: batch,
      completed: completed,
      total: total,
      bytes: totalBytes
    });
    batch = [];
  }

  async function lane(): Promise<void> {
    while (true) {
      await waitWhilePaused(state);
      if (state.cancelled) return;

      var index = cursor++;
      if (index >= task.urls.length) return;

      var text = await fetchPoemText(task.urls[index]);
      if (text === null) {
        failed++;
      } else {
        try {
          batch.push(JSON.parse(text));
          totalBytes += text.length;
          completed++;
        } catch (err) {
          failed++;
        }
      }

      if (batch.length >= BATCH_SIZE) flushBatch();
      postProgress(false);
    }
  }

  var laneCount = Math.min(CONCURRENCY, task.urls.length);
  var lanes: Promise<void>[] = [];
  for (var i = 0; i < laneCount; i++) {
    lanes.push(lane());
  }
  await Promise.all(lanes);

  tasks.delete(task.packageId);

  if (state.cancelled) {
    self.postMessage({ type: 'cancelled', packageId: task.packageId });
    return;
  }

  flushBatch();
  postProgress(true);
  self.postMessage({
    type: 'completed',
    packageId: task.packageId,
    total: total,
    completed: completed,
    failed: failed,
    bytes: totalBytes
  });
}
