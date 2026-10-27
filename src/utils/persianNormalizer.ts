/**
 * ابزار نرمال‌سازی و مقایسه متون فارسی برای جست‌وجو و آزمون‌ها
 */

export function toPersianDigits(input: number | string): string {
  if (input === null || input === undefined) return '';
  var str = String(input);
  var persianDigits = ['۰', '۱', '۲', '۳', '۴', '۵', '۶', '۷', '۸', '۹'];
  return str.replace(/[0-9]/g, function (w) {
    return persianDigits[+w];
  });
}

export function fromPersianDigits(input: string): string {
  if (!input) return '';
  var persianDigits = ['۰', '۱', '۲', '۳', '۴', '۵', '۶', '۷', '۸', '۹'];
  var arabicDigits = ['٠', '١', '٢', '٣', '٤', '٥', '٦', '٧', '٨', '٩'];
  var res = input;
  for (var i = 0; i < 10; i++) {
    res = res.replaceAll(persianDigits[i], String(i));
    res = res.replaceAll(arabicDigits[i], String(i));
  }
  return res;
}

export function normalizePersian(text: string, removePunctuation = false): string {
  if (!text) return '';
  var res = text;

  // ۱. حذف اعراب و حرکات (تنوین، فتحه، ضمه، کسره، تشدید، سکون)
  res = res.replace(/[\u064B-\u065F\u0670]/g, '');

  // ۲. حذف کشیده (تطویل)
  res = res.replace(/\u0640/g, '');

  // ۳. یکدست‌سازی حروف عربی به فارسی (ی، ک، ه)
  res = res.replace(/ي|ى/g, 'ی');
  res = res.replace(/ك/g, 'ک');
  res = res.replace(/ة/g, 'ه');
  res = res.replace(/ؤ/g, 'و');
  res = res.replace(/إ|أ|آ/g, 'ا');

  // ۴. یکنواخت‌سازی نیم‌فاصله و فاصله‌های متعدد
  res = res.replace(/[\u200C\u200B]/g, ' ');
  res = res.replace(/\s+/g, ' ');

  // ۵. حذف علائم نگارشی در صورت درخواست (برای جست‌وجو)
  if (removePunctuation) {
    res = res.replace(/[.,،؛:!؟?()\[\]{}«»"'\-_/\\`~^&*+=|]/g, '');
    res = res.replace(/\s+/g, ' ');
  }

  return res.trim().toLowerCase();
}

/**
 * محاسبه فاصله لون‌اشتاین (Levenshtein Distance)
 */
export function levenshteinDistance(s1: string, s2: string): number {
  var a = s1 || '';
  var b = s2 || '';
  var m = a.length;
  var n = b.length;

  var dp: number[][] = [];
  for (var i = 0; i <= m; i++) {
    dp[i] = [i];
  }
  for (var j = 0; j <= n; j++) {
    dp[0][j] = j;
  }

  for (var i = 1; i <= m; i++) {
    for (var j = 1; j <= n; j++) {
      if (a[i - 1] === b[j - 1]) {
        dp[i][j] = dp[i - 1][j - 1];
      } else {
        dp[i][j] = Math.min(
          dp[i - 1][j] + 1,     // حذف
          dp[i][j - 1] + 1,     // درج
          dp[i - 1][j - 1] + 1  // جایگزینی
        );
      }
    }
  }

  return dp[m][n];
}

/**
 * بررسی انطباق تقریبی دو عبارت (Fuzzy Match) با درصد شباهت
 */
export function fuzzyMatch(input: string, target: string, threshold = 0.8): boolean {
  var normInput = normalizePersian(input, true);
  var normTarget = normalizePersian(target, true);

  if (normInput === normTarget) return true;
  if (!normInput || !normTarget) return false;

  var maxLen = Math.max(normInput.length, normTarget.length);
  if (maxLen === 0) return true;

  var dist = levenshteinDistance(normInput, normTarget);
  var similarity = 1 - dist / maxLen;

  return similarity >= threshold;
}
