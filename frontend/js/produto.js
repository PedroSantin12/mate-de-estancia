let product = null;
let selectedVariantId = null;

document.addEventListener("DOMContentLoaded", loadProduct);

async function loadProduct() {
  const productId = window.location.pathname.split("/").pop();
  const container = document.querySelector("#product-detail");

  try {
    product = await apiRequest(`/product/${productId}`);
    renderProduct();
  } catch (error) {
    container.innerHTML = `<p class="status-message error-message">${error.message}</p>`;
  }
}

function renderProduct() {
  const variants = Array.isArray(product.variants) ? product.variants : [];
  const badges = getProductBadges(product);

  if (variants.length) {
    selectedVariantId = variants[0].id;
  }

  document.querySelector("#product-detail").innerHTML = `
    <div>
      <img src="${product.image}" alt="${product.name}">
    </div>
    <div class="product-detail-info">
      <p class="product-category">${product.category}</p>
      <h1>${product.name}</h1>
      <div class="detail-badges">${badges.map((badge) => `<span class="product-badge badge-${badge.toLowerCase().replace(/\s+/g, "-")}">${badge}</span>`).join("")}</div>
      ${renderRating(product)}
      <div class="price" id="product-price">${formatPrice(getSelectedPrice())}</div>
      <p>${product.description}</p>

      <h2>Características</h2>
      <ul class="attributes">
        ${Object.entries(product.attributes || {})
          .map(([key, value]) => `<li><strong>${key}:</strong> ${value}</li>`)
          .join("")}
      </ul>

      ${
        variants.length
          ? `
            <h2>Escolha o tamanho do pacote</h2>
            <div class="variants">
              ${variants
                .map(
                  (variant, index) => `
                    <button
                      class="variant-button ${index === 0 ? "active" : ""}"
                      type="button"
                      data-variant-id="${variant.id}"
                    >
                      ${variant.label}
                    </button>
                  `
                )
                .join("")}
            </div>
          `
          : ""
      }

      <div class="buy-row">
        <label>
          Quantidade
          <input class="qty-input" id="qty" type="number" min="1" value="1">
        </label>
        <button class="button button-brown" id="add-to-cart" type="button">
          Adicionar ao carrinho
        </button>
        ${renderFavoriteButton(product)}
      </div>
      <p id="feedback" aria-live="polite"></p>
    </div>
  `;

  document.querySelectorAll("[data-variant-id]").forEach((button) => {
    button.addEventListener("click", () => {
      selectedVariantId = button.dataset.variantId;

      document.querySelectorAll("[data-variant-id]").forEach((currentButton) => {
        currentButton.classList.toggle("active", currentButton === button);
      });

      document.querySelector("#product-price").textContent = formatPrice(getSelectedPrice());
    });
  });

  document.querySelector("#add-to-cart").addEventListener("click", addCurrentProductToCart);
  bindFavoriteButtons(document.querySelector("#product-detail"));
}

function getSelectedPrice() {
  const variants = Array.isArray(product.variants) ? product.variants : [];

  if (!variants.length) return Number(product.price);

  const variant = variants.find((item) => String(item.id) === String(selectedVariantId));
  return Number(variant.price);
}

function addCurrentProductToCart() {
  const qty = Number(document.querySelector("#qty").value);

  if (!Number.isInteger(qty) || qty < 1) {
    document.querySelector("#feedback").textContent = "Informe uma quantidade válida.";
    return;
  }

  addCartItem({
    productId: product.id,
    qty,
    variantId: selectedVariantId,
  });

  document.querySelector("#feedback").textContent = "Produto adicionado ao carrinho.";
}
