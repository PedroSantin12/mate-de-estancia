const AUTH_TOKEN_KEY = "mate-auth-token";
const AUTH_USER_KEY = "mate-auth-user";

function getAuthUser() {
  try { return JSON.parse(localStorage.getItem(AUTH_USER_KEY) || "null"); }
  catch (_error) { return null; }
}

function saveAuth(data) {
  localStorage.setItem(AUTH_TOKEN_KEY, data.token);
  localStorage.setItem(AUTH_USER_KEY, JSON.stringify(data.user));
}

function logout() {
  localStorage.removeItem("loja-gaucha-cart");
  localStorage.removeItem(AUTH_TOKEN_KEY);
  localStorage.removeItem(AUTH_USER_KEY);
  if (typeof clearCheckoutSession === "function") clearCheckoutSession();
  window.location.href = "/";
}

async function syncAuthenticatedCart(merge = false) {
  if (!getAuthUser() || typeof getCartItems !== "function") return;
  try {
    if (merge) {
      const remote = await apiRequest("/user/cart");
      const merged = [...remote];
      getCartItems().forEach((local) => {
        const existing = merged.find((item) => sameCartItem(item, local));
        if (existing) existing.qty = Math.max(Number(existing.qty), Number(local.qty));
        else merged.push(local);
      });
      localStorage.setItem(CART_KEY, JSON.stringify(merged));
      updateCartCount();
    }
    await apiRequest("/user/cart", { method: "PUT", body: JSON.stringify({ items: getCartItems() }) });
  } catch (_error) {
    // Mantém o carrinho local quando a sessão expirar ou a API estiver indisponível.
  }
}

function renderProfileLinks() {
  const user = getAuthUser();
  document.querySelectorAll("[data-profile-label]").forEach((element) => {
    element.textContent = user ? user.name.split(" ")[0] : "Perfil";
  });
  document.querySelectorAll(".profile-link").forEach((link) => {
    link.href = user ? (user.role === "admin" ? "/admin" : "/perfil") : "/login";
  });
}

window.getAuthUser = getAuthUser;
window.saveAuth = saveAuth;
window.logout = logout;
window.syncAuthenticatedCart = syncAuthenticatedCart;
document.addEventListener("DOMContentLoaded", renderProfileLinks);
