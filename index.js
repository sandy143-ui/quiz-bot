// =============================================================
// ✦ N E B U L A HEARTS ARENA — CHAOS SUPREME ✦
// Ultimate Romance × Savage Roasts × Cringe Pickup Lines
// 2026 Meme Lord Edition — VIP & Ziina included 😏
// =============================================================

require("dotenv").config();
const TelegramBot = require("node-telegram-bot-api");
const fs = require("fs");
const crypto = require("crypto");

// ─── CONFIG ───────────────────────────────────────────────
const bot = new TelegramBot(process.env.BOT_TOKEN, { polling: true });
const ADMIN_ID = Number(process.env.ADMIN_ID);

const ZIINA_5  = "https://pay.ziina.com/fienix/ClREPEc08";
const ZIINA_10 = "https://pay.ziina.com/fienix/71k3VbAv0";

const DB_FILE = "./nebula_chaos.json";
const QUESTIONS_FILE = "./questions.json";
const ROMANCE_TRICKS_FILE = "./romance_tricks.json";

if (!fs.existsSync(DB_FILE)) fs.writeFileSync(DB_FILE, "{}");
let players = JSON.parse(fs.readFileSync(DB_FILE));

if (!fs.existsSync(ROMANCE_TRICKS_FILE)) {
  fs.writeFileSync(ROMANCE_TRICKS_FILE, JSON.stringify({
    tricks: [
      "Send surprise coffee delivery",
      "Write sweet note in love language",
      "Plan surprise picnic",
      "Buy favorite candy every week",
      "Leave little gifts around home",
      "Cook favorite meal once",
      "Write love poem daily",
      "Create playlist with lyrics about you",
      "Leave small love tokens",
      "Send surprise flowers weekly"
    ]
  }));
}
const romanceTricks = JSON.parse(fs.readFileSync(ROMANCE_TRICKS_FILE));

let matchmakingQueue = [];
let quizQuestions = [];

if (fs.existsSync(QUESTIONS_FILE)) {
  quizQuestions = JSON.parse(fs.readFileSync(QUESTIONS_FILE));
  console.log(`Loaded ${quizQuestions.length} chaotic quiz questions 💀❤️`);
}

// ─── HELPERS ─────────────────────────────────────────────
function saveDB() { fs.writeFileSync(DB_FILE, JSON.stringify(players, null, 2)); }
function generateUID() { return crypto.randomBytes(16).toString('hex'); }

function randomPickup() {
  const lines = [
    "Are you Wi-Fi? Because I’m feeling a strong connection.",
    "You must be a bug… because you crashed my system.",
    "Are you made of copper and tellurium? Because you're Cu-Te.",
    "Do you believe in love at first match?",
    "Are you a loading screen? Because I can’t skip you.",
    "You’re like my phone battery… I panic without you.",
    "Are you JavaScript? Because you make everything async.",
    "You must be VIP… because you unlocked my heart."
  ];
  return lines[Math.floor(Math.random() * lines.length)];
}

function hasVIP(uid) { return players[uid]?.vip; }

function updateRank(p) {
  if (p.couples >= 10)      p.rank = "💍 God/Goddess of Situationships";
  else if (p.couples >= 5)  p.rank = "🥵 Walking Red Flag";
  else if (p.couples >= 1)  p.rank = "💌 Professional Ghoster";
  else                       p.rank = "😭 Forever Alone Energy";

  if (p.couples >= 10)      p.badge = "🏆 Rizzler Supreme";
  else if (p.vip)           p.badge = "👑 Paid to be Pretty";
  saveDB();
}

function chaosExplosion(chatId, text, duration = 2400) {
  return new Promise(async res => {
    let msg = await bot.sendMessage(chatId, text);
    for (let i = 0; i < 5; i++) {
      await new Promise(r => setTimeout(r, duration/5));
      const storm = Array(7).fill().map(() => ["💖","❤️‍🔥","💥","🤡","😭","🥵","🔥","💀","✨"][Math.floor(Math.random()*9)]).join(" ");
      await bot.editMessageText(`${text}\n\n${storm}`, { chat_id: chatId, message_id: msg.message_id });
    }
    res();
  });
}

function getRandomRomanceTrick() {
  return romanceTricks.tricks[Math.floor(Math.random() * romanceTricks.tricks.length)];
}

// ─── FEMALE NPC GENERATION ────────────────────────────────
let maleUsers = [];
let femaleUsers = [];

function generateNPCs(count = 30) {
  const maleNames = ["Liam","Noah","Oliver","Elijah","William","James","Benjamin","Lucas","Henry","Alexander"];
  const femaleNames = ["Emma","Olivia","Ava","Sophia","Isabella","Mia","Charlotte","Amelia","Harper","Evelyn"];
  const adjectives = ["Sweet","Cute","Charming","Gorgeous","Lovely","Adorable","Enchanting","Captivating","Stunning"];

  for (let i=0;i<count;i++){
    maleUsers.push({ uid: generateUID(), name: `${adjectives[Math.floor(Math.random()*adjectives.length)]} ${maleNames[Math.floor(Math.random()*maleNames.length)]}`, loves: [], lastChat: 0 });
    femaleUsers.push({ uid: generateUID(), name: `${adjectives[Math.floor(Math.random()*adjectives.length)]} ${femaleNames[Math.floor(Math.random()*femaleNames.length)]}`, loves: [], lastChat: 0 });
  }
}
generateNPCs(30);

// ─── BANNER ───────────────────────────────────────────────
function banner() {
  return `╔══════════════════════════════╗
║  NEBULA HEARTS — CHAOS SUPREME ║
║       Rizz or Die 💀❤️‍🔥       ║
╚══════════════════════════════╝`;
}

// ─── MAIN MENU ───────────────────────────────────────────
function mainMenu(p){
  return {
    inline_keyboard:[
      [{text:"🧠 Quiz Chaos", callback_data:"quiz"}],
      [{text:"💞 Soulmate Finder", callback_data: hasVIP(p.uid)?"match":"locked"}],
      [{text:"🎰 Wheel of Shame", callback_data:"wheel"}],
      [{text:"👤 Profile", callback_data:"profile"}],
      [{text:"🏆 Leaderboard", callback_data:"top"}],
      [{text:"💳 Buy Rizz", callback_data:"deposit"}],
      [{text: p.vip?"🔥 VIP Mode":"👑 Unlock VIP", callback_data:"vip"}],
      [{text:"💌 Love Tricks", callback_data:"love_tricks"}],
      [{text:"👩 Chat NPC", callback_data:"female_users"}]
    ]
  };
}

function getPlayer(uid, name="Chaos Gremlin") {
  if (!players[uid]) {
    players[uid] = {
      uid, name, vip: false, flirtPoints: 0, wallet: 0,
      quizScore: 0, quizPlayed: 0, wins: 0, couples: 0,
      roastMode: false, badge: "🤡 Certified Menace", rank: "Galaxy Clown",
      lastLogin: 0, lastQuiz: 0, profile: {}, loves: [],
      freeChats: 0,
      freeMatches: 0
    };
    saveDB();
  }
  return players[uid];
}


// ─── START ───────────────────────────────────────────────
bot.onText(/\/start/, msg => {
  const uid = msg.chat.id;
  const name = msg.from.first_name || "Menace";
  const p = getPlayer(uid, name);

  const bonus = Date.now() - p.lastLogin > 86400000;
  if (bonus){ p.wallet+=5; p.lastLogin=Date.now(); saveDB(); }

  bot.sendMessage(uid,
`${banner()}

Yo ${p.name} 😈
Flirt pts: ${p.flirtPoints} | Shards: 💎${p.wallet}
Matches: ${p.couples} | Quiz pts: ${p.quizScore}
Rank: ${p.rank} • Badge: ${p.badge}

${bonus?"Daily chaos tax collected → +$5":""}

Ready to get your heart broken or your ego inflated? 💥`,
{parse_mode:"Markdown", reply_markup:mainMenu(p)});
});

// ─── CALLBACK HANDLER ─────────────────────────────────────
bot.on("callback_query", async q=>{
  try {
    const uid = q.from.id;
    const data = q.data;
    const p = getPlayer(uid);
    await bot.answerCallbackQuery(q.id);

    if(data==="menu"){
      bot.sendMessage(uid,"Back to main menu",{reply_markup:mainMenu(p)});
      return;
    }

    // ─ PROFILE ─
    if(data==="profile"){
      bot.sendMessage(uid,
`✦ YOUR CHAOS CARD ✦
Name: ${p.name} ${p.vip?"👑 PAID ACTOR":""}
Rizz pts: ${p.flirtPoints} | Shards: 💎${p.wallet}
Quiz W/L: ${p.quizScore} (${p.quizPlayed})
Matches: ${p.couples} | Rank: ${p.rank} | Badge: ${p.badge}
Roast mode: ${p.roastMode?"ON 🔥":"OFF (coward)"}`
      );
    }

   // ─ QUIZ ─
if(data==="quiz" && quizQuestions.length){
  // ✅ VIP check
  if(!hasVIP(uid)) return bot.sendMessage(uid, "💔 Only VIPs can play the Quiz! Upgrade to access.");

  if(Date.now() - p.lastQuiz < 180000) 
    return bot.sendMessage(uid,"Chill bro, nebula cooldown 3 min 💀");

  p.lastQuiz = Date.now();
  const qn = quizQuestions[Math.floor(Math.random()*quizQuestions.length)];
  const opts = [...qn.choices].sort(()=>Math.random()-0.5);
  const kb = { inline_keyboard: opts.map(opt => [{ text: opt, callback_data: `qans_${opt===qn.a?"W":"L"}` }]) };
  bot.sendMessage(uid, `🧠 *CHAOS QUIZ DROP*\n\n${qn.q}`, { reply_markup: kb, parse_mode:"Markdown" });
}

    // ─ QUIZ ANSWER ─
    if(data.startsWith("qans_")){
      const res = data.split("_")[1];
      p.quizPlayed++;
      if(res==="W"){
        p.quizScore += 15; p.flirtPoints += 8; p.wins++;
        await chaosExplosion(uid,"CORRECT! You got Rizz! +15 pts +8 flirt",1800);
      } else await chaosExplosion(uid,"WRONG! Touch grass immediately 💀",1800);
      bot.sendMessage(uid,"Menu?", { reply_markup: mainMenu(p) });
      saveDB();
    }

    // ─ MATCHMAKING ─
if(data==="match"){
  if(!hasVIP(uid)) return bot.sendMessage(uid,"VIP or cry in the DMs 😭");

  // Combine NPCs into match pool
  const pool = [...maleUsers, ...femaleUsers];

  // Pick a random partner from pool
  const partner = pool[Math.floor(Math.random() * pool.length)];

  // Free match limit for non-VIP
  if(!hasVIP(uid) && p.freeMatches >= 2){
    return bot.sendMessage(uid,"💔 Free matches limit reached! Subscribe to VIP to continue matching.");
  }

  const perc = 69 + Math.floor(Math.random() * 31);
  const line = randomPickup();
  const roast = p.roastMode ? " (they live with mom tho)" : "";

  chaosExplosion(uid, `✨ MATCH FOUND ✨\nCompatibility: ${perc}%\nPartner → ${partner.name}\n${line}${roast}`);

  // Increase stats for human player only
  p.couples++;
  p.flirtPoints += 25;
  updateRank(p);

  // Increment free match count for non-VIP
  if(!hasVIP(uid)){
    p.freeMatches++;
  }

  saveDB();
}

    // ─ WHEEL ─
    if(data==="wheel"){
      bot.sendMessage(uid,"Spinning Wheel... 🎡😈");
      await new Promise(r=>setTimeout(r,2500));
      const amt=[0,0,3,5,8,15,-5][Math.floor(Math.random()*7)];
      p.wallet += amt; if(p.wallet<0) p.wallet=0; saveDB();
      chaosExplosion(uid, amt>0?`You won +$${amt} shards! 🔥`:amt<0?`You LOST $${-amt} shards 💀`:"Zero. Try again 🤡");
    }

    // ─ DEPOSIT & VIP ─
    if(data==="deposit"||data==="vip"){
      const kb={inline_keyboard:[
        [{text:"5 Shards (100 KRW)", url:ZIINA_5}],
        [{text:"10 Shards (200 KRW)", url:ZIINA_10}],
        [{text:"Back to Menu", callback_data:"menu"}]
      ]};
      bot.sendMessage(uid,data==="deposit"?"Choose your rizz boost:":"Choose VIP status:",{reply_markup:kb});
    }

    // ─ LEADERBOARD ─
    if(data==="top"){
      const sorted=Object.values(players).filter(p=>p.couples>0).sort((a,b)=>b.couples-a.couples).slice(0,10);
      let txt="🏆 CHAOS LEADERBOARD 🏆\n\n";
      sorted.forEach((p,i)=>{txt+=`${i+1}. ${p.name} (${p.couples} matches)\n`;});
      bot.sendMessage(uid,txt);
    }

    // ─ LOVE TRICKS ─
    if(data==="love_tricks"){bot.sendMessage(uid,"💌 "+getRandomRomanceTrick()+" 💌");}

    // ─ FEMALE NPC CHAT ─
    if(data==="female_users"){
      const kb=femaleUsers.slice(0,5).map(u=>[{text:`👩 ${u.name}`,callback_data:`chat_${u.uid}`}]);
      kb.push([{text:"Back to Menu",callback_data:"menu"}]);
      bot.sendMessage(uid,"Select NPC to chat:",{reply_markup:{inline_keyboard:kb}});
    }

    if(data.startsWith("chat_")){
  const target = data.split("_")[1];
  const npc = femaleUsers.find(u => u.uid === target);
  if(npc){
    // Check if user is VIP or still has free chats
    if(!hasVIP(uid) && p.freeChats >= 2){
      return bot.sendMessage(uid, "💔 Free chats limit reached! Subscribe to VIP to continue chatting.");
    }

    // Send chat messages
    bot.sendMessage(uid, `💬 Chatting with ${npc.name}... 💬\n${getRandomRomanceTrick()}`);
    setTimeout(() => bot.sendMessage(uid, `✨ ${npc.name} replied: "${getRandomRomanceTrick()}"`), 4000);
    setTimeout(() => bot.sendMessage(uid, `✨ ${npc.name} seems interested! 💖 Upgrade to VIP for unlimited chats!`), 7000);

    // Increment free chat count for non-VIP users
    if(!hasVIP(uid)){
      p.freeChats++;
      saveDB();
    }
  }
}

if(data==="locked"){
  bot.sendMessage(uid,"VIP only 😤 Deposit or perish.");
}


// ─── ADMIN ADD SHARDS / VIP ───────────────────────────────
bot.onText(/\/add (\d+) (\d+)/,(msg,[uid,amt])=>{
  if(msg.from.id!==ADMIN_ID) return;
  uid = Number(uid); // convert string to number
  if(players[uid]){
    players[uid].wallet += Number(amt); 
    if(Number(amt)>=10) players[uid].vip=true; 
    saveDB(); 
    bot.sendMessage(uid,`Admin gift +$${amt} 💸`);
  }
});

console.log("CHAOS SUPREME — NEBULA HEARTS ONLINE 💀❤️‍🔥");
bot.on("polling_error",err=>console.log("Polling error:",err.message));
  } catch (err) {
    console.log("Callback error:", err);
  }
}); // <- closes bot.on("callback_query")