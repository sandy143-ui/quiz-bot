// =============================================================
// ✦ N E B U L A HEARTS ARENA — CHAOS SUPREME ✦
// 2026 Meme Lord Edition — VIP, Ziina & Grand Chance 🎉
// =============================================================

require("dotenv").config();
const TelegramBot = require("node-telegram-bot-api");
const fs = require("fs");
const crypto = require("crypto");

const bot = new TelegramBot(process.env.BOT_TOKEN, { polling: true });
const ADMIN_ID = Number(process.env.ADMIN_ID);

const ZIINA_5 = "https://pay.ziina.com/fienix/ClREPEc08";
const ZIINA_10 = "https://pay.ziina.com/fienix/71k3VbAv0";

const DB_FILE = "./nebula_chaos.json";
const QUESTIONS_FILE = "./questions.json";
const ROMANCE_TRICKS_FILE = "./romance_tricks.json";

if (!fs.existsSync(DB_FILE)) fs.writeFileSync(DB_FILE, "{}");
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

let players = {};
try { players = JSON.parse(fs.readFileSync(DB_FILE)); } 
catch(e){ console.log("Database corrupted, starting fresh."); players = {}; }

const romanceTricks = JSON.parse(fs.readFileSync(ROMANCE_TRICKS_FILE));
let quizQuestions = fs.existsSync(QUESTIONS_FILE) ? JSON.parse(fs.readFileSync(QUESTIONS_FILE)) : [];

let maleUsers = [], femaleUsers = [], matchmakingQueue = [];

function saveDB(){ fs.writeFileSync(DB_FILE, JSON.stringify(players,null,2)); }
function generateUID(){ return crypto.randomBytes(16).toString('hex'); }
function randomPickup(){ 
  const lines = [
    "Are you Wi-Fi? Because I’m feeling a strong connection.",
    "You must be a bug… because you crashed my system.",
    "Are you made of copper and tellurium? Because you're Cu-Te.",
    "Do you believe in love at first match?",
    "Are you a loading screen? Because I can’t skip you.",
    "You’re like my phone battery… I panic without you.",
    "Are you JavaScript? Because you make everything async.",
    "You must be VIP… because you unlocked my heart."
  ]; return lines[Math.floor(Math.random()*lines.length)];
}
function hasVIP(uid){ return players[uid]?.vip; }
function getRandomRomanceTrick(){ return romanceTricks.tricks[Math.floor(Math.random()*romanceTricks.tricks.length)]; }

function updateRank(p){
  if(p.couples>=10) p.rank="💍 God/Goddess of Situationships";
  else if(p.couples>=5) p.rank="🥵 Walking Red Flag";
  else if(p.couples>=1) p.rank="💌 Professional Ghoster";
  else p.rank="😭 Forever Alone Energy";

  if(p.couples>=10) p.badge="🏆 Rizzler Supreme";
  else if(p.vip) p.badge="👑 Paid to be Pretty";
  saveDB();
}

// ─── FEMALE NPC GENERATION ───────────────
function generateNPCs(count=30){
  const maleNames=["Liam","Noah","Oliver","Elijah","William","James","Benjamin","Lucas","Henry","Alexander"];
  const femaleNames=["Emma","Olivia","Ava","Sophia","Isabella","Mia","Charlotte","Amelia","Harper","Evelyn"];
  const adjectives=["Sweet","Cute","Charming","Gorgeous","Lovely","Adorable","Enchanting","Captivating","Stunning"];
  for(let i=0;i<count;i++){
    maleUsers.push({uid:generateUID(), name:`${adjectives[Math.floor(Math.random()*adjectives.length)]} ${maleNames[Math.floor(Math.random()*maleNames.length)]}`, loves:[], lastChat:0});
    femaleUsers.push({uid:generateUID(), name:`${adjectives[Math.floor(Math.random()*adjectives.length)]} ${femaleNames[Math.floor(Math.random()*femaleNames.length)]}`, loves:[], lastChat:0});
  }
}
generateNPCs();

// ─── BANNER ─────────────
function banner(){
return `╔══════════════════════════════╗
║ NEBULA HEARTS — CHAOS SUPREME ║
║ 💥 Rizz or Die 💀❤️‍🔥 💥 ║
╚══════════════════════════════╝`;
}

// ─── PLAYER INIT ─────────────
function getPlayer(uid,name="Chaos Gremlin"){
  if(!players[uid]){
    players[uid]={uid,name,vip:false,flirtPoints:0,wallet:0,quizScore:0,quizPlayed:0,wins:0,couples:0,
      roastMode:false,badge:"🤡 Certified Menace",rank:"Galaxy Clown",lastLogin:0,lastQuiz:0,profile:{},loves:[],
      freeChats:0,soulmateChats:{},grandChance:false
    };
    saveDB();
  }
  return players[uid];
}

// ─── MAIN MENU ─────────────
function mainMenu(p){
return {
inline_keyboard:[
[{text:"🧠 Quiz Chaos", callback_data:"quiz"}],
[{text:"💞 Soulmate Finder", callback_data:"match"}],
[{text:"🎰 Wheel of Shame", callback_data:"wheel"}],
[{text:"🍀 Lucand Grand Chance (Sun)", callback_data:"grandChance"}],
[{text:"👤 Profile", callback_data:"profile"}],
[{text:"🏆 Leaderboard", callback_data:"top"}],
[{text:"💳 Buy Rizz", callback_data:"deposit"}],
[{text: p.vip?"🔥 VIP Mode":"👑 Unlock VIP", callback_data:"vip"}],
[{text:"💌 Love Tricks", callback_data:"love_tricks"}],
[{text:"👩 Chat NPC", callback_data:"female_users"}]
]
};
}

// ─── START — HYPE / LUCAND GRAND CHANCE ─────────────
bot.onText(/\/start/, msg => {
  const uid = msg.chat.id;
  const name = msg.from.first_name || "Menace";
  const p = getPlayer(uid, name);

  // Daily bonus
  const bonus = Date.now() - p.lastLogin > 86400000;
  if (bonus) { 
    p.wallet += 5; 
    p.lastLogin = Date.now(); 
    saveDB(); 
  }

  // Hype start message
  const startMessage = `🔥🔥 WELCOME TO NEBULA HEARTS — CHAOS SUPREME 🔥🔥

Yo ${p.name} 😈  
Flirt pts: ${p.flirtPoints} | Shards: 💎${p.wallet}  
Matches: ${p.couples} | Quiz pts: ${p.quizScore}  
Rank: ${p.rank} • Badge: ${p.badge}

💥 THIS SUNDAY: LUCAND GRAND CHANCE 💥  
💸 $20 ENTRY FEE | FIRST WILL WIN  
📱 PRIZE: iPhone 17 Pro Max  
⚡ Be the FIRST to spin & claim ultimate luxury! ⚡

🎰 Spin, flirt, match, and WIN!  
Daily chaos bonus: ${bonus ? "+$5 shards collected 💎" : "💎"}  

Are you ready to blast your luck and hearts at the same time? 💀❤️‍🔥
`;


  // Promo image URL (replace with your hosted image if needed)
  const promoImage = "https://raw.githubusercontent.com/sandy143-ui/quiz-bot/main/IMG_1296.jpeg";

  // Send photo with caption
  bot.sendPhoto(uid, promoImage, { 
    caption: startMessage, 
    parse_mode: "Markdown",
    reply_markup: mainMenu(p)
  });
});

// ─── CALLBACK HANDLER ─────────────
bot.on("callback_query", async q=>{
try{
  const uid=q.from.id;
  const data=q.data;
  const p=getPlayer(uid);
  await bot.answerCallbackQuery(q.id);

  // ─ PROFILE ─
  if(data==="profile"){
    await bot.sendMessage(uid,
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
    if(!hasVIP(uid)) return bot.sendMessage(uid, "💔 VIP Only: Upgrade to play the Quiz!");
    if(Date.now()-p.lastQuiz<180000) return bot.sendMessage(uid,"Chill bro, 3 min cooldown 💀");
    p.lastQuiz=Date.now();
    const qn = quizQuestions[Math.floor(Math.random()*quizQuestions.length)];
    const opts = [...qn.choices].sort(()=>Math.random()-0.5);
    const kb = { inline_keyboard: opts.map(opt => [{ text: opt, callback_data: `qans_${opt===qn.a?"W":"L"}` }]) };
    await bot.sendMessage(uid, `🧠 *CHAOS QUIZ*\n\n${qn.q}`, { reply_markup: kb, parse_mode:"Markdown" });
  }

  if(data.startsWith("qans_")){
    const res = data.split("_")[1];
    p.quizPlayed++; 
    if(res==="W"){ p.quizScore+=15; p.flirtPoints+=8; await bot.sendMessage(uid,"✅ Correct! +15 Quiz +8 Flirt"); }
    else await bot.sendMessage(uid,"❌ Wrong! Touch grass 💀");
    await bot.sendMessage(uid,"Back to menu?",{reply_markup:mainMenu(p)}); saveDB();
  }

  // ─ MATCHMAKING ─
  if(data==="match"){
    const pool = [...maleUsers,...femaleUsers];
    const partner = pool[Math.floor(Math.random()*pool.length)];
    const perc = 69 + Math.floor(Math.random()*31);
    const line = randomPickup();

    if(!p.soulmateChats[partner.uid]) p.soulmateChats[partner.uid]=0;
    if(!hasVIP(uid) && p.soulmateChats[partner.uid]>=2) return bot.sendMessage(uid,"💔 Non-VIP limit reached. Upgrade for unlimited chats!");

    await bot.sendMessage(uid,
`✨ MATCH FOUND ✨
Compatibility: ${perc}%
Partner → ${partner.name}
${line}`
    );
    if(!hasVIP(uid)) p.soulmateChats[partner.uid]++;
    p.couples++; p.flirtPoints+=25; updateRank(p); saveDB();
  }

  // ─ WHEEL ─
  if(data==="wheel"){
    if(!hasVIP(uid)) return bot.sendMessage(uid,"💔 VIP only! Upgrade to spin the Wheel!");
    await bot.sendMessage(uid,"🎡 Spinning Wheel...");
    await new Promise(r=>setTimeout(r,2000));
    const amt=[0,0,3,5,8,15,-5][Math.floor(Math.random()*7)];
    p.wallet+=amt; if(p.wallet<0)p.wallet=0; saveDB();
    await bot.sendMessage(uid, amt>0?`🎉 You won $${amt} shards!` : amt<0?`💀 You lost $${-amt} shards`:"🤡 Zero, try again");
  }

  // ─ DEPOSIT & VIP ─
  if(data==="deposit"||data==="vip"){
    const kb={inline_keyboard:[
      [{text:"5 Shards (100 KRW)", url:ZIINA_5}],
      [{text:"10 Shards (200 KRW)", url:ZIINA_10}],
      [{text:"Back to Menu", callback_data:"menu"}]
    ]};
    await bot.sendMessage(uid,data==="deposit"?"Choose rizz boost":"Choose VIP",{reply_markup:kb});
  }

  // ─ LEADERBOARD ─
  if(data==="top"){
    const sorted=Object.values(players).filter(p=>p.couples>0).sort((a,b)=>b.couples-a.couples).slice(0,10);
    let txt="🏆 CHAOS LEADERBOARD 🏆\n\n";
    sorted.forEach((p,i)=>txt+=`${i+1}. ${p.name} (${p.couples} matches)\n`);
    await bot.sendMessage(uid,txt);
  }

  // ─ LOVE TRICKS ─
  if(data==="love_tricks"){ await bot.sendMessage(uid,"💌 "+getRandomRomanceTrick()+" 💌"); }

  // ─ FEMALE NPC CHAT ─
  if(data==="female_users"){
    const kb=femaleUsers.slice(0,5).map(u=>[{text:`👩 ${u.name}`,callback_data:`chat_${u.uid}`}]);
    kb.push([{text:"Back to Menu",callback_data:"menu"}]);
    await bot.sendMessage(uid,"Select NPC to chat:",{reply_markup:{inline_keyboard:kb}});
  }

  if(data.startsWith("chat_")){
    const target=data.split("_")[1];
    const npc=femaleUsers.find(u=>u.uid===target);
    if(npc){
      if(!hasVIP(uid) && p.freeChats>=3) return bot.sendMessage(uid,"💔 Free chats limit reached! VIP unlocks unlimited.");
      await bot.sendMessage(uid, `💬 Chatting with ${npc.name}... 💬\n${getRandomRomanceTrick()}`);
      setTimeout(()=>bot.sendMessage(uid, `✨ ${npc.name} replied: "${getRandomRomanceTrick()}"`), 4000);
      if(!hasVIP(uid)) p.freeChats++; saveDB();
    }
  }

  // ─ GRAND CHANCE ─
  if(data==="grandChance"){
    if(p.wallet<20) return bot.sendMessage(uid,"💔 You need $20 shards to enter Lucand Grand Chance!");
    p.wallet-=20; saveDB();
    await bot.sendMessage(uid,"🍀 Lucand Grand Chance entry confirmed! Spinning…");
    await new Promise(r=>setTimeout(r,2000));
    const win=Math.random()<0.05; // 5% chance
    if(win){ p.grandChance=true; saveDB(); await bot.sendMessage(uid,"🎉🎉 YOU WON iPhone 17 Pro Max! 🎉🎉"); }
    else await bot.sendMessage(uid,"💀 Almost… luck wasn’t on your side this Sunday. Try next week!");
  }

  if(data==="menu") await bot.sendMessage(uid,"Back to menu",{reply_markup:mainMenu(p)});

}catch(err){ console.log("Callback error:", err); }
});

// ─── ADMIN ADD SHARDS / VIP ─────────────
bot.onText(/\/add (\d+) (\d+)/, (msg, match)=>{
try{
  if(msg.from.id!==ADMIN_ID) return;
  const uid=Number(match[1]); const amt=Number(match[2]);
  if(players[uid]){ players[uid].wallet+=amt; if(amt>=10) players[uid].vip=true; saveDB(); bot.sendMessage(uid,`Admin gift +$${amt} 💸`);}
}catch(err){ console.log("Admin command error:",err);}
});

console.log("CHAOS SUPREME — NEBULA HEARTS ONLINE 💀❤️‍🔥");
bot.on("polling_error", err => console.log("Polling error:", err.message));

process.on("uncaughtException", err => {
  console.error("Uncaught Exception:", err);
});

process.on("unhandledRejection", err => {
  console.error("Unhandled Rejection:", err);
});

