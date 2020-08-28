// eslint-disable-next-line no-unused-vars
const debug = require("debug")("discord-user-manager:app");
const createError = require("http-errors");
const cookieParser = require("cookie-parser");
const express = require("express");
const flash = require("connect-flash");
const helmet = require("helmet");
const logger = require("morgan");
const session = require("express-session");
const passport = require("passport");
const path = require("path");
const settings = require("./settings");

// initalize Sequelize with session store
const SequelizeStore = require("connect-session-sequelize")(session.Store);

const models = require("./models");

const indexRouter = require("./routes/index");
const loginRouter = require("./routes/login");
const logoutRouter = require("./routes/logout");
const usersRouter = require("./routes/users");
const googleRouter = require("./routes/google");
const discordRouter = require("./routes/discord");

// Simple route middleware to ensure user is authenticated.
//   Use this route middleware on any resource that needs to be protected.  If
//   the request is authenticated (typically via a persistent login session),
//   the request will proceed.  Otherwise, the user will be redirected to the
//   login page.
function isAuthenticated(req, res, next) {
  if (req.isAuthenticated()) {
    return next();
  }

  // Otherwise redirect to the login page.
  res.redirect("/login");
}

function isAdmin(req, res, next) {
  if (req.isAuthenticated() && req.user.isAdmin) {
    return next();
  }
  // Otherwise redirect to the login page.
  res.redirect("/login");
}

// Route middleware that checks if the user has agreed to the code of conduct.
function isCodeOfConduct(req, res, next) {
  if (req.cookies.codeOfConduct === "true") {
    return next();
  }

  // Otherwise redirect to the home page.
  res.redirect("/");
}

// Route middleware that checks if the user has accepted the privacy policy
function isPrivacyPolicy(req, res, next) {
  if (req.cookies.privacyPolicy === "true") {
    return next();
  }

  // Otherwise redirect to the home page.
  res.redirect("/");
}

// Setup passport
// Source: https://github.com/pferretti/passport-local-token/blob/master/examples/login/app.js
// Only serialize the username of the user.
passport.serializeUser((user, done) => {
  done(null, user.username);
});

// Deserialize the user from the username address.
passport.deserializeUser((username, done) => {
  models.User.findOne({
    where: {
      username,
    },
  })
    .then((user) => {
      done(null, user);
    })
    .catch((err) => {
      done(err);
    });
});

const app = express();

// Specify app settings on the app's locals object so that
// they can be used by the pug template renderer.
app.locals = {
  ...settings,
};

// Use browser-sync to refresh the browser if a file changes.
// https://github.com/schmich/connect-browser-sync
if (process.env.USE_BROWSER_SYNC === "true") {
  const browserSync = require("browser-sync");
  const bs = browserSync.create().init({
    files: ["**/*.js", "views/*.pug", "public/**"],
    ignore: ["node_modules"],
    logSnippet: true,
    open: false,
    proxy: "localhost:3000",
    port: 3001,
    ui: {
      port: 3002,
    },
  });
  app.use(require("connect-browser-sync")(bs));
}

// view engine setup
app.set("views", path.join(__dirname, "views"));
app.set("view engine", "pug");
// Remove the next line in production environments.
app.disable("view cache");

// Use Helmet
// see: https://expressjs.com/en/advanced/best-practice-security.html#use-helmet
app.use(helmet());

// Using Morgan, logs all HTTP requests. The "dev" option gives it a specific styling.
// https://github.com/expressjs/morgan#dev
app.use(logger("dev"));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(
  session({
    name: "sid", // This is the name of the cookie that is used to store the session id.
    secret: process.env.SESSION_SECRET,
    store: new SequelizeStore({
      db: models.sequelize,
    }),
    saveUninitialized: false,
    resave: false,
    cookie: {
      maxAge: 8.64e7, // 1 day
      httpOnly: true,
      secure: "auto",
    },
  })
);
app.use(passport.initialize());
app.use(passport.session());
app.use(flash());
app.use(express.static(path.join(__dirname, "public")));

// Add local variables so they are available to all PUG templates.
app.use(function (req, res, next) {
  // Has the user agreed to the code of conduct?
  res.locals.codeOfConduct = req.query.codeOfConduct === "true" || req.cookies.codeOfConduct === "true";
  res.locals.privacyPolicy = req.query.privacyPolicy === "true" || req.cookies.privacyPolicy === "true";
  res.locals.path = req.path;
  res.locals.user = req.user;
  next();
});

app.use("/", indexRouter);
app.use("/login", isPrivacyPolicy, isCodeOfConduct, loginRouter);
app.use("/logout", isAuthenticated, logoutRouter);
app.use("/google", isPrivacyPolicy, isCodeOfConduct, googleRouter);
app.use("/discord", isPrivacyPolicy, isCodeOfConduct, isAuthenticated, discordRouter);

// Make sure only logged in admins can access the /users page.
app.use("/users", isAdmin, usersRouter);

// catch 404 and forward to error handler
app.use(function (req, res, next) {
  next(createError(404));
});

// error handler
app.use(function (err, req, res) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get("env") === "development" ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render("error");
});

module.exports = app;
