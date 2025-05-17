/**
 * 파일명: script.js
 * 작성자: 정해찬
 * 작성일: 2025-05-18
 * 설명: 기능 C 구현 완료
 */

const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

let gameState = {
  stage: "easy",
  isRunning: false,
  score: 0
};

function resizeCanvas() {
  const container = document.getElementById("game-container");
  const canvas = document.getElementById("gameCanvas");

  const maxWidth = container.clientWidth * 0.6;
  const maxHeight = container.clientHeight;

  const targetAspect = 4 / 3;

  let newWidth = maxWidth;
  let newHeight = newWidth / targetAspect;

  if (newHeight > maxHeight) {
    newHeight = maxHeight;
    newWidth = newHeight * targetAspect;
  }

  canvas.style.width = `${newWidth}px`;
  canvas.style.height = `${newHeight}px`;
  canvas.width = newWidth;
  canvas.height = newHeight;
}

window.addEventListener("resize", resizeCanvas);
window.addEventListener("load", resizeCanvas);

/* === A: 게임 엔진 & 상태 관리 === */







/* === B: 우측 UI 출력 === */







/* === C: 스테이지별 게임 규칙 === */
const stageConfig = {
  easy: {
    puzzleCount: 9,
    puzzleBoardSelector: "#puzzle-board",
    slotPrefix: "slot-",
    endMessageSelector: "#endMessage",
    messageText: "기억 완성!",
    resetPosition: {top: "0px", left: "0px"},
    puzzleSize: 4
  },
  medium: {
    chatBoxSelector: "#chat-box",
    wordScores: [
      {text: "같이", score: 3},
      {text: "갈래", score: 4},
      {text: "ㅎㅎ", score: 5},
      {text: ".", score: 2},
      {text: "싫어", score: 0},
    ]
  }
}

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

function resetBrick($brick) {
  $brick.css({ top: pos.top, left: pos.left });
}

const puzzleState = {
  board: Array(stageConfig.easy.puzzleCount).fill(null)
};

function handleEasyBrick(brick) {
  const $brick = $(brick);
  const conf = stageConfig.easy;
  const index = parseInt($brick.data("piece-index"));

  if(isNaN(index) || index < 0 || index >= conf.puzzleCount) {
    console.warn("잘못된 퍼즐 인덱스 : ", index);
    return;
  }

  const slotSelector = `${conf.slotPrefix}${index}`;

  if (!puzzleState.board[index]) {
    puzzleState.board[index] = true

    $(conf.puzzleBoardSelector)
      .find(slotSelector)
      .append($brick.clone().addClass("fixed"));

    $brick.remove();

    checkChainReaction();

    if (puzzleState.board.every(Boolean)) {
      $(conf.endMessageSelector)
        .removeClass("hidden")
        .text(conf.messageText);
    }
  } else {
    resetBrick($brick);
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

const mediumState = {
  fullSentence: "",
  totalScore: 0
};

function getScoreForText(text) {
  const scores = stageConfig.medium.wordScores;
  const entry = scores.find(item => item.text === text);
  return entry ? entry.score : 0;
}

function handleMediumBrick(brick) {
  const $brick = $(brick);
  const conf = stageConfig.medium;
  const type = $brick.data("piece-type");

  var text = "";
  if (type === "text") {
    text = $brick.data("piece-text");
    if (!text) return;

    mediumState.fullSentence += text;
  }else if (type === "tone") {
    text = $brick.data("piece-tone");
    if (!text) return;

    mediumState.fullSentence += text;
  }

  const score = getScoreForText(text);

  $(conf.chatBoxSelector).append(
      `<div class="chat-line user">${mediumState.fullSentence} <span class="score">(+${score})</span>`
    );

  $brick.remove();
}

var hardState = {
  intensity: 5,
  confessionUnlocked: false,
  protectionBricks: [12, 13, 14], // 보호 벽돌 관련 함수 구현 예정
  confessionIndex: 13 // 고백 벽돌 관련 함수 구현 예정
}

function startHardStageEffects() {
  $("#game-container").addClass("shacky");
}

function stabilizeView() {
  hardState.intensity--;

  if (hardState.intensity <= 0) {
    $("#game-container").removeClass("shaky");
  }
}

function handleHardBrick(brick) {
  const $brick = $(brick);
  const idx = parseInt($brick.data("brick-index"));
  const isConfession = $brick.data("type") === "confession";

  if (isConfession) {
    if (hardState.confessionUnlocked) {
      console.log("고백");
    }else {
      console.log("실패");
    }
  }else{
    $brick.remove();
    stabilizeView();
  }
}

/* === D: 디자인 및 설정 기능 === */







document.getElementById("startButton").addEventListener("click", () => {
  gameState.isRunning = true;
  console.log("게임 시작됨. 스테이지:", gameState.stage);
});

