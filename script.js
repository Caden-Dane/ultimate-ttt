// Ultimate Tic‑Tac‑Toe game logic and UI handling

/**
 * Represents the current player's mark ("X" or "O").
 * @type {string}
 */
let currentPlayer;

/**
 * Represents the state of each small board in the game.
 * Each entry is an array of nine strings: "X", "O" or "".
 * @type {string[][]}
 */
let smallBoards;

/**
 * Represents the state of the big board: each entry can be:
 *   ""  – board still in play;
 *   "X" – player X won that small board;
 *   "O" – player O won that small board;
 *   "T" – the small board ended in a tie.
 * @type {string[]}
 */
let bigBoard;

/**
 * Indicates which small board index (0–8) must be played next.
 * If null, any unfinished small board may be played.
 * @type {(number|null)}
 */
let nextBoardIndex;

/**
 * Flag indicating whether the overall game has ended.
 * @type {boolean}
 */
let gameOver;

// DOM elements
const ultimateBoardEl = document.getElementById('ultimate-board');
const statusEl = document.getElementById('status');
const resetBtn = document.getElementById('reset-btn');

/**
 * Initializes or resets the game state and renders the board.
 */
function initGame() {
  // Start with an empty set of small boards and big board
  smallBoards = Array.from({ length: 9 }, () => Array(9).fill(''));
  bigBoard = Array(9).fill('');
  nextBoardIndex = null;
  currentPlayer = 'X';
  gameOver = false;
  statusEl.textContent = `Current Player: ${currentPlayer}`;
  renderBoard();
}

/**
 * Renders the entire ultimate board UI based on the current game state.
 */
function renderBoard() {
  // Clear existing board content
  ultimateBoardEl.innerHTML = '';

  // Create nine small boards
  for (let i = 0; i < 9; i++) {
    const smallBoardEl = document.createElement('div');
    smallBoardEl.classList.add('small-board');
    smallBoardEl.dataset.boardIndex = i;

    // Generate the nine cells inside each small board
    for (let j = 0; j < 9; j++) {
      const cellEl = document.createElement('div');
      cellEl.classList.add('small-cell');
      cellEl.dataset.boardIndex = i;
      cellEl.dataset.cellIndex = j;
      cellEl.textContent = smallBoards[i][j];

      // Only attach click listener if the board is still playable
      cellEl.addEventListener('click', handleCellClick);
      smallBoardEl.appendChild(cellEl);
    }

    // Add overlay for completed small boards
    if (bigBoard[i] === 'X' || bigBoard[i] === 'O') {
      smallBoardEl.classList.add('won', bigBoard[i].toLowerCase());
      const overlay = document.createElement('div');
      overlay.classList.add('winner-overlay');
      overlay.textContent = bigBoard[i];
      smallBoardEl.appendChild(overlay);
    } else if (bigBoard[i] === 'T') {
      smallBoardEl.classList.add('tie');
      const overlay = document.createElement('div');
      overlay.classList.add('winner-overlay');
      overlay.textContent = 'TIE';
      smallBoardEl.appendChild(overlay);
    }

    ultimateBoardEl.appendChild(smallBoardEl);
  }
  updateActiveBoards();
}

/**
 * Updates classes on each small board to show which boards are currently active/playable.
 */
function updateActiveBoards() {
  const boards = ultimateBoardEl.querySelectorAll('.small-board');
  boards.forEach((boardEl, idx) => {
    boardEl.classList.remove('active', 'inactive');

    // If the game is over, no boards should be active
    if (gameOver) {
      return;
    }

    // Determine whether this board is playable
    const boardFinished = bigBoard[idx] !== '';
    const forcedPlay = nextBoardIndex !== null;
    const isTargetBoard = idx === nextBoardIndex;

    if (forcedPlay) {
      if (!boardFinished && isTargetBoard) {
        boardEl.classList.add('active');
      } else {
        boardEl.classList.add('inactive');
      }
    } else {
      // No forced board: all unfinished boards are active
      if (!boardFinished) {
        boardEl.classList.add('active');
      } else {
        boardEl.classList.add('inactive');
      }
    }
  });
}

/**
 * Handles a player clicking on a cell. Performs validation and updates state accordingly.
 * @param {MouseEvent} e
 */
function handleCellClick(e) {
  if (gameOver) return;
  const cellEl = e.currentTarget;
  const boardIdx = parseInt(cellEl.dataset.boardIndex, 10);
  const cellIdx = parseInt(cellEl.dataset.cellIndex, 10);

  // Enforce playing on the forced board if there is one
  if (nextBoardIndex !== null && boardIdx !== nextBoardIndex) return;
  // Ensure the small board isn't complete
  if (bigBoard[boardIdx] !== '') return;
  // Ensure the chosen cell is empty
  if (smallBoards[boardIdx][cellIdx] !== '') return;

  // Place the current player's mark
  smallBoards[boardIdx][cellIdx] = currentPlayer;
  cellEl.textContent = currentPlayer;

  // Check if this small board has been won or tied
  const smallBoardResult = checkBoardStatus(smallBoards[boardIdx]);
  if (smallBoardResult !== '') {
    bigBoard[boardIdx] = smallBoardResult;
  }

  // Check if the big board has a result
  const bigBoardResult = checkBoardStatus(bigBoard);
  if (bigBoardResult === 'X' || bigBoardResult === 'O') {
    gameOver = true;
    statusEl.textContent = `Player ${bigBoardResult} wins the game!`;
  } else if (bigBoardResult === 'T') {
    gameOver = true;
    statusEl.textContent = 'The game is a tie!';
  }

  // Determine next forced small board
  if (!gameOver) {
    nextBoardIndex = cellIdx;
    // If that board is finished, free choice
    if (bigBoard[nextBoardIndex] !== '') {
      nextBoardIndex = null;
    }
    // Toggle the current player for next turn
    currentPlayer = currentPlayer === 'X' ? 'O' : 'X';
    statusEl.textContent = `Current Player: ${currentPlayer}`;
  }

  // Re-render the board to update overlays and active indicators
  renderBoard();
}

/**
 * Determines the status of a 3×3 board represented as an array of nine strings.
 * Only "X" and "O" count as winning marks; "T" is treated as neutral.
 *
 * @param {string[]} board - An array of nine strings representing a board.
 * @returns {string} "X" or "O" if that player has won, "T" if tied, or "" if still undecided.
 */
function checkBoardStatus(board) {
  const winningLines = [
    [0, 1, 2],
    [3, 4, 5],
    [6, 7, 8],
    [0, 3, 6],
    [1, 4, 7],
    [2, 5, 8],
    [0, 4, 8],
    [2, 4, 6],
  ];
  // Check for a win first
  for (const [a, b, c] of winningLines) {
    const mark = board[a];
    if ((mark === 'X' || mark === 'O') && mark === board[b] && mark === board[c]) {
      return mark;
    }
  }
  // If no win, check for a tie (all positions filled with non-empty values)
  const full = board.every((val) => val !== '' && val !== 'T');
  if (full) return 'T';
  return '';
}

// Set up event listeners
resetBtn.addEventListener('click', initGame);

// Initialize game on page load
initGame();