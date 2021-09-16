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
  setInterval(refreshValorantApi, 300000)
  createGlobalCommand("testsentiment", (context) => {
    commands.testsentiment(context);
  });
  createGlobalCommand("summon", (context) => {
    commands.summon(context);
  });
  createGlobalCommand("debug", (context) => {
    commands.toggleDebug(context);
  });
  createGlobalCommand("saveChat", context =>{
    if(!context.member.hasPermission('ADMINISTRATOR')) return;
    if(!(context.channel.id in messageCollectors)) {
      let filter = m => true;
      messageCollectors[context.channel.id] = context.channel.createMessageCollector(filter, {max: 1000});
      context.reply("Channel location has been saved, max revert amount is 1k messages. If it reaches this amount it will automatically be disposed of wihtout deleting messages.");
      messageCollectors[context.channel.id].on('end', m => {
        messageCollectors[context.channel.id].stop();
        delete messageCollectors[context.channel.id];
      })
      context.delete();
    } else {
      context.reply("A saved location already exists for this channel, used the revert command to delete and close it, or use the close command to delete only the collector.");
    }
  })
  createGlobalCommand("revert", context =>{
    if(!context.member.hasPermission('ADMINISTRATOR')) return;
    if(context.channel.id in messageCollectors) {
      context.channel.bulkDelete(messageCollectors[context.channel.id].collected);
      messageCollectors[context.channel.id].stop();
      delete messageCollectors[context.channel.id];
    } else {
      context.reply("A save state doesn't exist for this channel. Create one using the saveChat command.");
      context.delete();
    }
  })
  createGlobalCommand("close", context =>{
    if(!context.member.hasPermission('ADMINISTRATOR')) return;
    if(context.channel.id in messageCollectors) {
      messageCollectors[context.channel.id].stop();
      delete messageCollectors[context.channel.id];
      context.reply("Active chat save state has been closed.");
      context.delete();
    } else {
      context.reply("A save state doesn't exist for this channel. Create one using the saveChat command.");
    }
  })
  
  createGlobalCommand("crosshair", context => {
    if(!(`${context.guild.id}` in credentials.Guilds)) {
      context.reply("Auto-Updating Crosshair is not setup for this guild. Contact Stealth#0010 to set it up.");
      return;
    };
    if(credentials.Guilds[`${context.guild.id}`].ApiObject) {
      credentials.Guilds[`${context.guild.id}`].ApiObject.getPreferences().then(res => {
        console.log(dec(res.data.data));
      }).catch(err => {
        
        console.log(err);
      })
    } else {
      context.reply("Auto-Updating Crosshair is not setup for this guild. Contact Stealth#0010 to set it up.");
    }
  });

  createGlobalCommand("rank", context => {
    if(!(`${context.guild.id}` in credentials.Guilds)) {
      context.reply("Rank is not setup for this guild. Contact Stealth#0010 to set it up.");
      return;
    }
    if(credentials.Guilds[`${context.guild.id}`].ApiObject) {
      credentials.Guilds[`${context.guild.id}`].ApiObject.getPlayerMMR(credentials.Guilds[`${context.guild.id}`].ApiObject.user_id).then(res =>{
        let latestSeason = res.data.LatestCompetitiveUpdate.SeasonID;
        let seasonInfo = res.data.QueueSkills.competitive.SeasonalInfoBySeasonID[latestSeason];
        if(seasonInfo.TotalWinsNeededForRank > 0) {
          context.reply(`${credentials.Guilds[`${context.guild.id}`].CreatorLogin.Nickname} has not placed yet, ${seasonInfo.TotalWinsNeededForRank} games left.`)
        } else {
          context.reply(`${credentials.Guilds[`${context.guild.id}`].CreatorLogin.Nickname}'s rank is: \`\`\`
Rank: ${Valorant.Tiers[seasonInfo.CompetitiveTier]}
RR: ${seasonInfo.RankedRating}
Wins: ${seasonInfo.NumberOfWinsWithPlacements}${seasonInfo.LeaderboardRank!=0?"\nLeaderboard Rank: " + seasonInfo.LeaderboardRank:""}\`\`\`
`);
        }
        console.log(seasonInfo)
      }).catch(err => {


      })
    } else {
      context.reply("Rank is not setup for this guild. Contact Stealth#0010 to set it up.");
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