var sentiment = require('@trainorpj/sentiment');

let summon_overrides = {
  259701911320657920:true,
  181185781094809610:true
}

exports.testsentiment = (context) => {
    let sen = sentiment(context.args.join(" "));
    context.reply(`the phrase "${context.args.join(" ")}" has the following sentiment \`\`\`Comparative: ${sen.comparative}\nTotal: ${sen.score}\`\`\``);
    console.log(sen);
}
let summon_limit = 10;

exports.summon = (context) =>{
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
}

exports.toggleDebug = (context) => {
    if(context.author.id == 251132701917184000){
        if(context.args[0] == "true" || context.args[0] == "on") debug = true;
        else if (context.args[0] == "false" || context.args[0] == "off") debug = false;
        context.reply(`Debug has been set to ${debug}`);
      }
}