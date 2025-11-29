// === VibeBooth Camera (crisp, 4 photos, tall thin strip, manual Continue) ===

const els = {
  booth: document.querySelector('.booth'),
  video: document.getElementById('liveVideo'),
  canvas: document.getElementById('finalCanvas'),
  countdown: document.getElementById('countdown'),
  captureBtn: document.getElementById('captureBtn'),
  retakeBtn: document.getElementById('retakeBtn'),
  continueBtn: document.getElementById('continueBtn'),
};
const ctx = els.canvas.getContext('2d');

// dynamic canvas pixel size (accounts for devicePixelRatio)
let CANVAS_W = 0, CANVAS_H = 0;
const NUM_SLOTS = 4;        // ⬅️ four photos now
let SLOT_H = 0;             // canvas height / 4
let photoStage = 0;         // 0,1,2,3 (done after 4)
let streamRef = null;

// Base capture resolution for quality (TALL & THIN)
const BASE_W = 900;   // narrower
const BASE_H = 2100;  // taller

function resizeCanvasToBooth() {
  const rect = els.booth.getBoundingClientRect();
  const dpr = window.devicePixelRatio || 1;

  const cssW = rect.width;
  const cssH = rect.height;

  const rawW = cssW * dpr;
  const rawH = cssH * dpr;

  // keep enough resolution compared to our BASE size
  const scale = Math.max(
    BASE_W / rawW,
    BASE_H / rawH,
    1
  );

  const w = Math.round(rawW * scale);
  const h = Math.round(rawH * scale);

  els.canvas.width  = w;
  els.canvas.height = h;

  els.canvas.style.width  = cssW + 'px';
  els.canvas.style.height = cssH + 'px';

  CANVAS_W = w;
  CANVAS_H = h;
  SLOT_H   = Math.floor(CANVAS_H / NUM_SLOTS);

  ctx.imageSmoothingEnabled = true;

  // keep live preview sized to correct slot
  placeVideoSlot(photoStage);
}

// Put the video in the nth quarter (0..3)
function placeVideoSlot(idx){
  const v = els.video;
  v.style.display = 'block';
  v.style.position = 'absolute';
  v.style.left = '0';
  v.style.right = '0';
  v.style.width  = '100%';
  v.style.height = (100 / NUM_SLOTS) + '%';   // 25% height
  v.style.top    = (idx * (100 / NUM_SLOTS)) + '%';

  els.booth.classList.add('is-live');
}

// 3-2-1 → then callback
function startCountdown(cb){
  const cd = els.countdown;
  let count = 3;
  cd.textContent = count;
  cd.style.display = 'flex';
  const id = setInterval(() => {
    count--;
    if (count > 0) {
      cd.textContent = count;
    } else {
      clearInterval(id);
      cd.style.display = 'none';
      cb();
    }
  }, 1000);
}

// center-crop source to target rect while preserving aspect
function computeCrop(srcW, srcH, targetW, targetH){
  const srcAspect = srcW / srcH;
  const targetAspect = targetW / targetH;
  let sx, sy, sw, sh;
  if (srcAspect > targetAspect){
    // crop width
    sh = srcH;
    sw = Math.round(targetAspect * sh);
    sx = Math.round((srcW - sw) / 2);
    sy = 0;
  } else {
    // crop height
    sw = srcW;
    sh = Math.round(sw / targetAspect);
    sx = 0;
    sy = Math.round((srcH - sh) / 2);
  }
  return { sx, sy, sw, sh };
}

// (placeholder if you ever want guides while shooting)
function drawFrameOverlay(){ /* no-op for now */ }

// Capture into current slot (0..3)
function capturePhoto(){
  const yOffset = photoStage * SLOT_H;
  const crop = computeCrop(
    els.video.videoWidth,
    els.video.videoHeight,
    CANVAS_W,
    SLOT_H
  );

  ctx.save();
  ctx.translate(CANVAS_W, 0); // mirror selfie
  ctx.scale(-1, 1);
  ctx.drawImage(
    els.video,
    crop.sx, crop.sy, crop.sw, crop.sh,
    0, yOffset, CANVAS_W, SLOT_H
  );
  ctx.restore();

  photoStage++;

  if (photoStage < NUM_SLOTS){
    // move preview to next slot
    placeVideoSlot(photoStage);
    els.captureBtn.disabled = false;
    els.retakeBtn.disabled  = false;
  } else {
    // finished all shots
    els.video.style.display = 'none';
    els.booth.classList.remove('is-live');
    drawFrameOverlay();
    els.continueBtn.disabled = false; // user taps Continue
  }
}

// Rounded-rect helper (if you want to add overlays later)
function roundRect(ctx, x, y, w, h, r){
  ctx.beginPath();
  ctx.moveTo(x+r, y);
  ctx.arcTo(x+w, y,   x+w, y+h, r);
  ctx.arcTo(x+w, y+h, x,   y+h, r);
  ctx.arcTo(x,   y+h, x,   y,   r);
  ctx.arcTo(x,   y,   x+w, y,   r);
  ctx.closePath();
}

// Continue → save to storage (JPEG) → go decorate
function continueToDecorate(){
  let data = '';
  try { data = els.canvas.toDataURL('image/jpeg', 0.92); }
  catch (e) { console.warn('toDataURL failed', e); }

  try {
    localStorage.setItem('photoStrip', data);
  } catch (e1) {
    console.warn('localStorage failed', e1);
    try { sessionStorage.setItem('photoStrip', data); }
    catch (e2) { console.warn('sessionStorage failed', e2); }
  }

  window.location.href = 'decorate.html';
}

// Reset
function retake(){
  ctx.clearRect(0, 0, CANVAS_W, CANVAS_H);
  photoStage = 0;
  placeVideoSlot(0);
  els.captureBtn.disabled = false;
  els.continueBtn.disabled = true;
}

// Init camera
async function initCamera(){
  try{
    const stream = await navigator.mediaDevices.getUserMedia({
      video: { width:{ ideal:2560 }, height:{ ideal:1440 }, facingMode:'user' },
      audio: false
    });
    streamRef = stream;
    els.video.srcObject = stream;
    await els.video.play();

    resizeCanvasToBooth();
    placeVideoSlot(0);
  }catch(err){
    alert('Camera access failed: ' + err.message);
    console.error(err);
  }
}

// Keep canvas matched to booth on resize
window.addEventListener('resize', () => {
  const snapshot = (photoStage > 0);
  const img = snapshot ? new Image() : null;
  if (snapshot){
    img.src = els.canvas.toDataURL('image/png');
    img.onload = () => {
      resizeCanvasToBooth();
      ctx.drawImage(img, 0, 0, CANVAS_W, CANVAS_H);
    };
  } else {
    resizeCanvasToBooth();
  }
});

// Buttons
els.captureBtn.addEventListener('click', () => {
  if (photoStage >= NUM_SLOTS) return;
  els.captureBtn.disabled = true;
  startCountdown(capturePhoto);
});
els.retakeBtn.addEventListener('click', retake);
els.continueBtn.addEventListener('click', continueToDecorate);

// Cleanup
window.addEventListener('beforeunload', () => {
  if (streamRef){ streamRef.getTracks().forEach(t => t.stop()); }
});

// Kick off
resizeCanvasToBooth();
initCamera();
