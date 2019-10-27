![Discord User Manager][title image]

# Discord User Manager

The **Discord User Manager** allows users to join your [Discord] server by authenticating with an [OAuth 2.0] provider such as [Google] or [Microsoft]. This is useful if your school or work is using [G Suite] from [Google] or [Office 365] from [Microsoft] and you want to restrict the members of your [Discord] server to the members of your organization or domain. This allows you to have more control over who is able to join your Discord server without having to manage Discord invites.

## Dependencies

The **Discord User Manager** is built with JavaScript using [Express] and the [Pug] template engine with [Bootstrap] for HTML, CSS, and JavaScript framework. The **Discord User Manager** project has a dependency on the following packages:

| Package                     | Semantic Version | Description                                                                                                                     |
| --------------------------- | ---------------- | ------------------------------------------------------------------------------------------------------------------------------- |
| [bcrypt]                    | ^3.0.6           | Pasword hashing used for logging into local accounts. Passwords for [OAuth] accounts are not stored locally.                    |
| [connect-flash]             | ^0.1.1           | Used for passing messages between http requests. Flash messages use session storage to persists messages between http requests. |
| [connect-session-sequelize] | ^6.0.0           | SQL Session store using [Sequelize] as a storage backend.                                                                       |
| [cookie-parser]             | ~1.4.4           | Parse the `Cookie` header and populate `req.cookies` property with an object keyed by the cookie name.                          |
| [debug]                     | ~2.6.9           | A JavaScript debugging utility.                                                                                                 |
| [discord.js]                | ^12.0.0-dev      | A powerful library for interacting with the Discord API.                                                                        |
| [dotenv]                    | ^8.1.0           | Loads environment variables from a `.env` file into the `process.env` global variable.                                          |
| [express]                   | ~4.16.1          | A fast, unopinionated, minimalist web framework for [Node.js].                                                                  |
| [express-session]           | ^1.16.2          | [Express] middleware which will populate the `req.session` object.                                                              |
| [helmet]                    | ^3.21.0          | Helps to secure your [Express] web application.                                                                                 |
| [http-errors]               | ~1.6.3           | Used to create HTTP error responses (for unmatched route handling for example).                                                 |
| [jsonwebtoken]              | ^8.5.1           | Impelements [JSON Web Token](JWT).                                                                                              |
| [morgan]                    | ~1.9.1           | HTTP request logger middleware for [Node.js]                                                                                    |
| [passport]                  | ^0.4.0           | [Passport] is [Express]-compatible authentication middleware for [Node.js].                                                     |
| [passport-discord]          | ^0.1.3           | [Passport] strategy for authentication with [Discord] through the [OAuth 2.0] API.                                              |
| [passport-google-oauth20]   | ^2.0.0           | [Passport] strategy for authenticating with [Google] using the [OAuth 2.0] API.                                                 |
| [passport-local]            | ^1.0.0           | [Passport] strategy for authenticating with username and password.                                                              |
| [pug]                       | 2.0.0-beta11     | High performance template engine.                                                                                               |
| [sequelize]                 | ^5.18.4          | A promise-based [Node.js] ORM for Postgres, MySQL, MariaDB, SQLite, and Microsoft SQL Server.                                   |
| [sqlite3]                   | ^4.1.0           | Asynchronous, non-blocking [SQLite3] bindings for [Node.js].                                                                    |

## Development Dependencies

In addition to the regular dependencies, the **Discord User Manager** also has the following development dependecies.

| Package                | Semantic Version | Description                                                                                         |
| ---------------------- | ---------------- | --------------------------------------------------------------------------------------------------- |
| [@types/jest]          | ^24.0.19         | Type definitinos for [Jest].                                                                        |
| [browser-sync]         | ^2.26.7          | Automatically syncronize changes to multiple devices during development.                            |
| [connect-browser-sync] | ^2.1.0           | Injects the necessary [BrowserSync] &lt;script&gt; tags into the HTML pages.                        |
| [eslint]               | ^6.3.0           | [ESLint] is a tool for identifying and reporting on patterns found in ECMAScript/JavaScript code.   |
| [eslint-plugin-jest]   | ^22.19.0         | [ESLint] plugin for [Jest].                                                                         |
| [jest]                 | ^24.9.0          | A JavaScript testing framework.                                                                     |
| [nodemon]              | ^1.19.2          | A tool that automatically restarts the [Node.JS] application when file changes are detected.        |
| [sequelize-cli]        | ^5.5.1           | The [Sequelize] Command Line Interface (CLI).                                                       |
| [yargs]                | ^14.0.0          | Build interactive command line tools by parsing arguments and generating an elegant user interface. |

## Installation

**Discord User Manager** requires [Node.js] (version 10 or higher) in order to be installed. Either download the source from https://github.com/jpvanoosten/discord-user-manager or install it from the command line:

```bash
git clone https://github.com/jpvanoosten/discord-user-manager.git
```

Make sure the current working directory is set to the directory where the repo was cloned to:

```bash
cd discord-user-manager
```

Install package dependencies:

```bash
npm install
```

or if using [Yarn]:

```bash
yarn
```

## Configuration

The **Discord User Manager** uses environment variables to configure a lot of functionality. The [.env.example](.env.example) file contains all of the environment variables used by the **Discord User Manager**.

The following table describes the configurable environment varaibles.

| Variable               | Default Value                                                                    | Description                                                                                                                                                                                           |
| ---------------------- | -------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| NODE_ENV               | development                                                                      | When running in production, make sure the value of this variable is **production**. When running in development, some additional features (such as debug logging and browser sync) will be available. |
| PORT                   | 3000                                                                             | What port the [Express] server should listen on.                                                                                                                                                      |
| DEBUG                  | discord-user-manager:\*                                                          | Conrols what debug messages are logged.                                                                                                                                                               |
| USE_BROWSER_SYNC       | false                                                                            | Whether [BrowserSync] should be enabled or not.                                                                                                                                                       |
| ADMIN_USERNAME         | admin                                                                            | The username for the default administrator account.                                                                                                                                                   |
| ADMIN_PASSWORD         |                                                                                  | The password for the default administrator account.                                                                                                                                                   |
| SESSION_SECRET         |                                                                                  | The secret used to sign the session ID cookie.                                                                                                                                                        |
| GOOGLE_CLIENT_ID       |                                                                                  | OAuth 2.0 Client ID from the [Google Developer Console].                                                                                                                                              |
| GOOGLE_CLIENT_SECRET   |                                                                                  | OAuth 2.0 Cient Secret from the [Google Developer Console].                                                                                                                                           |
| GOOGLE_REDIRECT_URI    | [http://localhost:3000/google/callback](http://localhost:3000/google/callback)   | The path in your application that users are redirected to after they have authenticated with Google. This is configured in the [Google Developer Console Credentials].                                |
| DISCORD_CLIENT_ID      |                                                                                  | OAuth 2.0 Client ID from the [Discord Developer Portal].                                                                                                                                              |
| DISCORD_CLIENT_SECRET  |                                                                                  | OAuth 2.0 Client Secret from the [Discord Developer Portal].                                                                                                                                          |
| DISCORD_REDIRECT_URI   | [http://localhost:3000/discord/callback](http://localhost:3000/discord/callback) | The path in your appliation that users are redirected to after they have authenticated with [Discord].                                                                                                |
| DISCORD_BOT_TOKEN      |                                                                                  | The unique token used to authenticate the Bot with the [DiscordJS] client.                                                                                                                            |
| DISCORD_SERVER_ID      |                                                                                  | The unique identifier for the [Discord] server.                                                                                                                                                       |
| TEST_USER_DISCORD_ID   |                                                                                  | The unique identifer for a [Discord] user. (Only used for testing).                                                                                                                                   |
| TEST_USER_ACCESS_TOKEN |                                                                                  | An access token for a [Discord] user. (Only used for testing).                                                                                                                                        |

[bootstrap]: https://getbootstrap.com/
[oauth]: https://oauth.net/
[oauth 2.0]: https://oauth.net/2/
[discord]: https://discordapp.com/
[discordjs]: https://discord.js.org/
[g suite]: https://gsuite.google.com
[google]: https://www.google.com
[office 365]: https://www.office365.com
[microsoft]: https://www.microsoft.com
[express]: https://expressjs.com
[pug]: https://pugjs.org
[title image]: /docs/images/discord-user-manager.gif
[bcrypt]: https://www.npmjs.com/package/bcrypt
[connect-flash]: https://www.npmjs.com/package/connect-flash
[connect-session-sequelize]: https://www.npmjs.com/package/connect-session-sequelize
[sequelize]: https://sequelize.org/
[cookie-parser]: https://www.npmjs.com/package/cookie-parser
[debug]: https://www.npmjs.com/package/debug
[discord.js]: https://github.com/discordjs/discord.js
[dotenv]: https://www.npmjs.com/package/dotenv
[node.js]: https://nodejs.org
[express-session]: https://www.npmjs.com/package/express-session
[helmet]: https://www.npmjs.com/package/helmet
[http-errors]: https://www.npmjs.com/package/http-errors
[jsonwebtoken]: https://www.npmjs.com/package/jsonwebtoken
[json web token]: https://tools.ietf.org/html/rfc7519
[morgan]: https://www.npmjs.com/package/morgan
[passport]: http://www.passportjs.org/
[passport-discord]: https://www.npmjs.com/package/passport-discord
[passport-google-oauth20]: https://www.npmjs.com/package/passport-google-oauth20
[passport-local]: https://www.npmjs.com/package/passport-local
[sqlite3]: https://www.npmjs.com/package/sqlite3
[sqlite]: https://sqlite.org/index.html
[@types/jest]: https://www.npmjs.com/package/@types/jest
[jest]: https://jestjs.io/
[browser-sync]: https://www.npmjs.com/package/browser-sync
[browsersync]: https://browsersync.io/
[connect-browser-sync]: https://www.npmjs.com/package/connect-browser-sync
[eslint]: https://eslint.org/
[eslint-plugin-jest]: https://www.npmjs.com/package/eslint-plugin-jest
[nodemon]: https://nodemon.io/
[sequelize-cli]: https://www.npmjs.com/package/sequelize-cli
[yargs]: https://www.npmjs.com/package/yargs
[yarn]: https://yarnpkg.com/
[google developer console]: https://console.developers.google.com/
[google developer console credentials]: https://console.developers.google.com/apis/credentials
[discord developer portal]: https://discordapp.com/developers/
