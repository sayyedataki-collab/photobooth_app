// Start button goes to camera later; for now it just logs.
document.getElementById('startBtn')?.addEventListener('click', () => {
  console.log('enter booth clicked');
  // when your camera page exists, do: window.location.href = 'camera.html';
});

// purely visual: toggle selected state on layout chips
document.querySelectorAll('.chip').forEach(chip => {
  chip.addEventListener('click', () => {
    document.querySelectorAll('.chip').forEach(c => c.classList.remove('selected'));
    chip.classList.add('selected');
  });
});


// --- Typewriter tagline (letter-by-letter with soft fade) ---
(function typeTagline(){
  const el = document.getElementById('tagline');
  if (!el) return;

  const text = el.getAttribute('data-text') || '';
  const reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  el.textContent = '';
  el.style.opacity = '1';

  if (reduce) {
    el.textContent = text;
    return;
  }

  // Build spans. Convert normal spaces to NBSP so they render even inside inline-blocks.
  const frag = document.createDocumentFragment();
  const chars = [...text];
  chars.forEach(ch => {
    const s = document.createElement('span');
    s.textContent = (ch === ' ') ? '\u00A0' : ch;
    frag.appendChild(s);
  });
  el.appendChild(frag);

  // Typing speed
  const baseDelay = 28;  // lower = faster
  const jitter    = 20;

  let i = 0;
  function revealNext(){
    if (i >= chars.length) return;
    const span = el.children[i];
    span.style.opacity = '1';
    span.style.transform = 'translateY(0)';
    i++;
    setTimeout(revealNext, baseDelay + Math.random() * jitter);
  }
  setTimeout(revealNext, 160);
})();
