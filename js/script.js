/* === 캔버스 정의 === */
const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

function resizeCanvas() {
  const container = document.getElementById("game-container");
  const canvas = document.getElementById("gameCanvas");
  const uiPanel = document.getElementById("uiPanel");

  const containerWidth = container.clientWidth;
  const containerHeight = container.clientHeight;

  const canvasSize = Math.min(containerWidth * 0.6, containerHeight);

  canvas.style.width = `${canvasSize}px`;
  canvas.style.height = `${canvasSize}px`;
  canvas.width = canvasSize;
  canvas.height = canvasSize;

  uiPanel.style.width = `${containerWidth - canvasSize}px`;
  uiPanel.style.height = `${canvasSize}px`;
}

window.addEventListener("resize", resizeCanvas);
window.addEventListener("load", resizeCanvas);

/* === 공통 게임 상태 관리 === */
const gameState = {
  stageOrder: ["easy", "medium", "hard"],
  stage:"easy",
  isRunning: false,
  gameStatus: "PLAYING", // READY, PLAYING, GAME_OVER, STAGE_CLEAR, ENDING
  lives: 3,
  score: 0,
  isDead: false,
  ballReadyToMove: false,

  fullSentence: "",
  totalScore: 0,
  brickCount: 0,
  messageCount: 0,

  puzzleBoard: Array(9).fill(null),
  intensity: 5,
  confessionUnlocked: false,
  protectionBricks: [12, 13, 14], // 보호 벽돌 관련 함수 구현 예정
  confessionIndex: 13 // 고백 벽돌 관련 함수 구현 예정
}

// 게임 상태
let isDead = false;
let ballReadyToMove = false;
let score = 0;
let lives = 3;
let gameStatus = "PLAYING"; 

const stageConfig = {
  easy: {
    puzzleCount: 9,
    slotPrefix: "slot-",
    endMessageSelector: "#endMessage",
    messageText: "기억 완성!",
    resetPosition: {top: "0px", left: "0px"},
    puzzleSize: 4
  },
  medium: {
    chatBoxSelector: "#talk-box",
    wordScores: [
      {text: "안녕! 오늘 시간 괜찮아?", score: 3},
      {text: "같이 밥 먹으러 갈래?", score: 4},
      {text: "뭐?", score: 1},
      {text: "어쩌라고", score: 2},
      {text: "싫어", score: 0},
    ]
  }
}

/* === A: 게임 엔진 & 상태 관리 === */
// 공
let ballRadius = 10;
let ballX = canvas.width / 2;
let ballY = canvas.height-200;
let ballDX = 2;
let ballDY = -6;

// 패들
let paddleWidth = 120;
let paddleHeight = 20;
let paddleX = canvas.width/ 2;
let paddleY = canvas.height - paddleHeight + 30;;
let paddleSpeed = 7;
let paddleDX = 0;

// 키 입력 상태
let leftPressed = false;
let rightPressed = false;

// 벽돌
let bricks = [];

const stageSettings = {
  EASY: {
    rows: 3, cols: 3, width: 150, height: 50, padding: 10,
    offsetX: 50, offsetY: 60, ballSpeed: 5, ballRadius: 12, paddleWidth: 120
  },
  MEDIUM: {
    rows: 4, cols: 6, width: 120, height: 25, padding: 8,
    offsetX: 40, offsetY: 50, ballSpeed: 5, ballRadius: 10, paddleWidth: 120
  },
  HARD: {
    rows: 3, cols: 3, width: 100, height: 20, padding: 6,
    offsetX: 30, offsetY: 40, ballSpeed: 5, ballRadius: 8, paddleWidth: 120
  }
};

function Brick(x, y, type, index, text) {//벽돌 정의: D파트 디자인 추가 예
  this.x = x;
  this.y = y;
  this.width = 150;
  this.height = 30;
  this.alive = true;
  this.type = type;
  this.index = index; // easy 모드에서 사용할 벽돌 index
  this.text = text; // medium 모드에서 사용할 벽돌 text (stageConfig.medium.wordScores로 초기화)
  this.draw = function(ctx) {
    if (!this.alive) return;
    ctx.fillStyle = "black";
    ctx.fillRect(this.x, this.y, this.width, this.height);
  };
}

function getRandomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function getRandomMediumText() {
  const wordList = stageConfig.medium.wordScores;
  const randomIndex = Math.floor(Math.random() * wordList.length);
  return wordList[randomIndex].text;
}

function generateBricks(stage) {
  bricks = [];
  const s = stageSettings[stage.toUpperCase()];
  if (!s) return;

  const totalWidth = s.cols * s.width + (s.cols - 1) * s.padding;
  const offsetX = (canvas.width - totalWidth) / 2;

  let index = getRandomInt(0, stageConfig.easy.puzzleCount);
  let text = getRandomMediumText();

  for (let r = 0; r < s.rows; r++) {
    for (let c = 0; c < s.cols; c++) {
      const x = offsetX + c * (s.width + s.padding);
      const y = s.offsetY + r * (s.height + s.padding);
      const brick = new Brick(x, y, gameState.stage.toUpperCase(), index, text);
      brick.width = s.width;
      brick.height = s.height;
      bricks.push(brick);
    }
  }
}

function applyStageSettings(stage) {
  const s = stageSettings[gameState.stage.toUpperCase()];
  if (!s) return;
  ballRadius = s.ballRadius;
  ballDX = s.ballSpeed;
  ballDY = -s.ballSpeed;
  paddleWidth = s.paddleWidth;
  paddleX = (canvas.width - paddleWidth) / 2;

  paddleY = canvas.height * 0.9;
}

// 키 이벤트
document.addEventListener("keydown", function(e) {
  if (e.key == "ArrowLeft") leftPressed = true;
  if (e.key == "ArrowRight") rightPressed = true;

  if (e.code == "Space") {
    if (gameStatus == "GAME_OVER") {
      score = 0;
      lives = 3;
      isDead = false;
      gameStatus = "PLAYING";
      updateUI(gameState.stage);
      generateBricks(gameState.stage);
      applyStageSettings(gameState.stage);
      ballReadyToMove = false;
      setTimeout(() => { ballReadyToMove = true; }, 1000);
    } 
    else if (isDead && gameStatus == "PLAYING") {
      isDead = false;
      ballX = paddleX + paddleWidth / 2;
      ballY = paddleY - 50;
      ballDX = stageSettings[gameState.stage.toUpperCase()].ballSpeed;
      ballDY = -ballDX;
      ballReadyToMove = false;
      setTimeout(() => { ballReadyToMove = true; }, 1000);
    }
  }
});

document.addEventListener("keyup", function(e) {
  if (e.key == "ArrowLeft") leftPressed = false;
  if (e.key == "ArrowRight") rightPressed = false;
});

function drawBall() {
  ctx.beginPath();
  ctx.arc(ballX, ballY, ballRadius, 0, Math.PI * 2);
  ctx.fillStyle = "#f55";
  ctx.fill();
  ctx.closePath();
}

function drawPaddle() {
  ctx.beginPath();
  ctx.rect(paddleX, paddleY, paddleWidth, paddleHeight);
  ctx.fillStyle = "#333";
  ctx.fill();
  ctx.closePath();
}

function drawBricks() {//벽돌 출력: A파트 스테이지별 벽돌 배치 예정
  for (let i = 0; i < bricks.length; i++) {
    bricks[i].draw(ctx);
  }
}

function drawUI() {
  ctx.fillStyle = "#222";
  ctx.font = "16px 'Share Tech'";
  ctx.fillText("Score: " + score, 20, 30);
  ctx.fillText("Lives: " + lives, canvas.width - 100, 30);

  if (isDead && lives > 0) {
    ctx.fillStyle = "#000";
    ctx.font = "32px 'Share Tech'";
    ctx.textAlign = "center";
    ctx.fillText("out", canvas.width / 2, canvas.height / 2);
    ctx.textAlign = "start";
  }
}

function collisionCheck() {
  for (let i = 0; i < bricks.length; i++) {
    const b = bricks[i];

    // 벽돌 존재 & 공과 충돌
    if (b.alive &&
      ballX + ballRadius > b.x &&
      ballX - ballRadius < b.x + b.width &&
      ballY + ballRadius > b.y &&
      ballY - ballRadius < b.y + b.height) {
      ballDY = -ballDY;
      b.alive = false;
      //우선 배점 10점으로 설정
      score += 10;
      onBrickHit(b); // 벽돌 충돌 후 함수 호출

      // 벽돌이 존재X -> 게임 클리어 판단
      if (bricks.filter(brick => brick.alive).length == 0) {
        gameStatus = "STAGE_CLEAR";
        ballDX = 0;
        ballDY = 0;
      }
    }
  }
}

function update() {
  paddleDX = leftPressed ? -paddleSpeed : rightPressed ? paddleSpeed : 0;
  paddleX += paddleDX;
  paddleX = Math.max(0, Math.min(canvas.width - paddleWidth, paddleX));

  if (ballReadyToMove && (ballDX !== 0 || ballDY !== 0)) {
    ballX += ballDX;
    ballY += ballDY;
  }

  // 천장, 벽 충돌
  if (ballX < ballRadius || ballX > canvas.width - ballRadius)
    ballDX = -ballDX;
  if (ballY < ballRadius)
    ballDY = -ballDY;

  // 바닥 충돌
  if (!isDead && ballY + ballRadius >= canvas.height && gameStatus != "STAGE_CLEAR") {
    isDead = true;
    if (--lives == 0) gameStatus = "GAME_OVER";
    ballDX = 0;
    ballDY = 0;
  }

  // 패들 충돌
  if (ballY + ballRadius >= paddleY && ballX >= paddleX && ballX <= paddleX + paddleWidth) {
    ballDY = -ballDY;
  }

  collisionCheck();
}

function draw() {
  ctx.save();

  const scaleX = canvas.clientWidth / canvas.width;
  const scaleY = canvas.clientHeight / canvas.height;
  ctx.scale(scaleX, scaleY);

  ctx.clearRect(0, 0, canvas.width, canvas.height);

  drawBricks();
  drawBall();
  drawPaddle();
  drawUI();

  if (gameStatus == "PLAYING") update();
  else if (gameStatus == "STAGE_CLEAR") {
    ctx.font = "24px 'Share Tech'";
    ctx.textAlign = "center";
    ctx.fillStyle = "#007";
    ctx.fillText("Stage Clear!", canvas.width / 2, canvas.height / 2);
    ctx.textAlign = "start";

    if (!draw.nextStageScheduled) {
      draw.nextStageScheduled = true;
      setTimeout(() => {
        const currentIdx = gameState.stageOrder.indexOf(gameState.stage); //변수명 수정
        if (currentIdx < gameState.stageOrder.length - 1) { //변수명 수정
          const nextStage = gameState.stageOrder[currentIdx + 1]; //변수명 수정
          
          gameState.stage = nextStage; //gameState.stage를 인자로 직접 전달
          generateBricks(gameState.stage); //위와 동일
          applyStageSettings(gameState.stage); //위와 동일

          ballX = canvas.width / 2;
          ballY = canvas.height - 200;
          isDead = false;
          lives = 3;
          gameStatus = "PLAYING";
          updateStageView(gameState.stage); //패널 업데이트 추가
          ballReadyToMove = false;
          setTimeout(() => { ballReadyToMove = true; }, 1000);
        } else {
          gameStatus = "ENDING";
        }
        draw.nextStageScheduled = false;
      }, 2000);
    }
  } else if (gameStatus == "GAME_OVER") {
    ctx.font = "24px 'Share Tech'";
    ctx.textAlign = "center";
    ctx.fillStyle = "#700";
    ctx.fillText("Game Over", canvas.width / 2, canvas.height / 2);
    ctx.fillText("Press Spacebar to Try Again", canvas.width / 2, canvas.height / 2 + 40);
    ctx.textAlign = "start";
  } else if (gameStatus == "ENDING") {//엔딩 시 동작: D파트 엔딩 연출과 연결
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    if (!draw.endingTriggered) {
      draw.endingTriggered = true;
      // UI 종료 후 fade 전환 등 처리
      alert("모든 스테이지를 클리어했습니다!");
    }
  }

  ctx.restore();
}

/* === B: 우측 UI 출력 === */
function updateStageView(stage) {
  //모든 보드 숨기기
  $('#puzzle-board, #talk-box, #emotion-graph').hide();
  updateUI(stage);

  //스테이지별로 필요한 UI만 보이기
  switch (stage) {
    case 'easy': {
      $('#puzzle-board').show();
      break;
    }
    case 'medium': {
        $('#talk-box').show();
            break;
    }
    case 'hard': {
      $('#emotion-graph').show();
      break;
    }     
  }
}

//게임오버되면 UI 리셋
function updateUI(stage) {
  switch (stage) {
    case 'easy': {
      for (let i=0;i<stageConfig.easy.puzzleCount;i++) {
        $(`#slot-${i}`).attr({"src":"assets/img/gray.png"});
        puzzleState.board[i] = null;
      }
      break;
    }
    case 'medium': {
      var container = document.getElementById("chatting");
      var child = container.querySelectorAll(".message");
      for (let i=0; i<child.length; i++) {
        container.removeChild(child[i]);
      }
      break;
    }
    case 'hard': {
      gameState.intensity = 5;
      updateGraphMovement(gameState.intensity);
      break;
    }
  }
}

//easy 스테이지
function revealPuzzleImage(index) {
  $(`#slot-${index}`).attr("src", `assets/img/puzzle-${index+1}.png`);
}

const reactionMap = [
  { min: 3, text: "😊" },
  { min: 2, text: "😐" },
  { min: 0, text: "😢" }
];

//점수에 따른 반응 표시 함수
function getReactionText(score) {
  return (reactionMap.find(r => score >= r.min) || {}).text || "";
}

//메시지 출력
function sendMessage(message, score) {
  var chatting = document.getElementById("chatting");
  if (message == "") return;
  gameState.fullSentence == "";

  $(".message").animate({bottom: "+=100px"});

  var container = document.createElement("div");
  container.classList.add("message", "new");

  var sentContainer = document.createElement("div");
  sentContainer.setAttribute("class", "sent");

  var sentDiv = document.createElement("div");
  sentDiv.setAttribute("class", "sent-content");
  sentDiv.innerHTML = message;
  sentContainer.appendChild(sentDiv);
  //chatLine.remove();  // 복제 후 원본 삭제

  var sentImg = document.createElement("img");
  sentImg.setAttribute("class", "player-chat-img");
  sentImg.setAttribute("src", "assets/img/kakaotalk-talk.png");
  sentContainer.appendChild(sentImg);

  container.appendChild(sentContainer);
  chatting.appendChild(container);
  $(sentContainer).animate({bottom: "+=50px"});

  setTimeout(() => {
    container.classList.remove("new");

    var replyContainer = document.createElement("div");
    replyContainer.setAttribute("class", "reply");

    var replyText = getReactionText(score);
    var replyDiv = document.createElement("div");
    replyDiv.setAttribute("class", "reply-line");
    replyDiv.textContent = replyText;
    replyContainer.appendChild(replyDiv);
  
    var replyImg = document.createElement("img");
    replyImg.setAttribute("class", "reply-chat-img");
    replyImg.setAttribute("src", "assets/img/kakaotalk-reply.png");
    replyContainer.appendChild(replyImg);

    container.appendChild(replyContainer);
  }, 400);
}

//hard 스테이지
//감정 그래프 및 이미지 속도 변화 함수
function updateGraphMovement(intensity) {
  const video = document.getElementById("graph-video");
  let rate;
  if (intensity >= 0) rate = 4;
  else if (intensity >= -5) rate = 3.5;
  else if (intensity >= -10) rate = 3.0;
  else if (intensity >= -15) rate = 2.5;
  else if (intensity >= -20) rate = 2.0;
  else if (intensity >= -25) rate = 1.5;
  else rate = 1.0;

  video.playbackRate = rate;
  const baseDuration = 3;
  document.getElementById("heart").style.animationDuration = `${baseDuration / (rate)}s`;

  console.log(rate); //디버깅 코드
}

/* === C: 스테이지별 게임 규칙 === */
function onBrickHit(brick) {
  switch (gameState.stage) {
  case "easy":
    handleEasyBrick(brick);
    break;
  case "medium":
    handleMediumBrick(brick);
    break;
  case "hard":
    handleHardBrick(brick);
    break;
  }
}

const puzzleState = {
  board: Array(stageConfig.easy.puzzleCount).fill(null)
};

function handleEasyBrick(brick) {
  const conf = stageConfig.easy;
  const index = brick.index;

  if(isNaN(index) || index < 0 || index >= conf.puzzleCount) {
    console.warn("잘못된 퍼즐 인덱스 : ", index);
    return;
  }

  const slotSelector = `${conf.slotPrefix}${index}`;

  if (!puzzleState.board[index]) {
    puzzleState.board[index] = true

    revealPuzzleImage(index);
    checkChainReaction();

    if (puzzleState.board.every(Boolean)) {
      $("#puzzle-board").css("gap", "0px");
      $(conf.endMessageSelector)
        .removeClass("hidden")
        .text(conf.messageText);
    }
  } else {
    console.log("예외");
  }
}

function checkChainReaction() {
  const conf = stageConfig.easy;
  const n = conf.puzzleSize;
  const total = n*n;

  const visited = Array(total).fill(false);
  const colorMap = new Array(total);

  for (i = 0; i < total; i++) {
    const $piece = $(`#${conf.slotPrefix}${i}.fixed`);
    colorMap[i] = $piece.length > 0 ? $piece.data("piece-color") : null;
  }

  function getAdj(index) {
    const row = Math.floor(index / n);
    const col = index % n;
    const adj = [];

    if (col > 0) adj.push(index - 1);
    if (col < n - 1) adj.push(index + 1);
    if (row > 0) adj.push(index - n);
    if (row < n-1) adj.push(index + n);

    return adj;
  }

  function bfs(start, color) {
    const queue = [start];
    const chain = [start];
    visited[start] = true;

    while (queue.length > 0) {
      const current = queue.shift();
      for (const next of getAdj(current)) {
        if (!visited[next] && colorMap[next] === color) {
          visited[next] = true;
          queue.push(next);
          chain.push(next);
        }
      }
    }
    return chain;
  }

  for (i = 0; i < total; i++) {
    if (!visited[i] && colorMap[i]) {
      const chain = bfs(i, colorMap[i]);

      if (chain.length >= 3){
        chain.forEach(idx => {
          $(`#${conf.slotPrefix}${idx} .fixed`).remove();
          puzzleState.board[idx] = null;
        });

        console.log("연쇄 반응");
      }
    }
  }
}

function getScoreForText(text) {
  const scores = stageConfig.medium.wordScores;
  const entry = scores.find(item => item.text === text);
  return entry ? entry.score : 0;
}

function handleMediumBrick(brick) {
  const conf = stageConfig.medium;

  var text = "";
  text = brick.text;
  if (!text) return;
  //gameState.fullSentence += text;
  
  const score = getScoreForText(text);

  var message = `${text}(+${score})`; 

  sendMessage(message, score);
}

function updateCanvasShake(intensity) {
  const canvas = document.getElementById("gameCanvas");

  let shakeValue;
  switch (intensity) {
    case 5: shakeValue = "5px"; break;
    case 4: shakeValue = "4px"; break;
    case 3: shakeValue = "3px"; break;
    case 2: shakeValue = "2px"; break;
    case 1: shakeValue = "1px"; break;
    default: shakeValue = "0px"; break;
  }

  canvas.style.setProperty("--shake-x", shakeValue);
  canvas.style.setProperty("--shake-y", shakeValue);

  if (intensity > 0) {
    canvas.classList.add("shaky");
  } else {
    canvas.classList.remove("shaky");
  }
}

function handleHardBrick(brick) {
  const idx = parseInt(brick.index);
  const isConfession = brick.type === "confession";

  if (isConfession) {
    if (gameState.confessionUnlocked) {
      console.log("고백");
    }else {
      console.log("실패");
    }
  }else{
    gameState.intensity--;
    updateCanvasShake(gameState.intensity);
    updateGraphMovement(gameState.intensity);
  }
}

/* === D: 디자인 및 설정 기능 === */

document.getElementById("settingButton").addEventListener("click", function() {
  console.log("게임 설정 화면");

  document.getElementById("select-page").style.display = "none";
  document.getElementById("game-setting").style.display = "flex";
});


/* === 전체 화면 유지 코드 === */
function isFullScreen() {
  return document.fullscreenElement != null
    || document.webkitFullscreenElement != null
    || document.mozFullScreenElement != null
    || document.msFullscreenElement != null;
}

function requestFullScreen() {
  const el = document.documentElement;
  if (el.requestFullscreen) {
    el.requestFullscreen();
  } else if (el.webkitRequestFullscreen) {
    el.webkitRequestFullscreen();
  } else if (el.mozRequestFullScreen) {
    el.mozRequestFullScreen();
  } else if (el.msRequestFullscreen) {
    el.msRequestFullscreen();
  }
}

let timer = null

document.getElementById("startButton").addEventListener("click", () => {
  if (!isFullScreen()) {
    alert("더 나은 게임 경험을 위해 전체화면으로 전환됩니다.");
    requestFullScreen();
    return;
  }
  document.getElementById("initView").style.display = "none";
  document.getElementById("firstStory").style.display = "flex";
});

$("#select-page").find(".stage").eq(0).on("click", function() {
  mainGame(0);
});
$("#select-page").find(".stage").eq(1).on("click", function() {
  mainGame(1);
});
$("#select-page").find(".stage").eq(2).on("click", function() {
  mainGame(2);
});

function mainGame(handler){
  alert(handler);
  switch(handler){
  case 0: gameState.stage = "easy"; break;
  case 1: gameState.stage = "medium"; break;
  case 2: gameState.stage = "hard"; break;
  }
  gameState.isRunning = true;
  console.log("게임 시작됨. 스테이지:", gameState.stage);

  document.getElementById("select-page").style.display = "none";
  document.getElementById("game-container").style.display = "flex";
  document.getElementById("gameCanvas").style.display = "block";
  document.getElementById("uiPanel").style.display = "block";

  console.log(document.getElementById("gameCanvas").width, document.getElementById("gameCanvas").height);
 
  resizeCanvas();

  generateBricks(gameState.stage);
  applyStageSettings(gameState.stage);
  ballReadyToMove = false;
  setTimeout(() => { ballReadyToMove = true; }, 1000);
  if(timer) clearInterval(timer);
  timer = setInterval(draw, 16);

  updateStageView(gameState.stage);

  if (gameStatus == "GAME_OVER") {
      updateUI(gameState.stage);
      generateBricks(gameState.stage);
      applyStageSettings(gameState.stage);
      ballX = canvas.width / 2;
      ballY = canvas.height-200;
      lives = 3;
      score = 0;
      isDead = false;
      gameStatus = "PLAYING";
    } else if (gameStatus == "READY") {
      applyStageSettings(gameState.stage);
      gameStatus = "PLAYING";
      isDead = false;
    } else if (isDead && lives > 0) {
      ballDX = stageSettings[gameState.stage.toUpperCase()].ballSpeed;
      ballDY = -ballDX;
      ballX = canvas.width / 2;
      ballY = canvas.height-200;
      isDead = false;
    }
};

document.addEventListener("keydown", function(event) {
  if(event.code == "Tab") {
    event.preventDefault();
    
    let firstStory = document.getElementById("firstStory");
    let selectPage = document.getElementById("select-page");
    
    if(firstStory.style.display == "flex") {
      console.log("스토리 넘김");
      firstStory.style.display = "none";
      selectPage.style.display = "flex";
    }
  }
});

document.getElementById("return").addEventListener("click", function() {
  document.getElementById("select-page").style.display = "flex";
  document.getElementById("game-setting").style.display = "none";
});

document.getElementById("reload").addEventListener("click", () => {
  location.reload();
});
