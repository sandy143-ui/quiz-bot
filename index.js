require("dotenv").config();
const TelegramBot = require("node-telegram-bot-api");
const fs = require("fs");
const cron = require("node-cron");
const axios = require("axios");

// ================= CONFIG =================
const bot = new TelegramBot(process.env.BOT_TOKEN, { polling: true });
const ADMIN_ID = Number(process.env.ADMIN_ID);

const STANDARD_FEE = 5; // USDT
const VIP_FEE = 10; // USDT
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
      standard: false,   // added
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

async function sendRomanticSticker(userId) {
  const stickers = [
    "CAACAgIAAxkBAAEBHxlkFlI2xk2G5rHk2Lq_2JZgU4CNlAACaQADVp29Ck8HCbMvFq6lIwQ",
    "CAACAgIAAxkBAAEBHxpkl1w1CjN3Jg5Ywq6n5oQ8Q5eTvAACawADVp29CkuqqbFFp8zwIwQ"
  ];
  const sticker = stickers[Math.floor(Math.random() * stickers.length)];
  await bot.sendSticker(userId, sticker);
}

// ================= START COMMAND =================
bot.onText(/\/start/, async (msg) => {
  const id = msg.chat.id;
  const name = msg.from.first_name || "Player";
  getProfile(id, name);

  const gifs = [
    "https://media.giphy.com/media/3o6ZtpxSZbQRRnwCKQ/giphy.gif",
    "https://media.giphy.com/media/26tOZ42Mg6pbTUPHW/giphy.gif",
    "https://media.giphy.com/media/xUPGcguWZHRC2HyBRS/giphy.gif"
  ];
  const gif = gifs[Math.floor(Math.random() * gifs.length)];
  await bot.sendAnimation(id, gif, {
    caption:
      "✨ Welcome to *QUIZ ARENA ELITE* ✨\nYour adventure begins now! 💖🎮🔥",
    parse_mode: "Markdown"
  });

  const text = `
🌹 *CHOOSE YOUR PATH* 🌹
━━━━━━━━━━━━━━━━━━
💎 *VIP ACCESS* — $10 USDT  
🎁 Private games & couples chat  
🏆 Bigger prizes & exclusive rewards  
💖 Feel luxury & thrill  

💳 *STANDARD ENTRY* — $5 USDT  
🎯 Quick, fun, electrifying  

💌 Couples Chat & Secret Video Call 💖  
🎲 Mini-games & Quizzes  

🔥 *Tap an option below to start your adventure!* 🔥
`;

  await bot.sendMessage(id, text, {
    parse_mode: "Markdown",
    reply_markup: {
      inline_keyboard: [
        [{ text: "💳 Join Standard", callback_data: "join_standard" }],
        [{ text: "💎 Join VIP", callback_data: "join_vip" }],
        [{ text: "💌 Couples Chat", callback_data: "couples_request" }],
        [{ text: "🎲 Mini Game Fun", callback_data: "mini_game" }]
      ]
    }
  });
});

// ================= PAYMENT =================
async function generateZinaLink(userId, amount, type) {
  try {
    const resp = await axios.post("https://api.zina.io/v1/payment-link", {
      publicKey: process.env.ZINA_API_KEY,
      amount,
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
  if (!antiSpam(id))
    return bot.answerCallbackQuery(q.id, {
      text: "⏳ Slow down, superstar!"
    });

  // ---------- JOIN STANDARD ----------
  if (q.data === "join_standard") {
    const link = await generateZinaLink(id, STANDARD_FEE, "standard");
    return bot.sendMessage(
      id,
      `💳 *STANDARD ENTRY* — Adventure begins!  
━━━━━━━━━━━━━━━━━━  
💵 $5 USDT  
📥 ${process.env.USDT_ADDRESS}Wow  
🎯 Fun, electrifying, and thrilling  
⏳ Wait for approval  

🎉💖🎮✨🎆🎊💫🎈🌟🔥
Pay here: [Click to Pay](${link})`,
      { parse_mode: "Markdown", disable_web_page_preview: true }
    );
  }

  // ---------- JOIN VIP ----------
  if (q.data === "join_vip") {
    const link = await generateZinaLink(id, VIP_FEE, "vip");
    await sendVIPWelcome(id);
    return bot.sendMessage(
      id,
      `💎 *VIP ELITE ACCESS* — Welcome to the inner circle!  
━━━━━━━━━━━━━━━━━━  
💵 $10 USDT  
📥 ${process.env.USDT_ADDRESS}Wow  
💌 Private games & chat  
🏆 Bigger prizes & bragging rights  
💫 Feel luxury, thrill & prestige  

🎆💫🎉🎮🎈💖🔥✨🎊🌟
Pay here: [Click to Pay](${link})`,
      { parse_mode: "Markdown", disable_web_page_preview: true }
    );
  }

  // ---------- COUPLES CHAT (LOCKED) ----------
  if (q.data === "couples_request") {
    if (!hasAccess(id)) {
      return bot.sendMessage(
        id,
        "🔒 Couples Chat is locked.\nPlease purchase Standard or VIP access first."
      );
    }

    bot.sendMessage(id, "💌 Couples Chat Request received! Waiting for pairing… 💖🌹✨");

    const waiting = Object.entries(couples).find(
      ([uid, paired]) => !paired && uid !== id
    );

    if (waiting) {
      const [otherId] = waiting;
      couples[id] = otherId;
      couples[otherId] = id;

      bot.sendMessage(id, `💖 Paired with ${profiles[otherId].name}! Start secret chat 💌`);
      bot.sendMessage(otherId, `💖 Paired with ${profiles[id].name}! Start secret chat 💌`);
    } else {
      couples[id] = null;
      bot.sendMessage(id, "⏳ Waiting for another player…");
    }
  }

  // ---------- MINI GAME (LOCKED) ----------
  if (q.data === "mini_game") {
    if (!hasAccess(id)) {
      return bot.sendMessage(
        id,
        "🔒 Mini Game is locked.\nPurchase Standard or VIP to play."
      );
    }

    bot.sendMessage(id, "🎲 Mini Game! Guess a number 1-5. Reply with your guess!");
    miniGamesActive[id] = {
      target: Math.floor(Math.random() * 5) + 1
    };
  }
});

// ================= ADMIN =================
bot.onText(/\/approve (\d+)/, (msg, match) => {
  if (msg.from.id !== ADMIN_ID)
    return bot.sendMessage(msg.chat.id, "❌ Unauthorized");

  const userId = String(match[1]);
  const payment = pendingPayments[userId];
  if (!payment)
    return bot.sendMessage(msg.chat.id, "⚠️ No pending payment.");

  delete pendingPayments[userId];
  const profile = getProfile(Number(userId), "Player");

  if (payment.type === "vip") {
    profile.vip = true;
    profile.title = "💎 VIP Elite";
    bot.sendMessage(userId, "💎 VIP UNLOCKED!");
  } else {
    profile.standard = true;
    bot.sendMessage(userId, "🎟️ STANDARD ACCESS CONFIRMED!");
  }

  saveProfiles();
  bot.sendMessage(msg.chat.id, `✅ Approved → ${userId}`);
});
