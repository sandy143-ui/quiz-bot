// =============================================================
// 🌌 GALAXY CASINO ARENA — ULTIMATE CASINO EMPIRE
// Luxury • Casino • Neon • Romance • Cyberpunk • Royal • Galaxy
// Slots • Dice • Roulette • Hi-Lo • Spin • Battle • Couples
// Enhanced: More Games, Dashing Vibes, Pro Casino Thrills!
// =============================================================

require("dotenv").config();
const TelegramBot = require("node-telegram-bot-api");
const fs = require("fs");
const axios = require("axios");

// ================= CONFIG =================
const bot = new TelegramBot(process.env.BOT_TOKEN, { polling: true });
const ADMIN_ID = Number(process.env.ADMIN_ID);
const ZINA_API_URL = process.env.ZINA_API_URL || "https://api.zina.io/pay";

const STANDARD_FEE = 5;
const VIP_FEE = 10;

// ================= STORAGE ================
const PROFILE_DB = "./profiles.json";
if (!fs.existsSync(PROFILE_DB)) fs.writeFileSync(PROFILE_DB, "{}");
let profiles = JSON.parse(fs.readFileSync(PROFILE_DB));

let pendingPayments = {};
let couplesQueue = [];
let payouts = {}; // For /claim

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
  const p = profiles[id];
  return p && (p.vip || p.standard);
}

// ================= RANK SYSTEM ============
function updateRank(id) {
  const p = profiles[id];

  if (p.wins >= 50) {
    p.rank = "👑 Diamond King";
    p.badge = "💎 Galactic Emperor";
  } else if (p.wins >= 25) {
    p.rank = "💎 Platinum Lord";
    p.badge = "🌟 Neon Overlord";
  } else if (p.wins >= 10) {
    p.rank = "🏆 Gold Champion";
    p.badge = "⚡ Cyber Hero";
  } else if (p.wins >= 5) {
    p.rank = "🥈 Silver Warrior";
    p.badge = "🔥 Romance Knight";
  } else {
    p.rank = "🥉 Bronze Rookie";
    p.badge = "🌱 Neon Rookie";
  }

  saveProfiles();
}

// ================= GAME EMOJIS & HELPERS =========
const diceEmojis = ["⚀", "⚁", "⚂", "⚃", "⚄", "⚅"];

function getDiceEmoji(n) {
  return diceEmojis[n - 1];
}

const suits = ["♠️", "♥️", "♦️", "♣️"];
const ranks = "A23456789TJQK";

function getCardEmoji(val) {
  const suit = suits[Math.floor(Math.random() * 4)];
  return ranks[val - 1] + suit;
}

function getColorEmoji(color) {
  if (color === "red") return "🔴";
  if (color === "black") return "⚫";
  return "🟢";
}

// ================= VISUAL BANNERS =========
function banner() {
  return `╔════════════════════════════════════╗
 🌌✨ GALAXY CASINO ARENA — ELITE EMPIRE ✨🌌
╚════════════════════════════════════╝`;
}

function fancyText(text) {
  return `💫 *${text}* 💫`;
}

// ================= START UI ===============
bot.onText(/\/start/, (msg) => {
  const id = msg.chat.id;
  const name = msg.from.first_name || "Mystery Traveler";
  const p = getProfile(id, name);

  const text = `${banner()}

👤 ${fancyText(name)}
🏅 Badge: ${p.badge}
🎖 Rank: ${p.rank}
💰 Wallet: $${p.wallet} 💸

✨ *Enter the Ultimate Casino Cosmos!* 
Neon Thrills, Royal Wins, Cyber Fortune Await! 🎰🌟💖`;

  bot.sendMessage(id, text, {
    parse_mode: "Markdown",
    reply_markup: menu(p)
  });
});

// ================= MENU ===================
function menu(p) {
  const id = p.id;
  const access = hasAccess(id);

  return {
    inline_keyboard: [
      [
        { text: "🎰 Neon Slots 💎", callback_data: access ? "slots" : "upgrade_prompt" },
        { text: "🎡 Galaxy Spin 🌌", callback_data: access ? "spin" : "upgrade_prompt" }
      ],
      [
        { text: "🎲 Lucky Dice ⚡", callback_data: access ? "dice" : "upgrade_prompt" },
        { text: "🎰 Roulette Royale 👑", callback_data: access ? "roulette" : "upgrade_prompt" }
      ],
      [
        { text: "🃏 Hi-Lo Predictor 🔥", callback_data: access ? "hilo" : "upgrade_prompt" },
        { text: "💖 Romance Lounge ❤️", callback_data: access ? "couples" : "upgrade_prompt" }
      ],
      [
        { text: "⚡ Neon Battle 🏆", callback_data: access ? "battle" : "upgrade_prompt" },
        { text: "🏆 Leaderboard 🌟", callback_data: "leaderboard" }
      ],
      [
        { text: "🛍 Elite Shop ✨", callback_data: "shop" },
        { text: "💰 Wallet 💸", callback_data: "wallet" }
      ],
      [
        { text: "💎 UPGRADE VIP 👑", callback_data: "pay_vip" },
        { text: "✨ UPGRADE STANDARD 🚀", callback_data: "pay_standard" }
      ]
    ]
  };
}

// ================= LOCKED ====================
function locked(id, name) {
  const p = profiles[id];
  bot.sendMessage(id, `🔒 *Realm Sealed in Cosmic Vault!* 🌌
Upgrade to Unleash Epic Casino Glory! 💥

*Choose Your Destiny:*`, {
    parse_mode: "Markdown",
    reply_markup: menu(p)
  });
}

// ================= SINGLE CALLBACK HANDLER ==================
bot.on("callback_query", async (q) => {
  bot.answerCallbackQuery(q.id);
  const id = q.from.id;
  const name = q.from.first_name || "Star Traveler";
  const data = q.data;
  const p = getProfile(id, name);

  // ================= UPGRADE PROMPT ==================
  if (data === "upgrade_prompt") {
    if (pendingPayments[id] && !pendingPayments[id].approved) {
      bot.sendMessage(id, "⏳ *Cosmic Payment Orbiting Approval...* 🌠\nHold Tight, Legend!");
    } else {
      bot.sendMessage(id, `🔒 *Galactic Lock Engaged!* 💥
This Thrill Requires Standard or VIP Access!

*Unlock Now:*`, {
        parse_mode: "Markdown",
        reply_markup: menu(p)
      });
    }
    return;
  }

  // ================= PAYMENTS ==================
  if (data === "pay_vip") {
    const link = `${ZINA_API_URL}?amount=${VIP_FEE}&user=${id}&methods=card,applepay,googlepay,usdt`;
    pendingPayments[id] = { type: "vip", amount: VIP_FEE, link, approved: false };
    bot.sendMessage(id, `💎 *Enter VIP Royalty!* 👑
*Pay $${VIP_FEE}* via Zina (Card, Apple/Google Pay, USDT):
\`${link}\`

Await Admin's Golden Decree! ✨🌟`);
    return;
  }

  if (data === "pay_standard") {
    const link = `${ZINA_API_URL}?amount=${STANDARD_FEE}&user=${id}&methods=card,applepay,googlepay,usdt`;
    pendingPayments[id] = { type: "standard", amount: STANDARD_FEE, link, approved: false };
    bot.sendMessage(id, `✨ *Blast into Standard Galaxy!* 🚀
*Pay $${STANDARD_FEE}* via Zina (Card, Apple/Google Pay, USDT):
\`${link}\`

Await Cosmic Clearance! 🎉🔥`);
    return;
  }

  // ================= WALLET INFO ==================
  if (data === "wallet") {
    bot.sendMessage(id, `💰✨ *Cosmic Wallet Empire* ✨💰

💵 *Balance:* $${p.wallet}
📊 *Games:* ${p.games}
🏆 *Wins:* ${p.wins}
🎖 *Rank:* ${p.rank}
🏅 *Badge:* ${p.badge}

⚡ *Pro Tip:* /claim for Free Cosmic Boosts! 🌟`, { parse_mode: "Markdown" });
    return;
  }

  // ================= CASINO GAMES - CHECK ACCESS ==================
  if (!hasAccess(id)) {
    locked(id, name);
    return;
  }

  // ================= SLOTS ==================
  if (data === "slots") {
    const icons = ["🍒", "💎", "7️⃣", "👑", "🎰", "🌟", "🔥"];
    const roll = Array.from({ length: 3 }, () => icons[Math.floor(Math.random() * icons.length)]);
    const win = roll.every((val, i, arr) => val === arr[0]);
    if (win) { p.wallet += 5; p.wins++; }
    p.games++;
    updateRank(id);
    saveProfiles();
    bot.sendMessage(id, `🎰✨ *Neon Slots Ignite!* ✨🎰

${roll.join(" | ")}

${win ? "💥 *JACKPOT EXPLOSION!* +$5 🏆🎉" : "😏 *Close Call!* Spin for Glory! 🌌"}`);
    return;
  }

  // ================= SPIN WHEEL ==================
  if (data === "spin") {
    const prizes = [0, 1, 2, 5, 10, 20];
    const prize = prizes[Math.floor(Math.random() * prizes.length)];
    p.wallet += prize;
    p.games++;
    saveProfiles();
    bot.sendMessage(id, `🎡🌌 *Galaxy Wheel Whirls Through Stars!* 🌌🎡

*You Claimed:* 💰 *$${prize}* in Cosmic Fortune! ✨💸

*Feel the Rush!* 🔥`);
    return;
  }

  // ================= DICE MATCH ==================
  if (data === "dice") {
    const d1 = Math.floor(Math.random() * 6) + 1;
    const d2 = Math.floor(Math.random() * 6) + 1;
    const win = d1 === d2;
    if (win) { p.wallet += 4; p.wins++; }
    p.games++;
    updateRank(id);
    saveProfiles();
    bot.sendMessage(id, `🎲 *Lucky Dice Duel!* ⚡
${getDiceEmoji(d1)} | ${getDiceEmoji(d2)}

${win ? "🎉 *PERFECT MATCH!* +$4 💸" : "😩 *No Dice!* Roll Again! 🎲"}`);
    return;
  }

  // ================= ROULETTE ==================
  if (data === "roulette") {
    bot.sendMessage(id, `🎰👑 *Roulette Royale - Place Bet!* 👑🎰

*Spin the Wheel of Fortune!* 🌟`, {
      reply_markup: {
        inline_keyboard: [
          [{ text: "🔴 RED", callback_data: "roulette_red" }],
          [{ text: "⚫ BLACK", callback_data: "roulette_black" }]
        ]
      }
    });
    return;
  }

  if (data.startsWith("roulette_")) {
    const bet = data.split("_")[1];
    const num = Math.floor(Math.random() * 37);
    const color = num === 0 ? "green" : (num % 2 === 0 ? "red" : "black");
    const win = bet === color;
    if (win) { p.wallet += 5; p.wins++; }
    p.games++;
    updateRank(id);
    saveProfiles();
    const msg = `🎡 *Spin Result:* ${num} ${getColorEmoji(color)}

*Your Bet:* ${getColorEmoji(bet)}

${win ? "💰 *ROYAL WIN!* +$5 🎉" : "😤 *House Edge!* Try Again! 🔥"}`;
    bot.sendMessage(id, msg);
    return;
  }

  // ================= HI-LO ==================
  if (data === "hilo") {
    const first = Math.floor(Math.random() * 13) + 1;
    bot.sendMessage(id, `🃏 *Hi-Lo Predictor Activated!* 🔥

*Current Card:* ${getCardEmoji(first)}

*Guess Next:*`, {
      reply_markup: {
        inline_keyboard: [
          [{ text: "⬆️ HIGHER", callback_data: `hilo_hi_${first}` }],
          [{ text: "⬇️ LOWER", callback_data: `hilo_lo_${first}` }]
        ]
      }
    });
    return;
  }

  if (data.startsWith("hilo_")) {
    const parts = data.split("_");
    const guess = parts[1];
    const first = parseInt(parts[2]);
    const second = Math.floor(Math.random() * 13) + 1;
    const win = (guess === "hi" && second > first) || (guess === "lo" && second < first);
    if (win) { p.wallet += 4; p.wins++; }
    p.games++;
    updateRank(id);
    saveProfiles();
    const msg = `🃏 *Cards Revealed!*
${getCardEmoji(first)} ➡️ ${getCardEmoji(second)}

*Your Guess:* ${guess.toUpperCase()}

${win ? "💰 *PERFECT PREDICT!* +$4 🎊" : "❌ *Busted!* Next Round! ⚡"}`;
    bot.sendMessage(id, msg);
    return;
  }

  // ================= COUPLES ==================
  if (data === "couples") {
    couplesQueue.push(id);
    bot.sendMessage(id, "💖 *Igniting Romance Signals...* 🌹💞\n*Scanning for Soulmate Vibes!*");
    if (couplesQueue.length >= 2) {
      const a = couplesQueue.shift();
      const b = couplesQueue.shift();
      bot.sendMessage(a, "💕 *Soulmate Locked!* 👑❤️\n*Eternal Cyber Vibes Await!*");
      bot.sendMessage(b, "💕 *Soulmate Locked!* 👑❤️\n*Eternal Cyber Vibes Await!*");
    }
    return;
  }

  // ================= BATTLE ==================
  if (data === "battle") {
    const win = Math.random() > 0.5;
    if (win) { p.wins++; p.wallet += 3; }
    p.games++;
    updateRank(id);
    saveProfiles();
    bot.sendMessage(id, win ? "⚡ *Neon Victory!* +$3 🏆🔥\n*Epic Warrior Glory!*" : "💀 *Cyber Defeat!* 🌟\n*Rise for Revenge!*");
    return;
  }

  // ================= LEADERBOARD ==================
  if (data === "leaderboard") {
    const top = Object.values(profiles)
      .sort((a, b) => b.wins - a.wins)
      .slice(0, 10)
      .map((u, i) => `${i + 1}. ${u.name} — 🏆 ${u.wins} | ${u.rank}`)
      .join("\n");
    bot.sendMessage(id, `🏆✨ *Galactic Leaderboard Legends!* ✨🏆

${top}

*Climb to Immortality!* 🌌🚀`);
    return;
  }

  // ================= SHOP ==================
  if (data === "shop") {
    bot.sendMessage(id, `🛍✨ *Elite VIP Shop - Royal Loot!* ✨🛍

🎟 *Double Win Boost* — $10 💥
💎 *Eternal Crown* — $25 👑
🔥 *Mega Spin Pack* — $5 🌌
⚡ *Battle Edge* — $15 🗡️

*Shop Like a King!* 👑`);
    return;
  }
});

// ================= READY =====================
console.log("🌌 Galaxy Casino Empire: Loaded with New Games! 🚀");

/* =========================================================
   🤖 AI FLIRT & DARE — EXTRA VIBES
========================================================= */
bot.onText(/\/ai_love/, (msg) => {
  const id = msg.chat.id;
  bot.sendMessage(id, "💘 *AI Romance Engine: FULL THRUST!* 🤖💞

*Your Soulmate Whispers:*
'You Light the Neon Cosmos… Conquer Hearts Together? 🌟❤️'

*Real Vibes Activated!* 🔥");
});

bot.onText(/\/ai_dare/, (msg) => {
  const id = msg.chat.id;
  const dares = [
    "🎙 Send Sweet Voice Note to Melt Galaxies! ❤️",
    "😏 Confess Crush in Epic Drama! 💥",
    "💣 Drop Heart Bomb in Chat! ❤️💥",
    "⏳ Romantic Whisper in 5 Secs! 🌹",
    "🌌 Share Wildest Casino Dream! ✨"
  ];
  const pick = dares[Math.floor(Math.random() * dares.length)];
  bot.sendMessage(id, `🔥 *AI Dare Nebula - Neon Edition!* 💥

*Your Challenge:*
${pick}

*Accept? 🚀*`);
});

/* =========================================================
   💸 REWARDS & WALLET
========================================================= */
bot.onText(/\/wallet/, (msg) => {
  const id = msg.chat.id;
  const p = getProfile(id, msg.from.first_name || "Player");
  bot.sendMessage(id, `💰 *Luxury Wallet Dashboard* 💰

💵 Balance: $${p.wallet}
📊 Games: ${p.games}
🏆 Wins: ${p.wins}`, { parse_mode: "Markdown" });
});

bot.onText(/\/claim/, (msg) => {
  const id = msg.chat.id;
  const reward = Math.floor(Math.random() * 100) + 10;
  payouts[id] = (payouts[id] || 0) + reward;
  bot.sendMessage(id, `🏆✨ *Cosmic Payout Dropped!* ✨🏆

*Amount:* $${reward} 💥
*Method:* Crypto Blast 🔗
*Status:* ✅ Claimed!

*Party Time!* 🎉🚀`);
});

/* =========================================================
   📊 ADMIN EMPIRE
========================================================= */
bot.onText(/\/dashboard/, (msg) => {
  if (msg.from.id !== ADMIN_ID) return bot.sendMessage(msg.chat.id, "⛔ *Admin Only - Access Denied!* 👑");
  const users = Object.keys(profiles).length;
  const totalPaid = Object.values(payouts).reduce((a, b) => a + b, 0);
  bot.sendMessage(msg.chat.id, `📊✨ *Empire Nebula Dashboard* ✨📊

👥 *Legends:* ${users}
💸 *Wallets:* ${Object.keys(payouts).length}
🏆 *Total Payouts:* $${totalPaid}

*Status: Dashing & Dominant!* 🚀🌌`);
});

bot.onText(/\/approve (\d+)/, (msg, match) => {
  if (msg.from.id !== ADMIN_ID) return;
  const userId = Number(match[1]);
  if (!pendingPayments[userId]) return bot.sendMessage(msg.chat.id, "❌ No Pending Payment.");
  const payment = pendingPayments[userId];
  const p = profiles[userId];
  if (!p) return bot.sendMessage(msg.chat.id, "❌ User Not Found.");
  if (payment.type === "vip") p.vip = true;
  else p.standard = true;
  payment.approved = true;
  delete pendingPayments[userId];
  saveProfiles();
  bot.sendMessage(userId, `✅✨ *Approved!* Now ${payment.type.toUpperCase()} Legend! 👑🌟`);
  bot.sendMessage(msg.chat.id, `✅ *${payment.type.toUpperCase()}* for ${p.name} (${userId}) 🚀`);
});

bot.onText(/\/approve_name (.+)/, (msg, match) => {
  if (msg.from.id !== ADMIN_ID) return;
  const username = match[1].trim();
  const userEntry = Object.values(profiles).find(u => u.name.toLowerCase() === username.toLowerCase());
  if (!userEntry) return bot.sendMessage(msg.chat.id, "❌ User Not Found.");
  const userId = userEntry.id;
  if (!pendingPayments[userId]) return bot.sendMessage(msg.chat.id, "❌ No Pending.");
  const payment = pendingPayments[userId];
  if (payment.type === "vip") userEntry.vip = true;
  else userEntry.standard = true;
  payment.approved = true;
  delete pendingPayments[userId];
  saveProfiles();
  bot.sendMessage(userId, `✅✨ *Approved!* Now ${payment.type.toUpperCase()} Legend! 👑🌟`);
  bot.sendMessage(msg.chat.id, `✅ *${payment.type.toUpperCase()}* for ${userEntry.name} (${userId}) 🚀`);
});

bot.onText(/\/broadcast (.+)/, (msg, match) => {
  if (msg.from.id !== ADMIN_ID) return;
  const text = match[1];
  Object.keys(profiles).forEach(uid => {
    bot.sendMessage(uid, `📡✨ *Galactic Broadcast!* ✨📡

${text}

*Empire Updates!* 🌌🎉`);
  });
});

/* =========================================================
   🌐 EMPIRE ONLINE
========================================================= */
console.log("🤖 AI Flirt: Flirty & Online 💞");
console.log("💸 Rewards Engine: Gushing Cash 💰");
console.log("📊 Admin Dashboard: Supreme Power 👑");
console.log("🌌 Casino Empire: *FULLY OPERATIONAL* - New Games Live! 🎰✨🚀");