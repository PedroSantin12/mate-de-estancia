const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const User = sequelize.define(
  "User",
  {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    name: { type: DataTypes.STRING(120), allowNull: false },
    email: { type: DataTypes.STRING(180), allowNull: false, unique: true },
    passwordHash: { type: DataTypes.TEXT, allowNull: false },
    role: { type: DataTypes.ENUM("customer", "admin"), allowNull: false, defaultValue: "customer" },
    cart: { type: DataTypes.JSONB, allowNull: false, defaultValue: [] },
  },
  { tableName: "users", timestamps: true }
);

module.exports = User;
