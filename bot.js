const Discord = require('discord.js');
const client = new Discord.Client();
const config = require('./config.json');
const credentials = require('./credentials.json');
const commands = require('./commands.js');

var sentiment = require('@trainorpj/sentiment');

let global_commands = {};
let server_commands = {};
let prefix = "!";
let summon_overrides = {
  259701911320657920:true,
  181185781094809610:true
}
let blacklist_from_fun = {
  507714276044308490:true
}
let mad_score = {
  comparative: -2.5,
  total: -10
};
let fun_cooldown = 20000;
let on_cooldown = false;
let debug = false;

client.on('ready', () => {
  console.log(`Logged in as ${client.user.tag}!`);
  createGlobalCommand("testsentiment", context => {
    commands.testsentiment(context);
  });
  createGlobalCommand("summon", context => {
    commands.summon(context);
  });
  createGlobalCommand("debug", context=> {
    commands.toggleDebug(context);
  });
});

client.on('message', msg => {
  // ALMOND DINK DONK
  if(msg.content === "dink" && (msg.author.id == 251132701917184000)){
    msg.reply("donk");
  }
  // Fun Features
  if(!on_cooldown) {
    let message_sentiment = sentiment(msg.content);
    if(debug) console.log(message_sentiment);
    if(message_sentiment.comparative < mad_score.comparative || message_sentiment.score < mad_score.total) {
      msg.reply("What's wrong homie?");
      on_cooldown=true;
      setTimeout(()=>{on_cooldown=false;}, fun_cooldown);
    };
  }
  
  //testing section
  if(msg.author.id == 251132701917184000) {
    
  }
  validateCommand(msg);
})
let temp_cooldown = false;
client.on("guildMemberUpdate", function(oldUser, newUser){
  if(oldUser.id == 449046144035848202 && !temp_cooldown){
    newUser.setNickname("FaZe Noobani");
    console.log("dani tried");
    temp_cooldown = true;
    setTimeout(()=>{temp_cooldown=false},1000);
  }
});

function validateCommand(msg){
  message = msg.content
  if(message.substring(0,prefix.length) == prefix) {
    var split = message.split(" ");
    let command = split[0].substring(prefix.length, split[0].length)
    if(debug) console.log(`Parsed command: ${command}`)
    if(global_commands[command] != null) {
      ctx = msg;
      ctx.args = [];
      for(let i = 1; i < split.length; i++){
        ctx.args.push(split[i]);
      }
      global_commands[command](ctx);
    } else if (server_commands[msg.guild.id][command] != null){
      server_commands[msg.guild.id][command](ctx);
    }
  }
}

function createGlobalCommand(command, callback) {
    global_commands[command]  = callback;
}

client.login(credentials.token);