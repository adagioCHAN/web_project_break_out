/**
 * 파일명: script.js
 * 작성자: 사예원
 * 작성일: 2025-05-18
 * 설명: setInterval을 사용하는 벽돌깨기/ 게임 루프/
 */
const settings = {
  ball: ["기본", "파란공", "빨간공"],
  music: ["기본", "음악1", "음악2"],
  paddle: ["기본", "파란색", "빨간색"]
};

const currentIndex = {
  ball: 0,
  music: 0,
  paddle: 0
};

var ballColor = "#ff4d4d";   // 기본
var paddleColor = "#333";   // 기본

//음악 재생 함수
var currentMusic = null;

function stopBackgroundMusic() {
  if (currentMusic) {
    currentMusic.pause();
    currentMusic.currentTime = 0;
    currentMusic = null;
  }
}

function playBackgroundMusic(src) {
  stopBackgroundMusic();

  if (currentMusic) {
    currentMusic.pause();
    currentMusic.currentTime = 0;
  }

  currentMusic = new Audio(src);
  currentMusic.loop = true;
  currentMusic.volume = 0.5;
  currentMusic.play();
}


$(document).ready(function () {
  // 캔버스는 처음에 숨김
  $("#gameCanvas").hide();

  // 시작 버튼 누른 후 스토리, 메뉴 보이기
  $("#start-btn").on("click", function () {
    $("#start-screen").fadeOut(500, function () {
        playGameIntro(function () {
          setTimeout(() => {
            $("#screen").fadeIn(800);
          }, 2000);
        });
    });
  });

  // 배경 효과
  const bgCanvas = document.getElementById("bgCanvas");
  const bgCtx = bgCanvas.getContext("2d");

  function resizeCanvas() {
    bgCanvas.width = window.innerWidth;
    bgCanvas.height = window.innerHeight;
  }
  resizeCanvas();
  window.addEventListener("resize", resizeCanvas);

  const particles = [];
  for (let i = 0; i < 100; i++) {
    particles.push({
      x: Math.random() * bgCanvas.width,
      y: Math.random() * bgCanvas.height,
      radius: Math.random() * 3 + 1,
      dx: (Math.random() - 0.5) * 0.3,
      dy: (Math.random() - 0.5) * 0.3,
      alpha: Math.random()
    });
  }

  function animateParticles() {
    bgCtx.clearRect(0, 0, bgCanvas.width, bgCanvas.height);

    for (var p of particles) {
      p.x += p.dx;
      p.y += p.dy;

      if (p.x < 0 || p.x > bgCanvas.width) p.dx *= -1;
      if (p.y < 0 || p.y > bgCanvas.height) p.dy *= -1;

      p.alpha += (Math.random() - 0.5) * 0.02;
      p.alpha = Math.max(0.2, Math.min(1, p.alpha));

      bgCtx.beginPath();
      bgCtx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
      bgCtx.fillStyle = `rgba(255,255,255,${p.alpha})`;
      bgCtx.fill();
    }

    requestAnimationFrame(animateParticles);
  }
  animateParticles();

  // 난이도 선택
  $(".stage-btn").on("click", function () {
    // 선택한 난이도(stage) 추출
    stage = $(this).data("stage");

    // 스테이지 인트로
    let introText = "";
    if (stage == "EASY") introText = "EASY – 처음 마주친 날";
    else if (stage == "NORMAL") introText = "NORMAL – 말을 걸어볼까?";
    else if (stage == "HARD") introText = "HARD – 고백의 순간";

    // 선택 화면 숨기고 인트로 텍스트 표시

    $("#title").fadeOut(300);
    $("#main-section").fadeOut(300);
    $("#stage-intro")
      .text(introText)
      .css({ display: "none" })
      .fadeIn(500);

    // 2초 후 인트로 숨기고 게임 시작
    setTimeout(function () {
      $("#stage-intro").fadeOut(300, function () {
        $("#gameCanvas").fadeIn(300);

        // 게임 상태 초기화
        generateBricks(stage);
        applyStageSettings(stage);
        updateDisplay("ball");
        updateDisplay("paddle");
        updateDisplay("music");
        ballX = canvas.width / 2;
        ballY = canvas.height - 200;
        isDead = false;
        lives = 3;
        score = 0;
        gameStatus = "PLAYING";
      });
    }, 2000);


  });

  //환경 설정 클릭 시
  $("#setting").on("click", function () {
    $("#selection").fadeOut(300);
    $("#title").fadeOut(300);
    $("#stage-intro").hide();
    $("#main-section").hide();
    $("#setting-page").fadeIn(300);
  });

  $(".arrow").on("click", function () {
    const type = $(this).data("type");
    const direction = $(this).hasClass("left") ? -1 : 1;
    const len = settings[type].length;

    currentIndex[type] = (currentIndex[type] + direction + len) % len;
    updateDisplay(type);
  });

  $("#back").on("click", function(){
    $("#setting-page").hide();
    $("#selection").show();
    $("#title").show();
    $("#stage-intro").show();
    $("#main-section").show();
  });

  //엔딩 선택
  $("#goback").on("click", function () {
    $("#ending-message").text("고백했다... 과연 그 사람의 반응은?");
    $(".ending-choice").hide();

    // 나중에 추가: 고백 성공/실패 분기, 이미지, 엔딩 메시지 등
    setTimeout(() => {
      $("#ending-screen").fadeOut(500);
      $("#start-screen").fadeIn(800);
      $("#start-btn").fadeIn(800);
    }, 5000);
  });

  $("#hold").on("click", function () {
    $("#ending-message").text("참았다... 언젠가 다시 기회가 올까?");
    $(".ending-choice").hide();

    // 후속 연출 가능 (예: 다시 시작 버튼 등)
    setTimeout(() => {
      $("#ending-screen").fadeOut(500);
      $("#start-screen").fadeIn(800);
      $("#start-btn").fadeIn(800);
    }, 5000);
  });

});

const gameIntroLines = [
  "누구나 한 번쯤은 짝사랑을 해보았을 것이다",
  "마주치기만 해도 가슴이 뛰고,",
  "우연히 말을 걸어주면 하루 종일 기분이 좋았다",
  "하지만 쉽게 다가갈 수 없었던 그 사람",
  "오늘은 용기 내기로 했다",
  "과연… 이 마음, 전할 수 있을까?"
];

function playGameIntro(callback) {
  var idx = 0;
  const introDiv = $("#intro-text");

  $("#bgCanvas").fadeIn(500);

  function showNextLine() {
    if (idx < gameIntroLines.length) {
      introDiv.fadeOut(300, function () {
        introDiv.text(gameIntroLines[idx++]).fadeIn(600, function () {
          setTimeout(showNextLine, 2000);
        });
      });
    } else {
      introDiv.fadeOut(500, function () {
        $("#bgCanvas").fadeOut(500);
        if (callback) callback();
      });
    }
  }

  showNextLine();
}


function updateDisplay(type) {
  const value = settings[type][currentIndex[type]];
  const target = $(`#${type}-current`);

  if (type == "ball") {
    if (value == "기본") {
      ballColor = "#ff4d4d";
    } else if (value == "파란공") {
      ballColor = "#4d88ff";
    } else if (value == "빨간공") {
      ballColor = "#ff3333";
    }

    // 공: 작은 정사각형 색상 블록 표시
    target.html(`<div style="
      width: 20px;
      height: 20px;
      background: ${ballColor};
      border-radius: 4px;
      border: 1px solid #999;"></div>`);

  } else if (type == "paddle") {
    if (value == "기본") {
      paddleColor = "#333";
    } else if (value == "파란색") {
      paddleColor = "#3366ff";
    } else if (value == "빨간색") {
      paddleColor = "#cc0000";
    }

    // 패들: 긴 직사각형 색상 바 표시
    target.html(`<div style="
      width: 50px;
      height: 10px;
      background: ${paddleColor};
      border-radius: 3px;
      border: 1px solid #999;"></div>`);

  } else if (type == "music") {
    if (value == "기본") {
      stopBackgroundMusic();
      target.text("X");
    } else if (value == "음악1") {
      playBackgroundMusic("assets/audio/music1.mp3");
      target.text("music1 🎵");
    } else if (value == "음악2") {
      playBackgroundMusic("assets/audio/music2.mp3");
      target.text("music2 🎶");
    }
  }
}

function goToNextStage() {
  // 다음 스테이지 결정
  if (stage == "EASY") stage = "NORMAL";
  else if (stage == "NORMAL") stage = "HARD";
  else if (stage == "HARD") {
    gameStatus = "ENDING";
    return;
  }

  gameStatus = "READY";

  // 스테이지 인트로 텍스트 설정
  let introText = "";
  if (stage == "EASY") introText = "EASY – 처음 마주친 날";
  else if (stage == "NORMAL") introText = "NORMAL – 말을 걸어볼까?";
  else if (stage == "HARD") introText = "HARD – 고백의 순간";

  // 캔버스 숨기고 인트로 표시
  $("#gameCanvas").fadeOut(300, function () {
    $("#stage-intro")
      .text(introText)
      .css({ display: "none" })
      .fadeIn(500);

    // 2초 후 인트로 숨기고 게임 시작
    setTimeout(function () {
      $("#stage-intro").fadeOut(300, function () {
        $("#gameCanvas").fadeIn(300);

        generateBricks(stage);
        applyStageSettings(stage);
        updateDisplay("ball");
        updateDisplay("paddle");
        updateDisplay("music");
        ballX = canvas.width / 2;
        ballY = canvas.height - 200;
        lives = 3;
        score = 0;
        isDead = false;
        gameStatus = "PLAYING";
      });
    }, 2000);
  });
}

console.log("게임 스크립트 로드 완료");

var canvas = document.getElementById("gameCanvas");
var ctx = canvas.getContext("2d");

// 게임 상태
var isDead = false;
var score = 0;
var lives = 3;
var stage = "EASY";
var gameStatus = "PLAYING"; 
// 가능 상태: READY, PLAYING, STAGE_CLEAR, GAME_OVER

// 공
var ballRadius = 10;
var ballX = canvas.width / 2;
var ballY = canvas.height - 200;
var ballDX = 2;
var ballDY = -6;

// 패들
var paddleWidth = 120;
var paddleHeight = 20;
var paddleX = (canvas.width - paddleWidth) / 2;
var paddleY = canvas.height - paddleHeight - 10;
var paddleSpeed = 7;
var paddleDX = 0;

// 키 입력 상태
var leftPressed = false;
var rightPressed = false;

// 벽돌 설정
var brickRowCount = 3;
var brickColCount = 5;
var brickWidth = 150;
var brickHeight = 30;
var brickPadding = 10;
var brickOffsetTop = 60;
var brickOffsetLeft = 50;

var bricks = [];

const stageSettings = {
  EASY: {
    rows: 4,
    cols: 5,
    width: 150,
    height: 50,
    padding: 10,
    offsetX: 50,
    offsetY: 60,
    ballSpeed: 5,
    ballRadius: 12,
    paddleWidth: 120
  },
  NORMAL: {
    rows: 4,
    cols: 6,
    width: 120,
    height: 25,
    padding: 8,
    offsetX: 40,
    offsetY: 50,
    ballSpeed: 7,
    ballRadius: 10,
    paddleWidth: 120
  },
  HARD: {
    rows: 5,
    cols: 7,
    width: 100,
    height: 20,
    padding: 6,
    offsetX: 30,
    offsetY: 40,
    ballSpeed: 8,
    ballRadius: 8,
    paddleWidth: 120
  }
};

//벽돌 생성
function generateBricks(stage) {
  bricks = [];

  const s = stageSettings[stage];
  if (!s) return;

  for (let r = 0; r < s.rows; r++) {
    for (let c = 0; c < s.cols; c++) {
      const x = s.offsetX + c * (s.width + s.padding);
      const y = s.offsetY + r * (s.height + s.padding);
      const brick = new Brick(x, y, stage);

      brick.width = s.width;
      brick.height = s.height;

      bricks.push(brick);
    }
  }
}

function Brick(x, y, type) {
  this.x = x;
  this.y = y;
  this.width = 150; // 기본값, generateBricks()에서 덮어씀
  this.height = 30;
  this.alive = true;
  this.type = type;

  this.draw = function(ctx) {
    if (!this.alive) return;

    // 색상 설정
    if (this.type === "EASY") ctx.fillStyle = "#79c";
    else if (this.type === "NORMAL") ctx.fillStyle = "#f78";
    else if (this.type === "HARD") ctx.fillStyle = "#fa0";

    // 사각형 벽돌 그리기
    ctx.fillRect(this.x, this.y, this.width, this.height);
  };
}

//스테이지별 공, 패드 세팅
function applyStageSettings(stage) {
  const s = stageSettings[stage];
  if (!s) return;

  ballRadius = s.ballRadius;
  ballDX = s.ballSpeed;
  ballDY = -s.ballSpeed;

  paddleWidth = s.paddleWidth;
  paddleX = (canvas.width - paddleWidth) / 2; // 위치도 재정렬
}

// 키 이벤트
document.addEventListener("keydown", function(e) {
  if (e.key == "ArrowLeft") leftPressed = true;
  if (e.key == "ArrowRight") rightPressed = true;

  if (e.code == "Space") {
    if (gameStatus == "GAME_OVER") {
      // 같은 스테이지 재시작
      generateBricks(stage);
      applyStageSettings(stage);
      updateDisplay("ball");
      updateDisplay("paddle");
      updateDisplay("music");
      ballX = canvas.width / 2;
      ballY = canvas.height - 200;
      lives = 3;
      score = 0;
      isDead = false;
      gameStatus = "PLAYING";
    }

    if (gameStatus == "READY") {
      applyStageSettings(stage);
      updateDisplay("ball");
      updateDisplay("paddle");
      updateDisplay("music");
      gameStatus = "PLAYING";
      isDead = false;
    } else if (isDead && lives > 0) {
      ballDX = stageSettings[stage].ballSpeed;
      ballDY = -stageSettings[stage].ballSpeed;
      ballX = canvas.width / 2;
      ballY = canvas.height - 200;
      isDead = false;
    }
  }
});
document.addEventListener("keyup", function(e) {
  if (e.key === "ArrowLeft") leftPressed = false;
  if (e.key === "ArrowRight") rightPressed = false;
});


function drawBall() {
  ctx.beginPath();
  ctx.arc(ballX, ballY, ballRadius, 0, Math.PI * 2);
  ctx.fillStyle = ballColor;;
  ctx.fill();
  ctx.closePath();
}

function drawPaddle() {
  ctx.beginPath();
  ctx.rect(paddleX, paddleY, paddleWidth, paddleHeight);
  ctx.fillStyle = paddleColor;
  ctx.fill();
  ctx.closePath();
}

function drawBricks() {
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
    ctx.fillText("Press Spacebar to begin", canvas.width / 2, canvas.height / 2);
    ctx.textAlign = "start"; // 다음 텍스트에 영향 안 주도록 원래대로 돌림
  }
}

// 충돌 체크
function collisionCheck() {
  for (let i = 0; i < bricks.length; i++) {
    const b = bricks[i];
    if (b.alive) {
      if (
        ballX > b.x &&
        ballX < b.x + b.width &&
        ballY > b.y &&
        ballY < b.y + b.height
      ) {
        ballDY = -ballDY;
        b.alive = false;
        score += 10;

        // 스테이지 클리어 조건
        const aliveCount = bricks.filter(brick => brick.alive).length;
        if (aliveCount == 0) {
          gameStatus = "STAGE_CLEAR";
          ballDX = 0;
          ballDY = 0;
        }
      }
    }
  }
}

// 업데이트
function update() {
  // 방향키 입력 처리
  if (leftPressed) paddleDX = -paddleSpeed;
  else if (rightPressed) paddleDX = paddleSpeed;
  else paddleDX = 0;

  // 패들 이동
  paddleX += paddleDX;
  if (paddleX < 0) paddleX = 0;
  if (paddleX + paddleWidth > canvas.width) {
    paddleX = canvas.width - paddleWidth;
  }

  // 공 이동 (공이 멈춘 상태가 아니면)
  if (ballDX !== 0 || ballDY !== 0) {
    ballX += ballDX;
    ballY += ballDY;
  }

  // 벽 충돌
  if (ballX < ballRadius || ballX > canvas.width - ballRadius) {
    ballDX = -ballDX;
  }
  if (ballY < ballRadius) {
    ballDY = -ballDY;
  }

  // 바닥 충돌
  if (!isDead && ballY + ballRadius >= canvas.height && gameStatus != "STAGE_CLEAR") {
    isDead = true;

    if (lives > 0) {
      lives--;
      ballX = canvas.width / 2;
      ballY = canvas.height - 200;
      ballDX = 0;
      ballDY = 0;
    }

    if (lives === 0) {
      gameStatus = "GAME_OVER";
    }
  }


  // 패들 충돌
  if (
    ballY + ballRadius >= paddleY &&
    ballX >= paddleX &&
    ballX <= paddleX + paddleWidth
  ) {
    ballDY = -ballDY;
  }

  collisionCheck();
}

// 전체 루프
function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  if (gameStatus == "PAUSED") return;

  drawBricks();
  drawBall();
  drawPaddle();
  drawUI();

  // 상태별 흐름 제어
  if (gameStatus == "PLAYING") {
    update();
  } else if (gameStatus == "READY") {
    // 아직 시작 전 상태 (UI만 보여줌)
  } else if (gameStatus == "STAGE_CLEAR") {
    ctx.font = "24px 'Share Tech'";
    ctx.textAlign = "center";
    ctx.fillStyle = "#007";
    ctx.fillText("Stage Clear!", canvas.width / 2, canvas.height / 2);
    ctx.textAlign = "start";

    // 2초 후 다음 스테이지로 전환 (단 1회만 실행되게)
    if (!draw.nextStageScheduled) {
      draw.nextStageScheduled = true;
      setTimeout(() => {
        goToNextStage();
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
  } else if (gameStatus == "ENDING") {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // 캔버스 숨기고, 엔딩 화면으로 전환
    if (!draw.endingTriggered) {
      draw.endingTriggered = true;

      $("#gameCanvas").fadeOut(500, function () {
        $("#bgCanvas").fadeIn(500); // 별 배경 효과 다시 활성화
        $("#ending-screen").fadeIn(500);
        $("#ending-message").text("드디어 모든 단계를 클리어했다...\n이제 어떻게 할까?");
      });
    }
  }
}

generateBricks(stage);
applyStageSettings(stage);
updateDisplay("ball");
updateDisplay("paddle");
updateDisplay("music");

// setInterval로 반복
var timer = setInterval(draw, 16); // 60fps
