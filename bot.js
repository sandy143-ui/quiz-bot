const TelegramBot = require("node-telegram-bot-api");

const token = process.env.BOT_TOKEN;
const bot = new TelegramBot(token, { polling: true });

let participants = [];
const maxPlayers = 10;

bot.onText(/\/start/, (msg) => {
  bot.sendMessage(
    msg.chat.id,
    "🎮 Welcome to Quiz Night!\nEntry: 5 AED\nPrize: 35 AED\n\nType /join to participate."
  );
});

bot.onText(/\/join/, (msg) => {
  const chatId = msg.chat.id;

  if (participants.includes(chatId)) {
    bot.sendMessage(chatId, "You already joined.");
    return;
  }

  if (participants.length >= maxPlayers) {
    bot.sendMessage(chatId, "Quiz is full.");
    return;
  }

  participants.push(chatId);

  bot.sendMessage(
    chatId,
    "✅ You joined the quiz.\nQuiz starts at 9 PM."
  );
});
