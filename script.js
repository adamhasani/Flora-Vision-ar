// ============================================================
// FLORA VISION AR — Enhanced Edition
// ============================================================

const videoElement = document.querySelector('.input_video');
const canvasElement = document.getElementById('mainCanvas');
const ctx = canvasElement.getContext('2d');
const loadingScreen = document.getElementById('loading');
const gestureHint = document.getElementById('gestureHint');
const gestureBadge = document.getElementById('gestureBadge');

// ===== THEMES =====
const THEMES = {
  sakura: {
    petals:    ['#ffb7c5','#ff85a1','#ffd6e0','#f9a8d4','#fbcfe8'],
    glow:      'rgba(255, 133, 161, 0.6)',
    core:      '#fff0f5',
    sparkle:   '#ffe4ec',
    trail:     'rgba(255, 183, 197, 0.15)',
    emojis:    ['🌸','🌺','🌷','✿','❀'],
  },
  forest: {
    petals:    ['#86efac','#4ade80','#a3e635','#bbf7d0','#d9f99d'],
    glow:      'rgba(74, 222, 128, 0.6)',
    core:      '#f0fdf4',
    sparkle:   '#dcfce7',
    trail:     'rgba(134, 239, 172, 0.15)',
    emojis:    ['🌿','🍃','🌱','🌾','🍀'],
  },
  cosmos: {
    petals:    ['#a5b4fc','#818cf8','#e879f9','#c084fc','#f0abfc'],
    glow:      'rgba(168, 85, 247, 0.6)',
    core:      '#faf5ff',
    sparkle:   '#ede9fe',
    trail:     'rgba(165, 180, 252, 0.15)',
    emojis:    ['⭐','✨','💫','🌟','⚡'],
  },
  fire: {
    petals:    ['#fbbf24','#f97316','#ef4444','#fde68a','#fed7aa'],
    glow:      'rgba(249, 115, 22, 0.6)',
    core:      '#fffbeb',
    sparkle:   '#fef3c7',
    trail:     'rgba(251, 191, 36, 0.15)',
    emojis:    ['🔥','⚡','💥','✨','🌟'],
  },
};

let currentTheme = THEMES.sakura;

// Theme switcher
document.querySelectorAll('.theme-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.theme-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    const name = btn.dataset.theme;
    currentTheme = THEMES[name];
    document.body.setAttribute('data-theme', name);
  });
});

// ===== PARTICLE SYSTEM =====
const particles = [];
const trails    = []; // per finger: array of positions

// Petal particle
class Petal {
  constructor(x, y, theme) {
    this.x    = x;
    this.y    = y;
    this.vx   = (Math.random() - 0.5) * 4;
    this.vy   = -(Math.random() * 4 + 2);
    this.size = Math.random() * 14 + 6;
    this.rot  = Math.random() * Math.PI * 2;
    this.rotV = (Math.random() - 0.5) * 0.15;
    this.life = 1.0;
    this.decay= Math.random() * 0.015 + 0.008;
    this.color= theme.petals[Math.floor(Math.random() * theme.petals.length)];
    this.type = Math.random() < 0.3 ? 'circle' : Math.random() < 0.5 ? 'petal' : 'star';
    this.swing= Math.random() * 0.04;
    this.swingOffset = Math.random() * Math.PI * 2;
    this.gravity = 0.12;
  }
  update() {
    this.vx += Math.sin(Date.now() * this.swing + this.swingOffset) * 0.03;
    this.vy += this.gravity;
    this.x  += this.vx;
    this.y  += this.vy;
    this.rot += this.rotV;
    this.life -= this.decay;
  }
  draw(c) {
    if (this.life <= 0) return;
    c.save();
    c.globalAlpha = this.life;
    c.translate(this.x, this.y);
    c.rotate(this.rot);

    if (this.type === 'circle') {
      c.beginPath();
      c.arc(0, 0, this.size * 0.5, 0, Math.PI * 2);
      c.fillStyle = this.color;
      c.shadowBlur = 12;
      c.shadowColor = this.color;
      c.fill();
    } else if (this.type === 'petal') {
      c.beginPath();
      c.ellipse(0, -this.size * 0.5, this.size * 0.3, this.size * 0.6, 0, 0, Math.PI * 2);
      c.fillStyle = this.color;
      c.shadowBlur = 10;
      c.shadowColor = this.color;
      c.fill();
    } else { // star
      drawStar(c, 0, 0, 5, this.size * 0.5, this.size * 0.22, this.color);
    }
    c.restore();
  }
}

// Sparkle particle (tiny glitter)
class Sparkle {
  constructor(x, y, theme) {
    this.x    = x + (Math.random() - 0.5) * 40;
    this.y    = y + (Math.random() - 0.5) * 40;
    this.size = Math.random() * 4 + 1;
    this.life = 1.0;
    this.decay= Math.random() * 0.03 + 0.02;
    this.color= theme.sparkle;
    this.vx   = (Math.random() - 0.5) * 1.5;
    this.vy   = -(Math.random() * 1.5 + 0.5);
  }
  update() { this.x += this.vx; this.y += this.vy; this.life -= this.decay; }
  draw(c) {
    if (this.life <= 0) return;
    c.save();
    c.globalAlpha = this.life * 0.9;
    c.beginPath();
    c.arc(this.x, this.y, this.size, 0, Math.PI * 2);
    c.fillStyle = this.color;
    c.shadowBlur = 8;
    c.shadowColor = this.color;
    c.fill();
    c.restore();
  }
}

// ===== HELPER: Draw star =====
function drawStar(c, cx, cy, spikes, outerR, innerR, color) {
  let rot = (Math.PI / 2) * 3;
  const step = Math.PI / spikes;
  c.beginPath();
  c.moveTo(cx, cy - outerR);
  for (let i = 0; i < spikes; i++) {
    c.lineTo(cx + Math.cos(rot) * outerR, cy + Math.sin(rot) * outerR);
    rot += step;
    c.lineTo(cx + Math.cos(rot) * innerR, cy + Math.sin(rot) * innerR);
    rot += step;
  }
  c.lineTo(cx, cy - outerR);
  c.closePath();
  c.fillStyle = color;
  c.shadowBlur = 14;
  c.shadowColor = color;
  c.fill();
}

// ===== HELPER: Draw blooming flower =====
function drawFlower(c, x, y, radius, color, alpha) {
  const petals = 6;
  c.save();
  c.globalAlpha = alpha;
  for (let i = 0; i < petals; i++) {
    const angle = (i / petals) * Math.PI * 2;
    const px = x + Math.cos(angle) * radius * 0.6;
    const py = y + Math.sin(angle) * radius * 0.6;
    c.beginPath();
    c.ellipse(px, py, radius * 0.35, radius * 0.55, angle, 0, Math.PI * 2);
    c.fillStyle = color;
    c.shadowBlur = 20;
    c.shadowColor = color;
    c.fill();
  }
  // center
  c.beginPath();
  c.arc(x, y, radius * 0.28, 0, Math.PI * 2);
  c.fillStyle = '#fff9';
  c.shadowBlur = 16;
  c.shadowColor = '#fff';
  c.fill();
  c.restore();
}

// ===== HELPER: Draw glow ring =====
function drawGlowRing(c, x, y, r, color, alpha) {
  c.save();
  c.globalAlpha = alpha;
  const g = c.createRadialGradient(x, y, r * 0.5, x, y, r * 1.5);
  g.addColorStop(0, color);
  g.addColorStop(1, 'transparent');
  c.beginPath();
  c.arc(x, y, r * 1.5, 0, Math.PI * 2);
  c.fillStyle = g;
  c.fill();
  c.restore();
}

// ===== FINGER INDICES (MediaPipe landmark) =====
const FINGERTIPS = [4, 8, 12, 16, 20];

// ===== TRAIL DATA =====
// trails[handIndex][fingerIndex] = [{x, y, age}, ...]
let trailData = [];

// ===== GESTURE DETECTION =====
function detectGesture(lms) {
  // Simple: count raised fingers
  const raised = [
    lms[8].y  < lms[6].y,   // telunjuk
    lms[12].y < lms[10].y,  // tengah
    lms[16].y < lms[14].y,  // manis
    lms[20].y < lms[18].y,  // kelingking
  ];
  const count = raised.filter(Boolean).length;
  if (count === 0) return 'fist';
  if (count === 4) return 'bloom';
  if (count === 1 && raised[0]) return 'point';
  if (count === 2 && raised[0] && raised[1]) return 'peace';
  return 'hand';
}

const GESTURE_LABELS = {
  fist:  '✊ Kepalan — Panen!',
  bloom: '🖐️ Telapak — Mekar Penuh!',
  point: '☝️ Tunjuk — Tanam Bunga',
  peace: '✌️ Peace — Double Bloom',
  hand:  '🌸 Tangan Terdeteksi',
};

let lastGesture   = '';
let badgeTimeout  = null;

function showGesture(name) {
  if (name === lastGesture) return;
  lastGesture = name;
  gestureBadge.textContent = GESTURE_LABELS[name] || name;
  gestureBadge.classList.add('show');
  clearTimeout(badgeTimeout);
  badgeTimeout = setTimeout(() => gestureBadge.classList.remove('show'), 2000);
}

// ===== SPAWN PARTICLES =====
function spawnParticles(x, y, count = 3) {
  for (let i = 0; i < count; i++) particles.push(new Petal(x, y, currentTheme));
  if (Math.random() < 0.4) {
    for (let i = 0; i < 4; i++) particles.push(new Sparkle(x, y, currentTheme));
  }
}

// ===== FRAME TIME =====
let lastTime = 0;

// ===== MAIN RESULTS CALLBACK =====
function onResults(results) {
  // Hide loading
  loadingScreen.classList.add('hidden');

  const W = canvasElement.width;
  const H = canvasElement.height;
  const now = Date.now();
  const dt  = Math.min(now - lastTime, 50);
  lastTime  = now;

  // --- Draw video background ---
  ctx.save();
  ctx.clearRect(0, 0, W, H);
  ctx.drawImage(results.image, 0, 0, W, H);

  // Subtle dark vignette
  const vig = ctx.createRadialGradient(W/2, H/2, H*0.3, W/2, H/2, H*0.8);
  vig.addColorStop(0, 'transparent');
  vig.addColorStop(1, 'rgba(0,0,0,0.35)');
  ctx.fillStyle = vig;
  ctx.fillRect(0, 0, W, H);
  ctx.restore();

  // --- Update + draw existing particles ---
  for (let i = particles.length - 1; i >= 0; i--) {
    particles[i].update();
    particles[i].draw(ctx);
    if (particles[i].life <= 0) particles.splice(i, 1);
  }

  // --- Hand Processing ---
  if (results.multiHandLandmarks && results.multiHandLandmarks.length > 0) {
    // Hide hint after first detection
    gestureHint.classList.add('hidden');

    results.multiHandLandmarks.forEach((lms, handIdx) => {
      if (!trailData[handIdx]) trailData[handIdx] = {};

      const gesture = detectGesture(lms);
      showGesture(gesture);

      // Determine spawn rate by gesture
      const isBloom  = gesture === 'bloom';
      const isFist   = gesture === 'fist';
      const spawnRate = isBloom ? 6 : isFist ? 1 : 3;

      FINGERTIPS.forEach((tipIdx, fi) => {
        const lm = lms[tipIdx];
        const x  = lm.x * W;
        const y  = lm.y * H;

        // Init trail
        if (!trailData[handIdx][fi]) trailData[handIdx][fi] = [];
        const trail = trailData[handIdx][fi];
        trail.push({ x, y, age: 0 });
        if (trail.length > 22) trail.shift();

        // --- Draw trail ---
        if (trail.length > 2) {
          ctx.save();
          for (let t = 1; t < trail.length; t++) {
            const alpha = (t / trail.length) * 0.5;
            const width = (t / trail.length) * 6;
            ctx.beginPath();
            ctx.moveTo(trail[t-1].x, trail[t-1].y);
            ctx.lineTo(trail[t].x,   trail[t].y);
            ctx.strokeStyle = currentTheme.petals[fi % currentTheme.petals.length];
            ctx.lineWidth   = width;
            ctx.globalAlpha = alpha;
            ctx.lineCap     = 'round';
            ctx.shadowBlur  = 12;
            ctx.shadowColor = currentTheme.glow;
            ctx.stroke();
          }
          ctx.restore();
        }

        // --- Glow ring at fingertip ---
        drawGlowRing(ctx, x, y, 18, currentTheme.glow, 0.35);

        // --- Flower at fingertip ---
        const flowerColor = currentTheme.petals[fi % currentTheme.petals.length];
        const flowerR = isBloom ? 24 : 14;
        drawFlower(ctx, x, y, flowerR, flowerColor, isBloom ? 0.85 : 0.6);

        // --- Core dot ---
        ctx.save();
        ctx.beginPath();
        ctx.arc(x, y, 5, 0, Math.PI * 2);
        ctx.fillStyle = currentTheme.core;
        ctx.shadowBlur = 20;
        ctx.shadowColor = '#fff';
        ctx.globalAlpha = 0.9;
        ctx.fill();
        ctx.restore();

        // --- Spawn petals ---
        if (Math.random() < 0.45) spawnParticles(x, y, spawnRate);

        // --- Bloom burst: fist → open = kaboom ---
        if (isBloom && Math.random() < 0.12) {
          for (let b = 0; b < 8; b++) spawnParticles(x, y, 2);
        }
      });

      // --- Palm center glow (for open hand) ---
      if (gesture === 'bloom') {
        const palm = lms[9];
        const px = palm.x * W, py = palm.y * H;
        drawGlowRing(ctx, px, py, 40, currentTheme.glow, 0.2);
        if (Math.random() < 0.3) spawnParticles(px, py, 4);
      }
    });

    // Clean up trails for hands no longer visible
    const count = results.multiHandLandmarks.length;
    for (let i = count; i < trailData.length; i++) {
      trailData[i] = {};
    }
  } else {
    // No hands: fade out trails
    trailData = [];
    if (!gestureHint.classList.contains('hidden') === false) {
      // keep hidden
    }
  }
}

// ===== MEDIAPIPE SETUP =====
const hands = new Hands({
  locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`
});

hands.setOptions({
  maxNumHands: 2,
  modelComplexity: 1,
  minDetectionConfidence: 0.6,
  minTrackingConfidence: 0.5
});

hands.onResults(onResults);

// ===== CAMERA =====
const camera = new Camera(videoElement, {
  onFrame: async () => { await hands.send({ image: videoElement }); },
  width: 1280,
  height: 720,
  facingMode: 'user'
});

camera.start();
