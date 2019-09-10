const path = require("path");
const sqlite3 = require("sqlite3").verbose();
const debug = require("debug")("google-discord-server:db");
const settings = require("../settings");

class DatabaseConnector {
  constructor() {
    const fileName = path.join(
      __dirname,
      "..",
      settings.db.path,
      settings.db.file
    );

    this.db = new sqlite3.Database(fileName, err => {
      if (err) {
        debug(`Error connecting to database ${fileName}: ${err}`);
        throw new Error(err);
      }

      debug(`Connected to database: ${fileName}`);

      // Create the admin table if it doesn't exist.
      const adminTable =
        "CREATE TABLE IF NOT EXISTS admin (`id` TEXT UNIQUE,`name` TEXT,`password` TEXT);";

      this.db.run(adminTable, [], err => {
        if (err) {
          debug(`Failed to create admin table: ${err}`);
        }
        debug("Admin table created.");
      });

      // Create the user table if it doesn't exist.
      const userTable =
        "CREATE TABLE IF NOT EXISTS users (`id` TEXT UNIQUE,`name` TEXT,`discordId` TEXT);";
      this.db.run(userTable, [], err => {
        if (err) {
          debug(`Failed to create user table: ${err}`);
        }
        debug("User table created.");
      });
    });
  }

  /**
   * Add a user to the database.
   * @param {User} user The user to add to the database.
   * @return {Promise<boolean>}
   */
  addUser(user) {
    return new Promise((resolve, reject) => {
      const addUser = "INSERT INTO users(id,name) VALUES(?,?)";
      this.db.run(addUser, [user.id, user.name], err => {
        if (err) {
          debug(`Failed to add user: ${err}`);
          reject(err);
        }

        debug(`User (${user.id}, ${user.name}) added to users table.`);
        resolve(true);
      });
    });
  }

  /**
   * Read a list of users from the database.
   * @returns Promise<User[]> A promise that contains the users when resolved.
   */
  readUsers() {
    return new Promise((resolve, reject) => {
      const allUsers = "SELECT * FROM users";
      this.db.all(allUsers, [], (err, users) => {
        if (err) {
          debug(`Failed to read users: ${err}`);
          reject(err);
        }
        resolve(users);
      });
    });
  }
}

module.exports = new DatabaseConnector();
