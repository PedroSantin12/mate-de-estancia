const express = require("express");
const { jwtAuth, requireAdmin } = require("../middlewares/jwtAuth");
const { dashboard, listUsers, listOrders, updateOrderStatus, removeProduct } = require("../controllers/adminController");
const { createProduct, updateProduct } = require("../controllers/productController");

const router = express.Router();
router.use("/admin-api", jwtAuth, requireAdmin);
router.get("/admin-api/dashboard", dashboard);
router.get("/admin-api/users", listUsers);
router.get("/admin-api/orders", listOrders);
router.patch("/admin-api/order/:id/status", updateOrderStatus);
router.post("/admin-api/products", createProduct);
router.put("/admin-api/product/:id", updateProduct);
router.delete("/admin-api/product/:id", removeProduct);
module.exports = router;
