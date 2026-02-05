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

// ================= START COMMAND =================
bot.onText(/\/start/, async (msg) => {
  const id = msg.chat.id;
  const name = msg.from.first_name || "Player";
  getProfile(id, name);

  const text = `
🌹 *CHOOSE YOUR PATH* 🌹
━━━━━━━━━━━━━━━━━━
💎 *VIP ACCESS* — $10  
💳 *STANDARD ENTRY* — $5  

🔥 Tap below to begin!
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

// ================= CALLBACKS =================
bot.on("callback_query", async (q) => {
  const id = String(q.message.chat.id);

  if (!antiSpam(id))
    return bot.answerCallbackQuery(q.id, {
      text: "⏳ Slow down!"
    });

  // ---------- JOIN STANDARD ----------
  if (q.data === "join_standard") {
    pendingPayments[id] = { type: "standard" };

    return bot.sendMessage(
      id,
      `💳 *STANDARD ENTRY* — $5  
Click below to pay:`,
      {
        parse_mode: "Markdown",
        reply_markup: {
          inline_keyboard: [
            [
              {
                text: "💳 Pay $5",
                url: "https://pay.ziina.com/fienix/ClREPEc08"
              }
            ],
            [
              {
                text: "✅ I Paid",
                callback_data: "paid_standard"
              }
            ]
          ]
        }
      }
    );
  }

  // ---------- JOIN VIP ----------
  if (q.data === "join_vip") {
    pendingPayments[id] = { type: "vip" };
    await sendVIPWelcome(id);

    return bot.sendMessage(
      id,
      `💎 *VIP ACCESS* — $10  
Click below to pay:`,
      {
        parse_mode: "Markdown",
        reply_markup: {
          inline_keyboard: [
            [
              {
                text: "💎 Pay $10",
                url: "https://pay.ziina.com/fienix/71k3VbAv0"
              }
            ],
            [
              {
                text: "✅ I Paid",
                callback_data: "paid_vip"
              }
            ]
          ]
        }
      }
    );
  }

  // ---------- USER PRESSED "I PAID" ----------
  if (q.data === "paid_standard" || q.data === "paid_vip") {
    const payment = pendingPayments[id];
    if (!payment)
      return bot.sendMessage(id, "⚠️ No payment found.");

    const profile = getProfile(id, q.from.first_name || "Player");

    // notify admin
    bot.sendMessage(
      ADMIN_ID,
      `💰 Payment request
User: ${profile.name}
ID: ${id}
Plan: ${payment.type.toUpperCase()}`,
      {
        reply_markup: {
          inline_keyboard: [
            [
              {
                text: "✅ Approve",
                callback_data: `approve_${id}`
              }
            ]
          ]
        }
      }
    );

    return bot.sendMessage(
      id,
      "⏳ Payment submitted! Waiting for admin approval."
    );
  }

  // ---------- ADMIN APPROVE BUTTON ----------
  if (q.data.startsWith("approve_")) {
    if (q.from.id !== ADMIN_ID)
      return bot.answerCallbackQuery(q.id, { text: "Unauthorized" });

    const userId = q.data.split("_")[1];
    const payment = pendingPayments[userId];
    if (!payment) return;

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
    bot.sendMessage(ADMIN_ID, `✅ Approved → ${userId}`);
  }

  // ---------- COUPLES CHAT ----------
  if (q.data === "couples_request") {
    if (!hasAccess(id)) {
      return bot.sendMessage(
        id,
        "🔒 Couples Chat locked. Buy Standard or VIP."
      );
    }

    bot.sendMessage(id, "💌 Waiting for partner...");
    const waiting = Object.entries(couples).find(
      ([uid, paired]) => !paired && uid !== id
    );

    if (waiting) {
      const [otherId] = waiting;
      couples[id] = otherId;
      couples[otherId] = id;

      bot.sendMessage(id, `💖 Paired with ${profiles[otherId].name}`);
      bot.sendMessage(otherId, `💖 Paired with ${profiles[id].name}`);
    } else {
      couples[id] = null;
    }
  }

  // ---------- MINI GAME ----------
  if (q.data === "mini_game") {
    if (!hasAccess(id)) {
      return bot.sendMessage(
        id,
        "🔒 Mini Game locked. Buy access first."
      );
    }

    bot.sendMessage(id, "🎲 Guess number 1-5!");
    miniGamesActive[id] = {
      target: Math.floor(Math.random() * 5) + 1
    };
  }
});
