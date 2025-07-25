/*
 * Simple HTTP backend for Ultimate Tic‑Tac‑Toe
 *
 * This server provides a minimal set of REST‑style endpoints to coordinate
 * multiplayer games across the internet. It uses only Node.js core modules—
 * there are no external dependencies—so it can run anywhere Node.js is available.
 */

const http = require('http');
const fs = require('fs');
const path = require('path');
const { randomUUID } = require('crypto');

const PORT = process.env.PORT || 3000;
const ROOT = process.cwd();

const games = {}; // Stores all active games by ID

function makeGame(id) {
  return {
    id,
    smallBoards: Array.from({ length: 9 }, () => Array(9).fill('')),
    bigBoard: Array(9).fill(''),
    nextBoardIndex: null,
    currentPlayer: 'X',
    gameOver: false,
    players: { host: true, join: false }
  };
}

function sendJSON(res, obj, status = 200) {
  const json = JSON.stringify(obj);
  res.writeHead(status, { 'Content-Type': 'application/json' });
  res.end(json);
}

function send404(res) {
  res.writeHead(404);
  res.end('Not found');
}

function handleAPI(req, res) {
  const chunks = [];
  req.on('data', (c) => chunks.push(c));
  req.on('end', () => {
    const body = chunks.length ? Buffer.concat(chunks).toString() : '{}';
    let payload;
    try {
      payload = JSON.parse(body);
    } catch {
      return sendJSON(res, { error: 'Invalid JSON' }, 400);
    }

    const url = req.url;
    if (url === '/api/create') {
      const id = randomUUID().slice(0, 6);
      const game = makeGame(id);
      games[id] = game;
      sendJSON(res, { gameId: id });
    }

    else if (url === '/api/join') {
      const { gameId } = payload;
      const game = games[gameId];
      if (!game) return send404(res);
      game.players.join = true;
      sendJSON(res, { mark: 'O', state: game });
    }

    else if (url === '/api/state') {
      const { gameId } = payload;
      const game = games[gameId];
      if (!game) return send404(res);
      sendJSON(res, game);
    }

    else if (url === '/api/move') {
      const { gameId, boardIdx, cellIdx, mark } = payload;
      const game = games[gameId];
      if (!game || game.gameOver) return send404(res);

      const sb = game.smallBoards[boardIdx];
      if (!sb || sb[cellIdx] || (game.nextBoardIndex !== null && game.nextBoardIndex !== boardIdx)) {
        return sendJSON(res, { error: 'Invalid move' }, 400);
      }

      sb[cellIdx] = mark;

      const result = checkBoard(sb);
      if (result) game.bigBoard[boardIdx] = result;
      const overall = checkBoard(game.bigBoard);
      if (overall) game.gameOver = true;

      game.nextBoardIndex = game.bigBoard[cellIdx] === '' ? cellIdx : null;
      game.currentPlayer = mark === 'X' ? 'O' : 'X';
      sendJSON(res, game);
    }

    else if (url === '/api/reset') {
      const { gameId } = payload;
      const existing = games[gameId];
      if (!existing) return send404(res);
      games[gameId] = makeGame(gameId);
      sendJSON(res, games[gameId]);
    }

    else {
      send404(res);
    }
  });
}

function serveFile(req, res) {
  const filePath = req.url === '/' ? '/index.html' : req.url;
  const fullPath = path.join(ROOT, filePath);
  fs.readFile(fullPath, (err, content) => {
    if (err) return send404(res);
    const ext = path.extname(fullPath);
    const type = {
      '.html': 'text/html',
      '.js': 'text/javascript',
      '.css': 'text/css'
    }[ext] || 'application/octet-stream';
    res.writeHead(200, { 'Content-Type': type });
    res.end(content);
  });
}

function checkBoard(board) {
  const wins = [
    [0,1,2],[3,4,5],[6,7,8],
    [0,3,6],[1,4,7],[2,5,8],
    [0,4,8],[2,4,6]
  ];
  for (const [a,b,c] of wins) {
    if (board[a] && board[a] === board[b] && board[b] === board[c]) return board[a];
  }
  if (board.every(cell => cell)) return 'T';
  return '';
}

const server = http.createServer((req, res) => {
  if (req.url.startsWith('/api/')) handleAPI(req, res);
  else serveFile(req, res);
});

server.listen(PORT, () => {
  console.log(`Ultimate Tic‑Tac‑Toe server listening on port ${PORT}`);
});
