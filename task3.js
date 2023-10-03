const crypto = require('crypto');
const readline = require('readline');
const moves = process.argv.slice(2);

class SecretKey {
  generateRandomKey() {
    return crypto.randomBytes(32).toString('hex');
  }
}

class Hmac {
  constructor(key, turn) {
    this.key = key;
    this.turn = turn;
  }

  createHmac() {
    return crypto
      .createHmac('sha3-256', this.key)
      .update(this.turn)
      .digest('hex');
  }
}

class Game {
  constructor() {
    this.moves = [...moves];
  }

  getResult(userTurn, computerTurn) {
    const diff = (computerTurn - userTurn + this.moves.length) % this.moves.length;
    return diff === 0 ? 'Draw!' : diff <= this.moves.length / 2 ? 'You win!' : 'You lose!';
  }
}

class Table {
  constructor(game) {
    this.game = game;
  }

  showTable() {
    const matrix = this.game.moves.map((_, i) => this.game.moves.map((_, j) => this.game.getResult(i, j)));
    const newMatrix = matrix.map((row, index) => ({ ' ': this.game.moves[index], ...row }));
    console.table(newMatrix);
  }
}

const validators = [
  { isValid: (moves) => moves.length === new Set(moves).size, message: 'should not be repeated' },
  { isValid: (moves) => moves.length >= 3, message: 'too short, must be >= 3' },
  { isValid: (moves) => moves.length % 2 !== 0, message: 'must be an odd number' },
];

function validateInput() {
  let valid = true;
  for (const { isValid, message } of validators) {
    if (!isValid(moves)) {
      valid = false;
      console.log(message);
      break;
    }
  };
  return valid;
}

function makeTurn() {
  return moves[Math.floor(Math.random() * moves.length)];
}

async function startGame() {
  if (!validateInput()) return;

  let continueGame = true;

  while (continueGame) {
    const secretKey = new SecretKey();
    const key = secretKey.generateRandomKey();
    const turn = makeTurn();
    const hmac = new Hmac(key, turn);
    const HMAChash = hmac.createHmac();
    const game = new Game();

    console.log(`HMAC: ${HMAChash}`);
    console.log('Available moves: \n' + moves.map((item, index) => `${index + 1} - ${item}`).join('\n') + '\n0 - exit\n? - help ');

    const answer = await askForInput('Enter your move: ');

    if (answer === '0') {
      console.log('You are leaving the game, goodbye!');
      continueGame = false;
    } else if (answer === '?') {
      const table = new Table(game);
      table.showTable();
    } else {
      const yourMove = moves[+answer - 1];
      if (!yourMove) {
        console.log('Must be a correct value...');
      } else {
        console.log(`Your move: ${yourMove}`);
        console.log(`Computer move: ${turn}`);
        console.log(game.getResult(+answer - 1, moves.indexOf(turn)));
        console.log(`HMAC key: ${key}`);
      }
    }
  }
}

function askForInput(question) {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      rl.close();
      resolve(answer.trim());
    });
  });
}

try {
  startGame();
} catch (err) {
  console.log(err.message);
}
