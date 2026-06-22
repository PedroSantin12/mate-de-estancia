function formatPrice(value) {
  return Number(value).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

function formatCategory(category) {
  const categories = {
    ervas: "Erva-mate",
    cuias: "Cuias",
    bombas: "Bombas",
    termicas: "Térmicas",
    kits: "Kits",
  };

  return categories[category] || category;
}

function getProductRating(product) {
  const rating = 4.4 + (Number(product.id) % 6) / 10;
  const reviews = 18 + Number(product.id) * 3;
  return { rating: Math.min(rating, 5).toFixed(1), reviews };
}

function getProductBadges(product) {
  const badges = [];
  if (product.featured) badges.push("Mais vendido");
  if (Number(product.id) >= 46) badges.push("Novo");
  if (Number(product.stock) <= 12 || ["kits", "termicas"].includes(product.category)) badges.push("Oferta");
  return badges.length ? badges.slice(0, 2) : ["Feito para o mate"];
}

function renderRating(product) {
  const { rating, reviews } = getProductRating(product);
  return `<div class="product-rating" aria-label="Avaliação média ${rating} de 5"><span>★★★★★</span><strong>${rating}</strong><small>(${reviews})</small></div>`;
}

function renderFavoriteButton(product) {
  const active = typeof isFavorite === "function" && isFavorite(product.id);
  return `<button class="favorite-button ${active ? "active" : ""}" type="button" data-favorite-id="${product.id}" aria-label="Adicionar ${product.name} aos favoritos" aria-pressed="${active}">♥</button>`;
}

function renderProductCard(product) {
  const installmentPrice = formatPrice(Number(product.price) / 3);
  const badges = getProductBadges(product);

  return `
    <article class="product-card">
      <a class="product-card-image" href="/p/nome/${product.id}" aria-label="Abrir detalhes de ${product.name}">
        <img src="${product.image}" alt="${product.name}" loading="lazy">
        <div class="product-badges">${badges.map((badge) => `<span class="product-badge badge-${badge.toLowerCase().replace(/\s+/g, "-")}">${badge}</span>`).join("")}</div>
        ${renderFavoriteButton(product)}
      </a>
      <div class="product-card-content">
        <p class="product-category">${formatCategory(product.category)}</p>
        <h3><a href="/p/nome/${product.id}">${product.name}</a></h3>
        ${renderRating(product)}
        <p class="product-description">${product.description}</p>
        <div class="product-card-footer">
          <div>
            <div class="price">${formatPrice(product.price)}</div>
            <p class="installment">ou 3x de ${installmentPrice}</p>
          </div>
          <span class="stock-status">${product.stock > 0 ? "Em estoque" : "Indisponível"}</span>
        </div>
        <a class="button product-card-button" href="/p/nome/${product.id}">
          Ver produto <span aria-hidden="true">→</span>
        </a>
      </div>
    </article>
  `;
}

window.formatPrice = formatPrice;
window.formatCategory = formatCategory;
window.getProductRating = getProductRating;
window.getProductBadges = getProductBadges;
window.renderRating = renderRating;
window.renderFavoriteButton = renderFavoriteButton;
window.renderProductCard = renderProductCard;
