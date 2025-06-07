/* 기본 캔버스 설정 */
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

  stageSettings.EASY.width = canvas.width / stageSettings.EASY.cols;
  stageSettings.EASY.height = canvas.height / (stageSettings.EASY.rows + 6);

  stageSettings.MEDIUM.width = canvas.width / stageSettings.MEDIUM.cols;
  stageSettings.MEDIUM.height = canvas.height / (stageSettings.MEDIUM.rows + 6);

  stageSettings.HARD.width = canvas.width / stageSettings.HARD.cols;
  stageSettings.HARD.height = canvas.height / (stageSettings.HARD.rows + 6);

  uiPanel.style.width = `${containerWidth - canvasSize}px`;
  uiPanel.style.height = `${canvasSize}px`;
}
window.addEventListener("resize", resizeCanvas);

/* 시작 설정_window load */
window.addEventListener("load", () => {
  resizeCanvas();
  
  const bgm = document.getElementById("bgm");
  var temp = 0;
  if (temp == 0) {
    document.body.addEventListener("click", () => {
      bgm.muted = false;
      bgm.play()
      .then(() => {
        console.log("bgm 재생")
      })
      .catch(error => {
        console.log("bgm 재생 안됨: ", error)
      });
    }, {once: true});
  temp++;
  }
});

// 변수 및 상수
const gameState = {
  stageOrder: ["easy", "medium", "hard"],
  stage:"easy",
  isRunning: false,
  gameStatus: "PLAYING",
  lives: 1,
  isDead: false,
  ballReadyToMove: false,

  currentIndex: 0,

  puzzleBoard: Array(9).fill(null),
  intensity: 5,
  confessionUnlocked: false,
  confessionIndex: 13
}

const fixedColors = [ 
  "#FFB3BA",
  "#B5EAD7",
  "#AEC6FF",
  "#FFFACD",
  "#F3C6E0",
  "#CFF5F2",
  "#FFD8A8",
  "#D7B2FF",
  "#E4EABF"
];

const bgColors = [
  "linear-gradient(to bottom, #FFE4F0, white)",
  "linear-gradient(to bottom, #FFF0E6, #FFFCEE)",
  "linear-gradient(to bottom, #E0F7FA, #FFF)",
  "linear-gradient(to bottom, #FDE2FF, #FFF5E6)"
];

const bgThemaColors = [
  "#FFE4F0",
  "#FFF0E6",
  "#E0F7FA",
  "#FDE2FF"
];

const charGroup = [
  "assets/img/char_1.png",
  "assets/img/char_2.png",
  "assets/img/char_3.png"
]

const BASICSCORE = 100;
const MAXEASY = 150;
const MAXMEDIUM = 300;
const MAXHARD = 500;
const FAILURESCORE = -50;

let isDead = false;
let ballReadyToMove = false;
let score = BASICSCORE;
let lives = 1;
let gameStatus = "READY"; 
let mediumScore = 0;

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

let ballRadius = 10;
let ballX = canvas.width / 2;
let ballY = canvas.height-200;
let ballDX = 2;
let ballDY = -6;

let paddleWidth = 120;
let paddleHeight = 20;
let paddleX = canvas.width/ 2;
let paddleY = canvas.height - paddleHeight + 30;;
let paddleSpeed = 7;
let paddleDX = 0;

let leftPressed = false;
let rightPressed = false;

let bricks = [];

const stageSettings = {
  EASY: {
    rows: 3, cols: 3, width: canvas.width / 6, height: canvas.height / 18, padding: 0,
    offsetX: 0, offsetY: 0, ballSpeed: 5, ballRadius: 10, paddleWidth: 120
  },
  MEDIUM: {
    rows: 1, cols: 3, width: canvas.width / 6, height: canvas.height / 18, padding: 0,
    offsetX: 0, offsetY: 0, ballSpeed: 6, ballRadius: 10, paddleWidth: 120
  },
  HARD: {
    rows: 2, cols: 6, width: canvas.width / 6, height: canvas.height / 27, padding: 0,
    offsetX: 0, offsetY: 0, ballSpeed: 7, ballRadius: 10, paddleWidth: 120
  }
};

const mediumStageDialogs = [
  {
    question: "왜 갑자기 연락했어?",
    options: [
      { text: "그냥... 네 목소리가 듣고 싶었어", score: 50 },
      { text: "할 말이 좀 있어서", score: 30 },
      { text: "별건 아니야", score: 0 }
    ]
  },
  {
    question: "시간 있으면 나갈 거야?",
    options: [
      { text: "응! 당연하지, 너만 괜찮다면", score: 50 },
      { text: "음... 너도 나갈 거라면", score: 30 },
      { text: "아니, 그냥 물어봤어", score: 0 }
    ]
  },
  {
    question: "어제는 왜 그렇게 말했어?",
    options: [
      { text: "그땐 너한테 진심이었어", score: 50 },
      { text: "그냥 기분이 이상했어", score: 30 },
      { text: "그랬나?", score: 0 }
    ]
  },
  {
    question: "사람들이 너랑 나랑 친하대",
    options: [
      { text: "난 그 말 듣고 기분 좋았어", score: 50 },
      { text: "그런가...? 난 잘 모르겠던데", score: 30 },
      { text: "헐, 왜 그런 소문이...", score: 0 }
    ]
  },
  {
  question: "내가 갑자기 연락 안 해도 신경 써?",
  options: [
    { text: "매일 기다렸는데...", score: 50 },
    { text: "조금은 신경 쓰였어", score: 30 },
    { text: "아니? 괜찮았어", score: 0 }
  ]
}
]

const puzzleState = {
  board: Array(stageConfig.easy.puzzleCount).fill(null)
};

/* util_점수 팝업*/
function showScorePopup(amount) {
  const popup = document.getElementById("score-popup");
  popup.textContent = `+${amount}`;
  popup.classList.remove("score-show");
  void popup.offsetWidth;
  popup.classList.add("score-show");
}

function showNegativeScorePopup(amount) {
  const popup2 = document.getElementById("score-popup-negative");
  popup2.textContent = `${amount}`;
  popup2.classList.remove("score-show");
  void popup2.offsetWidth;
  popup2.classList.add("score-show");
}

/* screen_프로필 */
function updateProfile(score) {
  document.getElementById("profileScoreFancy").textContent = score;

  let index = score >= 500 ? 2 : score >= 300 ? 1 : 0;
  const names = ["하얀이", "말랑이", "사랑이"];
  const descs = [
    "짝사랑 상대가 자꾸 떠오르는 단계",
    "밤마다 카톡으로 연락하는 단계",
    "오늘은 꼭 고백해보고 싶은 설렘"
  ];
  document.getElementById("profileImgFancy").src = charGroup[index];
  document.querySelector(".profile-name-fancy").textContent = names[index];
  document.querySelector(".profile-desc-fancy").textContent = descs[index];
}

/* util_점수에 따른 업데이트 */
function updateScore(score) {
  document.getElementById("scoreValue").textContent = score;

  let imgIndex = 0;
  if (score >= 500) imgIndex = 2;
  else if (score >= 300) imgIndex = 1;
  else if (score >= 100) imgIndex = 0;

  document.getElementById("characterImg").src = charGroup[imgIndex];
}

/* 벽돌 생성 및 배치 */
function Brick(x, y, type, index, textIdx) {
  this.x = x;
  this.y = y;
  switch(gameState.stage){
  case "easy": {
    this.width = stageSettings.EASY.width;
    this.height = stageSettings.EASY.height;
    this.draw = function(ctx) {
      if (!this.alive) return;
      ctx.fillStyle = this.color || "black";
      ctx.fillRect(this.x, this.y, this.width, this.height);

      ctx.strokeStyle = "white";
      ctx.lineWidth = 2;
      ctx.strokeRect(
        this.x + 1, 
        this.y + 1, 
        this.width - 2, 
        this.height - 2
      );
    };
    break;
  }
  case "medium":{
    this.width = stageSettings.MEDIUM.width;
    this.height = stageSettings.MEDIUM.height;
    this.draw = function(ctx) {
      if (!this.alive) return;
      switch(textIdx){
      case 0: ctx.fillStyle = "#cce0ff"; break;
      case 1: ctx.fillStyle = "#fff9c4"; break;
      case 2: ctx.fillStyle = "#ffe0e0"; break; 
      }
      ctx.fillRect(this.x, this.y, this.width, this.height);

      ctx.strokeStyle = "white";
      ctx.lineWidth = 2;
      ctx.strokeRect(
        this.x + 1, 
        this.y + 1, 
        this.width - 2, 
        this.height - 2
      );
    };
    break;
  }
  case "hard":{
    this.width = stageSettings.HARD.width;
    this.height = stageSettings.HARD.height;
    this.draw = function(ctx) {
      if (!this.alive) return;
      ctx.fillStyle = this.isConfession ? "#FF9999" : "#d9d7d7";
      ctx.fillRect(this.x, this.y, this.width, this.height);

      ctx.strokeStyle = "white";
      ctx.lineWidth = 2;
      ctx.strokeRect(
        this.x + 1, 
        this.y + 1, 
        this.width - 2, 
        this.height - 2
      );
    };
    break;
  }
  }

  this.alive = true;
  this.type = type;
  this.index = index;
  this.textIdx = textIdx;
  this.color = fixedColors[this.index];
  this.isConfession = false;
}

function getRandomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function generateBricks(stage) {
  bricks = [];
  const s = stageSettings[stage.toUpperCase()];
  if (!s) return;

  const totalWidth = s.cols * s.width + (s.cols - 1) * s.padding;
  const offsetX = (canvas.width - totalWidth) / 2;
  const textIdx = [0, 1, 2];
  for (let i = textIdx.length - 1; i > 0; i--) {
    const j = getRandomInt(0, i);
    [textIdx[i], textIdx[j]] = [textIdx[j], textIdx[i]];
  }

  if (stage.toUpperCase() === "HARD") {
    const totalBricks = s.rows * s.cols;
    const confessionIndex = getRandomInt(0, totalBricks - 1);

    for (let r = 0; r < s.rows; r++) {
      for (let c = 0; c < s.cols; c++) {
        const x = c * (s.width + s.padding);
        const y = s.offsetY + r * (s.height + s.padding);
        const index = r * s.cols + c;

        const brick = new Brick(x, y, stage.toUpperCase(), index, null);
        brick.width = s.width;
        brick.height = s.height;

        if (index === confessionIndex) {
          brick.isConfession = true;
        }

        bricks.push(brick);
      }
    }
  }
  else {
    const totalBricks = s.rows * s.cols;
    const puzzleCount = stageConfig.easy.puzzleCount;

    const requiredColors = Array.from({ length: puzzleCount }, (_, i) => i);
    for (let i = requiredColors.length - 1; i > 0; i--) {
      const j = getRandomInt(0, i);
      [requiredColors[i], requiredColors[j]] = [requiredColors[j], requiredColors[i]];
    }

    const remainingCount = totalBricks - requiredColors.length;
    const additionalColors = Array.from({ length: remainingCount }, () => getRandomInt(0, puzzleCount - 1));

    const allColors = [...requiredColors, ...additionalColors];
    for (let i = allColors.length - 1; i > 0; i--) {
      const j = getRandomInt(0, i);
      [allColors[i], allColors[j]] = [allColors[j], allColors[i]];
    }

    const totalWidth = s.cols * s.width + (s.cols - 1) * s.padding;
    const offsetX = 0;

    let colorIndex = 0;
    for (let r = 0; r < s.rows; r++) {
      for (let c = 0; c < s.cols; c++) {
        const x = offsetX + c * (s.width + s.padding);
        const y = s.offsetY + r * (s.height + s.padding);
        const color = allColors[colorIndex++];
        const brick = new Brick(x, y, gameState.stage.toUpperCase(), color, textIdx[c]);
        brick.width = s.width;
        brick.height = s.height;
        bricks.push(brick);
      }
    }
  }
}

/* 캔버스 게임 생성 */
function applyStageSettings(stage) {
  const s = stageSettings[gameState.stage.toUpperCase()];
  if (!s) return;
  ballRadius = s.ballRadius;
  ballX = canvas.width / 2;
  ballY = canvas.height - 200;
  ballDX = s.ballSpeed;
  ballDY = -s.ballSpeed;
  paddleWidth = s.paddleWidth;
  paddleX = (canvas.width - paddleWidth) / 2;

  paddleY = canvas.height * 0.9;
}

function drawBall() {
  ctx.beginPath();
  ctx.arc(ballX, ballY, ballRadius, 0, Math.PI * 2);
  ctx.fillStyle = "#C797BF";
  ctx.fill();
  ctx.closePath();
}

function drawPaddle() {
  ctx.beginPath();
  ctx.rect(paddleX, paddleY, paddleWidth, paddleHeight);
  ctx.fillStyle = "#dcdcdc";
  ctx.fill();
  ctx.closePath();
}

function drawBricks() {
  for (let i = 0; i < bricks.length; i++) {
    bricks[i].draw(ctx);
  }
}

function drawUI() {
  ctx.fillStyle = "white";
  ctx.font = "16px 'Share Tech'";
}

/* 캔버스 충돌 판정 및 업데이트 */
function collisionCheck() {
  for (let i = 0; i < bricks.length; i++) {
    const b = bricks[i];

    if (b.alive &&
      ballX + ballRadius > b.x &&
      ballX - ballRadius < b.x + b.width &&
      ballY + ballRadius > b.y &&
      ballY - ballRadius < b.y + b.height) {
      ballDY = -ballDY;
      b.alive = false;
      onBrickHit(b);

      if (gameState.stage === "easy") {
        if (puzzleState.board.every(Boolean)) {
          gameStatus = "STAGE_CLEAR";
          ballDX = 0;
          ballDY = 0;
        }
      } else if (gameState.stage === "medium") {
        if (gameState.currentIndex >= mediumStageDialogs.length) {
          gameStatus = "STAGE_CLEAR";
          ballDX = 0;
          ballDY = 0;
        } else {
          setTimeout(() => {
            generateBricks(gameState.stage);
          }, 1500);
        }
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

  if (ballX < ballRadius || ballX > canvas.width - ballRadius)
    ballDX = -ballDX;
  if (ballY < ballRadius)
    ballDY = -ballDY;

  if (!isDead && ballY + ballRadius >= canvas.height && gameStatus != "STAGE_CLEAR") {
    isDead = true;
    if (--lives == 0) gameStatus = "GAME_OVER";
    ballDX = 0;
    ballDY = 0;
  }

  if (
    ballY + ballRadius >= paddleY &&
    ballY <= paddleY + paddleHeight &&
    ballX + ballRadius >= paddleX &&
    ballX - ballRadius <= paddleX + paddleWidth
  ) {
    const prevBallY = ballY - ballDY;
    const wasAbovePaddle = prevBallY + ballRadius <= paddleY;

    if (wasAbovePaddle) {
      ballDY = -ballDY;
    } else {
      ballDX = -ballDX;
    }

    ballY = paddleY - ballRadius - 1;
  }

  collisionCheck();
}

/* 캔버스 draw */
function draw() {
  if (gameStatus === "READY") return; 
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
  if (!draw.nextStageScheduled) {
    draw.nextStageScheduled = true;

    setTimeout(() => {
      const currentIdx = gameState.stageOrder.indexOf(gameState.stage);
      const nextStage = gameState.stageOrder[currentIdx + 1];

      let requiredScore = 0;
      if (gameState.stage === "easy") requiredScore = 100;
      else if (gameState.stage === "medium") requiredScore = 200;
      else if (gameState.stage === "hard") requiredScore = 400;

      if (currentIdx < gameState.stageOrder.length - 1) {
        if(score >= requiredScore){
          if(gameState.stage == "easy"){
            score += 100;
            showScorePopup(100);
          }else if(gameState.stage == "medium"){
            score += mediumScore;
            showScorePopup(mediumScore);
          }
          gameState.stage = nextStage;
          generateBricks(gameState.stage);
          applyStageSettings(gameState.stage);
          updateStageView(gameState.stage);

          ballX = canvas.width / 2;
          ballY = canvas.height - 200;
          isDead = false;
          lives = 1;
          gameStatus = "PLAYING";
          ballReadyToMove = false;
          setTimeout(() => { ballReadyToMove = true; }, 1000);
        }else{
          score += FAILURESCORE;
          showNegativeScorePopup(FAILURESCORE);
          goHome();
        }
      } else {
        const happy = document.getElementById("happy-ending");
        const sad = document.getElementById("sad-ending");

        if (score >= 500) {
          happy.style.display = "flex";
          const lines = happy.querySelectorAll("p");
          lines.forEach((line, i) => {
            line.style.animationDelay = `${i * 1.5}s`;
            if (line.classList.contains("ending-final-line")) {
              line.classList.add("ending-highlight");
            }
          });
        } else {
          sad.style.display = "flex";
          const lines = sad.querySelectorAll("p");
          lines.forEach((line, i) => {
            line.style.animationDelay = `${i * 1.5}s`;
            if (line.classList.contains("ending-final-line")) {
              line.classList.add("ending-sad");
            }
          });
        }
        gameStatus = "ENDING";
      }

      draw.nextStageScheduled = false;
    }, 2000);
  }
}
 else if (gameStatus == "GAME_OVER") {
    if (!draw.goHomeTriggered) {
    draw.goHomeTriggered = true;
    score += FAILURESCORE;
    showNegativeScorePopup(FAILURESCORE);
    setTimeout(() => {
      goHome();
      draw.goHomeTriggered = false;
    }, 1000);
  }
    console.log("hi");
 } 
 else if (gameStatus == "ENDING") {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    if (!draw.endingTriggered) {
      draw.endingTriggered = true;

      document.getElementById("game-container").style.display = "none";
      document.getElementById("uiPanel").style.display = "none";
      document.getElementById("gameCanvas").style.display = "none";

      const endingPage = document.getElementById("ending-page");
      const happy = document.getElementById("happy-ending");
      const sad = document.getElementById("sad-ending");

      endingPage.style.display = "flex";
      happy.style.display = "none";
      sad.style.display = "none";

      if (score >= 500) {
        happy.style.display = "flex";
        const container = document.getElementById("happy-ending");
        const lines = container.querySelectorAll("p");

        lines.forEach((line, i) => {
          line.style.animationDelay = `${i * 1.5}s`;
        });
      }else{
        sad.style.display = "flex";
        const container = document.getElementById("sad-ending");
        const lines = container.querySelectorAll("p");

        lines.forEach((line, i) => {
          line.style.animationDelay = `${i * 1.5}s`;
        });
      }
    }
  }
  ctx.restore();
}

/* 오른쪽 ui 조작 */
function updateStageView(stage) {
  $('#puzzle-board, #talk-box, #emotion-graph').hide();
  updateUI(stage);

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

function updateUI(stage) {
  updateScore(score);
  switch (stage) {
    case 'easy': {
      for (let i=0;i<stageConfig.easy.puzzleCount;i++) {
        $(`#slot-${i}`)
        .attr({"src":"assets/img/gray.png"})
        .css({
          "border": "5px solid" + fixedColors[i],
          "box-sizing": "border-box"
        });
        puzzleState.board[i] = null;
      }
      canvas.classList.remove("shaky");
      break;
    }
    case 'medium': {
      var container = document.getElementById("chatting");
      var child = container.querySelectorAll(".message");
      for (let i=0; i<child.length; i++) {
        container.removeChild(child[i]);
        canvas.classList.remove("shaky");
      }
      gameState.currentIndex = 0;
      sendQuestion();
      break;
    }
    case 'hard': {
      gameState.intensity = 5;
      updateGraphMovement(gameState.intensity);
      break;
    }
  }
}

/* game_난이도 별 블럭 충돌 처리 */
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

// easy
function revealPuzzleImage(index) {
  $(`#slot-${index}`).attr("src", `assets/img/puzzle-${index+1}.png`);
}

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

    if (puzzleState.board.every(Boolean)) {
      $(conf.endMessageSelector)
        .removeClass("hidden")
        .text(conf.messageText);
    }
  } else {
    console.log("예외");
  }
}

//medium
function sendMessage(message) {
  for (let i=0; i < gameState.currentIndex; i++) {
    $(".message").eq(i).animate({bottom: "+=50px"}, 300)
    console.log(i);
  }
  $(".reply").eq(gameState.currentIndex).animate({bottom: "+=50px"}, 300);

  var chatting = document.getElementById("chatting");
  var container = $(".message").eq(gameState.currentIndex);
  if (message == "") return;

  var sentContainer = document.createElement("div");
  sentContainer.setAttribute("class", "sent");

  var sentDiv = document.createElement("div");
  sentDiv.setAttribute("class", "sent-content");
  sentDiv.innerHTML = message;
  sentContainer.appendChild(sentDiv);

  var sentImg = document.createElement("img");
  sentImg.setAttribute("class", "player-chat-img");
  sentImg.setAttribute("src", "assets/img/kakaotalk-talk.png");
  sentContainer.appendChild(sentImg);

  container.append(sentContainer);
}

function sendQuestion() {
  setTimeout(() => {
    $(".message").animate({bottom: "+=50px"}, 300);
    var chatting = document.getElementById("chatting");
    var container = document.createElement("div");
    container.classList.add("message");

    var replyContainer = document.createElement("div");
    replyContainer.classList.add("reply", "new");

    var replyDiv = document.createElement("div");
    replyDiv.setAttribute("class", "reply-line");
    replyDiv.textContent = mediumStageDialogs[gameState.currentIndex].question;
    replyContainer.appendChild(replyDiv);
  
    var replyImg = document.createElement("img");
    replyImg.setAttribute("class", "reply-chat-img");
    replyImg.setAttribute("src", "assets/img/kakaotalk-reply.png");
    replyContainer.appendChild(replyImg);

    container.appendChild(replyContainer);
    chatting.appendChild(container);
  }, 1000)
}

function handleMediumBrick(brick) {
  const conf = stageConfig.medium;

  var text = mediumStageDialogs[gameState.currentIndex].options[brick.textIdx].text;
  if (!text) return;
  
  const currentScore = mediumStageDialogs[gameState.currentIndex].options[brick.textIdx].score;

  var message = `${text}(+${currentScore})`; 

  mediumScore += currentScore;

  sendMessage(message);

  gameState.currentIndex++;
  if (gameState.currentIndex < mediumStageDialogs.length) {
    sendQuestion();
  }
}

//hard
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

function updateGraphMovement(intensity) {
  let duration;

  if (intensity >= 0)       duration = 0.4;
  else if (intensity >= -5) duration = 0.6;
  else if (intensity >= -10) duration = 0.9;
  else if (intensity >= -15) duration = 1.4;
  else if (intensity >= -20) duration = 2.0;
  else if (intensity >= -25) duration = 3.0;
  else                      duration = 4.5;

  let scaleMin = 0.4;
  let scaleMax = 1.8;

  if (intensity >= 0) {
    scaleMin = 1.0;
    scaleMax = 2.0;
  } else if (intensity >= -10) {
    scaleMin = 0.8;
    scaleMax = 1.5;
  } else if (intensity >= -20) {
    scaleMin = 0.6;
    scaleMax = 1.2;
  } else {
    scaleMin = 0.4;
    scaleMax = 1.0;
  }

  const heart = document.getElementById("heart");
  heart.style.animationDuration = `${duration}s`;
  heart.style.setProperty('--scale-min', scaleMin);
  heart.style.setProperty('--scale-max', scaleMax);

  console.log(`[Pulse] intensity: ${intensity}, duration: ${duration}s, scale: ${scaleMin}~${scaleMax}`);
}

function handleHardBrick(brick) {
  const idx = parseInt(brick.index);
  
  if (brick.isConfession) {
    score += 200;
    showScorePopup(200);
    gameStatus = "STAGE_CLEAR";
  } else {
    gameState.intensity--;
    updateCanvasShake(gameState.intensity);
    updateGraphMovement(gameState.intensity);
  }
}

/* 관리자 모드*/
const adminKeys = new Set();

document.getElementById("admin-score-submit").addEventListener("click", () => {
  const inputVal = parseInt(document.getElementById("admin-score-input").value);
  if (!isNaN(inputVal)) {
    score = inputVal;
    console.log(`관리자 점수로 ${inputVal}점이 설정되었습니다.`);
    document.getElementById("admin-score-modal").classList.add("hidden");
  } else {
    console.log("유효한 숫자를 입력해주세요.");
  }
});

/* 키 이벤트 */
document.addEventListener("keydown", function(e) {
  const keySetting = settingContainerState.keySetting.current;
  console.log(keySetting);

  adminKeys.add(e.key.toLowerCase());

  //ctrl+shift+s 누르면 관리자 모드 진입
  if (e.ctrlKey && e.shiftKey && e.key.toLowerCase() === "s") {
    e.preventDefault();
    document.getElementById("admin-score-modal").classList.remove("hidden");
  }

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

  if (keySetting == 1) {
    if (e.key == "ArrowLeft") leftPressed = true;
    if (e.key == "ArrowRight") rightPressed = true;
  }

  else if (keySetting == 2) {
    if (e.key == "a" || e.key == "A") leftPressed = true;
    if (e.key == "d" || e.key == "D") rightPressed = true;
  }
});

document.addEventListener("keyup", function(e) {
  const keySetting = settingContainerState.keySetting.current;

  adminKeys.delete(e.key.toLowerCase());

  if (keySetting == 1) {
    if (e.key == "ArrowLeft") leftPressed = false;
    if (e.key == "ArrowRight") rightPressed = false;
  }

  else if (keySetting === 2) {
    if (e.key == "a" || e.key == "A") leftPressed = false;
    if (e.key == "d" || e.key == "D") rightPressed = false;
  }
});

/* util_홈으로 이동 */
function goHome(){
  document.getElementById("select-page").style.display = "flex";
  document.getElementById("game-container").style.display = "none";
  document.getElementById("gameCanvas").style.display = "none";
  document.getElementById("uiPanel").style.display = "none";
  document.getElementById("game-setting").style.display = "none";

  gameStatus = "READY";
  draw.nextStageScheduled = false;
  ballReadyToMove = false;

  lives = 1;
  isDead = false;
}

/* util_전체화면 전환 */
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

document.addEventListener("fullscreenchange", () => {
  if (!document.fullscreenElement) {
    const modal = document.getElementById("fullscreen-modal");
    const okBtn = document.getElementById("modal-ok");

    modal.classList.remove("hidden");

    okBtn.onclick = () => {
      modal.classList.add("hidden");
      requestFullScreen();
    };

    return;
  }
});

function reenterFullscreen() {
  requestFullScreen();
  document.getElementById("fullscreen-exit-overlay").style.display = "none";
}

/* screen_게임 설정 */
document.getElementById("settingButton").addEventListener("click", function() {
  console.log("게임 설정 화면");

  document.getElementById("select-page").style.display = "none";
  document.getElementById("game-setting").style.display = "block";
});

const settingContainerState = {
  bgThema: { current: 1, max: 4, prefix: 'bgthema' },
  bgmImage: {current: 1, max: 4, prefix: 'bgmImg'},
  musicSetting: {current: 1, max: 2, prefix: 'musicSetting'},
  keySetting: {current: 1, max: 2, prefix: 'keySetting'},
}

function onArrowClick(event) {
  const clicked = event.target;
  if ((!clicked.classList.contains) && (!clicked.classList.contains)) return;

  const containerDiv = clicked.closest('.settingContainer');
  if (!containerDiv) return;

  const cid = containerDiv.id;
  if (!settingContainerState[cid]) return;

  const state = settingContainerState[cid];
  const isLeft = clicked.classList.contains("leftArrow");
  const isRight = clicked.classList.contains("rightArrow");

  if (isRight) {
    state.current++;
    if (state.current > state.max) state.current = 1;
  }
  else if (isLeft) {
    state.current--;
    if (state.current < 1) state.current = state.max;
  }

  if (cid === "bgThema") {
    const newColor = bgColors[state.current - 1];
    const newThemaColor = bgThemaColors[state.current - 1];

    document.body.style.background = newColor;
    document.documentElement.style.background = newColor;

    const circle = containerDiv.querySelector("#bgImgCircle");
    if (circle) {
      circle.style.backgroundColor = newThemaColor;
    }
  } else {
    const changeImg = containerDiv.querySelector(".mainImage");
    if (changeImg) {
      changeImg.src = `assets/img/${state.prefix}${state.current}.png`;
    }
  }

  if (cid == "bgmImage" || cid == "musicSetting") {
    musicControl(cid, state.current);
  }
}

document.querySelectorAll(".settingContainer").forEach(div => {
  div.addEventListener("click", onArrowClick);
});

function musicControl(cid, cur) {
  const music = document.getElementById("bgm");
  if (cid == "bgmImage") {
    console.log(cur);
    switch(cur) {
      case 1: music.src = "assets/audio/bgm1.mp3"; break;
      case 2: music.src = "assets/audio/bgm2.mp3"; break;
      case 3: music.src = "assets/audio/bgm3.mp3"; break;
      case 4: music.src = "assets/audio/bgm4.mp3"; break;
      default: music.src = "assets/audio/bgm1.mp3"; break;
    }
  }
  else if (cid == "musicSetting") {
    switch(cur) {
      case 1: music.muted = false; break;
      case 2: music.muted = true; break;
    }
    console.log("setting changed");
  }
}

/* screen_난이도 선택 */
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

  updateStageView(gameState.stage);

  if (gameStatus == "GAME_OVER") {
      updateUI(gameState.stage);
      generateBricks(gameState.stage);
      applyStageSettings(gameState.stage);
      ballX = canvas.width / 2;
      ballY = canvas.height-200;
      lives = 1;
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

/* screen_게임 시작 */
let timer = null

function loop(){
  draw();
  updateScore(score);
  updateProfile(score);
  requestAnimationFrame(loop);
}

document.getElementById("start-btn").addEventListener("click", () => {
  if (!isFullScreen()) {
    const modal = document.getElementById("fullscreen-modal");
    const okBtn = document.getElementById("modal-ok");

    modal.classList.remove("hidden");

    okBtn.onclick = () => {
      modal.classList.add("hidden");
      requestFullScreen();
    };

    return;
  }
  loop();

  document.getElementById("initView").style.display = "none";
  document.getElementById("firstStory").style.display = "flex";
});

/* screen_튜토리얼 */
let tutorialIndex = 0;
const slides = document.querySelectorAll(".tutorial-slide");

function showSlide(index) {
  slides.forEach((slide, i) => {
    slide.classList.toggle("active", i === index);
  });
}

function nextTutorial() {
  tutorialIndex = (tutorialIndex + 1) % slides.length;
  showSlide(tutorialIndex);
}

function prevTutorial() {
  tutorialIndex = (tutorialIndex - 1 + slides.length) % slides.length;
  showSlide(tutorialIndex);
}

document.addEventListener("DOMContentLoaded", () => {
  showSlide(tutorialIndex);
});

/* util_게임 종료 */
document.body.addEventListener("click", (e) => {
  if (e.target.classList.contains("reload")) {
    location.reload();
  }
});
