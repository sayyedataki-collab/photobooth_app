// final.js — compose chosen layout + big SVG stickers + download

const WIDTH = 1176, HEIGHT = 1470, HALF = HEIGHT / 2;

// ---- DOM
const canvas = document.getElementById('finalCanvas');
const ctx = canvas.getContext('2d');
const layoutSelect = document.getElementById('layoutSelect');
const downloadBtn = document.getElementById('downloadBtn');
const homeBtn = document.getElementById('homeBtn');
const resetBtn = document.getElementById('reset');
const stickerBtns = document.querySelectorAll('.sticker-btn');

// ---- load photos from localStorage
const photoTopURL = localStorage.getItem('photoTop');
const photoBottomURL = localStorage.getItem('photoBottom');

if (!photoTopURL || !photoBottomURL) {
  alert('No photos found. Please take or upload two photos first.');
}

const photoTop = new Image();
const photoBottom = new Image();
photoTop.src = photoTopURL || '';
photoBottom.src = photoBottomURL || '';

let stickers = []; // {img, x,y,w,h, dragging}
let selected = null, dragOffset = {x:0,y:0};

// ---------- Layout drawing (no external images)
function drawLayoutFrame(kind) {
  // white base
  ctx.fillStyle = '#fff';
  ctx.fillRect(0,0,WIDTH,HEIGHT);

  // place the two photos
  ctx.drawImage(photoTop, 0, 0, WIDTH, HALF);
  ctx.drawImage(photoBottom, 0, HALF, WIDTH, HALF);

  // frames by style
  if (kind === 'plain') {
    // thin border
    ctx.strokeStyle = 'rgba(0,0,0,0.1)';
    ctx.lineWidth = 12;
    ctx.strokeRect(6,6, WIDTH-12, HEIGHT-12);

  } else if (kind === 'pinkSides') {
    // soft pink side bars
    const grdTop = ctx.createLinearGradient(0, 0, WIDTH, 0);
    grdTop.addColorStop(0, '#FFC8DD');
    grdTop.addColorStop(1, '#BDE0FE');

    ctx.fillStyle = grdTop;
    ctx.fillRect(0, 0, 60, HEIGHT);
    ctx.fillRect(WIDTH-60, 0, 60, HEIGHT);

    // subtle inner stroke
    ctx.strokeStyle = 'rgba(0,0,0,0.08)';
    ctx.lineWidth = 10;
    ctx.strokeRect(5,5, WIDTH-10, HEIGHT-10);

  } else if (kind === 'film') {
    // black film border + perforations
    ctx.fillStyle = '#111';
    ctx.fillRect(0, 0, WIDTH, 50);
    ctx.fillRect(0, HEIGHT-50, WIDTH, 50);
    ctx.fillRect(0, 0, 40, HEIGHT);
    ctx.fillRect(WIDTH-40, 0, 40, HEIGHT);

    // sprocket holes on sides
    ctx.fillStyle = '#eee';
    const holeW = 18, holeH = 40, gap = 28;
    for (let y=60; y<HEIGHT-60; y+= (holeH+gap)) {
      ctx.fillRect(10, y, holeW, holeH);
      ctx.fillRect(WIDTH-10-holeW, y, holeW, holeH);
    }

  } else if (kind === 'cuteGradient') {
    // rounded outer stroke + gradient overlay
    const rad = 28;
    roundRect(ctx, 6, 6, WIDTH-12, HEIGHT-12, rad, 'stroke', '#e3e3e3', 12);

    const g = ctx.createLinearGradient(0,0,WIDTH,HEIGHT);
    g.addColorStop(0, 'rgba(205,180,219,0.15)'); // lav
    g.addColorStop(1, 'rgba(189,224,254,0.15)'); // sky
    ctx.fillStyle = g;
    roundRect(ctx, 12, 12, WIDTH-24, HEIGHT-24, rad-8, 'fill');
  }
}

function roundRect(ctx, x, y, w, h, r, mode='fill', color='#000', lw=2) {
  ctx.beginPath();
  ctx.moveTo(x+r, y);
  ctx.arcTo(x+w, y, x+w, y+h, r);
  ctx.arcTo(x+w, y+h, x, y+h, r);
  ctx.arcTo(x, y+h, x, y, r);
  ctx.arcTo(x, y, x+w, y, r);
  ctx.closePath();
  if (mode === 'fill') {
    ctx.fill();
  } else {
    ctx.strokeStyle = color;
    ctx.lineWidth = lw;
    ctx.stroke();
  }
}

// ---------- Stickers (SVG -> dataURL)
const svgMap = {
  mustache: `
  <svg xmlns="http://www.w3.org/2000/svg" width="800" height="250" viewBox="0 0 800 250">
    <path d="M50 140c60-90 170-90 230 0 25-35 55-55 120-55 65 0 95 20 120 55 60-90 170-90 230 0-40 30-90 30-140 0-20 35-60 65-120 65-60 0-100-30-120-65-20 35-60 65-120 65-60 0-100-30-120-65-50 30-100 30-140 0z" fill="#222"/>
  </svg>`,
  glassesRound: `
  <svg xmlns="http://www.w3.org/2000/svg" width="900" height="280" viewBox="0 0 900 280">
    <rect x="420" y="120" width="60" height="20" rx="10" fill="#222"/>
    <circle cx="280" cy="160" r="110" fill="none" stroke="#222" stroke-width="20"/>
    <circle cx="620" cy="160" r="110" fill="none" stroke="#222" stroke-width="20"/>
    <path d="M30 160 H170" stroke="#222" stroke-width="20" stroke-linecap="round"/>
    <path d="M730 160 H870" stroke="#222" stroke-width="20" stroke-linecap="round"/>
  </svg>`,
  glassesRect: `
  <svg xmlns="http://www.w3.org/2000/svg" width="900" height="280" viewBox="0 0 900 280">
    <rect x="420" y="120" width="60" height="20" rx="8" fill="#222"/>
    <rect x="170" y="80" width="220" height="160" rx="22" fill="none" stroke="#222" stroke-width="20"/>
    <rect x="510" y="80" width="220" height="160" rx="22" fill="none" stroke="#222" stroke-width="20"/>
    <path d="M30 160 H150" stroke="#222" stroke-width="20" stroke-linecap="round"/>
    <path d="M750 160 H870" stroke="#222" stroke-width="20" stroke-linecap="round"/>
  </svg>`,
  glassesHeart: `
  <svg xmlns="http://www.w3.org/2000/svg" width="980" height="320" viewBox="0 0 980 320">
    <rect x="460" y="150" width="60" height="20" rx="10" fill="#222"/>
    <path d="M175 180c-50-60 30-120 90-50 60-70 140-10 90 50-30 35-90 85-90 85s-60-50-90-85z"
          fill="none" stroke="#222" stroke-width="20"/>
    <path d="M625 180c-50-60 30-120 90-50 60-70 140-10 90 50-30 35-90 85-90 85s-60-50-90-85z"
          fill="none" stroke="#222" stroke-width="20"/>
    <path d="M30 190 H150" stroke="#222" stroke-width="20" stroke-linecap="round"/>
    <path d="M830 190 H950" stroke="#222" stroke-width="20" stroke-linecap="round"/>
  </svg>`
};

function svgToDataURL(svg) {
  const encoded = encodeURIComponent(svg).replace(/'/g, '%27').replace(/"/g, '%22');
  return `data:image/svg+xml;charset=utf-8,${encoded}`;
}

function addSticker(name) {
  const url = svgToDataURL(svgMap[name]);
  const img = new Image();
  img.onload = () => {
    const w = img.width / 2.2;
    const h = img.height / 2.2;
    const s = { img, x: WIDTH/2 - w/2, y: HALF - h/2, w, h, dragging:false };
    stickers.push(s);
    render();
  };
  img.src = url;
}

// ---------- Interactions (drag)
function getPointerPos(e) {
  const rect = canvas.getBoundingClientRect();
  const scaleX = canvas.width / rect.width, scaleY = canvas.height / rect.height;
  const cx = e.touches?.[0]?.clientX ?? e.clientX;
  const cy = e.touches?.[0]?.clientY ?? e.clientY;
  return { x: (cx - rect.left) * scaleX, y: (cy - rect.top) * scaleY };
}

function pointerDown(e) {
  const p = getPointerPos(e);
  for (let i = stickers.length - 1; i >= 0; i--) {
    const s = stickers[i];
    if (p.x >= s.x && p.x <= s.x + s.w && p.y >= s.y && p.y <= s.y + s.h) {
      selected = s; s.dragging = true;
      dragOffset.x = p.x - s.x; dragOffset.y = p.y - s.y;
      stickers.splice(i,1); stickers.push(s); // bring to front
      render();
      e.preventDefault(); break;
    }
  }
}
function pointerMove(e) {
  if (!selected?.dragging) return;
  const p = getPointerPos(e);
  selected.x = p.x - dragOffset.x;
  selected.y = p.y - dragOffset.y;
  render();
  e.preventDefault();
}
function pointerUp(){ if (selected){ selected.dragging = false; } selected=null; }

// ---------- Render
function render() {
  drawLayoutFrame(layoutSelect.value);
  stickers.forEach(s => ctx.drawImage(s.img, s.x, s.y, s.w, s.h));
}

// ---------- Events
layoutSelect.addEventListener('change', render);
stickerBtns.forEach(b => b.addEventListener('click', () => addSticker(b.dataset.sticker)));
resetBtn.addEventListener('click', () => { stickers = []; render(); });

canvas.addEventListener('mousedown', pointerDown);
canvas.addEventListener('mousemove', pointerMove);
canvas.addEventListener('mouseup', pointerUp);
canvas.addEventListener('mouseleave', pointerUp);

canvas.addEventListener('touchstart', pointerDown, {passive:false});
canvas.addEventListener('touchmove',  pointerMove, {passive:false});
canvas.addEventListener('touchend',   pointerUp);
canvas.addEventListener('touchcancel',pointerUp);

downloadBtn.addEventListener('click', () => {
  canvas.toBlob(blob => {
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'vibebooth.png';
    a.click();
  }, 'image/png');
});

homeBtn.addEventListener('click', () => window.location.href = 'index.html');

document.addEventListener('DOMContentLoaded', () => {
  const logo = document.querySelector('.logo');
  if (logo) logo.addEventListener('click', () => window.location.href = 'index.html');
});

// once both photos load, draw
let loaded = 0;
[photoTop, photoBottom].forEach(img => img.onload = () => { loaded++; if (loaded === 2) render(); });
