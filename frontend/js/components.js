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

function renderProductCard(product) {
  const installmentPrice = formatPrice(Number(product.price) / 3);

  return `
    <article class="product-card">
      <a class="product-card-image" href="/p/nome/${product.id}" aria-label="Abrir detalhes de ${product.name}">
        <img src="${product.image}" alt="${product.name}" loading="lazy">
        <span class="product-badge">${product.featured ? "Destaque" : "Feito para o mate"}</span>
      </a>
      <div class="product-card-content">
        <p class="product-category">${formatCategory(product.category)}</p>
        <h3><a href="/p/nome/${product.id}">${product.name}</a></h3>
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
window.renderProductCard = renderProductCard;
