// const createError = require("http-errors");
const bcrypt = require("bcrypt");
const debug = require("debug")("discord-user-manager:users");
const path = require("path");
const fs = require("fs");
const express = require("express");
const Sequelize = require("sequelize");
const models = require("../models");
const nodemailer = require("nodemailer");
const router = express.Router();
const DiscordAdapter = require("../discord/DiscordAdapter");

const OR = Sequelize.Op.or;
const SUBSTRING = Sequelize.Op.substring;

// Read the welcome message template.
const welcomeMessagePath = path.join(__dirname, "..", "welcome-message.eml");
const welcomeMessageTemplate = fs.readFileSync(welcomeMessagePath, "utf-8");

/* GET users listing. */
router.get("/", async (req, res) => {
  // Get the query parameters
  const search =
    typeof req.query.q === "undefined" ? (req.session.users && req.session.users.search) || "" : req.query.q;
  const limit = Math.max(parseInt(req.query.limit || (req.session.users && req.session.users.limit) || 50), 1);
  let offset = parseInt(req.query.offset || (req.session.users && req.session.users.offset) || 0);
  const order = req.query.order || (req.session.users && req.session.users.order) || "";

  // Save query parameters to the session if they changed.
  req.session.users = {
    search,
    limit,
    offset,
    order,
  };

  let where;
  if (search) {
    where = {
      [OR]: [
        {
          username: {
            [SUBSTRING]: search,
          },
        },
        {
          name: {
            [SUBSTRING]: search,
          },
        },
      ],
    };
  }

  debug("Querying users");
  // Get a list of users
  const numUsers = await models.User.count({
    where,
  });

  // Limit offset so that it doesn't exceed the maximum number of users.
  offset = Math.min(offset, numUsers - 1);

  const users = await models.User.findAll({
    where,
    limit,
    offset,
    order,
    raw: true, // Just get the fields, but don't attach functions (see: https://sequelize.org/master/manual/models-usage.html#raw-queries)
  });

  const flashMessages = req.flash("info")[0];

  res.render("users", {
    pageTitle: "Users",
    numUsers,
    users,
    limit,
    offset,
    search,
    ...flashMessages,
  });
});

// A regular expression pattern for matching a valid email address.
// @see https://emailregex.com/
const validEmail = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;

/**
 * Send a welcome email to the user.
 * @param {string} name The name of the user.
 * @param {string} email The email address of the new user.
 * @param {string} password The password for the new user.
 * @param {string} server The URL of this server.
 */
async function sendWelcomeMail(name, email, password, server) {
  if (process.env.SMTP_URL) {
    let transport = nodemailer.createTransport(process.env.SMTP_URL);

    // Verify mail transport is valid.
    const valid = await transport.verify();

    if (valid) {
      let welcomeMessage = welcomeMessageTemplate;
      welcomeMessage = welcomeMessage.replace(/{{from}}/g, `Discord User Manager <${transport.options.auth.user}>`);
      welcomeMessage = welcomeMessage.replace(/{{name}}/g, name);
      welcomeMessage = welcomeMessage.replace(/{{email}}/g, email);
      welcomeMessage = welcomeMessage.replace(/{{password}}/g, password);
      welcomeMessage = welcomeMessage.replace(/{{server}}/g, server);

      // Message object
      let message = {
        envelope: {
          from: transport.options.auth.user,
          to: [email],
        },
        raw: welcomeMessage,
      };

      const info = await transport.sendMail(message);
      debug("Message sent: %s", info.messageId);
    } else {
      debug("Invalid transport. Please verify the SMPT_URL environment variable is correct and valid.");
    }
  } else {
    debug("To send welcome emails, please configure the SMTP_URL environment variable.");
  }
}

// Add a user
router.post("/add", async (req, res) => {
  const username = req.body.username;
  const name = req.body.name;
  const password = req.body.password;
  const isAdmin = req.body.isAdmin ? true : false;

  // Check if user already exists.
  // Usernames must be uniqe.
  let user = await models.User.findOne({
    where: {
      username,
    },
  });

  if (user) {
    req.flash("info", {
      errorAlert: `User with username ${username} already exists.`,
    });

    return res.redirect("back");
  }

  debug(`Adding user ${name} (${username})`);

  user = await models.User.create({
    username,
    name,
    password: bcrypt.hashSync(password, 10),
    isAdmin,
  });

  if (!user) {
    req.flash("info", {
      errorAlert: `Error adding user ${name} (${username})`,
    });

    return res.redirect("back");
  }

  // If the username is an email address, send a welcome message.
  if (validEmail.test(username)) {
    sendWelcomeMail(name, username, password, `${req.protocol}://${req.get("host")}/login`);
  }

  req.flash("info", {
    successAlert: `Successfully added ${user.name} (${user.username})`,
  });

  return res.redirect("back");
});

// Edit a user
router.post("/edit/:id", async (req, res) => {
  const id = req.params.id;
  const username = req.body.username;
  const name = req.body.name;
  // Don't replace the password if no password was provided.
  const password = req.body.password ? bcrypt.hashSync(req.body.password, 10) : undefined;
  const isAdmin = req.body.isAdmin ? true : false;
  //  const discordId = req.body.discordId;

  const user = await models.User.findOne({
    where: {
      id,
    },
  });

  if (!user) {
    return res.redirect("/users");
  }

  debug(`Editing user [${id}] ${user.username}`);

  // Perform the update
  await user.update({
    username,
    name,
    password,
    isAdmin,
  });

  // Update the user's nickname on Discord.
  if (user.discordId) {
    try {
      DiscordAdapter.setNickname(user.discordId, name);
    } catch (err) {
      debug(`An error occured while updating the user's nickname: ${err}`);
    }
  }

  // Send a flash message that the user was edited.
  req.flash("info", {
    successAlert: `User with id ${id} has been succesfully edited.`,
  });

  res.redirect("/users");
});

// Delete a user.
router.post("/delete/:id", async (req, res) => {
  const id = req.params.id;

  if (id == req.user.id) {
    req.flash("info", {
      errorAlert: `You cannot delete yourself!`,
    });
    return res.redirect("/users");
  }

  const user = await models.User.findOne({
    where: {
      id,
    },
  });

  if (!user) {
    return res.redirect("/users");
  }

  debug(`Deleting user [${id}] ${user.username}`);

  if (user.discordId) {
    // Remove the user from the Discord server.
    DiscordAdapter.removeUser(user.discordId);
  }
  // Perform the delete
  await user.destroy();

  // Send a flash message that the user was deleted.
  req.flash("info", {
    infoAlert: `User with id ${id} has been succesfully deleted.`,
  });

  res.redirect("/users");
});

module.exports = router;
