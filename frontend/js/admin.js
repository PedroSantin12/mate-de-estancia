let adminProducts = [];
let adminOrders = [];

const ORDER_STATUSES = ["Pedido confirmado", "Em preparo", "Enviado", "Entregue", "Cancelado"];

document.addEventListener("DOMContentLoaded", () => {
  document.querySelector("#logout-button").addEventListener("click", logout);
  document.querySelector("#admin-product-form").addEventListener("submit", saveProduct);
  document.querySelector("#cancel-product-edit").addEventListener("click", resetProductForm);
  document.querySelectorAll("[data-admin-tab]").forEach((button) => button.addEventListener("click", () => switchAdminTab(button.dataset.adminTab)));
  loadAdmin();
});

async function loadAdmin() {
  const user = getAuthUser();
  if (!user) return location.href = "/login?next=/admin";
  if (user.role !== "admin") return location.href = "/perfil";

  try {
    const [stats, products, users, orders] = await Promise.all([
      apiRequest("/admin-api/dashboard"),
      apiRequest("/search?limit=50"),
      apiRequest("/admin-api/users"),
      apiRequest("/admin-api/orders"),
    ]);

    adminProducts = products.items;
    adminOrders = orders;
    document.querySelector("#admin-stats").innerHTML = [["Produtos", stats.products], ["Clientes", stats.users], ["Estoque baixo", stats.lowStock]]
      .map(([label, value]) => `<article><strong>${value}</strong><span>${label}</span></article>`)
      .join("");
    renderProducts();
    renderOrders();
    document.querySelector("#admin-users").innerHTML = users.map((item) => `<tr><td>${item.name}</td><td>${item.email}</td><td>${item.role}</td></tr>`).join("");
  } catch (error) {
    document.querySelector("#admin-stats").innerHTML = `<p class="status-message error-message">${error.message}</p>`;
  }
}

function switchAdminTab(tab) {
  document.querySelector("#admin-catalog-panel").hidden = tab !== "catalog";
  document.querySelector("#admin-sales-panel").hidden = tab !== "sales";
  document.querySelectorAll("[data-admin-tab]").forEach((button) => button.classList.toggle("active", button.dataset.adminTab === tab));
}

function renderOrders() {
  const totalRevenue = adminOrders.reduce((total, order) => total + Number(order.summary.total), 0);
  const totalItems = adminOrders.reduce((total, order) => total + order.summary.items.reduce((sum, item) => sum + Number(item.qty), 0), 0);
  document.querySelector("#sales-tab-count").textContent = adminOrders.length;
  document.querySelector("#sales-stats").innerHTML = [["Pedidos", adminOrders.length], ["Produtos vendidos", totalItems], ["Faturamento", formatPrice(totalRevenue)]]
    .map(([label, value]) => `<article><strong>${value}</strong><span>${label}</span></article>`)
    .join("");

  const list = document.querySelector("#admin-sales-list");
  if (!adminOrders.length) {
    list.innerHTML = `<article class="checkout-card empty-orders"><strong>Nenhuma venda realizada ainda.</strong><p>Os pedidos finalizados pelos clientes aparecerão nesta aba.</p></article>`;
    return;
  }

  list.innerHTML = adminOrders.map((order) => {
    const address = order.delivery.address || {};
    const customer = order.customer || {};
    const items = order.summary.items.map((item) => `<li><span>${item.qty}x ${item.name}</span><strong>${formatPrice(item.lineSubtotal)}</strong></li>`).join("");
    const statusOptions = ORDER_STATUSES.map((status) => `<option value="${status}" ${status === order.status ? "selected" : ""}>${status}</option>`).join("");

    return `<details class="admin-sale-card">
      <summary><div><span class="order-number">${order.orderNumber}</span><small>${new Date(order.createdAt).toLocaleString("pt-BR")}</small></div><div><span class="order-status">${order.status}</span><strong>${formatPrice(order.summary.total)}</strong></div></summary>
      <div class="sale-details">
        <section><h3>Cliente</h3><p><strong>${customer.name || "Não informado"}</strong><br>${customer.email || "E-mail não informado"}<br>${customer.phone || "Telefone não registrado"}</p></section>
        <section><h3>Entrega</h3><p>${address.street || "Endereço não informado"}, ${address.number || "s/n"}<br>${address.neighborhood || ""} - ${address.city || ""}/${address.state || ""}<br>CEP ${order.delivery.cep || "não informado"}</p></section>
        <section><h3>Pagamento</h3><p>${formatPayment(order.paymentMethod)}<br>Frete: ${formatPrice(order.delivery.freight || 0)}</p></section>
        <section><h3>Status do pedido</h3><select class="select order-status-select" data-order-status="${order.id}">${statusOptions}</select><p class="status-save-feedback" id="order-feedback-${order.id}"></p></section>
        <section class="sale-items"><h3>Produtos vendidos</h3><ul>${items}</ul></section>
      </div>
    </details>`;
  }).join("");

  document.querySelectorAll("[data-order-status]").forEach((select) => select.addEventListener("change", updateOrderStatus));
}

async function updateOrderStatus(event) {
  const select = event.currentTarget;
  const feedback = document.querySelector(`#order-feedback-${select.dataset.orderStatus}`);
  feedback.textContent = "Salvando status...";

  try {
    const order = await apiRequest(`/admin-api/order/${select.dataset.orderStatus}/status`, {
      method: "PATCH",
      body: JSON.stringify({ status: select.value }),
    });
    const saved = adminOrders.find((item) => Number(item.id) === Number(order.id));
    if (saved) saved.status = order.status;
    renderOrders();
  } catch (error) {
    feedback.textContent = error.message;
  }
}

function formatPayment(method) {
  return { pix: "PIX", "credit-card": "Cartão de crédito", credit: "Cartão de crédito", boleto: "Boleto" }[method] || method;
}

function renderProducts() {
  document.querySelector("#admin-products").innerHTML = adminProducts.map((product) => `<tr><td>${product.name}</td><td>${formatCategory(product.category)}</td><td>${formatPrice(product.price)}</td><td>${product.stock}</td><td><div class="admin-row-actions"><button class="icon-button" data-edit-product="${product.id}">Editar</button><button class="icon-button danger-action" data-delete-product="${product.id}">Excluir</button></div></td></tr>`).join("");
  document.querySelectorAll("[data-edit-product]").forEach((button) => button.addEventListener("click", () => editProduct(button.dataset.editProduct)));
  document.querySelectorAll("[data-delete-product]").forEach((button) => button.addEventListener("click", () => deleteProduct(button)));
}

function editProduct(id) {
  const product = adminProducts.find((item) => Number(item.id) === Number(id));
  if (!product) return;
  const form = document.querySelector("#admin-product-form");
  ["id", "name", "slug", "description", "category", "price", "stock", "image"].forEach((field) => {
    form.elements[field].value = product[field];
  });
  document.querySelector("#admin-form-title").textContent = `Editando: ${product.name}`;
  document.querySelector("#admin-product-submit").textContent = "Salvar alterações";
  document.querySelector("#cancel-product-edit").hidden = false;
  document.querySelector("#product-form-section").scrollIntoView({ behavior: "smooth", block: "center" });
}

function resetProductForm() {
  const form = document.querySelector("#admin-product-form");
  form.reset();
  form.elements.id.value = "";
  document.querySelector("#admin-form-title").textContent = "Cadastrar produto";
  document.querySelector("#admin-product-submit").textContent = "Cadastrar produto";
  document.querySelector("#cancel-product-edit").hidden = true;
}

async function deleteProduct(button) {
  if (!confirm("Excluir este produto do catálogo?")) return;
  await apiRequest(`/admin-api/product/${button.dataset.deleteProduct}`, { method: "DELETE" });
  adminProducts = adminProducts.filter((product) => Number(product.id) !== Number(button.dataset.deleteProduct));
  renderProducts();
}

async function saveProduct(event) {
  event.preventDefault();
  const feedback = document.querySelector("#admin-product-feedback");
  const values = Object.fromEntries(new FormData(event.currentTarget));
  const id = values.id;
  delete values.id;
  feedback.textContent = id ? "Salvando alterações..." : "Cadastrando...";

  try {
    const product = await apiRequest(id ? `/admin-api/product/${id}` : "/admin-api/products", {
      method: id ? "PUT" : "POST",
      body: JSON.stringify({ ...values, attributes: {}, variants: [] }),
    });
    feedback.textContent = `${product.name} salvo com sucesso.`;
    resetProductForm();
    await loadAdmin();
  } catch (error) {
    feedback.textContent = error.message;
  }
}
