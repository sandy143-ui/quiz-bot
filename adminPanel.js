const fs = require("fs");

let participants = [];
let scores = {};
let pendingPayments = {};
let names = {};

// Broadcast message to all users
function broadcast(bot, users, message) {
  users.forEach(id => {
    bot.sendMessage(id, message, { parse_mode: "Markdown" });
  });
}

// View leaderboard
function viewLeaderboard() {
  let text = "🏆 *Leaderboard*\n━━━━━━━━━━━━━━\n";
  const sorted = Object.entries(scores).sort((a,b)=>b[1]-a[1]);
  sorted.forEach(([id, score], i) => {
    text += `${i+1}. ${names[id] || "Player"} — ${score} pts\n`;
  });
  return text;
}

// Approve user
function approveUser(bot, adminId, userId) {
  if (!pendingPayments[userId]) return false;
  delete pendingPayments[userId];
  participants.push(userId);
  scores[userId] = 0;
  bot.sendMessage(userId, "✅ Payment approved! You are in the quiz.");
  bot.sendMessage(adminId, `User ${userId} approved.`);
  return true;
}

// Reject user
function rejectUser(bot, adminId, userId) {
  if (!pendingPayments[userId]) return false;
  delete pendingPayments[userId];
  bot.sendMessage(userId, "❌ Payment rejected. Try again.");
  bot.sendMessage(adminId, `User ${userId} rejected.`);
  return true;
}

// Export for main bot
module.exports = {
  participants,
  scores,
  pendingPayments,
  names,
  broadcast,
  viewLeaderboard,
  approveUser,
  rejectUser
};
