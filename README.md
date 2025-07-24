# Ultimate Tic‑Tac‑Toe

This project is a simple implementation of **Ultimate Tic‑Tac‑Toe** written in plain HTML, CSS and JavaScript.  It can be hosted on any static file server (for example GitHub Pages) and played directly in a web browser.

## How to play

Ultimate Tic‑Tac‑Toe consists of a 3 × 3 grid of smaller tic‑tac‑toe boards.  Each small board follows the standard rules of tic‑tac‑toe, but where you play on one board determines the board your opponent must play on next.

1. **Starting the game** – The first player (X) may place a mark in any cell of any small board.
2. **Constrained moves** – After the first move, the next player must play on the small board that corresponds to the position of the last mark.  For example, if X plays in the middle‑left cell of a small board (index 3), O must play on the small board located in the middle‑left of the large grid.
3. **Free moves** – If the required board has already been won or tied, the next player may choose any unfinished small board.
4. **Winning a small board** – If a player gets three in a row within a small board, they “claim” that big‑board cell.  Tied small boards are marked as ties and cannot be claimed.
5. **Winning the game** – The first player to claim three small boards in a row (horizontally, vertically or diagonally) wins the game.  If all small boards end in ties with no three‑in‑a‑row on the big board, the overall game is considered a tie.

The game highlights which small board(s) are currently playable.  Completed small boards show a large **X**, **O** or **TIE** overlay.

## Running locally

To play the game locally without hosting it, you can simply open the `index.html` file in your web browser:

```bash
# From the project root
open ultimate-tic-tac-toe/index.html  # macOS
# or
x-www-browser ultimate-tic-tac-toe/index.html  # Linux
```

Alternatively, you may start a simple HTTP server (Python ≥3.7) from the repository root:

```bash
cd ultimate-tic-tac-toe
python3 -m http.server 8000
# Then navigate to http://localhost:8000 in your browser
```

### Playing online

This version includes an **online mode** that lets two players connect across the internet without running any server‑side code.  It uses WebRTC via the [PeerJS library](https://peerjs.com/docs/) to establish a direct peer‑to‑peer connection between browsers.  To play online:

1. Open the game (either via GitHub Pages or locally via HTTP) on two separate devices.
2. On one device, click **Host Game** in the “Play Online” panel.  A unique game ID will appear—share this ID with your opponent.
3. On the other device, click **Join Game**, enter the ID and press **Connect**.
4. Once connected, the host (X) makes the first move.  The opponent (O) will see the move in real time and may then take their turn.  The status bar indicates whose turn it is.

The PeerJS service uses a free public signalling server to set up the peer‑to‑peer connection.  Your game data is exchanged directly between browsers and never touches a backend.  Some restrictive networks or corporate firewalls may block peer‑to‑peer traffic; if you cannot connect, try switching to a different network.

## Hosting on GitHub Pages

1. Push the contents of the `ultimate-tic-tac-toe` folder to a GitHub repository (for example, in a subfolder or the root).
2. In your repository settings, enable GitHub Pages and point it to the appropriate branch and folder (e.g. `main` branch and `/` if you placed the files at the root).
3. Once the page is published, navigate to the provided URL and enjoy the game.

## Files

| File             | Description                                 |
|------------------|---------------------------------------------|
| `index.html`     | Main HTML entry point                       |
| `style.css`      | Basic styling for the game board and layout |
| `script.js`      | Game logic and interactivity                |
| `README.md`      | This documentation                          |
