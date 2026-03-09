// ========== Othello AI Engine ==========
// Minimax + Alpha-Beta Pruning + 評価関数

const AI = (() => {
  // 位置評価テーブル（高いほど有利）
  const WEIGHT_TABLE = [
    120, -20,  20,   5,   5,  20, -20, 120,
    -20, -40,  -5,  -5,  -5,  -5, -40, -20,
     20,  -5,  15,   3,   3,  15,  -5,  20,
      5,  -5,   3,   3,   3,   3,  -5,   5,
      5,  -5,   3,   3,   3,   3,  -5,   5,
     20,  -5,  15,   3,   3,  15,  -5,  20,
    -20, -40,  -5,  -5,  -5,  -5, -40, -20,
    120, -20,  20,   5,   5,  20, -20, 120,
  ];

  const DIRS = [-9, -8, -7, -1, 1, 7, 8, 9];
  const SIZE = 8;

  function idx(r, c) { return r * SIZE + c; }
  function validIdx(i) { return i >= 0 && i < 64; }

  // 方向のチェック（端の折り返し防止）
  const DIR_VALID = [
    [-1,-1],[-1, 0],[-1, 1],
    [ 0,-1],        [ 0, 1],
    [ 1,-1],[ 1, 0],[ 1, 1],
  ];
  const DIR_OFFSETS = [-9, -8, -7, -1, 1, 7, 8, 9];

  function getFlips(board, pos, player) {
    const r0 = Math.floor(pos / SIZE), c0 = pos % SIZE;
    const opp = 3 - player;
    const flips = [];

    DIR_VALID.forEach(([dr, dc], di) => {
      const line = [];
      let r = r0 + dr, c = c0 + dc;
      while (r >= 0 && r < SIZE && c >= 0 && c < SIZE) {
        const i = idx(r, c);
        if (board[i] === opp) { line.push(i); }
        else if (board[i] === player) { flips.push(...line); break; }
        else break;
        r += dr; c += dc;
      }
    });
    return flips;
  }

  function getValidMoves(board, player) {
    const moves = [];
    for (let i = 0; i < 64; i++) {
      if (board[i] === 0) {
        const f = getFlips(board, i, player);
        if (f.length > 0) moves.push({ pos: i, flips: f });
      }
    }
    return moves;
  }

  function applyMove(board, pos, flips, player) {
    const next = board.slice();
    next[pos] = player;
    flips.forEach(i => { next[i] = player; });
    return next;
  }

  // 評価関数
  function evaluate(board, player) {
    const opp = 3 - player;

    // 位置重み
    let posScore = 0;
    for (let i = 0; i < 64; i++) {
      if (board[i] === player) posScore += WEIGHT_TABLE[i];
      else if (board[i] === opp) posScore -= WEIGHT_TABLE[i];
    }

    // 石数差（終盤重視）
    let count = 0;
    for (let i = 0; i < 64; i++) {
      if (board[i] === player) count++;
      else if (board[i] === opp) count--;
    }

    // 手数（mobility）
    const myMoves = getValidMoves(board, player).length;
    const oppMoves = getValidMoves(board, opp).length;
    const mobility = (myMoves + oppMoves === 0) ? 0
      : 100 * (myMoves - oppMoves) / (myMoves + oppMoves + 1);

    // コーナー
    const corners = [0, 7, 56, 63];
    let cornerScore = 0;
    corners.forEach(c => {
      if (board[c] === player) cornerScore += 25;
      else if (board[c] === opp) cornerScore -= 25;
    });

    const empty = board.filter(x => x === 0).length;
    const endgameWeight = 1 - empty / 64;

    return posScore * 1.0
      + mobility * (1 - endgameWeight * 0.5)
      + cornerScore * 2.0
      + count * endgameWeight * 3;
  }

  // Alpha-Beta Minimax
  function minimax(board, depth, alpha, beta, isMax, player) {
    const cur = isMax ? player : 3 - player;
    const moves = getValidMoves(board, cur);

    if (depth === 0 || (moves.length === 0 && getValidMoves(board, 3 - cur).length === 0)) {
      return evaluate(board, player);
    }

    if (moves.length === 0) {
      // パス
      return minimax(board, depth - 1, alpha, beta, !isMax, player);
    }

    // move ordering: コーナー優先
    moves.sort((a, b) => {
      const corners = [0, 7, 56, 63];
      const aCorner = corners.includes(a.pos) ? 1 : 0;
      const bCorner = corners.includes(b.pos) ? 1 : 0;
      return bCorner - aCorner;
    });

    if (isMax) {
      let best = -Infinity;
      for (const mv of moves) {
        const nb = applyMove(board, mv.pos, mv.flips, cur);
        const score = minimax(nb, depth - 1, alpha, beta, false, player);
        best = Math.max(best, score);
        alpha = Math.max(alpha, score);
        if (beta <= alpha) break;
      }
      return best;
    } else {
      let best = Infinity;
      for (const mv of moves) {
        const nb = applyMove(board, mv.pos, mv.flips, cur);
        const score = minimax(nb, depth - 1, alpha, beta, true, player);
        best = Math.min(best, score);
        beta = Math.min(beta, score);
        if (beta <= alpha) break;
      }
      return best;
    }
  }

  // 難易度設定
  const DEPTH_MAP = { easy: 2, normal: 4, hard: 6 };

  function bestMove(board, player, difficulty = 'normal') {
    const depth = DEPTH_MAP[difficulty] || 4;
    const moves = getValidMoves(board, player);
    if (moves.length === 0) return null;
    if (moves.length === 1) return moves[0];

    let best = -Infinity, bestMv = moves[0];
    for (const mv of moves) {
      const nb = applyMove(board, mv.pos, mv.flips, player);
      const score = minimax(nb, depth - 1, -Infinity, Infinity, false, player);
      if (score > best) { best = score; bestMv = mv; }
    }
    return bestMv;
  }

  return { bestMove, getValidMoves, getFlips, applyMove };
})();
