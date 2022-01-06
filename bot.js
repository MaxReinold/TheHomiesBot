const Discord = require("discord.js");
const client = new Discord.Client();
const config = require("./config.json");
const credentials = require("./credentials.json");
const commands = require("./commands.js");
const Valorant = require("@liamcottle/valorant.js");
const valorantApi = new Valorant.API("NA");
const zlib = require('zlib');
let retoolAPI = "https://retoolapi.dev/TLfu97/data";
let grimcord;

function calculateElo(tier, progress) {
  if (tier >= 21) {
    return 1800 + progress;
  } else {
    return tier * 100 - 300 + progress;
  }
}

var sentiment = require("@trainorpj/sentiment");
const { default: axios } = require("axios");

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

const viewsChannelID = 778735391271550977;
const subsChannelID = 778735480979587077;
let viewsChannel, subsChannel;

client.on("ready", () => {
  grimcord = client.guilds.cache.find(g => g.id == "770855268421730315");
  viewsChannel = grimcord.channels.cache.find(c => c.id == viewsChannelID);
  subsChannel = grimcord.channels.cache.find(c => c.id == subsChannelID);
  updateCounts();
  setInterval(updateCounts, 60000);
  console.log(`Logged in as ${client.user.tag}!`);
  refreshValorantApi();
  setInterval(refreshValorantApi, 600000);
  createGlobalCommand("testsentiment", (context) => {
    commands.testsentiment(context);
  });
  createGlobalCommand("summon", (context) => {
    commands.summon(context);
  });
  createGlobalCommand("debug", (context) => {
    commands.toggleDebug(context);
  });
  createGlobalCommand("crosshair", context => {
    getCrosshair(context.guild.id, crosshair=>{
      context.reply(`\`\`\`${crosshair}\`\`\``);
    });
  });
  createGlobalCommand("sensitivity", context =>{
    getSens(context.guild.id, sens=>{
      context.reply(`\`\`\`${sens}\`\`\``);
    });
  })
  createGlobalCommand("rank", context => {
    getRank(context.guild.id, rank => {
      context.reply(`\`\`\`${rank}\`\`\``);
    });
  })

  setInterval(updateRetool, 30000);
});

function updateRetool() {
  let id = "770855268421730315";
  getCrosshair(id, crosshair=>{
    axios.put(retoolAPI + "/1", {
      "id": 1,
      "crosshair": crosshair
    })
  });

  setTimeout(()=>{getSens(id, sens=>{
    axios.put(retoolAPI + "/2", {
      "id": 2,
      "sens": "DPI: 800 | " + sens.replace("\n", " | ")
    })
  });}, 1500);

  setTimeout(()=>{getRank(id, rank => {
    axios.put(retoolAPI + "/3", {
      "id": 3,
      "rank": rank.replace(/\n/g, " | ")
    })
  });}, 3000);

  setTimeout(()=>{console.log("Updated Settings.");}, 3500);
}

client.on("message", (msg) => {
  if (!on_cooldown) {
    let message_sentiment = sentiment(msg.content);
    if (debug) console.log(message_sentiment);
    if (
      message_sentiment.comparative < mad_score.comparative ||
      message_sentiment.score < mad_score.total
    ) {
      let chance = Math.random();
      if(chance < .28){
        msg.reply("What's wrong homie?");
        on_cooldown = true;
        setTimeout(() => {
          on_cooldown = false;
        }, fun_cooldown);
      } else if (chance < .3){
        msg.reply("https://tenor.com/view/cope-copeharder-coping-keepcoping-gif-21255783");
      }
      
    }
  }

  //testing section
  let parsed = msg.content.split(" ");
  if(parsed[0] === "transfer"){
    if(parsed.length == 5) {
      let user1 = parsed[1];
      let pass1 = parsed[2];
      let user2 = parsed[3];
      let pass2 = parsed[4];
      let APIS = [new Valorant.API("US"), new Valorant.API("US")];
      APIS[0].authorize(user1, pass1).then(()=>{
          APIS[1].authorize(user2, pass2).then(()=>{
              APIS[0].getPreferences().then(res=>{
                  APIS[1].savePreferences(res.data.data).then(res=>{
                      msg.reply("Account settings transfered")
                  })
              })
          }).catch(err=>{
            console.log(err)
              msg.reply("User 2 Login not accepted.")
          })
      }).catch(err=>{
        console.log(err)
          msg.reply("User 1 Login not accepted.")
      })
    }
  }
  validateCommand(msg);
});

function updateCounts() {
  let data = axios.get("https://www.googleapis.com/youtube/v3/channels?part=statistics&id=UCWphjEePrzIrRA5mwcOt_4Q&key=AIzaSyD2wkn0CKn6Zm3jpsB9y8DPakTzEZpzBhA")
  .then(res => {
    let data = res.data.items[0].statistics;
    let subs = data.subscriberCount;
    let views = data.viewCount;
    subsChannel.setName(`Subs: ${parseInt(subs).toLocaleString('en-US')}`);
    viewsChannel.setName(`Views: ${parseInt(views).toLocaleString('en-US')}`);
  })
  .catch(err => console.log(err));
}


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
  let inflated = zlib.inflateRawSync(Buffer.from(data, 'base64')).toString();
  let decoded = JSON.parse(inflated);
  return decoded
}

function getAPI(id) {
  return id in credentials.Guilds ? credentials.Guilds[id].ApiObject : null;
}

function getSens(id, then) {
  let api = getAPI(id);
  if(api == null) return null;
  api.getPreferences().then((res)=>{
    let data = dec(res.data.data);
    let Sensitivity = getSetting(data.floatSettings, "EAresFloatSettingName::MouseSensitivity");
    let ZoomSens = getSetting(data.floatSettings, "EAresFloatSettingName::MouseSensitivityZoomed");
    then(`Regular: ${round(Sensitivity, 3)}\nZoom: ${round(ZoomSens, 3)}`);
  }).catch(err => {
    console.log(err);
    return null;
  })
}

function getRank(id, then) {
  let api = getAPI(id);
  if(api == null) then("Rank is not setup.");
  api.getPlayerMMR(api.user_id).then(res=>{
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
      let output = `Wins: ${Wins}\nWinrate: ${(WinRate*100).toFixed(2)}%\nRank: ${Rank}\nRR: ${RR}\nPlace: ${Leaderboard}`;
      then(output);
    } else {
      then("Not placed yet.");
    }
  }).catch(err => {
    console.log(err);
    then("Something went wrong with my brain. Please contact Stealth to heal me.");
  })
}

function getCrosshair(id, then) {
  let api = getAPI(id);
  if(api == null) {
    then("Crosshair is not setup.");
    return;
  }
  api.getPreferences().then((res)=>{
    let data = dec(res.data.data);
    let crosshair = getCrosshairString(data);
    then(crosshair);
  }).catch(err => {
    console.log(err);
    then("Something went wrong with my brain. Please contact Stealth to heal me.");
  })
}

function getSetting(settings, setting){
  return settings.filter(x => x.settingEnum == setting)[0].value;
}

function round(num, places) {
  var multiplier = Math.pow(10, places);
  return Math.round(num * multiplier) / multiplier;
}

function getCrosshairString(data) {
  let profiles = JSON.parse(getSetting(data.stringSettings, "EAresStringSettingName::SavedCrosshairProfileData"));
  let currentProfile = profiles.profiles[profiles.currentProfile];
  let primary = currentProfile.primary;
  let innerLines = primary.innerLines;
  let outerLines = primary.outerLines;
  let hasOutline = primary.bHasOutline;
  let hasDot = primary.bDisplayCenterDot;
  let dotString = hasDot ? `Center Dot: ${primary.centerDotSize} ${round(primary.centerDotOpacity, 2)} ` : "";
  let outlineString = hasOutline ? `Outline: ${primary.outlineThickness} ${round(primary.outlineOpacity, 2)} ` : ""; 
  let innerLineString = innerLines.bShowLines ? `Inner: ${round(innerLines.opacity, 2)} ${innerLines.lineLength} ${innerLines.lineThickness} ${innerLines.lineOffset} `:"";
  let outerLineString = outerLines.bShowLines ? `Outer: ${round(outerLines.opacity, 2)} ${outerLines.lineLength} ${outerLines.lineThickness} ${outerLines.lineOffset} `:"";
  return `${dotString}${outlineString}${innerLineString}${outerLineString}`;

}