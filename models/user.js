"use strict";
module.exports = (sequelize, DataTypes) => {
  const User = sequelize.define(
    "User",
    {
      email: { type: DataTypes.STRING, unique: true, isEmail: true },
      password: { type: DataTypes.STRING },
      img: { type: DataTypes.STRING },
      name: { type: DataTypes.STRING },
      googleId: { type: DataTypes.STRING, unique: true },
      discordId: { type: DataTypes.STRING, unique: true },
      nickname: { type: DataTypes.STRING },
      isAdmin: { type: DataTypes.BOOLEAN, defaultValue: false }
    },
    {}
  );
  // eslint-disable-next-line no-unused-vars
  User.associate = function(models) {
    // associations can be defined here
  };
  return User;
};
