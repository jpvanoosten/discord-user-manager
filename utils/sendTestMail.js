require("dotenv").config();
const path = require("path");
const fs = require("fs");
const debug = require("debug")("discord-user-manager:send-test-mail");
const nodemailer = require("nodemailer");

async function main() {
  if (process.env.SMTP_URL) {
    let transport = nodemailer.createTransport(process.env.SMTP_URL);

    // Verify mail transport is valid.
    const valid = await transport.verify();

    if (valid) {
      const welcomeMessagePath = path.join(__dirname, "..", "welcome-message.eml");
      let welcomeMessage = fs.readFileSync(welcomeMessagePath, "utf-8");

      welcomeMessage = welcomeMessage.replace(/{{from}}/g, `Discord User Manager <${transport.options.auth.user}>`);
      welcomeMessage = welcomeMessage.replace(/{{name}}/g, "Test");
      welcomeMessage = welcomeMessage.replace(/{{email}}/g, process.env.TEST_EMAIL);
      welcomeMessage = welcomeMessage.replace(/{{password}}/g, "password");
      welcomeMessage = welcomeMessage.replace(/{{server}}/g, "http://localhost:3000/login");

      // Message object
      let message = {
        envelope: {
          from: transport.options.auth.user,
          to: [process.env.TEST_EMAIL],
        },
        raw: welcomeMessage,
      };

      const info = await transport.sendMail(message);
      debug("Message sent: %s", info.messageId);
      // Preview only available when sending through an Ethereal account
      debug("Preview URL: %s", nodemailer.getTestMessageUrl(info));
    }
  } else {
    debug("Please configure the SMTP_URL variable in the .env file.");
  }
}

main().catch((err) => {
  debug(err);
});
