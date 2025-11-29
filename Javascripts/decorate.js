// ===== VibeBooth • Decorate (Retro / Hearts / Peace / SoftPink) =====

const W = 950, H = 1470;

// --- Assets ---
const PEACE_PATTERN_URL = new URL('./assets/peace.png', document.baseURI).href;
const BOW_IMAGE_URL     = new URL('./assets/bow.png',  document.baseURI).href; // make sure this file exists

// Bow state
let bowImg = null;
let bowReady = false;

function loadBowImage(cb) {
  if (bowReady && bowImg) { cb?.(); return; }

  const img = new Image();
  img.onload = () => {
    bowImg = img;
    bowReady = true;
    cb?.();
  };
  img.onerror = () => {
    console.warn('bow image failed to load');
    bowReady = false;
    cb?.();
  };
  img.src = BOW_IMAGE_URL + `?v=${Date.now()}`;
}

// Canvas
const cvs = document.getElementById('decorCanvas');
const ctx = cvs.getContext('2d', { alpha: true });
cvs.width = W;
cvs.height = H;

// ------------------------------------------------------------------
// Frames list
const FRAMES = [
  { id: 'retro',    name: 'Retro Film',  desc: 'black card + sprockets', draw: drawRetroFilm },
  { id: 'softPink', name: 'Soft Pink',   desc: 'bows + pastel strip',    draw: drawSoftPinkFrame },
  { id: 'peace',    name: 'Peace Print', desc: 'tiled poster pattern',   draw: drawPeaceFrame },
  { id: 'yours',    name: 'Yours',       desc: 'red script all over',    draw: drawYoursFrame },
];

let currentFrame = 'retro';

// Colors
function heartsFrameFill(){ return '#FF8DA1'; }
function softPinkFrameFill(){ return '#9c5a7aff'; }  // your light-ish magenta

// ------------------------------------------------------------------
// Peace pattern state
let peaceImg = null;
let peaceTile = null;          // cached, scaled tile canvas
let peacePatternReady = false;
let PEACE_PATTERN_SCALE = 0.7;

function buildPeaceTileFrom(img) {
  const tileW = Math.max(32, Math.round(img.width  * PEACE_PATTERN_SCALE));
  const tileH = Math.max(32, Math.round(img.height * PEACE_PATTERN_SCALE));
  const off = document.createElement('canvas');
  off.width = tileW; off.height = tileH;
  const g = off.getContext('2d');
  g.imageSmoothingEnabled = true;
  g.drawImage(img, 0, 0, tileW, tileH);
  return off;
}

// fallback tile if assets/peace.png fails
function buildPeaceFallbackTile() {
  const s = 32;
  const off = document.createElement('canvas');
  off.width = s; off.height = s;
  const g = off.getContext('2d');
  g.fillStyle = '#e9d7ff'; g.fillRect(0,0,s,s);
  g.strokeStyle = '#6b21a8';
  g.lineWidth = 6;
  g.beginPath();
  g.moveTo(-8, 8);  g.lineTo(40, 56);
  g.moveTo(-8,-8);  g.lineTo(40, 40);
  g.stroke();
  return off;
}

function loadPeacePattern(cb) {
  if (peacePatternReady && peaceTile) { cb?.(); return; }

  const img = new Image(); // same-origin
  img.onload = () => {
    peaceImg = img;
    peaceTile = buildPeaceTileFrom(img);
    peacePatternReady = true;
    cb?.();
  };
  img.onerror = () => {
    // fallback so peace still shows a pattern
    peaceTile = buildPeaceFallbackTile();
    peacePatternReady = true;
    cb?.();
  };
  img.src = PEACE_PATTERN_URL + `?v=${Date.now()}`;
}

// ------------------------------------------------------------------
// Render
let photoStripImg = null;

function render(){
  if (!photoStripImg) return;

  ctx.clearRect(0, 0, W, H);
  const ph = photoRect(currentFrame);

  const srcW = photoStripImg.width;
  const srcH = photoStripImg.height;

  // --------------------------------------------------
  // RETRO: 4 PHOTOS on black, each in a white block
  // --------------------------------------------------
  if (currentFrame === 'retro') {
    const NUM = 4;
    const GAP = Math.max(8, Math.round(ph.h * 0.02));

    ctx.fillStyle = '#000';
    ctx.fillRect(ph.x, ph.y, ph.w, ph.h);

    const totalGaps = (NUM - 1) * GAP;
    const slotH = Math.floor((ph.h - totalGaps) / NUM);
    const srcSlotH = Math.floor(srcH / NUM);

    const cardPadX = Math.round(ph.w * 0.08);
    const cardX    = ph.x + cardPadX;
    const cardW    = ph.w - cardPadX * 2;
    const cardR    = 0;

    for (let i = 0; i < NUM; i++) {
      const cardY = ph.y + i * (slotH + GAP);
      const sy = (i < NUM - 1) ? (srcSlotH * i) : (srcH - srcSlotH);
      const sh = (i < NUM - 1) ? srcSlotH       : (srcH - srcSlotH * (NUM - 1));

      ctx.save();
      roundRectPath(ctx, cardX, cardY, cardW, slotH, cardR);
      ctx.fillStyle = '#FFFFFF';
      ctx.fill();
      ctx.clip();
      ctx.drawImage(photoStripImg, 0, sy, srcW, sh, cardX, cardY, cardW, slotH);
      ctx.restore();
    }

  // --------------------------------------------------
  // HEARTS: 4 PHOTOS, tall & thin, pink strip
  // --------------------------------------------------
  
  // --------------------------------------------------
  // SOFT PINK: 4 PHOTOS, tall & thin, bows
  // --------------------------------------------------
  } else if (currentFrame === 'softPink') {
    const NUM = 4;
    const GAP = Math.max(8, Math.round(ph.h * 0.02));

    ctx.fillStyle = softPinkFrameFill();
    ctx.fillRect(ph.x, ph.y, ph.w, ph.h);

    const totalGaps = (NUM - 1) * GAP;
    const slotH = Math.floor((ph.h - totalGaps) / NUM);
    const srcSlotH = Math.floor(srcH / NUM);

    const cardPadX = Math.round(ph.w * 0.08);
    const cardX    = ph.x + cardPadX;
    const cardW    = ph.w - cardPadX * 2;
    const cardR    = 0;

    for (let i = 0; i < NUM; i++) {
      const cardY = ph.y + i * (slotH + GAP);
      const sy = (i < NUM - 1) ? (srcSlotH * i) : (srcH - srcSlotH);
      const sh = (i < NUM - 1) ? srcSlotH       : (srcH - srcSlotH * (NUM - 1));

      ctx.save();
      roundRectPath(ctx, cardX, cardY, cardW, slotH, cardR);
      ctx.fillStyle = '#FFFFFF';
      ctx.fill();
      ctx.clip();
      ctx.drawImage(photoStripImg, 0, sy, srcW, sh, cardX, cardY, cardW, slotH);
      ctx.restore();
    }

  // --------------------------------------------------
  // PEACE: 4 PHOTOS, tall & thin, patterned strip
  // --------------------------------------------------
  } else if (currentFrame === 'peace') {
    const NUM = 4;
    const GAP = Math.max(8, Math.round(ph.h * 0.02));

    if (peacePatternReady && peaceTile){
      ctx.fillStyle = ctx.createPattern(peaceTile, 'repeat');
    } else {
      ctx.fillStyle = '#FFE6C9';
    }
    ctx.fillRect(ph.x, ph.y, ph.w, ph.h);

    const totalGaps = (NUM - 1) * GAP;
    const slotH = Math.floor((ph.h - totalGaps) / NUM);
    const srcSlotH = Math.floor(srcH / NUM);

    const cardPadX = Math.round(ph.w * 0.08);
    const cardX    = ph.x + cardPadX;
    const cardW    = ph.w - cardPadX * 2;
    const cardR    = 0;

    for (let i = 0; i < NUM; i++) {
      const cardY = ph.y + i * (slotH + GAP);
      const sy = (i < NUM - 1) ? (srcSlotH * i) : (srcH - srcSlotH);
      const sh = (i < NUM - 1) ? srcSlotH       : (srcH - srcSlotH * (NUM - 1));

      ctx.save();
      roundRectPath(ctx, cardX, cardY, cardW, slotH, cardR);
      ctx.fillStyle = '#FFFFFF';
      ctx.fill();
      ctx.clip();
      ctx.drawImage(photoStripImg, 0, sy, srcW, sh, cardX, cardY, cardW, slotH);
      ctx.restore();
    }

      // --------------------------------------------------
  // YOURS: 4 PHOTOS, tall & thin, red strip
  // --------------------------------------------------
  } else if (currentFrame === 'yours') {
    const NUM = 4;
    const GAP = Math.max(8, Math.round(ph.h * 0.02));

    // background under the photos (red)
    ctx.fillStyle = '#7f1d1d'; // deep red
    ctx.fillRect(ph.x, ph.y, ph.w, ph.h);

    const totalGaps = (NUM - 1) * GAP;
    const slotH = Math.floor((ph.h - totalGaps) / NUM);
    const srcSlotH = Math.floor(srcH / NUM);

    const cardPadX = Math.round(ph.w * 0.08);
    const cardX    = ph.x + cardPadX;
    const cardW    = ph.w - cardPadX * 2;
    const cardR    = 0;

    for (let i = 0; i < NUM; i++) {
      const cardY = ph.y + i * (slotH + GAP);
      const sy = (i < NUM - 1) ? (srcSlotH * i) : (srcH - srcSlotH);
      const sh = (i < NUM - 1) ? srcSlotH       : (srcH - srcSlotH * (NUM - 1));

      ctx.save();
      roundRectPath(ctx, cardX, cardY, cardW, slotH, cardR);
      ctx.fillStyle = '#FFFFFF';
      ctx.fill();
      ctx.clip();
      ctx.drawImage(photoStripImg, 0, sy, srcW, sh, cardX, cardY, cardW, slotH);
      ctx.restore();
    }


  // --------------------------------------------------
  // Fallback: just center-crop
  // --------------------------------------------------
  } else {
    ctx.drawImage(photoStripImg, 0, 0, srcW, srcH, ph.x, ph.y, ph.w, ph.h);
  }

  // Frame chrome on top
  const frame = FRAMES.find(f => f.id === currentFrame);
  if (frame) frame.draw(ctx, W, H, ph);
}


function photoRect(frameId){
  // all 4: tall, thin strip centered
  if (
    frameId === 'retro' ||
    frameId === 'softPink' ||
    frameId === 'peace' ||
    frameId === 'yours'
  ) {
    const CARD_SCALE = 0.55;
    const CARD_W = Math.round(W * CARD_SCALE);
    const OUTSET_Y = 10;
    const BORDER = Math.round(CARD_W * 0.060);

    const outerX = Math.round((W - CARD_W) / 2);
    const outerY = OUTSET_Y;
    const outerH = H - OUTSET_Y * 2;

    const innerX = outerX + BORDER;
    const innerY = outerY + BORDER;
    const innerW = CARD_W - BORDER * 2;
    const innerH = outerH - BORDER * 2;

    return { x: innerX, y: innerY, w: innerW, h: innerH };
  }

  const base = Math.round(W * 0.035);
  const m = base;
  return { x: m, y: m, w: W - m * 2, h: H - m * 2 };
}

// ------------------------------------------------------------------
// Helpers
function roundRectPath(g, x, y, w, h, r){
  g.beginPath();
  g.moveTo(x + r, y);
  g.arcTo(x + w, y, x + w, y + h, r);
  g.arcTo(x + w, y + h, x, y + h, r);
  g.arcTo(x, y + h, x, y, r);
  g.arcTo(x, y, x + w, y, r);
  g.closePath();
}

function drawRingOnMain(mainCtx, outer, inner, paintRingFn){
  const off = document.createElement('canvas');
  off.width = mainCtx.canvas.width;
  off.height = mainCtx.canvas.height;
  const g = off.getContext('2d');

  g.save();
  if (!outer.r) {
    g.beginPath();
    g.rect(outer.x, outer.y, outer.w, outer.h);
  } else {
    roundRectPath(g, outer.x, outer.y, outer.w, outer.h, outer.r);
  }
  g.clip();

  paintRingFn(g);
  g.restore();

  const dpr = (window.devicePixelRatio || 1);
  g.globalCompositeOperation = 'destination-out';
  g.fillStyle = '#000';
  roundRectPath(
    g,
    inner.x - dpr, inner.y - dpr,
    inner.w + 2 * dpr, inner.h + 2 * dpr,
    Math.max(0, inner.r - dpr)
  );
  g.fill();

  g.globalCompositeOperation = 'source-over';
  mainCtx.drawImage(off, 0, 0);
}

// ------------------------------------------------------------------
// Frames chrome
function drawRetroFilm(main, w, h){
  const CARD_SCALE = 0.55;
  const CARD_W = Math.round(w * CARD_SCALE);
  const OUTSET_Y = 10;
  const OUT_R = 0;

  const OUTSET_X = Math.round((w - CARD_W) / 2);
  const BORDER = Math.round(CARD_W * 0.060);
  const IN_R = 0;

  const outer = {
    x: OUTSET_X,
    y: OUTSET_Y,
    w: CARD_W,
    h: h - OUTSET_Y * 2,
    r: OUT_R
  };
  const inner = {
    x: outer.x + BORDER,
    y: outer.y + BORDER,
    w: outer.w - BORDER * 2,
    h: outer.h - BORDER * 2,
    r: IN_R
  };

  drawRingOnMain(main, outer, inner, (g) => {
    roundRectPath(g, outer.x, outer.y, outer.w, outer.h, outer.r);
    g.fillStyle = '#ffffffff';
    g.fill();

    function placeCol(startY, endY, x, holeW, holeH, gap, r){
      const span = endY - startY, step = holeH + gap;
      const n = Math.max(1, Math.floor((span + gap) / step));
      const used = n * holeH + (n - 1) * gap;
      let y = startY + (span - used) / 2;
      for (let i = 0; i < n; i++, y += step){
        roundRectPath(g, x, Math.round(y), holeW, holeH, r);
        g.fill();
      }
    }

    const vHoleW = Math.round(CARD_W * 0.13);
    const vHoleH = Math.round(h * 0.050);
    const vGap   = Math.round(h * 0.022);
    const overY  = Math.round(h * 0.02);

    const leftX  = Math.round(((outer.x) + (inner.x)) / 2 - vHoleW / 2);
    const rightX = Math.round(((inner.x + inner.w) + (outer.x + outer.w)) / 2 - vHoleW / 2);

    g.fillStyle = '#000000ff';
    placeCol(inner.y - overY, inner.y + inner.h + overY, leftX,  vHoleW, vHoleH, vGap, 0);
    placeCol(inner.y - overY, inner.y + inner.h + overY, rightX, vHoleW, vHoleH, vGap, 0);
  });
}
function goldSparkle(g, x, y, s, rot){
  g.save();
  g.translate(x, y);
  g.rotate(rot || 0);

  // glow
  g.shadowColor = 'rgba(255, 215, 0, 0.9)';
  g.shadowBlur = Math.max(8, s);

  // base sparkle shape
  g.fillStyle = '#FFD700'; // gold
  g.beginPath();
  g.moveTo(0, -s);
  g.lineTo(s * 0.7, 0);
  g.lineTo(0, s);
  g.lineTo(-s * 0.7, 0);
  g.closePath();
  g.fill();

  g.shadowBlur = 0;

  // outline
  g.lineWidth = Math.max(1.5, s * 0.15);
  g.strokeStyle = 'rgba(255,255,255,0.85)';
  g.stroke();

  g.restore();
}

function drawSoftPinkFrame(main, w, h){
  const CARD_SCALE = 0.55;
  const CARD_W = Math.round(w * CARD_SCALE);
  const OUTSET_Y = 10;

  const OUTSET_X = Math.round((w - CARD_W) / 2);
  const BORDER = Math.round(CARD_W * 0.10);

  const outer = {
    x: OUTSET_X,
    y: OUTSET_Y,
    w: CARD_W,
    h: h - OUTSET_Y * 2,
    r: 0
  };
  const inner = {
    x: outer.x + BORDER,
    y: outer.y + BORDER,
    w: outer.w - BORDER * 2,
    h: outer.h - BORDER * 2,
    r: 0
  };

  drawRingOnMain(main, outer, inner, (g) => {
    // base card
    roundRectPath(g, outer.x, outer.y, outer.w, outer.h, 0);
    g.fillStyle = softPinkFrameFill();
    g.shadowColor = 'rgba(0,0,0,0.10)';
    g.shadowBlur = 12;
    g.shadowOffsetY = 6;
    g.fill();
    g.shadowBlur = 0;
    g.shadowOffsetY = 0;

    // inner white border
    g.save();
    roundRectPath(g, inner.x, inner.y, inner.w, inner.h, 0);
    g.strokeStyle = 'rgba(255,255,255,0.95)';
    g.lineWidth = Math.max(3, w * 0.004);
    g.stroke();
    g.restore();

    if (!bowReady || !bowImg) return;

    // is this point inside the photo area?
    function inInner(px, py){
      return (
        px > inner.x &&
        px < inner.x + inner.w &&
        py > inner.y &&
        py < inner.y + inner.h
      );
    }

    function placeBows(count, region){
      for (let i = 0; i < count; i++){
        const sizeW = Math.random() * (w * 0.06) + (w * 0.04);
        const sizeH = sizeW * (bowImg.height / bowImg.width);

        let px, py, safe = false;

        for (let t = 0; t < 80; t++){
          px = region.x1 + Math.random() * (region.x2 - region.x1);
          py = region.y1 + Math.random() * (region.y2 - region.y1);

          if (!inInner(px, py)){
            safe = true;
            break;
          }
        }
        if (!safe) continue;

        const rot = (Math.random() - 0.5) * 0.6;

        g.save();
        g.translate(px, py);
        g.rotate(rot);
        g.drawImage(bowImg, -sizeW / 2, -sizeH / 2, sizeW, sizeH);
        g.restore();
      }
    }
    

    // 🔴 BIGGER, MORE DIAGONAL REGIONS

    // Top cluster: spans most of the top edge and right side
    const rightTopBand = {
      x1: outer.x + outer.w * 0.15,           // reach toward top-left
      x2: outer.x + outer.w - 5,              // full right edge
      y1: outer.y + 5,                        // very top
      y2: outer.y + outer.h * 0.90            // goes far down on the right
    };

    // Bottom cluster: spans most of the bottom edge and left side
    const leftBottomBand = {
      x1: outer.x + 5,                         // full left edge
      x2: outer.x + outer.w * 0.85,           // reach toward bottom-right
      y1: outer.y + outer.h * 0.30,           // comes up toward mid
      y2: outer.y + outer.h - 5               // very bottom
    };

    placeBows(20, rightTopBand);
    placeBows(20, leftBottomBand);

    // ✨ GOLD SPARKLES ✨
function placeSparkles(count, region){
  for (let i = 0; i < count; i++){
    let px, py, safe = false;

    for (let t = 0; t < 60; t++){
      px = region.x1 + Math.random()* (region.x2 - region.x1);
      py = region.y1 + Math.random()* (region.y2 - region.y1);

      if (!inInner(px, py)){
        safe = true;
        break;
      }
    }
    if (!safe) continue;

    const size = Math.random() * 5 + 6;
    const rot = Math.random() * Math.PI;

    goldSparkle(g, px, py, size, rot);
  }
}

// add sparkles to SAME two regions as bows
placeSparkles(5, rightTopBand);
placeSparkles(5, leftBottomBand);

  });
}




function drawPeaceFrame(main, w, h){
  const CARD_SCALE = 0.55;
  const CARD_W = Math.round(w * CARD_SCALE);
  const OUTSET_Y = 10;
  const OUT_R = 0;

  const OUTSET_X = Math.round((w - CARD_W) / 2);
  const BORDER = Math.round(CARD_W * 0.10);
  const IN_R = 0;

  const outer = {
    x: OUTSET_X,
    y: OUTSET_Y,
    w: CARD_W,
    h: h - OUTSET_Y * 2,
    r: OUT_R
  };
  const inner = {
    x: outer.x + BORDER,
    y: outer.y + BORDER,
    w: outer.w - BORDER * 2,
    h: outer.h - BORDER * 2,
    r: IN_R
  };

  drawRingOnMain(main, outer, inner, (g) => {
    g.beginPath();
    g.rect(outer.x, outer.y, outer.w, outer.h);
    g.fillStyle = '#FFFFFF';
    g.shadowColor = 'rgba(0,0,0,0.12)';
    g.shadowBlur = 14;
    g.shadowOffsetY = 7;
    g.fill();
    g.shadowBlur = 0;
    g.shadowOffsetY = 0;

    g.beginPath();
    g.rect(outer.x, outer.y, outer.w, outer.h);
    g.fillStyle = (peacePatternReady && peaceTile)
      ? g.createPattern(peaceTile, 'repeat')
      : '#4A0E2B';
    g.fill();

    g.save();
    g.beginPath();
    g.rect(inner.x, inner.y, inner.w, inner.h);
    g.strokeStyle = '#FFE6C9';
    g.lineWidth = Math.max(2, w * 0.003);
    g.stroke();
    g.restore();
  });
}

function drawYoursFrame(main, w, h){
  const CARD_SCALE = 0.55;
  const CARD_W = Math.round(w * CARD_SCALE);
  const OUTSET_Y = 10;
  const OUT_R = 0;

  const OUTSET_X = Math.round((w - CARD_W) / 2);
  const BORDER = Math.round(CARD_W * 0.10);
  const IN_R = 0;

  const outer = {
    x: OUTSET_X,
    y: OUTSET_Y,
    w: CARD_W,
    h: h - OUTSET_Y * 2,
    r: OUT_R
  };
  const inner = {
    x: outer.x + BORDER,
    y: outer.y + BORDER,
    w: outer.w - BORDER * 2,
    h: outer.h - BORDER * 2,
    r: IN_R
  };

  drawRingOnMain(main, outer, inner, (g) => {
    // base red card with soft shadow
    roundRectPath(g, outer.x, outer.y, outer.w, outer.h, outer.r);
    g.fillStyle = '#b91c1c'; // rich red
    g.shadowColor = 'rgba(0,0,0,0.20)';
    g.shadowBlur = 18;
    g.shadowOffsetY = 8;
    g.fill();
    g.shadowBlur = 0;
    g.shadowOffsetY = 0;

    // text pattern: "yours" tiled all over
    const fontSize = Math.round(w * 0.025); // scales with canvas
    g.font = `italic ${fontSize}px "Playfair Display", "Times New Roman", serif`;
    g.fillStyle = 'rgba(255,255,255,0.92)';
    g.textAlign = 'center';
    g.textBaseline = 'middle';

    const stepX = fontSize * 3.0;
    const stepY = fontSize * 2.2;

    for (let y = outer.y - stepY; y < outer.y + outer.h + stepY; y += stepY){
      for (let x = outer.x - stepX; x < outer.x + outer.w + stepX; x += stepX){
        g.save();
        g.translate(x, y);

        // slight alternating tilt so it's not perfectly straight
        const seed = Math.floor((x + y) / (stepX + stepY));
        const tilt = (seed % 2 === 0) ? -0.18 : 0.18;

        g.rotate(tilt);
        g.fillText('yours', 0, 0);
        g.restore();
      }
    }

    // inner border around the photo area
    g.save();
    roundRectPath(g, inner.x, inner.y, inner.w, inner.h, inner.r);
    g.strokeStyle = 'rgba(255,255,255,0.96)';
    g.lineWidth = Math.max(2, w * 0.003);
    g.stroke();
    g.restore();
  });
}


// ------------------------------------------------------------------
// Template grid
function buildTemplateGrid() {
  const grid = document.getElementById('templateGrid');
  FRAMES.forEach(f => {
    const card = document.createElement('button');
    card.className = 'template-card';
    card.type = 'button';

    const tw = 210, th = 280;
    const thumb = document.createElement('canvas');
    thumb.className = 'template-thumb';
    thumb.width = tw; thumb.height = th;
    const g = thumb.getContext('2d');

    const m = Math.round(tw * 0.08);
    const ph = { x: m, y: m, w: tw - m*2, h: th - m*2 };
    g.fillStyle = '#dfe8ff';
    g.fillRect(ph.x, ph.y, ph.w, ph.h);

    f.draw(g, tw, th, ph);

    const name = document.createElement('div');
    name.className = 'template-name';
    name.textContent = f.name;

    const desc = document.createElement('div');
    desc.className = 'template-desc';
    desc.textContent = f.desc;

    card.appendChild(thumb);
    card.appendChild(name);
    card.appendChild(desc);

    card.addEventListener('click', () => {
      currentFrame = f.id;
      [...grid.children].forEach(el => el.classList.remove('active'));
      card.classList.add('active');
      render();
    });

    if (f.id === currentFrame) card.classList.add('active');
    grid.appendChild(card);
  });
}

// ------------------------------------------------------------------
// ✅ Initialization
document.addEventListener('DOMContentLoaded', () => {
  const backBtn = document.getElementById('backBtn');
  const nextBtn = document.getElementById('nextBtn');

  if (backBtn) {
    backBtn.addEventListener('click', () => {
      history.length > 1 ? history.back() : (window.location.href = 'camera.html');
    });
  }

  if (nextBtn) {
    nextBtn.addEventListener('click', () => {
      try { localStorage.setItem('decorFrame', currentFrame); } catch {}

      try {
        const stripSrc = localStorage.getItem('photoStrip') || '';
        localStorage.setItem('photoStrip_backup', stripSrc);
      } catch {}

      try {
        const out = cvs.toDataURL('image/jpeg', 0.92);
        localStorage.setItem('decoratedPhoto', out);
      } catch (e) {
        console.warn('decorate: toDataURL/store failed:', e);
        try { localStorage.setItem('decoratedPhoto', ''); } catch {}
      } finally {
        window.location.href = 'stickers.html';
      }
    });
  }

  const src = localStorage.getItem('photoStrip') || sessionStorage.getItem('photoStrip');
  if (!src) { window.location.href = 'camera.html'; return; }

  const img = new Image();
  img.onload = () => {
    photoStripImg = img;
    loadPeacePattern(() => {
      loadBowImage(() => {
        buildTemplateGrid();
        render();
      });
    });
  };
  img.src = src;
});
