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
  USDT:"TMvJs9knh5dXoDi1ST6jmRe2etv9vCXWow",
  ETH:"0x228a60ce0b51FA5672B50a20B0820803654E4aEa",
  BNB:"0x228a60ce0b51FA5672B50a20B0820803654E4aEa",
};

const questions = JSON.parse(fs.readFileSync("questions.json"));
const bot = new TelegramBot(token, { polling: true });

// =================== State ===================
let participants = [];
let scores = {};
let pendingPayments = {}; // { userId: { currency, timestamp } }

// =================== Promotion Broadcast ===================
function broadcastPromotion(userIds) {
  const message = `🎮 Exciting Knowledge Quiz Night!\nEntry Fee: ${entryFeeUSD}$ via USDT, ETH, BNB\nPrize: ${prizeUSD}$!\nClick /join to participate! 🏆`;
  userIds.forEach(id => bot.sendMessage(id, message));
}

// =================== Join Command ===================
bot.onText(/\/join/, (msg) => {
  const chatId = msg.chat.id;

  if (participants.includes(chatId)) return bot.sendMessage(chatId, "⚠️ You already joined!");
  if (participants.length >= maxPlayers) return bot.sendMessage(chatId, "❌ Quiz is full.");

  // Ask for crypto payment
  bot.sendMessage(chatId, 
    `💰 Entry Fee: ${entryFeeUSD}$\n` +
    `Please send payment to one of these addresses:\n\n` +
    `USDT: ${cryptoAddresses.USDT}\nETH: ${cryptoAddresses.ETH}\nBNB: ${cryptoAddresses.BNB}\n\n` +
    `After sending, please wait 5 minutes. Admin will approve your transaction. ✅`
  );

  pendingPayments[chatId] = { timestamp: Date.now(), currency: null };
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
  participants.forEach(startQuiz);
});

// =================== Quiz Flow with Timer ===================
async function startQuiz(chatId) {
  bot.sendMessage(chatId, `🎮 Quiz starting now! You have ${questionTime} seconds per question.`);

  for (let i = 0; i < questions.length; i++) {
    const q = questions[i];
    const opts = {
      reply_markup: {
        inline_keyboard: q.choices.map(choice => [{ text: choice, callback_data: `${i}|${choice}` }])
      }
    };
    await bot.sendMessage(chatId, `❓ Question ${i + 1}: ${q.q}`, opts);
    await new Promise(r => setTimeout(r, questionTime * 1000)); // wait questionTime seconds
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

// =================== Winner & Leaderboard ===================
function announceWinner() {
  if (participants.length === 0) return;

  const maxScore = Math.max(...Object.values(scores));
  const winners = Object.keys(scores).filter(k => scores[k] === maxScore);
  const winnerChatId = winners[Math.floor(Math.random() * winners.length)];

  bot.sendMessage(winnerChatId, `🏆 Congratulations! You won $${prizeUSD}! 🎉`);

  // Leaderboard
  let leaderboard = "📊 Quiz Leaderboard:\n";
  const sorted = Object.entries(scores).sort((a, b) => b[1] - a[1]);
  sorted.forEach(([id, score], index) => {
    leaderboard += `${index + 1}. User ${id}: ${score} ✅\n`;
  });
  participants.forEach(id => bot.sendMessage(id, leaderboard));

  // Reset
  participants = [];
  scores = {};
}
