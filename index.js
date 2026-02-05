require('dotenv').config();
const TelegramBot = require("node-telegram-bot-api");
const cron = require("node-cron");
const fs = require("fs");

// =================== Config ===================
const token = process.env.BOT_TOKEN;
const adminId = parseInt(process.env.ADMIN_ID);
if (!token) throw new Error("EFATAL: Telegram Bot Token not provided!");

const maxPlayers = 10;
const entryFeeUSD = 5;
const prizeUSD = 35;
const questionTime = 15; // seconds per question
const cryptoAddresses = {
  USDT: "TMvJs9knh5dXoDi1ST6jmRe2etv9vCXWow",
  ETH: "0x228a60ce0b51FA5672B50a20B0820803654E4aEa",
  BNB: "0x228a60ce0b51FA5672B50a20B0820803654E4aEa"
};

const questions = JSON.parse(fs.readFileSync("questions.json"));
const bot = new TelegramBot(token, { polling: true });

// =================== State ===================
let participants = [];
let scores = {};
let pendingPayments = {}; // { userId: { currency, timestamp } }

// =================== /join Command ===================
bot.onText(/\/join/, (msg) => {
  const chatId = msg.chat.id;
  if (participants.includes(chatId)) return bot.sendMessage(chatId, "⚠️ You already joined!");
  if (participants.length >= maxPlayers) return bot.sendMessage(chatId, "❌ Quiz is full.");

  pendingPayments[chatId] = { timestamp: Date.now() };

  bot.sendMessage(chatId,
    `💰 Entry Fee: ${entryFeeUSD}$\nSend payment to one of these addresses:\n\n` +
    `USDT: ${cryptoAddresses.USDT}\nETH: ${cryptoAddresses.ETH}\nBNB: ${cryptoAddresses.BNB}\n\n` +
    `After sending, wait 5 minutes. Admin will approve with /approve ${chatId} ✅`
  );
});

// =================== Admin Approve Payment ===================
bot.onText(/\/approve (\d+)/, (msg, match) => {
  if (msg.from.id !== adminId) return;
  const chatId = parseInt(match[1]);
  if (!pendingPayments[chatId]) return bot.sendMessage(adminId, "No pending payment for this user.");

  delete pendingPayments[chatId];
  participants.push(chatId);
  scores[chatId] = 0;
  bot.sendMessage(chatId, "✅ Payment approved! You are now in the quiz.");
  bot.sendMessage(adminId, `User ${chatId} approved.`);
});

// =================== Scheduled Quiz ===================
cron.schedule("0 21 * * *", () => { // 9 PM daily
  if (participants.length === 0) return;
  startQuizAll();
});

// =================== Start Quiz for All Participants ===================
async function startQuizAll() {
  bot.sendMessage(adminId, `🏁 Quiz starting now for ${participants.length} participants!`);
  const totalQuestions = questions.length;

  for (let i = 0; i < totalQuestions; i++) {
    const q = questions[i];
    const keyboard = { 
      reply_markup: { inline_keyboard: q.choices.map(c => [{ text: c, callback_data: `${i}|${c}` }]) } 
    };
    participants.forEach(chatId => bot.sendMessage(chatId, `❓ Question ${i+1}: ${q.q}`, keyboard));

    await new Promise(r => setTimeout(r, questionTime * 1000));
    sendLiveLeaderboard();
  }

  announceWinner();
}

// =================== Answer Handling ===================
bot.on("callback_query", (query) => {
  const [qIndex, choice] = query.data.split("|");
  const question = questions[qIndex];
  const chatId = query.message.chat.id;

  if (!scores[chatId]) scores[chatId] = 0;

  if (choice === question.a) {
    scores[chatId] += 1;
    bot.answerCallbackQuery(query.id, { text: "✅ Correct!" });
  } else {
    bot.answerCallbackQuery(query.id, { text: "❌ Wrong!" });
  }
});

// =================== Live Leaderboard ===================
function sendLiveLeaderboard() {
  if (participants.length === 0) return;

  let leaderboard = "📊 Live Leaderboard:\n";
  const sorted = Object.entries(scores).sort((a,b) => b[1]-a[1]);
  sorted.forEach(([id, score], index) => {
    leaderboard += `${index+1}. User ${id}: ${score} ✅\n`;
  });

  participants.forEach(id => bot.sendMessage(id, leaderboard));
}

// =================== Announce Winner ===================
function announceWinner() {
  if (participants.length === 0) return;

  const maxScore = Math.max(...Object.values(scores));
  const winners = Object.keys(scores).filter(k => scores[k] === maxScore);
  const winnerChatId = winners[Math.floor(Math.random()*winners.length)];

  bot.sendMessage(winnerChatId, `🏆 Congratulations! You won $${prizeUSD}! 🎉`);
  sendLiveLeaderboard();

  participants = [];
  scores = {};
}
