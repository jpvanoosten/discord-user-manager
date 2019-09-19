"use strict";
module.exports = (sequelize, DataTypes) => {
  const User = sequelize.define(
    "User",
    {
      username: { type: DataTypes.STRING, unique: true },
      discordId: { type: DataTypes.STRING, unique: true }
    },
    {}
  );
  // eslint-disable-next-line no-unused-vars
  User.associate = function(models) {
    // associations can be defined here
  };
  return User;
};
