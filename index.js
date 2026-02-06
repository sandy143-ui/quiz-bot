// =============================================================
// 🌌 QUIZ ARENA VIP — NEXT‑LEVEL VISUALS GOD EDITION
// Luxury • Casino • Neon • Romance • Cyberpunk • Royal • Galaxy
// Slots • Spin Wheel • Leaderboard • Wallet • Ranks • Shop
// =============================================================

require("dotenv").config();
const TelegramBot = require("node-telegram-bot-api");
const fs = require("fs");
const axios = require("axios");

// ================= CONFIG =================
const bot = new TelegramBot(process.env.BOT_TOKEN, { polling: true });
const ADMIN_ID = Number(process.env.ADMIN_ID);

const STANDARD_FEE = 5;
const VIP_FEE = 10;

// ================= STORAGE ================
const PROFILE_DB = "./profiles.json";
if (!fs.existsSync(PROFILE_DB)) fs.writeFileSync(PROFILE_DB, "{}");
let profiles = JSON.parse(fs.readFileSync(PROFILE_DB));

let pendingPayments = {};
let couplesQueue = [];

// ================= UTIL ===================
function saveProfiles() {
  fs.writeFileSync(PROFILE_DB, JSON.stringify(profiles, null, 2));
}

function getProfile(id, name) {
  if (!profiles[id]) {
    profiles[id] = {
      id,
      name,
      vip: false,
      standard: false,
      badge: "🌱 Neon Rookie",
      rank: "Bronze",
      wallet: 0,
      games: 0,
      wins: 0
    };
    saveProfiles();
  }
  return profiles[id];
}

function hasAccess(id) {
  const p = profiles[id];
  return p && (p.vip || p.standard);
}

// ================= RANK SYSTEM ============
function updateRank(id) {
  const p = profiles[id];

  if (p.wins >= 50) p.rank = "👑 Diamond King";
  else if (p.wins >= 25) p.rank = "💎 Platinum Lord";
  else if (p.wins >= 10) p.rank = "🏆 Gold Champion";
  else if (p.wins >= 5) p.rank = "🥈 Silver Warrior";
  else p.rank = "🥉 Bronze Rookie";

  saveProfiles();
}

// ================= VISUAL BANNERS =========
function banner() {
  return `╔══════════════════════════╗
 🌌 GALAXY CASINO ARENA 🌌
╚══════════════════════════╝`;
}

// ================= START UI ===============
bot.onText(/\/start/, (msg) => {
  const id = msg.chat.id;
  const name = msg.from.first_name || "Player";
  const p = getProfile(id, name);

  const text = `${banner()}

👤 *${name}*
🏅 Badge: ${p.badge}
🎖 Rank: ${p.rank}
💰 Wallet: $${p.wallet}

✨ Welcome To The Most Luxurious Game Dimension Ever Built ✨`;

  bot.sendMessage(id, text, {
    parse_mode: "Markdown",
    reply_markup: menu(p)
  });
});

// ================= MENU ===================
function menu(p) {
  return {
    inline_keyboard: [
      [{ text: "🎰 Casino Slots", callback_data: "slots" }],
      [{ text: "🎡 Spin Galaxy Wheel", callback_data: "spin" }],
      [{ text: "💖 Romance Lounge", callback_data: hasAccess(p.id) ? "couples" : "locked" }],
      [{ text: "⚡ Neon Battle", callback_data: hasAccess(p.id) ? "battle" : "locked" }],
      [{ text: "🏆 Leaderboard", callback_data: "leaderboard" }],
      [{ text: "🛍 VIP Shop", callback_data: "shop" }],
      [{ text: "💎 Upgrade VIP", callback_data: "vip" }]
    ]
  };
}

// ================= SLOTS ==================
bot.on("callback_query", async (q) => {
  const id = q.from.id;
  const data = q.data;
  const p = getProfile(id, q.from.first_name);

  if (data === "slots") {
    const icons = ["🍒", "💎", "7️⃣", "👑", "🎰"];
    const roll = [
      icons[Math.floor(Math.random() * icons.length)],
      icons[Math.floor(Math.random() * icons.length)],
      icons[Math.floor(Math.random() * icons.length)]
    ];

    const win = roll[0] === roll[1] && roll[1] === roll[2];

    if (win) {
      p.wallet += 5;
      p.wins++;
    }

    p.games++;
    updateRank(id);
    saveProfiles();

    bot.sendMessage(
      id,
      `🎰 ${roll.join(" | ")} 🎰\n\n${
        win ? "💰 JACKPOT +$5" : "😢 Try Again"
      }`
    );
  }

  // ============== SPIN WHEEL ==============
  if (data === "spin") {
    const prizes = [0, 1, 2, 5, 10];
    const prize = prizes[Math.floor(Math.random() * prizes.length)];

    p.wallet += prize;
    saveProfiles();

    bot.sendMessage(
      id,
      `🎡 Spinning Galaxy Wheel…\n\nYou Won: 💰 $${prize}`
    );
  }

  // ============== COUPLES =================
  if (data === "couples") {
    if (!hasAccess(id)) return locked(id);

    couplesQueue.push(id);
    bot.sendMessage(id, "💖 Searching Love Signal… 🌹");

    if (couplesQueue.length >= 2) {
      const a = couplesQueue.shift();
      const b = couplesQueue.shift();

      bot.sendMessage(a, "💕 Partner Found 👑");
      bot.sendMessage(b, "💕 Partner Found 👑");
    }
  }

  // ============== BATTLE ==================
  if (data === "battle") {
    if (!hasAccess(id)) return locked(id);

    const win = Math.random() > 0.5;

    p.games++;
    if (win) {
      p.wins++;
      p.wallet += 3;
    }

    updateRank(id);
    saveProfiles();

    bot.sendMessage(
      id,
      win
        ? "⚡ Neon Victory +$3 🏆"
        : "💀 Cyber Defeat"
    );
  }

  // ============== LEADERBOARD =============
  if (data === "leaderboard") {
    const top = Object.values(profiles)
      .sort((a, b) => b.wins - a.wins)
      .slice(0, 10)
      .map(
        (u, i) => `${i + 1}. ${u.name} — 🏆 ${u.wins}`
      )
      .join("\n");

    bot.sendMessage(id, `🏆 GLOBAL LEADERBOARD 🏆\n\n${top}`);
  }

  // ============== SHOP ====================
  if (data === "shop") {
    bot.sendMessage(
      id,
      `🛍 VIP SHOP\n\n🎟 Double Win Boost — $10\n💎 VIP Crown — $25\n🔥 Mega Spin — $5`
    );
  }

  // ============== VIP =====================
  if (data === "vip") {
    bot.sendMessage(
      id,
      `👑 VIP UPGRADE\n\nUnlock All Realms\nBecome Royalty Forever`
    );
  }
});

// ============== LOCKED ====================
function locked(id) {
  bot.sendMessage(
    id,
    "🔒 This Realm Is Locked\nUpgrade To Enter 💎"
  );
}

// ============== READY =====================
console.log("🌌 Next‑Level Visuals God Edition Running...");

/* =========================================================
   🤖 AI COUPLES & FLIRT SYSTEM
========================================================= */

bot.onText(/\/ai_love/, (msg) => {
  const id = msg.chat.id;
  bot.sendMessage(id,
    "💘 AI Romance Activated…\n\n🤖 Your virtual partner whispers:\n‘You look stunning tonight… ready to win hearts together?’ 💞"
  );
});

bot.onText(/\/ai_dare/, (msg) => {
  const id = msg.chat.id;
  const dares = [
    "Send a sweet voice note 🎙",
    "Confess your crush 😏",
    "Drop a heart bomb in chat 💣❤️",
    "Say something romantic in 5 seconds ⏳"
  ];
  const pick = dares[Math.floor(Math.random() * dares.length)];
  bot.sendMessage(id, `🔥 AI Truth or Dare\n\nYour Dare: ${pick}`);
});

/* =========================================================
   💸 AUTO PAYOUT & CRYPTO REWARD SYSTEM (SIMULATED)
========================================================= */

const payouts = {};

bot.onText(/\/wallet/, (msg) => {
  const id = msg.chat.id;
  if (!payouts[id]) payouts[id] = 0;

  bot.sendMessage(id,
    `💰 Luxury Wallet\n\nBalance: $${payouts[id]}\nStatus: Active 💎`
  );
});

bot.onText(/\/claim/, (msg) => {
  const id = msg.chat.id;
  const reward = Math.floor(Math.random() * 50) + 10;
  payouts[id] = (payouts[id] || 0) + reward;

  bot.sendMessage(id,
    `🏆 Payout Released\n\nAmount: $${reward}\nMethod: Crypto Transfer 🔗\nStatus: Completed ✅`
  );
});

/* =========================================================
   📊 ADMIN DASHBOARD SYSTEM
========================================================= */

bot.onText(/\/dashboard/, (msg) => {
  if (msg.from.id !== ADMIN_ID) return bot.sendMessage(msg.chat.id, "⛔ Access Denied — Admin Only");

  const users = Object.keys(payouts).length;

  bot.sendMessage(msg.chat.id,
    `📊 Empire Control Panel\n\n👥 Users: ${users}\n💸 Active Wallets: ${users}\n🏆 Total Paid: $${Object.values(payouts).reduce((a, b) => a + b, 0)}\n\nStatus: Operational 🚀`
  );
});

bot.onText(/\/broadcast (.+)/, (msg, match) => {
  if (msg.from.id !== ADMIN_ID) return bot.sendMessage(msg.chat.id, "⛔ Admin Only Command");

  const text = match[1];
  Object.keys(profiles).forEach(uid => bot.sendMessage(uid, `📡 Broadcast:\n\n${text}`));
});

/* =========================================================
   🌐 SYSTEM ATMOSPHERE FINALIZATION
========================================================= */

console.log("🤖 AI Systems: Online");
console.log("💸 Payout Engine: Active");
console.log("📊 Admin Dashboard: Connected");
console.log("🌌 Luxury Casino Empire: Fully Operational");