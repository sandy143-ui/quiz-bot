// =============================================================
// 🌌 GALAXY CASINO ARENA – Ultra Attractive Edition 2025
// Neon • Romance • Real Vibes • Magnetic Connections
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

const pendingPayments = {};
const publicChatViewers = new Set();
const loungeActive = new Set();

// ================= REALISTIC & DIFFERENT GIRL PERSONALITIES =================
const fakeGirls = [
  {
    name: "Luna 🌙",
    personality: "dreamy, poetic, soft",
    emoji: "✨🌌",
    messages: [
      "just looking at the stars through the window… feels like tonight something magical could happen 💫",
      "anyone else feeling this soft neon vibe? like the night is whispering your name… 🌃",
      "I love when someone really sees you… not just looks, but *sees* 💜",
      "dreaming of deep conversations and gentle touches under city lights… you in? 🌙",
      "this place feels alive tonight… like fate is playing with us ✨"
    ]
  },
  {
    name: "Nova 🔥",
    personality: "bold, teasing, confident",
    emoji: "💥😈",
    messages: [
      "who’s brave enough to keep up with me tonight? 😏",
      "just hit a jackpot… now I need someone to celebrate *properly* with 🔥",
      "don’t just stare… come say hi if you dare 👀💋",
      "boring boys stay outside… real ones step into my orbit 😈",
      "feeling dangerous tonight… who wants to match my energy? 💥"
    ]
  },
  {
    name: "Stella 🌹",
    personality: "romantic, warm, sweet",
    emoji: "🌸💞",
    messages: [
      "hi everyone 🥰 just wanted to say you all look extra beautiful tonight",
      "is it just me or does this place feel like the start of a love story? 💕",
      "sending little hearts to whoever needs one right now 🌹💌",
      "I believe the best nights begin with a simple “hey”… so… hey 💗",
      "looking for someone kind… someone real… is that you? 🌸"
    ]
  },
  {
    name: "Aurora 💜",
    personality: "mysterious, seductive, elegant",
    emoji: "🖤🪐",
    messages: [
      "some nights are meant to be remembered… this feels like one of them 🖤",
      "I only speak when someone truly catches my attention… do you? 🪐",
      "the lounge is too bright for secrets… shall we find a quieter corner? 💜",
      "there’s something about you… I can feel it even from here 👁️‍🗨️",
      "not everyone gets to know the real me… curious if you’re one of them? 🖤"
    ]
  },
  {
    name: "Celeste 💎",
    personality: "classy, luxurious, playful-rich",
    emoji: "💎🍾",
    messages: [
      "just ordered another round of something sparkling… join me? 🍾✨",
      "high stakes, high vibes, high standards… who matches? 💎",
      "nothing sexier than confidence and good taste 😌",
      "this view deserves to be shared with someone special… any volunteers? 🥂",
      "life’s too short for average nights… let’s make it unforgettable 💎"
    ]
  }
];

// ================= VISUAL HELPERS =================
function sparkleHeader() {
  return `✦ ┈┈┈┈┈┈┈┈┈┈┈┈┈┈ ┈✦
      🌌  GALAXY  CASINO  ARENA  🌌
    💫  neon  •  romance  •  real sparks  💫
✦ ┈┈┈┈┈┈┈┈┈┈┈┈┈┈ ┈✦`;
}

function dreamySeparator() {
  return `✨ ⋆｡°✩ ⋆｡°✩ ⋆｡°✩ ⋆｡°✩ ✨`;
}

function loadingEffect() {
  return `🌙✨💫🌟💫✨🌙`;
}

// ================= MAIN MENU ===================
function createMainMenu(user) {
  const has = hasAccess(user.id);

  return {
    inline_keyboard: [
      [{ text: "🎰 Slots – Catch the Stars", callback_data: has ? "slots" : "locked" }],
      [{ text: "🎡 Wheel – Spin Destiny", callback_data: has ? "wheel" : "locked" }],
      [{ text: "🎲 Dice – Roll Chemistry", callback_data: has ? "dice" : "locked" }],
      [{ text: "🎰 Roulette – Land on Love", callback_data: has ? "roulette" : "locked" }],
      [{ text: "💞 Starlight Lounge • Live Vibes", callback_data: has ? "lounge" : "locked" }],
      [{ text: "🏆 Galaxy Top Dreamers", callback_data: "leaderboard" }],
      [{ text: "💎 My Profile & Glow", callback_data: "profile" }],
      !has ? { text: "🌟 Unlock Everything (VIP)", callback_data: "join_vip" } : null,
      !has ? { text: "✨ Join the Nebula", callback_data: "join_standard" } : null
    ].filter(Boolean)
  };
}

// ================= START – FIRST IMPRESSION ===================
bot.onText(/\/start/, (msg) => {
  const id = msg.chat.id;
  const name = msg.from.first_name || "Stargazer";
  const p = getProfile(id, name);

  const welcome = `${sparkleHeader()}

${loadingEffect()}

${name}… the galaxy just lit up when you arrived 🌠

${p.badge}  •  ${p.rank}
Glow: $${p.balance.toFixed(2)}

💭 Right now people are laughing, flirting, winning big…
beautiful souls are typing messages… looking for someone like you.

You can already see the conversation flowing below 👇
Real energy. Real people. Real possibilities.

Ready to become part of the night? 💜✨`;

  bot.sendMessage(id, welcome, {
    parse_mode: "Markdown",
    reply_markup: createMainMenu(p)
  });

  publicChatViewers.add(id);
  p.lastActive = Date.now();
  saveProfiles();

  // First fake message comes very quickly
  setTimeout(() => sendFakeLoungeMessage(id), 1800 + Math.random() * 3000);
});

// ================= FAKE CHAT – LIVING & BREATHING ===================
function sendFakeLoungeMessage(targetId) {
  if (!publicChatViewers.has(targetId)) return;

  const girl = fakeGirls[Math.floor(Math.random() * fakeGirls.length)];
  const msg = girl.messages[Math.floor(Math.random() * girl.messages.length)];

  // Random "group chat" feeling
  const prefixChance = Math.random();
  let prefix = "";
  if (prefixChance < 0.25) prefix = "💬 ";
  else if (prefixChance < 0.45) prefix = "→ ";
  else if (prefixChance < 0.60) prefix = "✦ ";

  const locked = !hasAccess(targetId) && Math.random() > 0.4;

  const text = `${prefix}${girl.emoji} *${girl.name}*\n${msg}${locked ? "\n\n🔒 (unlock to reply)" : ""}`;

  const keyboard = locked ? {
    inline_keyboard: [
      [{ text: "✨ Want to join the conversation?", callback_data: "join_vip" }]
    ]
  } : null;

  bot.sendMessage(targetId, text, {
    parse_mode: "Markdown",
    reply_markup: keyboard
  });

  // Next message delay: 12–45 seconds (feels natural)
  const nextDelay = 12000 + Math.random() * 33000;
  setTimeout(() => sendFakeLoungeMessage(targetId), nextDelay);
}

// ================= CALLBACKS ==================
bot.on("callback_query", async (q) => {
  await bot.answerCallbackQuery(q.id);
  const id = q.from.id;
  const data = q.data;
  const p = getProfile(id, q.from.first_name || "Stargazer");

  if (data === "locked" || data === "teaser") {
    bot.sendMessage(id,
      `${sparkleHeader()}

${dreamySeparator()}

You're standing right at the entrance of something beautiful…

Inside:
💬 Real conversations happening right now
🎰 Bigger wins & better multipliers
💞 Chance to actually talk back & connect
🌟 People looking for someone exactly like you

One click and you become part of the story 💜`,
      {
        parse_mode: "Markdown",
        reply_markup: createMainMenu(p)
      }
    );
    return;
  }

  if (data === "join_vip" || data === "join_standard") {
    const isVip = data === "join_vip";
    const link = isVip
      ? "https://pay.ziina.com/fienix/71k3VbAv0-10$"
      : "https://pay.ziina.com/fienix/ClREPEc08_5$";

    bot.sendMessage(id,
      `${sparkleHeader()}

${loadingEffect()}  UNLOCK THE FULL GALAXY  ${loadingEffect()}

What opens for you instantly:
• Reply to Luna, Nova, Stella & others 💬
• Join private messages & secret groups
• See who’s really online *right now*
• Higher rewards + glowing badges

The most beautiful moments only happen inside…
Someone might already be hoping you say yes tonight 🌹💫`,
      {
        parse_mode: "Markdown",
        reply_markup: {
          inline_keyboard: [
            [{ text: "✨ YES – Let me in", url: link }],
            [{ text: "Not yet…", callback_data: "back" }]
          ]
        }
      }
    );
    return;
  }

  if (data === "lounge") {
    if (!hasAccess(id)) {
      bot.sendMessage(id,
        `${sparkleHeader()}

💞 STARLIGHT LOUNGE

You can see the lights, hear the laughter…
but the real conversations, the private invites, the sparks — they happen behind the velvet curtain.

Unlock your pass so you can step in and actually be seen 💎✨`,
        { parse_mode: "Markdown", reply_markup: createMainMenu(p) }
      );
      return;
    }

    loungeActive.add(id);

    bot.sendMessage(id,
      `${sparkleHeader()}

💞  You are now inside the STARLIGHT LOUNGE  💞

${dreamySeparator()}

Soft music… rose & champagne scent in the air…
people smiling, eyes meeting across the room…

You’re visible now.  
Type anything — someone might notice you tonight 🌹

(Real energy. Real people. Right now.)`,
      { parse_mode: "Markdown" }
    );

    p.lastActive = Date.now();
    saveProfiles();
    return;
  }

  // Other game buttons can be added similarly
  // For now — simple placeholder
  if (["slots", "wheel", "dice", "roulette"].includes(data)) {
    if (!hasAccess(id)) {
      bot.sendMessage(id, "🔒 This game opens only after you join the night ✨", {
        reply_markup: createMainMenu(p)
      });
    } else {
      bot.sendMessage(id, `${loadingEffect()} Game starting... get ready! 🌟`);
      // add your game logic here
    }
  }
});

// ================= ADMIN APPROVAL ==================
bot.onText(/\/approve (.+)/, (msg, match) => {
  if (msg.from.id !== ADMIN_ID) return;

  const query = match[1].trim();
  let userId = Number(query);
  const byName = Object.values(profiles).find(u => u.name?.toLowerCase() === query.toLowerCase());
  if (byName) userId = byName.id;

  const pending = pendingPayments[userId];
  if (!pending || !profiles[userId]) return;

  const profile = profiles[userId];
  profile[pending.type] = true;
  delete pendingPayments[userId];
  saveProfiles();

  bot.sendMessage(userId,
    `${sparkleHeader()}

🌟  WELCOME TO THE REAL GALAXY  🌟

You can now:
• Talk back to the girls
• Join private conversations & groups
• Be seen & noticed
• Feel the full chemistry

Go to the Starlight Lounge…  
someone might be waiting for your first word tonight 💜✨`,
    {
      parse_mode: "Markdown",
      reply_markup: createMainMenu(profile)
    }
  );
});

// ================= CLEANUP ==================
setInterval(() => {
  const now = Date.now();
  for (const id of publicChatViewers) {
    const p = profiles[id];
    if (!p || now - p.lastActive > 60 * 60 * 1000) { // 1 hour
      publicChatViewers.delete(id);
      loungeActive.delete(id);
    }
  }
}, 15 * 60 * 1000);

// ================= LAUNCH =================
console.log("🌌 GALAXY CASINO ARENA – ULTRA EDITION");
console.log("Multi-personality girls • heavy visuals • living chat simulation");
console.log("Ready to feel alive");