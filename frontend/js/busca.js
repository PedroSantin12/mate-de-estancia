document.addEventListener("DOMContentLoaded", () => {
  const params = new URLSearchParams(window.location.search);
  const query = params.get("query") || "";
  const category = params.get("cat") || "";

  document.querySelector("#query").value = query;
  document.querySelector("#category").value = category;

  loadProducts();
});

document.querySelector("#filter-form").addEventListener("submit", (event) => {
  event.preventDefault();

  const query = document.querySelector("#query").value.trim();
  const category = document.querySelector("#category").value;
  const params = new URLSearchParams();

  if (query) params.set("query", query);
  if (category) params.set("cat", category);

  window.location.href = `/busca?${params.toString()}`;
});

async function loadProducts() {
  const params = new URLSearchParams(window.location.search);
  params.set("page", params.get("page") || "1");
  params.set("limit", params.get("limit") || "50");

  const container = document.querySelector("#products");
  const summary = document.querySelector("#search-summary");

  container.innerHTML = '<p class="status-message">Carregando produtos...</p>';

  try {
    const data = await apiRequest(`/search?${params.toString()}`);

    summary.textContent = `${data.pagination.totalItems} produto(s) encontrado(s).`;

    if (!data.items.length) {
      container.innerHTML = '<p class="status-message">Nenhum produto encontrado.</p>';
      return;
    }

    container.innerHTML = data.items.map(renderProductCard).join("");
  } catch (error) {
    container.innerHTML = `<p class="status-message error-message">${error.message}</p>`;
  }
}
