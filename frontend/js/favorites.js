let favoriteIdsCache = [];
let favoritesLoaded = false;

function getFavoriteIds() {
  return favoriteIdsCache;
}

function isFavorite(productId) {
  return favoriteIdsCache.includes(Number(productId));
}

function showFavoriteLoginMessage() {
  const existing = document.querySelector(".favorite-login-message");
  if (existing) existing.remove();

  const message = document.createElement("div");
  message.className = "favorite-login-message";
  message.innerHTML = `Faça login para salvar favoritos na sua conta. <a href="/login">Entrar</a>`;
  document.body.appendChild(message);
  setTimeout(() => message.remove(), 4200);
}

async function loadUserFavorites() {
  const user = getAuthUser();
  if (!user) {
    favoriteIdsCache = [];
    favoritesLoaded = true;
    refreshFavoriteButtons();
    return favoriteIdsCache;
  }

  try {
    favoriteIdsCache = await apiRequest("/user/favorites");
  } catch (_error) {
    favoriteIdsCache = [];
  }

  favoritesLoaded = true;
  refreshFavoriteButtons();
  return favoriteIdsCache;
}

async function saveUserFavorites() {
  if (!getAuthUser()) return favoriteIdsCache;
  favoriteIdsCache = await apiRequest("/user/favorites", {
    method: "PUT",
    body: JSON.stringify({ items: favoriteIdsCache }),
  });
  return favoriteIdsCache;
}

async function toggleFavorite(productId) {
  if (!getAuthUser()) {
    showFavoriteLoginMessage();
    return false;
  }

  if (!favoritesLoaded) await loadUserFavorites();

  const id = Number(productId);
  favoriteIdsCache = favoriteIdsCache.includes(id)
    ? favoriteIdsCache.filter((item) => item !== id)
    : [...favoriteIdsCache, id];

  refreshFavoriteButtons();

  try {
    await saveUserFavorites();
  } catch (error) {
    showFavoriteLoginMessage();
  }

  refreshFavoriteButtons();
  return favoriteIdsCache.includes(id);
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
    button.addEventListener("click", async (event) => {
      event.preventDefault();
      event.stopPropagation();
      await toggleFavorite(button.dataset.favoriteId);
    });
  });
  refreshFavoriteButtons();
}

window.getFavoriteIds = getFavoriteIds;
window.isFavorite = isFavorite;
window.loadUserFavorites = loadUserFavorites;
window.toggleFavorite = toggleFavorite;
window.bindFavoriteButtons = bindFavoriteButtons;
window.refreshFavoriteButtons = refreshFavoriteButtons;
document.addEventListener("DOMContentLoaded", loadUserFavorites);
