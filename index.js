// =============================================================
// 🌌 GALAXY CASINO ARENA — FORBIDDEN PLEASURE REALM
// Neon • Lust • Romance • Luxury • Seduction • Wet Dreams
// Teaser Tricks + Heavy Seduction → Impossible to Ignore Upgrade
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

let pendingPayments = {};
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
      name: name || "Naughty Stranger",
      vip: false,
      standard: false,
      badge: "🔥 Still Untouched",
      rank: "🥉 Peeking Only",
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

  if (p.wins >= 50) { p.rank = "👑 King of Orgasms"; p.badge = "💦 Lord of Climaxes"; }
  else if (p.wins >= 25) { p.rank = "💎 Prince of Deep Thrusts"; p.badge = "🌹 Queen of Wet Dreams"; }
  else if (p.wins >= 10) { p.rank = "🏆 Master of Moans"; p.badge = "⚡ Electric Fuck"; }
  else if (p.wins >= 5)  { p.rank = "🥈 Knight of Kink"; p.badge = "🔥 Burning Desire"; }
  else { p.rank = "🥉 Peeking Only"; p.badge = "🔥 Still Untouched"; }

  saveProfiles();
}

// ================= SEDUCTIVE VISUALS =================
function banner() {
  return `╔════════════════════════════════════════════╗
 🌌  GALAXY CASINO ARENA  —  WET & WAITING  🌌
╚════════════════════════════════════════════╝`;
}

// ================= START & MENU ===================
bot.onText(/\/start/, (msg) => {
  const id = msg.chat.id;
  const name = msg.from.first_name || "Naughty Stranger";
  const p = getProfile(id, name);

  const text = `${banner()}

💋 *Hey ${name}…* 💋
🏅 ${p.badge}
🎖 ${p.rank}
💰 Wallet: $${p.wallet}

I’ve been thinking about you…  
imagining your hands on me while the neon lights flicker across my skin.  
The way you’d make me moan when you finally win big…

But right now… you can only watch.  
I’m so close… yet so far…  
Unless you decide to **take** what’s been waiting for you.

Ready to stop teasing yourself?`;

  bot.sendMessage(id, text, {
    parse_mode: "Markdown",
    reply_markup: menu(p)
  });
});

function menu(p) {
  const access = hasAccess(p.id);

  const kb = [
    [{ text: "🎰 Slots That Make Me Wet", callback_data: access ? "slots" : "upgrade_prompt" }],
    [{ text: "🎡 Wheel — Spin Me Harder", callback_data: access ? "spin" : "upgrade_prompt" }],
    [{ text: "🎲 Dice Rolling on My Thighs", callback_data: access ? "dice" : "upgrade_prompt" }],
    [{ text: "🎰 Roulette — Bet on My Body", callback_data: access ? "roulette" : "upgrade_prompt" }],
    [{ text: "🃏 Hi-Lo — Will I Come?", callback_data: access ? "hilo" : "upgrade_prompt" }],
    [{ text: "💞 Private Sex Lounge", callback_data: access ? "couples" : "upgrade_prompt" }],
    [{ text: "⚡ Fuck Fight Arena", callback_data: access ? "battle" : "upgrade_prompt" }],
    [{ text: "🏆 Top Fuckers Leaderboard", callback_data: "leaderboard" }],
    [{ text: "🛍 Shop of Dirty Secrets", callback_data: "shop" }],
    [{ text: "💎 My Wet Little Wallet", callback_data: "wallet" }]
  ];

  if (!access) {
    kb.push([{ text: "💎 Unlock Me — VIP Full Access", callback_data: "join_vip" }]);
    kb.push([{ text: "✨ Standard — Let Me Tease You Inside", callback_data: "join_standard" }]);
  }

  return { inline_keyboard: kb };
}

// ================= LOCKED / MAX TEASER FLOW =================
function showLocked(id) {
  bot.sendMessage(id,
    `🔥 *You’re so close… I can almost feel your breath on my neck.* 🔥\n\n` +
    `Right now I’m touching myself thinking about you winning,\n` +
    `my fingers sliding while I imagine your cock inside me when you hit jackpot.\n\n` +
    `But you’re still outside… watching through the glass.\n` +
    `I’m dripping for you… moaning your name…\n` +
    `All you have to do is say yes and I’ll open everything for you.\n\n` +
    `Don’t make me wait any longer… please… 💦`,
    {
      parse_mode: "Markdown",
      reply_markup: menu(profiles[id])
    }
  );
}

// ================= MAIN CALLBACK HANDLER ==================
bot.on("callback_query", async (q) => {
  bot.answerCallbackQuery(q.id);

  const id = q.from.id;
  const data = q.data;
  const p = getProfile(id, q.from.first_name || "Naughty Stranger");

  // ── Public ──
  if (data === "leaderboard") {
    const top = Object.values(profiles)
      .sort((a, b) => b.wins - a.wins)
      .slice(0, 10)
      .map((u, i) => `${i + 1}. ${u.name} — 🏆 ${u.wins} orgasms given | ${u.rank}`)
      .join("\n") || "No one has fucked the leaderboard yet…";

    bot.sendMessage(id,
      `🏆 *Top Fuckers of the Galaxy* 🏆\n\n${top}\n\n` +
      `Your name could be here… written in cum and lipstick…`,
      { parse_mode: "Markdown" }
    );
    return;
  }

  if (data === "wallet") {
    bot.sendMessage(id,
      `💦 *My Wet Little Wallet* 💦\n\n` +
      `Balance: $${p.wallet}\n` +
      `Times I’ve been fucked: ${p.games}\n` +
      `Times I came for you: ${p.wins}\n` +
      `Rank: ${p.rank}\n` +
      `Mood: ${p.badge}\n\n` +
      `Come spend it on me… I’m already soaked thinking about it.`,
      { parse_mode: "Markdown" }
    );
    return;
  }

  if (data === "shop") {
    bot.sendMessage(id,
      `🛍 *Shop of Dirty Little Secrets* 🛍\n\n` +
      `🎟 Double Squirt Boost — $10 💦\n` +
      `💎 Crown of Deepthroat Queen — $25 👑\n` +
      `🔥 Mega Fuck Spin Pack — $5 🔥\n\n` +
      `Tell the boss what filthy thing you want… I’ll make sure you get it.`,
      { parse_mode: "Markdown" }
    );
    return;
  }

  // ── Upgrade buttons ──
  if (data === "join_vip" || data === "join_standard") {
    const type = data === "join_vip" ? "vip" : "standard";
    const amount = type === "vip" ? VIP_FEE : STANDARD_FEE;

    const paymentLink = type === "vip"
      ? "https://pay.ziina.com/fienix/71k3VbAv0"
      : "https://pay.ziina.com/fienix/ClREPEc08";

    pendingPayments[id] = {
      type,
      amount,
      link: paymentLink,
      requestedAt: Date.now()
    };

    const title = type === "vip" ? "VIP" : "Standard";

    bot.sendMessage(id,
      `💦 *Let me finally be yours — ${title} $${amount}* 💦\n\n` +
      `I’m already on my knees thinking about you.\n` +
      `My lips parted, thighs trembling, waiting for you to walk in.\n` +
      `Every win would end with me riding you until we both scream.\n\n` +
      `Pay now… and I’ll spread wide open just for you.`,
      {
        parse_mode: "Markdown",
        reply_markup: {
          inline_keyboard: [
            [{ text: "💳 Fuck yes — take me", url: paymentLink }],
            [{ text: "Still gonna make me beg?", callback_data: "back" }]
          ]
        }
      }
    );

    bot.sendMessage(id,
      `💋 Quick rules:\n` +
      `• Finish inside the portal\n` +
      `• Don’t leave me dripping and waiting\n` +
      `• After you cum — I’ll be completely unlocked for you\n` +
      `• Need me sooner? Call the boss`,
      { parse_mode: "Markdown" }
    );

    return;
  }

  if (data === "upgrade_prompt") {
    showLocked(id);
    return;
  }

  if (data === "back") {
    bot.sendMessage(id, "Mmm… you’re making me wait even longer… naughty boy…", {
      reply_markup: menu(p)
    });
    return;
  }

  // ── Games require access ──
  if (!hasAccess(id)) {
    showLocked(id);
    return;
  }

  // ── FULL GAMES ──

  if (data === "slots") {
    const icons = ["🍒", "💎", "7️⃣", "👑", "🎰", "🌹", "🔥", "💋", "😈", "💦"];
    const roll = Array(3).fill().map(() => icons[Math.floor(Math.random() * icons.length)]);
    const win = roll[0] === roll[1] && roll[1] === roll[2];
    if (win) { p.wallet += 5; p.wins++; }
    p.games++;
    updateRank(id);
    saveProfiles();

    bot.sendMessage(id,
      `🎰 *Slots That Make Me Drip* 🎰\n\n` +
      `${roll.join("  💦  ")}\n\n` +
      `${win ? "💦 FUCK YES! Jackpot +$5 — come fuck me while I’m shaking." : "Ohhh… so close… I’m throbbing… spin again baby."}`,
      { parse_mode: "Markdown" }
    );
    return;
  }

  if (data === "spin") {
    const prizes = [0, 1, 2, 5, 10, 20, 50];
    const prize = prizes[Math.floor(Math.random() * prizes.length)];
    p.wallet += prize;
    p.games++;
    updateRank(id);
    saveProfiles();

    bot.sendMessage(id,
      `🎡 *Wheel of Wet Dreams* 🎡\n\n` +
      `I’m spinning my hips just for you…\n\n` +
      `You win **$${prize}** — now come spend it deep inside me 💋`,
      { parse_mode: "Markdown" }
    );
    return;
  }

  if (data === "dice") {
    const d1 = Math.floor(Math.random() * 6) + 1;
    const d2 = Math.floor(Math.random() * 6) + 1;
    const win = d1 === d2;
    if (win) { p.wallet += 4; p.wins++; }
    p.games++;
    updateRank(id);
    saveProfiles();

    bot.sendMessage(id,
      `🎲 *Dice Rolling Between My Legs* 🎲\n\n` +
      `${getDiceEmoji(d1)}  😈  ${getDiceEmoji(d2)}\n\n` +
      `${win ? "💦 Perfect… +$4 — now fuck me like the dice just did." : "Mmm… almost inside me… roll again, daddy."}`,
      { parse_mode: "Markdown" }
    );
    return;
  }

  if (data === "roulette") {
    bot.sendMessage(id,
      `🎰 *Roulette — Bet Where You’ll Cum* 🎰\n\n` +
      `Red = my mouth… Black = deep inside…\n` +
      `Choose baby… I’m already clenching thinking about it.`,
      {
        parse_mode: "Markdown",
        reply_markup: {
          inline_keyboard: [
            [{ text: "🔴 Red — Finish on my tongue", callback_data: "roulette_red" }],
            [{ text: "⚫ Black — Fill me up", callback_data: "roulette_black" }]
          ]
        }
      }
    );
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

    bot.sendMessage(id,
      `🎡 *Wheel stops…* 🎡\n\n` +
      `Result: ${num} ${getColorEmoji(color)}\n` +
      `You chose: ${getColorEmoji(bet)}\n\n` +
      `${win ? "💦 Oh god YES! +$5 — cum wherever you bet, lover." : "Mmm… house wins… but I still want your load… try again."}`,
      { parse_mode: "Markdown" }
    );
    return;
  }

  if (data === "hilo") {
    const first = Math.floor(Math.random() * 13) + 1;
    bot.sendMessage(id,
      `🃏 *Hi-Lo — Will You Make Me Scream?* 🃏\n\n` +
      `Card: ${getCardEmoji(first)}\n\n` +
      `Higher or lower… choose how deep you want to go inside me.`,
      {
        parse_mode: "Markdown",
        reply_markup: {
          inline_keyboard: [
            [{ text: "⬆️ Higher — Fuck me harder", callback_data: `hilo_hi_${first}` }],
            [{ text: "⬇️ Lower — Eat me out", callback_data: `hilo_lo_${first}` }]
          ]
        }
      }
    );
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

    bot.sendMessage(id,
      `🃏 *Cards exposed… just like me* 🃏\n\n` +
      `${getCardEmoji(first)} → ${getCardEmoji(second)}\n\n` +
      `You wanted: ${guess.toUpperCase()}\n\n` +
      `${win ? "💦 YESSS! +$4 — now make me cum for real." : "So close… I’m throbbing… guess again baby."}`,
      { parse_mode: "Markdown" }
    );
    return;
  }

  if (data === "couples") {
    couplesQueue.push(id);
    bot.sendMessage(id,
      `💞 *Romance Lounge — I Need You Inside* 💞\n\n` +
      `I’m touching myself waiting for my perfect match…\n` +
      `Who’s gonna fuck me senseless tonight? 😈💦`
    );

    if (couplesQueue.length >= 2) {
      const a = couplesQueue.shift();
      const b = couplesQueue.shift();
      bot.sendMessage(a, `💕 *Your fuck buddy is here* 💕\nGet ready — I’m already soaked and spreading for you. 👄`);
      bot.sendMessage(b, `💕 *Your fuck buddy is here* 💕\nGet ready — I’m already soaked and spreading for you. 👄`);
    }
    return;
  }

  if (data === "battle") {
    const win = Math.random() > 0.5;
    if (win) { p.wallet += 3; p.wins++; }
    p.games++;
    updateRank(id);
    saveProfiles();

    bot.sendMessage(id,
      `⚡ *Battle — Fuck or Be Fucked* ⚡\n\n` +
      `${win ? "💦 You win! +$3 — now pin me down and take your prize." : "💔 Lost… but I still want you to fuck me rough… rematch?"}`,
      { parse_mode: "Markdown" }
    );
    return;
  }

  bot.sendMessage(id,
    `This dirty little fantasy is still loading…\n` +
    `Come back soon — I’ll be naked and waiting just for you. 💋`,
    { parse_mode: "Markdown" }
  );
});

// ================= ADMIN APPROVAL ==================
bot.onText(/\/approve (.+)/, (msg, match) => {
  if (msg.from.id !== ADMIN_ID) {
    bot.sendMessage(msg.chat.id, "⛔ Only the one who fucks the rules may use this.");
    return;
  }

  const query = match[1].trim();
  let userId;

  const userByName = Object.values(profiles).find(u => u.name?.toLowerCase() === query.toLowerCase());
  if (userByName) {
    userId = userByName.id;
  } else {
    userId = Number(query);
    if (!profiles[userId]) {
      bot.sendMessage(msg.chat.id, "No one that tasty in my bed yet.");
      return;
    }
  }

  const pending = pendingPayments[userId];
  if (!pending) {
    bot.sendMessage(msg.chat.id, "No pending fuck request from this one.");
    return;
  }

  const profile = profiles[userId];
  if (pending.type === "vip") profile.vip = true;
  if (pending.type === "standard") profile.standard = true;

  delete pendingPayments[userId];
  saveProfiles();

  bot.sendMessage(userId,
    `💦 *You just bought yourself the best fuck of your life.* 💦\n\n` +
    `Your ${pending.type.toUpperCase()} access is wide open.\n` +
    `I’m naked, wet, and waiting… come ruin me. 😈💋`
  );

  bot.sendMessage(msg.chat.id,
    `Unlocked & fucked: ${pending.type.toUpperCase()} → ${profile.name} (${userId})`
  );

  bot.sendMessage(userId, "I’m all yours now:", {
    reply_markup: menu(profile)
  });
});

// ================= LAUNCH =================
console.log("🌌 FORBIDDEN PLEASURE REALM — DRIPPING & READY 🌌");
console.log("Seduction maxed. They won’t resist.");