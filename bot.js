const Discord = require("discord.js");
const client = new Discord.Client();
const config = require("./config.json");
const credentials = require("./credentials.json");
const commands = require("./commands.js");
const Valorant = require("@liamcottle/valorant.js");
const valorantApi = new Valorant.API("NA");
const zlib = require('zlib');

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
let prefix = "-";

let mad_score = {
  comparative: -2.5,
  total: -10,
};

let fun_cooldown = 20000;
let on_cooldown = false;
let debug = false;
let apiInitialized = true;
let RankedMessageCache;
let messageCollectors = {};

client.on("ready", () => {
  console.log(`Logged in as ${client.user.tag}!`);
  refreshValorantApi();
  setInterval(refreshValorantApi, 600000)
  createGlobalCommand("testsentiment", (context) => {
    commands.testsentiment(context);
  });
  createGlobalCommand("summon", (context) => {
    commands.summon(context);
  });
  createGlobalCommand("debug", (context) => {
    commands.toggleDebug(context);
  });
  createGlobalCommand("rank", context => {
    GuildID = context.guild.id
    if(GuildID in credentials.Guilds){
      let API = credentials.Guilds[GuildID].ApiObject;
      API.getPlayerMMR(API.user_id).then(res=>{
        let Data = res.data;
        if(Data.QueueSkills.competitive.TotalGamesNeededForRating == 0){
          let RecentSeasonID = Data.LatestCompetitiveUpdate.SeasonID
          let SeasonalInfo = Data.QueueSkills.competitive.SeasonalInfoBySeasonID[RecentSeasonID];
          let Wins = SeasonalInfo.NumberOfWinsWithPlacements;
          let Total = SeasonalInfo.NumberOfGames;
          let WinRate = Wins / Total;
          let RankID = SeasonalInfo.CompetitiveTier;
          let Rank = Valorant.Tiers[RankID];
          let RR = SeasonalInfo.RankedRating;
          let Leaderboard = SeasonalInfo.LeaderboardRank;
          let output = "\`\`\`" + `Wins: ${Wins}\nWinrate: ${(WinRate*100).toFixed(2)}%\nRank: ${Rank}\nRR: ${RR}\nPlace: ${Leaderboard}` + "\`\`\`";
          context.reply(output);
        } else {
          context.reply("Not placed yet.");
        }
      }).catch(err=>{
        context.reply("API request failed, contact Stealth to fix.");
      })
    } else {
      context.reply("Rank is not setup for this guild. Contact Stealth#0010 to set it up.");
      return;
    }
  })

});

client.on("message", (msg) => {
  // Fun Features
  // if (msg.author.id == 449046144035848202) {
  //   if(Math.random() > 0.80) msg.reply("^ Canadian btw ^");
  // }
  if (!on_cooldown) {
    let message_sentiment = sentiment(msg.content);
    if (debug) console.log(message_sentiment);
    if (
      message_sentiment.comparative < mad_score.comparative ||
      message_sentiment.score < mad_score.total
    ) {
      if(Math.random() < .96){
        msg.reply("What's wrong homie?");
      } else {
        msg.reply("https://tenor.com/view/cope-copeharder-coping-keepcoping-gif-21255783");
      }
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

function refreshValorantApi() { 
  for (const key in credentials.Guilds) {
    temp = credentials.Guilds[`${key}`].CreatorLogin;
    credentials.Guilds[`${key}`].ApiObject = new Valorant.API("NA");
    credentials.Guilds[`${key}`].ApiObject.authorize(
      temp.Username,
      temp.Password
    )
      .then((response) => {
        if(credentials.Guilds[`${key}`].Initialized) {
          console.log(`reloaded ${credentials.Guilds[`${key}`].Name}`);
        }else {
          credentials.Guilds[`${key}`].Initialized = true;
          console.log(`loaded ${credentials.Guilds[`${key}`].Name}`);
        }
      })
      .catch((err) => {
        console.log(`loading ${credentials.Guilds[`${key}`].Name} failed`);
      });
  }
}

client.login(credentials.token);

function dec(data) {
  let buff = Buffer.from(data, 'base64');
  let text = buff.toString('utf-8');
  zlib.deflate(text);
  return text;
}