let product = null;
let productReviews = [];
let selectedVariantId = null;

document.addEventListener("DOMContentLoaded", loadProduct);

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

async function loadProduct() {
  const productId = window.location.pathname.split("/").pop();
  const container = document.querySelector("#product-detail");

  try {
    product = await apiRequest(`/product/${productId}`);
    const reviewData = await apiRequest(`/product/${productId}/reviews`);
    productReviews = reviewData.items || [];
    product.reviewSummary = reviewData.summary || product.reviewSummary;
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
      <img src="${product.image}" alt="${escapeHtml(product.name)}">
    </div>
    <div class="product-detail-info">
      <p class="product-category">${formatCategory(product.category)}</p>
      <h1>${escapeHtml(product.name)}</h1>
      <div class="detail-badges">${badges.map((badge) => `<span class="product-badge badge-${badge.toLowerCase().replace(/\s+/g, "-")}">${badge}</span>`).join("")}</div>
      ${renderRating(product)}
      <div class="price" id="product-price">${formatPrice(getSelectedPrice())}</div>
      <p>${escapeHtml(product.description)}</p>

      <h2>Características</h2>
      <ul class="attributes">
        ${Object.entries(product.attributes || {})
          .map(([key, value]) => `<li><strong>${escapeHtml(key)}:</strong> ${escapeHtml(value)}</li>`)
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
                      ${escapeHtml(variant.label)}
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
    <section class="product-review-panel" id="reviews-panel">
      ${renderReviewsPanel()}
    </section>
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
  document.querySelector("#review-form")?.addEventListener("submit", saveReview);
  bindFavoriteButtons(document.querySelector("#product-detail"));
}

function renderReviewsPanel() {
  const user = getAuthUser();
  const { rating, reviews } = getProductRating(product);
  const summary = reviews
    ? `<p class="review-summary"><strong>${rating}</strong> de 5 com ${reviews} avaliação${reviews === 1 ? "" : "es"}.</p>`
    : `<p class="review-summary">Este produto ainda não recebeu avaliações. Seja o primeiro a comentar.</p>`;

  return `
    <div class="review-header">
      <p class="eyebrow">Avaliações</p>
      <h2>Opinião dos clientes</h2>
      ${summary}
    </div>
    ${user ? renderReviewForm() : `<p class="status-message">Faça login para avaliar este produto. <a href="/login">Entrar ou criar conta</a></p>`}
    <div class="review-list">
      ${productReviews.length ? productReviews.map(renderReviewItem).join("") : `<p class="status-message">Nenhum comentário publicado ainda.</p>`}
    </div>
  `;
}

function renderReviewForm() {
  return `
    <form class="review-form" id="review-form">
      <label>
        Nota
        <select class="select" name="rating" required>
          <option value="5">5 estrelas</option>
          <option value="4">4 estrelas</option>
          <option value="3">3 estrelas</option>
          <option value="2">2 estrelas</option>
          <option value="1">1 estrela</option>
        </select>
      </label>
      <label>
        Comentário
        <textarea class="field" name="comment" rows="4" maxlength="500" required placeholder="Conte como foi sua experiência com este produto"></textarea>
      </label>
      <button class="button button-brown" type="submit">Publicar avaliação</button>
      <p id="review-feedback" aria-live="polite"></p>
    </form>
  `;
}

function renderReviewItem(review) {
  return `
    <article class="review-item">
      <div>
        <strong>${escapeHtml(review.customerName)}</strong>
        <span>${new Date(review.updatedAt || review.createdAt).toLocaleDateString("pt-BR")}</span>
      </div>
      <div class="product-rating"><span>${renderStars(review.rating)}</span><strong>${review.rating}.0</strong></div>
      <p>${escapeHtml(review.comment)}</p>
    </article>
  `;
}

async function saveReview(event) {
  event.preventDefault();
  const form = event.currentTarget;
  const feedback = document.querySelector("#review-feedback");
  const body = {
    rating: Number(form.rating.value),
    comment: form.comment.value,
  };

  try {
    feedback.textContent = "Salvando avaliação...";
    await apiRequest(`/product/${product.id}/reviews`, {
      method: "POST",
      body: JSON.stringify(body),
    });
    const reviewData = await apiRequest(`/product/${product.id}/reviews`);
    productReviews = reviewData.items || [];
    product.reviewSummary = reviewData.summary || { average: 0, count: 0 };
    renderProduct();
    document.querySelector("#reviews-panel").scrollIntoView({ behavior: "smooth", block: "start" });
  } catch (error) {
    feedback.textContent = error.message;
  }
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
