const Discord = require('discord.js');
const client = new Discord.Client();
const config = require('./config.json');
const credentials = require('./credentials.json');
let global_commands = {};
let server_commands = {};
let default_prefix = "!";

client.on('ready', () => {
  console.log(`Logged in as ${client.user.tag}!`);
  createGlobalCommand("test", async interaction => {
    console.log(`test ${interaction}`);
  });
});

client.on('interaction', async interaction => {
    if (!interaction.isCommand()) return;
    if(global_commands[interaction.commandName] != null) {
        await global_commands[interaction.commandName](interaction);
    }
})

client.login(credentials.token);

function createGlobalCommand(command, callback) {
    global_commands[command]  = callback;
}