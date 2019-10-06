module.exports = {
  name: "ping",
  aliases: ["p"],
  description: "Send a ping to this bot to make sure it is working correctly.",
  cooldown: 5,
  execute(message, args) {
    message.channel.send("Pong.");
  }
};
