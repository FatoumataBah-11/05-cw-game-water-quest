// -- Original logic preserved and enhanced with difficulty, milestones, and sounds --

// Dynamic configuration (will update per difficulty)
let GOAL = 20;
let timer = 30;
let spawnRate = 1000; // ms between spawns
let score = 0;
let gameActive = false;
let spawnInterval;
let countdownInterval;

// DOM
const grid = document.getElementById('game-grid');
const scoreEl = document.getElementById('score');
const timerEl = document.getElementById('timer');
const messageEl = document.getElementById('message');
const milestoneEl = document.getElementById('milestone');
const goalEl = document.getElementById('goal');
const confettiCanvas = document.getElementById('confetti-canvas');
const ctx = confettiCanvas.getContext('2d');
confettiCanvas.width = window.innerWidth;
confettiCanvas.height = window.innerHeight;

// Difficulty selector
const difficultySelect = document.getElementById('difficulty');

// Milestones messages array (will be computed relative to GOAL)
let milestones = [];

// --- Sounds using Web Audio API (no external files required) ---
const AudioCtx = window.AudioContext || window.webkitAudioContext;
let audioCtx;
function ensureAudioContext() {
  if (!audioCtx) audioCtx = new AudioCtx();
}

// Play a simple tone for feedback
function playTone(freq = 440, type = 'sine', duration = 0.12, gain = 0.15) {
  try {
    ensureAudioContext();
    const o = audioCtx.createOscillator();
    const g = audioCtx.createGain();
    o.type = type;
    o.frequency.value = freq;
    g.gain.value = gain;
    o.connect(g);
    g.connect(audioCtx.destination);
    o.start();
    setTimeout(() => {
      o.stop();
    }, duration * 1000);
  } catch (e) {
    // Audio not available — silently ignore
    console.warn('Audio unavailable', e);
  }
}

// Sound wrappers
function playCollectSound() { playTone(880, 'sine', 0.09, 0.12); }
function playPenaltySound() { playTone(220, 'triangle', 0.14, 0.16); }
function playWinSound() {
  // short arpeggio
  playTone(880, 'sine', 0.09, 0.12);
  setTimeout(() => playTone(1100, 'sine', 0.09, 0.12), 120);
  setTimeout(() => playTone(1320, 'sine', 0.16, 0.12), 240);
}

// --- Grid creation (preserve original) ---
function createGrid() {
  grid.innerHTML = '';
  for (let i = 0; i < 9; i++) {
    const cell = document.createElement('div');
    cell.classList.add('grid-cell');
    cell.setAttribute('role', 'gridcell');
    grid.appendChild(cell);
  }
}

// --- Spawn logic (preserve click behavior) ---
function spawnItem() {
  if (!gameActive) return;
  const cells = document.querySelectorAll('.grid-cell');
  cells.forEach(cell => (cell.innerHTML = ''));

  const randomCell = cells[Math.floor(Math.random() * cells.length)];
  const itemType = Math.random() < 0.8 ? 'water-can' : 'bad-drop'; // keep 80/20

  const div = document.createElement('div');
  div.classList.add(itemType);

  div.addEventListener('click', () => {
    if (!gameActive) return;
    if (itemType === 'water-can') {
      score++;
      scoreEl.textContent = score;
      showMessage('+1 can!', '#4FCB53');
      playCollectSound();
      checkMilestones();
      checkWin();
    } else {
      score = Math.max(0, score - 2);
      scoreEl.textContent = score;
      showMessage('-2 penalty!', '#F5402C');
      playPenaltySound();
    }
    div.remove();
  });

  randomCell.appendChild(div);
}

// --- Difficulty handling ---
function applyDifficulty(mode) {
  // C = both changes requested by user
  switch (mode) {
    case 'easy':
      GOAL = 10;
      timer = 40;
      spawnRate = 1200;
      break;
    case 'normal':
      GOAL = 20;
      timer = 30;
      spawnRate = 1000;
      break;
    case 'hard':
      GOAL = 30;
      timer = 20;
      spawnRate = 700;
      break;
    default:
      GOAL = 20;
      timer = 30;
      spawnRate = 1000;
  }
  goalEl.textContent = GOAL;
  timerEl.textContent = timer;
  // compute milestones (halfway and 3/4)
  milestones = [
    { score: Math.ceil(GOAL * 0.5), text: 'Halfway there!' },
    { score: Math.ceil(GOAL * 0.75), text: 'Almost there!' }
  ];
  // clear milestone UI
  milestoneEl.textContent = '';
}

// --- Start, end, reset ---
function startGame() {
  if (gameActive) return;
  // If audio context is not created yet, resume on user gesture (start button)
  if (audioCtx && audioCtx.state === 'suspended') audioCtx.resume();

  gameActive = true;
  score = 0;
  // apply difficulty current values to ensure timer/goal sync
  const mode = difficultySelect.value;
  applyDifficulty(mode);

  scoreEl.textContent = score;
  timerEl.textContent = timer;
  messageEl.textContent = '';
  createGrid();

  // First spawn immediately, then intervals
  spawnItem();
  spawnInterval = setInterval(spawnItem, spawnRate);

  countdownInterval = setInterval(() => {
    timer--;
    timerEl.textContent = timer;
    if (timer <= 0) endGame();
  }, 1000);
}

function endGame() {
  if (!gameActive) return;
  gameActive = false;
  clearInterval(spawnInterval);
  clearInterval(countdownInterval);

  if (score >= GOAL) {
    showMessage('🎉 You Win! 🎉', '#FFC907');
    playWinSound();
    startConfetti();
  } else {
    showMessage('Game Over', '#FFC907');
  }
}

function resetGame() {
  endGame();
  score = 0;
  // reapply difficulty so timers reflect selection
  applyDifficulty(difficultySelect.value);
  scoreEl.textContent = score;
  timerEl.textContent = timer;
  messageEl.textContent = '';
  milestoneEl.textContent = '';
  createGrid();
}

// --- Messages and milestones ---
function showMessage(text, color) {
  messageEl.textContent = text;
  messageEl.style.color = color;
  setTimeout(() => {
    if (gameActive) messageEl.textContent = '';
  }, 1100);
}

function checkMilestones() {
  // show a milestone message only once per milestone
  for (let i = 0; i < milestones.length; i++) {
    if (!milestones[i].shown && score >= milestones[i].score) {
      milestoneEl.textContent = milestones[i].text;
      milestones[i].shown = true;
      // remove milestone message after a short delay
      setTimeout(() => {
        if (gameActive) milestoneEl.textContent = '';
      }, 1500);
      break;
    }
  }
}

// --- Confetti (kept & slightly improved) ---
let confettiParticles = [];

function startConfetti() {
  confettiParticles = [];
  // ensure canvas covers current viewport
  confettiCanvas.width = window.innerWidth;
  confettiCanvas.height = window.innerHeight;

  for (let i = 0; i < 120; i++) {
    confettiParticles.push({
      x: Math.random() * confettiCanvas.width,
      y: Math.random() * -confettiCanvas.height,
      r: Math.random() * 6 + 4,
      d: Math.random() * 20 + 10,
      color: `hsl(${Math.random() * 360}, 90%, 55%)`,
      tilt: Math.random() * 10 - 10,
      tiltAngleIncrement: Math.random() * 0.07 + 0.05,
      tiltAngle: 0
    });
  }
  requestAnimationFrame(updateConfetti);
}

function updateConfetti() {
  ctx.clearRect(0, 0, confettiCanvas.width, confettiCanvas.height);
  confettiParticles.forEach(p => {
    p.tiltAngle += p.tiltAngleIncrement;
    p.y += (Math.cos(p.d) + 3 + p.r / 2) / 2;
    p.x += Math.sin(p.d);
    p.tilt = Math.sin(p.tiltAngle) * 15;

    ctx.beginPath();
    ctx.lineWidth = p.r;
    ctx.strokeStyle = p.color;
    ctx.moveTo(p.x + p.tilt + p.r / 2, p.y);
    ctx.lineTo(p.x + p.tilt, p.y + p.tilt + p.r / 2);
    ctx.stroke();
  });
  confettiParticles = confettiParticles.filter(p => p.y < confettiCanvas.height);
  if (confettiParticles.length > 0) requestAnimationFrame(updateConfetti);
}

// --- Win check ---
function checkWin() {
  if (score >= GOAL) endGame();
}

// --- Event listeners ---
document.getElementById('start-game').addEventListener('click', () => {
  // Some browsers block WebAudio until a user gesture; ensure it starts here
  ensureAudioContext();
  if (audioCtx && audioCtx.state === 'suspended') {
    // resume on gesture
    audioCtx.resume().then(startGame);
  } else startGame();
});
document.getElementById('reset-game').addEventListener('click', resetGame);

// Update difficulty live (if changed during game, it will apply on next reset/start)
difficultySelect.addEventListener('change', () => {
  // If game not active immediately apply changes to shown values
  if (!gameActive) applyDifficulty(difficultySelect.value);
  else {
    // If game active, change goal & spawnRate but keep current score/time
    const prevMode = difficultySelect.value;
    applyDifficulty(prevMode);
    // Keep the running timer as-is (don't reset timer mid-game)
    // But update display of goal
    goalEl.textContent = GOAL;
  }
});

// update canvas size on resize
window.addEventListener('resize', () => {
  confettiCanvas.width = window.innerWidth;
  confettiCanvas.height = window.innerHeight;
});

// Initialize
applyDifficulty(difficultySelect.value);
createGrid();
