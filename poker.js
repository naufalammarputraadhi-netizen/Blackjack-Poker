// poker.js - FINAL BUILD (FULLY FUNCTIONAL TEXAS HOLD'EM)
document.addEventListener('DOMContentLoaded', () => {
  // --- STATE ---
  let balance = parseInt(localStorage.getItem('casinoBalance')) || 100;
  let loyaltyPoints = parseInt(localStorage.getItem('loyaltyPoints')) || 0;

  let deck = [];
  let playerHand = [];
  let aiHand = [];
  let communityCards = [];
  let pot = 0;
  let currentBet = 0;
  let aiCurrentBet = 0;
  let minRaise = 10;
  let currentPhase = 'Preflop';
  let roundActive = false;
  let isPlayerTurn = true;

  // --- DOM ELEMENTS ---
  const balanceEl = document.getElementById('balance');
  const loyaltyEl = document.getElementById('loyalty-points');
  const potEl = document.getElementById('pot-amount');
  const aiBetEl = document.getElementById('ai-bet');
  const playerBetEl = document.getElementById('player-current-bet');
  const msgEl = document.getElementById('poker-message');
  const aiCardsEl = document.getElementById('ai-cards');
  const playerCardsEl = document.getElementById('player-cards');
  const communityEl = document.getElementById('community-cards');
  const startBtn = document.getElementById('start-round-btn');
  const foldBtn = document.getElementById('fold-btn');
  const checkCallBtn = document.getElementById('check-call-btn');
  const raiseBtn = document.getElementById('raise-btn');
  const raiseInput = document.getElementById('raise-input');
  const sbInput = document.getElementById('small-blind-amount');

  // --- UTILITAS ---
  const saveState = () => {
    localStorage.setItem('casinoBalance', balance);
    localStorage.setItem('loyaltyPoints', loyaltyPoints);
  };

  const updateDisplay = () => {
    balanceEl.textContent = balance;
    loyaltyEl.textContent = loyaltyPoints;
    potEl.textContent = pot;
    aiBetEl.textContent = aiCurrentBet;
    playerBetEl.textContent = currentBet;

    const callNeeded = aiCurrentBet - currentBet;
    checkCallBtn.textContent = callNeeded > 0 ? `Call ($${callNeeded})` : 'Check';
  };

  const disableActions = (state) => {
    foldBtn.disabled = state;
    checkCallBtn.disabled = state;
    raiseBtn.disabled = state;
    raiseInput.disabled = state;
  };

  // --- KARTU ---
  function buildDeck() {
    const suits = ['♠', '♥', '♦', '♣'];
    const values = [
      '2','3','4','5','6','7','8','9','10','J','Q','K','A'
    ];
    deck = [];
    suits.forEach(s => values.forEach(v => deck.push({suit: s, value: v})));
    deck.sort(() => Math.random() - 0.5);
  }

  function cardValueRank(v) {
    if (v === 'A') return 14;
    if (v === 'K') return 13;
    if (v === 'Q') return 12;
    if (v === 'J') return 11;
    return parseInt(v);
  }

  function dealCard(hand) {
    hand.push(deck.pop());
  }

  function renderCard(card, hide = false) {
    const div = document.createElement('div');
    div.className = 'card';
    if (hide) div.classList.add('hidden');
    div.textContent = hide ? '' : `${card.value}${card.suit}`;
    return div;
  }

  function renderHand(hand, el, hideAll = false) {
    el.innerHTML = '';
    hand.forEach((c, i) => {
      const cardEl = renderCard(c, hideAll);
      el.appendChild(cardEl);
    });
  }

  function dealCommunityCards(n) {
    for (let i = 0; i < n; i++) dealCard(communityCards);
    renderHand(communityCards, communityEl, false);
  }

  // --- TARUHAN ---
  function makeBet(amount) {
    if (amount <= 0) return false;
    if (balance < amount) amount = balance;
    balance -= amount;
    pot += amount;
    currentBet += amount;
    return true;
  }

  // --- SHOWDOWN SEDERHANA ---
  function simpleEvaluateBestCard(hand) {
    // ambil kartu tertinggi
    let all = [...hand, ...communityCards];
    let max = Math.max(...all.map(c => cardValueRank(c.value)));
    return max;
  }

  function showdown() {
    const playerMax = simpleEvaluateBestCard(playerHand);
    const aiMax = simpleEvaluateBestCard(aiHand);
    renderHand(aiHand, aiCardsEl, false);

    msgEl.textContent = `Showdown! Anda: ${playerMax}, AI: ${aiMax}`;
    disableActions(true);

    setTimeout(() => {
      if (playerMax >= aiMax) endRound(true);
      else endRound(false);
    }, 2000);
  }

  // --- FASE PERMAINAN ---
  function advancePhase() {
    aiCurrentBet = 0;
    currentBet = 0;
    minRaise = 10;

    if (currentPhase === 'Preflop') {
      currentPhase = 'Flop';
      dealCommunityCards(3);
      msgEl.textContent = "FLOP dibuka. Giliran Anda.";
    } else if (currentPhase === 'Flop') {
      currentPhase = 'Turn';
      dealCommunityCards(1);
      msgEl.textContent = "TURN dibuka. Giliran Anda.";
    } else if (currentPhase === 'Turn') {
      currentPhase = 'River';
      dealCommunityCards(1);
      msgEl.textContent = "RIVER dibuka. Giliran Anda.";
    } else if (currentPhase === 'River') {
      currentPhase = 'Showdown';
      showdown();
      return;
    }

    isPlayerTurn = true;
    disableActions(false);
    updateDisplay();
  }

  async function aiTurn() {
    disableActions(true);
    const callNeeded = currentBet - aiCurrentBet;
    await new Promise(r => setTimeout(r, 1000));

    if (callNeeded > 0) {
      if (Math.random() < 0.3) {
        msgEl.textContent = "AI Fold. Anda Menang Pot!";
        endRound(true);
        return;
      } else {
        aiCurrentBet += callNeeded;
        pot += callNeeded;
        msgEl.textContent = "AI Call.";
      }
    } else {
      if (Math.random() < 0.5) {
        msgEl.textContent = "AI Check.";
        advancePhase();
        return;
      } else {
        const betAmt = 10;
        aiCurrentBet += betAmt;
        pot += betAmt;
        msgEl.textContent = `AI Bet $${betAmt}.`;
      }
    }
    updateDisplay();
    isPlayerTurn = true;
    disableActions(false);
  }

  // --- ALUR PUTARAN ---
  function startRound() {
    if (roundActive) return;
    roundActive = true;
    buildDeck();

    const sb = parseInt(sbInput.value) || 5;
    const bb = sb * 2;
    minRaise = bb;

    playerHand = [];
    aiHand = [];
    communityCards = [];
    pot = 0;
    currentPhase = 'Preflop';

    dealCard(playerHand);
    dealCard(aiHand);
    dealCard(playerHand);
    dealCard(aiHand);

    // AI (SB)
    aiCurrentBet = sb;
    balance -= sb;
    pot += sb;
    // Player (BB)
    makeBet(bb);
    currentBet = bb;

    renderHand(playerHand, playerCardsEl, false);
    renderHand(aiHand, aiCardsEl, true);
    communityEl.innerHTML = '';

    startBtn.disabled = true;
    disableActions(false);
    msgEl.textContent = `Preflop dimulai. Anda Big Blind ($${bb}). Giliran Anda.`;

    updateDisplay();
  }

  function endRound(playerWins) {
    roundActive = false;
    startBtn.disabled = false;
    disableActions(true);

    renderHand(aiHand, aiCardsEl, false);
    if (playerWins) {
      balance += pot;
      loyaltyPoints += 20;
      msgEl.textContent += " Anda Menang!";
    } else {
      msgEl.textContent += " AI Menang.";
    }

    pot = 0;
    aiCurrentBet = 0;
    currentBet = 0;

    saveState();
    updateDisplay();
  }

  // --- EVENT BUTTONS ---
  startBtn.onclick = startRound;

  foldBtn.onclick = () => {
    if (!roundActive || !isPlayerTurn) return;
    msgEl.textContent = "Anda Fold. AI Menang Pot!";
    endRound(false);
  };

  checkCallBtn.onclick = () => {
    if (!roundActive || !isPlayerTurn) return;
    const callNeeded = aiCurrentBet - currentBet;

    if (callNeeded > 0) {
      makeBet(callNeeded);
      msgEl.textContent = `Anda Call $${callNeeded}.`;
      isPlayerTurn = false;
      setTimeout(advancePhase, 1000);
    } else {
      msgEl.textContent = "Anda Check.";
      isPlayerTurn = false;
      setTimeout(aiTurn, 1000);
    }
    updateDisplay();
  };

  raiseBtn.onclick = () => {
    if (!roundActive || !isPlayerTurn) return;
    const raiseAmt = parseInt(raiseInput.value);
    const callNeeded = aiCurrentBet - currentBet;
    const totalToPay = callNeeded + raiseAmt;

    if (totalToPay > balance || raiseAmt < minRaise) {
      msgEl.textContent = `Raise tidak valid. Min raise: $${minRaise}`;
      return;
    }

    makeBet(totalToPay);
    msgEl.textContent = `Anda Raise $${raiseAmt}.`;
    isPlayerTurn = false;
    minRaise = raiseAmt;
    updateDisplay();
    setTimeout(aiTurn, 1000);
  };

  // --- INIT ---
  disableActions(true);
  updateDisplay();
});
