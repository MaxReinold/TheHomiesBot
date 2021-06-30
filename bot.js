const Discord = require('discord.js');
const client = new Discord.Client();
const config = require('./config.json');
const credentials = require('./credentials.json');
let global_commands = {};
let server_commands = {};
let prefix = "!";
let summon_overrides = {
  259701911320657920:true,
  181185781094809610:true
}
let summon_limit = 10;

client.on('ready', () => {
  console.log(`Logged in as ${client.user.tag}!`);
  createGlobalCommand("summon", context => {
    // console.log(context.mentions.users.first());
    if(context.args[0] && (context.member.hasPermission('ADMINISTRATOR') || summon_overrides[context.member.id])) {
      let member = context.mentions.members.first();
      if(member) {
        let temp = context.mentions.members.first().voice.channel;
        let goto = context.guild.channels.cache.filter(c => c.type=="voice").filter(c => !c.members.first()).random();
        let count = 4;
        if(parseInt(context.args[1])){
          count = parseInt(context.args[1]);
        }
        if (count > summon_limit) {
          context.reply(`The current summon limit is ${summon_limit} and your input has been capped`);
          count = summon_limit;
        }
        if(temp) {
          for(let i = 0; i< count; i++){
            member.voice.setChannel(goto);
            member.voice.setChannel(temp);
          }
        }
      }
    }
  });
});

client.on('message', msg => {
  // ALMOND DINK DONK
  if(msg.content === "dink" && (msg.author.id == 251132701917184000)){
    msg.reply("donk");
  }
  //testing section
  if(msg.author.id == 251132701917184000) {
    
  }
  validateCommand(msg);
})

function validateCommand(msg){
  message = msg.content
  if(message.substring(0,prefix.length) == prefix) {
    var split = message.split(" ");
    let command = split[0].substring(prefix.length, split[0].length)
    console.log(`Parsed command: ${command}`)
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