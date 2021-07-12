const Discord = require("discord.js");
const client = new Discord.Client();
const config = require("./config.json");
const credentials = require("./credentials.json");
const commands = require("./commands.js");
const Valorant = require("@liamcottle/valorant.js");
const valorantApi = new Valorant.API("NA");

function calculateElo(tier, progress) {
  if (tier >= 21) {
    return 1800 + progress;
  } else {
    return tier * 100 - 300 + progress;
  }
}

var sentiment = require("@trainorpj/sentiment");

let global_commands = {};
let server_commands = {};
let prefix = "!";

let mad_score = {
  comparative: -2.5,
  total: -10,
};

let fun_cooldown = 20000;
let on_cooldown = false;
let debug = false;
let apiInitialized = true;
let RankedMessageCache;

client.on("ready", () => {
  console.log(`Logged in as ${client.user.tag}!`);
  for (const key in credentials.Guilds) {
    temp = credentials.Guilds[`${key}`].CreatorLogin;
    credentials.Guilds[`${key}`].ApiObject = new Valorant.API("NA");
    credentials.Guilds[`${key}`].ApiObject.authorize(
      temp.Username,
      temp.Password
    )
      .then((response) => {
        credentials.Guilds[`${key}`].Initialized = true;
        console.log(`loaded ${credentials.Guilds[`${key}`].Name}`);
      })
      .catch((err) => {
        console.log(`loading ${credentials.Guilds[`${key}`].Name} failed`);
      });
  }
  createGlobalCommand("testsentiment", (context) => {
    commands.testsentiment(context);
  });
  createGlobalCommand("summon", (context) => {
    commands.summon(context);
  });
  createGlobalCommand("debug", (context) => {
    commands.toggleDebug(context);
  });
  // createGlobalCommand("rank", (context) => {
  //   let key = context.guild.id;
  //   if (credentials.Guilds[`${key}`]) {
  //     if (credentials.Guilds[`${key}`].Initialized) {
  //       valorantApi
  //         .getPlayerMMR(valorantApi.user_id)
  //         .then((response) => {
  //           if (response.data.LatestCompetitiveUpdate) {
  //             let RankInfo =
  //               response.data.QueueSkills.competitive.SeasonalInfoBySeasonID[
  //                 response.data.LatestCompetitiveUpdate.SeasonID
  //               ];
  //             RankedMessageCache = `Grim's rank is \`\`\`
  //                 Rank: ${Valorant.Tiers[RankInfo.CompetitiveTier]}\n
  //                 RR: ${RankInfo.RankedRating}\n
  //                 Total: ${calculateElo(
  //                   RankInfo.CompetitiveTier,
  //                   RankInfo.RankedRating
  //                 )}
  //                 \`\`\``;
  //             context.reply(RankedMessageCache);
  //           }
  //         })
  //         .catch((err) => {
  //           console.log(err);
  //         });
  //     }
  //   } else {
  //     context.reply(
  //       "Rank command is not setup for this server, ask the content creator to contact @Stealth#0010"
  //     );
  //   }

  //   // valorantApi.getPlayerMMR(valorantApi.user_id).then((response)=>{
  //   //   if(response.data.LatestCompetitiveUpdate){
  //   //     let RankInfo = response.data.QueueSkills.competitive.SeasonalInfoBySeasonID[response.data.LatestCompetitiveUpdate.SeasonID];
  //   //     RankedMessageCache = `Grim's rank is \`\`\`
  //   //     Rank: ${Valorant.Tiers[RankInfo.CompetitiveTier]}\n
  //   //     RR: ${RankInfo.RankedRating}\n
  //   //     Total: ${calculateElo(RankInfo.CompetitiveTier, RankInfo.RankedRating)}
  //   //     \`\`\``;
  //   //     context.reply(RankedMessageCache);
  //   //   }
  //   // }).catch((err)=>{
  //   //   if(err.data.errorCode=="BAD_CLAIMS") {
  //   //     console.log("Rank called with invalid api token");
  //   //     valorantApi.authorize("Grimothee", "Willow021").then((response)=>{
  //   //       apiInitialized = true;
  //   //       let RankInfo = response.data.QueueSkills.competitive.SeasonalInfoBySeasonID[response.data.LatestCompetitiveUpdate.SeasonID];
  //   //       RankedMessageCache = `Grim's rank is \`\`\`Rank: ${Valorant.Tiers[RankInfo.CompetitiveTier]}\nRR: ${RankInfo.RankedRating}\nTotal: ${calculateElo(RankInfo.CompetitiveTier, RankInfo.RankedRating)}\`\`\``;
  //   //       context.reply(RankedMessageCache);
  //   //     }).catch((err)=>{
  //   //       context.reply("There seems to be a problem with the request. Last known data:\n" + RankedMessageCache);
  //   //       console.log(err);
  //   //     });
  //   //   } else {
  //   //     context.reply("There seems to be a problem with the request. Last known data:\n" + RankedMessageCache);
  //   //     console.log(err);
  //   //   }
  //   // });
  // });
});

client.on("message", (msg) => {
  // ALMOND DINK DONK
  if (msg.content === "dink" && msg.author.id == 251132701917184000) {
    msg.reply("donk");
  }
  // Fun Features
  if (!on_cooldown) {
    let message_sentiment = sentiment(msg.content);
    if (debug) console.log(message_sentiment);
    if (
      message_sentiment.comparative < mad_score.comparative ||
      message_sentiment.score < mad_score.total
    ) {
      msg.reply("What's wrong homie?");
      on_cooldown = true;
      setTimeout(() => {
        on_cooldown = false;
      }, fun_cooldown);
    }
  }

  //testing section
  if (msg.author.id == 251132701917184000) {
  }
  validateCommand(msg);
});

function validateCommand(msg) {
  message = msg.content;
  if (message.substring(0, prefix.length) == prefix) {
    var split = message.split(" ");
    let command = split[0].substring(prefix.length, split[0].length);
    if (debug) console.log(`Parsed command: ${command}`);
    if (global_commands[command] != null) {
      ctx = msg;
      ctx.args = [];
      for (let i = 1; i < split.length; i++) {
        ctx.args.push(split[i]);
      }
      global_commands[command](ctx);
    }
    // else if (server_commands[msg.guild.id][command] != null){
    //   server_commands[msg.guild.id][command](ctx);
    // }
  }
}

function createGlobalCommand(command, callback) {
  global_commands[command] = callback;
}

function createGuildCommand(key, command, callback) {
  if (server_commands[key]) {
    server_commands[key][command] = callback;
  }
}

client.login(credentials.token);
