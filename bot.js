const { Client, Intents } = require("discord.js");
const Valorant = require("@liamcottle/valorant.js");
const { getPreferences, savePreferences, validateTransfer } = require("./utility.js");
const client = new Client({ 
    intents: [
        Intents.FLAGS.DIRECT_MESSAGES,
        Intents.FLAGS.DIRECT_MESSAGE_TYPING,
        Intents.FLAGS.DIRECT_MESSAGE_REACTIONS,
        Intents.FLAGS.GUILDS,
        Intents.FLAGS.GUILD_MESSAGES,
    ],
    partials: [
        'CHANNEL'
    ]
})

client.on('ready', ()=>{
    console.log(`Logged in as ${client.user.username}`)
})

client.on('messageCreate', msg => {
    validateTransfer(msg);
})

client.login('ODU4ODQ3OTkwMzI0NTI3MTA1.YNkGhQ.rXq629Nb_M1HoPh9LZj7hh9fSvM');