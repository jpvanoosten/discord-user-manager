require("dotenv").config();
const debug = require("debug")("discord-user-manager:send-test-mail");
const nodemailer = require("nodemailer");

async function main() {
  if (process.env.SMTP_URL) {
    let transport = nodemailer.createTransport(process.env.SMTP_URL);

    // Verify mail transport is valid.
    const valid = await transport.verify();

    if (valid) {
      // Message object
      let message = {
        from: "Sender <sender@example.com>",
        to: "Recipient <recipient@example.com>",
        subject: "Nodemailer is unicode friendly ✔",
        text: "Hello to myself!",
        html: "<p><b>Hello</b> to myself!</p>",
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
