const debug = require("debug")("discord-user-manager:app");
const bcrypt = require("bcrypt");
const createError = require("http-errors");
const cookieParser = require("cookie-parser");
const express = require("express");
const flash = require("connect-flash");
const helmet = require("helmet");
const logger = require("morgan");
const session = require("express-session");
const passport = require("passport");
const path = require("path");
const LocalStrategy = require("passport-local").Strategy;
const GoogleStrategy = require("passport-google-oauth20").Strategy;
const settings = require("./settings");

// initalize Sequelize with session store
const SequelizeStore = require("connect-session-sequelize")(session.Store);

const models = require("./models");

const googleRouter = require("./routes/google");
const indexRouter = require("./routes/index");
// const loginRouter = require("./routes/login");
const logoutRouter = require("./routes/logout");
const usersRouter = require("./routes/users");

// Simple route middleware to ensure user is authenticated.
//   Use this route middleware on any resource that needs to be protected.  If
//   the request is authenticated (typically via a persistent login session),
//   the request will proceed.  Otherwise, the user will be redirected to the
//   login page.
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

// Setup passport
// Source: https://github.com/pferretti/passport-local-token/blob/master/examples/login/app.js
// Only serialize the email address of the user.
passport.serializeUser((user, done) => {
  done(null, user.email);
});

// Deserialize the user from the email address.
passport.deserializeUser((email, done) => {
  models.User.findOne({
    where: {
      email
    }
  })
    .then(user => {
      done(null, user);
    })
    .catch(err => {
      done(err);
    });
});

// Use a local database lookup for local logins.
passport.use(
  new LocalStrategy((email, password, done) => {
    // Find user by email in the User table.
    models.User.findOne({
      where: {
        email
      }
    })
      .then(user => {
        if (user) {
          // Check for the correct password
          const passwordsMatch = bcrypt.compareSync(password, user.password);
          if (passwordsMatch) {
            // Passwords match, return the user.
            return done(null, user);
          } else {
            // Passwords don't match, return null.
            return done(null, null, {
              message: `Invalid password for user ${email}`,
              passwordError: "Invalid password.",
              email
            });
          }
        } else {
          // User with specified username was not found in the Admin table.
          return done(null, null, {
            message: `User ${email} not found.`,
            usernameError: "Invalid email.",
            email
          });
        }
      })
      .catch(err => {
        debug(`An error occured while querying the user: ${err}`);
        return done(err);
      });
  })
);

// Google strategy for autenticating users with a Google account
passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: process.env.GOOGLE_REDIRECT_URI
    },
    (accessToken, refreshToken, profile, done) => {
      // Get the email address of the user:
      if (!profile.emails || !profile.emails.length) {
        return done("No email address associated with Google account.");
      }

      const email = profile.emails[0].value;

      models.User.findOrCreate({
        where: {
          email: email
        }
      })
        .then(([user, created]) => {
          if (created) {
            debug(`New user added to database: ${profile.displayName}`);
          } else {
            debug(
              `User already registered to database: ${profile.displayName}`
            );
          }

          user
            .update({
              googleId: profile.id,
              img: profile.photos[0].value,
              name: profile.displayName,
              nickname: profile.displayName
            })
            .then(() => {
              done(null, user);
            });
        })
        .catch(err => {
          debug(`An error occured when adding user: ${err}`);
          done(err);
        });
    }
  )
);

const app = express();

// Specify app settings on the app's locals object so that
// they can be used by the pug template renderer.
app.locals = {
  ...settings
};

// Use browser-sync to refresh the browser if a file changes.
// https://github.com/schmich/connect-browser-sync
if (app.get("env") === "development") {
  const browserSync = require("browser-sync");
  const bs = browserSync.create().init({
    files: ["**/*.js", "views/*.pug", "public/**"],
    ignore: ["node_modules"],
    logSnippet: true,
    open: false,
    proxy: "localhost:3000",
    port: 3001,
    ui: {
      port: 3002
    }
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
      db: models.sequelize
    }),
    saveUninitialized: false,
    resave: false,
    cookie: {
      maxAge: 8.64e7, // 1 day
      httpOnly: true,
      secure: "auto"
    }
  })
);
app.use(passport.initialize());
app.use(passport.session());
app.use(flash());
app.use(express.static(path.join(__dirname, "public")));

// Add local variables so they are available to all PUG templates.
app.use(function(req, res, next) {
  res.locals.path = req.path;
  res.locals.user = req.user;
  next();
});

app.use("/", indexRouter);
// app.use("/login", loginRouter);
app.use("/logout", logoutRouter);
app.use("/google", isCodeOfConduct, googleRouter);

// Make sure only logged in users can access the /users page.
app.use("/users", isAdmin, usersRouter);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  next(createError(404));
});

// error handler
app.use(function(err, req, res) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get("env") === "development" ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render("error");
});

module.exports = app;
