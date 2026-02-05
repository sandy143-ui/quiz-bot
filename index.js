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
let pendingPayments = {};

// =================== Start Command ===================
bot.onText(/\/start/, (msg) => {
  const chatId = msg.chat.id;

  const promoMessage = `
🎮 *WELCOME TO QUIZ NIGHT LIVE!*

🔥 The most exciting knowledge battle on Telegram!

💰 *Entry Fee:* $${entryFeeUSD}
🏆 *Grand Prize:* $${prizeUSD}
👥 *Players:* Max ${maxPlayers}
⏱ *Fast-paced questions with live leaderboard!*

Think you’re the smartest in the room?  
Prove it and win real rewards!

👉 Type /join to reserve your seat now!
`;

  bot.sendMessage(chatId, promoMessage, { parse_mode: "Markdown" });
});

// =================== Join Command ===================
bot.onText(/\/join/, (msg) => {
  const chatId = msg.chat.id;

  if (participants.includes(chatId))
    return bot.sendMessage(chatId, "⚠️ You’re already in the game!");

  if (participants.length >= maxPlayers)
    return bot.sendMessage(chatId, "❌ All seats are taken for tonight’s quiz.");

  pendingPayments[chatId] = { timestamp: Date.now() };

  const paymentMsg = `
💳 *QUIZ ENTRY PAYMENT*

Entry Fee: *$${entryFeeUSD}*

Send the fee to any of the addresses below:

🪙 *USDT:* 
${cryptoAddresses.USDT}

💎 *ETH:* 
${cryptoAddresses.ETH}

🟡 *BNB:* 
${cryptoAddresses.BNB}

⏳ After payment, wait for admin approval.

Your ID:
\`${chatId}\`

Admin will approve using:
/approve ${chatId}
`;

  bot.sendMessage(chatId, paymentMsg, { parse_mode: "Markdown" });
});

// =================== Admin Approve ===================
bot.onText(/\/approve (\d+)/, (msg, match) => {
  if (msg.from.id !== adminId) return;

  const chatId = parseInt(match[1]);
  if (!pendingPayments[chatId])
    return bot.sendMessage(adminId, "No pending payment for this user.");

  delete pendingPayments[chatId];
  participants.push(chatId);
  scores[chatId] = 0;

  bot.sendMessage(chatId,
    "✅ *Payment confirmed!*\n\n🎉 You’re officially in tonight’s Quiz Night!\nGet ready...",
    { parse_mode: "Markdown" }
  );

  bot.sendMessage(adminId, `User ${chatId} approved.`);
});

// =================== Scheduled Quiz ===================
cron.schedule("0 21 * * *", () => { // 9 PM daily
  if (participants.length === 0) return;
  startQuizAll();
});

// =================== Start Quiz ===================
async function startQuizAll() {
  bot.sendMessage(adminId, `🎬 Quiz starting for ${participants.length} players!`);

  for (let i = 0; i < questions.length; i++) {
    const q = questions[i];

    const keyboard = {
      reply_markup: {
        inline_keyboard: q.choices.map(c => [
          { text: c, callback_data: `${i}|${c}` }
        ])
      }
    };

    const questionText = `
🎯 *Question ${i + 1}*
${q.q}

⏱ You have ${questionTime} seconds!
`;

    participants.forEach(chatId => {
      bot.sendMessage(chatId, questionText, {
        ...keyboard,
        parse_mode: "Markdown"
      });
    });

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

  let leaderboard = "📊 *LIVE LEADERBOARD*\n\n";

  const sorted = Object.entries(scores).sort((a, b) => b[1] - a[1]);

  sorted.forEach(([id, score], index) => {
    const medal =
      index === 0 ? "🥇" :
      index === 1 ? "🥈" :
      index === 2 ? "🥉" : "🔹";

    leaderboard += `${medal} Player ${id}: ${score} pts\n`;
  });

  participants.forEach(id => {
    bot.sendMessage(id, leaderboard, { parse_mode: "Markdown" });
  });
}

// =================== Announce Winner ===================
function announceWinner() {
  if (participants.length === 0) return;

  const maxScore = Math.max(...Object.values(scores));
  const winners = Object.keys(scores).filter(k => scores[k] === maxScore);
  const winnerChatId = winners[Math.floor(Math.random() * winners.length)];

  bot.sendMessage(winnerChatId, `
🏆 *CONGRATULATIONS!*
You are tonight’s Quiz Champion!

💰 Prize: *$${prizeUSD}*
`,
    { parse_mode: "Markdown" }
  );

  sendLiveLeaderboard();

  participants = [];
  scores = {};
}
