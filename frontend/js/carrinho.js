let couponCode = "";
let cartSummary = null;
let shippingQuote = null;

document.addEventListener("DOMContentLoaded", refreshCart);

document.querySelector("#coupon-form").addEventListener("submit", (event) => {
  event.preventDefault();
  couponCode = document.querySelector("#coupon").value.trim();
  sessionStorage.setItem("mate-coupon", couponCode);
  refreshCart();
});

document.querySelector("#shipping-form").addEventListener("submit", async (event) => {
  event.preventDefault();
  await calculateCartShipping();
});

async function refreshCart() {
  const items = getCartItems();
  const container = document.querySelector("#cart-items");

  if (!items.length) {
    container.innerHTML = '<p class="status-message">Seu carrinho está vazio.</p>';
    renderSummary({
      subtotal: 0,
      freight: 0,
      discount: 0,
      total: 0,
    });
    document.querySelector("#checkout-link").classList.add("disabled");
    return;
  }

  container.innerHTML = '<p class="status-message">Atualizando valores...</p>';

  try {
    const summary = await apiRequest("/cart", {
      method: "POST",
      body: JSON.stringify({
        items,
        cupomCode: couponCode,
      }),
    });

    cartSummary = summary;
    renderItems(summary.items);
    renderSummaryWithShipping();
    document.querySelector("#checkout-link").classList.remove("disabled");
  } catch (error) {
    container.innerHTML = `<p class="status-message error-message">${error.message}</p>`;
  }
}

async function calculateCartShipping() {
  const feedback = document.querySelector("#shipping-feedback");
  const cep = document.querySelector("#cart-cep").value;

  if (!cartSummary) return;

  feedback.textContent = "Consultando CEP...";

  try {
    shippingQuote = await apiRequest("/shipping", {
      method: "POST",
      body: JSON.stringify({ cep, subtotal: cartSummary.subtotal }),
    });
    sessionStorage.setItem("mate-cep", shippingQuote.cep);
    const destination = shippingQuote.address.city
      ? `${shippingQuote.address.city}/${shippingQuote.address.state}`
      : `região do CEP ${shippingQuote.cep}`;
    feedback.textContent = `${destination} · entrega em ${shippingQuote.deliveryDays.min} a ${shippingQuote.deliveryDays.max} dias úteis.`;
    renderSummaryWithShipping();
  } catch (error) {
    feedback.textContent = error.message;
  }
}

function renderSummaryWithShipping() {
  if (!cartSummary) return;

  const freight = shippingQuote ? shippingQuote.freight : cartSummary.freight;
  renderSummary({
    ...cartSummary,
    freight,
    total: cartSummary.subtotal + freight - cartSummary.discount,
  });
}

function renderItems(items) {
  document.querySelector("#cart-items").innerHTML = items
    .map(
      (item) => `
        <article class="cart-item">
          <img src="${item.image}" alt="${item.name}">
          <div>
            <h3>${item.name}</h3>
            <p>${item.variantLabel || "Produto sem variação"}</p>
            <strong>${formatPrice(item.price)}</strong>
          </div>
          <input
            class="qty-input"
            type="number"
            min="1"
            value="${item.qty}"
            aria-label="Quantidade de ${item.name}"
            data-qty-product="${item.productId}"
            data-qty-variant="${item.variantId || ""}"
          >
          <button
            class="icon-button"
            type="button"
            data-remove-product="${item.productId}"
            data-remove-variant="${item.variantId || ""}"
          >
            Remover
          </button>
        </article>
      `
    )
    .join("");

  document.querySelectorAll("[data-qty-product]").forEach((input) => {
    input.addEventListener("change", () => {
      const qty = Number(input.value);

      if (Number.isInteger(qty) && qty > 0) {
        updateCartItem(input.dataset.qtyProduct, input.dataset.qtyVariant, qty);
        shippingQuote = null;
        refreshCart();
      }
    });
  });

  document.querySelectorAll("[data-remove-product]").forEach((button) => {
    button.addEventListener("click", () => {
      removeCartItem(button.dataset.removeProduct, button.dataset.removeVariant);
      shippingQuote = null;
      refreshCart();
    });
  });
}

function renderSummary(summary) {
  document.querySelector("#subtotal").textContent = formatPrice(summary.subtotal);
  document.querySelector("#freight").textContent = formatPrice(summary.freight);
  document.querySelector("#discount").textContent = `- ${formatPrice(summary.discount)}`;
  document.querySelector("#total").textContent = formatPrice(summary.total);
}
