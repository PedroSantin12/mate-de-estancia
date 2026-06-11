document.addEventListener("DOMContentLoaded", loadFeaturedProducts);

async function loadFeaturedProducts() {
  const container = document.querySelector("#featured-products");

  try {
    const data = await apiRequest("/search?page=1&limit=4");
    container.innerHTML = data.items.map(renderProductCard).join("");
  } catch (error) {
    container.innerHTML = `<p class="status-message error-message">${error.message}</p>`;
  }
}
