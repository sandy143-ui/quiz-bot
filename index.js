// =============================================================
// 🌌 GALAXY CASINO ARENA — ELITE COSMIC EMPIRE
// Luxury • Neon • Romance • Cyberpunk • Royal • Galactic Vibes
// All features locked until Standard or VIP access is approved
// Upgrade → real Ziina payment link → admin approval required
// =============================================================

require("dotenv").config();
const TelegramBot = require("node-telegram-bot-api");
const fs = require("fs");

const bot = new TelegramBot(process.env.BOT_TOKEN, { polling: true });
const ADMIN_ID = Number(process.env.ADMIN_ID);

const STANDARD_FEE = 5;
const VIP_FEE = 10;

// ================= STORAGE ================
const PROFILE_DB = "./profiles.json";
if (!fs.existsSync(PROFILE_DB)) fs.writeFileSync(PROFILE_DB, "{}");
let profiles = JSON.parse(fs.readFileSync(PROFILE_DB));

let pendingPayments = {};     // tracks upgrade requests waiting for approval
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
      name: name || "Stellar Traveler",
      vip: false,
      standard: false,
      badge: "✨ Cosmic Wanderer",
      rank: "🥉 Novice Star",
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

  if (p.wins >= 50) { p.rank = "👑 Emperor of the Void"; p.badge = "🌌 Eternal Sovereign"; }
  else if (p.wins >= 25) { p.rank = "💎 Lord of Nebulae"; p.badge = "✨ Radiant Overlord"; }
  else if (p.wins >= 10) { p.rank = "🏆 Celestial Champion"; p.badge = "⚡ Neon Legend"; }
  else if (p.wins >= 5)  { p.rank = "🥈 Star Knight"; p.badge = "🔥 Passion Ignited"; }
  else { p.rank = "🥉 Novice Star"; p.badge = "✨ Cosmic Wanderer"; }

  saveProfiles();
}

// ================= VISUAL STYLE =================
function banner() {
  return `╔════════════════════════════════════════════╗
 🌌  GALAXY CASINO ARENA  —  ETERNAL LUXURY  🌌
╚════════════════════════════════════════════╝`;
}

// ================= START & MAIN MENU ===================
bot.onText(/\/start/, (msg) => {
  const id = msg.chat.id;
  const name = msg.from.first_name || "Stellar Soul";
  const p = getProfile(id, name);

  const text = `${banner()}

✨ *${name}* ✨
🏅 ${p.badge}
🎖 ${p.rank}
💰 Wallet: $${p.wallet}

Welcome to the most seductive, electrifying casino realm in the cosmos.
Where neon dreams meet royal victories and hearts ignite under starlight.

${hasAccess(id) 
  ? "The empire is yours to conquer. Choose your thrill."
  : "Unlock the gates of luxury — claim your destiny."}`;

  bot.sendMessage(id, text, {
    parse_mode: "Markdown",
    reply_markup: menu(p)
  });
});

function menu(p) {
  const access = hasAccess(p.id);

  const kb = [
    [{ text: "🎰 Neon Fortune Slots", callback_data: access ? "slots" : "upgrade_prompt" }],
    [{ text: "🎡 Galactic Wheel of Desire", callback_data: access ? "spin" : "upgrade_prompt" }],
    [{ text: "🎲 Dice of Destiny", callback_data: access ? "dice" : "upgrade_prompt" }],
    [{ text: "🎰 Roulette Royale", callback_data: access ? "roulette" : "upgrade_prompt" }],
    [{ text: "🃏 Hi-Lo Heartbeat", callback_data: access ? "hilo" : "upgrade_prompt" }],
    [{ text: "💞 Romance Nebula Lounge", callback_data: access ? "couples" : "upgrade_prompt" }],
    [{ text: "⚡ Neon Duel Arena", callback_data: access ? "battle" : "upgrade_prompt" }],
    [{ text: "🏆 Celestial Leaderboard", callback_data: "leaderboard" }],
    [{ text: "🛍 VIP Treasury", callback_data: "shop" }],
    [{ text: "💎 My Cosmic Vault", callback_data: "wallet" }]
  ];

  if (!access) {
    kb.push([{ text: "💎 Claim VIP Eternity", callback_data: "join_vip" }]);
    kb.push([{ text: "✨ Enter Standard Realm", callback_data: "join_standard" }]);
  }

  return { inline_keyboard: kb };
}

// ================= LOCKED FLOW =================
function showLocked(id) {
  const p = profiles[id];
  bot.sendMessage(id,
    `🔒 *The gates remain sealed, celestial soul...*\n\n` +
    `Only those who carry the mark of **Standard** or **VIP** may enter this realm of passion and fortune.\n\n` +
    `Will you claim your place among the stars?`,
    {
      parse_mode: "Markdown",
      reply_markup: menu(p)
    }
  );
}

// ================= MAIN CALLBACK HANDLER ==================
bot.on("callback_query", async (q) => {
  bot.answerCallbackQuery(q.id);

  const id = q.from.id;
  const data = q.data;
  const p = getProfile(id, q.from.first_name || "Stellar Soul");

  // ── Public / always available ──
  if (data === "leaderboard") {
    const top = Object.values(profiles)
      .sort((a, b) => b.wins - a.wins)
      .slice(0, 10)
      .map((u, i) => `${i + 1}. ${u.name} — 🏆 ${u.wins} victories | ${u.rank}`)
      .join("\n") || "The cosmos is still quiet...";

    bot.sendMessage(id, `🏆 *Celestial Hall of Legends* 🏆\n\n${top}\n\nWill your name shine among them?`, {
      parse_mode: "Markdown"
    });
    return;
  }

  if (data === "wallet") {
    bot.sendMessage(id,
      `💎 *Your Cosmic Vault* 💎\n\n` +
      `Balance: $${p.wallet}\n` +
      `Games played: ${p.games}\n` +
      `Victories claimed: ${p.wins}\n` +
      `Current rank: ${p.rank}\n` +
      `Signature: ${p.badge}`,
      { parse_mode: "Markdown" }
    );
    return;
  }

  if (data === "shop") {
    bot.sendMessage(id,
      `🛍 *VIP TREASURY — Exclusive Offerings* 🛍\n\n` +
      `🎟 Double Victory Pulse — $10\n` +
      `💎 Eternal Crown of Supremacy — $25\n` +
      `🔥 Mega Nebula Spin Pack — $5\n\n` +
      `Contact the sovereign (@${process.env.ADMIN_USERNAME || 'admin'}) to acquire these treasures.`,
      { parse_mode: "Markdown" }
    );
    return;
  }

  // ── Upgrade / Join buttons ──
  if (data === "join_vip" || data === "join_standard") {
    const type = data === "join_vip" ? "vip" : "standard";
    const amount = type === "vip" ? VIP_FEE : STANDARD_FEE;

    const paymentLink = type === "vip"
      ? "https://pay.ziina.com/fienix/71k3VbAv0-10$"
      : "https://pay.ziina.com/fienix/ClREPEc08_5$";

    pendingPayments[id] = {
      type,
      amount,
      link: paymentLink,
      requestedAt: Date.now()
    };

    const title = type === "vip" ? "VIP" : "Standard";

    bot.sendMessage(id,
      `✨ *Ascend to ${title} — $${amount}* ✨\n\n` +
      `Unlock the full galaxy: every game, every thrill, every heartbeat.\n` +
      `Step into a realm where fortune bows to your desire.\n\n` +
      `After payment:\n` +
      `→ Await the sovereign’s blessing\n` +
      `→ You will be granted eternal access`,
      {
        parse_mode: "Markdown",
        reply_markup: {
          inline_keyboard: [
            [{ text: "💳 Enter the payment portal", url: paymentLink }],
            [{ text: "Return to cosmos", callback_data: "back" }]
          ]
        }
      }
    );

    bot.sendMessage(id,
      `ℹ️ Sacred notes:\n` +
      `• Complete the ritual in the opened portal\n` +
      `• Do **not** close this connection to the stars\n` +
      `• After success → the admin will crown you\n` +
      `• Any disturbance? Summon the sovereign directly`,
      { parse_mode: "Markdown" }
    );

    return;
  }

  if (data === "upgrade_prompt") {
    showLocked(id);
    return;
  }

  if (data === "back") {
    bot.sendMessage(id, "Returning to the heart of the galaxy...", {
      reply_markup: menu(p)
    });
    return;
  }

  // ── All games require access ──
  if (!hasAccess(id)) {
    showLocked(id);
    return;
  }

  // ── PROTECTED GAMES ──

  if (data === "slots") {
    const icons = ["🍒", "💎", "7️⃣", "👑", "🎰", "🌟", "🔥", "❤️"];
    const roll = Array(3).fill().map(() => icons[Math.floor(Math.random() * icons.length)]);
    const win = roll[0] === roll[1] && roll[1] === roll[2];
    if (win) { p.wallet += 5; p.wins++; }
    p.games++;
    updateRank(id);
    saveProfiles();

    bot.sendMessage(id,
      `🎰 *Neon Pulse Ignites* 🎰\n\n` +
      `${roll.join("  ✦  ")}\n\n` +
      `${win ? "💥 EUPHORIC JACKPOT — +$5" : "The stars whisper... try again, lover of fortune."}`,
      { parse_mode: "Markdown" }
    );
    return;
  }

  // ... place for your other games: spin, dice, roulette, hilo, couples, battle ...

  bot.sendMessage(id,
    `This realm is still awakening...\n` +
    `Game "${data}" will soon join the stars. Stay radiant. ✨`,
    { parse_mode: "Markdown" }
  );
});

// ================= ADMIN APPROVAL ==================
bot.onText(/\/approve (.+)/, (msg, match) => {
  if (msg.from.id !== ADMIN_ID) {
    bot.sendMessage(msg.chat.id, "⛔ Only the sovereign may wield this command.");
    return;
  }

  const query = match[1].trim();
  let userId;

  // Try username first
  const userByName = Object.values(profiles).find(u => u.name?.toLowerCase() === query.toLowerCase());
  if (userByName) {
    userId = userByName.id;
  } else {
    userId = Number(query);
    if (!profiles[userId]) {
      bot.sendMessage(msg.chat.id, "✨ No soul found under that name or ID.");
      return;
    }
  }

  const pending = pendingPayments[userId];
  if (!pending) {
    bot.sendMessage(msg.chat.id, "No pending ascension request for this soul.");
    return;
  }

  const profile = profiles[userId];
  if (pending.type === "vip") profile.vip = true;
  if (pending.type === "standard") profile.standard = true;

  delete pendingPayments[userId];
  saveProfiles();

  bot.sendMessage(userId,
    `🌟 *The cosmos has spoken.* 🌟\n\n` +
    `Your ${pending.type.toUpperCase()} ascension has been blessed.\n` +
    `The gates are open. The stars are yours.\n` +
    `Play, love, conquer. ✨💞`
  );

  bot.sendMessage(msg.chat.id,
    `Ascension granted: ${pending.type.toUpperCase()} → ${profile.name} (${userId})`
  );

  // Refresh menu
  bot.sendMessage(userId, "The galaxy awaits your return:", {
    reply_markup: menu(profile)
  });
});

// ================= LAUNCH SEQUENCE =================
console.log("🌌 GALAXY CASINO ARENA — ETERNAL REALM AWAKENED 🌌");
console.log("Luxury, romance, neon, victory — all under sovereign control.");