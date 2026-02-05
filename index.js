require("dotenv").config();
const TelegramBot = require("node-telegram-bot-api");
const fs = require("fs");
const cron = require("node-cron");

// ================= CONFIG =================
const bot = new TelegramBot(process.env.BOT_TOKEN, { polling: true });
const ADMIN_ID = Number(process.env.ADMIN_ID);

const STANDARD_FEE = 5;
const VIP_FEE = 10;

const STANDARD_PRIZE = 35;
const VIP_PRIZE = 100;

const MAX_PLAYERS = 10;
const COOLDOWN = 1500;

// ================= STORAGE =================
const PROFILE_DB = "./profiles.json";
if (!fs.existsSync(PROFILE_DB)) fs.writeFileSync(PROFILE_DB, "{}");
let profiles = JSON.parse(fs.readFileSync(PROFILE_DB));

const QUESTIONS = JSON.parse(fs.readFileSync("./questions.json"));

function saveProfiles() {
  fs.writeFileSync(PROFILE_DB, JSON.stringify(profiles, null, 2));
}

// ================= STATE =================
let participants = [];
let vipParticipants = [];
let pendingPayments = {}; // keys as STRING
let lastAction = {};
let couples = [];
let activeGame = false;
let currentQuestions = {};

// ================= UTIL =================
function antiSpam(chatId) {
  const now = Date.now();
  if (lastAction[chatId] && now - lastAction[chatId] < COOLDOWN) return false;
  lastAction[chatId] = now;
  return true;
}

function getProfile(id, name) {
  if (!profiles[id]) {
    profiles[id] = {
      id,
      name,
      games: 0,
      wins: 0,
      vip: false,
      title: "🌱 New Soul"
    };
    saveProfiles();
  }
  return profiles[id];
}

// ================= START =================
bot.onText(/\/start/, (msg) => {
  const id = msg.chat.id;
  const name = msg.from.first_name || "Player";
  getProfile(id, name);

  const text = `
✨ *WELCOME TO QUIZ ARENA ELITE* ✨
━━━━━━━━━━━━━━━━━━
🎮 Not just a game… an *experience* you'll never forget!  

💎 *VIP ACCESS*  
━━━━━━━━━━━━━━━━━━
💵 $10 USDT  
📥 ${process.env.USDT_ADDRESS}Wow  

💌 Private games & chat  
🏆 Bigger prizes & exclusive rewards  
💖 Feel the *luxury & thrill* of VIP  
🔥 Limited seats — only the sharpest make it!  

💳 *STANDARD ENTRY*  
━━━━━━━━━━━━━━━━━━
💵 $5 USDT  
📥 ${process.env.USDT_ADDRESS}Wow  

🎯 Quick, fun, and electrifying  
⏳ Once paid, wait for approval  
💡 Every game could turn into *epic wins*!  

💌 Choose your adventure below and join the excitement!`;

  bot.sendMessage(id, text, {
    parse_mode: "Markdown",
    reply_markup: {
      inline_keyboard: [
        [{ text: "💳 Join Standard", callback_data: "join_standard" }],
        [{ text: "💎 Join VIP", callback_data: "join_vip" }]
      ]
    }
  });
});

// ================= JOIN =================
bot.on("callback_query", async (q) => {
  const id = String(q.message.chat.id); // store as STRING
  if (!antiSpam(id)) return bot.answerCallbackQuery(q.id, { text: "⏳ Slow down, superstar!" });

  if (q.data === "join_standard") {
    pendingPayments[id] = { type: "standard" };
    return bot.sendMessage(id,
`💳 *STANDARD ENTRY* — Adventure begins!  
━━━━━━━━━━━━━━━━━━  
💵 $5 USDT  
📥 ${process.env.USDT_ADDRESS}Wow  

🎯 Fun, electrifying, and thrilling  
⏳ Wait for approval  
🔥 Let the games begin!  

🎉💖🎮✨🎆🎊💫🎈🌟🔥`, { parse_mode: "Markdown" });
  }

  if (q.data === "join_vip") {
    pendingPayments[id] = { type: "vip" };
    return bot.sendMessage(id,
`💎 *VIP ELITE ACCESS* — Welcome to the inner circle!  
━━━━━━━━━━━━━━━━━━  
💵 $10 USDT  
📥 ${process.env.USDT_ADDRESS}Wow  

💌 Private games & chat  
🏆 Bigger prizes & bragging rights  
💫 Feel luxury, thrill & prestige  
🔥 Limited seats — secure your spot!  

🎆💫🎉🎮🎈💖🔥✨🎊🌟`, { parse_mode: "Markdown" });
  }

  if (q.data.startsWith("answer_")) {
    const [, answerIndex, playerId] = q.data.split("_");
    const qObj = currentQuestions[playerId];
    if (!qObj) return;

    const correct = qObj.a === qObj.choices[Number(answerIndex)];
    bot.answerCallbackQuery(q.id, { text: correct ? "✅ Correct!" : "❌ Wrong!" });

    if (correct) {
      profiles[playerId].wins++;
      saveProfiles();

      const blastMessages = [
        "🎆✨🎉 Boom! You nailed it! 💖",
        "🔥💫🎊 Correct answer! Feel the glory! 🎮",
        "💖🎮🎆 You conquered this one! 🌟🎉",
        "🎊💫🔥 Hooray! Another win for you! 💖",
        "🎇🎈✨ Game on! Correct answer! 🎮"
      ];

      blastMessages.forEach((msgText, i) => {
        setTimeout(() => bot.sendMessage(playerId, msgText), i * 1000);
      });
    }

    delete currentQuestions[playerId];
  }
});

// ================= ADMIN APPROVAL =================
bot.onText(/\/approve (\d+)/, (msg, match) => {
  if (msg.from.id !== ADMIN_ID)
    return bot.sendMessage(msg.chat.id, "❌ Unauthorized");

  const id = match[1]; // STRING key
  const payment = pendingPayments[id];

  if (!payment)
    return bot.sendMessage(msg.chat.id, "⚠️ No pending payment for this user.");

  delete pendingPayments[id];
  const profile = getProfile(Number(id), "Player");

  if (payment.type === "vip") {
    vipParticipants.push(Number(id));
    profile.vip = true;
    profile.title = "💎 VIP Elite";

    bot.sendMessage(Number(id),
`💎 VIP UNLOCKED!  
🏆 Exclusive group access  
💖 Private chat & games await  
🔐 Join VIP Chat: ${process.env.VIP_GROUP_LINK}  

🎆💫🎉🎮🎈💖🔥✨🎊🌟`);
  } else {
    participants.push(Number(id));
    bot.sendMessage(Number(id),
`🎟️ STANDARD ACCESS CONFIRMED  
🌟 Adventure unlocked  
🎮 Every match could turn into epic wins  
🎉💖🎮✨🎆🎊💫🎈🌟🔥`);
  }

  saveProfiles();
  bot.sendMessage(msg.chat.id, `✅ Approved successfully → ${id}`);
});

// ================= QUIZ GAME =================
cron.schedule("0 21 * * *", async () => {
  const players = vipParticipants.length ? vipParticipants : participants;
  if (players.length < 2) return;

  for (const playerId of players) {
    const q = QUESTIONS[Math.floor(Math.random() * QUESTIONS.length)];
    currentQuestions[playerId] = q;

    const choices = q.choices.map((c, i) => [
      { text: c, callback_data: `answer_${i}_${playerId}` }
    ]);

    await bot.sendMessage(playerId,
`🕹️ *QUIZ TIME!*  
━━━━━━━━━━━━━━━━━━
${q.q}`, {
      parse_mode: "Markdown",
      reply_markup: { inline_keyboard: choices }
    });
  }
});

// ================= LEADERBOARD =================
cron.schedule("0 12 * * *", () => {
  const chatId = process.env.LEADERBOARD_CHAT_ID;
  if (!chatId) return;

  const top = Object.values(profiles)
    .sort((a, b) => b.wins - a.wins)
    .slice(0, 10);

  if (!top.length) return;

  let leaderboard = `🏆 *DAILY LEADERBOARD* 🏆\n━━━━━━━━━━━━━━━━━━\n`;
  top.forEach((p, i) => {
    const medal = i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : "✨";
    leaderboard += `${medal} *${p.name}* — ${p.wins} wins\n`;
  });

  leaderboard += `\n🎉💖🎮✨🔥🎊💫🎈🌟`;
  bot.sendMessage(chatId, leaderboard, { parse_mode: "Markdown" });
});
