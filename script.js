// Tafels Kampioen - oefenapp voor de maaltafels
// Alle voortgang wordt lokaal opgeslagen in de browser (localStorage).

const TABLES = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
const FACTORS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
const MASTERY_STREAK = 3; // aantal keer na elkaar goed voor een feit telt als "gekend"
const STORAGE_KEY = "tafels-kampioen-v1";

const MASCOTS = { happy: ["🐸", "🐵", "🦊", "🐶", "🐼"], sad: "😊" };

function defaultState() {
  const progress = {};
  TABLES.forEach(t => {
    progress[t] = {};
    FACTORS.forEach(f => { progress[t][f] = 0; });
  });
  return {
    name: "",
    currentTable: 1, // tafel waar de speler nu op oefent
    progress,        // progress[tafel][factor] = streak (0..MASTERY_STREAK)
    starsPerTable: {} // tafel -> true als volledig gekend (voor sterren teller)
  };
}

function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return defaultState();
    const parsed = JSON.parse(raw);
    const fresh = defaultState();
    return { ...fresh, ...parsed, progress: { ...fresh.progress, ...(parsed.progress || {}) } };
  } catch (e) {
    return defaultState();
  }
}

function saveState() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

let state = loadState();

// ---------- Helpers ----------

function isFactMastered(table, factor) {
  return state.progress[table][factor] >= MASTERY_STREAK;
}

function isTableMastered(table) {
  return FACTORS.every(f => isFactMastered(table, f));
}

function countStars() {
  return TABLES.filter(t => isTableMastered(t)).length;
}

function highestUnlockedTable() {
  // Alle tafels tot en met de huidige zijn "ontgrendeld" om te kiezen/herhalen
  return state.currentTable;
}

function pickWeightedFactor(table) {
  // Feiten die nog niet gekend zijn komen vaker aan bod dan gekende feiten (herhaling)
  const weights = FACTORS.map(f => (isFactMastered(table, f) ? 1 : 5));
  const total = weights.reduce((a, b) => a + b, 0);
  let r = Math.random() * total;
  for (let i = 0; i < FACTORS.length; i++) {
    r -= weights[i];
    if (r <= 0) return FACTORS[i];
  }
  return FACTORS[FACTORS.length - 1];
}

function nextQuestionTable() {
  // 75% van de tijd de huidige (actieve) tafel, anders een eerder geleerde tafel herhalen
  const learned = TABLES.filter(t => t < state.currentTable || isTableMastered(t));
  if (learned.length > 0 && Math.random() > 0.75) {
    return learned[Math.floor(Math.random() * learned.length)];
  }
  return state.currentTable;
}

// ---------- Screens ----------

const screens = {
  home: document.getElementById("screen-home"),
  quiz: document.getElementById("screen-quiz"),
  celebrate: document.getElementById("screen-celebrate"),
  settings: document.getElementById("screen-settings"),
};

function showScreen(name) {
  Object.values(screens).forEach(s => s.classList.add("hidden"));
  screens[name].classList.remove("hidden");
}

// ---------- Home screen ----------

function renderHome() {
  document.getElementById("player-name").textContent = state.name || "kampioen";
  document.getElementById("total-stars").textContent = `⭐ ${countStars()}`;
  document.getElementById("current-table-label").textContent = `Tafel van ${state.currentTable}`;

  const grid = document.getElementById("table-grid");
  grid.innerHTML = "";
  TABLES.forEach(t => {
    const btn = document.createElement("button");
    const unlocked = t <= highestUnlockedTable();
    const mastered = isTableMastered(t);
    btn.className = "table-tile" + (mastered ? " mastered" : "") + (unlocked ? "" : " locked");
    btn.innerHTML = `${t}${mastered ? '<span class="star">⭐</span>' : ""}`;
    btn.disabled = !unlocked;
    btn.addEventListener("click", () => startQuiz(t));
    grid.appendChild(btn);
  });
}

document.getElementById("btn-start-adaptive").addEventListener("click", () => startQuiz(state.currentTable));

// ---------- Quiz ----------

let quiz = {
  mode: "adaptive",   // "adaptive" (oefent + herhaalt automatisch) of "focused" (blijft op 1 gekozen tafel)
  targetTable: null,  // de tafel waarvan we de voortgang tonen / willen afronden
  table: null,        // de tafel van de huidige vraag (kan een herhaling zijn in adaptive modus)
  factor: null,
  answer: "",
  correctAnswer: null,
  streak: 0,
  locked: false,
};

function startQuiz(table) {
  quiz.mode = (table === state.currentTable) ? "adaptive" : "focused";
  quiz.targetTable = table;
  quiz.streak = 0;
  showScreen("quiz");
  nextQuestion();
}

function nextQuestion() {
  const table = quiz.mode === "adaptive" ? nextQuestionTableFor(quiz.targetTable) : quiz.targetTable;
  const factor = pickWeightedFactor(table);
  quiz.table = table;
  quiz.factor = factor;
  quiz.correctAnswer = table * factor;
  quiz.answer = "";
  quiz.locked = false;

  document.getElementById("question").textContent = `${table} × ${factor} = ?`;
  document.getElementById("answer-display").textContent = " ";
  document.getElementById("feedback").textContent = "";
  document.getElementById("feedback").className = "feedback";
  document.getElementById("mascot").textContent = "🐸";
  document.getElementById("mascot").className = "mascot";
  updateProgressBar();
  document.getElementById("quiz-streak").textContent = `🔥 ${quiz.streak}`;
}

function nextQuestionTableFor(activeTable) {
  const learned = TABLES.filter(t => t < activeTable || isTableMastered(t));
  if (learned.length > 0 && Math.random() > 0.75) {
    return learned[Math.floor(Math.random() * learned.length)];
  }
  return activeTable;
}

function updateProgressBar() {
  const masteredCount = FACTORS.filter(f => isFactMastered(quiz.targetTable, f)).length;
  const pct = Math.round((masteredCount / FACTORS.length) * 100);
  document.getElementById("progress-bar-inner").style.width = pct + "%";
}

document.getElementById("keypad").addEventListener("click", (e) => {
  const btn = e.target.closest("button");
  if (!btn || quiz.locked) return;
  const key = btn.dataset.key;

  if (key === "back") {
    quiz.answer = quiz.answer.slice(0, -1);
  } else if (key === "enter") {
    submitAnswer();
    return;
  } else {
    if (quiz.answer.length < 3) quiz.answer += key;
  }
  document.getElementById("answer-display").textContent = quiz.answer || " ";
});

function submitAnswer() {
  if (quiz.answer === "") return;
  const given = parseInt(quiz.answer, 10);
  const correct = given === quiz.correctAnswer;
  quiz.locked = true;

  const table = quiz.table;
  const factor = quiz.factor;
  const feedbackEl = document.getElementById("feedback");
  const mascotEl = document.getElementById("mascot");

  if (correct) {
    state.progress[table][factor] = Math.min(MASTERY_STREAK, state.progress[table][factor] + 1);
    quiz.streak += 1;
    feedbackEl.textContent = randomPraise();
    feedbackEl.className = "feedback correct";
    mascotEl.textContent = randomFrom(MASCOTS.happy);
    mascotEl.className = "mascot happy";
  } else {
    state.progress[table][factor] = 0; // opnieuw oefenen bij een foutje
    quiz.streak = 0;
    feedbackEl.textContent = `Bijna! Het juiste antwoord is ${quiz.correctAnswer}.`;
    feedbackEl.className = "feedback wrong";
    mascotEl.textContent = "😊";
    mascotEl.className = "mascot sad";
  }
  document.getElementById("quiz-streak").textContent = `🔥 ${quiz.streak}`;
  saveState();
  updateProgressBar();

  const nowMastered = quiz.mode === "adaptive" && table === quiz.targetTable && isTableMastered(table);

  setTimeout(() => {
    if (nowMastered) {
      celebrateTableMastered(table);
    } else {
      nextQuestion();
    }
  }, correct ? 900 : 1800);
}

function randomPraise() {
  const options = ["Juist! 🎉", "Super! ⭐", "Goed zo! 👏", "Knap gedaan!", "Perfect!"];
  return randomFrom(options);
}
function randomFrom(arr) { return arr[Math.floor(Math.random() * arr.length)]; }

document.getElementById("btn-quit").addEventListener("click", () => {
  renderHome();
  showScreen("home");
});

// ---------- Celebration ----------

function celebrateTableMastered(table) {
  document.getElementById("celebrate-text").textContent = `Je kent de tafel van ${table} helemaal!`;
  showScreen("celebrate");
  if (state.currentTable < TABLES.length) {
    state.currentTable += 1;
  }
  saveState();
}

document.getElementById("btn-celebrate-continue").addEventListener("click", () => {
  renderHome();
  showScreen("home");
});

// ---------- Settings ----------

document.getElementById("btn-settings").addEventListener("click", () => {
  document.getElementById("input-name").value = state.name || "";
  showScreen("settings");
});
document.getElementById("btn-settings-back").addEventListener("click", () => {
  state.name = document.getElementById("input-name").value.trim();
  saveState();
  renderHome();
  showScreen("home");
});
document.getElementById("input-name").addEventListener("input", (e) => {
  state.name = e.target.value.trim();
  saveState();
});
document.getElementById("btn-reset").addEventListener("click", () => {
  if (confirm("Weet je zeker dat je alle voortgang wil wissen?")) {
    const name = state.name;
    state = defaultState();
    state.name = name;
    saveState();
    renderHome();
    showScreen("home");
  }
});

// ---------- Init ----------

renderHome();
showScreen("home");
