import { spawn } from 'child_process';
import fs from 'fs';
import path from 'path';

var chromePath = 'C:/Program Files/Google/Chrome/Application/chrome.exe';
var cdpPort = 9222;
var previewPort = 4173;
var baseUrl = 'http://127.0.0.1:' + previewPort;

var screens = [
  { id: '01-home', path: '/', name: 'صفحه اصلی و شعر امروز' },
  { id: '02-poets', path: '/poets', name: 'فهرست دیوان‌ها و شاعران' },
  { id: '03-poet-detail', path: '/poet/hafez', name: 'دیوان حافظ و بخش‌ها' },
  { id: '04-faal', path: '/faal', name: 'فال حافظ و تعبیر' },
  { id: '05-memorize', path: '/memorize', name: 'حفظ شعر لایتنر SM-2' },
  { id: '06-daily-challenge', path: '/memorize/daily-challenge', name: 'چالش و مسابقه روزانه' },
  { id: '07-metres', path: '/metres', name: 'اوزان عروضی و موسیقی شعر' },
  { id: '08-dialects', path: '/dialects', name: 'شعر در گویش‌های کهن' },
  { id: '09-collections', path: '/collections', name: 'مجموعه‌های شخصی و خروجی PDF' },
  { id: '10-compare', path: '/compare', name: 'میز مقایسه دو شاعر' },
  { id: '11-explore', path: '/explore', name: 'نقشه دیارها و خط زمان' },
  { id: '12-search', path: '/search', name: 'جستجوی تمام‌متن محلی' },
  { id: '13-settings', path: '/settings', name: 'تنظیمات و درباره' }
];

function sleep(ms) {
  return new Promise(function (resolve) {
    setTimeout(resolve, ms);
  });
}

// Simple CDP client over native WebSocket
function createCdpClient(wsUrl) {
  return new Promise(function (resolve, reject) {
    var ws = new WebSocket(wsUrl);
    var messageId = 0;
    var pendingCallbacks = new Map();

    ws.onopen = function () {
      resolve({
        send: function (method, params) {
          messageId++;
          var id = messageId;
          return new Promise(function (res, rej) {
            pendingCallbacks.set(id, { resolve: res, reject: rej });
            ws.send(JSON.stringify({ id: id, method: method, params: params || {} }));
          });
        },
        close: function () {
          ws.close();
        }
      });
    };

    ws.onmessage = function (event) {
      try {
        var msg = JSON.parse(event.data);
        if (msg.id && pendingCallbacks.has(msg.id)) {
          var cb = pendingCallbacks.get(msg.id);
          pendingCallbacks.delete(msg.id);
          if (msg.error) {
            cb.reject(new Error(msg.error.message));
          } else {
            cb.resolve(msg.result);
          }
        }
      } catch (err) {
        console.error('Error handling message:', err);
      }
    };

    ws.onerror = function (err) {
      reject(err);
    };
  });
}

async function main() {
  console.log('1. Checking preview server...');
  var previewProc = null;
  try {
    var checkRes = await fetch(baseUrl);
    if (!checkRes.ok) throw new Error('Not ok');
    console.log('Preview server already running.');
  } catch (e) {
    console.log('Starting preview server on port ' + previewPort + '...');
    previewProc = spawn('cmd.exe', ['/c', 'npx vite preview --port ' + previewPort], {
      cwd: 'D:/Local/ghazal',
      stdio: 'ignore'
    });
    // Wait for server to be ready
    var ready = false;
    for (var i = 0; i < 20; i++) {
      await sleep(500);
      try {
        var res = await fetch(baseUrl);
        if (res.ok) {
          ready = true;
          break;
        }
      } catch (err) {}
    }
    if (!ready) {
      throw new Error('Preview server did not start in time.');
    }
    console.log('Preview server is up!');
  }

  console.log('2. Starting Chrome headless with remote debugging port ' + cdpPort + '...');
  var chromeProc = spawn(
    chromePath,
    [
      '--headless=new',
      '--remote-debugging-port=' + cdpPort,
      '--hide-scrollbars',
      '--disable-gpu',
      '--no-first-run',
      '--no-default-browser-check',
      'about:blank'
    ],
    { stdio: 'ignore' }
  );

  // Wait for Chrome CDP endpoint
  var wsDebuggerUrl = '';
  for (var attempt = 0; attempt < 30; attempt++) {
    await sleep(400);
    try {
      var verRes = await fetch('http://127.0.0.1:' + cdpPort + '/json/version');
      if (verRes.ok) {
        var verData = await verRes.json();
        wsDebuggerUrl = verData.webSocketDebuggerUrl;
        break;
      }
    } catch (err) {}
  }

  if (!wsDebuggerUrl) {
    chromeProc.kill();
    if (previewProc) previewProc.kill();
    throw new Error('Failed to connect to Chrome CDP.');
  }

  console.log('Connected to Chrome WebSocket:', wsDebuggerUrl);
  var cdp = await createCdpClient(wsDebuggerUrl);

  // Create target page
  var targetInfo = await cdp.send('Target.createTarget', { url: 'about:blank' });
  var pageWsUrl = 'ws://127.0.0.1:' + cdpPort + '/devtools/page/' + targetInfo.targetId;
  var pageCdp = await createCdpClient(pageWsUrl);

  await pageCdp.send('Page.enable');
  await pageCdp.send('DOM.enable');
  await pageCdp.send('Runtime.enable');

  var outputBaseDir = 'D:/Local/ghazal/public/share/screenshots';
  fs.mkdirSync(path.join(outputBaseDir, 'light'), { recursive: true });
  fs.mkdirSync(path.join(outputBaseDir, 'dark'), { recursive: true });

  var themes = ['light', 'dark'];
  var devices = [
    {
      type: 'mobile',
      width: 390,
      height: 844,
      scale: 2,
      mobile: true,
      ua: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1'
    },
    {
      type: 'desktop',
      width: 1440,
      height: 900,
      scale: 1,
      mobile: false,
      ua: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
    }
  ];

  for (var t = 0; t < themes.length; t++) {
    var theme = themes[t];
    console.log('\n==========================================');
    console.log('  Capturing in ' + theme.toUpperCase() + ' mode...');
    console.log('==========================================\n');

    for (var d = 0; d < devices.length; d++) {
      var dev = devices[d];
      console.log('Configuring device: ' + dev.type + ' (' + dev.width + 'x' + dev.height + ')');

      // Set Device Metrics
      await pageCdp.send('Emulation.setDeviceMetricsOverride', {
        width: dev.width,
        height: dev.height,
        deviceScaleFactor: dev.scale,
        mobile: dev.mobile,
        screenOrientation: dev.mobile ? { angle: 0, type: 'portraitPrimary' } : { angle: 0, type: 'landscapePrimary' }
      });

      // Set User Agent
      await pageCdp.send('Emulation.setUserAgentOverride', {
        userAgent: dev.ua
      });

      // Set Touch Emulation
      await pageCdp.send('Emulation.setTouchEmulationEnabled', {
        enabled: dev.mobile
      });

      // Set Color Scheme
      await pageCdp.send('Emulation.setEmulatedMedia', {
        media: 'screen',
        features: [{ name: 'prefers-color-scheme', value: theme }]
      });

      for (var s = 0; s < screens.length; s++) {
        var screen = screens[s];
        var fullUrl = baseUrl + screen.path + (screen.path.includes('?') ? '&' : '?') + 'theme=' + theme;
        console.log('  -> [' + theme + '][' + dev.type + '] ' + screen.id + ': ' + fullUrl);

        await pageCdp.send('Page.navigate', { url: fullUrl });

        // Wait for page load and Vue SPA hydration
        await sleep(1500);

        // Force theme class in DOM directly to be 100% sure
        await pageCdp.send('Runtime.evaluate', {
          expression: `
            localStorage.setItem('ghazal-theme', '${theme}');
            if ('${theme}' === 'dark') {
              document.documentElement.classList.add('dark');
            } else {
              document.documentElement.classList.remove('dark');
            }
          `
        });

        // Extra short wait for theme transitions to settle
        await sleep(400);

        // Capture screenshot
        var shot = await pageCdp.send('Page.captureScreenshot', {
          format: 'png',
          clip: {
            x: 0,
            y: 0,
            width: dev.width,
            height: dev.height,
            scale: 1
          }
        });

        var buffer = Buffer.from(shot.data, 'base64');

        // 1. Save into specific theme folder: e.g. public/share/screenshots/light/mobile-01-home.png
        var themeFilename = dev.type + '-' + screen.id + '.png';
        var themeFilePath = path.join(outputBaseDir, theme, themeFilename);
        fs.writeFileSync(themeFilePath, buffer);

        // 2. Also save to root public/share/screenshots/ (for backward compatibility)
        // If theme is dark or light, we save to root as well
        if (theme === 'dark') {
          var rootFilePath = path.join(outputBaseDir, themeFilename);
          fs.writeFileSync(rootFilePath, buffer);
        }

        console.log('     Saved: ' + themeFilePath + ' (' + Math.round(buffer.length / 1024) + ' KB)');
      }
    }
  }

  console.log('\nCleaning up processes...');
  pageCdp.close();
  cdp.close();
  chromeProc.kill();
  if (previewProc) previewProc.kill();
  console.log('All screenshots captured successfully in both Light and Dark modes!');
}

main().catch(function (err) {
  console.error('Fatal error during capture:', err);
  process.exit(1);
});
