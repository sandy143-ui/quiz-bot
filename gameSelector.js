// games/gameSelector.js

function selectGame() {
  const games = ["quiz", "planeCrash"];
  return games[Math.floor(Math.random() * games.length)];
}

module.exports = { selectGame };
