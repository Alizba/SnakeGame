// DOM Selectors
const boardWrapper = document.querySelector(".board-wrapper");
const board = document.querySelector(".board");
const modal = document.querySelector(".modal");

// Modal Screens
const startGameModal = document.querySelector(".start-game");
const pauseGameModal = document.querySelector(".pause-game");
const gameOverModal = document.querySelector(".game-over");

// Buttons
const startButton = document.querySelector(".btn-start");
const pauseButton = document.querySelector(".pause-button");
const resumeButton = document.querySelector(".btn-resume");
const restartButton = document.querySelector(".btn-restart");

// Stats Displays
const scoreDisplay = document.querySelector("#score");
const highScoreDisplay = document.querySelector("#high-score");
const timeDisplay = document.querySelector("#time");

// Modal Stats Displays
const pauseScoreDisplay = document.querySelector("#pause-score");
const pauseTimeDisplay = document.querySelector("#pause-time");
const gameOverScoreDisplay = document.querySelector("#game-over-score");
const gameOverTimeDisplay = document.querySelector("#game-over-time");
const newHighScoreBadge = document.querySelector("#new-high-score-badge");

// Grid Dimensions
const blockHeight = 30;
const blockWidth = 30;
const cols = Math.max(10, Math.floor((boardWrapper.clientWidth || board.clientWidth) / blockWidth));
const rows = Math.max(10, Math.floor((boardWrapper.clientHeight || board.clientHeight) / blockHeight));

// Explicit Grid Sizing for Board
board.style.gridTemplateColumns = `repeat(${cols}, ${blockWidth}px)`;
board.style.gridTemplateRows = `repeat(${rows}, ${blockHeight}px)`;

// Game State Variables
const HIGH_SCORE_KEY = "snake_game_high_score";
let highScore = parseInt(localStorage.getItem(HIGH_SCORE_KEY), 10) || 0;
let score = 0;
let secondsElapsed = 0;
let timerInterval = null;
let intervalId = null;
let gameState = "initial"; // "initial" | "running" | "paused" | "gameover"

let blocks = {};
let snake = [];
let food = { x: 0, y: 0 };
let direction = "right";
let nextDirection = "right";

// Show initial high score
highScoreDisplay.textContent = highScore;

// Generate Grid Cells
for (let row = 0; row < rows; row++) {
  for (let col = 0; col < cols; col++) {
    const cell = document.createElement("div");
    cell.classList.add("blocks");
    board.appendChild(cell);
    blocks[`${row}-${col}`] = cell;
  }
}

// Timer Functions
function formatTime(totalSeconds) {
  const mins = Math.floor(totalSeconds / 60);
  const secs = totalSeconds % 60;
  return `${mins}:${secs < 10 ? "0" : ""}${secs}`;
}

function startTimer() {
  clearInterval(timerInterval);
  timerInterval = setInterval(() => {
    secondsElapsed++;
    timeDisplay.textContent = formatTime(secondsElapsed);
  }, 1000);
}

function stopTimer() {
  clearInterval(timerInterval);
  timerInterval = null;
}

function resetTimer() {
  stopTimer();
  secondsElapsed = 0;
  timeDisplay.textContent = formatTime(secondsElapsed);
}

// High Score Persistence
function updateHighScore() {
  if (score > highScore) {
    highScore = score;
    localStorage.setItem(HIGH_SCORE_KEY, highScore);
    highScoreDisplay.textContent = highScore;
    return true;
  }
  return false;
}

// Modal View Switcher
function showModal(screen) {
  modal.style.display = "flex";
  startGameModal.style.display = screen === "start" ? "flex" : "none";
  pauseGameModal.style.display = screen === "pause" ? "flex" : "none";
  gameOverModal.style.display = screen === "gameover" ? "flex" : "none";
}

function hideModal() {
  modal.style.display = "none";
  startGameModal.style.display = "none";
  pauseGameModal.style.display = "none";
  gameOverModal.style.display = "none";
}

// Food Spawning (Guaranteed not on snake body)
function generateFood() {
  if (blocks[`${food.x}-${food.y}`]) {
    blocks[`${food.x}-${food.y}`].classList.remove("food");
  }

  let newFood;
  let attempts = 0;
  do {
    newFood = {
      x: Math.floor(Math.random() * rows),
      y: Math.floor(Math.random() * cols),
    };
    attempts++;
  } while (
    attempts < 300 &&
    snake.some((seg) => seg.x === newFood.x && seg.y === newFood.y)
  );

  food = newFood;
  if (blocks[`${food.x}-${food.y}`]) {
    blocks[`${food.x}-${food.y}`].classList.add("food");
  }
}

// Start / Restart Game Handler
function restart() {
  // Clear any existing snake blocks
  snake.forEach((segment) => {
    if (blocks[`${segment.x}-${segment.y}`]) {
      blocks[`${segment.x}-${segment.y}`].classList.remove("fill", "head-fill");
    }
  });

  // Clear existing food block
  if (blocks[`${food.x}-${food.y}`]) {
    blocks[`${food.x}-${food.y}`].classList.remove("food");
  }

  // Reset metrics
  score = 0;
  scoreDisplay.textContent = score;
  resetTimer();

  // Reset Snake Position (Centered with 3 segments)
  const startRow = Math.floor(rows / 2);
  const startCol = Math.max(3, Math.floor(cols / 4));
  snake = [
    { x: startRow, y: startCol },
    { x: startRow, y: startCol - 1 },
    { x: startRow, y: startCol - 2 },
  ];
  direction = "right";
  nextDirection = "right";

  // Render initial snake segments
  snake.forEach((segment, idx) => {
    if (blocks[`${segment.x}-${segment.y}`]) {
      blocks[`${segment.x}-${segment.y}`].classList.add("fill");
      if (idx === 0) {
        blocks[`${segment.x}-${segment.y}`].classList.add("head-fill");
      }
    }
  });

  // Spawn fresh food
  generateFood();

  // Begin active gameplay
  gameState = "running";
  hideModal();
  startTimer();
  clearInterval(intervalId);
  intervalId = setInterval(renderSnake, 180);
}

// Pause Game Handler
function pauseGame() {
  if (gameState !== "running") return;

  gameState = "paused";
  clearInterval(intervalId);
  intervalId = null;
  stopTimer();

  pauseScoreDisplay.textContent = score;
  pauseTimeDisplay.textContent = formatTime(secondsElapsed);
  showModal("pause");
}

// Resume Game Handler
function resumeGame() {
  if (gameState !== "paused") return;

  gameState = "running";
  hideModal();
  startTimer();
  intervalId = setInterval(renderSnake, 180);
}

// Game Over Handler
function handleGameOver() {
  clearInterval(intervalId);
  intervalId = null;
  stopTimer();
  gameState = "gameover";

  const isNewRecord = score > 0 && score >= highScore;
  updateHighScore();

  gameOverScoreDisplay.textContent = score;
  gameOverTimeDisplay.textContent = formatTime(secondsElapsed);

  if (isNewRecord) {
    newHighScoreBadge.style.display = "block";
  } else {
    newHighScoreBadge.style.display = "none";
  }

  showModal("gameover");
}

// Main Game Loop Step
function renderSnake() {
  direction = nextDirection;
  let head = { x: snake[0].x, y: snake[0].y };

  if (direction === "left") {
    head.y -= 1;
  } else if (direction === "right") {
    head.y += 1;
  } else if (direction === "up") {
    head.x -= 1;
  } else if (direction === "down") {
    head.x += 1;
  }

  // 1. Boundary Wall Collision Check
  if (head.x < 0 || head.x >= rows || head.y < 0 || head.y >= cols) {
    handleGameOver();
    return;
  }

  // 2. Self Collision Check
  if (snake.some((segment) => segment.x === head.x && segment.y === head.y)) {
    handleGameOver();
    return;
  }

  // Remove previous head highlight
  if (blocks[`${snake[0].x}-${snake[0].y}`]) {
    blocks[`${snake[0].x}-${snake[0].y}`].classList.remove("head-fill");
  }

  // 3. Food Collision Check
  if (head.x === food.x && head.y === food.y) {
    score += 10;
    scoreDisplay.textContent = score;
    updateHighScore();

    // Snake grows: unshift head without popping tail
    snake.unshift(head);
    if (blocks[`${head.x}-${head.y}`]) {
      blocks[`${head.x}-${head.y}`].classList.add("fill", "head-fill");
    }

    generateFood();
  } else {
    // Normal movement: unshift head and pop tail
    snake.unshift(head);
    if (blocks[`${head.x}-${head.y}`]) {
      blocks[`${head.x}-${head.y}`].classList.add("fill", "head-fill");
    }

    const tail = snake.pop();
    if (blocks[`${tail.x}-${tail.y}`]) {
      blocks[`${tail.x}-${tail.y}`].classList.remove("fill", "head-fill");
    }
  }
}

// Event Listeners
startButton.addEventListener("click", restart);
restartButton.addEventListener("click", restart);
resumeButton.addEventListener("click", resumeGame);

pauseButton.addEventListener("click", () => {
  if (gameState === "running") {
    pauseGame();
  } else if (gameState === "paused") {
    resumeGame();
  }
});

window.addEventListener("keydown", (event) => {
  // Prevent page scrolling with navigation keys
  if (["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight", " "].includes(event.key)) {
    event.preventDefault();
  }

  // Spacebar or KeyP toggles pause/resume
  if (event.code === "Space" || event.key === "p" || event.key === "P") {
    if (gameState === "running") {
      pauseGame();
    } else if (gameState === "paused") {
      resumeGame();
    }
    return;
  }

  // Prevent 180-degree instant reversal into own neck
  if (event.key === "ArrowUp" && direction !== "down") {
    nextDirection = "up";
  } else if (event.key === "ArrowDown" && direction !== "up") {
    nextDirection = "down";
  } else if (event.key === "ArrowLeft" && direction !== "right") {
    nextDirection = "left";
  } else if (event.key === "ArrowRight" && direction !== "left") {
    nextDirection = "right";
  }
});
