// Game configuration
const GOAL = 20;
let score = 0;
let timer = 30;
let gameActive = false;
let spawnInterval;
let countdownInterval;

const grid = document.getElementById('game-grid');
const scoreEl = document.getElementById('score');
const timerEl = document.getElementById('timer');
const messageEl = document.getElementById('message');
const confettiCanvas = document.getElementById('confetti-canvas');
const ctx = confettiCanvas.getContext('2d');
confettiCanvas.width = window.innerWidth;
confettiCanvas.height = window.innerHeight;

// Create 3x3 grid
function createGrid() {
  grid.innerHTML = '';
  for (let i = 0; i < 9; i++) {
    const cell = document.createElement('div');
    cell.classList.add('grid-cell');
    grid.appendChild(cell);
  }
}

// Spawn either a water can or a bad drop
function spawnItem() {
  if (!gameActive) return;
  const cells = document.querySelectorAll('.grid-cell');
  cells.forEach(cell => (cell.innerHTML = ''));
  
  const randomCell = cells[Math.floor(Math.random() * cells.length)];
  
  const itemType = Math.random() < 0.8 ? 'water-can' : 'bad-drop'; // 80% water, 20% bad
  const div = document.createElement('div');
  div.classList.add(itemType);
  
  div.addEventListener('click', () => {
    if (!gameActive) return;
    if (itemType === 'water-can') {
      score++;
      scoreEl.textContent = score;
      showMessage('+1 can!', '#4FCB53');
      checkWin();
    } else {
      score = Math.max(0, score - 2);
      scoreEl.textContent = score;
      showMessage('-2 penalty!', '#F5402C');
    }
    div.remove();
  });

  randomCell.appendChild(div);
}

// Start game
function startGame() {
  if (gameActive) return;
  gameActive = true;
  score = 0;
  timer = 30;
  scoreEl.textContent = score;
  timerEl.textContent = timer;
  messageEl.textContent = '';
  createGrid();
  
  spawnItem();
  spawnInterval = setInterval(spawnItem, 1000);
  
  countdownInterval = setInterval(() => {
    timer--;
    timerEl.textContent = timer;
    if (timer <= 0) endGame();
  }, 1000);
}

// End game
function endGame() {
  gameActive = false;
  clearInterval(spawnInterval);
  clearInterval(countdownInterval);
  showMessage(score >= GOAL ? '🎉 You Win! 🎉' : 'Game Over', '#FFC907');
  if (score >= GOAL) startConfetti();
}

// Reset game
function resetGame() {
  endGame();
  score = 0;
  timer = 30;
  scoreEl.textContent = score;
  timerEl.textContent = timer;
  messageEl.textContent = '';
  createGrid();
}

// Show temporary messages
function showMessage(text, color) {
  messageEl.textContent = text;
  messageEl.style.color = color;
  setTimeout(() => {
    if (gameActive) messageEl.textContent = '';
  }, 1000);
}

// Confetti Effect
let confettiParticles = [];
function startConfetti() {
  confettiParticles = [];
  for (let i = 0; i < 100; i++) {
    confettiParticles.push({
      x: Math.random() * confettiCanvas.width,
      y: Math.random() * confettiCanvas.height - confettiCanvas.height,
      r: Math.random() * 6 + 4,
      d: Math.random() * 20 + 10,
      color: `hsl(${Math.random() * 360}, 100%, 50%)`,
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
    ctx.moveTo(p.x + p.tilt + p.r/2, p.y);
    ctx.lineTo(p.x + p.tilt, p.y + p.tilt + p.r/2);
    ctx.stroke();
  });
  confettiParticles = confettiParticles.filter(p => p.y < confettiCanvas.height);
  if (confettiParticles.length > 0) requestAnimationFrame(updateConfetti);
}

// Check win
function checkWin() {
  if (score >= GOAL) endGame();
}

// Event listeners
document.getElementById('start-game').addEventListener('click', startGame);
document.getElementById('reset-game').addEventListener('click', resetGame);

// Initial grid
createGrid();
