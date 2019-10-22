![Discord User Manager][title image]

# Discord User Manager

The **Discord User Manager** allows users to join your [Discord] server by authenticating with an [OAuth 2.0] provider such as [Google] or [Microsoft]. This is useful if your school or work is using [G Suite] from [Google] or [Office 365] from [Microsoft] and you want to restrict the members of your [Discord] server to the members of your organization or domain. This allows you to have more control over who is able to join your Discord server without having to manage Discord invites.

## Dependencies

The **Discord User Manager** is built with JavaScript using [Express] and the [Pug] template engine with [Bootstrap] for HTML, CSS, and JavaScript framework. The **Discord User Manager** project has a dependency on the following projects:

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

[bootstrap]: https://getbootstrap.com/
[oauth]: https://oauth.net/
[oauth 2.0]: https://oauth.net/2/
[discord]: https://discordapp.com/
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
