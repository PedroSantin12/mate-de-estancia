let adminProducts = [];
let adminOrders = [];
let adminReviews = [];
let adminStats = null;

const ORDER_STATUSES = ["Pedido confirmado", "Em preparo", "Enviado", "Entregue", "Cancelado"];

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function readJsonField(form, field, fallback) {
  const value = String(form.elements[field].value || "").trim();
  if (!value) return fallback;
  return JSON.parse(value);
}

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
    const [stats, products, users, orders, reviews] = await Promise.all([
      apiRequest("/admin-api/dashboard"),
      apiRequest("/search?limit=50"),
      apiRequest("/admin-api/users"),
      apiRequest("/admin-api/orders"),
      apiRequest("/admin-api/reviews"),
    ]);

    adminStats = stats;
    adminProducts = products.items;
    adminOrders = orders;
    adminReviews = reviews;

    renderDashboard();
    renderProducts();
    renderStock();
    renderOrders();
    renderReviews();
    document.querySelector("#admin-users").innerHTML = users.map((item) => `<tr><td>${escapeHtml(item.name)}</td><td>${escapeHtml(item.email)}</td><td>${escapeHtml(item.role)}</td></tr>`).join("");
  } catch (error) {
    document.querySelector("#admin-stats").innerHTML = `<p class="status-message error-message">${error.message}</p>`;
  }
}

function switchAdminTab(tab) {
  ["dashboard", "catalog", "stock", "sales", "reviews"].forEach((name) => {
    document.querySelector(`#admin-${name}-panel`).hidden = tab !== name;
  });
  document.querySelectorAll("[data-admin-tab]").forEach((button) => button.classList.toggle("active", button.dataset.adminTab === tab));
}

function renderDashboard() {
  const lowStockCount = adminProducts.filter((product) => Number(product.stock) <= 15).length;
  document.querySelector("#stock-tab-count").textContent = lowStockCount;
  document.querySelector("#admin-stats").innerHTML = [
    ["Faturamento", formatPrice(adminStats.revenue || 0)],
    ["Pedidos", adminStats.orders || 0],
    ["Ticket médio", formatPrice(adminStats.averageTicket || 0)],
    ["Produtos", adminStats.products || 0],
    ["Clientes", adminStats.users || 0],
    ["Favoritos salvos", adminStats.favorites || 0],
    ["Avaliações", adminStats.reviews || 0],
    ["Estoque baixo", adminStats.lowStock || 0],
  ]
    .map(([label, value]) => `<article><strong>${value}</strong><span>${label}</span></article>`)
    .join("");

  renderBarChart("#status-chart", Object.entries(adminStats.statusCounts || {}).map(([label, value]) => ({ label, value })));
  renderBarChart("#top-products-chart", (adminStats.topProducts || []).map((item) => ({ label: item.name, value: item.qty })), "Nenhum produto vendido ainda.");
}

function renderBarChart(selector, rows, emptyMessage = "Nenhum dado disponível ainda.") {
  const container = document.querySelector(selector);
  const filtered = rows.filter((row) => Number(row.value) > 0);
  if (!filtered.length) {
    container.innerHTML = `<p class="status-message">${emptyMessage}</p>`;
    return;
  }

  const max = Math.max(...filtered.map((row) => Number(row.value)));
  container.innerHTML = filtered.map((row) => {
    const percent = Math.max(8, (Number(row.value) / max) * 100);
    return `<div class="chart-row"><span>${escapeHtml(row.label)}</span><div><i style="width:${percent}%"></i></div><strong>${row.value}</strong></div>`;
  }).join("");
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
    const items = order.summary.items.map((item) => `<li><span>${item.qty}x ${escapeHtml(item.name)}</span><strong>${formatPrice(item.lineSubtotal)}</strong></li>`).join("");
    const statusOptions = ORDER_STATUSES.map((status) => `<option value="${status}" ${status === order.status ? "selected" : ""}>${status}</option>`).join("");

    return `<details class="admin-sale-card">
      <summary><div><span class="order-number">${order.orderNumber}</span><small>${new Date(order.createdAt).toLocaleString("pt-BR")}</small></div><div><span class="order-status">${order.status}</span><strong>${formatPrice(order.summary.total)}</strong></div></summary>
      <div class="sale-details">
        <section><h3>Cliente</h3><p><strong>${escapeHtml(customer.name || "Não informado")}</strong><br>${escapeHtml(customer.email || "E-mail não informado")}<br>${escapeHtml(customer.phone || "Telefone não registrado")}</p></section>
        <section><h3>Entrega</h3><p>${escapeHtml(address.street || "Endereço não informado")}, ${escapeHtml(address.number || "s/n")}<br>${escapeHtml(address.neighborhood || "")} - ${escapeHtml(address.city || "")}/${escapeHtml(address.state || "")}<br>CEP ${escapeHtml(order.delivery.cep || "não informado")}</p></section>
        <section><h3>Pagamento</h3><p>${formatPayment(order.paymentMethod)}<br>Frete: ${formatPrice(order.delivery.freight || 0)}</p></section>
        <section><h3>Status do pedido</h3><select class="select order-status-select" data-order-status="${order.id}">${statusOptions}</select><p class="status-save-feedback" id="order-feedback-${order.id}"></p></section>
        <section class="sale-items"><h3>Produtos vendidos</h3><ul>${items}</ul></section>
      </div>
    </details>`;
  }).join("");

  document.querySelectorAll("[data-order-status]").forEach((select) => select.addEventListener("change", updateOrderStatus));
}

function renderReviews() {
  document.querySelector("#reviews-tab-count").textContent = adminReviews.length;
  const list = document.querySelector("#admin-reviews-list");

  if (!adminReviews.length) {
    list.innerHTML = `<article class="checkout-card empty-orders"><strong>Nenhuma avaliação publicada ainda.</strong><p>As avaliações reais dos clientes aparecerão aqui.</p></article>`;
    return;
  }

  list.innerHTML = adminReviews.map((review) => `
    <article class="admin-review-card">
      <div>
        <strong>${escapeHtml(review.productName)}</strong>
        <span>${renderStars(review.rating)} ${Number(review.rating).toFixed(1)}</span>
      </div>
      <p>${escapeHtml(review.comment)}</p>
      <small>${escapeHtml(review.customerName)} · ${escapeHtml(review.customerEmail)} · ${new Date(review.createdAt).toLocaleString("pt-BR")}</small>
      <button class="icon-button danger-action" type="button" data-delete-review="${review.id}">Excluir avaliação</button>
    </article>
  `).join("");

  document.querySelectorAll("[data-delete-review]").forEach((button) => button.addEventListener("click", () => deleteReview(button)));
}

function renderStock() {
  const list = document.querySelector("#admin-stock-list");
  const sorted = [...adminProducts].sort((a, b) => Number(a.stock) - Number(b.stock));
  list.innerHTML = sorted.map((product) => {
    const low = Number(product.stock) <= 15;
    return `<article class="admin-stock-card ${low ? "stock-low" : ""}">
      <div><strong>${escapeHtml(product.name)}</strong><span>${formatCategory(product.category)}</span></div>
      <strong>${product.stock} un.</strong>
      <button class="icon-button" type="button" data-edit-product="${product.id}">Editar estoque</button>
    </article>`;
  }).join("");
  list.querySelectorAll("[data-edit-product]").forEach((button) => button.addEventListener("click", () => editProduct(button.dataset.editProduct)));
}

async function deleteReview(button) {
  if (!confirm("Excluir esta avaliação? Use apenas quando houver conteúdo inadequado ou erro evidente.")) return;
  await apiRequest(`/admin-api/review/${button.dataset.deleteReview}`, { method: "DELETE" });
  adminReviews = adminReviews.filter((review) => Number(review.id) !== Number(button.dataset.deleteReview));
  renderReviews();
  renderDashboard();
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
  document.querySelector("#admin-products").innerHTML = adminProducts.map((product) => `<tr><td>${escapeHtml(product.name)}</td><td>${formatCategory(product.category)}</td><td>${formatPrice(product.price)}</td><td>${product.stock}</td><td>${product.featured ? "Sim" : "Não"}</td><td><div class="admin-row-actions"><button class="icon-button" data-edit-product="${product.id}">Editar</button><button class="icon-button danger-action" data-delete-product="${product.id}">Excluir</button></div></td></tr>`).join("");
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
  form.elements.featured.checked = Boolean(product.featured);
  form.elements.attributes.value = JSON.stringify(product.attributes || {}, null, 2);
  form.elements.variants.value = JSON.stringify(product.variants || [], null, 2);
  document.querySelector("#admin-form-title").textContent = `Editando: ${product.name}`;
  document.querySelector("#admin-product-submit").textContent = "Salvar alterações";
  document.querySelector("#cancel-product-edit").hidden = false;
  switchAdminTab("catalog");
  document.querySelector("#product-form-section").scrollIntoView({ behavior: "smooth", block: "center" });
}

function resetProductForm() {
  const form = document.querySelector("#admin-product-form");
  form.reset();
  form.elements.id.value = "";
  form.elements.attributes.value = "";
  form.elements.variants.value = "";
  document.querySelector("#admin-form-title").textContent = "Cadastrar produto";
  document.querySelector("#admin-product-submit").textContent = "Cadastrar produto";
  document.querySelector("#cancel-product-edit").hidden = true;
}

async function deleteProduct(button) {
  if (!confirm("Excluir este produto do catálogo?")) return;
  await apiRequest(`/admin-api/product/${button.dataset.deleteProduct}`, { method: "DELETE" });
  adminProducts = adminProducts.filter((product) => Number(product.id) !== Number(button.dataset.deleteProduct));
  renderProducts();
  renderStock();
  renderDashboard();
}

async function saveProduct(event) {
  event.preventDefault();
  const feedback = document.querySelector("#admin-product-feedback");
  const form = event.currentTarget;
  const values = Object.fromEntries(new FormData(form));
  const id = values.id;
  delete values.id;
  feedback.textContent = id ? "Salvando alterações..." : "Cadastrando...";

  try {
    const payload = {
      ...values,
      featured: form.elements.featured.checked,
      attributes: readJsonField(form, "attributes", {}),
      variants: readJsonField(form, "variants", []),
    };
    const product = await apiRequest(id ? `/admin-api/product/${id}` : "/admin-api/products", {
      method: id ? "PUT" : "POST",
      body: JSON.stringify(payload),
    });
    feedback.textContent = `${product.name} salvo com sucesso.`;
    resetProductForm();
    await loadAdmin();
  } catch (error) {
    feedback.textContent = error.message.includes("JSON")
      ? "Confira os campos de atributos e variações: eles precisam estar em JSON válido."
      : error.message;
  }
}
