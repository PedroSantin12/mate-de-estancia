const { Op } = require("sequelize");
const User = require("../models/User");
const Product = require("../models/Product");
const Order = require("../models/Order");
const Review = require("../models/Review");
const AppError = require("../utils/AppError");
const { publicUser } = require("./authController");

const ORDER_STATUSES = ["Pedido confirmado", "Em preparo", "Enviado", "Entregue", "Cancelado"];

function calculateSalesMetrics(orders) {
  const statusCounts = Object.fromEntries(ORDER_STATUSES.map((status) => [status, 0]));
  const productSales = new Map();
  let revenue = 0;
  let soldItems = 0;

  orders.forEach((order) => {
    statusCounts[order.status] = (statusCounts[order.status] || 0) + 1;
    revenue += Number(order.summary?.total || 0);

    const items = Array.isArray(order.summary?.items) ? order.summary.items : [];
    items.forEach((item) => {
      soldItems += Number(item.qty || 0);
      const productId = Number(item.productId);
      const current = productSales.get(productId) || { productId, name: item.name, qty: 0, revenue: 0 };
      current.qty += Number(item.qty || 0);
      current.revenue += Number(item.lineSubtotal || 0);
      productSales.set(productId, current);
    });
  });

  return {
    revenue,
    soldItems,
    averageTicket: orders.length ? revenue / orders.length : 0,
    statusCounts,
    topProducts: [...productSales.values()].sort((a, b) => b.qty - a.qty).slice(0, 5),
  };
}

async function dashboard(_req, res, next) {
  try {
    const [users, products, lowStock, orders, reviews, favoriteUsers] = await Promise.all([
      User.count({ where: { role: "customer" } }),
      Product.count(),
      Product.count({ where: { stock: { [Op.lte]: 15 } } }),
      Order.findAll(),
      Review.count(),
      User.findAll({ attributes: ["favorites"] }),
    ]);

    const sales = calculateSalesMetrics(orders);
    const favorites = favoriteUsers.reduce((total, user) => total + (Array.isArray(user.favorites) ? user.favorites.length : 0), 0);

    return res.json({
      success: true,
      data: {
        users,
        products,
        lowStock,
        orders: orders.length,
        reviews,
        favorites,
        ...sales,
      },
    });
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
