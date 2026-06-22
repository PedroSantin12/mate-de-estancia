const User = require("../models/User");
const Product = require("../models/Product");
const Order = require("../models/Order");
const Review = require("../models/Review");
const AppError = require("../utils/AppError");
const { publicUser } = require("./authController");

const ORDER_STATUSES = ["Pedido confirmado", "Em preparo", "Enviado", "Entregue", "Cancelado"];

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

async function updateOrderStatus(req, res, next) {
  try {
    const status = String(req.body.status || "").trim();
    if (!ORDER_STATUSES.includes(status)) {
      throw new AppError("Status de pedido inválido.", 400, "VALIDATION_ERROR");
    }
    const order = await Order.findByPk(req.params.id);
    if (!order) throw new AppError("Pedido não encontrado.", 404, "ORDER_NOT_FOUND");
    order.status = status;
    await order.save();
    return res.json({ success: true, data: order });
  } catch (error) { return next(error); }
}

async function listReviews(_req, res, next) {
  try {
    const [reviews, users, products] = await Promise.all([
      Review.findAll({ order: [["createdAt", "DESC"]] }),
      User.findAll(),
      Product.findAll(),
    ]);
    const usersById = new Map(users.map((user) => [Number(user.id), publicUser(user)]));
    const productsById = new Map(products.map((product) => [Number(product.id), product]));

    const data = reviews.map((review) => {
      const item = review.toJSON();
      const user = usersById.get(Number(item.userId));
      const product = productsById.get(Number(item.productId));
      return {
        ...item,
        customerName: user?.name || "Cliente",
        customerEmail: user?.email || "E-mail não informado",
        productName: product?.name || "Produto removido",
      };
    });

    return res.json({ success: true, data });
  } catch (error) { return next(error); }
}

async function removeReview(req, res, next) {
  try {
    const review = await Review.findByPk(req.params.id);
    if (!review) throw new AppError("Avaliação não encontrada.", 404, "REVIEW_NOT_FOUND");
    await review.destroy();
    return res.json({ success: true, data: { id: Number(req.params.id) } });
  } catch (error) { return next(error); }
}

module.exports = {
  dashboard,
  listUsers,
  listOrders,
  listReviews,
  removeReview,
  updateOrderStatus,
  removeProduct,
};
