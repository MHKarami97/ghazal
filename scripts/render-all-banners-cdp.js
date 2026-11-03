import fs from 'fs';
import path from 'path';
import { spawn } from 'child_process';

var cdpPort = 9223;
var chromePath = 'C:/Program Files/Google/Chrome/Application/chrome.exe';
var bannersBaseDir = 'D:/Local/ghazal/public/share/banners';
var screenshotsBaseDir = 'D:/Local/ghazal/public/share/screenshots';

var iconPath = 'D:/Local/ghazal/public/icons/icon-512.png';
var iconBase64 = '';
if (fs.existsSync(iconPath)) {
  iconBase64 = 'data:image/png;base64,' + fs.readFileSync(iconPath).toString('base64');
}

function getScreenshotBase64(theme, filename) {
  var p = path.join(screenshotsBaseDir, theme, filename);
  if (!fs.existsSync(p)) {
    p = path.join(screenshotsBaseDir, filename);
  }
  if (fs.existsSync(p)) {
    return 'data:image/png;base64,' + fs.readFileSync(p).toString('base64');
  }
  return '';
}

function sleep(ms) {
  return new Promise(function (resolve) {
    setTimeout(resolve, ms);
  });
}

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

function generateSocialBanner(theme) {
  var isDark = theme === 'dark';
  var bg = isDark
    ? 'linear-gradient(135deg, #1c140e 0%, #451a03 40%, #78350f 100%)'
    : 'linear-gradient(135deg, #fff7ed 0%, #ffedd5 40%, #fed7aa 100%)';
  var titleColor = isDark
    ? 'linear-gradient(135deg, #ffffff 0%, #ffedd5 100%)'
    : 'linear-gradient(135deg, #7c2d12 0%, #431407 100%)';
  var textColor = isDark ? '#cbd5e1' : '#451a03';
  var badgeBg = isDark ? 'rgba(255, 255, 255, 0.12)' : 'rgba(255, 255, 255, 0.85)';
  var badgeBorder = isDark ? 'rgba(255, 255, 255, 0.25)' : 'rgba(234, 88, 12, 0.35)';
  var badgeText = isDark ? '#fed7aa' : '#9a3412';
  var pillBg = isDark ? 'rgba(0, 0, 0, 0.35)' : '#ffffff';
  var pillBorder = isDark ? 'rgba(251, 146, 60, 0.4)' : '#fb923c';
  var pillText = isDark ? '#fed7aa' : '#7c2d12';
  var phoneBorder = isDark ? '#334155' : '#cbd5e1';

  var mobHome = getScreenshotBase64(theme, 'mobile-01-home.png');
  var mobPoet = getScreenshotBase64(theme, 'mobile-03-poet-detail.png');

  return `<!DOCTYPE html>
<html lang="fa" dir="rtl">
<head>
<meta charset="UTF-8">
<style>
  @font-face {
    font-family: 'Vazirmatn';
    src: url('../../fonts/Vazirmatn-Regular.woff2') format('woff2');
    font-weight: 400;
  }
  @font-face {
    font-family: 'Vazirmatn';
    src: url('../../fonts/Vazirmatn-Bold.woff2') format('woff2');
    font-weight: 700;
  }
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body {
    width: 1200px;
    height: 630px;
    background: ${bg};
    font-family: 'Vazirmatn', Tahoma, sans-serif;
    color: ${isDark ? '#fff' : '#1c140e'};
    overflow: hidden;
    position: relative;
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0 70px;
  }
  .content { max-width: 580px; z-index: 2; }
  .badge {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    background: ${badgeBg};
    border: 1px solid ${badgeBorder};
    padding: 8px 18px;
    border-radius: 100px;
    font-size: 15px;
    font-weight: 700;
    color: ${badgeText};
    margin-bottom: 24px;
    backdrop-filter: blur(10px);
  }
  h1 {
    font-size: 46px;
    font-weight: 800;
    line-height: 1.25;
    margin-bottom: 16px;
    background: ${titleColor};
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
  }
  p {
    font-size: 18px;
    line-height: 1.7;
    color: ${textColor};
    margin-bottom: 28px;
  }
  .features-list { display: flex; flex-wrap: wrap; gap: 12px; margin-bottom: 30px; }
  .pill {
    background: ${pillBg};
    border: 1px solid ${pillBorder};
    padding: 6px 14px;
    border-radius: 12px;
    font-size: 14px;
    color: ${pillText};
    font-weight: 700;
    box-shadow: 0 4px 12px rgba(0,0,0,0.06);
  }
  .urls {
    display: flex;
    align-items: center;
    gap: 20px;
    font-size: 15px;
    color: ${isDark ? '#94a3b8' : '#78350f'};
  }
  .urls b { color: ${isDark ? '#fff' : '#431407'}; }
  .mockups {
    position: relative;
    width: 480px;
    height: 520px;
    z-index: 2;
  }
  .phone-frame {
    position: absolute;
    width: 250px;
    height: 500px;
    background: #000;
    border-radius: 36px;
    border: 4px solid ${phoneBorder};
    box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.45);
    overflow: hidden;
    left: 20px;
    top: 10px;
    transform: rotate(-4deg);
  }
  .phone-frame img { width: 100%; height: 100%; object-fit: cover; }
  .phone-frame-2 {
    position: absolute;
    width: 230px;
    height: 460px;
    background: #000;
    border-radius: 32px;
    border: 4px solid ${phoneBorder};
    box-shadow: 0 20px 40px -12px rgba(0, 0, 0, 0.4);
    overflow: hidden;
    right: 10px;
    bottom: 10px;
    transform: rotate(6deg);
  }
  .phone-frame-2 img { width: 100%; height: 100%; object-fit: cover; }
</style>
</head>
<body>
<div class="content">
  <div class="badge">
    <img src="${iconBase64}" width="20" height="20" style="border-radius:5px;" />
    گنجینه نوین شعر و ادب فارسی
  </div>
  <h1>غزل؛ دیوان هوشمند، زیبا و تماماً آفلاین</h1>
  <p>دیوان جامع شعرای پارسی، فال حافظ، وزن و موسیقی شعر، نقشه جغرافیایی شعر، حفظ مرحله‌ای با الگوریتم SM-2 و کاوش در گویش‌های کهن ایران.</p>
  <div class="features-list">
    <div class="pill">✓ ۱۰۰٪ بدون نیاز به اینترنت</div>
    <div class="pill">✓ تفأل روزانه حافظ</div>
    <div class="pill">✓ اوزان شاهنامه و دوبیتی</div>
    <div class="pill">✓ چالش و بازی‌های ادبی</div>
  </div>
  <div class="urls">
    <span>وب‌اپ: <b>ghazal.mhkarami97.ir</b></span>
    <span>•</span>
    <span>کافه بازار: <b>mhk.ghazal</b></span>
  </div>
</div>
<div class="mockups">
  <div class="phone-frame"><img src="${mobHome}" /></div>
  <div class="phone-frame-2"><img src="${mobPoet}" /></div>
</div>
</body>
</html>`;
}

function generateSquarePoster(theme) {
  var isDark = theme === 'dark';
  var bg = isDark
    ? 'radial-gradient(circle at 50% 20%, #451a03 0%, #1c140e 70%, #0c0a09 100%)'
    : 'radial-gradient(circle at 50% 20%, #ffedd5 0%, #fff7ed 60%, #fed7aa 100%)';
  var h1Color = isDark ? '#ffffff' : '#431407';
  var h2Color = isDark ? '#fb923c' : '#c2410c';
  var featBg = isDark ? 'rgba(255, 255, 255, 0.08)' : '#ffffff';
  var featBorder = isDark ? 'rgba(255, 255, 255, 0.15)' : '#fdba74';
  var featText = isDark ? '#fed7aa' : '#7c2d12';
  var footerColor = isDark ? '#94a3b8' : '#78350f';
  var footerSpan = isDark ? '#fff' : '#431407';
  var phoneBorder = isDark ? '#334155' : '#cbd5e1';

  var mobHome = getScreenshotBase64(theme, 'mobile-01-home.png');
  var mobPoet = getScreenshotBase64(theme, 'mobile-03-poet-detail.png');
  var mobFaal = getScreenshotBase64(theme, 'mobile-04-faal.png');

  return `<!DOCTYPE html>
<html lang="fa" dir="rtl">
<head>
<meta charset="UTF-8">
<style>
  @font-face {
    font-family: 'Vazirmatn';
    src: url('../../fonts/Vazirmatn-Regular.woff2') format('woff2');
    font-weight: 400;
  }
  @font-face {
    font-family: 'Vazirmatn';
    src: url('../../fonts/Vazirmatn-Bold.woff2') format('woff2');
    font-weight: 700;
  }
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body {
    width: 1080px;
    height: 1080px;
    background: ${bg};
    font-family: 'Vazirmatn', Tahoma, sans-serif;
    color: ${isDark ? '#fff' : '#1c140e'};
    overflow: hidden;
    position: relative;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: space-between;
    padding: 60px 50px 40px;
    text-align: center;
  }
  .app-icon {
    width: 100px;
    height: 100px;
    border-radius: 24px;
    box-shadow: 0 15px 35px rgba(234, 88, 12, 0.3);
    margin-bottom: 20px;
  }
  h1 {
    font-size: 50px;
    font-weight: 800;
    line-height: 1.25;
    margin-bottom: 14px;
    color: ${h1Color};
  }
  h2 {
    font-size: 24px;
    color: ${h2Color};
    font-weight: 700;
    margin-bottom: 30px;
  }
  .mockups-row {
    display: flex;
    gap: 30px;
    justify-content: center;
    align-items: flex-end;
    width: 100%;
    margin-bottom: 40px;
  }
  .phone-card {
    width: 280px;
    height: 520px;
    background: #000;
    border-radius: 36px;
    border: 5px solid ${phoneBorder};
    box-shadow: 0 25px 50px rgba(0, 0, 0, 0.4);
    overflow: hidden;
  }
  .phone-card img { width: 100%; height: 100%; object-fit: cover; }
  .features-grid {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 16px;
    max-width: 900px;
    width: 100%;
    margin-bottom: 30px;
  }
  .feat-item {
    background: ${featBg};
    border: 1px solid ${featBorder};
    padding: 12px;
    border-radius: 16px;
    font-size: 16px;
    font-weight: 700;
    color: ${featText};
    box-shadow: 0 4px 12px rgba(0,0,0,0.05);
  }
  .footer-links { font-size: 18px; color: ${footerColor}; }
  .footer-links span { color: ${footerSpan}; font-weight: 700; }
</style>
</head>
<body>
  <div>
    <img src="${iconBase64}" class="app-icon" />
    <h1>غزل | گنجینه هوشمند شعر و ادب فارسی</h1>
    <h2>همراه همیشگی اهل شعر و ادب — ۱۰۰٪ آفلاین و رایگان</h2>
  </div>

  <div class="mockups-row">
    <div class="phone-card" style="transform: rotate(-3deg);"><img src="${mobHome}" /></div>
    <div class="phone-card" style="transform: scale(1.05); z-index: 2;"><img src="${mobPoet}" /></div>
    <div class="phone-card" style="transform: rotate(3deg);"><img src="${mobFaal}" /></div>
  </div>

  <div class="features-grid">
    <div class="feat-item">📜 دیوان ده‌ها شاعر بزرگ</div>
    <div class="feat-item">🔮 فال حافظ و تعبیر</div>
    <div class="feat-item">🎵 وزن، عروض و قافیه</div>
    <div class="feat-item">🗺️ نقشه دیارها و خط زمان</div>
    <div class="feat-item">🧠 حفظ شعر با تکرار SM-2</div>
    <div class="feat-item">🗣️ شعر در گویش‌های کهن</div>
  </div>

  <div class="footer-links">
    دریافت از کافه بازار: <span>cafebazaar.ir/app/mhk.ghazal</span> &nbsp;|&nbsp; وب‌اپلیکیشن: <span>ghazal.mhkarami97.ir</span>
  </div>
</body>
</html>`;
}

function generateStoryBanner(theme) {
  var isDark = theme === 'dark';
  var bg = isDark
    ? 'linear-gradient(180deg, #1c140e 0%, #451a03 30%, #172554 80%, #0f172a 100%)'
    : 'linear-gradient(180deg, #fff7ed 0%, #ffedd5 30%, #fed7aa 70%, #fdba74 100%)';
  var h1Color = isDark ? '#ffffff' : '#431407';
  var tagColor = isDark ? '#fed7aa' : '#9a3412';
  var boxBg = isDark ? 'rgba(0, 0, 0, 0.45)' : 'rgba(255, 255, 255, 0.85)';
  var boxBorder = isDark ? 'rgba(255, 255, 255, 0.15)' : '#fdba74';
  var bulletColor = isDark ? '#f8fafc' : '#431407';
  var phoneBorder = isDark ? '#334155' : '#cbd5e1';

  var mobHome = getScreenshotBase64(theme, 'mobile-01-home.png');
  var mobPoet = getScreenshotBase64(theme, 'mobile-03-poet-detail.png');

  return `<!DOCTYPE html>
<html lang="fa" dir="rtl">
<head>
<meta charset="UTF-8">
<style>
  @font-face {
    font-family: 'Vazirmatn';
    src: url('../../fonts/Vazirmatn-Regular.woff2') format('woff2');
    font-weight: 400;
  }
  @font-face {
    font-family: 'Vazirmatn';
    src: url('../../fonts/Vazirmatn-Bold.woff2') format('woff2');
    font-weight: 700;
  }
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body {
    width: 1080px;
    height: 1920px;
    background: ${bg};
    font-family: 'Vazirmatn', Tahoma, sans-serif;
    color: ${isDark ? '#fff' : '#1c140e'};
    overflow: hidden;
    position: relative;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: space-between;
    padding: 100px 60px 80px;
    text-align: center;
  }
  .app-icon {
    width: 130px;
    height: 130px;
    border-radius: 32px;
    box-shadow: 0 20px 40px rgba(0,0,0,0.3);
    margin-bottom: 28px;
  }
  h1 {
    font-size: 64px;
    font-weight: 800;
    line-height: 1.25;
    margin-bottom: 20px;
    color: ${h1Color};
  }
  .tagline {
    font-size: 32px;
    color: ${tagColor};
    font-weight: 700;
    margin-bottom: 50px;
  }
  .mockups-wrapper {
    position: relative;
    width: 100%;
    height: 800px;
    display: flex;
    justify-content: center;
    align-items: center;
  }
  .phone-card-story {
    position: absolute;
    width: 420px;
    height: 780px;
    background: #000;
    border-radius: 48px;
    border: 7px solid ${phoneBorder};
    box-shadow: 0 35px 70px rgba(0,0,0,0.4);
    overflow: hidden;
  }
  .phone-card-story img { width: 100%; height: 100%; object-fit: cover; }
  .bullets-box {
    background: ${boxBg};
    border: 2px solid ${boxBorder};
    border-radius: 30px;
    padding: 36px 48px;
    width: 100%;
    max-width: 900px;
    backdrop-filter: blur(15px);
    box-shadow: 0 10px 30px rgba(0,0,0,0.1);
  }
  .bullet-item {
    display: flex;
    align-items: center;
    gap: 16px;
    font-size: 26px;
    font-weight: 700;
    color: ${bulletColor};
    margin-bottom: 18px;
    text-align: right;
  }
  .bullet-item:last-child { margin-bottom: 0; }
  .bullet-icon { color: #ea580c; }
  .cta-box { margin-top: 40px; }
  .cta-btn {
    display: inline-block;
    background: linear-gradient(135deg, #ea580c 0%, #c2410c 100%);
    color: #fff;
    padding: 22px 60px;
    border-radius: 24px;
    font-size: 30px;
    font-weight: 800;
    box-shadow: 0 15px 35px rgba(234, 88, 12, 0.35);
    margin-bottom: 20px;
  }
  .cta-url { font-size: 26px; color: ${isDark ? '#94a3b8' : '#78350f'}; }
  .cta-url b { color: ${isDark ? '#fff' : '#431407'}; }
</style>
</head>
<body>
  <div>
    <img src="${iconBase64}" class="app-icon" />
    <h1>اپلیکیشن غزل</h1>
    <div class="tagline">گنجینه شعر فارسی • ۱۰۰٪ آفلاین</div>
  </div>

  <div class="mockups-wrapper">
    <div class="phone-card-story" style="left: 60px; transform: rotate(-8deg) scale(0.9); z-index: 1;">
      <img src="${mobHome}" />
    </div>
    <div class="phone-card-story" style="right: 60px; transform: rotate(8deg) scale(0.95); z-index: 2;">
      <img src="${mobPoet}" />
    </div>
  </div>

  <div class="bullets-box">
    <div class="bullet-item"><span class="bullet-icon">✦</span> بدون نیاز به اینترنت و کم‌حجم</div>
    <div class="bullet-item"><span class="bullet-icon">✦</span> فال حافظ، تعبیر و فال تصادفی</div>
    <div class="bullet-item"><span class="bullet-icon">✦</span> حفظ شعر با الگوریتم تکرار فاصله‌دار</div>
    <div class="bullet-item"><span class="bullet-icon">✦</span> نقشه جغرافیای شعر و خط زمان تاریخ</div>
  </div>

  <div class="cta-box">
    <div class="cta-btn">نصب مستقیم از کافه بازار</div>
    <div class="cta-url">یا اجرای آنلاین در وب: <b>ghazal.mhkarami97.ir</b></div>
  </div>
</body>
</html>`;
}

function generateLeaderboardBanner(theme) {
  var isDark = theme === 'dark';
  var bg = isDark
    ? 'linear-gradient(90deg, #1c140e 0%, #451a03 50%, #78350f 100%)'
    : 'linear-gradient(90deg, #fff7ed 0%, #ffedd5 50%, #fed7aa 100%)';
  var titleColor = isDark ? '#ffffff' : '#431407';
  var subColor = isDark ? '#fed7aa' : '#9a3412';
  var tagBg = isDark ? 'rgba(0,0,0,0.3)' : '#ffffff';
  var tagBorder = isDark ? 'rgba(255,255,255,0.2)' : '#fb923c';
  var tagText = isDark ? '#cbd5e1' : '#7c2d12';

  return `<!DOCTYPE html>
<html lang="fa" dir="rtl">
<head>
<meta charset="UTF-8">
<style>
  @font-face {
    font-family: 'Vazirmatn';
    src: url('../../fonts/Vazirmatn-Regular.woff2') format('woff2');
    font-weight: 400;
  }
  @font-face {
    font-family: 'Vazirmatn';
    src: url('../../fonts/Vazirmatn-Bold.woff2') format('woff2');
    font-weight: 700;
  }
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body {
    width: 728px;
    height: 90px;
    background: ${bg};
    font-family: 'Vazirmatn', Tahoma, sans-serif;
    color: ${isDark ? '#fff' : '#1c140e'};
    overflow: hidden;
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0 20px;
  }
  .right-side { display: flex; align-items: center; gap: 14px; }
  .app-icon { width: 54px; height: 54px; border-radius: 12px; }
  .title { font-size: 19px; font-weight: 800; color: ${titleColor}; }
  .sub { font-size: 12px; color: ${subColor}; font-weight: 600; }
  .tags { display: flex; gap: 8px; }
  .tag {
    background: ${tagBg};
    border: 1px solid ${tagBorder};
    padding: 4px 10px;
    border-radius: 8px;
    font-size: 11px;
    color: ${tagText};
    font-weight: 700;
  }
  .btn {
    background: #ea580c;
    color: #fff;
    padding: 10px 18px;
    border-radius: 10px;
    font-size: 13px;
    font-weight: 700;
    text-decoration: none;
    box-shadow: 0 4px 12px rgba(234, 88, 12, 0.3);
  }
</style>
</head>
<body>
  <div class="right-side">
    <img src="${iconBase64}" class="app-icon" />
    <div>
      <div class="title">نرم‌افزار غزل | گنجینه شعر فارسی</div>
      <div class="sub">دیوان آفلاین، فال حافظ، وزن شعر و حفظ مرحله‌ای</div>
    </div>
  </div>
  <div class="tags">
    <div class="tag">۱۰۰٪ آفلاین</div>
    <div class="tag">رایگان</div>
    <div class="tag">کافه بازار</div>
  </div>
  <div class="btn">مشاهده و دریافت »</div>
</body>
</html>`;
}

function generateRectangleBanner(theme) {
  var isDark = theme === 'dark';
  var bg = isDark
    ? 'linear-gradient(135deg, #1c140e 0%, #451a03 60%, #78350f 100%)'
    : 'linear-gradient(135deg, #fff7ed 0%, #ffedd5 60%, #fed7aa 100%)';
  var titleColor = isDark ? '#ffffff' : '#431407';
  var subColor = isDark ? '#fed7aa' : '#7c2d12';
  var badgeBg = isDark ? 'rgba(0,0,0,0.35)' : '#ffffff';
  var badgeBorder = isDark ? 'rgba(255,255,255,0.2)' : '#fb923c';
  var badgeText = isDark ? '#cbd5e1' : '#7c2d12';

  return `<!DOCTYPE html>
<html lang="fa" dir="rtl">
<head>
<meta charset="UTF-8">
<style>
  @font-face {
    font-family: 'Vazirmatn';
    src: url('../../fonts/Vazirmatn-Regular.woff2') format('woff2');
    font-weight: 400;
  }
  @font-face {
    font-family: 'Vazirmatn';
    src: url('../../fonts/Vazirmatn-Bold.woff2') format('woff2');
    font-weight: 700;
  }
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body {
    width: 300px;
    height: 250px;
    background: ${bg};
    font-family: 'Vazirmatn', Tahoma, sans-serif;
    color: ${isDark ? '#fff' : '#1c140e'};
    overflow: hidden;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: space-between;
    padding: 18px 14px 16px;
    text-align: center;
  }
  .app-icon {
    width: 48px;
    height: 48px;
    border-radius: 12px;
    box-shadow: 0 4px 12px rgba(0,0,0,0.2);
    margin-bottom: 6px;
  }
  .title {
    font-size: 18px;
    font-weight: 800;
    color: ${titleColor};
    margin-bottom: 4px;
    line-height: 1.2;
  }
  .sub {
    font-size: 11.5px;
    color: ${subColor};
    line-height: 1.45;
    margin-bottom: 8px;
    font-weight: 600;
  }
  .badges {
    display: flex;
    justify-content: center;
    gap: 6px;
    margin-bottom: 10px;
  }
  .badge {
    background: ${badgeBg};
    border: 1px solid ${badgeBorder};
    padding: 3px 8px;
    border-radius: 6px;
    font-size: 10.5px;
    color: ${badgeText};
    font-weight: 700;
  }
  .btn {
    width: 100%;
    background: linear-gradient(135deg, #ea580c, #c2410c);
    color: #fff;
    padding: 8px 12px;
    border-radius: 9px;
    font-size: 12.5px;
    font-weight: 700;
    box-shadow: 0 4px 12px rgba(234, 88, 12, 0.3);
    text-align: center;
  }
</style>
</head>
<body>
  <div>
    <img src="${iconBase64}" class="app-icon" />
    <div class="title">برنامه «غزل»</div>
    <div class="sub">دیوان آفلاین، فال حافظ، وزن شعر و حفظ لایتنر</div>
    <div class="badges">
      <div class="badge">۱۰۰٪ آفلاین</div>
      <div class="badge">پایگاه گنجور</div>
    </div>
  </div>
  <div class="btn">نصب از کافه بازار و وب »</div>
</body>
</html>`;
}

async function main() {
  console.log('1. Starting Chrome for CDP Banner Rendering on port ' + cdpPort + '...');
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
    throw new Error('Failed to connect to Chrome CDP.');
  }

  var cdp = await createCdpClient(wsDebuggerUrl);
  var targetInfo = await cdp.send('Target.createTarget', { url: 'about:blank' });
  var pageWsUrl = 'ws://127.0.0.1:' + cdpPort + '/devtools/page/' + targetInfo.targetId;
  var pageCdp = await createCdpClient(pageWsUrl);

  await pageCdp.send('Page.enable');

  var themes = ['light', 'dark'];
  var bannerDefs = [
    { name: 'banner-1200x630-social', w: 1200, h: 630, gen: generateSocialBanner },
    { name: 'poster-1080x1080-square', w: 1080, h: 1080, gen: generateSquarePoster },
    { name: 'banner-1080x1920-story', w: 1080, h: 1920, gen: generateStoryBanner },
    { name: 'banner-728x90-leaderboard', w: 728, h: 90, gen: generateLeaderboardBanner },
    { name: 'banner-300x250-rectangle', w: 300, h: 250, gen: generateRectangleBanner }
  ];

  for (var t = 0; t < themes.length; t++) {
    var theme = themes[t];
    var themeDir = path.join(bannersBaseDir, theme);
    fs.mkdirSync(themeDir, { recursive: true });

    console.log('\n=======================================');
    console.log('  Rendering Banners in ' + theme.toUpperCase() + ' mode...');
    console.log('=======================================\n');

    for (var b = 0; b < bannerDefs.length; b++) {
      var def = bannerDefs[b];
      var htmlContent = def.gen(theme);
      var htmlPath = path.join(themeDir, def.name + '.html');
      fs.writeFileSync(htmlPath, htmlContent);

      var fileUrl = 'file:///' + htmlPath.replace(/\\/g, '/');

      // Set exact device metrics via CDP
      await pageCdp.send('Emulation.setDeviceMetricsOverride', {
        width: def.w,
        height: def.h,
        deviceScaleFactor: 2, // 2x high resolution
        mobile: false
      });

      await pageCdp.send('Page.navigate', { url: fileUrl });
      await sleep(600); // Wait for fonts and base64 images to settle

      var shot = await pageCdp.send('Page.captureScreenshot', {
        format: 'png',
        clip: {
          x: 0,
          y: 0,
          width: def.w,
          height: def.h,
          scale: 1
        }
      });

      var buffer = Buffer.from(shot.data, 'base64');
      var pngPath = path.join(themeDir, def.name + '.png');
      fs.writeFileSync(pngPath, buffer);
      console.log('Saved: ' + pngPath + ' (' + Math.round(buffer.length / 1024) + ' KB)');

      // If light mode (new default), also write to root banners folder
      if (theme === 'light') {
        var rootHtml = path.join(bannersBaseDir, def.name + '.html');
        var rootPng = path.join(bannersBaseDir, def.name + '.png');
        fs.writeFileSync(rootHtml, htmlContent);
        fs.writeFileSync(rootPng, buffer);
      }
    }
  }

  pageCdp.close();
  cdp.close();
  chromeProc.kill();
  console.log('\nAll banners successfully rendered in both Light and Dark modes!');
}

main().catch(function (err) {
  console.error('Fatal error:', err);
  process.exit(1);
});
