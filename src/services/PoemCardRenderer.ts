var CARD_SIZE = 1080;
var TEXT_MAX_WIDTH = 880;
var FONT_FAMILY = 'Vazirmatn, sans-serif';

function fitFontSize(ctx: CanvasRenderingContext2D, text: string, weight: string, startSize: number, minSize: number): number {
  var size = startSize;
  while (size > minSize) {
    ctx.font = `${weight} ${size}px ${FONT_FAMILY}`;
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
  color: string
): void {
  var size = fitFontSize(ctx, text, weight, startSize, minSize);
  ctx.font = `${weight} ${size}px ${FONT_FAMILY}`;
  ctx.fillStyle = color;
  ctx.fillText(text, CARD_SIZE / 2, y, TEXT_MAX_WIDTH);
}

async function ensureFontLoaded(): Promise<void> {
  if (!document.fonts || !document.fonts.load) return;
  try {
    await Promise.all([
      document.fonts.load(`500 46px ${FONT_FAMILY}`),
      document.fonts.load(`bold 36px ${FONT_FAMILY}`)
    ]);
  } catch (error) {
    console.warn('Font preload failed', error);
  }
}

/**
 * ساخت کارت تصویری بیت. فونت پیش از رسم بارگذاری می‌شود و متن‌های بلند کوچک می‌شوند تا از کادر بیرون نزنند.
 */
export async function renderPoemCard(
  firstMisra: string,
  secondMisra: string,
  poetName: string,
  poemTitle?: string
): Promise<HTMLCanvasElement> {
  await ensureFontLoaded();

  var canvas = document.createElement('canvas');
  canvas.width = CARD_SIZE;
  canvas.height = CARD_SIZE;

  var ctx = canvas.getContext('2d');
  if (!ctx) return canvas;

  var gradient = ctx.createLinearGradient(0, 0, CARD_SIZE, CARD_SIZE);
  gradient.addColorStop(0, '#fdfbf7');
  gradient.addColorStop(1, '#f3ece0');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, CARD_SIZE, CARD_SIZE);

  ctx.strokeStyle = '#b87c2c';
  ctx.lineWidth = 4;
  ctx.strokeRect(40, 40, CARD_SIZE - 80, CARD_SIZE - 80);
  ctx.strokeStyle = 'rgba(184, 124, 44, 0.3)';
  ctx.lineWidth = 1.5;
  ctx.strokeRect(55, 55, CARD_SIZE - 110, CARD_SIZE - 110);

  ctx.textAlign = 'center';
  ctx.direction = 'rtl';

  drawCenteredText(ctx, '« غـــــزل »', 160, 'bold', 34, 34, '#b87c2c');
  drawCenteredText(ctx, firstMisra, CARD_SIZE / 2 - 40, '500', 46, 26, '#1e293b');
  drawCenteredText(ctx, '✦', CARD_SIZE / 2 + 30, '400', 30, 30, 'rgba(184, 124, 44, 0.6)');
  drawCenteredText(ctx, secondMisra, CARD_SIZE / 2 + 100, '500', 46, 26, '#1e293b');
  drawCenteredText(ctx, poetName, CARD_SIZE - 180, 'bold', 36, 22, '#7a471e');
  if (poemTitle) {
    drawCenteredText(ctx, poemTitle, CARD_SIZE - 130, '400', 28, 18, '#64748b');
  }

  ctx.save();
  ctx.textAlign = 'right';
  ctx.direction = 'ltr';
  ctx.font = `400 19px ${FONT_FAMILY}`;
  ctx.fillStyle = 'rgba(100, 116, 139, 0.78)';
  ctx.fillText('ghazal.mhkarami97.ir', CARD_SIZE - 78, CARD_SIZE - 76);
  ctx.restore();

  return canvas;
}
