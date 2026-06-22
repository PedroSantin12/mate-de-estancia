document.addEventListener("DOMContentLoaded", loadFavoriteProducts);

async function loadFavoriteProducts() {
  const container = document.querySelector("#favorite-products");
  const user = getAuthUser();

  if (!user) {
    container.innerHTML = `<div class="status-message favorites-empty"><strong>Entre para ver seus favoritos.</strong><p>Seus produtos favoritos ficam salvos na sua conta, não apenas neste navegador.</p><a class="button button-brown" href="/login?next=/favoritos">Fazer login</a></div>`;
    return;
  }

  try {
    const ids = await loadUserFavorites();

    if (!ids.length) {
      container.innerHTML = `<div class="status-message favorites-empty"><strong>Nenhum favorito ainda.</strong><p>Use o coração nos produtos para montar sua lista de desejos.</p><a class="button button-brown" href="/busca">Ver catálogo</a></div>`;
      return;
    }

    const data = await apiRequest("/search?limit=50");
    const products = data.items.filter((product) => ids.includes(Number(product.id)));

    if (!products.length) {
      container.innerHTML = `<p class="status-message">Os produtos favoritos não estão mais disponíveis.</p>`;
      return;
    }

    container.innerHTML = products.map(renderProductCard).join("");
    bindFavoriteButtons(container);
  } catch (error) {
    container.innerHTML = `<p class="status-message error-message">${error.message}</p>`;
  }
}
