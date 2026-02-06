// =============================================================
// ✦ N E B U L A   H E A R T S   A R E N A   —   CHAOS MODE ✦
// Over-the-top Romance × Savage Roasts × Cringe Pickup Lines
// 2026 Meme Lord Edition — Ziina still included 😏
// =============================================================

require("dotenv").config();
const TelegramBot = require("node-telegram-bot-api");
const fs = require("fs");

// ──── CONFIG ────────────────────────────────────────────────
const bot = new TelegramBot(process.env.BOT_TOKEN, { polling: true });
const ADMIN_ID = Number(process.env.ADMIN_ID);

const ZIINA_5  = "https://pay.ziina.com/fienix/ClREPEc08";
const ZIINA_10 = "https://pay.ziina.com/fienix/71k3VbAv0";

const DB_FILE = "./nebula_chaos.json";
const QUESTIONS_FILE = "./questions.json";

if (!fs.existsSync(DB_FILE)) fs.writeFileSync(DB_FILE, "{}");
let players = JSON.parse(fs.readFileSync(DB_FILE));

let matchmakingQueue = [];
let pendingDeposits = {};

let quizQuestions = [];
if (fs.existsSync(QUESTIONS_FILE)) {
  quizQuestions = JSON.parse(fs.readFileSync(QUESTIONS_FILE));
  console.log(`Loaded ${quizQuestions.length} chaotic love questions 💀❤️`);
}

// ──── HELPERS ───────────────────────────────────────────────
function save() { fs.writeFileSync(DB_FILE, JSON.stringify(players, null, 2)); }

function getPlayer(uid, name = "Chaos Gremlin") {
  if (!players[uid]) {
    players[uid] = {
      uid, name, vip: false, flirtPoints: 0, wallet: 0,
      quizScore: 0, quizPlayed: 0, wins: 0, couples: 0,
      roastMode: false, badge: "🤡 Certified Menace", rank: "Galaxy Clown",
      lastLogin: 0, lastQuiz: 0
    };
    save();
  }
  return players[uid];
}

function hasVIP(uid) { return players[uid]?.vip; }

function updateRank(p) {
  if (p.couples >= 8)       p.rank = "💍 God/Goddess of Situationships";
  else if (p.couples >= 4)  p.rank = "🥵 Walking Red Flag";
  else if (p.couples >= 1)  p.rank = "💌 Professional Ghoster";
  else                      p.rank = "😭 Forever Alone Energy";

  if (p.couples >= 10)      p.badge = "🏆 Rizzler Supreme";
  else if (p.vip)           p.badge = "👑 Paid to be Pretty";
  save();
}

// ──── CHAOS ANIMATION ───────────────────────────────────────
const chaosHearts = ["💖","❤️‍🔥","💥","🤡","😭","🥵","🔥","💀","✨"];
async function chaosExplosion(chatId, text, duration = 2400) {
  let msg = await bot.sendMessage(chatId, text);
  for (let i = 0; i < 5; i++) {
    await new Promise(r => setTimeout(r, duration/5));
    const storm = Array(7).fill().map(() => chaosHearts[Math.floor(Math.random()*chaosHearts.length)]).join(" ");
    await bot.editMessageText(`${text}\n\n${storm}`, {chat_id:chatId, message_id:msg.message_id});
  }
}

// ──── PICKUP LINE GENERATOR (for max cringe) ────────────────
const pickupLines = [
  "Are you French? Because *Eiffel* for you 😏",
  "Do you have Wi-Fi? Because I'm feeling a connection 🔥",
  "Are you a magician? Because whenever I look at you everyone else disappears... except my standards apparently",
  "Is your name Google? Because you have everything I've been searching for... and some viruses",
  "Do you believe in love at first swipe, or should I unmatch and try again?",
  "Are you a parking ticket? Because you've got FINE written all over you 😭",
  "If beauty were time, you'd be an eternity... of therapy bills"
];

function randomPickup() {
  return pickupLines[Math.floor(Math.random() * pickupLines.length)];
}

// ──── BANNER ────────────────────────────────────────────────
function banner() {
  return `╔══════════════════════════════╗
║  NEBULA HEARTS — CHAOS MODE  ║
║    Rizz or Die 💀❤️‍🔥        ║
╚══════════════════════════════╝`;
}

// ──── MAIN MENU (now extra dramatic) ────────────────────────
function mainMenu(p) {
  return {
    inline_keyboard: [
      [{ text: "🧠 Quiz Chaos (Get Roasted)", callback_data: "quiz" }],
      [{ text: "💞 Soulmate or Soul-crush?", callback_data: hasVIP(p.uid) ? "match" : "locked" }],
      [{ text: "🎰 Wheel of Shame & Glory", callback_data: "wheel" }],
      [{ text: "👤 My Cringy Profile", callback_data: "profile" }],
      [{ text: "🏆 Leaderboard of Losers", callback_data: "top" }],
      [{ text: "💳 Buy Rizz (Ziina)", callback_data: "deposit" }],
      [{ text: p.vip ? "🔥 VIP = Unhinged Mode" : "👑 Unlock Unhinged (VIP)", callback_data: "vip" }]
    ]
  };
}

// ──── START ─────────────────────────────────────────────────
bot.onText(/\/start/, (msg) => {
  const uid = msg.chat.id;
  const name = msg.from.first_name || "Menace";
  const p = getPlayer(uid, name);

  const bonus = Date.now() - p.lastLogin > 86400000;
  if (bonus) {
    p.wallet += 5; p.lastLogin = Date.now(); save();
  }

  bot.sendMessage(uid,
    `${banner()}

Yo ${p.name} 😈
Flirt pts: ${p.flirtPoints} | Shards: 💎${p.wallet}
Matches: ${p.couples} | Quiz pts: ${p.quizScore}
Rank: ${p.rank} • Badge: ${p.badge}

${bonus ? "Daily chaos tax collected → +$5" : ""}

Ready to get your heart broken or your ego inflated? 💥`,
    {parse_mode:"Markdown", reply_markup:mainMenu(p)}
  );
});

// ──── CALLBACKS (now way more entertaining) ──────────────────
bot.on("callback_query", async q => {
  const uid = q.from.id;
  const data = q.data;
  const p = getPlayer(uid);

  await bot.answerCallbackQuery(q.id);

  // ─── PROFILE (now savage) ────────────────────────────────
  if (data === "profile") {
    bot.sendMessage(uid,
      `✦ YOUR CHAOS CARD ✦

Name: ${p.name} ${p.vip ? "👑 PAID ACTOR" : ""}
Rizz pts: ${p.flirtPoints}
Shards: 💎 ${p.wallet}
Quiz W/L: ${p.quizScore} (${p.quizPlayed} attempts)
Matches survived: ${p.couples}
Rank: ${p.rank}
Badge: ${p.badge}

Roast mode: ${p.roastMode ? "ON 🔥" : "OFF (coward)"}

${p.vip ? "You paid to be insufferable 💅" : "Deposit or stay basic"}`
    );
  }

  // ─── QUIZ (now savage questions) ─────────────────────────
  if (data === "quiz" && quizQuestions.length) {
    if (Date.now() - p.lastQuiz < 180000) return bot.sendMessage(uid, "Chill bro, nebula cooldown 3 min 💀");

    p.lastQuiz = Date.now();
    const q = quizQuestions[Math.floor(Math.random()*quizQuestions.length)];
    const opts = [...q.wrong, q.correct].sort(()=>Math.random()-0.5);

    const kb = {inline_keyboard: opts.map((t,i)=>[{text:t, callback_data:`qans_${i}_${t===q.correct?"W":"L"}`}])};

    bot.sendMessage(uid, `🧠 CHAOS QUIZ DROP\n\n${q.question}\n\nDon't embarrass yourself...`, {
      parse_mode:"Markdown", reply_markup:kb
    });
  }

  if (data.startsWith("qans_")) {
    const [, idx, res] = data.split("_");
    p.quizPlayed++;
    if (res === "W") {
      p.quizScore += 15; p.flirtPoints += 8; p.wins++;
      chaosExplosion(uid, "CORRECT! You actually have rizz?! +15 pts +8 flirt", 1800);
    } else {
      chaosExplosion(uid, "WRONG! Touch grass immediately 💀", 1800);
    }
    bot.sendMessage(uid, "Menu?", {reply_markup:mainMenu(p)});
  }

  // ─── MATCHMAKING (maximum cringe & drama) ────────────────
  if (data === "match") {
    if (!hasVIP(uid)) return bot.sendMessage(uid, "VIP or go cry in the DMs 😭");

    if (matchmakingQueue.includes(uid)) return bot.sendMessage(uid, "Already simping... wait your turn 💅");

    matchmakingQueue.push(uid);
    bot.sendMessage(uid, "Sending desperate signals across the void...\nMay the rizz be ever in your favor 😭🔥");

    await new Promise(r=>setTimeout(r,4200));

    if (matchmakingQueue.length >= 2 && matchmakingQueue[0] === uid) {
      const partner = matchmakingQueue.find(id=>id!==uid);
      if (partner) {
        matchmakingQueue = matchmakingQueue.filter(id=>id!==uid&&id!==partner);

        const perc = 69 + Math.floor(Math.random()*31); // biased to 69–99
        const line = randomPickup();
        const roast = p.roastMode ? " (they probably still live with their mom tho)" : "";

        chaosExplosion(uid,
          `✨ MATCH LOCATED ✨
Compatibility: ${perc}% ${perc>=90?"(soulmate alert)":"(situationship incoming)"}

Your victim → @user${partner}
${line}${roast}

Say hi before they unmatch you 💀❤️‍🔥`
        );

        chaosExplosion(partner,
          `✨ MATCH LOCATED ✨
Compatibility: ${perc}% 

Your victim → @user${uid}
${randomPickup()}${players[partner]?.roastMode ? " (probably catfished)" : ""}

Don't fumble this one 😭`
        );

        p.couples++; players[partner].couples = (players[partner].couples||0)+1;
        p.flirtPoints += 25; players[partner].flirtPoints = (players[partner].flirtPoints||0)+25;
        updateRank(p); updateRank(players[partner]); save();
      }
    } else {
      setTimeout(()=>{
        if (matchmakingQueue.includes(uid)) {
          bot.sendMessage(uid, "No one wants you yet... tragic 💔 Try again in 15s");
          matchmakingQueue = matchmakingQueue.filter(id=>id!==uid);
        }
      }, 18000);
    }
  }

  // ─── WHEEL (now Wheel of Shame) ──────────────────────────
  if (data === "wheel") {
    await bot.sendMessage(uid, "Spinning Wheel of Public Shame & Glory... 🎡😈");

    await new Promise(r=>setTimeout(r,2800));

    const prizes = [0,0,3,5,8,15,-5]; // can lose shards lol
    const amt = prizes[Math.floor(Math.random()*prizes.length)];

    p.wallet += amt;
    if (p.wallet < 0) p.wallet = 0;
    save();

    chaosExplosion(uid,
      amt > 0
        ? `You won +$${amt} shards! Rizz level up 🔥`
        : amt < 0
          ? `You LOST $${Math.abs(amt)} shards... skill issue 💀`
          : `Zero. You are mid. Try again 🤡`
    );
  }

  // deposit, vip, locked, top — same as before but with sass
  // ... (copy from previous version and add funny texts if you want)

  if (data === "locked") {
    bot.sendMessage(uid, "VIP only zone.\nNo broke souls allowed 😤 Deposit or perish.");
  }
});

// Admin add shards
bot.onText(/\/add (\d+) (\d+)/, (msg, [,uid,amt]) => {
  if (msg.from.id !== ADMIN_ID) return;
  if (players[uid]) {
    players[uid].wallet += Number(amt);
    if (Number(amt) >= 10) players[uid].vip = true;
    save();
    bot.sendMessage(uid, `Admin pity gift received +$${amt} 💸 Now go get rejected in style~`);
  }
});

console.log("CHAOS MODE — NEBULA HEARTS ONLINE 💀❤️‍🔥");