const express = require("express");
const {
  register,
  login,
  me,
  getUserCart,
  saveUserCart,
  getUserFavorites,
  saveUserFavorites,
  getUserOrders,
  getUserReviewableProducts,
} = require("../controllers/authController");
const { jwtAuth } = require("../middlewares/jwtAuth");

const router = express.Router();
router.post("/auth/register", register);
router.post("/auth/login", login);
router.get("/auth/me", jwtAuth, me);
router.get("/user/cart", jwtAuth, getUserCart);
router.put("/user/cart", jwtAuth, saveUserCart);
router.get("/user/favorites", jwtAuth, getUserFavorites);
router.put("/user/favorites", jwtAuth, saveUserFavorites);
router.get("/user/orders", jwtAuth, getUserOrders);
router.get("/user/reviewable-products", jwtAuth, getUserReviewableProducts);
module.exports = router;
