// games/planeCrashGame.js

const planeCrashQuestions = [
  {
    q: "💥 Day 1: Food is very limited.",
    choices: [
      { text: "🍞 Share food equally", love: 2, survival: -1 },
      { text: "🔥 Keep food for survival", love: -2, survival: 2 },
      { text: "🎣 Try fishing together", love: 1, survival: 1 }
    ]
  },
  {
    q: "🌧️ Night comes. It’s cold.",
    choices: [
      { text: "🤗 Stay close for warmth", love: 2, survival: 0 },
      { text: "🔥 Build a fire", love: 0, survival: 2 },
      { text: "😴 Sleep separately", love: -1, survival: 1 }
    ]
  },
  {
    q: "🚁 You hear a helicopter… but only ONE can go.",
    choices: [
      { text: "💞 Stay together", love: 3, survival: -2 },
      { text: "🛫 Let partner go", love: 1, survival: 1 },
      { text: "😈 Take the chance alone", love: -3, survival: 2 }
    ]
  }
];

async function startPlaneCrashGame(bot, participants, names) {
  const love = {};
  const survival = {};

  participants.forEach(id => {
    love[id] = 0;
    survival[id] = 0;
  });

  for (let i = 0; i < planeCrashQuestions.length; i++) {
    const q = planeCrashQuestions[i];

    for (let userId of participants) {
      await bot.sendMessage(
        userId,
        `✈️ *PLANE CRASH STORY*\n━━━━━━━━━━━━━━━━━━\n${q.q}`,
        {
          parse_mode: "Markdown",
          reply_markup: {
            inline_keyboard: q.choices.map((c, idx) => [
              {
                text: c.text,
                callback_data: `pc|${i}|${idx}`
              }
            ])
          }
        }
      );
    }

    await new Promise(r => setTimeout(r, 15000));
  }

  // Final endings
  participants.forEach(id => {
    let ending = "🏝️ You survived alone.";

    if (love[id] >= 5 && survival[id] >= 3)
      ending = "💍 *SOULMATES SURVIVED TOGETHER*";
    else if (love[id] >= 3)
      ending = "💞 *STRONG BOND FORMED*";
    else if (survival[id] >= 4)
      ending = "🔥 *TOUGH SURVIVOR*";
    else
      ending = "💔 *ALONE BUT ALIVE*";

    bot.sendMessage(
      id,
      `🏁 *STORY ENDING*\n━━━━━━━━━━━━━━━━━━\n${ending}\n\n❤️ Love: ${love[id]}\n🛠️ Survival: ${survival[id]}`,
      { parse_mode: "Markdown" }
    );
  });

  return { love, survival };
}

module.exports = {
  startPlaneCrashGame,
  planeCrashQuestions
};
