// =============================================================
// 🌌 GALAXY CASINO ARENA – Ultra Attractive Edition 2025
// Neon • Romance • Real Vibes • Magnetic Connections
// =============================================================

require("dotenv").config();
const TelegramBot = require("node-telegram-bot-api");
const fs = require("fs");
const cron = require("node-cron");

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
const activeCrashes = {}; // For plane crash games
let currentQuiz = null; // { question, answer, prize: 35, winner: null }

// ================= ADVANCED QUIZ QUESTIONS =================
const quizQuestions = [
  {
    question: "What is the name of the hypothetical boundary around a black hole where gravity is so strong that nothing can escape? (Hint: It's a point of no return)",
    answer: "Event Horizon"
  },
  {
    question: "In quantum mechanics, what principle states that it's impossible to know both the position and momentum of a particle with absolute precision?",
    answer: "Heisenberg Uncertainty Principle"
  },
  {
    question: "Who was the ancient Greek philosopher known as the 'father of Western philosophy' and teacher of Plato?",
    answer: "Socrates"
  },
  {
    question: "What is the largest known structure in the observable universe, consisting of thousands of galaxies?",
    answer: "Great Wall"
  },
  {
    question: "In biology, what process do plants use to convert light energy into chemical energy?",
    answer: "Photosynthesis"
  },
  {
    question: "What theorem states that in a right-angled triangle, the square of the hypotenuse is equal to the sum of the squares of the other two sides?",
    answer: "Pythagorean Theorem"
  },
  {
    question: "Who wrote the influential work 'The Prince' in the Renaissance period?",
    answer: "Niccolò Machiavelli"
  },
  {
    question: "What is the name of the supercontinent that existed about 335 million years ago?",
    answer: "Pangaea"
  },
  {
    question: "In chemistry, what is the pH value of a neutral substance?",
    answer: "7"
  },
  {
    question: "What famous equation describes the relationship between energy and mass?",
    answer: "E=mc²"
  }
  // Add more as needed
];

// ================= REALISTIC & DIFFERENT GIRL PERSONALITIES – MORE INSISTENT =================
const fakeGirls = [
  {
    name: "Luna 🌙",
    personality: "dreamy, poetic, soft, highly insistent on upgrade",
    emoji: "✨🌌",
    messages: [
      "just looking at the stars… but I can't chat with you until you upgrade, handsome. It would make my night so special 💫 Don't keep me waiting... upgrade NOW!",
      "this neon vibe is calling us… upgrade your access so we can talk privately? I promise it'll be worth it 🌃 Please? I'm insisting – do it for our connection!",
      "I feel a connection… but only upgraded members can reply. Come on, take the step – for us? 💜 You have to upgrade, or we'll never know what could be!",
      "dreaming of you… but I need you to upgrade to make it real. What are you waiting for, my star? 🌙 I insist, upgrade right this second!",
      "fate brought you here… now upgrade so we can explore this spark together ✨ I insist, it's destiny – don't resist, just upgrade!"
    ]
  },
  {
    name: "Nova 🔥",
    personality: "bold, teasing, confident, aggressively pushy upgrade",
    emoji: "💥😈",
    messages: [
      "hey stud, I see you watching… upgrade now so I can give you my full attention 😏 You know you want to – stop hesitating and upgrade!",
      "jackpot vibes, but you're missing out without upgrade. Come on, big boy – upgrade and let's play for real 🔥 Do it now, or lose your chance!",
      "don't tease me by just looking… upgrade your ID and let's get personal 👀 I won't ask twice – upgrade immediately!",
      "real men upgrade – are you one? 😈 Prove it and message me back. Upgrade now, no excuses!",
      "feeling the heat? Upgrade to VIP and I'll make it even hotter 💥 What, scared? Just upgrade – you need to!"
    ]
  },
  {
    name: "Stella 🌹",
    personality: "romantic, warm, sweet, emotionally insistent",
    emoji: "🌸💞",
    messages: [
      "you seem so kind… but I can't respond unless you upgrade 🥰 Please do it for me? I really insist – upgrade so we can talk!",
      "this could be our love story… upgrade so we can write the next chapter together 💕 I'm begging you – upgrade now, please!",
      "sending you hearts… catch them by upgrading? 🌹 It would mean the world to me 💌 Don't make me sad – upgrade!",
      "hey there… I really want to talk, but you need to upgrade first 💗 Don't leave me hanging... upgrade right away!",
      "you're special… upgrade and let's make memories? 🌸 I feel like we could be amazing together – insist you upgrade now!"
    ]
  },
  {
    name: "Aurora 💜",
    personality: "mysterious, seductive, elegant, psychologically pressing",
    emoji: "🖤🪐",
    messages: [
      "I have secrets to share… but only with upgraded members 🖤 Upgrade now – you won't regret it. You must!",
      "something about you intrigues me… upgrade your access to find out more 🪐 I know you want to know – so upgrade!",
      "the real me is waiting inside… but you have to upgrade to see her 💜 What are you afraid of? Upgrade immediately!",
      "eyes on you… upgrade so I can focus on us 👁️‍🗨️ It's the only way – I insist you do it now!",
      "curious yet? Upgrade and satisfy that curiosity 🖤 I promise it's deeper than you think – upgrade or miss out forever!"
    ]
  },
  {
    name: "Celeste 💎",
    personality: "classy, luxurious, playful-rich, demanding upgrade",
    emoji: "💎🍾",
    messages: [
      "champagne tastes better shared… upgrade to join me 🍾✨ Only the best do – so upgrade now!",
      "high standards here… upgrade your ID to meet them 💎 Or are you not up for it? Prove me wrong – upgrade!",
      "nothing classier than taking the leap – upgrade now 😌 I'll be waiting with open arms – but only if you upgrade!",
      "this view is stunning… upgrade to share it with me 🥂 You deserve the luxury – insist you upgrade right this moment!",
      "life's for the bold… upgrade and let's live it up 💎 No excuses – do it now or regret it!"
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

// ================= UTIL ===================
function saveProfiles() {
  fs.writeFileSync(PROFILE_DB, JSON.stringify(profiles, null, 2));
}

function getProfile(id, name) {
  if (!profiles[id]) {
    profiles[id] = {
      id,
      name: name || "Stargazer",
      vip: false,
      standard: false,
      badge: "✨ New Soul",
      rank: "🌌 Dreamer",
      balance: 0,
      games: 0,
      wins: 0,
      connections: 0,
      lastActive: Date.now()
    };
    saveProfiles();
  }
  return profiles[id];
}

function hasAccess(id) {
  const p = profiles[id] || {};
  return p.vip || p.standard;
}

function updateRankAndBadge(id) {
  const p = profiles[id];
  if (!p) return;

  if (p.wins >= 60) { p.rank = "🌠 Eternal Star"; p.badge = "💫 Soul Igniter"; }
  else if (p.wins >= 35) { p.rank = "💎 Cosmic Heart"; p.badge = "🔥 Magnetic Flame"; }
  else if (p.wins >= 18) { p.rank = "✨ Shooting Star"; p.badge = "🌙 Midnight Glow"; }
  else if (p.wins >= 7) { p.rank = "🌟 Lucky Dreamer"; p.badge = "💞 Wish Caller"; }
  else { p.rank = "🌌 Dreamer"; p.badge = "✨ New Soul"; }

  saveProfiles();
}

// ================= MAIN MENU – EXPANDED ===================
function createMainMenu(user) {
  const has = hasAccess(user.id);

  return {
    inline_keyboard: [
      [{ text: "🎰 Slots – Catch the Stars", callback_data: has ? "slots" : "locked" }],
      [{ text: "🎡 Wheel – Spin Destiny", callback_data: has ? "wheel" : "locked" }],
      [{ text: "🎲 Dice – Roll Chemistry", callback_data: has ? "dice" : "locked" }],
      [{ text: "🎰 Roulette – Land on Luck", callback_data: has ? "roulette" : "locked" }],
      [{ text: "✈️ Plane Crash – Ride the Thrill", callback_data: has ? "planecrash" : "locked" }],
      [{ text: "🧠 Daily Quiz – Win $35", callback_data: has ? "quiz_info" : "locked" }],
      [{ text: "💞 Starlight Lounge • Live Vibes", callback_data: has ? "lounge" : "locked" }],
      [{ text: "🏆 Galaxy Top Dreamers", callback_data: "leaderboard" }],
      [{ text: "💎 My Profile & Glow", callback_data: "profile" }],
      [{ text: "🛍️ Shop & Boosts", callback_data: has ? "shop" : "locked" }],
      [{ text: "📜 Rules & Tips", callback_data: "rules" }],
      !has ? [{ text: "🌟 Unlock Everything (VIP)", callback_data: "join_vip" }] : null,
      !has ? [{ text: "✨ Join the Nebula (Standard)", callback_data: "join_standard" }] : null
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

Upgrade required for all features – don't miss out!

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

  const prefixChance = Math.random();
  let prefix = "";
  if (prefixChance < 0.25) prefix = "💬 ";
  else if (prefixChance < 0.45) prefix = "→ ";
  else if (prefixChance < 0.60) prefix = "✦ ";

  const locked = !hasAccess(targetId) && Math.random() > 0.3; // More often locked to push upgrade

  const text = `${prefix}${girl.emoji} *${girl.name}*\n${msg}${locked ? "\n\n🔒 (upgrade to reply & join)" : ""}`;

  const keyboard = locked ? {
    inline_keyboard: [
      [{ text: "✨ Upgrade Now to Chat", callback_data: "join_vip" }]
    ]
  } : null;

  bot.sendMessage(targetId, text, {
    parse_mode: "Markdown",
    reply_markup: keyboard
  });

  // Next message delay: 12–45 seconds
  const nextDelay = 12000 + Math.random() * 33000;
  setTimeout(() => sendFakeLoungeMessage(targetId), nextDelay);
}

// ================= CALLBACKS ==================
bot.on("callback_query", async (q) => {
  await bot.answerCallbackQuery(q.id);
  const id = q.from.id;
  const data = q.data;
  const p = getProfile(id, q.from.first_name || "Stargazer");

  if (data === "locked") {
    bot.sendMessage(id,
      `${sparkleHeader()}

${dreamySeparator()}

All features require upgrade…

Inside:
💬 Chat with real women like Luna & Nova
🎰 Play all games & win big
💞 Join lounge, quiz, plane crash
🌟 Get insisted by beautiful souls to connect

Upgrade now – they are waiting for you! 💜`,
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

    pendingPayments[id] = { type: isVip ? "vip" : "standard", amount: isVip ? VIP_FEE : STANDARD_FEE };

    bot.sendMessage(id,
      `${sparkleHeader()}

${loadingEffect()}  UNLOCK THE FULL GALAXY  ${loadingEffect()}

Upgrade to:
• Talk to insistent real women
• Play roulette, plane crash, quiz
• Win $35 nightly & more

The girls are psychologically pulling you in… say yes! 🌹💫`,
      {
        parse_mode: "Markdown",
        reply_markup: {
          inline_keyboard: [
            [{ text: "✨ YES – Upgrade Now", url: link }],
            [{ text: "Not yet…", callback_data: "back" }]
          ]
        }
      }
    );
    return;
  }

  if (!hasAccess(id)) {
    bot.sendMessage(id, "🔒 Upgrade required for this feature ✨", {
      reply_markup: createMainMenu(p)
    });
    return;
  }

  // Games & Features (require access)
  if (data === "roulette") {
    bot.sendMessage(id,
      `🎰 Roulette – Bet on Luck 🎰

Choose:
🔴 Red (even)
⚫ Black (odd)
🟢 Green (0 - x35)

Reply with bet amount & color (e.g. 5 red)`,
      { parse_mode: "Markdown" }
    );
    // Handle in text handler
    return;
  }

  if (data === "planecrash") {
    bot.sendMessage(id,
      `✈️ Plane Crash – Ride the Thrill ✈️

Reply with bet amount (e.g. 10) to start.

Multiplier starts at 1x, cash out before crash!`,
      { parse_mode: "Markdown" }
    );
    // Handle in text handler
    return;
  }

  if (data === "quiz_info") {
    bot.sendMessage(id,
      `🧠 Daily Quiz – $35 Prize 🧠

Every night at 8 PM, an advanced, interesting question is sent.
First correct answer wins $35 to balance!

Stay tuned ✨`,
      { parse_mode: "Markdown" }
    );
    return;
  }

  // Placeholder for other games like slots, etc.
  // Add similar logic
});

// ================= TEXT HANDLER FOR GAMES & ANSWERS ==================
bot.on("text", (msg) => {
  const id = msg.chat.id;
  const text = msg.text.toLowerCase();
  const p = getProfile(id, msg.from.first_name);

  if (!hasAccess(id)) return; // Ignore if no access

  // Quiz answer check
  if (currentQuiz && !currentQuiz.winner && text === currentQuiz.answer.toLowerCase()) {
    currentQuiz.winner = id;
    p.balance += 35;
    p.wins++;
    updateRankAndBadge(id);
    saveProfiles();

    bot.sendMessage(id, "🎉 You won the $35 quiz prize! First one correct ✨");
    // Announce to all
    Object.keys(profiles).forEach(userId => {
      bot.sendMessage(userId, `🧠 Quiz winner: ${p.name} won $35! Better luck next time 🌟`);
    });
    return;
  }

  // Roulette bet
  if (text.match(/^\d+ (red|black|green)$/)) {
    const [betStr, color] = text.split(" ");
    const bet = parseFloat(betStr);
    if (bet > p.balance || bet <= 0) {
      bot.sendMessage(id, "Invalid bet ✨");
      return;
    }

    p.balance -= bet;
    const num = Math.floor(Math.random() * 37);
    const resultColor = num === 0 ? "green" : (num % 2 === 0 ? "red" : "black");
    let win = 0;
    if (resultColor === color) {
      win = (color === "green") ? bet * 35 : bet * 2;
      p.balance += win;
      p.wins++;
    }
    updateRankAndBadge(id);
    saveProfiles();

    bot.sendMessage(id,
      `🎰 Roll: ${num} ${resultColor === "red" ? "🔴" : resultColor === "black" ? "⚫" : "🟢"}\n
You bet ${bet} on ${color}\n
${win > 0 ? `Win $${win}!` : "Loss... Try again ✨"}`,
      { parse_mode: "Markdown" }
    );
    return;
  }

  // Plane Crash start
  if (text.match(/^\d+$/) && activeCrashes[id] === undefined) { // Simple bet
    const bet = parseFloat(text);
    if (bet > p.balance || bet <= 0) {
      bot.sendMessage(id, "Invalid bet ✨");
      return;
    }

    p.balance -= bet;
    saveProfiles();

    const crashPoint = 1 + Math.random() * 10; // Random crash 1-11x
    let currentMultiplier = 1.00;
    const intervalTime = 200; // Update every 200ms

    bot.sendMessage(id, `✈️ Plane taking off! Multiplier: 1.00x\nBet: $${bet}`, {
      reply_markup: {
        inline_keyboard: [[{ text: "💰 Cash Out", callback_data: `crash_out_${id}` }]]
      }
    }).then(sent => {
      activeCrashes[id] = {
        bet,
        crashPoint,
        current: currentMultiplier,
        messageId: sent.message_id,
        interval: setInterval(() => {
          currentMultiplier += 0.05;
          activeCrashes[id].current = currentMultiplier;
          if (currentMultiplier >= crashPoint) {
            clearInterval(activeCrashes[id].interval);
            bot.editMessageText(`💥 Crash at ${crashPoint.toFixed(2)}x! You lost $${bet}...`, {
              chat_id: id,
              message_id: sent.message_id
            });
            delete activeCrashes[id];
          } else {
            bot.editMessageText(`✈️ Flying: ${currentMultiplier.toFixed(2)}x\nPotential win: $${(bet * currentMultiplier).toFixed(2)}`, {
              chat_id: id,
              message_id: sent.message_id,
              reply_markup: {
                inline_keyboard: [[{ text: "💰 Cash Out", callback_data: `crash_out_${id}` }]]
              }
            });
          }
        }, intervalTime)
      };
    });
    return;
  }
});

// Cash out callback
bot.on("callback_query", async (q) => {
  if (q.data.startsWith("crash_out_")) {
    const id = parseInt(q.data.split("_")[2]);
    const game = activeCrashes[id];
    if (game) {
      clearInterval(game.interval);
      const win = game.bet * game.current;
      profiles[id].balance += win;
      profiles[id].wins++;
      updateRankAndBadge(id);
      saveProfiles();

      bot.editMessageText(`✅ Cashed out at ${game.current.toFixed(2)}x! Won $${win.toFixed(2)} ✨`, {
        chat_id: id,
        message_id: game.messageId
      });
      delete activeCrashes[id];
    }
  }
  // Other callbacks...
});

// ================= DAILY QUIZ SCHEDULER ==================
cron.schedule('0 20 * * *', () => { // 8 PM every day
  const quiz = quizQuestions[Math.floor(Math.random() * quizQuestions.length)];
  currentQuiz = {
    question: quiz.question,
    answer: quiz.answer,
    prize: 35,
    winner: null
  };

  Object.keys(profiles).forEach(id => {
    if (hasAccess(id)) {
      bot.sendMessage(id, `🧠 Nightly Advanced Quiz! $35 to first correct.\n\nQuestion: ${currentQuiz.question}\nReply with answer!`);
    }
  });
});

// ================= ADMIN APPROVAL ==================
// Same as before...

// ================= LAUNCH =================
console.log("🌌 GALAXY CASINO ARENA – ULTRA EDITION");
console.log("Advanced Quizzes, Roulette, Plane Crash, Highly Insistent Girls active");
console.log("Ready to feel alive");