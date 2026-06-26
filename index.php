<?php
declare(strict_types=1);
?><!doctype html>
<html lang="sv">
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>Yatzyprotokoll</title>
    <link rel="stylesheet" href="assets/styles.css">
    <script src="https://ld.j4rl.se/ld-theme-toggle.js" defer></script>
    <script src="assets/app.js" defer></script>
  </head>
  <body>
    <header class="topbar">
      <div>
        <p class="eyebrow">Yatzyprotokoll</p>
        <h1>Spela, räkna och spara statistik</h1>
      </div>
      <div class="topbar-actions">
        <ld-theme-toggle></ld-theme-toggle>
        <button class="icon-button" id="openAuthButton" type="button" title="Logga in" aria-label="Logga in">
          <span aria-hidden="true">ID</span>
        </button>
      </div>
    </header>

    <main class="layout">
      <section class="panel start-panel" id="startPanel">
        <div class="panel-heading">
          <div>
            <p class="eyebrow">Start</p>
            <h2>Yatzybord</h2>
          </div>
          <p class="signed-in" id="signedInLabel">Spela utan konto</p>
        </div>
        <p class="helper">Starta en match, välj regelset och skriv in alla spelare innan protokollet öppnas.</p>
        <div class="start-actions">
          <button class="primary-button" id="newGameButton" type="button">Nytt spel</button>
        </div>
      </section>

      <section class="panel setup-panel" id="setupPanel" hidden>
        <div class="panel-heading">
          <div>
            <p class="eyebrow">Nytt spel</p>
            <h2>Spelare och regler</h2>
          </div>
          <button class="text-button" id="cancelSetupButton" type="button">Tillbaka</button>
        </div>
        <div class="field-grid">
          <label>
            Spelare
            <textarea id="playersInput" rows="4" placeholder="Skriv en spelare per rad"></textarea>
          </label>
          <div class="setup-options">
            <label>
              Regelvariant
              <select id="rulesetSelect"></select>
            </label>
            <label class="check-field">
              <input id="maxiModeInput" type="checkbox">
              <span>Maxi-Yatzy</span>
            </label>
            <label class="check-field">
              <input id="straightModeInput" type="checkbox">
              <span>Rak spelomgång</span>
            </label>
          </div>
        </div>

        <div class="ruleset-details" id="rulesetDetails"></div>
        <button class="primary-button" id="startGameButton" type="button">Starta spel</button>
      </section>

      <section class="panel stats-panel" id="statsPanel" hidden>
        <div class="panel-heading">
          <div>
            <p class="eyebrow">Konto</p>
            <h2>Senaste spelen</h2>
          </div>
          <button class="text-button" id="logoutButton" type="button">Logga ut</button>
        </div>
        <div class="stat-row" id="statSummary"></div>
        <div class="recent-games" id="recentGames"></div>
      </section>

      <section class="game-shell" id="gamePanel" hidden>
        <div class="game-header">
          <div>
            <p class="eyebrow" id="gameRulesetLabel">Pågående spel</p>
            <h2 id="gameTitle">Scorekort</h2>
          </div>
          <div class="game-actions">
            <button class="secondary-button" id="gameHomeButton" type="button">Start</button>
            <button class="secondary-button" id="gameNewButton" type="button">Nytt spel</button>
            <button class="secondary-button danger-button" id="endGameButton" type="button">Avsluta</button>
          </div>
          <div class="score-total">
            <span>Ledare</span>
            <strong id="totalScoreLabel">0</strong>
          </div>
        </div>
        <div class="player-tabs" id="playerTabs"></div>

        <div class="play-area">
          <section class="panel dice-panel">
            <div class="panel-heading compact">
              <div>
                <p class="eyebrow">Tärningar</p>
                <h3>Fyll i slaget</h3>
              </div>
              <span class="roll-count" id="rollCountLabel">Slag 0/3</span>
            </div>

            <div class="dice-slots" id="diceSlots"></div>
            <div class="dice-buttons" id="diceButtons"></div>

            <div class="button-row">
              <button class="secondary-button" id="undoDieButton" type="button">Ångra</button>
              <button class="secondary-button" id="clearDiceButton" type="button">Rensa</button>
              <button class="secondary-button" id="randomDiceButton" type="button">Slumpa</button>
            </div>

            <div class="roll-actions">
              <button class="primary-button" id="nextRollButton" type="button">Nytt slag</button>
              <button class="secondary-button" id="usePotButton" type="button" hidden>Använd pott-slag</button>
            </div>

            <p class="helper" id="diceHelper"></p>
            <div class="pot-meter" id="potMeter" hidden>
              <span>Pott</span>
              <strong id="potValue">0</strong>
            </div>
          </section>

          <section class="scoreboard" id="scoreboard"></section>
        </div>
      </section>
    </main>

    <dialog class="auth-dialog" id="authDialog">
      <form method="dialog" class="dialog-close-form">
        <button class="icon-button" type="submit" title="Stäng" aria-label="Stäng">X</button>
      </form>
      <div class="auth-view" id="loginView">
        <section>
          <p class="eyebrow">Logga in</p>
          <h2>Befintlig användare</h2>
          <label>
            Användarnamn
            <input id="loginUsername" type="text" autocomplete="username">
          </label>
          <label>
            Lösenord
            <input id="loginPassword" type="password" autocomplete="current-password">
          </label>
          <button class="primary-button" id="loginButton" type="button">Logga in</button>
          <p class="auth-switch">Inget konto? <button class="text-button" id="showRegisterButton" type="button">Skapa användare</button></p>
        </section>
      </div>
      <div class="auth-view" id="registerView" hidden>
        <section>
          <p class="eyebrow">Skapa konto</p>
          <h2>Ny användare</h2>
          <label>
            Användarnamn
            <input id="registerUsername" type="text" autocomplete="username">
          </label>
          <label>
            Lösenord
            <input id="registerPassword" type="password" autocomplete="new-password">
          </label>
          <button class="primary-button" id="registerButton" type="button">Skapa konto</button>
          <p class="auth-switch">Har du redan konto? <button class="text-button" id="showLoginButton" type="button">Logga in</button></p>
        </section>
      </div>
      <p class="form-message" id="authMessage"></p>
    </dialog>

    <div class="toast" id="toast" role="status" aria-live="polite"></div>
  </body>
</html>
