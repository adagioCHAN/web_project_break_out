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







/* === D: 디자인 및 설정 기능 === */
document.getElementById("settingButton").addEventListener("click", function() {
  console.log("게임 설정 화면");
});






document.getElementById("startButton").addEventListener("click", () => {
  gameState.isRunning = true;
  console.log("게임 시작됨. 스테이지:", gameState.stage);
});

