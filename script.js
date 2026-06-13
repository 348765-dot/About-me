const claw = document.querySelector("#claw");
const playArea = document.querySelector("#playArea");
const prizeLayer = document.querySelector("#prizeLayer");
const leftButton = document.querySelector("#leftButton");
const rightButton = document.querySelector("#rightButton");
const grabButton = document.querySelector("#grabButton");
const resetButton = document.querySelector("#resetButton");
const latestTitle = document.querySelector("#latestTitle");
const latestTask = document.querySelector("#latestTask");
const scoreText = document.querySelector("#scoreText");
const attemptsText = document.querySelector("#attemptsText");
const meterFill = document.querySelector("#meterFill");
const collection = document.querySelector("#collection");
const toast = document.querySelector("#toast");

const prizes = [
  {
    name: "Strawberry Bear",
    face: "🧸",
    color: "#ffb7d5",
    task: "Pick one tiny task you can finish in five minutes, then do only that.",
  },
  {
    name: "Cloud Bunny",
    face: "🐰",
    color: "#d9f8ff",
    task: "Clear one small space on your desk or screen before your next break.",
  },
  {
    name: "Lucky Cat",
    face: "🐱",
    color: "#ffe38a",
    task: "Send one message you have been meaning to send.",
  },
  {
    name: "Mint Puppy",
    face: "🐶",
    color: "#baf7c7",
    task: "Drink water and take three slow breaths. Quick reset achieved.",
  },
  {
    name: "Star Panda",
    face: "🐼",
    color: "#e7ddff",
    task: "Write down one thing you finished today, even if it was small.",
  },
  {
    name: "Arcade Fox",
    face: "🦊",
    color: "#ffc09b",
    task: "Choose one fun reward after your next focused work sprint.",
  },
];

let clawPosition = 50;
let attempts = 0;
let isGrabbing = false;
let wonPrizes = new Set();
let prizeElements = [];
let toastTimer;

function renderPrizes() {
  prizeLayer.innerHTML = "";
  prizeElements = prizes.map((prize, index) => {
    const item = document.createElement("button");
    item.className = "prize hidden-prize";
    item.type = "button";
    item.disabled = true;
    item.dataset.index = String(index);
    item.dataset.baseX = String(16 + (index % 3) * 34);
    item.dataset.baseY = String(28 + Math.floor(index / 3) * 38);
    item.style.setProperty("--tone", prize.color);
    item.style.setProperty("--x", `${item.dataset.baseX}%`);
    item.style.setProperty("--y", `${item.dataset.baseY}%`);
    item.innerHTML = `<span class="prize-face" aria-hidden="true">${prize.face}</span>`;
    prizeLayer.appendChild(item);
    return item;
  });
}

function renderCollection() {
  collection.innerHTML = "";
  prizes.forEach((prize, index) => {
    const slot = document.createElement("span");
    if (wonPrizes.has(index)) {
      slot.className = "won";
      slot.textContent = prize.name;
    } else {
      slot.textContent = "Mystery";
    }
    collection.appendChild(slot);
  });
}

function updateScore() {
  const wonCount = wonPrizes.size;
  scoreText.textContent = `${wonCount} of ${prizes.length} prizes revealed`;
  attemptsText.textContent = `${attempts} ${attempts === 1 ? "grab" : "grabs"}`;
  meterFill.style.width = `${(wonCount / prizes.length) * 100}%`;
}

function setClawPosition(nextPosition) {
  clawPosition = Math.max(8, Math.min(92, nextPosition));
  claw.style.setProperty("--claw-x", `${clawPosition}%`);
}

function movePrizes() {
  const now = Date.now() / 1000;
  prizeElements.forEach((item, index) => {
    if (wonPrizes.has(index)) return;
    const baseX = Number(item.dataset.baseX);
    const baseY = Number(item.dataset.baseY);
    const drift = Math.sin(now * (0.9 + index * 0.12) + index) * 7;
    const bob = Math.cos(now * (0.75 + index * 0.08) + index) * 4;
    item.style.setProperty("--x", `${Math.max(10, Math.min(90, baseX + drift))}%`);
    item.style.setProperty("--y", `${Math.max(16, Math.min(86, baseY + bob))}%`);
  });
  requestAnimationFrame(movePrizes);
}

function findCatch() {
  const clawRect = claw.getBoundingClientRect();
  const clawCenter = clawRect.left + clawRect.width / 2;
  let closest = null;
  let closestDistance = Infinity;

  prizeElements.forEach((item, index) => {
    if (wonPrizes.has(index)) return;
    const rect = item.getBoundingClientRect();
    const center = rect.left + rect.width / 2;
    const distance = Math.abs(clawCenter - center);
    if (distance < closestDistance) {
      closest = { index, item, distance };
      closestDistance = distance;
    }
  });

  if (!closest) return null;
  return closest.distance < 74 ? closest : null;
}

function showToast(message) {
  clearTimeout(toastTimer);
  toast.textContent = message;
  toast.classList.add("show");
  toastTimer = setTimeout(() => toast.classList.remove("show"), 1800);
}

function setControls(disabled) {
  leftButton.disabled = disabled;
  rightButton.disabled = disabled;
  grabButton.disabled = disabled;
}

function grabPrize() {
  if (isGrabbing) return;

  isGrabbing = true;
  attempts += 1;
  updateScore();
  setControls(true);
  claw.classList.add("grabbing");
  claw.style.setProperty("--drop", "210px");

  setTimeout(() => {
    const caught = findCatch();
    claw.style.setProperty("--drop", "0px");

    if (caught) {
      wonPrizes.add(caught.index);
      caught.item.classList.add("captured");
      const prize = prizes[caught.index];
      latestTitle.textContent = `${prize.face} ${prize.name}`;
      latestTask.textContent = prize.task;
      showToast("Prize grabbed. Task revealed!");
    } else {
      latestTitle.textContent = "So close!";
      latestTask.textContent = "The claw missed this time. Nudge it left or right and try again.";
      showToast("Almost. Line up the claw and grab again.");
    }

    renderCollection();
    updateScore();

    setTimeout(() => {
      claw.classList.remove("grabbing");
      setControls(false);
      isGrabbing = false;

      if (wonPrizes.size === prizes.length) {
        latestTitle.textContent = "Machine cleared!";
        latestTask.textContent = "Every mystery task has been revealed. That is a full arcade win.";
        showToast("Amazing run. You cleared the machine!");
      }
    }, 520);
  }, 620);
}

function resetGame() {
  attempts = 0;
  wonPrizes = new Set();
  isGrabbing = false;
  latestTitle.textContent = "Mystery task waiting...";
  latestTask.textContent =
    "Move the claw, press grab, and discover the short challenge hidden inside a stuffed prize.";
  setClawPosition(50);
  renderPrizes();
  renderCollection();
  updateScore();
  showToast("Machine reset. Fresh prizes loaded.");
}

leftButton.addEventListener("click", () => setClawPosition(clawPosition - 10));
rightButton.addEventListener("click", () => setClawPosition(clawPosition + 10));
grabButton.addEventListener("click", grabPrize);
resetButton.addEventListener("click", resetGame);

document.addEventListener("keydown", (event) => {
  if (event.key === "ArrowLeft") setClawPosition(clawPosition - 10);
  if (event.key === "ArrowRight") setClawPosition(clawPosition + 10);
  if (event.key === " " || event.key === "Enter") {
    event.preventDefault();
    grabPrize();
  }
});

resetGame();
movePrizes();
