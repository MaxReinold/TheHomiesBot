const axios = require("axios").default;
const Valorant = require("@liamcottle/valorant.js");

let getPreferences = (auth)=>{
    return axios.get(`https://playerpreferences.riotgames.com/playerPref/v3/getPreference/Ares.PlayerSettings`, {
        headers: auth.generateRequestHeaders(),
    });
}

let savePreferences = (auth, preferences) => {
    return axios.put(`https://playerpreferences.riotgames.com/playerPref/v3/savePreference/`, 
    {
        data:preferences,
        type:"Ares.PlayerSettings"
    }, {
        headers: auth.generateRequestHeaders()
    })
}

let validateTransfer = (msg) => {
    // if(!msg.channel.isDMBased()) return;
    let parsed = msg.content.split(" ");
    if(parsed.length != 5) return;
    if(parsed[0] != "transfer") return;
    msg.channel.sendTyping();
    let sender = new Valorant.API("NA");
    sender.authorize(parsed[1], parsed[2]).then(()=>{
        let receiver = new Valorant.API("NA");
        receiver.authorize(parsed[3], parsed[4]).then(()=>{
            getPreferences(sender).then(res=>{
                savePreferences(receiver, res.data.data).then(()=>{
                    msg.reply(`Settings transfer complete.`);
                }).catch(err=>{
                    msg.reply(`Saving settings failed for ${parsed[3]}, please contact Max to fix.`);
                    console.error(err);
                })
            }).catch(err=>{
                msg.reply(`Retreiving settings failed for ${parsed[1]}, please contact Max to fix.`);
                console.error(err);
            })
        }).catch(err=>{
            msg.reply(`Login failed for ${parsed[3]}`);
        })
    }).catch(err=>{
        msg.reply(`Login failed for ${parsed[1]}`);
    })
}

module.exports = {
    getPreferences: getPreferences,
    savePreferences: savePreferences,
    validateTransfer: validateTransfer
}