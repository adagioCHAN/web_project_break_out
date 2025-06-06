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

/* === 공통 게임 상태 관리 === */
const gameState = {
  stageOrder: ["easy", "medium", "hard"],
  stage:"easy",
  isRunning: false,
  gameStatus: "PLAYING", // READY, PLAYING, GAME_OVER, STAGE_CLEAR, ENDING
  lives: 1,
  isDead: false,
  ballReadyToMove: false,

  currentIndex: 0,

  puzzleBoard: Array(9).fill(null),
  intensity: 5,
  confessionUnlocked: false,
  confessionIndex: 13 // 고백 벽돌 관련 함수 구현 예정
}

const fixedColors = [ 
  "#FFB3BA", // 파스텔 레드 (로맨틱 핑크빛)
  "#B5EAD7", // 파스텔 민트 (포근한 초록)
  "#AEC6FF", // 파스텔 블루 (맑고 부드러운 하늘)
  "#FFFACD", // 파스텔 노랑 (연노랑, 희망)
  "#F3C6E0", // 파스텔 자홍 (사랑, 로맨스)
  "#CFF5F2", // 파스텔 청록 (상쾌한 감정)
  "#FFD8A8", // 파스텔 오렌지 (따뜻함, 설렘)
  "#D7B2FF", // 파스텔 보라 (감성, 신비로움)
  "#E4EABF"  // 파스텔 올리브 (자연, 안정)
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

//점수 상수
const BASICSCORE = 100;
const MAXEASY = 150;
const MAXMEDIUM = 300;
const MAXHARD = 500;
const FAILURESCORE = -50;

// 게임 상태
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
    rows: 3, cols: 3, width: canvas.width / 6, height: canvas.height / 18, padding: 0,
    offsetX: 0, offsetY: 0, ballSpeed: 5, ballRadius: 10, paddleWidth: 120
  },
  MEDIUM: {
    rows: 1, cols: 3, width: canvas.width / 6, height: canvas.height / 18, padding: 0,
    offsetX: 0, offsetY: 0, ballSpeed: 5, ballRadius: 10, paddleWidth: 120
  },
  HARD: {
    rows: 3, cols: 6, width: canvas.width / 6, height: canvas.height / 18, padding: 0,
    offsetX: 0, offsetY: 0, ballSpeed: 5, ballRadius: 10, paddleWidth: 120
  }
};

function Brick(x, y, type, index, textIdx) {//벽돌 정의: D파트 디자인 추가 예
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
  this.index = index; // easy 모드에서 사용할 벽돌 index
  this.textIdx = textIdx; // medium 모드에서 사용할 벽돌 text의 인덱스

  this.color = fixedColors[this.index];

  this.isConfession = false; // hard 모드에서 사용할 고백 벽돌
}

function updateScore(score) {
  document.getElementById("scoreValue").textContent = score;

  let imgIndex = 0;
  if (score >= 500) imgIndex = 2;
  else if (score >= 300) imgIndex = 1;
  else if (score >= 100) imgIndex = 0;

  document.getElementById("characterImg").src = charGroup[imgIndex];
}

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
    const confessionIndex = getRandomInt(0, totalBricks - 1); // 무작위로 고백 벽돌 위치 선정

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

// 키 이벤트
document.addEventListener("keydown", function(e) {
  const keySetting = settingContainerState.keySetting.current;
  console.log(keySetting);

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

  // 방향키 모드
  if (keySetting == 1) {
    if (e.key == "ArrowLeft") leftPressed = true;
    if (e.key == "ArrowRight") rightPressed = true;
  }

  // WASD 모드
  else if (keySetting == 2) {
    if (e.key == "a" || e.key == "A") leftPressed = true;
    if (e.key == "d" || e.key == "D") rightPressed = true;
  }
});

document.addEventListener("keyup", function(e) {
  const keySetting = settingContainerState.keySetting.current;

  if (keySetting == 1) {
    if (e.key == "ArrowLeft") leftPressed = false;
    if (e.key == "ArrowRight") rightPressed = false;
  }

  else if (keySetting === 2) {
    if (e.key == "a" || e.key == "A") leftPressed = false;
    if (e.key == "d" || e.key == "D") rightPressed = false;
  }
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
  ctx.fillStyle = "white";
  ctx.font = "16px 'Share Tech'";
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
      onBrickHit(b); // 벽돌 충돌 후 함수 호출

      if (gameState.stage === "easy") {
        if (puzzleState.board.every(Boolean)) {
          gameStatus = "STAGE_CLEAR";
          ballDX = 0;
          ballDY = 0;
          score += 100;
          showScorePopup(100);
        }
      } else if (gameState.stage === "medium") {
        if (gameState.currentIndex >= mediumStageDialogs.length) {
          gameStatus = "STAGE_CLEAR";
          ballDX = 0;
          ballDY = 0;
          score += mediumScore;
          showScorePopup(mediumScore);
        } else {
          setTimeout(() => {
            generateBricks(gameState.stage);
          }, 1500);
        }
      }
    }
  }
}

function showScorePopup(amount) {
  const popup = document.getElementById("score-popup");
  popup.textContent = `+${amount}`;
  popup.classList.remove("score-show"); // 재적용 위해 제거
  void popup.offsetWidth;               // reflow 강제
  popup.classList.add("score-show");
}

function showNegativeScorePopup(amount) {
  const popup2 = document.getElementById("score-popup-negative");
  popup2.textContent = `${amount}`;
  popup2.classList.remove("score-show"); // 재적용 위해 제거
  void popup2.offsetWidth;               // reflow 강제
  popup2.classList.add("score-show");
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
  if (
    ballY + ballRadius >= paddleY &&
    ballY <= paddleY + paddleHeight &&
    ballX + ballRadius >= paddleX &&
    ballX - ballRadius <= paddleX + paddleWidth
  ) {
    const prevBallY = ballY - ballDY;  // 공의 이전 위치
    const wasAbovePaddle = prevBallY + ballRadius <= paddleY;

    if (wasAbovePaddle) {
      ballDY = -ballDY;
    } else {
      // 옆이나 아래 -> 아래로 튕김
      ballDX = -ballDX;
    }

    // 충돌 후 공이 패들 안쪽으로 들어가지 않도록 위치 조정
    ballY = paddleY - ballRadius - 1;
  }

  collisionCheck();
}

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
  ctx.font = "24px 'Share Tech'";
  ctx.textAlign = "center";
  ctx.fillStyle = "#007";
  ctx.fillText("Stage Clear!", canvas.width / 2, canvas.height / 2);
  ctx.textAlign = "start";

  if (!draw.nextStageScheduled) {
    draw.nextStageScheduled = true;

    setTimeout(() => {
      const currentIdx = gameState.stageOrder.indexOf(gameState.stage);
      const nextStage = gameState.stageOrder[currentIdx + 1];

      let requiredScore = 0;
      if (gameState.stage === "easy") requiredScore = 150;
      else if (gameState.stage === "medium") requiredScore = 300;
      else if (gameState.stage === "hard") requiredScore = 500;

      if (currentIdx < gameState.stageOrder.length - 1) {
        if(score >= requiredScore){
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
    }, 1000); // 1초 후 홈 이동
  }
    console.log("hi");
 } 
 else if (gameStatus == "ENDING") {//엔딩 시 동작: D파트 엔딩 연출과 연결
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    if (!draw.endingTriggered) {
      draw.endingTriggered = true;

      // 게임 관련 UI 숨김
      document.getElementById("game-container").style.display = "none";
      document.getElementById("uiPanel").style.display = "none";
      document.getElementById("gameCanvas").style.display = "none";

      // 엔딩 페이지 표시
      const endingPage = document.getElementById("ending-page");
      const happy = document.getElementById("happy-ending");
      const sad = document.getElementById("sad-ending");

      endingPage.style.display = "flex";
      happy.style.display = "none";
      sad.style.display = "none";

      if (score >= 500) { // 호감도 500 이상일 때
        happy.style.display = "flex";
        const container = document.getElementById("happy-ending");
        const lines = container.querySelectorAll("p");

        lines.forEach((line, i) => {
          line.style.animationDelay = `${i * 1.5}s`; // 0.6초 간격
        });
      }else{
        sad.style.display = "flex";
        const container = document.getElementById("sad-ending");
        const lines = container.querySelectorAll("p");

        lines.forEach((line, i) => {
          line.style.animationDelay = `${i * 1.5}s`; // 0.6초 간격
        });
      }
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
  updateScore(score);
  switch (stage) {
    case 'easy': {
      for (let i=0;i<stageConfig.easy.puzzleCount;i++) {
        $(`#slot-${i}`)
        .attr({"src":"assets/img/gray.png"})
        .css({
          "border": "5px solid" + fixedColors[i],     // 원하는 색상/두께
          "box-sizing": "border-box"       // 이미지 크기 유지
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

//easy 스테이지
function revealPuzzleImage(index) {
  $(`#slot-${index}`).attr("src", `assets/img/puzzle-${index+1}.png`);
}

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

//메시지 출력
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

//hard 스테이지
//감정 그래프 및 이미지 속도 변화 함수
function updateGraphMovement(intensity) {
  // 속도: 빠를수록 애니메이션 duration 짧게
  let duration;
  if (intensity >= 0)       duration = 0.4;
  else if (intensity >= -5) duration = 0.6;
  else if (intensity >= -10) duration = 0.9;
  else if (intensity >= -15) duration = 1.4;
  else if (intensity >= -20) duration = 2.0;
  else if (intensity >= -25) duration = 3.0;
  else                      duration = 4.5;

  // 스케일 범위도 변경
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

    if (puzzleState.board.every(Boolean)) {
      $(conf.endMessageSelector)
        .removeClass("hidden")
        .text(conf.messageText);
    }
  } else {
    console.log("예외");
  }
}

function getScoreForText(text) {
  const scores = stageConfig.medium.wordScores;
  const entry = scores.find(item => item.text === text);
  return entry ? entry.score : 0;
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

function getConfessionNeighbors(index) {
  const cols = 5;
  const row = Math.floor(index / cols);
  const col = index % cols;

  const neighbors = [];

  const directions = [
    [-1, 0], [1, 0], [0, -1], [0, 1],     // 상하좌우
    [-1, -1], [-1, 1], [1, -1], [1, 1]    // 대각선
  ];

  for (let [dr, dc] of directions) {
    const r = row + dr;
    const c = col + dc;
    if (r >= 0 && r < 5 && c >= 0 && c < 5) {
      neighbors.push(r * cols + c);
    }
  }

  return neighbors;
}

// 보호 벽돌 제거 확인 함수
function handleHardBrick(brick) {
  const idx = parseInt(brick.index);
  
  if (brick.isConfession) {
    gameStatus = "STAGE_CLEAR";
  } else {
    // 일반 벽돌 처리
    gameState.intensity--;
    updateCanvasShake(gameState.intensity);
    updateGraphMovement(gameState.intensity);
  }
}

/* === D: 디자인 및 설정 기능 === */
  //튜토리얼 창 함수
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

  // 페이지 로드 시 초기화
  document.addEventListener("DOMContentLoaded", () => {
    showSlide(tutorialIndex);
  });

//게임 설정 화면
document.getElementById("settingButton").addEventListener("click", function() {
  console.log("게임 설정 화면");

  document.getElementById("select-page").style.display = "none";
  document.getElementById("game-setting").style.display = "block";
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

// 전체화면 종료 감지
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

// 다시 전체화면 버튼
function reenterFullscreen() {
  requestFullScreen();
  document.getElementById("fullscreen-exit-overlay").style.display = "none";
}

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

function goHome(){
  document.getElementById("select-page").style.display = "flex";
  document.getElementById("game-container").style.display = "none";
  document.getElementById("gameCanvas").style.display = "none";
  document.getElementById("uiPanel").style.display = "none";
  document.getElementById("game-setting").style.display = "none";

  gameStatus = "READY"; // 추가: draw 중단
  draw.nextStageScheduled = false;
  ballReadyToMove = false;

  /*설정 초기화*/
  lives = 1;
  isDead = false;
}

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

document.body.addEventListener("click", (e) => {
  if (e.target.classList.contains("reload")) {
    location.reload();
  }
});