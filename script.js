document.addEventListener('DOMContentLoaded', () => {
  let balance = parseInt(localStorage.getItem('casinoBalance')) || 100;
  let loyaltyPoints = parseInt(localStorage.getItem('loyaltyPoints')) || 0;

  const balanceEl = document.getElementById('balance');
  const loyaltyEl = document.getElementById('loyalty-points');
  const messageEl = document.getElementById('message');
  const betInput = document.getElementById('bet-amount');
  const startBtn = document.getElementById('start-game');
  const actionBtns = document.getElementById('action-buttons');
  const vipToggle = document.getElementById('vip-toggle');
  const vipLounge = document.getElementById('vip-lounge');
  const closeVip = document.getElementById('close-vip');
  const lpDisplay = document.getElementById('lp-display');
  const dealerCardsEl = document.getElementById('dealer-cards');
  const playerCardsEl = document.getElementById('player-cards');

  let deck = [];
  let playerHand = [];
  let dealerHand = [];
  let gameActive = false;

  function saveState() {
    localStorage.setItem('casinoBalance', balance);
    localStorage.setItem('loyaltyPoints', loyaltyPoints);
  }

  function updateUI() {
    balanceEl.textContent = balance;
    loyaltyEl.textContent = loyaltyPoints;
    lpDisplay.textContent = loyaltyPoints;
  }

  function buildDeck() {
    const suits = ['♠', '♥', '♦', '♣'];
    const values = ['A','2','3','4','5','6','7','8','9','10','J','Q','K'];
    deck = [];
    suits.forEach(s => values.forEach(v => deck.push({suit:s, value:v})));
    deck.sort(() => Math.random() - 0.5);
  }

  function dealCard(hand) {
    hand.push(deck.pop());
  }

  function renderHand(hand, el) {
    el.innerHTML = '';
    hand.forEach(c => {
      const div = document.createElement('div');
      div.className = 'card';
      div.textContent = `${c.value}${c.suit}`;
      el.appendChild(div);
    });
  }

  function handValue(hand) {
    let val = 0, aces = 0;
    hand.forEach(c => {
      if (['J','Q','K'].includes(c.value)) val += 10;
      else if (c.value === 'A') { val += 11; aces++; }
      else val += parseInt(c.value);
    });
    while (val > 21 && aces > 0) { val -= 10; aces--; }
    return val;
  }

  function startGame() {
    if (gameActive) return;
    const bet = parseInt(betInput.value);
    if (bet > balance || bet <= 0) return alert("Taruhan tidak valid.");
    gameActive = true;
    buildDeck();
    playerHand = []; dealerHand = [];
    dealCard(playerHand); dealCard(dealerHand);
    dealCard(playerHand); dealCard(dealerHand);
    balance -= bet;
    renderHand(playerHand, playerCardsEl);
    renderHand([{value:'?',suit:''}], dealerCardsEl);
    messageEl.textContent = "Giliran Anda.";
    actionBtns.classList.remove('hidden');
    saveState(); updateUI();
  }

  document.getElementById('hit-btn').onclick = () => {
    dealCard(playerHand);
    renderHand(playerHand, playerCardsEl);
    if (handValue(playerHand) > 21) endGame(false);
  };

  document.getElementById('stand-btn').onclick = () => dealerPlay();

  function dealerPlay() {
    renderHand(dealerHand, dealerCardsEl);
    while (handValue(dealerHand) < 17) dealCard(dealerHand);
    renderHand(dealerHand, dealerCardsEl);
    const p = handValue(playerHand);
    const d = handValue(dealerHand);
    if (d > 21 || p > d) endGame(true); else endGame(false);
  }

  function endGame(playerWin) {
    gameActive = false;
    actionBtns.classList.add('hidden');
    if (playerWin) {
      messageEl.textContent = "Anda Menang!";
      balance += parseInt(betInput.value) * 2;
      loyaltyPoints += 10;
    } else messageEl.textContent = "Kalah!";
    saveState(); updateUI();
  }

  startBtn.onclick = startGame;
  vipToggle.onclick = () => vipLounge.classList.remove('hidden');
  closeVip.onclick = () => vipLounge.classList.add('hidden');
  document.getElementById('reset-progress').onclick = () => {
    if (confirm("Reset semua progres?")) {
      localStorage.clear(); location.reload();
    }
  };

  updateUI();
});
