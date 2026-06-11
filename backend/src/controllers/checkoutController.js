const AppError = require("../utils/AppError");
const { calculateCart } = require("../services/cartService");
const { calculateShipping } = require("../services/shippingService");
const Order = require("../models/Order");

function validateCustomer(customer = {}) {
  const required = ["name", "email", "phone"];

  for (const field of required) {
    if (!String(customer[field] || "").trim()) {
      throw new AppError(`O campo "${field}" é obrigatório.`, 400, "VALIDATION_ERROR");
    }
  }

  if (!String(customer.email).includes("@")) {
    throw new AppError("Informe um e-mail válido.", 400, "VALIDATION_ERROR");
  }
}

function validateAddress(address = {}) {
  for (const field of ["cep", "street", "number", "neighborhood", "city", "state"]) {
    if (!String(address[field] || "").trim()) {
      throw new AppError(`O campo de endereço "${field}" é obrigatório.`, 400, "VALIDATION_ERROR");
    }
  }
}

async function calculateShippingQuote(req, res, next) {
  try {
    const shipping = await calculateShipping(req.body.cep, req.body.subtotal);
    return res.status(200).json({ success: true, data: shipping });
  } catch (error) {
    return next(error);
  }
}

async function finishCheckout(req, res, next) {
  try {
    validateCustomer(req.body.customer);
    validateAddress(req.body.address);

    const baseCart = await calculateCart(req.body.items, req.body.couponCode);
    const shipping = await calculateShipping(req.body.address.cep, baseCart.subtotal);
    const cart = await calculateCart(req.body.items, req.body.couponCode, shipping.freight);
    const orderNumber = `ME${Date.now().toString().slice(-9)}`;
    const delivery = {
      ...shipping,
      address: {
        ...shipping.address,
        number: String(req.body.address.number).trim(),
        complement: String(req.body.address.complement || "").trim(),
      },
    };
    const paymentMethod = req.body.paymentMethod || "pix";

    await Order.create({
      userId: req.user.id,
      orderNumber,
      status: "Pedido confirmado",
      paymentMethod,
      customer: {
        name: String(req.body.customer.name).trim(),
        email: req.user.email,
        phone: String(req.body.customer.phone).trim(),
      },
      summary: cart,
      delivery,
    });

    return res.status(201).json({
      success: true,
      data: {
        orderNumber,
        status: "Pedido confirmado",
        customer: {
          id: req.user.id,
          name: String(req.body.customer.name).trim(),
          email: req.user.email,
        },
        delivery,
        paymentMethod,
        summary: cart,
        createdAt: new Date().toISOString(),
      },
    });
  } catch (error) {
    return next(error);
  }
}

module.exports = { calculateShippingQuote, finishCheckout };
