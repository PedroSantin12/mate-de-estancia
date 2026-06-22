const express = require("express");
const { calculateShippingQuote, finishCheckout, trackOrder } = require("../controllers/checkoutController");
const { jwtAuth } = require("../middlewares/jwtAuth");

const router = express.Router();

router.post("/shipping", calculateShippingQuote);
router.post("/checkout", jwtAuth, finishCheckout);
router.post("/order-tracking", trackOrder);

module.exports = router;
