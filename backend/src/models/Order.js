const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const Order = sequelize.define(
  "Order",
  {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    userId: { type: DataTypes.INTEGER, allowNull: false },
    orderNumber: { type: DataTypes.STRING(30), allowNull: false, unique: true },
    status: { type: DataTypes.STRING(60), allowNull: false },
    paymentMethod: { type: DataTypes.STRING(30), allowNull: false },
    customer: { type: DataTypes.JSONB, allowNull: true },
    summary: { type: DataTypes.JSONB, allowNull: false },
    delivery: { type: DataTypes.JSONB, allowNull: false },
  },
  { tableName: "orders", timestamps: true }
);

module.exports = Order;
