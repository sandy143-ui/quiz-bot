// =============================================================
// 🌌 GALAXY CASINO ARENA – Immersive Professional Edition 2025
// Real animations • Cinematic games • Natural romantic lounge
// =============================================================

require("dotenv").config();
const TelegramBot = require("node-telegram-bot-api");
const fs = require("fs");
const cron = require("node-cron");

const bot = new TelegramBot(process.env.BOT_TOKEN, { polling: true });
const ADMIN_ID = Number(process.env.ADMIN_ID);

const STANDARD_FEE = 5;
const VIP_FEE = 10;

// ================= ANIMATIONS =================
const ANIMATIONS = {
  welcomeSparkle: "https://media.giphy.com/media/26ufcVAp3AiJJsrn2/giphy.gif",
  girlEntrance: "https://media.giphy.com/media/3oEjI6SIIHBdRxXI40/giphy.gif",
  rouletteSpin: "https://media.giphy.com/media/l0MYt5jPR5tr0j2fy/giphy.gif",
  planeTakeoff: "https://media.giphy.com/media/l0HlRnAWXxn0MhKLK/giphy.gif",
  planeCrash: "https://media.giphy.com/media/3o6Zt6KHxJTbXCnSvu/giphy.gif",
  cashOutSafe: "https://media.giphy.com/media/26ufcVAp3AiJJsrn2/giphy.gif",
  bigWin: "https://media.giphy.com/media/26ufcVAp3AiJJsrn2/giphy.gif",
  quizCorrect: "https://media.giphy.com/media/3o7TKsQ8J5o4vZ6v6w/giphy.gif"
};

// ================= STORAGE & UTIL =================
const PROFILE_DB = "./profiles.json";
if (!fs.existsSync(PROFILE_DB)) fs.writeFileSync(PROFILE_DB, "{}");
let profiles = JSON.parse(fs.readFileSync(PROFILE_DB));

const pendingPayments = {};
const publicChatViewers = new Set();
const loungeActive = new Set();
const activeCrashes = {};
const activeRoulette = {};
let currentQuiz = null;

function saveProfiles() {
  try {
    fs.writeFileSync(PROFILE_DB, JSON.stringify(profiles, null, 2));
  } catch (err) {
    console.error("Save profiles failed:", err);
  }
}

function getProfile(id, name = "Player") {
  if (!profiles[id]) {
    profiles[id] = {
      id,
      name,
      vip: false,
      standard: false,
      badge: "✨ New Star",
      rank: "🌌 Visitor",
      balance: 0,
      games: 0,
      wins: 0,
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

// ================= QUIZ QUESTIONS =================
const quizQuestions = [
  { question: "What is the boundary around a black hole from which nothing can escape?", answer: "Event Horizon" },
  { question: "Which quantum principle limits knowing position and momentum simultaneously?", answer: "Heisenberg Uncertainty Principle" },
  { question: "Who taught Plato and is called the father of Western philosophy?", answer: "Socrates" },
  { question: "What is the largest known structure in the universe?", answer: "Hercules–Corona Borealis Great Wall" },
  { question: "What gas was discovered on the sun before on Earth?", answer: "Helium" },
  { question: "Which letter is missing from the periodic table?", answer: "J" },
  { question: "Which organ regenerates after losing 75% of its mass?", answer: "Liver" },
  { question: "What is the deepest point in Earth's oceans?", answer: "Mariana Trench" },
  { question: "Who wrote 'One Hundred Years of Solitude'?", answer: "Gabriel García Márquez" },
  { question: "Which planet rotates clockwise?", answer: "Venus" }
];

// ================= 10 GIRL PROFILES (complete) =================
const fakeGirls = [
  { name: "Luna", emoji: "🌙", image: "https://source.unsplash.com/random/400x400/?woman,night,smile" },
  { name: "Nova", emoji: "🔥", image: "https://source.unsplash.com/random/400x400/?woman,athletic,smile" },
  { name: "Stella", emoji: "🌸", image: "https://source.unsplash.com/random/400x400/?woman,natural,cozy" },
  { name: "Aurora", emoji: "🖤", image: "https://source.unsplash.com/random/400x400/?woman,elegant,mysterious" },
  { name: "Celeste", emoji: "💎", image: "https://source.unsplash.com/random/400x400/?woman,classy,wine" },
  { name: "Mila", emoji: "🥂", image: "https://source.unsplash.com/random/400x400/?woman,bubbly,party" },
  { name: "Sofia", emoji: "☕", image: "https://source.unsplash.com/random/400x400/?woman,glasses,book" },
  { name: "Zara", emoji: "🌊", image: "https://source.unsplash.com/random/400x400/?woman,travel,beach" },
  { name: "Elena", emoji: "🌹", image: "https://source.unsplash.com/random/400x400/?woman,flowers,pastel" },
  { name: "Jade", emoji: "🎧", image: "https://source.unsplash.com/random/400x400/?woman,headphones,neon" }
];

// ================= VISUAL HELPERS =================
function header() {
  return `✦ ───────────────────────────── ✦
       🌌  GALAXY CASINO ARENA  🌌
     Neon nights • Real connections • Romantic vibes
✦ ───────────────────────────── ✦`;
}

// ================= MAIN MENU ===================
function mainMenu(user) {
  const has = hasAccess(user.id);

  return {
    inline_keyboard: [
      [{ text: "🎰 Slots", callback_data: has ? "slots" : "locked" }],
      [{ text: "🎡 Wheel", callback_data: has ? "wheel" : "locked" }],
      [{ text: "🎲 Dice", callback_data: has ? "dice" : "locked" }],
      [{ text: "🎰 Roulette", callback_data: has ? "roulette" : "locked" }],
      [{ text: "✈️ Plane Crash", callback_data: has ? "planecrash" : "locked" }],
      [{ text: "🧠 Daily Quiz – $35", callback_data: has ? "quiz_info" : "locked" }],
      [{ text: "💬 Starlight Lounge", callback_data: has ? "lounge" : "locked" }],
      [{ text: "🏆 Leaderboard", callback_data: "leaderboard" }],
      [{ text: "💎 My Profile", callback_data: "profile" }],
      [{ text: "✨ Rewards", callback_data: has ? "rewards" : "locked" }],
      !has ? [{ text: "🌟 Unlock VIP Experience ($5 or $10)", callback_data: "join" }] : null
    ].filter(Boolean)
  };
}

// ================= START ===================
bot.onText(/\/start/, async (msg) => {
  const id = msg.chat.id;
  const name = msg.from.first_name || "Player";
  const p = getProfile(id, name);

  await bot.sendAnimation(id, ANIMATIONS.welcomeSparkle, {
    caption: `${header()}\n\nHello ${name} 👋\n\nWelcome to Galaxy Casino Arena 🌌\n\nPeople are chatting, playing, connecting…\nYou can see some public messages below.\n\nFull access requires subscription.\n\nEnjoy the vibe ✨`
  });

  publicChatViewers.add(id);
  p.lastActive = Date.now();
  saveProfiles();

  // First girl enters
  setTimeout(async () => {
    const girl = fakeGirls[Math.floor(Math.random() * fakeGirls.length)];
    await bot.sendAnimation(id, ANIMATIONS.girlEntrance, {
      caption: `${girl.emoji} *${girl.name}* has entered the lounge...`
    });
    await bot.sendPhoto(id, girl.image, {
      caption: `Hey everyone 🌌 how’s the night treating you?`
    });
  }, 4000);

  // Start natural chat messages
  setTimeout(() => sendNaturalMessage(id), 8000);
});

// ================= ANIMATED CHAT ===================
function sendNaturalMessage(targetId) {
  if (!publicChatViewers.has(targetId)) return;

  try {
    const girl = fakeGirls[Math.floor(Math.random() * fakeGirls.length)];
    const has = hasAccess(targetId);

    const messages = has ? [
      "hey… how’s your night going?",
      "this place feels magical tonight… you feel it too?",
      "hi there ✨ just chilling, you?",
      "evening… what made you smile today?",
      "nights like this make me feel a little romantic 🌃 you?"
    ] : [
      "hey… nice to see you here… full chat opens once subscribed though",
      "hi! would be lovely to talk more but looks like you need to upgrade 😊",
      "hello ✨ just saying hi for now"
    ];

    const msg = messages[Math.floor(Math.random() * messages.length)];

    bot.sendAnimation(targetId, ANIMATIONS.girlEntrance, {
      caption: `${girl.emoji} *${girl.name}*`
    }).then(() => {
      bot.sendPhoto(targetId, girl.image, {
        caption: msg,
        parse_mode: "Markdown"
      });
    }).catch(err => console.error("Chat animation failed:", err));
  } catch (err) {
    console.error("sendNaturalMessage error:", err);
  }

  const delay = 40000 + Math.random() * 70000;
  setTimeout(() => sendNaturalMessage(targetId), delay);
}

// ================= CALLBACK HANDLER ===================
bot.on("callback_query", async (q) => {
  await bot.answerCallbackQuery(q.id);

  const id = q.from.id;
  const data = q.data;
  const p = getProfile(id);

  if (data === "locked") {
    return bot.sendMessage(id, "This feature requires subscription.", { reply_markup: mainMenu(p) });
  }

  if (data === "join" || data === "join_vip" || data === "unlock") {
    await bot.sendMessage(id,
      `${header()}

🌟 Choose your access level 🌟

Standard ($5):
• Basic games
• Public lounge viewing
• Limited features

VIP ($10):
• All games unlocked
• Full lounge chat & reply
• Private messages
• Higher rewards & badges
• Priority in events

Which experience do you want tonight? 💫`,
      {
        parse_mode: "Markdown",
        reply_markup: {
          inline_keyboard: [
            [{ text: "✨ Standard – $5", url: "https://pay.ziina.com/fienix/ClREPEc08" }],
            [{ text: "💎 VIP – $10 (Recommended)", url: "https://pay.ziina.com/fienix/71k3VbAv0" }],
            [{ text: "Maybe later", callback_data: "back_to_menu" }]
          ]
        }
      }
    );
    return;
  }

  if (data === "back_to_menu") {
    return bot.sendMessage(id, "The night is still young… come back anytime ✨", {
      reply_markup: mainMenu(p)
    });
  }

  if (data === "lounge") {
    if (!hasAccess(id)) {
      return bot.sendMessage(id, "Full lounge access requires subscription.", { reply_markup: mainMenu(p) });
    }

    loungeActive.add(id);

    await bot.sendMessage(id,
      `${header()}

Welcome to Starlight Lounge 💬

Soft jazz... dim neon... people connecting...

Feel free to chat — someone might reply 🌹

(Online: ${loungeActive.size})`,
      { parse_mode: "Markdown" }
    );

    p.lastActive = Date.now();
    saveProfiles();
    return;
  }

  if (data === "roulette") {
    if (!hasAccess(id)) return bot.sendMessage(id, "Subscription required.", { reply_markup: mainMenu(p) });

    await bot.sendAnimation(id, ANIMATIONS.rouletteSpin, {
      caption: `🎰 Roulette – Place your bet\n\nReply like: 20 red  |  5 17  |  10 even`
    });

    activeRoulette[id] = { awaitingBet: true };
    return;
  }

  if (data === "planecrash") {
    if (!hasAccess(id)) return bot.sendMessage(id, "Subscription required.", { reply_markup: mainMenu(p) });

    await bot.sendAnimation(id, ANIMATIONS.planeTakeoff, {
      caption: `✈️ Plane Crash – Bet to takeoff\n\nReply with amount (e.g. "10")`
    });
    return;
  }

  // Placeholder for other games
  if (["slots", "wheel", "dice"].includes(data)) {
    if (!hasAccess(id)) {
      return bot.sendMessage(id, "This game requires subscription.", { reply_markup: mainMenu(p) });
    }
    return bot.sendMessage(id, `🎮 ${data.charAt(0).toUpperCase() + data.slice(1)} starting... ✨`);
  }
});

// ================= TEXT HANDLER – GAMES & QUIZ ==================
bot.on("text", async (msg) => {
  const id = msg.chat.id;
  const text = msg.text.trim();
  const p = getProfile(id);

  if (!hasAccess(id)) return;

  // Quiz
  if (currentQuiz && !currentQuiz.winner && text.toLowerCase() === currentQuiz.answer.toLowerCase()) {
    currentQuiz.winner = id;
    p.balance += 35;
    p.wins++;
    saveProfiles();

    await bot.sendAnimation(id, ANIMATIONS.quizCorrect, {
      caption: `🎉 CORRECT! You win $35! First one right ✨`
    });

    Object.keys(profiles).forEach(uid => bot.sendMessage(uid, `Quiz winner: ${p.name} takes $35!`));
    return;
  }

  // Roulette
  if (activeRoulette[id]?.awaitingBet) {
    const match = text.match(/^(\d+)\s+(red|black|green|even|odd|1-18|19-36|\d+)$/i);
    if (!match) return bot.sendMessage(id, "Format: amount choice\nExample: 20 red");

    const bet = parseFloat(match[1]);
    const choice = match[2].toLowerCase();

    if (bet > p.balance || bet <= 0) return bot.sendMessage(id, "Invalid bet amount.");

    p.balance -= bet;
    saveProfiles();

    await bot.sendAnimation(id, ANIMATIONS.rouletteSpin, {
      caption: `Bet: $${bet} on ${choice.toUpperCase()}\nSpinning...`
    });

    await new Promise(r => setTimeout(r, 5000));

    const num = Math.floor(Math.random() * 37);
    const color = num === 0 ? "green" : (num % 2 === 0 ? "red" : "black");
    let win = 0;

    if (choice === color) win = bet * (color === "green" ? 36 : 2);
    else if (choice === (num % 2 === 0 ? "even" : "odd")) win = bet * 2;
    else if (choice === (num <= 18 ? "1-18" : "19-36")) win = bet * 2;
    else if (choice === num.toString()) win = bet * 36;

    if (win > 0) {
      p.balance += win;
      p.wins++;
      saveProfiles();
      await bot.sendAnimation(id, ANIMATIONS.bigWin, {
        caption: `🎉 WIN! +$${win} on ${num} ${color.toUpperCase()}`
      });
    } else {
      await bot.sendMessage(id, `Landed on ${num} ${color.toUpperCase()} – no win.`);
    }

    delete activeRoulette[id];
    return;
  }

  // Plane Crash
  if (text.match(/^\d+$/) && !activeCrashes[id]) {
    const bet = parseFloat(text);
    if (bet > p.balance || bet <= 0) return bot.sendMessage(id, "Invalid bet.");

    p.balance -= bet;
    saveProfiles();

    await bot.sendAnimation(id, ANIMATIONS.planeTakeoff, {
      caption: `✈️ Takeoff! Bet: $${bet}`
    });

    await new Promise(r => setTimeout(r, 3000));

    const crashPoint = 1.2 + Math.random() * 25;
    let multiplier = 1.0;

    const flightMsg = await bot.sendMessage(id,
      `Altitude: 1.00x  |  Potential: $${bet.toFixed(2)}`,
      {
        reply_markup: { inline_keyboard: [[{ text: "🪂 CASH OUT", callback_data: `cashout_${id}` }]] }
      }
    );

    activeCrashes[id] = {
      bet, crashPoint, current: multiplier, messageId: flightMsg.message_id,
      interval: setInterval(async () => {
        multiplier += 0.08 + Math.random() * 0.15;
        if (multiplier >= crashPoint) {
          clearInterval(activeCrashes[id].interval);
          await bot.sendAnimation(id, ANIMATIONS.planeCrash, {
            caption: `💥 CRASH at ${crashPoint.toFixed(2)}x! Lost $${bet}`
          });
          delete activeCrashes[id];
        } else {
          await bot.editMessageText(
            `Altitude: ${multiplier.toFixed(2)}x  |  Potential: $${(bet * multiplier).toFixed(2)}`,
            { chat_id: id, message_id: flightMsg.message_id, reply_markup: { inline_keyboard: [[{ text: "🪂 CASH OUT", callback_data: `cashout_${id}` }]] } }
          );
        }
      }, 450)
    };
    return;
  }
});

// ================= CASH OUT ===================
bot.on("callback_query", async (q) => {
  if (q.data.startsWith("cashout_")) {
    const id = parseInt(q.data.split("_")[1]);
    const game = activeCrashes[id];
    if (game) {
      clearInterval(game.interval);
      const win = Math.round(game.bet * game.current);
      profiles[id].balance += win;
      profiles[id].wins++;
      saveProfiles();

      await bot.sendAnimation(id, ANIMATIONS.cashOutSafe, {
        caption: `🪂 CASHED OUT at ${game.current.toFixed(2)}x\nWon $${win}!`
      });

      delete activeCrashes[id];
    }
  }
});

// ================= QUIZ SCHEDULER ===================
cron.schedule('0 20 * * *', async () => {
  const quiz = quizQuestions[Math.floor(Math.random() * quizQuestions.length)];
  currentQuiz = { ...quiz, prize: 35, winner: null };

  Object.keys(profiles).forEach(idStr => {
    const id = Number(idStr);
    if (hasAccess(id)) {
      bot.sendMessage(id, `🧠 Tonight's Quiz – $35 Prize!\n\n${quiz.question}`);
    }
  });
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
    `${header()}

✨ Access Unlocked ✨

Now you can fully chat, play, and connect.

Welcome to the real experience 🌌`,
    { reply_markup: mainMenu(profile) }
  );
});

// ================= CLEANUP ==================
setInterval(() => {
  const now = Date.now();
  for (const id of publicChatViewers) {
    if (now - profiles[id]?.lastActive > 90 * 60 * 1000) publicChatViewers.delete(id);
  }
}, 15 * 60 * 1000);

// ================= LAUNCH =================
console.log("🌌 Galaxy Casino Arena – Immersive Edition");
console.log("Animations • Cinematic games • Ready to entertain");