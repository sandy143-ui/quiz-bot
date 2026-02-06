// =============================================================
// 🌌 GALAXY CASINO ARENA — ULTIMATE CASINO EMPIRE
// All games locked until Standard or VIP approved by admin
// Join buttons → show Zina payment link → wait for /approve
// =============================================================

require("dotenv").config();
const TelegramBot = require("node-telegram-bot-api");
const fs = require("fs");

const bot = new TelegramBot(process.env.BOT_TOKEN, { polling: true });
const ADMIN_ID = Number(process.env.ADMIN_ID);
const ZINA_API_URL = process.env.ZINA_API_URL || "https://api.zina.io/pay";

const STANDARD_FEE = 5;
const VIP_FEE = 10;

// ================= STORAGE ================
const PROFILE_DB = "./profiles.json";
if (!fs.existsSync(PROFILE_DB)) fs.writeFileSync(PROFILE_DB, "{}");
let profiles = JSON.parse(fs.readFileSync(PROFILE_DB));

let pendingPayments = {};     // temporary — only to remember what user requested
let couplesQueue = [];
let payouts = {};

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
      rank: "🥉 Bronze Rookie",
      wallet: 0,
      games: 0,
      wins: 0
    };
    saveProfiles();
  }
  return profiles[id];
}

function hasAccess(id) {
  const p = profiles[id] || {};
  return p.vip || p.standard;
}

function updateRank(id) {
  const p = profiles[id];
  if (!p) return;

  if (p.wins >= 50) { p.rank = "👑 Diamond King"; p.badge = "💎 Galactic Emperor"; }
  else if (p.wins >= 25) { p.rank = "💎 Platinum Lord"; p.badge = "🌟 Neon Overlord"; }
  else if (p.wins >= 10) { p.rank = "🏆 Gold Champion"; p.badge = "⚡ Cyber Hero"; }
  else if (p.wins >= 5) { p.rank = "🥈 Silver Warrior"; p.badge = "🔥 Romance Knight"; }
  else { p.rank = "🥉 Bronze Rookie"; p.badge = "🌱 Neon Rookie"; }

  saveProfiles();
}

// ================= VISUALS =================
function banner() {
  return `╔════════════════════════════════════╗
 🌌✨ GALAXY CASINO ARENA — ELITE EMPIRE ✨🌌
╚════════════════════════════════════╝`;
}

// ================= START & MENU ===================
bot.onText(/\/start/, (msg) => {
  const id = msg.chat.id;
  const name = msg.from.first_name || "Player";
  const p = getProfile(id, name);

  const text = `${banner()}

👤 *${name}*
🏅 Badge: ${p.badge}
🎖 Rank: ${p.rank}
💰 Wallet: $${p.wallet}

✨ Welcome to the most luxurious casino universe!
Unlock all games with Standard or VIP access.`;

  bot.sendMessage(id, text, {
    parse_mode: "Markdown",
    reply_markup: menu(p)
  });
});

function menu(p) {
  const access = hasAccess(p.id);

  const kb = [
    [{ text: "🎰 Neon Slots 💎", callback_data: access ? "slots" : "upgrade_prompt" }],
    [{ text: "🎡 Galaxy Spin 🌌", callback_data: access ? "spin" : "upgrade_prompt" }],
    [{ text: "🎲 Lucky Dice ⚡", callback_data: access ? "dice" : "upgrade_prompt" }],
    [{ text: "🎰 Roulette Royale 👑", callback_data: access ? "roulette" : "upgrade_prompt" }],
    [{ text: "🃏 Hi-Lo Predictor 🔥", callback_data: access ? "hilo" : "upgrade_prompt" }],
    [{ text: "💖 Romance Lounge ❤️", callback_data: access ? "couples" : "upgrade_prompt" }],
    [{ text: "⚡ Neon Battle 🏆", callback_data: access ? "battle" : "upgrade_prompt" }],
    [{ text: "🏆 Leaderboard 🌟", callback_data: "leaderboard" }],
    [{ text: "🛍 VIP Shop ✨", callback_data: "shop" }],
    [{ text: "💰 Wallet 💸", callback_data: "wallet" }]
  ];

  if (!access) {
    kb.push([{ text: "💎 JOIN VIP", callback_data: "join_vip" }]);
    kb.push([{ text: "✨ JOIN STANDARD", callback_data: "join_standard" }]);
  }

  return { inline_keyboard: kb };
}

// ================= LOCKED FLOW =================
function showLocked(id) {
  bot.sendMessage(id, "🔒 This feature is locked.\n\nUpgrade to **Standard** or **VIP** to unlock all games and features.", {
    parse_mode: "Markdown",
    reply_markup: menu(profiles[id])
  });
}

// ================= MAIN CALLBACK HANDLER ==================
bot.on("callback_query", async (q) => {
  bot.answerCallbackQuery(q.id);

  const id = q.from.id;
  const data = q.data;
  const p = getProfile(id, q.from.first_name || "Player");

  // ──────────────────────────────
  //  Always allowed actions
  // ──────────────────────────────

  if (data === "leaderboard") {
    const top = Object.values(profiles)
      .sort((a, b) => b.wins - a.wins)
      .slice(0, 10)
      .map((u, i) => `${i + 1}. ${u.name} — 🏆 ${u.wins} | ${u.rank}`)
      .join("\n") || "No players yet";

    bot.sendMessage(id, `🏆 *Galactic Leaderboard* 🏆\n\n${top}`, { parse_mode: "Markdown" });
    return;
  }

  if (data === "wallet") {
    bot.sendMessage(id, `💰 *Your Wallet*\n\nBalance: $${p.wallet}\nGames: ${p.games}\nWins: ${p.wins}\nRank: ${p.rank}`, { parse_mode: "Markdown" });
    return;
  }

  if (data === "shop") {
    bot.sendMessage(id, `🛍 *VIP SHOP*\n\n🎟 Double Win Boost — $10\n💎 VIP Crown — $25\n🔥 Mega Spin Pack — $5\n\nContact admin to purchase.`, { parse_mode: "Markdown" });
    return;
  }

  // ──────────────────────────────
  //  Upgrade buttons → show payment link
  // ──────────────────────────────

  if (data === "join_vip" || data === "join_standard") {
    const type = data === "join_vip" ? "vip" : "standard";
    const amount = type === "vip" ? VIP_FEE : STANDARD_FEE;

    const link = `${ZINA_API_URL}?amount=${amount}&user=${id}&methods=card,applepay,googlepay,usdt`;

    pendingPayments[id] = { type, amount };

    const msg = type === "vip"
      ? `💎 *Become VIP* — $${VIP_FEE}\n\nUnlock **everything** forever!\n\n`
      : `✨ *Become Standard* — $${STANDARD_FEE}\n\nUnlock all games!\n\n`;

    bot.sendMessage(id, msg + `Click below to pay:`, {
      parse_mode: "Markdown",
      reply_markup: {
        inline_keyboard: [
          [{ text: "💳 Click here to pay", url: link }],
          [{ text: "Back to menu", callback_data: "back" }]
        ]
      }
    });

    bot.sendMessage(id, "ℹ️ After successful payment, wait for admin approval.\nYou will be notified when activated.", { parse_mode: "Markdown" });
    return;
  }

  if (data === "upgrade_prompt") {
    showLocked(id);
    return;
  }

  if (data === "back") {
    bot.sendMessage(id, "Back to main menu", {
      reply_markup: menu(p)
    });
    return;
  }

  // ──────────────────────────────
  //  All games below this point require access
  // ──────────────────────────────

  if (!hasAccess(id)) {
    showLocked(id);
    return;
  }

  // ── PROTECTED GAMES ──

  if (data === "slots") {
    const icons = ["🍒","💎","7️⃣","👑","🎰","🌟","🔥"];
    const roll = Array(3).fill().map(() => icons[Math.floor(Math.random()*icons.length)]);
    const win = roll[0] === roll[1] && roll[1] === roll[2];
    if (win) { p.wallet += 5; p.wins++; }
    p.games++;
    updateRank(id);
    saveProfiles();
    bot.sendMessage(id, `🎰 ${roll.join(" | ")} 🎰\n${win ? "💥 JACKPOT +$5!" : "Try again!"}`, { parse_mode: "Markdown" });
    return;
  }

  // ... add your other games here (spin, dice, roulette, hilo, couples, battle ...)

  bot.sendMessage(id, `Game under development: ${data}`, { parse_mode: "Markdown" });
});

// ================= ADMIN APPROVAL ==================
bot.onText(/\/approve (.+)/, (msg, match) => {
  if (msg.from.id !== ADMIN_ID) {
    bot.sendMessage(msg.chat.id, "⛔ Admin only command");
    return;
  }

  const query = match[1].trim();
  let userId;

  // Try by username
  const userByName = Object.values(profiles).find(u => u.name.toLowerCase() === query.toLowerCase());
  if (userByName) {
    userId = userByName.id;
  } else {
    // Try by ID
    userId = Number(query);
    if (!profiles[userId]) {
      bot.sendMessage(msg.chat.id, "❌ User not found");
      return;
    }
  }

  const pending = pendingPayments[userId];
  if (!pending) {
    bot.sendMessage(msg.chat.id, "❌ No pending payment for this user");
    return;
  }

  const profile = profiles[userId];
  if (pending.type === "vip") profile.vip = true;
  if (pending.type === "standard") profile.standard = true;

  delete pendingPayments[userId];
  saveProfiles();

  bot.sendMessage(userId, `✅ Your ${pending.type.toUpperCase()} subscription has been **approved**!\nYou now have full access to all features. Enjoy! 🎉`);
  bot.sendMessage(msg.chat.id, `Approved ${pending.type} for ${profile.name} (${userId})`);

  // Optional: refresh menu for user
  bot.sendMessage(userId, "Main menu updated:", {
    reply_markup: menu(profile)
  });
});

// ================= READY =====================
console.log("Galaxy Casino Arena → locked until admin approval");