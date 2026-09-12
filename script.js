// Tafels Kampioen - oefenapp voor de maaltafels
// Alle voortgang wordt lokaal opgeslagen in de browser (localStorage).

// Volgorde waarin de tafels aangeleerd worden. Dit volgt de klassieke
// didactische opbouw: eerst de tafels die aansluiten bij dingen die het kind
// al kent (tellen in sprongen van 10, 5, 2), dan tafels die je kan afleiden
// door te verdubbelen (4, 6, 8) of door erbij/eraf te tellen t.o.v. een
// gekende tafel (9 = tafel van 10 min 1x, 7 = tafel van 5 + tafel van 2).
const LEARNING_ORDER = [1, 10, 5, 2, 4, 3, 6, 9, 7, 8];
const TABLES = [...LEARNING_ORDER].sort((a, b) => a - b); // voor het overzicht op het startscherm
const FACTORS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
const MASTERY_STREAK = 3; // aantal keer na elkaar goed voor een feit telt als "gekend"
const STORAGE_KEY = "tafels-kampioen-v2";

const MASCOTS = { happy: ["🐸", "🐵", "🦊", "🐶", "🐼"], sad: "😊" };

// Uitleg over hoe elke tafel te linken is aan iets dat het kind al kent.
// Enkel tafels waarvoor dit een goede, eenvoudige uitleg oplevert staan hier in.
const RELATIONS = {
  4: { type: "double", of: 2 },
  6: { type: "double", of: 3 },
  8: { type: "double", of: 4 },
  9: { type: "minusOne", of: 10 },
  7: { type: "sum", of: [5, 2] },
};

// Trucjes die getoond worden in de intro van een tafel (naast de gewone opbouw).
const TRICKS = {
  10: "Trucje: bij de tafel van 10 zet je gewoon een nul achter het getal!",
  5: "Trucje: bij de tafel van 5 tel je in sprongen van 5. Het antwoord eindigt altijd op 0 of 5!",
  2: "Trucje: de tafel van 2 is gewoon verdubbelen! 2 × een getal is dat getal plus zichzelf.",
};

function defaultState() {
  const progress = {};
  TABLES.forEach(t => {
    progress[t] = {};
    FACTORS.forEach(f => { progress[t][f] = 0; });
  });
  return {
    name: "",
    currentTable: LEARNING_ORDER[0], // tafel waar de speler nu op oefent
    progress,          // progress[tafel][factor] = streak (0..MASTERY_STREAK)
    taughtTables: {},  // tafel -> true zodra de uitleg (les) is afgerond
  };
}

function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return defaultState();
    const parsed = JSON.parse(raw);
    const fresh = defaultState();
    return {
      ...fresh,
      ...parsed,
      progress: { ...fresh.progress, ...(parsed.progress || {}) },
      taughtTables: { ...fresh.taughtTables, ...(parsed.taughtTables || {}) },
    };
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

function learningIndexOf(table) {
  return LEARNING_ORDER.indexOf(table);
}

function isUnlocked(table) {
  return learningIndexOf(table) <= learningIndexOf(state.currentTable);
}

function nextTableAfter(table) {
  const idx = learningIndexOf(table);
  if (idx === -1 || idx + 1 >= LEARNING_ORDER.length) return null;
  return LEARNING_ORDER[idx + 1];
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

function nextQuestionTableFor(activeTable) {
  // 75% van de tijd de actieve tafel, anders een eerder geleerde tafel herhalen
  const learned = TABLES.filter(t => t !== activeTable && (learningIndexOf(t) < learningIndexOf(activeTable) || isTableMastered(t)));
  if (learned.length > 0 && Math.random() > 0.75) {
    return learned[Math.floor(Math.random() * learned.length)];
  }
  return activeTable;
}

function randomFrom(arr) { return arr[Math.floor(Math.random() * arr.length)]; }

// ---------- Screens ----------

const screens = {
  home: document.getElementById("screen-home"),
  quiz: document.getElementById("screen-quiz"),
  lesson: document.getElementById("screen-lesson"),
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
  document.getElementById("current-table-label").textContent = state.taughtTables[state.currentTable]
    ? `Tafel van ${state.currentTable}`
    : `Leer de tafel van ${state.currentTable}`;

  const grid = document.getElementById("table-grid");
  grid.innerHTML = "";
  TABLES.forEach(t => {
    const btn = document.createElement("button");
    const unlocked = isUnlocked(t);
    const mastered = isTableMastered(t);
    btn.className = "table-tile" + (mastered ? " mastered" : "") + (unlocked ? "" : " locked");
    btn.innerHTML = `${t}${mastered ? '<span class="star">⭐</span>' : ""}`;
    btn.disabled = !unlocked;
    btn.addEventListener("click", () => handleTableTileClick(t));
    grid.appendChild(btn);
  });
}

function handleTableTileClick(table) {
  if (table === state.currentTable && !state.taughtTables[table]) {
    startLesson(table);
  } else {
    startQuiz(table);
  }
}

document.getElementById("btn-start-adaptive").addEventListener("click", () => {
  handleTableTileClick(state.currentTable);
});

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

document.getElementById("btn-quit").addEventListener("click", () => {
  renderHome();
  showScreen("home");
});

// ---------- Lesson (uitleg van een nieuwe tafel) ----------
// Elke nieuwe tafel wordt eerst aangeleerd met een korte reeks kaartjes:
// 1) betekenis + concreet voorbeeld, 2) opbouw met stipjes + de groeiende tafel,
// 3) (indien van toepassing) link met een tafel die het kind al kent,
// 4) tellen in sprongen + twee korte controlevragen, 5) klaar om te oefenen.

let lesson = {
  table: null,
  cards: [],
  cardIndex: 0,
  buildupN: 1,
  skipRevealed: 2,
  skipChecks: [],      // [{n, answer, input, locked, correct}]
  skipCheckIndex: 0,
};

function startLesson(table) {
  lesson.table = table;
  lesson.cards = buildLessonCards(table);
  lesson.cardIndex = 0;
  lesson.buildupN = 1;
  lesson.skipRevealed = 2;
  lesson.skipCheckIndex = 0;
  lesson.skipChecks = pickSkipChecks(table);
  showScreen("lesson");
  renderLessonCard();
}

function buildLessonCards(table) {
  if (table === 1) {
    return ["intro-one", "ready"];
  }
  const cards = ["intro", "buildup"];
  if (RELATIONS[table]) cards.push("relation");
  cards.push("skipcount", "ready");
  return cards;
}

function pickSkipChecks(table) {
  const candidates = FACTORS.filter(f => f >= 2 && f <= 9);
  const chosen = [];
  while (chosen.length < 2 && candidates.length > 0) {
    const idx = Math.floor(Math.random() * candidates.length);
    chosen.push(candidates.splice(idx, 1)[0]);
  }
  return chosen.map(n => ({ n, answer: table * n, input: "", locked: false, correct: null }));
}

function renderLessonDots() {
  const el = document.getElementById("lesson-dots");
  el.innerHTML = lesson.cards.map((_, i) => {
    const cls = i === lesson.cardIndex ? "dot active" : (i < lesson.cardIndex ? "dot done" : "dot");
    return `<span class="${cls}"></span>`;
  }).join("");
}

function goToNextLessonCard() {
  if (lesson.cardIndex < lesson.cards.length - 1) {
    lesson.cardIndex += 1;
    renderLessonCard();
  }
}

function renderLessonCard() {
  renderLessonDots();
  const t = lesson.table;
  const type = lesson.cards[lesson.cardIndex];
  const content = document.getElementById("lesson-content");

  if (type === "intro-one") {
    content.innerHTML = `
      <h2>De tafel van 1 🌟</h2>
      <p class="lesson-text">Bij de tafel van 1 verandert er niks: 1 keer een getal is gewoon dat getal zelf!</p>
      <div class="lesson-example">1 × 6 = 6</div>
      <div class="lesson-example">1 × 9 = 9</div>
      <button class="lesson-nav-btn" data-action="lesson-next">Verder ▶️</button>
    `;
    return;
  }

  if (type === "intro") {
    const trick = TRICKS[t];
    content.innerHTML = `
      <h2>De tafel van ${t} 🌟</h2>
      <p class="lesson-text">${t} × 3 betekent: neem 3 groepjes van ${t}. Kijk maar naar dit ene groepje:</p>
      ${dotGridHTML(t, 1)}
      <div class="lesson-example">1 × ${t} = ${t}</div>
      ${trick ? `<p class="lesson-text">${trick}</p>` : ""}
      <button class="lesson-nav-btn" data-action="lesson-next">Volgende groepje ▶️</button>
    `;
    return;
  }

  if (type === "buildup") {
    const n = lesson.buildupN;
    const isDone = n >= 10;
    content.innerHTML = `
      <h2>Tafel van ${t} opbouwen</h2>
      <p class="lesson-text">Elke keer komt er 1 groepje van ${t} bij.</p>
      ${dotGridHTML(t, n)}
      <div class="fact-list">${factListHTML(t, n)}</div>
      <button class="lesson-nav-btn" data-action="${isDone ? "lesson-next" : "buildup-more"}">
        ${isDone ? "Verder ▶️" : "+1 groepje ➕"}
      </button>
    `;
    return;
  }

  if (type === "relation") {
    content.innerHTML = relationCardHTML(t);
    return;
  }

  if (type === "skipcount") {
    content.innerHTML = skipCountCardHTML(t);
    return;
  }

  if (type === "ready") {
    content.innerHTML = `
      <h2>Klaar om te oefenen! 🚀</h2>
      <p class="lesson-text">Je hebt nu gezien hoe de tafel van ${t} werkt. Nu gaan we oefenen tot je ze helemaal uit je hoofd kent!</p>
      <button class="lesson-nav-btn" data-action="lesson-start-quiz">Beginnen met oefenen!</button>
    `;
    return;
  }
}

function dotGridHTML(table, rows) {
  let dots = "";
  for (let r = 1; r <= rows; r++) {
    for (let c = 0; c < table; c++) {
      dots += `<span class="dot-item${r === rows ? " new-row" : ""}"></span>`;
    }
  }
  return `<div class="dot-grid" style="grid-template-columns: repeat(${table}, 16px);">${dots}</div>`;
}

function factListHTML(table, upTo) {
  let html = "";
  for (let n = 1; n <= upTo; n++) {
    html += `<div class="${n === upTo ? "latest" : ""}">${n} × ${table} = ${n * table}</div>`;
  }
  return html;
}

function relationCardHTML(t) {
  const rel = RELATIONS[t];
  const n = 6;
  let text = "";
  let examples = "";

  if (rel.type === "double") {
    text = `Tafel van ${t} is het dubbele van de tafel van ${rel.of}! Ken je een feit van de tafel van ${rel.of}? Tel het gewoon twee keer.`;
    examples = `
      <div class="lesson-example">${rel.of} × ${n} = ${rel.of * n}</div>
      <div class="lesson-example">${t} × ${n} = ${rel.of * n} + ${rel.of * n} = ${t * n}</div>
    `;
  } else if (rel.type === "minusOne") {
    text = `Trucje: ${t} × een getal = (${rel.of} × dat getal) min dat getal.`;
    examples = `
      <div class="lesson-example">${rel.of} × ${n} = ${rel.of * n}</div>
      <div class="lesson-example">${t} × ${n} = ${rel.of * n} − ${n} = ${t * n}</div>
    `;
  } else if (rel.type === "sum") {
    const [a, b] = rel.of;
    text = `Je kent de tafel van ${a} en de tafel van ${b} al! Tel ze samen op voor de tafel van ${t}.`;
    examples = `
      <div class="lesson-example">${a} × ${n} = ${a * n}</div>
      <div class="lesson-example">${b} × ${n} = ${b * n}</div>
      <div class="lesson-example">${t} × ${n} = ${a * n} + ${b * n} = ${t * n}</div>
    `;
  }

  return `
    <h2>Handig weetje 💡</h2>
    <p class="lesson-text">${text}</p>
    ${examples}
    <button class="lesson-nav-btn" data-action="lesson-next">Verder ▶️</button>
  `;
}

function skipCountCardHTML(t) {
  const sequence = Array.from({ length: 11 }, (_, i) => i * t);
  const chips = sequence.map((v, i) => {
    if (i < lesson.skipRevealed) return `<span class="chip">${v}</span>`;
    return `<span class="chip placeholder">?</span>`;
  }).join("");

  if (lesson.skipRevealed < sequence.length) {
    return `
      <h2>Tellen in sprongen</h2>
      <p class="lesson-text">Tel steeds ${t} verder. Dat helpt om de tafel snel te kennen!</p>
      <div class="chip-row">${chips}</div>
      <button class="lesson-nav-btn" data-action="skip-reveal">Volgende sprong ➜</button>
    `;
  }

  // Alle sprongen getoond -> controlevragen
  const check = lesson.skipChecks[lesson.skipCheckIndex];
  if (!check) {
    return `
      <h2>Top, dat zit goed! 👍</h2>
      <p class="lesson-text">Je kan al goed springen met de tafel van ${t}.</p>
      <div class="chip-row">${chips}</div>
      <button class="lesson-nav-btn" data-action="lesson-next">Verder ▶️</button>
    `;
  }

  const feedback = check.correct === null ? "" :
    check.correct
      ? `<p class="feedback correct">Juist! 🎉</p>`
      : `<p class="feedback wrong">Bijna! ${t} × ${check.n} = ${check.answer}</p>`;

  return `
    <h2>Korte controle ✏️</h2>
    <p class="lesson-text">Wat is ${t} × ${check.n}?</p>
    <div class="answer-display">${check.input || " "}</div>
    ${feedback}
    ${miniKeypadHTML(check.locked)}
  `;
}

function miniKeypadHTML(locked) {
  const keys = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "back", "0", "enter"];
  return `<div class="mini-keypad">${keys.map(k => {
    if (k === "back") return `<button class="key-back" data-action="skip-key" data-key="back" ${locked ? "disabled" : ""}>⌫</button>`;
    if (k === "enter") return `<button class="key-enter" data-action="skip-key" data-key="enter" ${locked ? "disabled" : ""}>✔️</button>`;
    return `<button data-action="skip-key" data-key="${k}" ${locked ? "disabled" : ""}>${k}</button>`;
  }).join("")}</div>`;
}

document.getElementById("screen-lesson").addEventListener("click", (e) => {
  const btn = e.target.closest("button");
  if (!btn) return;
  const action = btn.dataset.action;

  if (action === "lesson-next") {
    goToNextLessonCard();
  } else if (action === "buildup-more") {
    lesson.buildupN = Math.min(10, lesson.buildupN + 1);
    renderLessonCard();
  } else if (action === "skip-reveal") {
    lesson.skipRevealed = Math.min(11, lesson.skipRevealed + 1);
    renderLessonCard();
  } else if (action === "skip-key") {
    handleSkipCheckKey(btn.dataset.key);
  } else if (action === "lesson-start-quiz") {
    state.taughtTables[lesson.table] = true;
    saveState();
    startQuiz(lesson.table);
  }
});

function handleSkipCheckKey(key) {
  const check = lesson.skipChecks[lesson.skipCheckIndex];
  if (!check || check.locked) return;

  if (key === "back") {
    check.input = check.input.slice(0, -1);
  } else if (key === "enter") {
    if (check.input === "") return;
    check.locked = true;
    check.correct = parseInt(check.input, 10) === check.answer;
    renderLessonCard();
    setTimeout(() => {
      lesson.skipCheckIndex += 1;
      renderLessonCard();
    }, check.correct ? 1000 : 2000);
    return;
  } else {
    if (check.input.length < 3) check.input += key;
  }
  renderLessonCard();
}

document.getElementById("btn-lesson-quit").addEventListener("click", () => {
  renderHome();
  showScreen("home");
});

// ---------- Celebration ----------

function celebrateTableMastered(table) {
  const next = nextTableAfter(table);
  if (next !== null) {
    state.currentTable = next;
  }
  saveState();

  const celebrateText = document.getElementById("celebrate-text");
  const continueBtn = document.getElementById("btn-celebrate-continue");

  if (next === null) {
    celebrateText.textContent = `Je kent de tafel van ${table} helemaal! Je kent nu alle tafels! 🏆`;
    continueBtn.textContent = "Terug naar start";
    continueBtn.dataset.nextAction = "home";
  } else {
    celebrateText.textContent = `Je kent de tafel van ${table} helemaal!`;
    continueBtn.textContent = `Leer de tafel van ${next} ➡️`;
    continueBtn.dataset.nextAction = "learn";
  }
  showScreen("celebrate");
}

document.getElementById("btn-celebrate-continue").addEventListener("click", () => {
  const action = document.getElementById("btn-celebrate-continue").dataset.nextAction;
  if (action === "learn") {
    startLesson(state.currentTable);
  } else {
    renderHome();
    showScreen("home");
  }
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
