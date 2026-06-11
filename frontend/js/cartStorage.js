const CART_KEY = "loja-gaucha-cart";

function clearCheckoutSession() {
  sessionStorage.removeItem("mate-cep");
  sessionStorage.removeItem("mate-coupon");
}

function getCartItems() {
  try {
    const items = JSON.parse(localStorage.getItem(CART_KEY) || "[]");
    return Array.isArray(items) ? items : [];
  } catch (_error) {
    return [];
  }
}

function saveCartItems(items) {
  localStorage.setItem(CART_KEY, JSON.stringify(items));

  if (!items.length) {
    clearCheckoutSession();
  }

  updateCartCount();

  if (typeof syncAuthenticatedCart === "function") {
    syncAuthenticatedCart();
  }
}

function sameCartItem(a, b) {
  return Number(a.productId) === Number(b.productId) &&
    String(a.variantId || "") === String(b.variantId || "");
}

function addCartItem(item) {
  const items = getCartItems();

  if (!items.length) {
    clearCheckoutSession();
  }

  const existingItem = items.find((savedItem) => sameCartItem(savedItem, item));

  if (existingItem) {
    existingItem.qty += item.qty;
  } else {
    items.push(item);
  }

  saveCartItems(items);
}

function removeCartItem(productId, variantId) {
  const items = getCartItems().filter(
    (item) =>
      !sameCartItem(item, {
        productId,
        variantId,
      })
  );

  saveCartItems(items);
}

function updateCartItem(productId, variantId, qty) {
  const items = getCartItems();
  const item = items.find((savedItem) =>
    sameCartItem(savedItem, {
      productId,
      variantId,
    })
  );

  if (item) {
    item.qty = qty;
    saveCartItems(items);
  }
}

function updateCartCount() {
  const count = getCartItems().reduce((total, item) => total + Number(item.qty), 0);

  document.querySelectorAll("[data-cart-count]").forEach((element) => {
    element.textContent = count;
  });
}

window.getCartItems = getCartItems;
window.saveCartItems = saveCartItems;
window.addCartItem = addCartItem;
window.removeCartItem = removeCartItem;
window.updateCartItem = updateCartItem;
window.updateCartCount = updateCartCount;
window.clearCheckoutSession = clearCheckoutSession;

document.addEventListener("DOMContentLoaded", updateCartCount);
