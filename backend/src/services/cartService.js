const Product = require("../models/Product");
const AppError = require("../utils/AppError");

function toMoney(value) {
  return Number(Number(value).toFixed(2));
}

function findVariant(product, variantId) {
  const variants = Array.isArray(product.variants) ? product.variants : [];

  if (!variants.length) {
    return null;
  }

  if (!variantId) {
    return variants[0];
  }

  const selectedVariant = variants.find((variant) => String(variant.id) === String(variantId));

  if (!selectedVariant) {
    throw new AppError(
      `Selecione uma variação válida para o produto "${product.name}".`,
      400,
      "INVALID_VARIANT"
    );
  }

  return selectedVariant;
}

async function calculateCart(items, couponCode, freightOverride) {
  if (!Array.isArray(items)) {
    throw new AppError('O campo "items" deve ser uma lista.', 400, "VALIDATION_ERROR");
  }

  const calculatedItems = [];

  for (const item of items) {
    const productId = Number(item.productId);
    const qty = Number(item.qty);

    if (!Number.isInteger(productId) || productId < 1) {
      throw new AppError("productId inválido.", 400, "VALIDATION_ERROR");
    }

    if (!Number.isInteger(qty) || qty < 1) {
      throw new AppError("A quantidade deve ser um número inteiro maior que zero.", 400, "VALIDATION_ERROR");
    }

    const product = await Product.findByPk(productId);

    if (!product) {
      throw new AppError(`Produto não encontrado: ${productId}.`, 404, "PRODUCT_NOT_FOUND");
    }

    const variants = Array.isArray(product.variants) ? product.variants : [];
    const variant = variants.length ? findVariant(product, item.variantId) : null;
    const unitPrice = Number(variant ? variant.price : product.price);
    const lineSubtotal = toMoney(unitPrice * qty);

    calculatedItems.push({
      productId: product.id,
      name: product.name,
      image: product.image,
      qty,
      price: toMoney(unitPrice),
      lineSubtotal,
      variantId: variant ? variant.id : null,
      variantLabel: variant ? variant.label : null,
    });
  }

  const subtotal = toMoney(
    calculatedItems.reduce((accumulator, item) => accumulator + item.lineSubtotal, 0)
  );
  const freight = freightOverride === undefined
    ? subtotal >= 200 || subtotal === 0 ? 0 : 25
    : toMoney(freightOverride);
  const normalizedCoupon = String(couponCode || "").trim().toUpperCase();
  const discount = normalizedCoupon === "URI10" ? toMoney(subtotal * 0.1) : 0;
  const total = toMoney(subtotal + freight - discount);

  return {
    items: calculatedItems,
    subtotal,
    freight,
    discount,
    total,
    couponCode: normalizedCoupon || null,
  };
}

module.exports = { calculateCart };
