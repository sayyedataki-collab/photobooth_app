// upload.js — pick two photos -> store raw halves -> go to final.html

window.addEventListener('DOMContentLoaded', () => {
  localStorage.removeItem('photoTop');
  localStorage.removeItem('photoBottom');
});

const WIDTH = 1176, HEIGHT = 1470, HALF = HEIGHT / 2;

const el = {
  canvas: document.getElementById('finalCanvas'),
  ctx: document.getElementById('finalCanvas').getContext('2d'),
  uploadInput: document.getElementById('uploadPhotoInput'),
  uploadBtn: document.getElementById('uploadPhoto'),
  readyBtn: document.getElementById('readyButton'),
  downloadBtn: document.getElementById('downloadBtn')
};

let photoStage = 0; // 0 top, 1 bottom

const drawHalf = (img) => {
  const yOffset = photoStage === 0 ? 0 : HALF;
  const imgAspect = img.width / img.height, targetAspect = WIDTH / HALF;
  let sx, sy, sw, sh;

  if (imgAspect > targetAspect) { sh = img.height; sw = img.height * targetAspect; sx = (img.width - sw) / 2; sy = 0; }
  else { sw = img.width; sh = img.width / targetAspect; sx = 0; sy = (img.height - sh) / 2; }

  el.ctx.drawImage(img, sx, sy, sw, sh, 0, yOffset, WIDTH, HALF);

  const tmp = document.createElement('canvas');
  tmp.width = WIDTH; tmp.height = HALF;
  tmp.getContext('2d').drawImage(el.canvas, 0, yOffset, WIDTH, HALF, 0, 0, WIDTH, HALF);
  const data = tmp.toDataURL('image/png');

  if (photoStage === 0) {
    localStorage.setItem('photoTop', data);
    photoStage = 1;
  } else {
    localStorage.setItem('photoBottom', data);
    photoStage = 2;
    el.readyBtn.style.display = 'inline-block';
    el.readyBtn.disabled = false;
  }
};

el.uploadBtn.addEventListener('click', () => el.uploadInput.click());

el.uploadInput.addEventListener('change', e => {
  const file = e.target.files[0];
  if (!file) return;
  const img = new Image();
  img.onload = () => { drawHalf(img); el.uploadInput.value = ''; };
  img.src = URL.createObjectURL(file);
});

el.readyBtn.addEventListener('click', () => window.location.href = 'final.html');

document.addEventListener('DOMContentLoaded', () => {
  const logo = document.querySelector('.logo');
  if (logo) logo.addEventListener('click', () => window.location.href = 'index.html');
});
