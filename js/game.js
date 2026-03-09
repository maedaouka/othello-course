// ========== Othello Game Controller ==========

const Game = (() => {
  const HUMAN = 1; // 黒
  const CPU   = 2; // 白

  let board = [];
  let currentPlayer = HUMAN;
  let difficulty = 'normal';
  let gameOver = false;
  let thinking = false;

  function initBoard() {
    board = new Array(64).fill(0);
    board[27] = CPU;  board[28] = HUMAN;
    board[35] = HUMAN; board[36] = CPU;
    currentPlayer = HUMAN;
    gameOver = false;
    thinking = false;
  }

  function countStones() {
    let b = 0, w = 0;
    board.forEach(c => { if (c === HUMAN) b++; else if (c === CPU) w++; });
    return { black: b, white: w };
  }

  // ===== Render =====
  function render() {
    const boardEl = document.getElementById('board');
    if (!boardEl) return;
    const validMoves = !gameOver && currentPlayer === HUMAN
      ? AI.getValidMoves(board, HUMAN)
      : [];
    const validSet = new Set(validMoves.map(m => m.pos));

    for (let i = 0; i < 64; i++) {
      const cell = boardEl.children[i];
      cell.innerHTML = '';
      cell.className = 'cell';

      if (board[i] !== 0) {
        const stone = document.createElement('div');
        stone.className = 'stone ' + (board[i] === HUMAN ? 'black' : 'white');
        cell.appendChild(stone);
      } else if (validSet.has(i)) {
        cell.classList.add('valid-move');
      }
    }

    const { black, white } = countStones();
    document.getElementById('score-black').textContent = black;
    document.getElementById('score-white').textContent = white;

    const turnEl = document.getElementById('turn-info');
    if (gameOver) {
      if (black > white) turnEl.textContent = '🎉 あなたの勝ち！';
      else if (white > black) turnEl.textContent = '🤖 AIの勝ち';
      else turnEl.textContent = '引き分け！';
    } else if (thinking) {
      turnEl.textContent = '🤔 AI思考中...';
    } else {
      turnEl.textContent = currentPlayer === HUMAN ? '⚫ あなたの番' : '⚪ AIの番';
    }
  }

  async function placeStone(pos) {
    const moves = AI.getValidMoves(board, currentPlayer);
    const mv = moves.find(m => m.pos === pos);
    if (!mv) return;

    board = AI.applyMove(board, mv.pos, mv.flips, currentPlayer);
    flipAnimation(mv.flips);
    currentPlayer = 3 - currentPlayer;
    render();
    await nextTurn();
  }

  function flipAnimation(flips) {
    const boardEl = document.getElementById('board');
    flips.forEach(i => {
      const stone = boardEl.children[i].querySelector('.stone');
      if (stone) stone.classList.add('flip');
    });
  }

  async function nextTurn() {
    const myMoves = AI.getValidMoves(board, currentPlayer);
    const oppMoves = AI.getValidMoves(board, 3 - currentPlayer);

    if (myMoves.length === 0 && oppMoves.length === 0) {
      gameOver = true;
      render();
      showResultModal();
      return;
    }

    if (myMoves.length === 0) {
      // パス
      currentPlayer = 3 - currentPlayer;
      showToast('パス！');
      render();
      await nextTurn();
      return;
    }

    if (currentPlayer === CPU) {
      await aiTurn();
    }
  }

  async function aiTurn() {
    thinking = true;
    render();
    await sleep(400 + Math.random() * 400);

    const mv = AI.bestMove(board, CPU, difficulty);
    if (mv) {
      board = AI.applyMove(board, mv.pos, mv.flips, CPU);
      flipAnimation(mv.flips);
    }
    thinking = false;
    currentPlayer = HUMAN;
    render();
    await nextTurn();
  }

  function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

  function showToast(msg) {
    let t = document.getElementById('toast');
    if (!t) {
      t = document.createElement('div');
      t.id = 'toast';
      t.style.cssText = `
        position:fixed;top:80px;left:50%;transform:translateX(-50%);
        background:#1a5c35;color:#fff;padding:0.6rem 1.4rem;
        border-radius:40px;font-weight:700;z-index:300;
        transition:opacity 0.4s;`;
      document.body.appendChild(t);
    }
    t.textContent = msg;
    t.style.opacity = '1';
    setTimeout(() => { t.style.opacity = '0'; }, 1500);
  }

  function showResultModal() {
    const { black, white } = countStones();
    const overlay = document.getElementById('result-modal');
    if (!overlay) return;
    const title = document.getElementById('modal-title');
    const sub   = document.getElementById('modal-sub');
    if (black > white) {
      title.textContent = '🎉 あなたの勝ち！';
      title.style.color = '#60d090';
    } else if (white > black) {
      title.textContent = '🤖 AIの勝ち';
      title.style.color = '#e07060';
    } else {
      title.textContent = '引き分け！';
      title.style.color = '#f0c040';
    }
    sub.textContent = `黒 ${black} — 白 ${white}`;
    overlay.classList.add('show');
  }

  // ===== Init DOM =====
  function setup() {
    const boardEl = document.getElementById('board');
    if (!boardEl) return;

    // セル生成
    for (let i = 0; i < 64; i++) {
      const cell = document.createElement('div');
      cell.className = 'cell';
      cell.dataset.idx = i;
      cell.addEventListener('click', () => {
        if (gameOver || thinking || currentPlayer !== HUMAN) return;
        placeStone(i);
      });
      boardEl.appendChild(cell);
    }

    // 難易度ボタン
    document.querySelectorAll('.diff-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        difficulty = btn.dataset.diff;
        document.querySelectorAll('.diff-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
      });
    });

    // 新しいゲーム
    document.getElementById('new-game-btn')?.addEventListener('click', () => {
      document.getElementById('result-modal')?.classList.remove('show');
      initBoard();
      render();
    });

    document.getElementById('play-again-btn')?.addEventListener('click', () => {
      document.getElementById('result-modal')?.classList.remove('show');
      initBoard();
      render();
    });

    initBoard();
    render();
  }

  document.addEventListener('DOMContentLoaded', setup);
  return {};
})();
