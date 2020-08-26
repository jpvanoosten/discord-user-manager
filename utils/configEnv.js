const fs = require("fs");
const path = require("path");
const argv = require("yargs").command(
  "* [force]",
  "Create the .env file in the project's root folder based on the .env.example file.",
  (yargs) => {
    yargs.positional("force", {
      describe: "Force overwritting of the .env file even if it already exists.",
      alias: "f",
      type: "boolean",
      default: false,
    });
  }
).argv;

let crypto;

// Determine if crypto support is available
// See: https://nodejs.org/api/crypto.html#crypto_determining_if_crypto_support_is_unavailable
try {
  crypto = require("crypto");
} catch (err) {
  console.log("Crypto support is disabled!");
}

function generatePassword(length = 256) {
  return crypto.randomBytes(length).toString("base64");
}

// Less secure variant but could be used if the crypto library is not available.
// function generatePassword(length = 24) {
//   const chars =
//     "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";

//   const password = Array(length)
//     .fill(chars)
//     .map(c => {
//       return c[Math.floor(Math.random() * c.length)];
//     })
//     .join("");

//   return password;
// }

const envInput = path.join(__dirname, "..", ".env.example");
const envOutput = path.join(__dirname, "..", ".env");

async function main() {
  // Check to see if the file already exists, if not don't overwite it
  // unless the --force option is specified.
  if (fs.existsSync(envOutput)) {
    if (argv.force) {
      console.log(`${envOutput} already exists. The force option was specified so the file will be overwritten.`);
    } else {
      throw new Error(`${envOutput} already exists. Use the --force option to force overwritting the file.`);
    }
  }

  let env = fs.readFileSync(envInput, "utf8");

  env = env.replace(/\[RANDOM_(\d+)\]/g, (match, length) => {
    return generatePassword(parseInt(length));
  });

  fs.writeFileSync(path.join(__dirname, "..", ".env"), env);

  console.log(`Finished configuring ${envOutput}`);
}

main().catch((err) => {
  console.log(err);
});
