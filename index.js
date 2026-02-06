require("dotenv").config();
const TelegramBot = require("node-telegram-bot-api");
const fs = require("fs");
const cron = require("node-cron");
const axios = require("axios");

// ================= CONFIG =================
const bot = new TelegramBot(process.env.BOT_TOKEN, { polling: true });
const ADMIN_ID = Number(process.env.ADMIN_ID);

const STANDARD_FEE = 5;
const VIP_FEE = 10;
const COOLDOWN = 1500;

// ================= STORAGE =================
const PROFILE_DB = "./profiles.json";
if (!fs.existsSync(PROFILE_DB)) fs.writeFileSync(PROFILE_DB, "{}");
let profiles = JSON.parse(fs.readFileSync(PROFILE_DB));
const QUESTIONS = JSON.parse(fs.readFileSync("./questions.json"));

// ================= STATE =================
let participants = [];
let vipParticipants = [];
let pendingPayments = {};
let lastAction = {};
let currentQuestions = {};
let couples = {};
let miniGamesActive = {};

// ================= UTIL =================
function saveProfiles() {
  fs.writeFileSync(PROFILE_DB, JSON.stringify(profiles, null, 2));
}

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
      standard: false,
      title: "🌱 New Soul"
    };
    saveProfiles();
  }
  return profiles[id];
}

function hasAccess(id) {
  const p = profiles[id];
  return p && (p.vip || p.standard);
}

// ================= PREMIUM ANIMATIONS =================
async function sendVIPWelcome(userId) {
  const gifs = [
    "https://media.giphy.com/media/3oEjI6SIIHBdRxXI40/giphy.gif",
    "https://media.giphy.com/media/l4pTfx2qLszoacZRS/giphy.gif"
  ];
  const gif = gifs[Math.floor(Math.random() * gifs.length)];
  await bot.sendAnimation(userId, gif, {
    caption: "💎 Welcome VIP! Enjoy luxury, thrill & love 🌹✨"
  });
}

// ================= ROMANTIC STICKER =================
async function sendRomanticSticker(userId) {
  const stickers = [
    "CAACAgIAAxkBAAEBH0VgB7-rJfOvR1HMPmjV1nbRvhPq5gAC0QIAAswAA7Vtr1bJGFJK7z1pS8E",
    "CAACAgIAAxkBAAEBH0dgB7-sK1t8tz3JrZ8ChgXo9e3RRAAC0wIAAswAA7Vtr1aeX56zjOxti8E"
  ];
  const sticker = stickers[Math.floor(Math.random() * stickers.length)];
  await bot.sendSticker(userId, sticker);
}

// ================= START COMMAND =================
bot.onText(/\/start/, async (msg) => {
  const id = msg.chat.id;
  const name = msg.from.first_name || "Player";
  const profile = getProfile(id, name);

  const text = `🎮 Not just a game… an *experience* you'll never forget!  
💖✨🔥💫🎉🎊🎈🌟🎆💌  

💎 *VIP ACCESS*  
💵 $10 USDT  
📥 ${process.env.USDT_ADDRESS}Wow  
💌 Private games & couples chat  
🏆 Bigger prizes & exclusive rewards  
💖 Feel the *luxury & thrill* of VIP  
🔥 Limited seats — only the sharpest make it!  

💳 *STANDARD ENTRY*  
💵 $5 USDT  
📥 ${process.env.USDT_ADDRESS}Wow  
🎯 Quick, fun, electrifying  

💌 Choose your adventure below! 🌹🎉✨  
🚀 Single line of excitement: Let the games begin! 🌟💖

💡 Hint: Upgrade to Standard or VIP to unlock *Couples Chat* & *Mini Games*!`;

  bot.sendMessage(id, text, {
    parse_mode: "Markdown",
    reply_markup: {
      inline_keyboard: [
        [{ text: "💳 Join Standard", callback_data: "join_standard" }],
        [{ text: "💎 Join VIP", callback_data: "join_vip" }],
        [{ text: profile.vip || profile.standard ? "💌 Couples Chat" : "💌 Couples Chat (VIP Only)", callback_data: profile.vip || profile.standard ? "couples_request" : "no_access" }],
        [{ text: profile.vip || profile.standard ? "🎲 Mini Game Fun" : "🎲 Mini Game (VIP Only)", callback_data: profile.vip || profile.standard ? "mini_game" : "no_access" }]
      ]
    }
  });
});


// ================= PAYMENT (Zina) =================
async function generateZinaLink(userId, amount, type) {
  try {
    const resp = await axios.post("https://api.zina.io/v1/payment-link", {
      publicKey: process.env.ZINA_API_KEY,
      amount: amount,
      currency: "USDT",
      callbackUrl: "https://yourserver.com/payment_callback"
    });
    pendingPayments[String(userId)] = { type, link: resp.data.paymentUrl };
    return resp.data.paymentUrl;
  } catch (e) {
    console.error(e);
    return null;
  }
}

// ================= CALLBACK QUERY =================
bot.on("callback_query", async (q) => {
  const id = String(q.message.chat.id);
  if (!antiSpam(id)) return bot.answerCallbackQuery(q.id, { text: "⏳ Slow down, superstar!" });

  // --- NO ACCESS BUTTON ---
  if (q.data === "no_access") {
    return bot.answerCallbackQuery(q.id, { text: "💎 Upgrade your account to unlock this feature!" });
  }

  // --- JOIN STANDARD ---
  if (q.data === "join_standard") {
    const link = await generateZinaLink(id, STANDARD_FEE, "standard");
    if (!link) return bot.sendMessage(id, "⚠️ Payment link could not be generated. Try again later.");

    return bot.sendMessage(id,
`💳 *STANDARD ENTRY* — Adventure begins!  
💵 $5 USDT  
📥 ${process.env.USDT_ADDRESS}Wow  
🎯 Fun, electrifying, and thrilling  
⏳ Wait for approval  
🔥 Let the games begin!  

🎉💖🎮✨🎆🎊💫🎈🌟🔥
Pay here: [Click to Pay](${link.replace(/([()])/g, '\\$1')})`,
{ parse_mode: "MarkdownV2", disable_web_page_preview: false });
  }

  // --- JOIN VIP ---
  if (q.data === "join_vip") {
    const link = await generateZinaLink(id, VIP_FEE, "vip");
    if (!link) return bot.sendMessage(id, "⚠️ Payment link could not be generated. Try again later.");
    await sendVIPWelcome(Number(id));

    return bot.sendMessage(id,
`💎 *VIP ELITE ACCESS* — Welcome to the inner circle!  
💵 $10 USDT  
📥 ${process.env.USDT_ADDRESS}Wow  
💌 Private games & chat  
🏆 Bigger prizes & bragging rights  
💫 Feel luxury, thrill & prestige  
🔥 Limited seats — secure your spot!  

🎆💫🎉🎮🎈💖🔥✨🎊🌟
Pay here: [Click to Pay](${link.replace(/([()])/g, '\\$1')})`,
{ parse_mode: "MarkdownV2", disable_web_page_preview: false });
  }

  // --- COUPLES CHAT ---
  if (q.data === "couples_request") {
    if (!hasAccess(Number(id))) {
      return bot.answerCallbackQuery(q.id, { text: "💎 Upgrade to VIP/Standard to use Couples Chat!" });
    }

    bot.sendMessage(id, "💌 Couples Chat Request received! Waiting for pairing… 💖🌹✨");
    const waiting = Object.entries(couples).find(([uid, paired]) => !paired && uid !== id);
    if (waiting) {
      const [otherId] = waiting;
      couples[id] = otherId;
      couples[otherId] = id;

      bot.sendMessage(Number(id), `💖 You are paired with ${profiles[otherId].name}! Start your secret chat 💌`);
      bot.sendMessage(Number(otherId), `💖 You are paired with ${profiles[id].name}! Start your secret chat 💌`);

      const videoLink = `https://yourserver.com/video_call/${id}_${otherId}`;
      bot.sendMessage(Number(id), `🎥 Secret video call link: [Click to Join](${videoLink})`);
      bot.sendMessage(Number(otherId), `🎥 Secret video call link: [Click to Join](${videoLink})`);
    } else {
      couples[id] = null;
      bot.sendMessage(id, "⏳ Waiting for another player to pair…");
    }
  }

  // --- MINI GAME ---
  if (q.data === "mini_game") {
    if (!hasAccess(Number(id))) {
      return bot.answerCallbackQuery(q.id, { text: "🎲 Upgrade to VIP/Standard to play Mini Games!" });
    }

    bot.sendMessage(id, "🎲 Mini Game! Guess a number 1-5. Reply with your guess!");
    miniGamesActive[id] = { target: Math.floor(Math.random() * 5) + 1 };
  }

  // --- QUIZ ANSWERS ---
  if (q.data.startsWith("answer_")) {
    const [, answerIndex, playerId] = q.data.split("_");
    const qObj = currentQuestions[playerId];
    if (!qObj) return;

    const correct = qObj.a === qObj.choices[Number(answerIndex)];
    bot.answerCallbackQuery(q.id, { text: correct ? "✅ Correct!" : "❌ Wrong!" });

    if (correct) {
      profiles[playerId].wins++;
      saveProfiles();
      await sendRomanticSticker(playerId);

      const blastMessages = [
        "🎆✨🎉 Boom! You nailed it! 💖",
        "🔥💫🎊 Correct answer! Feel the glory! 🎮",
        "💖🎮🎆 You conquered this one! 🌟🎉",
        "🎊💫🔥 Hooray! Another win for you! 💖",
        "🎇🎈✨ Game on! Correct answer! 🎮"
      ];

      blastMessages.forEach((msgText, i) => setTimeout(() => bot.sendMessage(playerId, msgText), i * 1000));
    }

    delete currentQuestions[playerId];
  }
});

// ================= MINI GAME MESSAGE HANDLER =================
bot.on("message", (msg) => {
  const id = String(msg.chat.id);

  if (miniGamesActive[id]) {
    const guess = parseInt(msg.text);
    const target = miniGamesActive[id].target;
    if (guess === target) {
      bot.sendMessage(id, `🎉 Amazing! Correct guess: ${target} 💫🔥💖`);
      sendRomanticSticker(id);
      profiles[id].wins++;
      saveProfiles();
    } else {
      bot.sendMessage(id, `❌ Wrong! It was ${target} 💔✨ Try again later!`);
    }
    delete miniGamesActive[id];
  }

  if (couples[id]) {
    const pairedId = couples[id];
    if (pairedId) bot.sendMessage(pairedId, `💌 From ${profiles[id].name}: ${msg.text}`);
  }
});

// ================= ADMIN COMMANDS =================
bot.onText(/\/approve (\d+)/, (msg, match) => {
  if (msg.from.id !== ADMIN_ID) return bot.sendMessage(msg.chat.id, "❌ Unauthorized");

  const userId = String(match[1]);
  const payment = pendingPayments[userId];
  if (!payment) return bot.sendMessage(msg.chat.id, "⚠️ No pending payment for this user.");

  delete pendingPayments[userId];
  const profile = getProfile(Number(userId), "Player");

  if (payment.type === "vip") {
    vipParticipants.push(Number(userId));
    profile.vip = true;
    profile.title = "💎 VIP Elite";
    bot.sendMessage(Number(userId), `💎 VIP UNLOCKED! Join VIP chat: ${process.env.VIP_GROUP_LINK}`);
  } else {
    participants.push(Number(userId));
    profile.standard = true;
    bot.sendMessage(Number(userId), "🎟️ STANDARD ACCESS CONFIRMED! Adventure unlocked! 🌟💖");
  }

  saveProfiles();
  bot.sendMessage(msg.chat.id, `✅ Approved → ${userId}`);
});

bot.onText(/\/pending/, (msg) => {
  if (msg.from.id !== ADMIN_ID) return;
  const list = Object.keys(pendingPayments);
  if (!list.length) return bot.sendMessage(msg.chat.id, "No pending payments.");
  let text = "⚡ Pending payments:\n\n";
  list.forEach((id, i) => { const name = profiles[id]?.name || "Unknown"; text += `${i + 1}. ${name} — ID: ${id}\n`; });
  bot.sendMessage(msg.chat.id, text);
});

// ================= QUIZ GAME =================
cron.schedule("0 21 * * *", async () => {
  const players = vipParticipants.length ? vipParticipants : participants;
  if (players.length < 2) return;

  for (const playerId of players) {
    const q = QUESTIONS[Math.floor(Math.random() * QUESTIONS.length)];
    currentQuestions[playerId] = q;

    const choices = q.choices.map((c, i) => [{ text: c, callback_data: `answer_${i}_${playerId}` }]);
    await bot.sendMessage(playerId,
`🕹️ *QUIZ TIME!*  
━━━━━━━━━━━━━━━━━━
${q.q}`, { parse_mode: "Markdown", reply_markup: { inline_keyboard: choices } });
  }
});

// ================= LEADERBOARD =================
cron.schedule("0 12 * * *", () => {
  const chatId = process.env.LEADERBOARD_CHAT_ID;
  if (!chatId) return;

  const top = Object.values(profiles).sort((a, b) => b.wins - a.wins).slice(0, 10);
  if (!top.length) return;

  let leaderboard = `🏆 *DAILY LEADERBOARD* 🏆\n━━━━━━━━━━━━━━━━━━\n`;
  top.forEach((p, i) => {
    const medal = i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : "✨";
    leaderboard += `${medal} *${p.name}* — ${p.wins} wins\n`;
  });
  leaderboard += `\n🎉💖🎮✨🔥🎊💫🎈🌟`;
  bot.sendMessage(chatId, leaderboard, { parse_mode: "Markdown" });
});
