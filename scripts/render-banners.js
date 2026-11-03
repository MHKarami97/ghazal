import fs from 'fs';
import path from 'path';
import { spawn } from 'child_process';

var bannersDir = 'D:/Local/ghazal/public/share/banners';
var screenshotsDir = 'D:/Local/ghazal/public/share/screenshots';
var chromePath = 'C:/Program Files/Google/Chrome/Application/chrome.exe';

var iconBase64 = '';
var iconPath = 'D:/Local/ghazal/public/icons/icon-512.png';
if (fs.existsSync(iconPath)) {
  iconBase64 = 'data:image/png;base64,' + fs.readFileSync(iconPath).toString('base64');
}

function getScreenshotBase64(filename) {
  var p = path.join(screenshotsDir, filename);
  if (fs.existsSync(p)) {
    return 'data:image/png;base64,' + fs.readFileSync(p).toString('base64');
  }
  return '';
}

var mobileHome = getScreenshotBase64('mobile-01-home.png');
var mobilePoet = getScreenshotBase64('mobile-03-poet-detail.png');
var desktopHome = getScreenshotBase64('desktop-01-home.png');

var banners = [
  {
    htmlName: 'banner-1200x630-social.html',
    pngName: 'banner-1200x630-social.png',
    width: 1200,
    height: 630,
    html: `<!DOCTYPE html>
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
    background: linear-gradient(135deg, #1c140e 0%, #451a03 40%, #78350f 100%);
    font-family: 'Vazirmatn', Tahoma, sans-serif;
    color: #fff;
    overflow: hidden;
    position: relative;
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0 70px;
  }
  .bg-glow {
    position: absolute;
    width: 600px;
    height: 600px;
    border-radius: 50%;
    background: radial-gradient(circle, rgba(234, 88, 12, 0.25) 0%, transparent 70%);
    top: -100px;
    right: -100px;
    pointer-events: none;
  }
  .content {
    max-width: 580px;
    z-index: 2;
  }
  .badge {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    background: rgba(255, 255, 255, 0.12);
    border: 1px solid rgba(255, 255, 255, 0.25);
    padding: 8px 18px;
    border-radius: 100px;
    font-size: 15px;
    font-weight: 700;
    color: #fed7aa;
    margin-bottom: 24px;
    backdrop-filter: blur(10px);
  }
  h1 {
    font-size: 46px;
    font-weight: 800;
    line-height: 1.25;
    margin-bottom: 16px;
    background: linear-gradient(135deg, #ffffff 0%, #ffedd5 100%);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
  }
  p {
    font-size: 18px;
    line-height: 1.7;
    color: #cbd5e1;
    margin-bottom: 28px;
  }
  .features-list {
    display: flex;
    flex-wrap: wrap;
    gap: 12px;
    margin-bottom: 30px;
  }
  .pill {
    background: rgba(0, 0, 0, 0.35);
    border: 1px solid rgba(251, 146, 60, 0.4);
    padding: 6px 14px;
    border-radius: 12px;
    font-size: 14px;
    color: #fed7aa;
    font-weight: 600;
  }
  .urls {
    display: flex;
    align-items: center;
    gap: 20px;
    font-size: 14px;
    color: #94a3b8;
  }
  .urls b { color: #fff; }
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
    border: 4px solid #334155;
    box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.7);
    overflow: hidden;
    left: 20px;
    top: 10px;
    transform: rotate(-4deg);
  }
  .phone-frame img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }
  .phone-frame-2 {
    position: absolute;
    width: 230px;
    height: 460px;
    background: #000;
    border-radius: 32px;
    border: 4px solid #475569;
    box-shadow: 0 20px 40px -12px rgba(0, 0, 0, 0.6);
    overflow: hidden;
    right: 10px;
    bottom: 10px;
    transform: rotate(6deg);
  }
  .phone-frame-2 img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }
</style>
</head>
<body>
<div class="bg-glow"></div>
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
  <div class="phone-frame"><img src="${mobileHome}" /></div>
  <div class="phone-frame-2"><img src="${mobilePoet}" /></div>
</div>
</body>
</html>`
  },
  {
    htmlName: 'poster-1080x1080-square.html',
    pngName: 'poster-1080x1080-square.png',
    width: 1080,
    height: 1080,
    html: `<!DOCTYPE html>
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
    background: radial-gradient(circle at 50% 20%, #451a03 0%, #1c140e 70%, #0c0a09 100%);
    font-family: 'Vazirmatn', Tahoma, sans-serif;
    color: #fff;
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
    box-shadow: 0 15px 35px rgba(234, 88, 12, 0.4);
    margin-bottom: 20px;
  }
  h1 {
    font-size: 50px;
    font-weight: 800;
    line-height: 1.25;
    margin-bottom: 14px;
    color: #fff;
  }
  h2 {
    font-size: 24px;
    color: #fb923c;
    font-weight: 600;
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
    border: 5px solid #334155;
    box-shadow: 0 25px 50px rgba(0, 0, 0, 0.8);
    overflow: hidden;
  }
  .phone-card img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }
  .features-grid {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 16px;
    max-width: 900px;
    width: 100%;
    margin-bottom: 30px;
  }
  .feat-item {
    background: rgba(255, 255, 255, 0.08);
    border: 1px solid rgba(255, 255, 255, 0.15);
    padding: 12px;
    border-radius: 16px;
    font-size: 16px;
    font-weight: 700;
    color: #fed7aa;
  }
  .footer-links {
    font-size: 18px;
    color: #94a3b8;
  }
  .footer-links span { color: #fff; font-weight: 700; }
</style>
</head>
<body>
  <div>
    <img src="${iconBase64}" class="app-icon" />
    <h1>غزل | گنجینه هوشمند شعر و ادب فارسی</h1>
    <h2>همراه همیشگی اهل شعر و ادب — ۱۰۰٪ آفلاین و رایگان</h2>
  </div>

  <div class="mockups-row">
    <div class="phone-card" style="transform: rotate(-3deg);"><img src="${mobileHome}" /></div>
    <div class="phone-card" style="transform: scale(1.05); z-index: 2;"><img src="${mobilePoet}" /></div>
    <div class="phone-card" style="transform: rotate(3deg);"><img src="${getScreenshotBase64('mobile-04-faal.png')}" /></div>
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
</html>`
  },
  {
    htmlName: 'banner-1080x1920-story.html',
    pngName: 'banner-1080x1920-story.png',
    width: 1080,
    height: 1920,
    html: `<!DOCTYPE html>
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
    background: linear-gradient(180deg, #1c140e 0%, #451a03 30%, #172554 80%, #0f172a 100%);
    font-family: 'Vazirmatn', Tahoma, sans-serif;
    color: #fff;
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
    box-shadow: 0 20px 40px rgba(0,0,0,0.6);
    margin-bottom: 28px;
  }
  h1 {
    font-size: 64px;
    font-weight: 800;
    line-height: 1.25;
    margin-bottom: 20px;
  }
  .tagline {
    font-size: 32px;
    color: #fed7aa;
    font-weight: 600;
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
    border: 7px solid #334155;
    box-shadow: 0 35px 70px rgba(0,0,0,0.8);
    overflow: hidden;
  }
  .phone-card-story img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }
  .bullets-box {
    background: rgba(0, 0, 0, 0.4);
    border: 2px solid rgba(255, 255, 255, 0.15);
    border-radius: 30px;
    padding: 36px 48px;
    width: 100%;
    max-width: 900px;
    backdrop-filter: blur(15px);
  }
  .bullet-item {
    display: flex;
    align-items: center;
    gap: 16px;
    font-size: 26px;
    font-weight: 700;
    color: #f8fafc;
    margin-bottom: 18px;
    text-align: right;
  }
  .bullet-item:last-child { margin-bottom: 0; }
  .bullet-icon { color: #fb923c; }
  .cta-box {
    margin-top: 40px;
  }
  .cta-btn {
    display: inline-block;
    background: linear-gradient(135deg, #ea580c 0%, #c2410c 100%);
    color: #fff;
    padding: 22px 60px;
    border-radius: 24px;
    font-size: 30px;
    font-weight: 800;
    box-shadow: 0 15px 35px rgba(234, 88, 12, 0.4);
    margin-bottom: 20px;
  }
  .cta-url {
    font-size: 26px;
    color: #94a3b8;
  }
  .cta-url b { color: #fff; }
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
      <img src="${mobileHome}" />
    </div>
    <div class="phone-card-story" style="right: 60px; transform: rotate(8deg) scale(0.95); z-index: 2;">
      <img src="${mobilePoet}" />
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
</html>`
  },
  {
    htmlName: 'banner-728x90-leaderboard.html',
    pngName: 'banner-728x90-leaderboard.png',
    width: 728,
    height: 90,
    html: `<!DOCTYPE html>
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
    background: linear-gradient(90deg, #1c140e 0%, #451a03 50%, #78350f 100%);
    font-family: 'Vazirmatn', Tahoma, sans-serif;
    color: #fff;
    overflow: hidden;
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0 20px;
  }
  .right-side {
    display: flex;
    align-items: center;
    gap: 14px;
  }
  .app-icon {
    width: 54px;
    height: 54px;
    border-radius: 12px;
  }
  .title {
    font-size: 19px;
    font-weight: 800;
    color: #fff;
  }
  .sub {
    font-size: 12px;
    color: #fed7aa;
  }
  .tags {
    display: flex;
    gap: 8px;
  }
  .tag {
    background: rgba(0,0,0,0.3);
    border: 1px solid rgba(255,255,255,0.2);
    padding: 4px 10px;
    border-radius: 8px;
    font-size: 11px;
    color: #cbd5e1;
    font-weight: 600;
  }
  .btn {
    background: #ea580c;
    color: #fff;
    padding: 10px 18px;
    border-radius: 10px;
    font-size: 13px;
    font-weight: 700;
    text-decoration: none;
    box-shadow: 0 4px 12px rgba(234, 88, 12, 0.4);
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
</html>`
  },
  {
    htmlName: 'banner-300x250-rectangle.html',
    pngName: 'banner-300x250-rectangle.png',
    width: 300,
    height: 250,
    html: `<!DOCTYPE html>
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
    background: linear-gradient(135deg, #1c140e 0%, #451a03 60%, #78350f 100%);
    font-family: 'Vazirmatn', Tahoma, sans-serif;
    color: #fff;
    overflow: hidden;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: space-between;
    padding: 18px 16px;
    text-align: center;
  }
  .app-icon {
    width: 50px;
    height: 50px;
    border-radius: 12px;
    box-shadow: 0 6px 16px rgba(0,0,0,0.5);
  }
  .title {
    font-size: 19px;
    font-weight: 800;
    color: #fff;
    margin-top: 6px;
  }
  .sub {
    font-size: 12px;
    color: #fed7aa;
    line-height: 1.5;
    margin: 4px 0 10px;
  }
  .badges {
    display: flex;
    justify-content: center;
    gap: 6px;
    margin-bottom: 12px;
  }
  .badge {
    background: rgba(0,0,0,0.35);
    border: 1px solid rgba(255,255,255,0.2);
    padding: 3px 8px;
    border-radius: 6px;
    font-size: 11px;
    color: #cbd5e1;
  }
  .btn {
    width: 100%;
    background: linear-gradient(135deg, #ea580c, #c2410c);
    color: #fff;
    padding: 9px;
    border-radius: 10px;
    font-size: 13px;
    font-weight: 700;
    box-shadow: 0 4px 12px rgba(234, 88, 12, 0.4);
  }
</style>
</head>
<body>
  <div>
    <img src="${iconBase64}" class="app-icon" />
    <div class="title">برنامه «غزل»</div>
    <div class="sub">دیوان آفلاین، فال حافظ، اوزان شعر و حفظ لایتنر</div>
    <div class="badges">
      <div class="badge">۱۰۰٪ آفلاین</div>
      <div class="badge">پایگاه گنجور</div>
    </div>
  </div>
  <div class="btn">نصب از کافه بازار و وب »</div>
</body>
</html>`
  }
];

async function run() {
  for (var b of banners) {
    var htmlPath = path.join(bannersDir, b.htmlName);
    fs.writeFileSync(htmlPath, b.html);
    console.log('Saved template:', htmlPath);

    var pngPath = path.join(bannersDir, b.pngName);
    var fileUrl = 'file:///' + htmlPath.replace(/\\/g, '/');

    // Run Chrome to capture PNG
    await new Promise(function (resolve) {
      var proc = spawn(chromePath, [
        '--headless=new',
        '--hide-scrollbars',
        '--disable-gpu',
        '--window-size=' + b.width + ',' + b.height,
        '--screenshot=' + pngPath,
        fileUrl
      ]);
      proc.on('close', function (code) {
        console.log('Rendered ' + b.pngName + ' (code: ' + code + ')');
        resolve();
      });
    });
  }
  console.log('All banners re-rendered with new mockups!');
}

run();
