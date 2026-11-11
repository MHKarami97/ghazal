import { toPersianDigits } from '../utils/persianNormalizer';

var CARD_SIZE = 1080;
var TEXT_MAX_WIDTH = 880;
var DEFAULT_FONT_FAMILY = 'Vazirmatn, sans-serif';
export var MAX_FULL_POEM_IMAGE_COUPLETS = 14;

function resolveCanvasFont(fontFamily?: string): string {
  var trimmed = (fontFamily || '').trim();
  return trimmed || DEFAULT_FONT_FAMILY;
}

function fitFontSize(
  ctx: CanvasRenderingContext2D,
  text: string,
  weight: string,
  startSize: number,
  minSize: number,
  fontFamily: string
): number {
  var size = startSize;
  while (size > minSize) {
    ctx.font = `${weight} ${size}px ${fontFamily}`;
    if (ctx.measureText(text).width <= TEXT_MAX_WIDTH) break;
    size -= 2;
  }
  return size;
}

function drawCenteredText(
  ctx: CanvasRenderingContext2D,
  text: string,
  y: number,
  weight: string,
  startSize: number,
  minSize: number,
  color: string,
  fontFamily: string
): void {
  var size = fitFontSize(ctx, text, weight, startSize, minSize, fontFamily);
  ctx.font = `${weight} ${size}px ${fontFamily}`;
  ctx.fillStyle = color;
  ctx.fillText(text, CARD_SIZE / 2, y, TEXT_MAX_WIDTH);
}

function wrapTextLines(
  ctx: CanvasRenderingContext2D,
  text: string,
  maxWidth: number
): string[] {
  var clean = (text || '').trim();
  if (!clean) return [];
  if (ctx.measureText(clean).width <= maxWidth) return [clean];

  var words = clean.split(/\s+/);
  var lines: string[] = [];
  var current = '';
  for (var i = 0; i < words.length; i++) {
    var candidate = current ? `${current} ${words[i]}` : words[i];
    if (ctx.measureText(candidate).width <= maxWidth) {
      current = candidate;
    } else {
      if (current) lines.push(current);
      current = words[i];
    }
  }
  if (current) lines.push(current);
  return lines;
}

async function ensureFontLoaded(fontFamily?: string): Promise<void> {
  if (!document.fonts || !document.fonts.load) return;
  var family = resolveCanvasFont(fontFamily);
  try {
    await Promise.all([
      document.fonts.load(`400 32px ${family}`, 'ابپت'),
      document.fonts.load(`500 46px ${family}`, 'ابپت'),
      document.fonts.load(`bold 36px ${DEFAULT_FONT_FAMILY}`, 'ابپت')
    ]);
  } catch (error) {
    console.warn('Font preload failed', error);
  }
}

function drawCardFrameAndWatermark(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number
): void {
  var gradient = ctx.createLinearGradient(0, 0, width, height);
  gradient.addColorStop(0, '#fdfbf7');
  gradient.addColorStop(1, '#f3ece0');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, width, height);

  ctx.strokeStyle = '#b87c2c';
  ctx.lineWidth = 4;
  ctx.strokeRect(40, 40, width - 80, height - 80);
  ctx.strokeStyle = 'rgba(184, 124, 44, 0.3)';
  ctx.lineWidth = 1.5;
  ctx.strokeRect(55, 55, width - 110, height - 110);

  ctx.save();
  ctx.textAlign = 'right';
  ctx.direction = 'ltr';
  ctx.font = `400 19px ${DEFAULT_FONT_FAMILY}`;
  ctx.fillStyle = 'rgba(100, 116, 139, 0.78)';
  ctx.fillText('ghazal.mhkarami97.ir', width - 78, height - 74);
  ctx.restore();
}

/**
 * ساخت کارت تصویری تک‌بیت. فونت پیش از رسم بارگذاری می‌شود و متن‌های بلند کوچک می‌شوند تا از کادر بیرون نزنند.
 */
export async function renderPoemCard(
  firstMisra: string,
  secondMisra: string,
  poetName: string,
  poemTitle?: string,
  fontFamily?: string
): Promise<HTMLCanvasElement> {
  var poemFont = resolveCanvasFont(fontFamily);
  await ensureFontLoaded(poemFont);

  var canvas = document.createElement('canvas');
  canvas.width = CARD_SIZE;
  canvas.height = CARD_SIZE;

  var ctx = canvas.getContext('2d');
  if (!ctx) return canvas;

  drawCardFrameAndWatermark(ctx, CARD_SIZE, CARD_SIZE);

  ctx.textAlign = 'center';
  ctx.direction = 'rtl';

  drawCenteredText(ctx, '« غـــــزل »', 160, 'bold', 34, 34, '#b87c2c', DEFAULT_FONT_FAMILY);
  drawCenteredText(ctx, firstMisra, CARD_SIZE / 2 - 40, '500', 46, 26, '#1e293b', poemFont);
  drawCenteredText(ctx, '✦', CARD_SIZE / 2 + 30, '400', 30, 30, 'rgba(184, 124, 44, 0.6)', DEFAULT_FONT_FAMILY);
  drawCenteredText(ctx, secondMisra, CARD_SIZE / 2 + 100, '500', 46, 26, '#1e293b', poemFont);
  drawCenteredText(ctx, poetName, CARD_SIZE - 180, 'bold', 36, 22, '#7a471e', DEFAULT_FONT_FAMILY);
  if (poemTitle) {
    drawCenteredText(ctx, poemTitle, CARD_SIZE - 130, '400', 28, 18, '#64748b', DEFAULT_FONT_FAMILY);
  }

  return canvas;
}

export interface FullPoemCardResult {
  canvas: HTMLCanvasElement;
  totalCouplets: number;
  renderedCouplets: number;
  isTruncated: boolean;
}

/**
 * ساخت کارت تصویری شعر کامل (با سقف منطقی تعداد ابیات برای جلوگیری از افت خوانایی یا خطای حافظهٔ بوم)
 */
export async function renderFullPoemCard(
  couplets: { firstMisra: string; secondMisra: string }[],
  poetName: string,
  poemTitle?: string,
  options?: { fontFamily?: string; maxCouplets?: number }
): Promise<FullPoemCardResult> {
  var poemFont = resolveCanvasFont(options?.fontFamily);
  await ensureFontLoaded(poemFont);

  var limit = options?.maxCouplets || MAX_FULL_POEM_IMAGE_COUPLETS;
  var totalCouplets = couplets.length;
  var visibleCouplets = couplets.slice(0, limit);
  var isTruncated = totalCouplets > visibleCouplets.length;

  var measureCanvas = document.createElement('canvas');
  measureCanvas.width = 1;
  measureCanvas.height = 1;
  var mCtx = measureCanvas.getContext('2d');

  var isNastaliq = poemFont.indexOf('Noto Nastaliq') !== -1 || poemFont.indexOf('Gulzar') !== -1;
  var verseFontSize = visibleCouplets.length > 8 ? 28 : 32;
  if (isNastaliq) {
    verseFontSize = visibleCouplets.length > 8 ? 26 : 30;
  }
  var lineStep = isNastaliq ? 54 : 46;
  var coupletGap = isNastaliq ? 34 : 28;

  interface PlannedLine {
    text: string;
    y: number;
    kind: 'misra' | 'divider';
  }

  var planned: PlannedLine[] = [];
  var yCursor = poemTitle ? 310 : 265;

  if (mCtx) {
    mCtx.font = `500 ${verseFontSize}px ${poemFont}`;
  }

  for (var i = 0; i < visibleCouplets.length; i++) {
    var c = visibleCouplets[i];
    var rLines = mCtx ? wrapTextLines(mCtx, c.firstMisra, TEXT_MAX_WIDTH) : [c.firstMisra];
    var lLines = mCtx ? wrapTextLines(mCtx, c.secondMisra, TEXT_MAX_WIDTH) : [c.secondMisra];

    for (var ri = 0; ri < rLines.length; ri++) {
      planned.push({ text: rLines[ri], y: yCursor, kind: 'misra' });
      yCursor += lineStep;
    }
    for (var li = 0; li < lLines.length; li++) {
      planned.push({ text: lLines[li], y: yCursor, kind: 'misra' });
      yCursor += lineStep;
    }

    if (i < visibleCouplets.length - 1) {
      planned.push({ text: '✦', y: yCursor - 10, kind: 'divider' });
      yCursor += coupletGap;
    }
  }

  var bottomMargin = isTruncated ? 165 : 120;
  var finalHeight = Math.max(1080, Math.min(4096, yCursor + bottomMargin));

  var canvas = document.createElement('canvas');
  canvas.width = CARD_SIZE;
  canvas.height = finalHeight;

  var ctx = canvas.getContext('2d');
  if (!ctx) {
    return {
      canvas: canvas,
      totalCouplets: totalCouplets,
      renderedCouplets: visibleCouplets.length,
      isTruncated: isTruncated
    };
  }

  drawCardFrameAndWatermark(ctx, CARD_SIZE, finalHeight);

  ctx.textAlign = 'center';
  ctx.direction = 'rtl';

  drawCenteredText(ctx, '« غـــــزل »', 122, 'bold', 28, 28, '#b87c2c', DEFAULT_FONT_FAMILY);
  if (poemTitle) {
    drawCenteredText(ctx, poemTitle, 178, 'bold', 34, 22, '#1e293b', DEFAULT_FONT_FAMILY);
    drawCenteredText(ctx, poetName, 224, 'bold', 26, 20, '#7a471e', DEFAULT_FONT_FAMILY);
  } else {
    drawCenteredText(ctx, poetName, 184, 'bold', 30, 22, '#7a471e', DEFAULT_FONT_FAMILY);
  }

  // خط ظریف جداکننده سربرگ
  ctx.save();
  ctx.strokeStyle = 'rgba(184, 124, 44, 0.35)';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(220, poemTitle ? 256 : 218);
  ctx.lineTo(CARD_SIZE - 220, poemTitle ? 256 : 218);
  ctx.stroke();
  ctx.restore();

  for (var p = 0; p < planned.length; p++) {
    var item = planned[p];
    if (item.y > finalHeight - bottomMargin) break;
    if (item.kind === 'divider') {
      ctx.font = `400 18px ${DEFAULT_FONT_FAMILY}`;
      ctx.fillStyle = 'rgba(184, 124, 44, 0.45)';
      ctx.fillText(item.text, CARD_SIZE / 2, item.y, TEXT_MAX_WIDTH);
    } else {
      ctx.font = `500 ${verseFontSize}px ${poemFont}`;
      ctx.fillStyle = '#1e293b';
      ctx.fillText(item.text, CARD_SIZE / 2, item.y, TEXT_MAX_WIDTH);
    }
  }

  if (isTruncated) {
    var remaining = totalCouplets - visibleCouplets.length;
    drawCenteredText(
      ctx,
      `ادامهٔ شعر (${toPersianDigits(remaining)} بیت دیگر) در ghazal.mhkarami97.ir`,
      finalHeight - 122,
      'bold',
      22,
      18,
      '#7a471e',
      DEFAULT_FONT_FAMILY
    );
  }

  return {
    canvas: canvas,
    totalCouplets: totalCouplets,
    renderedCouplets: visibleCouplets.length,
    isTruncated: isTruncated
  };
}
