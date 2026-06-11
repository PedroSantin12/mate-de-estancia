const User = require("../models/User");
const Product = require("../models/Product");
const Order = require("../models/Order");
const AppError = require("../utils/AppError");
const { publicUser } = require("./authController");

async function dashboard(_req, res, next) {
  try {
    const [users, products, lowStock] = await Promise.all([
      User.count({ where: { role: "customer" } }),
      Product.count(),
      Product.count({ where: { stock: { [require("sequelize").Op.lte]: 15 } } }),
    ]);
    return res.json({ success: true, data: { users, products, lowStock } });
  } catch (error) { return next(error); }
}

async function listUsers(_req, res, next) {
  try {
    const users = await User.findAll({ order: [["createdAt", "DESC"]] });
    return res.json({ success: true, data: users.map(publicUser) });
  } catch (error) { return next(error); }
}

async function listOrders(_req, res, next) {
  try {
    const [orders, users] = await Promise.all([
      Order.findAll({ order: [["createdAt", "DESC"]] }),
      User.findAll(),
    ]);
    const usersById = new Map(users.map((user) => [Number(user.id), publicUser(user)]));
    const data = orders.map((order) => ({
      ...order.toJSON(),
      customer: order.customer || usersById.get(Number(order.userId)) || { name: "Cliente", email: "Não informado" },
    }));
    return res.json({ success: true, data });
  } catch (error) { return next(error); }
}

async function removeProduct(req, res, next) {
  try {
    const product = await Product.findByPk(req.params.id);
    if (!product) throw new AppError("Produto não encontrado.", 404, "PRODUCT_NOT_FOUND");
    await product.destroy();
    return res.json({ success: true, data: { id: product.id } });
  } catch (error) { return next(error); }
}

module.exports = { dashboard, listUsers, listOrders, removeProduct };
