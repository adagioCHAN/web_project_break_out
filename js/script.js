/**
 * 파일명: script.js
 * 작성자: 정해찬
 * 작성일: 2025-05-18
 * 설명: 퍼즐판/채팅창 기본 스크립트 구조
 */

const canvas = document.getElementById("gameCanvas");
//const ctx = canvas.getContext("2d");

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
function updateStageView(stage) {
  //모든 보드 숨기기
  $('#puzzle-board, #chat-box, #emotion-graph').hide();

  //스테이지별로 필요한 UI만 보이기
  switch (stage) {
    case 'easy':
      $('#puzzle-board').show();
      break;
    case 'medium':
      $('#chat-box').show();
      break;
    case 'hard':
      $('#emotion-graph').show();
      break;
  }
}
/*// 예시: 게임 시작 시
$(document).ready(function() {
  updateStageView(gameState.stage);
});
// 예시: 스테이지 전환 시
function setStage(newStage) {
  gameState.stage = newStage;
  updateStageView(newStage);
}*/

//easy 스테이지
//handleEasyBrick 함수에서 puzzleState.board[index]=true; 코드 아래에 함수 호출
function revealPuzzleImage(index) {
  $(`#slot-${index}`).attr("src", `assets/img/puzzle-${index+1}.png`);
}
//handleEasyBrick 함수에서 (puzzleState.board.every(Boolean)) if문에 아래 코드 넣기
//$("#puzzle-board").css("gap", "0px");

//medium 스테이지
const mediumState = {
  fullSentence: "",
  totalScore: 0,
  brickCount: 0,  //몇 번 mediumState.fullSentence +=text;가 수행되었는지 세는 변수
  messageCount: 0 //몇 번 메시지가 보내졌는지 세는 변수
};

const reactionMap = [
  { min: 10, text: "😊" },
  { min: 5, text: "😐" },
  { min: 0, text: "😢" }
];

//점수에 따른 반응 표시 함수
function getReactionText(score) {
  return (reactionMap.find(r => score >= r.min) || {}).text || "";
}

//메시지 출력
function sendMessage(score) {
  var chatting = document.getElementById("chatting");
  var chatLine = document.querySelector(".chat-line-user");
  if (!chatLine) return;

  chatting.querySelectorAll(".message").forEach(msg => {
    msg.classList.add("slide-up");
  });

  var container = document.createElement("div");
  container.classList.add("message", "new");

  var sentDiv = document.createElement("div");
  sentDiv.setAttribute("class", "sent-content");
  sentDiv.innerHTML = chatLine.innerHTML;
  container.appendChild(sentDiv);
  chatLine.remove();  // 복제 후 원본 삭제

  var sentImg = document.createElement("img");
  sentImg.setAttribute("class", "player-chat-img");
  sentImg.setAttribute("src", "assets/img/kakaotalk-talk.png");
  container.appendChild(sentImg);

  chatting.appendChild(container);
  setTimeout(() => {
    container.classList.remove("new");
  }, 400);

  setTimeout(() => {
    var replyText = getReactionText(score);
    var replyDiv = document.createElement("div");
    replyDiv.setAttribute("class", "reply-line");
    replyDiv.textContent = replyText;
    container.appendChild(replyDiv);
  
    var replyImg = document.createElement("img");
    replyImg.setAttribute("class", "reply-chat-img");
    replyImg.setAttribute("src", "assets/img/kakaotalk-reply.png");
    container.appendChild(replyImg);
  }, 3000);
}


//아래 코드 handleMediumBrick 함수에서 brick.remove(); 위에 넣기
// showReaction(score);
// if (mediumState.brickCount >= 4) {
//   sendMessage();
// }

/* === C: 스테이지별 게임 규칙 === */







/* === D: 디자인 및 설정 기능 === */







document.getElementById("startButton").addEventListener("click", () => {
  gameState.isRunning = true;
  console.log("게임 시작됨. 스테이지:", gameState.stage);
});

