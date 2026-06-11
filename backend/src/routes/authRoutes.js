const express = require("express");
const { register, login, me, getUserCart, saveUserCart, getUserOrders } = require("../controllers/authController");
const { jwtAuth } = require("../middlewares/jwtAuth");

const router = express.Router();
router.post("/auth/register", register);
router.post("/auth/login", login);
router.get("/auth/me", jwtAuth, me);
router.get("/user/cart", jwtAuth, getUserCart);
router.put("/user/cart", jwtAuth, saveUserCart);
router.get("/user/orders", jwtAuth, getUserOrders);
module.exports = router;
