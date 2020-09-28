require("dotenv").config();
const fs = require("fs");
const open = require("open");
const path = require("path");
const readline = require("readline");
const { google } = require("googleapis");

const tokenFile = path.join(__dirname, "token.json");

/**
 * Get a new OAuth2.0 token.
 * @param {google.OAuth2} auth OAuth client to perform the token request.
 * @returns {Promis<string>} A promise with the token.
 */
function getToken(auth) {
  return new Promise((resolve, reject) => {
    const authURL = auth.generateAuthUrl({
      access_type: "offline",
      scope: "https://www.googleapis.com/auth/admin.directory.group.readonly",
    });
    open(authURL);

    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
    });

    rl.question("Enter the code: ", (code) => {
      rl.close();
      auth.getToken(code, (err, token) => {
        if (err) reject(err);
        fs.writeFileSync(tokenFile, JSON.stringify(token));
        resolve(token);
      });
    });
  });
}

async function main() {
  const auth = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.GOOGLE_REDIRECT_URI
  );

  // Check if we have a previously stored token file:
  if (fs.existsSync(tokenFile)) {
    const tokenContent = fs.readFileSync(tokenFile, "utf-8");
    auth.credentials = JSON.parse(tokenContent);
  } else {
    // Request a new token:
    const token = await getToken(auth);
    auth.credentials = token;
  }

  return listUsers(auth);
}

/**
 * Lists the first 10 users in the domain.
 *
 * @param {google.auth.OAuth2} auth An authorized OAuth2 client.
 */
async function listUsers(auth) {
  const service = google.admin({ version: "directory_v1", auth });
  const res = await service.groups.list({
    userKey: "oosten.j@ade-buas.nl",
    fields: "nextPageToken, groups/email",
  });

  const groups = res.data.groups;
  if (groups.length) {
    console.log("Groups:");
    groups.forEach((group) => {
      console.log(`${group.email}`);
    });
  } else {
    console.log("No groups found.");
  }
}

main().catch((err) => {
  console.error(`An error occured: ${err}`);
});
