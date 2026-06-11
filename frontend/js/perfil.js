document.addEventListener("DOMContentLoaded", loadProfile);

async function loadProfile() {
  const user = getAuthUser();
  if (!user) return location.href = "/login?next=/perfil";

  document.querySelector("#profile-first-name").textContent = user.name.split(" ")[0];
  document.querySelector("#profile-name").textContent = user.name;
  document.querySelector("#profile-full-name").textContent = user.name;
  document.querySelector("#profile-email").textContent = user.email;
  document.querySelector("#account-avatar").textContent = user.name.charAt(0).toUpperCase();
  document.querySelector("#saved-cart-count").textContent = getCartItems().reduce((total, item) => total + Number(item.qty), 0);
  document.querySelector("#logout-button").addEventListener("click", logout);

  try {
    renderOrders(await apiRequest("/user/orders"));
  } catch (error) {
    document.querySelector("#order-history").innerHTML = `<p class="status-message error-message">${error.message}</p>`;
  }
}

function renderOrders(orders) {
  const container = document.querySelector("#order-history");
  if (!orders.length) {
    container.innerHTML = `<div class="empty-orders"><strong>Nenhuma compra realizada ainda.</strong><p>Quando voce finalizar um pedido, ele aparecera aqui.</p><a class="button button-brown" href="/busca">Conhecer produtos</a></div>`;
    return;
  }

  container.innerHTML = orders.map((order) => {
    const itemCount = order.summary.items.reduce((total, item) => total + Number(item.qty), 0);
    const date = new Date(order.createdAt).toLocaleDateString("pt-BR");
    return `<article class="order-row"><div><span class="order-number">${order.orderNumber}</span><small>${date} &middot; ${itemCount} item(ns)</small></div><span class="order-status">${order.status}</span><strong>${formatPrice(order.summary.total)}</strong></article>`;
  }).join("");
}
