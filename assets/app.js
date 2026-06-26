const api = async (action, payload = null) => {
  const options = payload
    ? {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      }
    : {};
  const response = await fetch(`api.php?action=${action}`, options);
  const data = await response.json();
  if (!data.ok) {
    throw new Error(data.error || "Något gick fel.");
  }
  return data;
};

const upperCategories = [
  ["ones", "Ettor", "Alla ettor", 1],
  ["twos", "Tvåor", "Alla tvåor", 2],
  ["threes", "Treor", "Alla treor", 3],
  ["fours", "Fyror", "Alla fyror", 4],
  ["fives", "Femmor", "Alla femmor", 5],
  ["sixes", "Sexor", "Alla sexor", 6],
].map(([id, name, hint, face]) => ({ id, name, hint, section: "upper", type: "upper", face }));

const baseLower = [
  { id: "pair", name: "Par", hint: "Högsta par", type: "pair" },
  { id: "twoPairs", name: "Två par", hint: "Två olika par", type: "nPairs", pairs: 2 },
  { id: "threeKind", name: "Triss", hint: "Tre lika", type: "kind", count: 3 },
  { id: "fourKind", name: "Fyrtal", hint: "Fyra lika", type: "kind", count: 4 },
  { id: "smallStraight", name: "Liten stege", hint: "1-2-3-4-5", type: "straight", faces: [1, 2, 3, 4, 5], score: 15 },
  { id: "largeStraight", name: "Stor stege", hint: "2-3-4-5-6", type: "straight", faces: [2, 3, 4, 5, 6], score: 20 },
  { id: "fullHouse", name: "Kåk", hint: "Triss + par", type: "combo", groups: [3, 2] },
  { id: "chance", name: "Chans", hint: "Summan av alla tärningar", type: "chance" },
  { id: "yatzy", name: "Yatzy", hint: "Fem lika", type: "yatzy", count: 5, score: 50 },
];

const maxiLower = [
  { id: "pair", name: "Par", hint: "Högsta par", type: "pair" },
  { id: "twoPairs", name: "Två par", hint: "Två olika par", type: "nPairs", pairs: 2 },
  { id: "threePairs", name: "Tre par", hint: "Tre olika par", type: "nPairs", pairs: 3 },
  { id: "threeKind", name: "Triss", hint: "Tre lika", type: "kind", count: 3 },
  { id: "fourKind", name: "Fyrtal", hint: "Fyra lika", type: "kind", count: 4 },
  { id: "fiveKind", name: "Femtal", hint: "Fem lika", type: "kind", count: 5 },
  { id: "smallStraight", name: "Liten stege", hint: "1-2-3-4-5", type: "straight", faces: [1, 2, 3, 4, 5], score: 15 },
  { id: "largeStraight", name: "Stor stege", hint: "2-3-4-5-6", type: "straight", faces: [2, 3, 4, 5, 6], score: 20 },
  { id: "fullStraight", name: "Full stege", hint: "1-2-3-4-5-6", type: "straight", faces: [1, 2, 3, 4, 5, 6], score: 21 },
  { id: "fullHouse", name: "Kåk", hint: "Triss + par", type: "combo", groups: [3, 2] },
  { id: "house", name: "Hus", hint: "Två trissar", type: "combo", groups: [3, 3] },
  { id: "tower", name: "Torn", hint: "Fyrtal + par", type: "combo", groups: [4, 2] },
  { id: "chance", name: "Chans", hint: "Summan av alla tärningar", type: "chance" },
  { id: "maxiYatzy", name: "Maxi-Yatzy", hint: "Sex lika", type: "yatzy", count: 6, score: 100 },
];

const makeCategories = (lower) => ({
  upper: upperCategories.map((category) => ({ ...category })),
  lower: lower.map((category) => ({ ...category, section: "lower" })),
});

const ruleVariants = {
  classic: {
    id: "classic",
    name: "Standard",
    maxRolls: 3,
    details: ["Max 3 slag per tur", "Vanlig bonusgräns för valt läge"],
  },
  oneRollZeroBonus: {
    id: "oneRollZeroBonus",
    name: "Charlies regler",
    maxRolls: 1,
    zeroUpperBonus: true,
    details: ["Bara 1 slag per tur", "Det du slår gäller", "Samma valör kan räknas som flera par", "Bonus endast om hela övre avdelningen slutar på 0"],
  },
  rollPot: {
    id: "rollPot",
    name: "Två slag: pott",
    maxRolls: 2,
    rollPot: true,
    details: ["Max 2 slag per tur", "Stannar du efter 1 slag läggs 1 slag i potten", "Pott måste vara 0 vid slutet, annars -50 poäng"],
  },
  sprint: {
    id: "sprint",
    name: "Sprint",
    maxRolls: 2,
    details: ["Max 2 slag per tur", "I övrigt vanliga poäng för valt läge"],
  },
};

function buildRuleset(
  variantId = elements.rulesetSelect?.value || "classic",
  maxi = elements.maxiModeInput?.checked || false,
  straight = elements.straightModeInput?.checked || false,
) {
  const variant = ruleVariants[variantId] || ruleVariants.classic;
  const mode = maxi
    ? {
        id: "maxi",
        name: "Maxi-Yatzy",
        diceCount: 6,
        bonusThreshold: 84,
        bonusValue: 100,
        categories: makeCategories(maxiLower),
        yatzyName: "Maxi-Yatzy",
      }
    : {
        id: "yatzy",
        name: "Yatzy",
        diceCount: 5,
        bonusThreshold: 63,
        bonusValue: 50,
        categories: makeCategories(baseLower),
        yatzyName: "Yatzy",
      };

  return {
    ...mode,
    ...variant,
    id: `${variant.id}-${mode.id}${straight ? "-straight" : ""}`,
    variantId: variant.id,
    modeId: mode.id,
    straight,
    rollPot: variant.id === "rollPot",
    forcedOrder: straight,
    name: `${variant.id === "classic" ? mode.name : `${variant.name} (${mode.name})`}${straight ? " Rak" : ""}`,
    bonusThreshold: variant.zeroUpperBonus ? 0 : mode.bonusThreshold,
    bonusValue: mode.bonusValue,
    categories: mode.categories,
    details: [
      `${mode.diceCount} tärningar`,
      `Bonus ${mode.bonusValue} poäng ${variant.zeroUpperBonus ? "om hela övre avdelningen är 0" : `vid minst ${mode.bonusThreshold} i övre avdelningen`}`,
      ...variant.details,
      ...(straight ? ["Rak spelomgång: kategorierna fylls uppifrån och ned"] : []),
    ],
  };
}

const elements = {
  startPanel: document.querySelector("#startPanel"),
  setupPanel: document.querySelector("#setupPanel"),
  statsPanel: document.querySelector("#statsPanel"),
  gamePanel: document.querySelector("#gamePanel"),
  openAuthButton: document.querySelector("#openAuthButton"),
  authDialog: document.querySelector("#authDialog"),
  loginView: document.querySelector("#loginView"),
  registerView: document.querySelector("#registerView"),
  authMessage: document.querySelector("#authMessage"),
  loginButton: document.querySelector("#loginButton"),
  registerButton: document.querySelector("#registerButton"),
  showRegisterButton: document.querySelector("#showRegisterButton"),
  showLoginButton: document.querySelector("#showLoginButton"),
  logoutButton: document.querySelector("#logoutButton"),
  loginUsername: document.querySelector("#loginUsername"),
  loginPassword: document.querySelector("#loginPassword"),
  registerUsername: document.querySelector("#registerUsername"),
  registerPassword: document.querySelector("#registerPassword"),
  signedInLabel: document.querySelector("#signedInLabel"),
  newGameButton: document.querySelector("#newGameButton"),
  cancelSetupButton: document.querySelector("#cancelSetupButton"),
  playersInput: document.querySelector("#playersInput"),
  rulesetSelect: document.querySelector("#rulesetSelect"),
  maxiModeInput: document.querySelector("#maxiModeInput"),
  straightModeInput: document.querySelector("#straightModeInput"),
  rulesetDetails: document.querySelector("#rulesetDetails"),
  startGameButton: document.querySelector("#startGameButton"),
  gameHomeButton: document.querySelector("#gameHomeButton"),
  gameNewButton: document.querySelector("#gameNewButton"),
  endGameButton: document.querySelector("#endGameButton"),
  statSummary: document.querySelector("#statSummary"),
  recentGames: document.querySelector("#recentGames"),
  gameRulesetLabel: document.querySelector("#gameRulesetLabel"),
  gameTitle: document.querySelector("#gameTitle"),
  totalScoreLabel: document.querySelector("#totalScoreLabel"),
  playerTabs: document.querySelector("#playerTabs"),
  diceSlots: document.querySelector("#diceSlots"),
  diceButtons: document.querySelector("#diceButtons"),
  undoDieButton: document.querySelector("#undoDieButton"),
  clearDiceButton: document.querySelector("#clearDiceButton"),
  randomDiceButton: document.querySelector("#randomDiceButton"),
  nextRollButton: document.querySelector("#nextRollButton"),
  usePotButton: document.querySelector("#usePotButton"),
  rollCountLabel: document.querySelector("#rollCountLabel"),
  diceHelper: document.querySelector("#diceHelper"),
  potMeter: document.querySelector("#potMeter"),
  potValue: document.querySelector("#potValue"),
  scoreboard: document.querySelector("#scoreboard"),
  toast: document.querySelector("#toast"),
};

const state = {
  user: null,
  game: null,
  dice: [],
  lockedDice: [],
  rollCount: 0,
  potRollsUsedThisTurn: 0,
  activePlayerIndex: 0,
};

const pipMap = {
  1: [4],
  2: [0, 8],
  3: [0, 4, 8],
  4: [0, 2, 6, 8],
  5: [0, 2, 4, 6, 8],
  6: [0, 2, 3, 5, 6, 8],
};

function allCategories(ruleset) {
  return [...ruleset.categories.upper, ...ruleset.categories.lower];
}

function currentRuleset() {
  if (state.game) {
    return buildRuleset(state.game.variantId || "classic", Boolean(state.game.maxi), Boolean(state.game.straight));
  }
  return buildRuleset();
}

function activePlayer() {
  return state.game?.players[state.activePlayerIndex] ?? null;
}

function makePlayer(name, index) {
  return {
    id: `${Date.now()}-${index}-${Math.random().toString(16).slice(2)}`,
    name,
    scores: {},
    turns: {},
    pot: 0,
  };
}

function playerNamesFromInput() {
  const names = elements.playersInput.value
    .split(/\r?\n|,/)
    .map((name) => name.trim())
    .filter(Boolean);
  if (names.length > 0) {
    return names;
  }
  return [state.user?.username || "Spelare 1"];
}

function countsFor(dice) {
  return [0, 1, 2, 3, 4, 5, 6].map((face) => dice.filter((die) => die === face).length);
}

function diceSum(dice) {
  return dice.reduce((sum, die) => sum + die, 0);
}

function matchingFaces(counts, needed) {
  const faces = [];
  for (let face = 6; face >= 1; face -= 1) {
    if (counts[face] >= needed) {
      faces.push(face);
    }
  }
  return faces;
}

function scoreCategory(category, dice, ruleset = currentRuleset()) {
  const counts = countsFor(dice);
  if (category.type === "upper") {
    return counts[category.face] * category.face;
  }
  if (category.type === "pair") {
    const [face] = matchingFaces(counts, 2);
    return face ? face * 2 : 0;
  }
  if (category.type === "nPairs") {
    if (ruleset.variantId === "oneRollZeroBonus") {
      const faces = [];
      for (let face = 6; face >= 1; face -= 1) {
        const pairCount = Math.floor(counts[face] / 2);
        for (let index = 0; index < pairCount && faces.length < category.pairs; index += 1) {
          faces.push(face);
        }
      }
      return faces.length === category.pairs ? faces.reduce((sum, face) => sum + face * 2, 0) : 0;
    }
    const faces = matchingFaces(counts, 2).slice(0, category.pairs);
    return faces.length === category.pairs ? faces.reduce((sum, face) => sum + face * 2, 0) : 0;
  }
  if (category.type === "kind") {
    const [face] = matchingFaces(counts, category.count);
    return face ? face * category.count : 0;
  }
  if (category.type === "straight") {
    return category.faces.every((face) => counts[face] > 0) ? category.score : 0;
  }
  if (category.type === "combo") {
    const pool = counts.slice();
    const picked = [];
    const usedFaces = new Set();
    for (const needed of [...category.groups].sort((a, b) => b - a)) {
      let found = 0;
      for (let face = 6; face >= 1; face -= 1) {
        const canReuseFace = ruleset.variantId === "oneRollZeroBonus";
        if (pool[face] >= needed && (canReuseFace || !usedFaces.has(face))) {
          found = face;
          break;
        }
      }
      if (!found) {
        return 0;
      }
      pool[found] -= needed;
      usedFaces.add(found);
      picked.push(found * needed);
    }
    return picked.reduce((sum, value) => sum + value, 0);
  }
  if (category.type === "chance") {
    return diceSum(dice);
  }
  if (category.type === "yatzy") {
    return matchingFaces(counts, category.count).length > 0 ? category.score : 0;
  }
  return 0;
}

function calculateTotals(player = activePlayer(), game = state.game) {
  const ruleset = buildRuleset(game.variantId || "classic", Boolean(game.maxi), Boolean(game.straight));
  const upperTotal = ruleset.categories.upper.reduce((sum, category) => sum + (player.scores[category.id] ?? 0), 0);
  const lowerTotal = ruleset.categories.lower.reduce((sum, category) => sum + (player.scores[category.id] ?? 0), 0);
  const upperComplete = ruleset.categories.upper.every((category) => category.id in player.scores);
  const allComplete = allCategories(ruleset).every((category) => category.id in player.scores);
  let bonus = 0;
  if (upperComplete) {
    bonus = ruleset.zeroUpperBonus
      ? (upperTotal === 0 ? ruleset.bonusValue : 0)
      : (upperTotal >= ruleset.bonusThreshold ? ruleset.bonusValue : 0);
  }
  const penalty = allComplete && ruleset.rollPot && player.pot !== 0 ? -50 : 0;
  const rawTotal = upperTotal + lowerTotal + bonus + penalty;
  return { upperTotal, lowerTotal, bonus, penalty, total: Math.max(0, rawTotal), allComplete };
}

function gameIsComplete() {
  return state.game.players.every((player) => calculateTotals(player).allComplete);
}

function rankedPlayers() {
  return [...state.game.players]
    .map((player) => ({ player, totals: calculateTotals(player) }))
    .sort((a, b) => b.totals.total - a.totals.total);
}

function moveToNextOpenPlayer() {
  if (!state.game || gameIsComplete()) {
    return;
  }
  const playerCount = state.game.players.length;
  for (let offset = 1; offset <= playerCount; offset += 1) {
    const nextIndex = (state.activePlayerIndex + offset) % playerCount;
    if (!calculateTotals(state.game.players[nextIndex]).allComplete) {
      state.activePlayerIndex = nextIndex;
      return;
    }
  }
}

function makeDie(value) {
  const wrapper = document.createElement("span");
  wrapper.className = "die-face";
  for (let index = 0; index < 9; index += 1) {
    const pip = document.createElement("span");
    pip.className = `pip ${pipMap[value]?.includes(index) ? "on" : ""}`;
    wrapper.append(pip);
  }
  return wrapper;
}

function toast(message) {
  elements.toast.textContent = message;
  elements.toast.classList.add("visible");
  window.setTimeout(() => elements.toast.classList.remove("visible"), 2600);
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function renderRulesetSelect() {
  elements.rulesetSelect.innerHTML = Object.values(ruleVariants)
    .map((variant) => `<option value="${variant.id}">${variant.name}</option>`)
    .join("");
  renderRulesetDetails();
}

function renderRulesetDetails() {
  const ruleset = buildRuleset();
  elements.rulesetDetails.innerHTML = ruleset.details.map((detail) => `<div>${detail}</div>`).join("");
}

function renderUser() {
  elements.signedInLabel.textContent = state.user ? `Inloggad som ${state.user.username}` : "Spela utan konto";
  elements.openAuthButton.title = state.user ? "Konto" : "Logga in";
  if (!state.game && elements.setupPanel.hidden) {
    elements.statsPanel.hidden = !state.user;
  }
}

function showAuthView(view) {
  elements.authMessage.textContent = "";
  const showRegister = view === "register";
  elements.loginView.hidden = showRegister;
  elements.registerView.hidden = !showRegister;
  window.setTimeout(() => {
    const input = showRegister ? elements.registerUsername : elements.loginUsername;
    input?.focus();
  }, 0);
}

function openAuthDialog() {
  showAuthView("login");
  elements.authDialog.showModal();
}

function showHomeView() {
  state.game = null;
  state.dice = [];
  state.lockedDice = [];
  state.rollCount = 0;
  state.potRollsUsedThisTurn = 0;
  state.activePlayerIndex = 0;
  elements.startPanel.hidden = false;
  elements.setupPanel.hidden = true;
  elements.gamePanel.hidden = true;
  elements.statsPanel.hidden = !state.user;
}

function showSetupView() {
  elements.startPanel.hidden = true;
  elements.setupPanel.hidden = false;
  elements.gamePanel.hidden = true;
  elements.statsPanel.hidden = true;
  if (!elements.playersInput.value.trim()) {
    elements.playersInput.value = state.user?.username || "";
  }
  elements.playersInput.focus();
}

function showGameView() {
  elements.startPanel.hidden = true;
  elements.setupPanel.hidden = true;
  elements.statsPanel.hidden = true;
  elements.gamePanel.hidden = false;
}

function confirmLeaveGame() {
  return !state.game || state.game.finished || window.confirm("Pågående spel sparas inte. Vill du fortsätta?");
}

function leaveGameToHome() {
  if (!confirmLeaveGame()) {
    return;
  }
  showHomeView();
}

function leaveGameToSetup() {
  if (!confirmLeaveGame()) {
    return;
  }
  state.game = null;
  state.dice = [];
  state.lockedDice = [];
  state.rollCount = 0;
  state.potRollsUsedThisTurn = 0;
  state.activePlayerIndex = 0;
  showSetupView();
}

function renderStats(summary, recent) {
  if (!summary) {
    elements.statSummary.innerHTML = "";
    elements.recentGames.innerHTML = "";
    return;
  }
  elements.statSummary.innerHTML = [
    ["Spel", summary.games],
    ["Bästa", summary.best],
    ["Snitt", summary.average],
  ]
    .map(([label, value]) => `<div class="stat"><span>${label}</span><strong>${value}</strong></div>`)
    .join("");

  elements.recentGames.innerHTML = recent.length
    ? recent
        .map((game) => {
          const date = new Date(game.finishedAt).toLocaleDateString("sv-SE", {
            month: "short",
            day: "numeric",
            hour: "2-digit",
            minute: "2-digit",
          });
          const winnerName = game.winner?.name || game.playerName || "Vinnare";
          const winnerTotal = game.winner?.total ?? game.total ?? 0;
          const playerCount = Array.isArray(game.players) ? game.players.length : 1;
          return `<div class="recent-game"><div><strong>${escapeHtml(game.rulesetName)}</strong><div class="score-preview">${date} · ${playerCount} spelare · ${escapeHtml(winnerName)}</div></div><strong>${winnerTotal}</strong></div>`;
        })
        .join("")
    : '<p class="helper">Inga sparade spel ännu.</p>';
}

async function refreshStats() {
  const data = await api("stats");
  renderStats(data.summary, data.recent);
}

async function refreshSession() {
  const data = await api("me");
  state.user = data.user;
  renderUser();
  if (state.user) {
    await refreshStats();
  }
}

function startGame() {
  const ruleset = buildRuleset();
  const players = playerNamesFromInput().map(makePlayer);
  state.game = {
    rulesetId: ruleset.id,
    variantId: ruleset.variantId,
    maxi: ruleset.modeId === "maxi",
    straight: ruleset.straight,
    players,
    startedAt: new Date().toISOString(),
    finished: false,
  };
  state.dice = [];
  state.lockedDice = [];
  state.rollCount = 0;
  state.potRollsUsedThisTurn = 0;
  state.activePlayerIndex = 0;
  showGameView();
  elements.gameRulesetLabel.textContent = ruleset.name;
  elements.gameTitle.textContent = `${players.length} spelare`;
  renderGame();
  elements.gamePanel.scrollIntoView({ behavior: "smooth", block: "start" });
}

function nextRequiredCategoryId() {
  const ruleset = currentRuleset();
  const player = activePlayer();
  return allCategories(ruleset).find((category) => !(category.id in player.scores))?.id ?? null;
}

function canScore(category) {
  const player = activePlayer();
  if (!state.game || !player || category.id in player.scores || state.rollCount < 1 || state.game.finished) {
    return false;
  }
  const ruleset = currentRuleset();
  if (state.dice.length !== ruleset.diceCount) {
    return false;
  }
  if (ruleset.forcedOrder) {
    if (category.type === "yatzy" && scoreCategory(category, state.dice, ruleset) > 0) {
      return true;
    }
    return category.id === nextRequiredCategoryId();
  }
  return true;
}

function recordScore(category) {
  if (!canScore(category)) {
    return;
  }
  const ruleset = currentRuleset();
  const player = activePlayer();
  const value = scoreCategory(category, state.dice, ruleset);
  player.scores[category.id] = value;
  player.turns[category.id] = {
    dice: [...state.dice],
    rolls: state.rollCount,
    usedPot: state.potRollsUsedThisTurn > 0,
    potRollsUsed: state.potRollsUsedThisTurn,
  };
  if (ruleset.rollPot && state.rollCount === 1 && state.potRollsUsedThisTurn === 0) {
    player.pot += 1;
  }
  state.dice = [];
  state.lockedDice = [];
  state.rollCount = 0;
  state.potRollsUsedThisTurn = 0;
  moveToNextOpenPlayer();
  renderGame();
  if (gameIsComplete()) {
    finishGame();
  }
}

async function finishGame() {
  state.game.finished = true;
  const standings = rankedPlayers();
  const winner = standings[0];
  elements.totalScoreLabel.textContent = `${winner.player.name} ${winner.totals.total}`;
  renderGame();
  if (!state.user) {
    toast("Spelet är klart. Logga in nästa gång om du vill spara statistik.");
    return;
  }
  const ruleset = currentRuleset();
  try {
    await api("save_game", {
      ...state.game,
      rulesetName: ruleset.name,
      winner: {
        playerId: winner.player.id,
        name: winner.player.name,
        total: winner.totals.total,
      },
      players: state.game.players.map((player) => ({
        ...player,
        totals: calculateTotals(player),
      })),
      total: winner.totals.total,
    });
    toast("Spelet sparades i statistiken.");
    await refreshStats();
  } catch (error) {
    toast(error.message);
  }
}

function addDie(value) {
  if (state.game.finished) {
    return;
  }
  const ruleset = currentRuleset();
  if (state.dice.length >= ruleset.diceCount) {
    return;
  }
  if (state.rollCount === 0) {
    state.rollCount = 1;
  }
  state.dice.push(value);
  state.lockedDice.push(false);
  renderGame();
}

function clearDice() {
  if (state.game?.finished) {
    return;
  }
  state.dice = [];
  state.lockedDice = [];
  renderGame();
}

function undoDie() {
  if (state.game?.finished) {
    return;
  }
  state.dice.pop();
  state.lockedDice.pop();
  renderGame();
}

function canSpendNextRoll(ruleset, player) {
  return state.rollCount < ruleset.maxRolls || (ruleset.rollPot && state.rollCount >= ruleset.maxRolls && player?.pot > 0);
}

function spendNextRoll(ruleset, player) {
  if (state.rollCount < ruleset.maxRolls) {
    state.rollCount += 1;
    return true;
  }
  if (ruleset.rollPot && player?.pot > 0) {
    player.pot -= 1;
    state.potRollsUsedThisTurn += 1;
    state.rollCount += 1;
    return true;
  }
  return false;
}

function randomDice() {
  if (state.game.finished) {
    return;
  }
  const ruleset = currentRuleset();
  const player = activePlayer();
  if (!spendNextRoll(ruleset, player)) {
    return;
  }
  const nextDice = [];
  const nextLocked = [];
  for (let index = 0; index < ruleset.diceCount; index += 1) {
    const locked = Boolean(state.lockedDice[index] && state.dice[index]);
    nextDice[index] = locked ? state.dice[index] : Math.floor(Math.random() * 6) + 1;
    nextLocked[index] = locked;
  }
  state.dice = nextDice;
  state.lockedDice = nextLocked;
  renderGame();
}

function nextRoll() {
  if (state.game.finished) {
    return;
  }
  const ruleset = currentRuleset();
  const player = activePlayer();
  if (!spendNextRoll(ruleset, player)) {
    return;
  }
  state.dice = [];
  state.lockedDice = [];
  renderGame();
}

function usePotRoll() {
  const ruleset = currentRuleset();
  const player = activePlayer();
  if (!state.game || !ruleset.rollPot || !player || player.pot <= 0 || state.rollCount < ruleset.maxRolls) {
    return;
  }
  spendNextRoll(ruleset, player);
  state.dice = [];
  state.lockedDice = [];
  renderGame();
}

function toggleDieLock(index) {
  if (state.game?.finished || !state.dice[index]) {
    return;
  }
  state.lockedDice[index] = !state.lockedDice[index];
  renderGame();
}

function renderDice() {
  const ruleset = currentRuleset();
  const player = activePlayer();
  const allowedRolls = ruleset.maxRolls + state.potRollsUsedThisTurn + (ruleset.rollPot ? player?.pot ?? 0 : 0);
  const hasPotRollsThisTurn = state.potRollsUsedThisTurn > 0;
  elements.diceSlots.innerHTML = "";
  for (let index = 0; index < ruleset.diceCount; index += 1) {
    const slot = document.createElement("button");
    const value = state.dice[index];
    const locked = Boolean(value && state.lockedDice[index]);
    slot.className = `die-slot ${value ? "" : "empty"} ${locked ? "held" : ""}`;
    slot.type = "button";
    slot.disabled = !value || state.game.finished;
    slot.title = value ? (locked ? "Lås upp tärning" : "Lås tärning") : "Tom tärningsplats";
    slot.setAttribute("aria-pressed", String(locked));
    slot.addEventListener("click", () => toggleDieLock(index));
    slot.append(value ? makeDie(value) : document.createTextNode("-"));
    elements.diceSlots.append(slot);
  }

  elements.diceButtons.innerHTML = "";
  for (let value = 1; value <= 6; value += 1) {
    const button = document.createElement("button");
    button.className = "die-button";
    button.type = "button";
    button.title = `Lägg till ${value}`;
    button.append(makeDie(value));
    button.addEventListener("click", () => addDie(value));
    button.disabled = state.dice.length >= ruleset.diceCount || calculateTotals(player).allComplete || state.game.finished;
    elements.diceButtons.append(button);
  }

  elements.rollCountLabel.textContent = `Slag ${state.rollCount}/${allowedRolls}${hasPotRollsThisTurn ? " + pott" : ""}`;
  elements.nextRollButton.disabled = !canSpendNextRoll(ruleset, player) || state.rollCount < 1 || state.game.finished;
  elements.randomDiceButton.disabled = !canSpendNextRoll(ruleset, player) || state.game.finished;
  elements.usePotButton.hidden = !ruleset.rollPot;
  elements.usePotButton.disabled =
    !player ||
    player.pot <= 0 ||
    state.rollCount < ruleset.maxRolls ||
    state.game.finished;
  elements.potMeter.hidden = !ruleset.rollPot;
  elements.potValue.textContent = player?.pot ?? 0;
  elements.diceHelper.textContent =
    state.rollCount < 1
      ? "Klicka in tärningarnas värde. Poängen räknas automatiskt på scorekortet."
      : state.dice.length === ruleset.diceCount
        ? "När slaget är klart kan du fylla en rad eller slå vidare om du har slag kvar."
        : `Fyll i ${ruleset.diceCount - state.dice.length} tärning${ruleset.diceCount - state.dice.length === 1 ? "" : "ar"} till innan du väljer rad.`;
}

function renderScoreboard() {
  const ruleset = currentRuleset();
  elements.scoreboard.innerHTML = "";

  const wrapper = document.createElement("div");
  wrapper.className = "protocol-wrap";
  const table = document.createElement("table");
  table.className = "protocol-table";

  const thead = document.createElement("thead");
  const headerRow = document.createElement("tr");
  const categoryHeader = document.createElement("th");
  categoryHeader.className = "category-col";
  categoryHeader.scope = "col";
  categoryHeader.textContent = "Kategori";
  headerRow.append(categoryHeader);

  state.game.players.forEach((player, index) => {
    const th = document.createElement("th");
    th.scope = "col";
    th.className = `player-col ${index === state.activePlayerIndex ? "active-player" : ""}`;
    const totals = calculateTotals(player);
    th.innerHTML = `<div class="player-head"><strong>${escapeHtml(player.name)}</strong><span>${totals.total} p</span></div>`;
    headerRow.append(th);
  });
  thead.append(headerRow);
  table.append(thead);

  const tbody = document.createElement("tbody");
  appendProtocolSection(tbody, "Övre avdelningen", ruleset.categories.upper);
  appendSummaryRow(tbody, "Sum", (player) => calculateTotals(player).upperTotal);
  appendSummaryRow(tbody, "Bonus", (player) => calculateTotals(player).bonus);
  appendProtocolSection(tbody, "Nedre avdelningen", ruleset.categories.lower);
  if (ruleset.rollPot) {
    appendSummaryRow(tbody, "Pott", (player) => player.pot);
    appendSummaryRow(tbody, "Pottstraff", (player) => calculateTotals(player).penalty, "penalty-row");
  }
  appendSummaryRow(tbody, "Totalsum", (player) => calculateTotals(player).total, "total-row");
  table.append(tbody);

  wrapper.append(table);
  elements.scoreboard.append(wrapper);
}

function appendProtocolSection(tbody, title, categories) {
  const row = document.createElement("tr");
  row.className = "protocol-section-row";
  const th = document.createElement("th");
  th.scope = "row";
  th.colSpan = state.game.players.length + 1;
  th.textContent = title;
  row.append(th);
  tbody.append(row);

  categories.forEach((category) => appendCategoryRow(tbody, category));
}

function appendCategoryRow(tbody, category) {
  const row = document.createElement("tr");
  row.className = "protocol-score-row";
  const th = document.createElement("th");
  th.scope = "row";
  th.className = "category-col";
  th.innerHTML = `<strong>${escapeHtml(category.name)}</strong><span>${escapeHtml(category.hint)}</span>`;
  row.append(th);

  state.game.players.forEach((player, index) => {
    const td = document.createElement("td");
    const locked = category.id in player.scores;
    const isActive = index === state.activePlayerIndex;
    td.className = `${isActive ? "active-player" : ""} ${locked ? "locked" : ""}`;

    if (locked) {
      td.textContent = player.scores[category.id];
    } else if (isActive) {
      const preview = scoreCategory(category, state.dice, currentRuleset());
      const button = document.createElement("button");
      button.className = "score-cell-button";
      button.type = "button";
      button.disabled = !canScore(category);
      button.textContent = state.rollCount > 0 ? `Fyll ${preview}` : "";
      button.title = state.rollCount > 0 ? `${category.name}: ${preview}` : "Fyll i tärningar först";
      button.addEventListener("click", () => recordScore(category));
      td.append(button);
    } else {
      td.textContent = "";
    }

    row.append(td);
  });

  tbody.append(row);
}

function appendSummaryRow(tbody, label, valueForPlayer, className = "") {
  const row = document.createElement("tr");
  row.className = `protocol-summary-row ${className}`;
  const th = document.createElement("th");
  th.scope = "row";
  th.className = "category-col";
  th.textContent = label;
  row.append(th);

  state.game.players.forEach((player, index) => {
    const td = document.createElement("td");
    td.className = index === state.activePlayerIndex ? "active-player" : "";
    td.textContent = valueForPlayer(player);
    row.append(td);
  });

  tbody.append(row);
}

function renderPlayerTabs() {
  const standings = rankedPlayers();
  const leader = standings[0];
  elements.totalScoreLabel.textContent = leader ? `${leader.player.name} ${leader.totals.total}` : "0";
  elements.playerTabs.innerHTML = "";

  state.game.players.forEach((player, index) => {
    const totals = calculateTotals(player);
    const complete = totals.allComplete;
    const tab = document.createElement("div");
    tab.className = `player-tab ${index === state.activePlayerIndex ? "active" : ""} ${complete ? "complete" : ""}`;
    tab.innerHTML = `
      <strong>${escapeHtml(player.name)}</strong>
      <span>${totals.total} p${currentRuleset().rollPot ? ` · pott ${player.pot}` : ""}</span>
    `;
    elements.playerTabs.append(tab);
  });
}

function renderGame() {
  if (!state.game) {
    return;
  }
  const player = activePlayer();
  const ruleset = currentRuleset();
  elements.gameRulesetLabel.textContent = `${ruleset.name} · ${player.name}`;
  elements.gameTitle.textContent = state.game.finished ? "Matchen är klar" : `Tur: ${player.name}`;
  renderPlayerTabs();
  renderDice();
  renderScoreboard();
}

async function handleAuth(action, usernameInput, passwordInput) {
  elements.authMessage.textContent = "";
  try {
    const data = await api(action, {
      username: usernameInput.value,
      password: passwordInput.value,
    });
    state.user = data.user;
    elements.authDialog.close();
    renderUser();
    await refreshStats();
    toast(action === "login" ? "Du är inloggad." : "Kontot är skapat.");
  } catch (error) {
    elements.authMessage.textContent = error.message;
  }
}

function bindEvents() {
  elements.newGameButton.addEventListener("click", showSetupView);
  elements.cancelSetupButton.addEventListener("click", showHomeView);
  elements.rulesetSelect.addEventListener("change", renderRulesetDetails);
  elements.maxiModeInput.addEventListener("change", renderRulesetDetails);
  elements.straightModeInput.addEventListener("change", renderRulesetDetails);
  elements.startGameButton.addEventListener("click", startGame);
  elements.gameHomeButton.addEventListener("click", leaveGameToHome);
  elements.gameNewButton.addEventListener("click", leaveGameToSetup);
  elements.endGameButton.addEventListener("click", leaveGameToHome);
  elements.openAuthButton.addEventListener("click", openAuthDialog);
  elements.showRegisterButton.addEventListener("click", () => showAuthView("register"));
  elements.showLoginButton.addEventListener("click", () => showAuthView("login"));
  elements.loginButton.addEventListener("click", () => handleAuth("login", elements.loginUsername, elements.loginPassword));
  elements.registerButton.addEventListener("click", () => handleAuth("register", elements.registerUsername, elements.registerPassword));
  elements.logoutButton.addEventListener("click", async () => {
    await api("logout");
    state.user = null;
    renderUser();
    renderStats(null, []);
    toast("Du är utloggad.");
  });
  elements.undoDieButton.addEventListener("click", undoDie);
  elements.clearDiceButton.addEventListener("click", clearDice);
  elements.randomDiceButton.addEventListener("click", randomDice);
  elements.nextRollButton.addEventListener("click", nextRoll);
  elements.usePotButton.addEventListener("click", usePotRoll);
}

renderRulesetSelect();
bindEvents();
refreshSession().catch((error) => toast(error.message));
