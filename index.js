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
const profiles = JSON.parse(fs.readFileSync(PROFILE_DB));

function saveProfiles() {
  fs.writeFileSync(PROFILE_DB, JSON.stringify(profiles, null, 2));
}

// ================= STATE =================
let participants = [];
let vipParticipants = [];
let pendingPayments = {};
let lastAction = {};
let couples = [];
let activeGame = false;

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

  bot.sendMessage(id,
`✨ *WELCOME TO QUIZ ARENA ELITE*
━━━━━━━━━━━━━━━━━━
This is not just a game.
It’s an experience.

🎟️ Standard — $5
💎 VIP — $10 (private games + prizes)

Choose how you want to play 👇`,
{
  parse_mode: "Markdown",
  reply_markup: {
    inline_keyboard: [
      [{ text: "🎟️ Join Standard", callback_data: "join_standard" }],
      [{ text: "💎 Join VIP", callback_data: "join_vip" }]
    ]
  }
});
});

// ================= JOIN =================
bot.on("callback_query", async (q) => {
  const id = q.message.chat.id;
  if (!antiSpam(id)) return bot.answerCallbackQuery(q.id, { text: "⏳ Slow down" });

  // JOIN STANDARD
  if (q.data === "join_standard") {
    pendingPayments[id] = { type: "standard" };
    return bot.sendMessage(id,
`💳 *STANDARD ENTRY*
━━━━━━━━━━━━━━━━━━
💵 $5 USDT
📥 ${process.env.USDT_ADDRESS}

Once paid, wait for approval.`,
{ parse_mode: "Markdown" });
  }

  // JOIN VIP
  if (q.data === "join_vip") {
    pendingPayments[id] = { type: "vip" };
    return bot.sendMessage(id,
`💎 *VIP ACCESS*
━━━━━━━━━━━━━━━━━━
💵 $10 USDT
📥 ${process.env.USDT_ADDRESS}

Private games.
Private chat.
Bigger prizes.`,
{ parse_mode: "Markdown" });
  }
});

// ================= ADMIN APPROVAL =================
bot.onText(/\/approve (\d+)/, (msg, match) => {
  if (msg.from.id !== ADMIN_ID) return;
  const id = Number(match[1]);
  const payment = pendingPayments[id];
  if (!payment) return;

  delete pendingPayments[id];
  const profile = getProfile(id, "Player");

  if (payment.type === "vip") {
    vipParticipants.push(id);
    profile.vip = true;
    profile.title = "💎 VIP Elite";
    bot.sendMessage(id, "💎 VIP unlocked. Welcome to the inner circle.");
    bot.sendMessage(id, `🔐 Join VIP Chat:\nhttps://t.me/+${process.env.VIP_GROUP_ID}`);
  } else {
    participants.push(id);
    bot.sendMessage(id, "🎟️ Standard access confirmed.");
  }

  saveProfiles();
});

// ================= MATCHMAKING =================
function createCouples(list) {
  couples = [];
  const shuffled = [...list].sort(() => Math.random() - 0.5);
  for (let i = 0; i < shuffled.length; i += 2) {
    if (shuffled[i + 1]) couples.push([shuffled[i], shuffled[i + 1]]);
  }
}

// ================= GAME START =================
cron.schedule("0 21 * * *", () => {
  if (participants.length < 2 && vipParticipants.length < 2) return;
  activeGame = true;

  createCouples(vipParticipants.length ? vipParticipants : participants);

  couples.forEach(([a, b]) => {
    bot.sendMessage(a, `💞 You’re paired with *${profiles[b].name}*`, { parse_mode: "Markdown" });
    bot.sendMessage(b, `💞 You’re paired with *${profiles[a].name}*`, { parse_mode: "Markdown" });
  });
});

// ================= END GAME =================
function endGame(winnerId) {
  profiles[winnerId].wins++;
  profiles[winnerId].games++;
  saveProfiles();

  bot.sendMessage(winnerId,
`🏆 *VICTORY*
━━━━━━━━━━━━━━━━━━
You didn’t just win.
You earned it.`,
{ parse_mode: "Markdown" });

  participants = [];
  vipParticipants = [];
  couples = [];
  activeGame = false;
}

// ================= ANALYTICS =================
bot.onText(/\/stats/, (msg) => {
  if (msg.from.id !== ADMIN_ID) return;
  const totalUsers = Object.keys(profiles).length;
  const vipUsers = Object.values(profiles).filter(p => p.vip).length;

  bot.sendMessage(msg.chat.id,
`📊 *PLATFORM STATS*
━━━━━━━━━━━━━━━━━━
👥 Users: ${totalUsers}
💎 VIPs: ${vipUsers}
🎮 Active games ready`,
{ parse_mode: "Markdown" });
});
