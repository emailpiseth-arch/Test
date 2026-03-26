const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

const W = canvas.width;
const H = canvas.height;

// ─── Constants ────────────────────────────────────────────────────────────────
const GRAVITY       = 0.45;
const FLAP_STRENGTH = -8.5;
const PIPE_WIDTH    = 60;
const PIPE_GAP      = 160;
const PIPE_SPEED    = 2.8;
const PIPE_INTERVAL = 90;  // frames between pipes
const BIRD_X        = 90;
const BIRD_RADIUS   = 18;

// ─── Colours ──────────────────────────────────────────────────────────────────
const SKY_TOP    = '#87CEEB';
const SKY_BOT    = '#e0f4ff';
const GROUND_CLR = '#8B6914';
const GRASS_CLR  = '#4CAF50';
const PIPE_CLR   = '#2ecc40';
const PIPE_DARK  = '#27ae36';
const BIRD_CLR   = '#FFD700';
const BIRD_EYE   = '#fff';
const BIRD_PUPIL = '#333';
const BIRD_BEAK  = '#FF6B35';
const WING_CLR   = '#FFA500';

const GROUND_H = 80;

// ─── State ────────────────────────────────────────────────────────────────────
let bird, pipes, score, highScore, frame, state, groundOffset;
// state: 'idle' | 'playing' | 'dead'

function reset() {
  bird = {
    y: H / 2,
    vy: 0,
    angle: 0,
    wingPhase: 0,
  };
  pipes = [];
  score = 0;
  frame = 0;
  groundOffset = 0;
  state = 'idle';
}

// ─── Input ────────────────────────────────────────────────────────────────────
function flap() {
  if (state === 'dead') {
    reset();
    state = 'idle';
    return;
  }
  if (state === 'idle') state = 'playing';
  bird.vy = FLAP_STRENGTH;
}

document.addEventListener('keydown', e => {
  if (e.code === 'Space' || e.code === 'ArrowUp') {
    e.preventDefault();
    flap();
  }
});
canvas.addEventListener('click', flap);
canvas.addEventListener('touchstart', e => { e.preventDefault(); flap(); }, { passive: false });

// ─── Helpers ──────────────────────────────────────────────────────────────────
function pipeTop(pipe) { return pipe.gapY - PIPE_GAP / 2; }
function pipeBot(pipe) { return pipe.gapY + PIPE_GAP / 2; }

function collides() {
  const r = BIRD_RADIUS - 4; // slightly forgiving
  for (const pipe of pipes) {
    const left  = pipe.x;
    const right = pipe.x + PIPE_WIDTH;
    if (BIRD_X + r > left && BIRD_X - r < right) {
      if (bird.y - r < pipeTop(pipe) || bird.y + r > pipeBot(pipe)) return true;
    }
  }
  if (bird.y + r >= H - GROUND_H) return true;
  return false;
}

// ─── Draw helpers ─────────────────────────────────────────────────────────────
function drawBackground() {
  const grad = ctx.createLinearGradient(0, 0, 0, H - GROUND_H);
  grad.addColorStop(0, SKY_TOP);
  grad.addColorStop(1, SKY_BOT);
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, W, H - GROUND_H);

  // clouds
  drawCloud(80,  80, 0.9);
  drawCloud(260, 55, 0.7);
  drawCloud(340, 100, 0.5);
}

function drawCloud(x, y, alpha) {
  ctx.save();
  ctx.globalAlpha = alpha * 0.85;
  ctx.fillStyle = '#fff';
  ctx.beginPath();
  ctx.arc(x,      y,      28, 0, Math.PI * 2);
  ctx.arc(x + 30, y - 10, 22, 0, Math.PI * 2);
  ctx.arc(x + 55, y,      20, 0, Math.PI * 2);
  ctx.arc(x + 25, y + 8,  20, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

function drawGround() {
  // soil
  ctx.fillStyle = GROUND_CLR;
  ctx.fillRect(0, H - GROUND_H, W, GROUND_H);

  // grass strip
  ctx.fillStyle = GRASS_CLR;
  ctx.fillRect(0, H - GROUND_H, W, 18);

  // scrolling grass tufts
  ctx.fillStyle = '#388E3C';
  for (let i = 0; i < 14; i++) {
    const bx = ((i * 30 - groundOffset) % (W + 30) + W + 30) % (W + 30);
    ctx.beginPath();
    ctx.moveTo(bx, H - GROUND_H + 18);
    ctx.lineTo(bx + 8, H - GROUND_H + 6);
    ctx.lineTo(bx + 16, H - GROUND_H + 18);
    ctx.fill();
  }
}

function drawPipe(pipe) {
  const top = pipeTop(pipe);
  const bot = pipeBot(pipe);
  const capH = 22, capW = PIPE_WIDTH + 10;
  const capX = pipe.x - 5;

  // top pipe body
  ctx.fillStyle = PIPE_CLR;
  ctx.fillRect(pipe.x, 0, PIPE_WIDTH, top);
  // top pipe shading
  ctx.fillStyle = PIPE_DARK;
  ctx.fillRect(pipe.x, 0, 10, top);
  ctx.fillRect(pipe.x + PIPE_WIDTH - 8, 0, 8, top);
  // top pipe cap
  ctx.fillStyle = PIPE_CLR;
  ctx.fillRect(capX, top - capH, capW, capH);
  ctx.fillStyle = PIPE_DARK;
  ctx.fillRect(capX, top - capH, 12, capH);
  ctx.fillRect(capX + capW - 9, top - capH, 9, capH);

  // bottom pipe body
  ctx.fillStyle = PIPE_CLR;
  ctx.fillRect(pipe.x, bot, PIPE_WIDTH, H - GROUND_H - bot);
  ctx.fillStyle = PIPE_DARK;
  ctx.fillRect(pipe.x, bot, 10, H - GROUND_H - bot);
  ctx.fillRect(pipe.x + PIPE_WIDTH - 8, bot, 8, H - GROUND_H - bot);
  // bottom pipe cap
  ctx.fillStyle = PIPE_CLR;
  ctx.fillRect(capX, bot, capW, capH);
  ctx.fillStyle = PIPE_DARK;
  ctx.fillRect(capX, bot, 12, capH);
  ctx.fillRect(capX + capW - 9, bot, 9, capH);
}

function drawBird() {
  ctx.save();
  ctx.translate(BIRD_X, bird.y);
  // tilt: up when flapping, down when falling
  const targetAngle = bird.vy < 0 ? -0.4 : Math.min(bird.vy * 0.08, 1.2);
  bird.angle += (targetAngle - bird.angle) * 0.18;
  ctx.rotate(bird.angle);

  // wing
  const wingFlap = Math.sin(bird.wingPhase) * 8;
  ctx.fillStyle = WING_CLR;
  ctx.beginPath();
  ctx.ellipse(-6, 4 + wingFlap, 14, 8, -0.4, 0, Math.PI * 2);
  ctx.fill();

  // body
  ctx.fillStyle = BIRD_CLR;
  ctx.beginPath();
  ctx.ellipse(0, 0, BIRD_RADIUS, BIRD_RADIUS - 3, 0, 0, Math.PI * 2);
  ctx.fill();

  // belly highlight
  ctx.fillStyle = '#FFFACD';
  ctx.beginPath();
  ctx.ellipse(4, 4, 10, 8, 0.3, 0, Math.PI * 2);
  ctx.fill();

  // eye white
  ctx.fillStyle = BIRD_EYE;
  ctx.beginPath();
  ctx.arc(9, -6, 6, 0, Math.PI * 2);
  ctx.fill();

  // pupil
  ctx.fillStyle = BIRD_PUPIL;
  ctx.beginPath();
  ctx.arc(11, -6, 3, 0, Math.PI * 2);
  ctx.fill();

  // beak
  ctx.fillStyle = BIRD_BEAK;
  ctx.beginPath();
  ctx.moveTo(14, -2);
  ctx.lineTo(22, 1);
  ctx.lineTo(14, 4);
  ctx.closePath();
  ctx.fill();

  ctx.restore();
}

function drawScore() {
  ctx.textAlign = 'center';
  ctx.fillStyle = '#fff';
  ctx.strokeStyle = '#333';
  ctx.lineWidth = 4;
  ctx.font = 'bold 42px Arial';
  ctx.strokeText(score, W / 2, 70);
  ctx.fillText(score, W / 2, 70);
}

function drawOverlay(title, sub) {
  ctx.fillStyle = 'rgba(0,0,0,0.45)';
  ctx.fillRect(0, 0, W, H);

  ctx.textAlign = 'center';

  // panel
  ctx.fillStyle = 'rgba(255,255,255,0.12)';
  roundRect(W / 2 - 140, H / 2 - 120, 280, 220, 18);
  ctx.fill();

  ctx.fillStyle = '#FFD700';
  ctx.strokeStyle = '#333';
  ctx.lineWidth = 3;
  ctx.font = 'bold 48px Arial';
  ctx.strokeText(title, W / 2, H / 2 - 55);
  ctx.fillText(title, W / 2, H / 2 - 55);

  if (state === 'dead') {
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 22px Arial';
    ctx.fillText(`Score: ${score}`, W / 2, H / 2);
    ctx.fillText(`Best:  ${highScore}`, W / 2, H / 2 + 34);
  }

  ctx.fillStyle = '#ffffffcc';
  ctx.font = '18px Arial';
  ctx.fillText(sub, W / 2, H / 2 + 80);
}

function roundRect(x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}

// ─── Game loop ────────────────────────────────────────────────────────────────
function update() {
  if (state !== 'playing') return;

  frame++;
  groundOffset = (groundOffset + PIPE_SPEED) % 30;
  bird.wingPhase += 0.35;

  // physics
  bird.vy += GRAVITY;
  bird.y  += bird.vy;

  // ceiling
  if (bird.y - BIRD_RADIUS < 0) {
    bird.y  = BIRD_RADIUS;
    bird.vy = 0;
  }

  // spawn pipes
  if (frame % PIPE_INTERVAL === 0) {
    const minGap = BIRD_RADIUS * 2 + 40;
    const gapY   = minGap + PIPE_GAP / 2 + Math.random() * (H - GROUND_H - PIPE_GAP - minGap * 2);
    pipes.push({ x: W + 20, gapY, scored: false });
  }

  // move pipes + score
  for (const pipe of pipes) {
    pipe.x -= PIPE_SPEED;
    if (!pipe.scored && pipe.x + PIPE_WIDTH < BIRD_X) {
      pipe.scored = true;
      score++;
      if (score > highScore) highScore = score;
    }
  }
  pipes = pipes.filter(p => p.x + PIPE_WIDTH + 20 > 0);

  // collision
  if (collides()) {
    state = 'dead';
    if (score > highScore) highScore = score;
  }
}

function draw() {
  drawBackground();
  pipes.forEach(drawPipe);
  drawGround();
  drawBird();

  if (state === 'playing' || state === 'dead') drawScore();

  if (state === 'idle') drawOverlay('FLAPPY BIRD', 'Space / Tap to start');
  if (state === 'dead') drawOverlay('GAME OVER',   'Space / Tap to restart');
}

function loop() {
  update();
  draw();
  requestAnimationFrame(loop);
}

// ─── Init ─────────────────────────────────────────────────────────────────────
highScore = 0;
reset();
loop();
