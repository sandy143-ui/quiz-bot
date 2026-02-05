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
const verificationTime = 5 * 60 * 1000; // 5 min

const questions = JSON.parse(fs.readFileSync("questions.json"));

const bot = new TelegramBot(token, { polling: true });

// =================== State ===================
let participants = [];
let scores = {};
let pendingPayments = {}; // { userId: { timestamp } }

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

  pendingPayments[chatId] = { timestamp: Date.now() };
  bot.sendMessage(chatId, `💰 Entry Fee: ${entryFeeUSD}$\nPay in USDT, ETH, BNB.\nAdmin will approve in 5 minutes ⏱️`);
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

// =================== Scheduled Nightly Quiz ===================
cron.schedule("0 21 * * *", () => { // 9 PM daily
  if (participants.length === 0) return;
  participants.forEach(startQuiz);
});

// =================== Quiz Flow ===================
async function startQuiz(chatId) {
  for (let i = 0; i < questions.length; i++) {
    const q = questions[i];
    const opts = {
      reply_markup: {
        inline_keyboard: q.choices.map(choice => [{ text: choice, callback_data: `${i}|${choice}` }])
      }
    };
    await bot.sendMessage(chatId, `❓ Question ${i+1}: ${q.q}`, opts);
  }
  announceWinner();
}

// =================== Answer Handling ===================
bot.on("callback_query", (query) => {
  const [qIndex, choice] = query.data.split("|");
  const question = questions[qIndex];
  const chatId = query.message.chat.id;

  if (choice === question.a) {
    scores[chatId] += 1;
    bot.answerCallbackQuery(query.id, { text: "✅ Correct!" });
  } else {
    bot.answerCallbackQuery(query.id, { text: "❌ Wrong!" });
  }
});

// =================== Winner Announcement ===================
function announceWinner() {
  if (participants.length === 0) return;

  const maxScore = Math.max(...Object.values(scores));
  const winners = Object.keys(scores).filter(k => scores[k] === maxScore);
  const winnerChatId = winners[Math.floor(Math.random() * winners.length)];

  bot.sendMessage(winnerChatId, `🏆 Congratulations! You won $${prizeUSD}! 🎉`);
  participants = [];
  scores = {};
}
