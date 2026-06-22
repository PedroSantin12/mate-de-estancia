const FAVORITES_KEY = "mate-favorites";

function getFavoriteIds() {
  try {
    const ids = JSON.parse(localStorage.getItem(FAVORITES_KEY) || "[]");
    return Array.isArray(ids) ? ids.map(Number).filter(Boolean) : [];
  } catch (_error) {
    return [];
  }
}

function isFavorite(productId) {
  return getFavoriteIds().includes(Number(productId));
}

function toggleFavorite(productId) {
  const id = Number(productId);
  const ids = getFavoriteIds();
  const nextIds = ids.includes(id) ? ids.filter((item) => item !== id) : [...ids, id];
  localStorage.setItem(FAVORITES_KEY, JSON.stringify(nextIds));
  refreshFavoriteButtons();
  return nextIds.includes(id);
}

function refreshFavoriteButtons() {
  document.querySelectorAll("[data-favorite-id]").forEach((button) => {
    const active = isFavorite(button.dataset.favoriteId);
    button.classList.toggle("active", active);
    button.setAttribute("aria-pressed", String(active));
    button.title = active ? "Remover dos favoritos" : "Adicionar aos favoritos";
  });
}

function bindFavoriteButtons(scope = document) {
  scope.querySelectorAll("[data-favorite-id]").forEach((button) => {
    button.addEventListener("click", (event) => {
      event.preventDefault();
      event.stopPropagation();
      toggleFavorite(button.dataset.favoriteId);
    });
  });
  refreshFavoriteButtons();
}

window.getFavoriteIds = getFavoriteIds;
window.isFavorite = isFavorite;
window.toggleFavorite = toggleFavorite;
window.bindFavoriteButtons = bindFavoriteButtons;
window.refreshFavoriteButtons = refreshFavoriteButtons;
