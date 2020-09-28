require("dotenv").config();
const debug = require("debug")("discord-user-manager:get-oauth-token");
const express = require("express");
const { google } = require("googleapis");
const stoppable = require("stoppable");
const open = require("open");
const fs = require("fs");
const path = require("path");

const tokenPath = path.join(__dirname, "..", "token.json");

const auth = new google.auth.OAuth2(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  process.env.GOOGLE_REDIRECT_URI
);

/**
 * Write the access token to the token file.
 *
 * @param token {string} The OAuth access token.
 */
function writeAccessToken(token) {
  fs.writeFileSync(tokenPath, JSON.stringify(token));
  debug(`${tokenPath} file updated with new access token.`);
}

const app = express();
const port = process.env.PORT || "3000";
app.set("port", port);

app.get("/", (req, res) => {
  const authUrl = auth.generateAuthUrl({
    access_type: "offline",
    scope: "https://www.googleapis.com/auth/admin.directory.group.readonly",
  });

  return res.redirect(authUrl);
});

app.get("/google/callback", async (req, res) => {
  try {
    const code = req.query.code;
    const tokenResponse = await auth.getToken(code);

    writeAccessToken(tokenResponse.tokens);

    res.redirect("/success"); // Authentication was successfull.
  } catch (err) {
    res.redirect("/failed");
  }
});

app.get("/success", (req, res) => {
  res.send("Success! You can close this browser window.");
  server.stop();
});

app.get("/failed", (req, res) => {
  res.send("Something went wrong...");
  server.stop();
});

const server = stoppable(
  app.listen(port, (err) => {
    if (err) return debug(err);
    open(`http://localhost:${port}/`);
  }),
  1000
);
