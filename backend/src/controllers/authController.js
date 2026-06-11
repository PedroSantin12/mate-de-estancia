const User = require("../models/User");
const Order = require("../models/Order");
const AppError = require("../utils/AppError");
const { hashPassword, verifyPassword, signToken } = require("../services/authService");

function publicUser(user) {
  return { id: user.id, name: user.name, email: user.email, role: user.role };
}

async function register(req, res, next) {
  try {
    const name = String(req.body.name || "").trim();
    const email = String(req.body.email || "").trim().toLowerCase();
    const password = String(req.body.password || "");
    if (name.length < 3) throw new AppError("Informe seu nome completo.", 400, "VALIDATION_ERROR");
    if (!email.includes("@")) throw new AppError("Informe um e-mail válido.", 400, "VALIDATION_ERROR");
    if (password.length < 6) throw new AppError("A senha deve possuir pelo menos 6 caracteres.", 400, "VALIDATION_ERROR");
    const user = await User.create({ name, email, passwordHash: await hashPassword(password) });
    return res.status(201).json({ success: true, data: { token: signToken(user), user: publicUser(user) } });
  } catch (error) {
    if (error.name === "SequelizeUniqueConstraintError") return next(new AppError("Este e-mail já está cadastrado.", 409, "EMAIL_EXISTS"));
    return next(error);
  }
}

async function login(req, res, next) {
  try {
    const email = String(req.body.email || "").trim().toLowerCase();
    const user = await User.findOne({ where: { email } });
    if (!user || !(await verifyPassword(req.body.password, user.passwordHash))) throw new AppError("E-mail ou senha inválidos.", 401, "INVALID_CREDENTIALS");
    return res.json({ success: true, data: { token: signToken(user), user: publicUser(user) } });
  } catch (error) { return next(error); }
}

function me(req, res) {
  return res.json({ success: true, data: publicUser(req.user) });
}

async function getUserCart(req, res) {
  return res.json({ success: true, data: Array.isArray(req.user.cart) ? req.user.cart : [] });
}

async function saveUserCart(req, res, next) {
  try {
    if (!Array.isArray(req.body.items)) throw new AppError("Carrinho inválido.", 400, "VALIDATION_ERROR");
    req.user.cart = req.body.items;
    await req.user.save();
    return res.json({ success: true, data: req.user.cart });
  } catch (error) { return next(error); }
}

async function getUserOrders(req, res, next) {
  try {
    const orders = await Order.findAll({
      where: { userId: req.user.id },
      order: [["createdAt", "DESC"]],
    });
    return res.json({ success: true, data: orders });
  } catch (error) { return next(error); }
}

module.exports = { register, login, me, getUserCart, saveUserCart, getUserOrders, publicUser };
