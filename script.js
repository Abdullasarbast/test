if (typeof CanvasRenderingContext2D.prototype.roundRect === "undefined") {
  CanvasRenderingContext2D.prototype.roundRect = function (
    x,
    y,
    width,
    height,
    radius
  ) {
    if (width < 2 * radius) radius = width / 2;
    if (height < 2 * radius) radius = height / 2;
    this.beginPath();
    this.moveTo(x + radius, y);
    this.arcTo(x + width, y, x + width, y + height, radius);
    this.arcTo(x + width, y + height, x, y + height, radius);
    this.arcTo(x, y + height, x, y, radius);
    this.arcTo(x, y, x + width, y, radius);
    this.closePath();
    return this;
  };
}

const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");
const scoreElement = document.getElementById("score");
const highscoreElement = document.getElementById("highscore");
const gameOverElement = document.getElementById("gameOver");
const restartButton = document.getElementById("restart");
const soundButton = document.getElementById("sound-btn");
const startScreen = document.getElementById("start-screen");
const gameScreen = document.getElementById("game-screen");
const startButton = document.getElementById("start-button");

const gridSize = 20;
const tileCount = canvas.width / gridSize;

const eatSound = new Audio("sounds/eat.wav");
const gameOverSound = new Audio("sounds/game-over.wav");

let snake = [{ x: 10, y: 10 }];
let food = {};
let direction = "right";
let score = 0;
let highscore = localStorage.getItem("highscore") || 0;
highscoreElement.textContent = highscore;
let gameOver = false;
let gameSpeed = 100; // Hardcoded speed
let soundOn = true;

function generateFood() {
  food = {
    x: Math.floor(Math.random() * tileCount),
    y: Math.floor(Math.random() * tileCount),
  };

  // Ensure food doesn't spawn on the snake
  for (let segment of snake) {
    if (segment.x === food.x && segment.y === food.y) {
      generateFood();
      return;
    }
  }
}

function drawGrid() {
  for (let y = 0; y < tileCount; y++) {
    for (let x = 0; x < tileCount; x++) {
      if ((x + y) % 2 === 0) {
        ctx.fillStyle = "#aad751";
      } else {
        ctx.fillStyle = "#a2d149";
      }
      ctx.fillRect(x * gridSize, y * gridSize, gridSize, gridSize);
    }
  }
}

function draw() {
  drawGrid();

  // Draw snake
  snake.forEach((segment, index) => {
    if (index === 0) {
      // Head
      ctx.fillStyle = "#4674E9";
      ctx.beginPath();
      ctx.roundRect(
        segment.x * gridSize,
        segment.y * gridSize,
        gridSize,
        gridSize,
        6
      );
      ctx.fill();

      // Eyes
      ctx.fillStyle = "white";
      let eye1X, eye1Y, eye2X, eye2Y;
      const eyeSize = 3;
      const pupilSize = 1.5;

      switch (direction) {
        case "right":
          eye1X = segment.x * gridSize + gridSize * 0.7;
          eye1Y = segment.y * gridSize + gridSize * 0.3;
          eye2X = eye1X;
          eye2Y = segment.y * gridSize + gridSize * 0.7;
          break;
        case "left":
          eye1X = segment.x * gridSize + gridSize * 0.3;
          eye1Y = segment.y * gridSize + gridSize * 0.3;
          eye2X = eye1X;
          eye2Y = segment.y * gridSize + gridSize * 0.7;
          break;
        case "up":
          eye1X = segment.x * gridSize + gridSize * 0.3;
          eye1Y = segment.y * gridSize + gridSize * 0.3;
          eye2X = segment.x * gridSize + gridSize * 0.7;
          eye2Y = eye1Y;
          break;
        case "down":
          eye1X = segment.x * gridSize + gridSize * 0.3;
          eye1Y = segment.y * gridSize + gridSize * 0.7;
          eye2X = segment.x * gridSize + gridSize * 0.7;
          eye2Y = eye1Y;
          break;
      }
      ctx.beginPath();
      ctx.arc(eye1X, eye1Y, eyeSize, 0, Math.PI * 2);
      ctx.arc(eye2X, eye2Y, eyeSize, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = "black";
      ctx.beginPath();
      ctx.arc(eye1X, eye1Y, pupilSize, 0, Math.PI * 2);
      ctx.arc(eye2X, eye2Y, pupilSize, 0, Math.PI * 2);
      ctx.fill();
    } else {
      // Body
      ctx.fillStyle = "#4674E9";
      ctx.beginPath();
      ctx.roundRect(
        segment.x * gridSize + 2,
        segment.y * gridSize + 2,
        gridSize - 4,
        gridSize - 4,
        4
      );
      ctx.fill();
    }
  });

  // Draw food (apple)
  ctx.fillStyle = "#E7471D";
  ctx.beginPath();
  ctx.roundRect(food.x * gridSize, food.y * gridSize, gridSize, gridSize, 8);
  ctx.fill();
  //Stalk
  ctx.fillStyle = "#A5603A";
  ctx.fillRect(
    food.x * gridSize + gridSize / 2 - 1,
    food.y * gridSize - 3,
    3,
    5
  );
  //Leaf
  ctx.fillStyle = "#65B239";
  ctx.beginPath();
  ctx.roundRect(
    food.x * gridSize + gridSize / 2 + 1,
    food.y * gridSize - 2,
    8,
    4,
    2
  );
  ctx.fill();
}

function update() {
  if (gameOver) {
    return;
  }

  const head = { x: snake[0].x, y: snake[0].y };

  // Move snake
  switch (direction) {
    case "up":
      head.y--;
      break;
    case "down":
      head.y++;
      break;
    case "left":
      head.x--;
      break;
    case "right":
      head.x++;
      break;
  }

  // Check for collision with food
  if (head.x === food.x && head.y === food.y) {
    score++;
    scoreElement.textContent = score;
    if (soundOn) eatSound.play();
    generateFood();
  } else {
    snake.pop();
  }

  snake.unshift(head);

  // Check for collision with walls or self
  if (
    head.x < 0 ||
    head.x >= tileCount ||
    head.y < 0 ||
    head.y >= tileCount ||
    checkSelfCollision(head)
  ) {
    gameOver = true;
    if (soundOn) gameOverSound.play();
    if (score > highscore) {
      highscore = score;
      localStorage.setItem("highscore", highscore);
      highscoreElement.textContent = highscore;
    }
    gameOverElement.classList.remove("hidden");
    setTimeout(showStartScreen, 2000);
  }
}

function checkSelfCollision(head) {
  for (let i = 1; i < snake.length; i++) {
    if (head.x === snake[i].x && head.y === snake[i].y) {
      return true;
    }
  }
  return false;
}

function restartGame() {
  snake = [{ x: 10, y: 10 }];
  direction = "right";
  score = 0;
  scoreElement.textContent = score;
  gameOver = false;
  gameOverElement.classList.add("hidden");
  generateFood();
  gameLoop();
}

function showStartScreen() {
  startScreen.classList.remove("hidden");
  gameScreen.classList.add("hidden");
  gameOverElement.classList.add("hidden");
}

function startGame() {
  startScreen.classList.add("hidden");
  gameScreen.classList.remove("hidden");
  gameOverElement.classList.add("hidden");
  restartGame();
}

let gameLoopTimeout;
function gameLoop() {
  if (gameOver) {
    clearTimeout(gameLoopTimeout);
    return;
  }
  update();
  draw();
  gameLoopTimeout = setTimeout(gameLoop, gameSpeed);
}

document.addEventListener("keydown", (e) => {
  switch (e.key) {
    case "ArrowUp":
      if (direction !== "down") direction = "up";
      break;
    case "ArrowDown":
      if (direction !== "up") direction = "down";
      break;
    case "ArrowLeft":
      if (direction !== "right") direction = "left";
      break;
    case "ArrowRight":
      if (direction !== "left") direction = "right";
      break;
  }
});

soundButton.addEventListener("click", () => {
  soundOn = !soundOn;
  soundButton.src = soundOn ? "img/volume-on.png" : "img/volume-off.png";
});

startButton.addEventListener("click", startGame);

showStartScreen();
