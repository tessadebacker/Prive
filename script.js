// Tafels Kampioen - oefenapp voor de maaltafels
// Voortgang wordt lokaal opgeslagen (localStorage, instant + werkt offline)
// EN gesynchroniseerd via Firebase Firestore, zodat ze meegaat tussen toestellen.
//
// De Firebase-SDK wordt bewust dynamisch (async) ingeladen in plaats van via
// een gewone top-level "import": als dat scriptbestand niet kan laden (geen
// internet, een ad-blocker die Google-scripts blokkeert, ...) mag dat de rest
// van de app nooit blokkeren. Alles hieronder werkt dus altijd offline; de
// cloud-sync licht enkel op zodra hij lukt.

const firebaseConfig = {
  apiKey: "AIzaSyC22Ov8NyHx5uBo2ItjueDdOGJ2N9hXcUA",
  authDomain: "maaltafelkampioen.firebaseapp.com",
  projectId: "maaltafelkampioen",
  storageBucket: "maaltafelkampioen.firebasestorage.app",
  messagingSenderId: "367824301510",
  appId: "1:367824301510:web:aa71010390926b4e6616c7",
};

// Alle toestellen delen precies dit ene document (zie Firestore security rules).
const SYNC_COLLECTION = "progress";
const SYNC_DOC_ID = "tafels-kampioen-familie";

let progressDocRef = null;
let cloudSetDoc = null;    // Firestore setDoc: volledige documentvervanging (enkel voor bootstrap/reset)
let cloudUpdateDoc = null; // Firestore updateDoc: wijzigt gericht enkel de opgegeven velden
// "pending" (nog aan het opstarten) -> "active" (werkt) of "failed" (geen internet /
// SDK niet bereikbaar / verbinding verbroken). De app werkt in alle drie de gevallen
// gewoon verder met localStorage.
let cloudSyncState = "pending";

async function initCloudSync() {
  try {
    const [{ initializeApp }, { getFirestore, doc, setDoc, updateDoc, onSnapshot }] = await Promise.all([
      import("https://www.gstatic.com/firebasejs/10.14.1/firebase-app.js"),
      import("https://www.gstatic.com/firebasejs/10.14.1/firebase-firestore.js"),
    ]);

    const firebaseApp = initializeApp(firebaseConfig);
    const firestoreDb = getFirestore(firebaseApp);
    progressDocRef = doc(firestoreDb, SYNC_COLLECTION, SYNC_DOC_ID);
    cloudSetDoc = setDoc;
    cloudUpdateDoc = updateDoc;

    onSnapshot(
      progressDocRef,
      (snap) => {
        cloudSyncState = "active";
        updateSyncStatusUI();
        if (snap.exists()) {
          state = mergeWithDefaults(snap.data());
          saveLocalState();
          if (!screens.home.classList.contains("hidden")) {
            renderHome();
          }
        } else {
          // Nog geen data in de cloud (eerste keer) -> start ermee op basis van lokale toestand.
          cloudSetDoc(progressDocRef, state).catch(() => {});
        }
      },
      (e) => {
        cloudSyncState = "failed";
        updateSyncStatusUI();
        console.warn("Cloud-sync verbroken, de app werkt verder met lokale opslag.", e);
      }
    );
  } catch (e) {
    cloudSyncState = "failed";
    console.warn("Cloud-sync kon niet opstarten, de app werkt verder enkel lokaal.", e);
    updateSyncStatusUI();
  }
}

// Volgorde waarin de tafels aangeleerd worden. Dit volgt de klassieke
// didactische opbouw: eerst de tafels die aansluiten bij dingen die het kind
// al kent (tellen in sprongen van 10, 5, 2), dan tafels die je kan afleiden
// door te verdubbelen (4, 6, 8) of door erbij/eraf te tellen t.o.v. een
// gekende tafel (9 = tafel van 10 min 1x, 7 = tafel van 5 + tafel van 2).
const LEARNING_ORDER = [1, 10, 5, 2, 4, 3, 6, 9, 7, 8];
const TABLES = [...LEARNING_ORDER].sort((a, b) => a - b); // voor het overzicht op het startscherm
const FACTORS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
const MASTERY_STREAK = 3; // aantal keer na elkaar goed voor een feit telt als "gekend"
const SESSION_LENGTH = 20; // max. aantal oefeningen per les (zoals bij Duolingo)
const TEST_LENGTH = 10; // de toets heeft exact 1 vraag per factor (1 t.e.m. 10)
const FAST_AVG_MS_PER_QUESTION = 6000; // gemiddeld max. 6 sec/vraag telt als "snel"
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

// Geeft bij een fout antwoord een korte theorie-herinnering voor precies dat
// rekenfeit, gebaseerd op dezelfde trucjes/verbanden als de les. Wordt gebruikt
// bij een foutje tijdens het oefenen én tijdens de toets.
function theoryHintFor(table, factor) {
  const correct = table * factor;
  if (table === 1) {
    return `1 × ${factor} = ${factor}, want keer 1 verandert niks!`;
  }
  const rel = RELATIONS[table];
  if (rel) {
    if (rel.type === "double") {
      return `${table} × ${factor} is het dubbele van ${rel.of} × ${factor}: ${rel.of} × ${factor} = ${rel.of * factor}, dus ${table} × ${factor} = ${rel.of * factor} + ${rel.of * factor} = ${correct}.`;
    }
    if (rel.type === "minusOne") {
      return `Trucje: ${table} × ${factor} = (${rel.of} × ${factor}) − ${factor} = ${rel.of * factor} − ${factor} = ${correct}.`;
    }
    if (rel.type === "sum") {
      const [a, b] = rel.of;
      return `${table} × ${factor} = (${a} × ${factor}) + (${b} × ${factor}) = ${a * factor} + ${b * factor} = ${correct}.`;
    }
  }
  if (TRICKS[table]) {
    return `${TRICKS[table]} Dus ${table} × ${factor} = ${correct}.`;
  }
  const groups = Array.from({ length: factor }, () => table).join(" + ");
  return `${table} × ${factor} betekent ${factor} groepjes van ${table}: ${groups} = ${correct}.`;
}

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
    readyForTest: {},  // tafel -> true zodra de toets afgelegd mag worden
    testBlocked: {},   // tafel -> true na een mislukte toets, tot een volledige les afgewerkt is
    points: 0,
    pointsPerLesson: 10,
    rewards: [
      { id: "r1", name: "15 minuten extra schermtijd", cost: 50 },
      { id: "r2", name: "Kiest het toetje", cost: 30 },
      { id: "r3", name: "Filmavond kiezen", cost: 100 },
    ],
  };
}

function mergeWithDefaults(parsed) {
  const fresh = defaultState();
  if (!parsed) return fresh;
  return {
    ...fresh,
    ...parsed,
    progress: { ...fresh.progress, ...(parsed.progress || {}) },
    taughtTables: { ...fresh.taughtTables, ...(parsed.taughtTables || {}) },
    readyForTest: { ...fresh.readyForTest, ...(parsed.readyForTest || {}) },
    testBlocked: { ...fresh.testBlocked, ...(parsed.testBlocked || {}) },
  };
}

function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return defaultState();
    return mergeWithDefaults(JSON.parse(raw));
  } catch (e) {
    return defaultState();
  }
}

function saveLocalState() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

// Bouwt een cloud-patch met dot-genoteerde veldpaden voor alle factoren van
// één tafel, bv. { "progress.5.1": 3, "progress.5.2": 0, ... }.
function progressPatchForTable(table) {
  const patch = {};
  FACTORS.forEach(f => { patch[`progress.${table}.${f}`] = state.progress[table][f]; });
  return patch;
}

// Kent de ingestelde punten toe voor een afgewerkte oefenles (niet voor een toets).
function awardLessonPoints() {
  const amount = state.pointsPerLesson || 0;
  if (amount <= 0) return;
  state.points += amount;
  saveState({ points: state.points });
}

// Een volledig afgewerkte oefenreeks (tot de sessiecap) telt als "een volledige
// les" en ontgrendelt een eerder mislukte toets weer.
function unlockTestBlock(table) {
  if (state.testBlocked[table]) {
    state.testBlocked[table] = false;
    saveState({ [`testBlocked.${table}`]: false });
  }
}

// `cloudPatch`: welke velden er dit keer naar de cloud moeten (dot-notatie),
// of "FULL" om het hele document te vervangen (enkel bij een volledige reset).
// Bewust GEEN volledige state bij elke save: als elk toestel altijd zijn volledige
// lokale kopie zou wegschrijven, overschrijft het per ongeluk wijzigingen die een
// ander toestel ondertussen maakte (bv. een naam die net op de laptop werd
// ingesteld, weer gewist door een oudere kopie vanaf de gsm).
function saveState(cloudPatch) {
  saveLocalState();
  if (!progressDocRef || !cloudPatch) return;

  if (cloudPatch === "FULL") {
    cloudSetDoc(progressDocRef, state).catch((e) => {
      console.warn("Kon voortgang niet naar de cloud sturen (lokaal wel bewaard).", e);
    });
    return;
  }

  cloudUpdateDoc(progressDocRef, cloudPatch).catch(() => {
    // Document bestaat wellicht nog niet (allereerste keer) -> initialiseren
    // met de volledige lokale toestand.
    cloudSetDoc(progressDocRef, state).catch((e) => {
      console.warn("Kon voortgang niet naar de cloud sturen (lokaal wel bewaard).", e);
    });
  });
}

let state = loadState();

function updateSyncStatusUI() {
  const el = document.getElementById("sync-status");
  if (!el) return;
  if (cloudSyncState === "active") {
    el.textContent = "☁️ Cloud-sync actief — voortgang wordt gedeeld tussen toestellen";
  } else if (cloudSyncState === "failed") {
    el.textContent = "📴 Geen cloud-verbinding — voortgang blijft wel lokaal op dit toestel bewaard";
  } else {
    el.textContent = "⏳ Cloud-sync wordt opgestart...";
  }
}

initCloudSync();

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
  sessionEnd: document.getElementById("screen-session-end"),
  celebrate: document.getElementById("screen-celebrate"),
  settings: document.getElementById("screen-settings"),
  test: document.getElementById("screen-test"),
  testResult: document.getElementById("screen-test-result"),
  rewards: document.getElementById("screen-rewards"),
};

function showScreen(name) {
  Object.values(screens).forEach(s => s.classList.add("hidden"));
  screens[name].classList.remove("hidden");
}

// ---------- Home screen ----------

function renderHome() {
  document.getElementById("player-name").textContent = state.name || "kampioen";
  document.getElementById("total-stars").textContent = `⭐ ${countStars()}`;
  document.getElementById("home-points-balance").textContent = state.points;

  const taught = !!state.taughtTables[state.currentTable];
  const readyForTest = !!state.readyForTest[state.currentTable] && !state.testBlocked[state.currentTable];
  const levelNumber = learningIndexOf(state.currentTable) + 1;
  const masteredCount = FACTORS.filter(f => isFactMastered(state.currentTable, f)).length;

  document.getElementById("level-number").textContent = levelNumber;
  document.getElementById("level-table").textContent = state.currentTable;
  document.getElementById("level-progress-inner").style.width = (masteredCount / FACTORS.length * 100) + "%";
  document.getElementById("level-progress-label").textContent = `${masteredCount}/${FACTORS.length} sommen gekend`;
  document.getElementById("level-status-taught").classList.toggle("hidden", !taught);
  document.getElementById("level-status-pending").classList.toggle("hidden", taught);
  document.getElementById("test-available-badge").classList.toggle("hidden", !readyForTest);

  if (!taught) {
    document.getElementById("start-btn-label").textContent = "📖 Leer deze tafel";
  } else if (readyForTest) {
    document.getElementById("start-btn-label").textContent = "📝 Doe de toets!";
  } else {
    document.getElementById("start-btn-label").textContent = "▶️ Nieuwe les";
  }

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
  } else if (table === state.currentTable && state.readyForTest[table] && !state.testBlocked[table]) {
    startTest(table);
  } else {
    startQuiz(table);
  }
}

document.getElementById("btn-start-adaptive").addEventListener("click", () => {
  handleTableTileClick(state.currentTable);
});

document.getElementById("btn-open-rewards").addEventListener("click", () => {
  renderRewardsScreen();
  showScreen("rewards");
});
document.getElementById("btn-rewards-back").addEventListener("click", () => {
  renderHome();
  showScreen("home");
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
  sessionCount: 0,    // aantal oefeningen deze les (max. SESSION_LENGTH)
  sessionCorrect: 0,
  sessionStartTime: 0,
  // Toets-specifieke velden (mode === "test"):
  testIndex: 0,
  testCorrectCount: 0,
};

function startQuiz(table) {
  quiz.mode = (table === state.currentTable) ? "adaptive" : "focused";
  quiz.targetTable = table;
  quiz.streak = 0;
  quiz.sessionCount = 0;
  quiz.sessionCorrect = 0;
  quiz.sessionStartTime = Date.now();
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
  updateSessionProgressBar();
  document.getElementById("quiz-streak").textContent = `🔥 ${quiz.streak}`;
  document.getElementById("session-progress").textContent = `Oefening ${quiz.sessionCount + 1}/${SESSION_LENGTH}`;
}

// De balk toont hoe ver we staan in déze les (0..SESSION_LENGTH oefeningen),
// zodat hij synchroon loopt met de "Oefening X/20"-tekst.
function updateSessionProgressBar() {
  const pct = Math.round((quiz.sessionCount / SESSION_LENGTH) * 100);
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
    feedbackEl.innerHTML = `Bijna! Het juiste antwoord is ${quiz.correctAnswer}.<span class="theory-hint">${theoryHintFor(table, factor)}</span>`;
    feedbackEl.className = "feedback wrong";
    mascotEl.textContent = "😊";
    mascotEl.className = "mascot sad";
  }
  document.getElementById("quiz-streak").textContent = `🔥 ${quiz.streak}`;
  quiz.sessionCount += 1;
  if (correct) quiz.sessionCorrect += 1;
  saveState({ [`progress.${table}.${factor}`]: state.progress[table][factor] });
  updateSessionProgressBar();

  // Als de toets net mislukt is, mag het bereiken van mastery halverwege een les
  // de blokkade niet meteen omzeilen: dan moet écht een volledige les (tot de
  // sessiecap) afgewerkt worden voor de toets weer vrijkomt.
  const nowMastered = quiz.mode === "adaptive" && table === quiz.targetTable
    && isTableMastered(table) && !state.testBlocked[table];
  const sessionDone = quiz.sessionCount >= SESSION_LENGTH;

  setTimeout(() => {
    if (nowMastered) {
      awardLessonPoints();
      unlockTestBlock(table);
      showReadyForTest(table);
    } else if (sessionDone) {
      // Let op: `table` is de tafel van de laatste vráág (kan een herhaling van
      // een andere tafel zijn); een eventuele toets-blokkade ontgrendelen doe je
      // voor de tafel waar déze les/sessie voor bedoeld was.
      awardLessonPoints();
      unlockTestBlock(quiz.targetTable);
      showSessionEnd();
    } else {
      nextQuestion();
    }
  }, correct ? 900 : 4000);
}

function showSessionEnd() {
  const total = quiz.sessionCount;
  const correctCount = quiz.sessionCorrect;
  const pct = Math.round((correctCount / total) * 100);

  let emoji, title;
  if (pct >= 90) { emoji = "🌟"; title = "Fantastische les!"; }
  else if (pct >= 70) { emoji = "👍"; title = "Goed gedaan!"; }
  else { emoji = "💪"; title = "Les afgerond!"; }
  const encouragement = pct >= 70 ? "Blijf zo verdergaan!" : "Oefening baart kunst, volgende keer lukt het nog beter!";

  document.getElementById("session-end-emoji").textContent = emoji;
  document.getElementById("session-end-title").textContent = title;
  document.getElementById("session-end-text").textContent =
    `Je hebt ${total} sommen geoefend, waarvan ${correctCount} juist (${pct}%). ${encouragement}`;

  // Alles juist én snel beantwoord? Dan mag het kind de toets proberen, in
  // plaats van te wachten tot elk feit apart 3x na elkaar goed beantwoord is.
  // Duurde het lang (ook al was alles juist), dan komt dit aanbod bewust niet:
  // dat wijst eerder op tellen/twijfelen dan op echte automatisering.
  const suggestionEl = document.getElementById("session-end-suggestion");
  const testBtn = document.getElementById("btn-session-test");
  const elapsedMs = Date.now() - (quiz.sessionStartTime || Date.now());
  const isFast = (elapsedMs / total) <= FAST_AVG_MS_PER_QUESTION;
  const canOfferTest = pct === 100 && isFast && quiz.mode === "adaptive" && !state.testBlocked[quiz.targetTable];

  suggestionEl.classList.toggle("hidden", !canOfferTest);
  testBtn.classList.toggle("hidden", !canOfferTest);
  if (canOfferTest) {
    suggestionEl.textContent = `Wow, alles juist en ook nog snel! 🌟 Wil je de toets van tafel ${quiz.targetTable} proberen?`;
    testBtn.textContent = "Ja, doe de toets! 📝";
  }

  showScreen("sessionEnd");
}

document.getElementById("btn-session-test").addEventListener("click", () => {
  startTest(quiz.targetTable);
});
document.getElementById("btn-session-new").addEventListener("click", () => {
  startQuiz(quiz.targetTable);
});
document.getElementById("btn-session-home").addEventListener("click", () => {
  renderHome();
  showScreen("home");
});

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
    saveState({ [`taughtTables.${lesson.table}`]: true });
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

// ---------- Toets vóór een tafel officieel "gekend" is ----------
// Klaar om te oefenen op basis van herhaling (3x na elkaar goed) of een snelle
// foutloze les betekent nog niet automatisch doorschuiven: eerst moet de toets
// (10 vragen, 1 per factor, alles juist) gehaald worden.

function showReadyForTest(table) {
  state.readyForTest[table] = true;
  saveState({ [`readyForTest.${table}`]: true });

  document.getElementById("celebrate-emoji").textContent = "📝";
  document.getElementById("celebrate-title").textContent = "Klaar voor de toets!";
  document.getElementById("celebrate-text").textContent =
    `Je kent alle sommen van tafel ${table} goed! Tijd om het te bewijzen met een toets.`;
  const continueBtn = document.getElementById("btn-celebrate-continue");
  continueBtn.textContent = "Start de toets! 📝";
  continueBtn.dataset.nextAction = "start-test";
  continueBtn.dataset.table = table;
  showScreen("celebrate");
}

document.getElementById("btn-celebrate-continue").addEventListener("click", () => {
  const continueBtn = document.getElementById("btn-celebrate-continue");
  const action = continueBtn.dataset.nextAction;
  if (action === "learn") {
    startLesson(state.currentTable);
  } else if (action === "start-test") {
    startTest(parseInt(continueBtn.dataset.table, 10));
  } else {
    renderHome();
    showScreen("home");
  }
});

function startTest(table) {
  quiz.mode = "test";
  quiz.targetTable = table;
  quiz.testIndex = 0;
  quiz.testCorrectCount = 0;
  showScreen("test");
  nextTestQuestion();
}

function nextTestQuestion() {
  const factor = FACTORS[quiz.testIndex]; // vaste volgorde 1 t.e.m. 10, geen herhaling
  quiz.factor = factor;
  quiz.correctAnswer = quiz.targetTable * factor;
  quiz.answer = "";
  quiz.locked = false;

  document.getElementById("test-question").textContent = `${quiz.targetTable} × ${factor} = ?`;
  document.getElementById("test-answer-display").textContent = " ";
  document.getElementById("test-feedback").innerHTML = "";
  document.getElementById("test-mascot").textContent = "🐸";
  document.getElementById("test-mascot").className = "mascot";
  document.getElementById("test-progress").textContent = `Vraag ${quiz.testIndex + 1}/${TEST_LENGTH}`;
  document.getElementById("test-progress-bar-inner").style.width = Math.round((quiz.testIndex / TEST_LENGTH) * 100) + "%";
}

document.getElementById("test-keypad").addEventListener("click", (e) => {
  const btn = e.target.closest("button");
  if (!btn || quiz.locked) return;
  const key = btn.dataset.key;

  if (key === "back") {
    quiz.answer = quiz.answer.slice(0, -1);
  } else if (key === "enter") {
    submitTestAnswer();
    return;
  } else {
    if (quiz.answer.length < 3) quiz.answer += key;
  }
  document.getElementById("test-answer-display").textContent = quiz.answer || " ";
});

function submitTestAnswer() {
  if (quiz.answer === "") return;
  const given = parseInt(quiz.answer, 10);
  const correct = given === quiz.correctAnswer;
  quiz.locked = true;

  const feedbackEl = document.getElementById("test-feedback");
  const mascotEl = document.getElementById("test-mascot");
  let delay;

  if (correct) {
    quiz.testCorrectCount += 1;
    feedbackEl.innerHTML = `<p class="feedback correct">${randomPraise()}</p>`;
    mascotEl.textContent = randomFrom(MASCOTS.happy);
    mascotEl.className = "mascot happy";
    delay = 900;
  } else {
    feedbackEl.innerHTML = `<p class="feedback wrong">Niet helemaal! Het juiste antwoord is ${quiz.correctAnswer}.</p><span class="theory-hint">${theoryHintFor(quiz.targetTable, quiz.factor)}</span>`;
    mascotEl.textContent = "😊";
    mascotEl.className = "mascot sad";
    delay = 4500; // langer, zodat de theorie ook echt gelezen kan worden
  }

  quiz.testIndex += 1;
  setTimeout(() => {
    if (quiz.testIndex >= TEST_LENGTH) {
      finishTest();
    } else {
      nextTestQuestion();
    }
  }, delay);
}

function finishTest() {
  const table = quiz.targetTable;
  if (quiz.testCorrectCount === TEST_LENGTH) {
    // Toets gehaald: nu pas telt de tafel als écht gekend.
    FACTORS.forEach(f => { state.progress[table][f] = MASTERY_STREAK; });
    saveState(progressPatchForTable(table));
    celebrateTableMastered(table);
  } else {
    state.testBlocked[table] = true;
    saveState({ [`testBlocked.${table}`]: true });
    document.getElementById("test-result-text").textContent =
      `Je had ${quiz.testCorrectCount} van de ${TEST_LENGTH} juist. Nog niet helemaal, maar bijna! Oefen eerst nog een volledige les, dan mag je de toets opnieuw proberen.`;
    showScreen("testResult");
  }
}

document.getElementById("btn-test-quit").addEventListener("click", () => {
  renderHome();
  showScreen("home");
});
document.getElementById("btn-test-result-home").addEventListener("click", () => {
  renderHome();
  showScreen("home");
});

// ---------- Celebration (na een gehaalde toets) ----------

function celebrateTableMastered(table) {
  const next = nextTableAfter(table);
  if (next !== null) {
    state.currentTable = next;
  }
  state.readyForTest[table] = false;
  saveState({
    ...(next !== null ? { currentTable: next } : {}),
    [`readyForTest.${table}`]: false,
  });

  document.getElementById("celebrate-emoji").textContent = "🎉";
  const celebrateText = document.getElementById("celebrate-text");
  const continueBtn = document.getElementById("btn-celebrate-continue");

  if (next === null) {
    document.getElementById("celebrate-title").textContent = "Kampioen!";
    celebrateText.textContent = `Je kent de tafel van ${table} helemaal! Je kent nu alle tafels! 🏆`;
    continueBtn.textContent = "Terug naar start";
    continueBtn.dataset.nextAction = "home";
  } else {
    document.getElementById("celebrate-title").textContent = "Knap gedaan!";
    celebrateText.textContent = `Je kent de tafel van ${table} helemaal!`;
    continueBtn.textContent = `Leer de tafel van ${next} ➡️`;
    continueBtn.dataset.nextAction = "learn";
  }
  showScreen("celebrate");
}

// ---------- Settings ----------

function escapeHtml(str) {
  const div = document.createElement("div");
  div.textContent = str;
  return div.innerHTML;
}

document.getElementById("btn-settings").addEventListener("click", () => {
  document.getElementById("input-name").value = state.name || "";
  document.getElementById("input-points-per-lesson").value = state.pointsPerLesson;
  renderSettingsRewardsList();
  updateSyncStatusUI();
  showScreen("settings");
});
document.getElementById("btn-settings-back").addEventListener("click", () => {
  state.name = document.getElementById("input-name").value.trim();
  saveState({ name: state.name });
  renderHome();
  showScreen("home");
});
document.getElementById("input-name").addEventListener("input", (e) => {
  // Enkel lokaal bewaren terwijl er getypt wordt (anders 1 cloud-schrijfactie per
  // letter); de definitieve naam wordt gesynct bij het verlaten van dit scherm.
  state.name = e.target.value.trim();
  saveLocalState();
});
document.getElementById("input-points-per-lesson").addEventListener("change", (e) => {
  const val = Math.max(0, parseInt(e.target.value, 10) || 0);
  state.pointsPerLesson = val;
  e.target.value = val;
  saveState({ pointsPerLesson: val });
});
document.getElementById("btn-reset").addEventListener("click", () => {
  if (confirm("Weet je zeker dat je alle voortgang wil wissen?")) {
    const name = state.name;
    state = defaultState();
    state.name = name;
    saveState("FULL");
    renderHome();
    showScreen("home");
  }
});

// ---------- Rewards beheren (in Instellingen) ----------

function renderSettingsRewardsList() {
  const container = document.getElementById("settings-rewards-list");
  container.innerHTML = "";
  state.rewards.forEach(r => {
    const row = document.createElement("div");
    row.className = "reward-manage-row";
    row.innerHTML = `
      <input type="text" class="reward-edit-name" data-id="${r.id}" value="${escapeHtml(r.name)}" maxlength="40">
      <input type="number" class="reward-edit-cost" data-id="${r.id}" value="${r.cost}" min="1" max="10000">
      <button class="reward-delete-btn" data-id="${r.id}" aria-label="Verwijderen">🗑️</button>
    `;
    container.appendChild(row);
  });
}

document.getElementById("settings-rewards-list").addEventListener("change", (e) => {
  const id = e.target.dataset.id;
  if (!id) return;
  const reward = state.rewards.find(r => r.id === id);
  if (!reward) return;
  if (e.target.classList.contains("reward-edit-name")) {
    reward.name = e.target.value.trim() || reward.name;
    e.target.value = reward.name;
  }
  if (e.target.classList.contains("reward-edit-cost")) {
    reward.cost = Math.max(1, parseInt(e.target.value, 10) || 1);
    e.target.value = reward.cost;
  }
  saveState({ rewards: state.rewards });
});

document.getElementById("settings-rewards-list").addEventListener("click", (e) => {
  const btn = e.target.closest(".reward-delete-btn");
  if (!btn) return;
  state.rewards = state.rewards.filter(r => r.id !== btn.dataset.id);
  saveState({ rewards: state.rewards });
  renderSettingsRewardsList();
});

document.getElementById("btn-add-reward").addEventListener("click", () => {
  const nameInput = document.getElementById("new-reward-name");
  const costInput = document.getElementById("new-reward-cost");
  const name = nameInput.value.trim();
  const cost = parseInt(costInput.value, 10);
  if (!name || !cost || cost <= 0) return;

  state.rewards.push({ id: "r" + Date.now() + Math.floor(Math.random() * 1000), name, cost });
  saveState({ rewards: state.rewards });
  nameInput.value = "";
  costInput.value = "";
  renderSettingsRewardsList();
});

// ---------- Rewards inwisselen ----------

function renderRewardsScreen() {
  document.getElementById("rewards-points-balance").textContent = state.points;
  document.getElementById("reward-redeemed-msg").classList.add("hidden");

  const list = document.getElementById("rewards-list");
  list.innerHTML = "";
  if (state.rewards.length === 0) {
    list.innerHTML = `<p class="hint">Nog geen rewards ingesteld. Vraag een ouder om er een toe te voegen bij Instellingen!</p>`;
    return;
  }
  state.rewards.forEach(r => {
    const canAfford = state.points >= r.cost;
    const card = document.createElement("div");
    card.className = "reward-card";
    card.innerHTML = `
      <div>
        <div class="reward-name">${escapeHtml(r.name)}</div>
        <div class="reward-cost">⭐ ${r.cost} punten</div>
      </div>
      <button class="reward-redeem-btn" data-id="${r.id}" ${canAfford ? "" : "disabled"}>Inwisselen</button>
    `;
    list.appendChild(card);
  });
}

document.getElementById("rewards-list").addEventListener("click", (e) => {
  const btn = e.target.closest(".reward-redeem-btn");
  if (!btn || btn.disabled) return;
  const reward = state.rewards.find(r => r.id === btn.dataset.id);
  if (!reward || state.points < reward.cost) return;
  if (!confirm(`"${reward.name}" inwisselen voor ${reward.cost} punten?`)) return;

  state.points -= reward.cost;
  saveState({ points: state.points });
  renderRewardsScreen();

  const msg = document.getElementById("reward-redeemed-msg");
  msg.textContent = `🎉 "${reward.name}" ingewisseld!`;
  msg.classList.remove("hidden");
  setTimeout(() => msg.classList.add("hidden"), 3000);
});

// ---------- Init ----------

renderHome();
showScreen("home");
