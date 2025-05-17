/**
 * 파일명: script.js
 * 작성자: 정해찬
 * 작성일: 2025-05-13
 * 설명: 게임 웹사이트의 기본 스크립트 구조
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
    resetPosition: {top: "0px", left: "0px"}
    puzzleSize = 4;
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

const puzzleState = {
  board: Array(stageConfig.easy.puzzleCount).fill(null)
};

function resetBrick($brick) {
  $brick.css({ top: pos.top, left: pos.left });
}

function handleEasyBrick(brick) {
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
        .text(conf.messaggeText);
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
  const colorMap = newArray(total);

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
          $(`#${conf.slotPrefix}${idx} .fixed`.remove();
          puzzleState.board[idx] = null;
        });

        console.log("연쇄 반응");
      }
    }
  }
}

function handleMediumBrick(brick) {

}

function handleHardBrick(brick) {

}
/* === D: 디자인 및 설정 기능 === */







document.getElementById("startButton").addEventListener("click", () => {
  gameState.isRunning = true;
  console.log("게임 시작됨. 스테이지:", gameState.stage);
});

