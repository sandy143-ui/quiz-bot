require('dotenv').config();
const TelegramBot = require("node-telegram-bot-api");
const cron = require("node-cron");
const fs = require("fs");
const adminPanel = require("./adminPanel");

// ================= CONFIG =================
const token = process.env.BOT_TOKEN;
const adminId = parseInt(process.env.ADMIN_ID);

if (!token) throw new Error("BOT_TOKEN missing");

const maxPlayers = 10;
const entryFeeUSD = 5;
const prizeUSD = 35;
const questionTime = 15;

const cryptoAddresses = {
  USDT: "TMvJs9knh5dXoDi1ST6jmRe2etv9vCXWow",
  ETH: "0x228a60ce0b51FA5672B50a20B0820803654E4aEa",
  BNB: "0x228a60ce0b51FA5672B50a20B0820803654E4aEa"
};

const questions = JSON.parse(fs.readFileSync("questions.json"));
const bot = new TelegramBot(token, { polling: true });

// ================= STATE =================
let participants = [];
let scores = {};
let streaks = {};
let pendingPayments = {};
let names = {};
let users = new Set();

// ================= PROMOTION MESSAGE =================
function sendPromotion(chatId, name) {
  bot.sendMessage(chatId,
`🎮 *QUIZ NIGHT LIVE*
━━━━━━━━━━━━━━━━━━
👤 Player: *${name}*

🏆 Prize Pool: *$${prizeUSD}*
💰 Entry Fee: *$${entryFeeUSD}*
👥 Seats: *${maxPlayers} only*

⚡ Fast questions  
🧠 Brain battles  
📊 Live leaderboard  
🎉 Instant winner  

Tap below to secure your seat 👇`,
{
  parse_mode: "Markdown",
  reply_markup: {
    inline_keyboard: [
      [{ text: "🚀 Join Quiz Now", callback_data: "join_quiz" }]
    ]
  }
});
}

// Approve command
bot.onText(/\/approve (\d+)/, (msg, match) => {
  if (msg.from.id !== adminId) return;
  const userId = parseInt(match[1]);
  adminPanel.approveUser(bot, adminId, userId);
});

// Reject command
bot.onText(/\/reject (\d+)/, (msg, match) => {
  if (msg.from.id !== adminId) return;
  const userId = parseInt(match[1]);
  adminPanel.rejectUser(bot, adminId, userId);
});

// Broadcast command
bot.onText(/\/broadcast (.+)/, (msg, match) => {
  if (msg.from.id !== adminId) return;
  const message = match[1];
  adminPanel.broadcast(bot, Object.keys(adminPanel.names), message);
  bot.sendMessage(adminId, "✅ Broadcast sent.");
});

// View leaderboard
bot.onText(/\/leaderboard/, (msg) => {
  if (msg.from.id !== adminId) return;
  const text = adminPanel.viewLeaderboard();
  bot.sendMessage(adminId, text, { parse_mode: "Markdown" });
});

// ================= START =================
bot.onText(/\/start/, (msg) => {
  const name = msg.from.first_name || "Player";
  const chatId = msg.chat.id;

  names[chatId] = name;
  users.add(chatId);

  bot.sendMessage(chatId,
`✨ *Welcome to Quiz Arena, ${name}!*
━━━━━━━━━━━━━━━━━━
Compete. Win. Celebrate.

Only *${maxPlayers} seats* per game.
Are you fast enough?`,
{ parse_mode: "Markdown" });

  setTimeout(() => sendPromotion(chatId, name), 1500);
});

// ================= DAILY PROMOTION =================
cron.schedule("0 12 * * *", () => {
  users.forEach(id => {
    sendPromotion(id, names[id] || "Player");
  });
});

// ================= JOIN + ANSWERS =================
bot.on("callback_query", async (query) => {
  const chatId = query.message.chat.id;

  // JOIN QUIZ
  if (query.data === "join_quiz") {
    if (participants.includes(chatId))
      return bot.sendMessage(chatId, "⚠️ You already joined.");

    if (participants.length >= maxPlayers)
      return bot.sendMessage(chatId, "❌ Quiz is full.");

    pendingPayments[chatId] = { time: Date.now() };

    bot.sendMessage(chatId,
`💳 *Secure Your Seat*
━━━━━━━━━━━━━━━━━━
Entry Fee: *$${entryFeeUSD}*

Send payment:

🪙 *USDT*
${cryptoAddresses.USDT}

🪙 *ETH*
${cryptoAddresses.ETH}

🪙 *BNB*
${cryptoAddresses.BNB}

⏳ After payment:
Your seat is confirmed in *5 minutes*.`,
{ parse_mode: "Markdown" });

    bot.answerCallbackQuery(query.id);
    return;
  }

  // ANSWER HANDLING
  if (query.data.includes("|")) {
    const [qIndex, choice] = query.data.split("|");
    const question = currentRound[qIndex];
    const userId = chatId;

    if (!scores[userId]) scores[userId] = 0;
    if (!streaks[userId]) streaks[userId] = 0;

    if (choice === question.a) {
      scores[userId]++;
      streaks[userId]++;

      let msg = "✅ Correct!";
      if (streaks[userId] === 2) msg = "🔥 2x Streak!";
      if (streaks[userId] === 3) msg = "⚡ 3x Combo!";
      if (streaks[userId] >= 4) msg = "💥 UNSTOPPABLE!";

      bot.answerCallbackQuery(query.id, { text: msg });
    } else {
      streaks[userId] = 0;
      bot.answerCallbackQuery(query.id, { text: "❌ Wrong!" });
    }
  }
});

// ================= ADMIN APPROVE =================
bot.onText(/\/approve (\d+)/, (msg, match) => {
  if (msg.from.id !== adminId) return;

  const chatId = parseInt(match[1]);
  if (!pendingPayments[chatId])
    return bot.sendMessage(adminId, "No pending payment.");

  delete pendingPayments[chatId];
  participants.push(chatId);
  scores[chatId] = 0;
  streaks[chatId] = 0;

  bot.sendMessage(chatId,
`✅ *Seat Confirmed!*
Get ready for tonight’s quiz.`,
{ parse_mode: "Markdown" });

  bot.sendMessage(adminId, `User ${chatId} approved.`);
});

// ================= QUIZ SCHEDULER =================
cron.schedule("0 21 * * *", () => {
  if (participants.length === 0) return;
  startQuizAll();
});

// ================= QUIZ LOGIC =================
let currentRound = [];

async function startQuizAll() {
  for (let id of participants) {
    await bot.sendMessage(id, "🎮 *Quiz starting in...*", { parse_mode: "Markdown" });
    await delay(1000);
    await bot.sendMessage(id, "3️⃣");
    await delay(1000);
    await bot.sendMessage(id, "2️⃣");
    await delay(1000);
    await bot.sendMessage(id, "1️⃣");
    await delay(1000);
    await bot.sendMessage(id, "🚀 *GO!*", { parse_mode: "Markdown" });
  }

  currentRound = [...questions]
    .sort(() => 0.5 - Math.random())
    .slice(0, 5);

  for (let i = 0; i < currentRound.length; i++) {
    const q = currentRound[i];

    const keyboard = {
      reply_markup: {
        inline_keyboard: q.choices.map(c => [
          { text: c, callback_data: `${i}|${c}` }
        ])
      }
    };

    participants.forEach(chatId =>
      bot.sendMessage(chatId,
`❓ *Question ${i + 1}*
${q.q}`,
{
  parse_mode: "Markdown",
  ...keyboard
})
    );

    await delay(questionTime * 1000);
    sendLeaderboard();
  }

  announceWinner();
}

function delay(ms) {
  return new Promise(r => setTimeout(r, ms));
}

// ================= LEADERBOARD =================
function sendLeaderboard() {
  let text = "🏆 *LIVE RANKINGS*\n━━━━━━━━━━━━━━━━━━\n";
  const sorted = Object.entries(scores).sort((a,b) => b[1]-a[1]);

  sorted.forEach(([id, score], i) => {
    let medal = "🎮";
    if (i === 0) medal = "🥇";
    if (i === 1) medal = "🥈";
    if (i === 2) medal = "🥉";

    text += `${medal} *${names[id] || "Player"}* — ${score} pts\n`;
  });

  participants.forEach(id =>
    bot.sendMessage(id, text, { parse_mode: "Markdown" })
  );
}

// ================= WINNER =================
function announceWinner() {
  const maxScore = Math.max(...Object.values(scores));
  const winners = Object.keys(scores).filter(k => scores[k] === maxScore);
  const winner = winners[Math.floor(Math.random()*winners.length)];

  bot.sendMessage(winner,
`🏆 *CHAMPION!*
━━━━━━━━━━━━━━━━━━
Congratulations *${names[winner]}*

You won *$${prizeUSD}* 🎉

🔥 *VIP QUIZ unlocked*
Entry: $10
Prize: $100`,
{ parse_mode: "Markdown" });

  sendLeaderboard();
  participants = [];
  scores = {};
  streaks = {};
}
