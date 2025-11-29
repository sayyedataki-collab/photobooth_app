// ===== VibeBooth • Stickers (images + emoji as movable stickers; DPR-safe; undo/redo) =====

// --- Logical canvas size (same as decorate) ---
const LOGICAL_W = 950, LOGICAL_H = 1470;

// --- Pattern asset (relative to the PAGE, not the script) ---
const PEACE_PATTERN_URL = new URL('./assets/peace.png', document.baseURI).href;

// --- DOM ---
const cvs = document.getElementById('finalCanvas');
const ctx = cvs.getContext('2d', { alpha: true });

// ==========================
// Hi-DPI: scale backing store
// ==========================
function fitCanvasToDPR(canvas, context){
  const dpr = Math.max(1, window.devicePixelRatio || 1);
  const targetW = Math.round(LOGICAL_W * dpr);
  const targetH = Math.round(LOGICAL_H * dpr);
  if (canvas.width !== targetW || canvas.height !== targetH){
    canvas.width = targetW; canvas.height = targetH;
  }
  // draw in logical units
  context.setTransform(dpr, 0, 0, dpr, 0, 0);
}
fitCanvasToDPR(cvs, ctx);
window.addEventListener('resize', () => fitCanvasToDPR(cvs, ctx));

// ==========================
// Shared helpers (match decorate.js)
// ==========================
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
  off.width = cvs.width;  // DPR backing store
  off.height = cvs.height;
  const g = off.getContext('2d');

  const dpr = Math.max(1, window.devicePixelRatio || 1);
  g.setTransform(dpr, 0, 0, dpr, 0, 0);

  g.save();
  if (!outer.r) { g.beginPath(); g.rect(outer.x, outer.y, outer.w, outer.h); }
  else          { roundRectPath(g, outer.x, outer.y, outer.w, outer.h, outer.r); }
  g.clip();
  paintRingFn(g);
  g.restore();

  // punch inner rect
  g.setTransform(1, 0, 0, 1, 0, 0);
  const cut = off.getContext('2d');
  const pxX = Math.round(inner.x * dpr), pxY = Math.round(inner.y * dpr);
  const pxW = Math.round(inner.w * dpr), pxH = Math.round(inner.h * dpr);
  cut.beginPath(); cut.rect(pxX, pxY, pxW, pxH); cut.fill();

  mainCtx.save();
  mainCtx.setTransform(1, 0, 0, 1, 0, 0);
  mainCtx.drawImage(off, 0, 0);
  mainCtx.restore();
}

// slimmed margins like decorate
const PHOTO_MARGIN_BASE = 0.028;
function photoRect(frameId){
  const base = Math.round(LOGICAL_W * PHOTO_MARGIN_BASE);
  const extraRetro  = frameId === 'retro'  ? Math.round(LOGICAL_W * 0.008) : 0;
  const extraHearts = frameId === 'hearts' ? Math.round(LOGICAL_W * 0.008) : 0;
  const m = base + extraRetro + extraHearts;
  return { x: m, y: m, w: LOGICAL_W - m * 2, h: LOGICAL_H - m * 2 };
}

// ==========================
// Peace pattern loader (with fallback tile)
// ==========================
let peaceTile = null;
let peaceReady = false;
let PEACE_PATTERN_SCALE = 0.9;

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
function buildPeaceFallbackTile(){
  const s = 32, off = document.createElement('canvas');
  off.width = s; off.height = s;
  const g = off.getContext('2d');
  g.fillStyle = '#e9d7ff'; g.fillRect(0,0,s,s);
  g.strokeStyle = '#6b21a8'; g.lineWidth = 6;
  g.beginPath(); g.moveTo(-8, 8); g.lineTo(40, 56);
  g.moveTo(-8,-8); g.lineTo(40, 40);
  g.stroke();
  return off;
}
function loadPeacePattern(cb){
  if (peaceReady && peaceTile) { cb?.(); return; }
  const img = new Image(); // same-origin
  img.onload  = () => { peaceTile = buildPeaceTileFrom(img); peaceReady = true; cb?.(); };
  img.onerror = () => { peaceTile = buildPeaceFallbackTile();  peaceReady = true; cb?.(); };
  img.src = PEACE_PATTERN_URL + `?v=${Date.now()}`;
}

// ==========================
// Peace rebuild on this page
// ==========================
function drawPeaceOnCanvas(stripImg){
  const ph = photoRect('peace');
  const GAP = Math.max(10, Math.round(ph.h * 0.035));
  const halfH = Math.floor((ph.h - GAP) / 2);
  const srcW = stripImg.width, srcH = stripImg.height, srcHalfH = Math.floor(srcH / 2);

  // middle gap in warm peach
  ctx.fillStyle = '#FFB07C';
  ctx.fillRect(ph.x, ph.y + halfH, ph.w, GAP);

  // photos
  ctx.drawImage(stripImg, 0, 0, srcW, srcHalfH, ph.x, ph.y, ph.w, halfH);
  ctx.drawImage(stripImg, 0, srcHalfH, srcW, srcHalfH, ph.x, ph.y + halfH + GAP, ph.w, halfH);

  // ring geometry
  const OUTSET = 0, OUT_R = 0, BORDER = Math.round(LOGICAL_W * 0.09), IN_R = 0;
  const outer = { x: OUTSET, y: OUTSET, w: LOGICAL_W - OUTSET*2, h: LOGICAL_H - OUTSET*2, r: OUT_R };
  const inner = { x: outer.x + BORDER, y: outer.y + BORDER, w: outer.w - BORDER*2, h: outer.h - BORDER*2, r: IN_R };

  drawRingOnMain(ctx, outer, inner, (g) => {
    // soft white plate + shadow
    g.beginPath(); g.rect(outer.x, outer.y, outer.w, outer.h);
    g.fillStyle = '#FFFFFF';
    g.shadowColor = 'rgba(0,0,0,0.12)'; g.shadowBlur = 14; g.shadowOffsetY = 7; g.fill();
    g.shadowBlur = 0; g.shadowOffsetY = 0;

    // CORAL GRADIENT base for Peace
    const grad = g.createLinearGradient(0, outer.y, 0, outer.y + outer.h);
    grad.addColorStop(0.00, '#FFB07C'); // peach
    grad.addColorStop(0.50, '#E24E42'); // coral red
    grad.addColorStop(1.00, '#4A1F3D'); // deep plum
    g.beginPath(); g.rect(outer.x, outer.y, outer.w, outer.h);
    g.fillStyle = grad;
    g.fill();

    // (optional) lay the peace pattern on top with some transparency
    if (peaceReady && peaceTile) {
      g.save();
      g.globalAlpha = 0.85;
      g.beginPath(); g.rect(outer.x, outer.y, outer.w, outer.h);
      g.fillStyle = g.createPattern(peaceTile, 'repeat');
      g.fill();
      g.restore();
    }

    // inner cream stroke
    g.save();
    g.beginPath(); g.rect(inner.x, inner.y, inner.w, inner.h);
    g.strokeStyle = '#FFE6C9';
    g.lineWidth = Math.max(2, LOGICAL_W * 0.003);
    g.stroke();
    g.restore();
  });
}

// simple fallback (show raw strip)
function drawRawStrip(stripImg){
  ctx.clearRect(0,0,LOGICAL_W,LOGICAL_H);
  const ph = photoRect('retro');
  ctx.drawImage(stripImg, 0, 0, stripImg.width, stripImg.height, ph.x, ph.y, ph.w, ph.h);
}

// ==========================
// Sticker catalog (your image stickers) + emoji support
// ==========================
const ASSET_BASE = new URL('./assets/stickers/', document.baseURI).href;
const IMG_CACHE = Object.create(null);

const FACE_STICKERS = [
  { src:'heart.png',     label:'Heart Glasses', widthFrac:0.48 },
  { src:'moustache.png', label:'Moustache',     widthFrac:0.36 },
  { src:'hat.png',       label:'Top Hat',       widthFrac:0.44 },
  { src:'bow.png',       label:'Red Bow',       widthFrac:0.30 },
  { src:'bunny.png',     label:'Bunny Ears',    widthFrac:0.46 },
];

function loadImage(relPath){
  return new Promise((resolve, reject) => {
    const url = ASSET_BASE + relPath;
    if (IMG_CACHE[url]) return resolve(IMG_CACHE[url]);
    const img = new Image();
    img.onload = () => { IMG_CACHE[url] = img; resolve(img); };
    img.onerror = reject;
    img.src = url + `?v=${Date.now()}`;
  });
}

// --- state for stickers + history ---
const STATE = {
  baseBitmap: null,
  stickers: [], // {kind:'img'|'emoji', ...}
  selectedIndex: -1,
  dragging: false,
  rotating: false,
  dragStart: { x:0, y:0, rotStart:0, angleStart:0, sx:0, sy:0 },
  history: [],
  future: [],
};

function captureBaseLayer(){
  STATE.baseBitmap = null;
  try { createImageBitmap(cvs).then(bmp => { STATE.baseBitmap = bmp; redraw(); }); }
  catch { redraw(); }
}

function redraw(){
  // keep DPR consistent to avoid tiling/duplication
  fitCanvasToDPR(cvs, ctx);

  ctx.clearRect(0, 0, LOGICAL_W, LOGICAL_H);
  if (STATE.baseBitmap){
    ctx.drawImage(STATE.baseBitmap, 0, 0, LOGICAL_W, LOGICAL_H);
  }
  for (let i=0;i<STATE.stickers.length;i++){
    drawSticker(STATE.stickers[i], i === STATE.selectedIndex);
  }
}

function drawSticker(st, isSelected){
  ctx.save();
  ctx.translate(st.x, st.y);
  ctx.rotate(st.rot || 0);

  if (st.kind === 'emoji'){
    const px = st.base * st.scale;
    ctx.font = `bold ${px}px "Apple Color Emoji","Segoe UI Emoji",system-ui,sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(st.label, 0, 0);
    if (isSelected){
      const r = px * 0.6;
      ctx.beginPath(); ctx.arc(0,0,r,0,Math.PI*2);
      ctx.strokeStyle = 'rgba(0,0,0,.25)'; ctx.lineWidth = 2; ctx.stroke();
    }
  } else if (st.kind === 'img' && st.img){
    const w = st.w * st.scale, h = st.h * st.scale;
    ctx.imageSmoothingEnabled = true;
    ctx.drawImage(st.img, -w/2, -h/2, w, h);
    if (isSelected){
      ctx.strokeStyle = 'rgba(0,0,0,.25)'; ctx.lineWidth = 2;
      ctx.strokeRect(-w/2, -h/2, w, h);
    }
  }

  ctx.restore();
}

function canvasPoint(evt){
  const rect = cvs.getBoundingClientRect();
  const x = (evt.clientX - rect.left) * (LOGICAL_W / rect.width);
  const y = (evt.clientY - rect.top)  * (LOGICAL_H / rect.height);
  return { x, y };
}

function hitTest(x, y){
  for (let i = STATE.stickers.length - 1; i >= 0; i--){
    const st = STATE.stickers[i];
    const dx = x - st.x, dy = y - st.y;
    const a = -(st.rot || 0);
    const rx = dx * Math.cos(a) - dy * Math.sin(a);
    const ry = dx * Math.sin(a) + dy * Math.cos(a);
    if (st.kind === 'emoji'){
      const r = st.base * st.scale * 0.6;
      if (rx*rx + ry*ry <= r*r) return i;
    } else {
      const w = st.w * st.scale, h = st.h * st.scale;
      if (rx >= -w/2 && rx <= w/2 && ry >= -h/2 && ry <= h/2) return i;
    }
  }
  return -1;
}

function pushHistory(){
  STATE.history.push(JSON.stringify(STATE.stickers, (k,v)=>(k==='img'?undefined:v)));
  if (STATE.history.length > 60) STATE.history.shift();
  STATE.future.length = 0;
  updateUndoRedoButtons();
}

function applySnapshot(json){
  try { STATE.stickers = JSON.parse(json) || []; } catch { STATE.stickers = []; }
  // relink images
  STATE.stickers.forEach(async (st) => {
    if (st.kind === 'img' && st.src && !st.img){
      try { st.img = await loadImage(st.src); redraw(); } catch {}
    }
  });
  STATE.selectedIndex = -1;
  redraw(); updateUndoRedoButtons();
}

function updateUndoRedoButtons(){
  const undoBtn = document.getElementById('undoBtn');
  const redoBtn = document.getElementById('redoBtn');
  if (undoBtn) undoBtn.disabled = STATE.history.length === 0;
  if (redoBtn) redoBtn.disabled = STATE.future.length === 0;
}

// add image sticker
async function addImageSticker(src, nominalWidthFrac){
  const img = await loadImage(src);
  const w = LOGICAL_W * nominalWidthFrac;
  const h = w * (img.height / img.width);
  const st = { kind:'img', img, src, w, h, x: LOGICAL_W/2, y: LOGICAL_H/2, scale:1, rot:0 };
  STATE.stickers.push(st);
  STATE.selectedIndex = STATE.stickers.length - 1;
  pushHistory();
  redraw();
}

// add emoji sticker
function addEmojiSticker(label){
  const base = Math.round(LOGICAL_W * 0.18); // base font size
  const st = { kind:'emoji', label, base, x: LOGICAL_W/2, y: LOGICAL_H/2, scale:1, rot:0 };
  STATE.stickers.push(st);
  STATE.selectedIndex = STATE.stickers.length - 1;
  pushHistory();
  redraw();
}

// ==========================
// Load saved / fallback, then UI hooks
// ==========================
document.addEventListener('DOMContentLoaded', () => {
  // ---- Load base image
  const saved = localStorage.getItem('decoratedPhoto');
  const frame = localStorage.getItem('decorFrame') || 'retro';
  const fallbackStrip = localStorage.getItem('photoStrip_backup') || localStorage.getItem('photoStrip');

  if (saved && saved.startsWith('data:image/')) {
    const img = new Image();
    img.onload = () => {
      ctx.clearRect(0,0,LOGICAL_W,LOGICAL_H);
      ctx.drawImage(img, 0, 0, LOGICAL_W, LOGICAL_H);
      captureBaseLayer();
    };
    img.src = saved;
  } else if (fallbackStrip) {
    const strip = new Image();
    strip.onload = () => {
      ctx.clearRect(0,0,LOGICAL_W,LOGICAL_H);
      if (frame === 'peace') {
        loadPeacePattern(() => { drawPeaceOnCanvas(strip); captureBaseLayer(); });
      } else {
        drawRawStrip(strip); captureBaseLayer();
      }
    };
    strip.src = fallbackStrip;
  } else {
    window.location.href = 'camera.html';
    return;
  }

  // ---- Toolbar buttons
  const backBtn = document.getElementById('backBtn');
  const dlBtn   = document.getElementById('downloadBtn');
  const undoBtn = document.getElementById('undoBtn');
  const redoBtn = document.getElementById('redoBtn');
  const clearBtn= document.getElementById('clearBtn');

  if (backBtn) backBtn.addEventListener('click', () => {
    history.length > 1 ? history.back() : (window.location.href = 'decorate.html');
  });

  if (dlBtn) dlBtn.addEventListener('click', () => {
    try{
      const data = cvs.toDataURL('image/jpeg', 0.95);
      const a = document.createElement('a');
      a.href = data; a.download = 'vibebooth-strip.jpg';
      document.body.appendChild(a); a.click(); a.remove();
    }catch(e){ alert('Download failed: '+e.message); }
  });

  if (undoBtn) undoBtn.addEventListener('click', () => {
    if (!STATE.history.length) return;
    const cur = JSON.stringify(STATE.stickers, (k,v)=>(k==='img'?undefined:v));
    STATE.future.push(cur);
    const prev = STATE.history.pop();
    applySnapshot(prev);
  });
  if (redoBtn) redoBtn.addEventListener('click', () => {
    if (!STATE.future.length) return;
    const cur = JSON.stringify(STATE.stickers, (k,v)=>(k==='img'?undefined:v));
    STATE.history.push(cur);
    const next = STATE.future.pop();
    applySnapshot(next);
  });
  if (clearBtn){
    clearBtn.addEventListener('click', () => {
      STATE.stickers = [];
      STATE.selectedIndex = -1;
      pushHistory();
      redraw();
    });
  }

  // ---- Add our face-accessory tiles ONCE
  const grid = document.getElementById('stickerGrid');
  if (grid && grid.dataset.extraLoaded !== "1"){
    grid.dataset.extraLoaded = "1";
    FACE_STICKERS.forEach(item => {
      const btn = document.createElement('button');
      btn.className = 'tile';
      btn.dataset.sticker = 'img:' + item.src;

      const img = document.createElement('img');
      img.alt = item.label;
      img.loading = 'lazy';
      img.src = ASSET_BASE + item.src;
      img.style.maxWidth = '70%';
      img.style.maxHeight = '70%';
      btn.appendChild(img);

      btn.title = item.label;
      grid.appendChild(btn);
    });
  }

  // ---- ONE unified click handler for ALL tiles (your original emoji + our images)
  if (grid){
    grid.addEventListener('click', async (e) => {
      const btn = e.target.closest('.tile');
      if (!btn) return;

      const ds = btn.dataset.sticker || '';
      // if it's our image tile
      if (ds.startsWith('img:')){
        const src = ds.slice(4); // after 'img:'
        const meta = FACE_STICKERS.find(x => x.src === src);
        if (!meta) return;
        try { await addImageSticker(meta.src, meta.widthFrac); } 
        catch { alert('Could not load sticker: ' + (meta.label || src)); }
        return;
      }

      // else treat as EMOJI: use the button's text content
      const emoji = btn.textContent.trim();
      if (emoji) addEmojiSticker(emoji);
    });
  }

  // ---- Canvas interactions (drag / rotate with Alt / wheel to scale)
  cvs.addEventListener('mousedown', (e) => {
    const { x, y } = canvasPoint(e);
    const i = hitTest(x, y);
    if (i >= 0){
      STATE.selectedIndex = i;
      const st = STATE.stickers[i];
      const dx = x - st.x, dy = y - st.y;
      if (e.altKey){
        STATE.rotating = true;
        STATE.dragStart.angleStart = Math.atan2(dy, dx);
        STATE.dragStart.rotStart = st.rot || 0;
      } else {
        STATE.dragging = true;
        STATE.dragStart.sx = x - st.x;
        STATE.dragStart.sy = y - st.y;
      }
      redraw();
    } else {
      STATE.selectedIndex = -1;
      redraw();
    }
  });

  window.addEventListener('mousemove', (e) => {
    if (STATE.selectedIndex < 0) return;
    const st = STATE.stickers[STATE.selectedIndex];
    const { x, y } = canvasPoint(e);
    if (STATE.dragging){
      st.x = x - STATE.dragStart.sx;
      st.y = y - STATE.dragStart.sy;
      redraw();
    } else if (STATE.rotating){
      const ang = Math.atan2(y - st.y, x - st.x);
      st.rot = STATE.dragStart.rotStart + (ang - STATE.dragStart.angleStart);
      redraw();
    }
  });

  window.addEventListener('mouseup', () => {
    if (STATE.dragging || STATE.rotating){
      STATE.dragging = false;
      STATE.rotating = false;
      pushHistory();
    }
  });

  cvs.addEventListener('wheel', (e) => {
    if (STATE.selectedIndex < 0) return;
    e.preventDefault();
    const st = STATE.stickers[STATE.selectedIndex];
    const delta = Math.sign(e.deltaY);
    const factor = (delta > 0) ? 0.92 : 1.08;
    if (st.kind === 'emoji'){
      const min = 12, max = LOGICAL_W * 0.7;
      const next = Math.max(min, Math.min(max, st.base * st.scale * factor));
      st.scale = next / st.base;
    } else {
      const minW = 24, maxW = LOGICAL_W * 0.95;
      const nextW = Math.max(minW, Math.min(maxW, (st.w * st.scale) * factor));
      st.scale = nextW / st.w;
    }
    redraw();
    pushHistory();
  }, { passive:false });

  window.addEventListener('keydown', (e) => {
    if (STATE.selectedIndex < 0) return;
    const st = STATE.stickers[STATE.selectedIndex];
    const step = 6;
    if (e.key === 'Delete' || e.key === 'Backspace'){
      STATE.stickers.splice(STATE.selectedIndex, 1);
      STATE.selectedIndex = -1;
      pushHistory(); redraw(); e.preventDefault();
    } else if (['ArrowUp','ArrowDown','ArrowLeft','ArrowRight'].includes(e.key)){
      if (e.key === 'ArrowUp') st.y -= step;
      if (e.key === 'ArrowDown') st.y += step;
      if (e.key === 'ArrowLeft') st.x -= step;
      if (e.key === 'ArrowRight') st.x += step;
      redraw(); pushHistory(); e.preventDefault();
    } else if (e.key === '=' || e.key === '+'){ st.scale *= 1.06; redraw(); pushHistory(); e.preventDefault(); }
      else if (e.key === '-' || e.key === '_'){ st.scale *= 0.94; redraw(); pushHistory(); e.preventDefault(); }
      else if (e.key === '['){ st.rot -= Math.PI/90; redraw(); pushHistory(); e.preventDefault(); }
      else if (e.key === ']'){ st.rot += Math.PI/90; redraw(); pushHistory(); e.preventDefault(); }
  });
});
