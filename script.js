// -- Logic preserved + cleaned up --

let GOAL = 20;
let timer = 30;
let spawnRate = 1000;
let score = 0;
let gameActive = false;
let spawnInterval;
let countdownInterval;

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

const difficultySelect = document.getElementById('difficulty');
let milestones = [];

const AudioCtx = window.AudioContext || window.webkitAudioContext;
let audioCtx;
function ensureAudioContext() {
  if (!audioCtx) audioCtx = new AudioCtx();
}
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
    console.warn('Audio unavailable', e);
  }
}
function playCollectSound() { playTone(880, 'sine', 0.09, 0.12); }
function playPenaltySound() { playTone(220, 'triangle', 0.14, 0.16); }
function playWinSound() {
  playTone(880, 'sine', 0.09, 0.12);
  setTimeout(() => playTone(1100, 'sine', 0.09, 0.12), 120);
  setTimeout(() => playTone(1320, 'sine', 0.16, 0.12), 240);
}

function createGrid() {
  grid.innerHTML = '';
  for (let i = 0; i < 9; i++) {
    const cell = document.createElement('div');
    cell.classList.add('grid-cell');
    cell.setAttribute('role', 'gridcell');
    grid.appendChild(cell);
  }
}

function spawnItem() {
  if (!gameActive) return;
  const cells = document.querySelectorAll('.grid-cell');
  cells.forEach(cell => (cell.innerHTML = ''));

  const randomCell = cells[Math.floor(Math.random() * cells.length)];
  const isGood = Math.random() < 0.8;
  const div = document.createElement('div');
  if (isGood) {
    div.classList.add('good-item');
    div.textContent = '💧';
  } else {
    div.classList.add('bad-item');
    div.textContent = '❌';
  }

  div.addEventListener('click', () => {
    if (!gameActive) return;
    if (isGood) {
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

function applyDifficulty(mode) {
  if (mode === 'easy') {
    GOAL = 10; timer = 40; spawnRate = 1200;
  } else if (mode === 'normal') {
    GOAL = 20; timer = 30; spawnRate = 1000;
  } else if (mode === 'hard') {
    GOAL = 30; timer = 20; spawnRate = 700;
  } else {
    GOAL = 20; timer = 30; spawnRate = 1000;
  }
  goalEl.textContent = GOAL;
  timerEl.textContent = timer;
  milestones = [
    { score: Math.ceil(GOAL * 0.5), text: 'Halfway there!', shown: false },
    { score: Math.ceil(GOAL * 0.75), text: 'Almost there!', shown: false }
  ];
  milestoneEl.textContent = '';
}

function startGame() {
  if (gameActive) return;
  if (audioCtx && audioCtx.state === 'suspended') audioCtx.resume();

  gameActive = true;
  score = 0;
  applyDifficulty(difficultySelect.value);
  scoreEl.textContent = score;
  timerEl.textContent = timer;
  messageEl.textContent = '';
  createGrid();

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
  applyDifficulty(difficultySelect.value);
  scoreEl.textContent = score;
  timerEl.textContent = timer;
  messageEl.textContent = '';
  milestoneEl.textContent = '';
  createGrid();
}

function showMessage(text, color) {
  messageEl.textContent = text;
  messageEl.style.color = color;
  setTimeout(() => {
    if (gameActive) messageEl.textContent = '';
  }, 1100);
}

function checkMilestones() {
  for (let m of milestones) {
    if (!m.shown && score >= m.score) {
      milestoneEl.textContent = m.text;
      m.shown = true;
      setTimeout(() => {
        if (gameActive) milestoneEl.textContent = '';
      }, 1500);
      break;
    }
  }
}

let confettiParticles = [];

function startConfetti() {
  confettiParticles = [];
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

function checkWin() {
  if (score >= GOAL) endGame();
}

document.getElementById('start-game').addEventListener('click', () => {
  ensureAudioContext();
  if (audioCtx && audioCtx.state === 'suspended') {
    audioCtx.resume().then(startGame);
  } else {
    startGame();
  }
});
document.getElementById('reset-game').addEventListener('click', resetGame);

difficultySelect.addEventListener('change', () => {
  if (!gameActive) {
    applyDifficulty(difficultySelect.value);
  } else {
    applyDifficulty(difficultySelect.value);
    goalEl.textContent = GOAL;
  }
});

window.addEventListener('resize', () => {
  confettiCanvas.width = window.innerWidth;
  confettiCanvas.height = window.innerHeight;
});

applyDifficulty(difficultySelect.value);
createGrid();
