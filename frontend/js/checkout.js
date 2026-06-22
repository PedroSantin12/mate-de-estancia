let checkoutSummary = null;
let checkoutShipping = null;

document.addEventListener("DOMContentLoaded", initializeCheckout);
document.querySelector("#lookup-cep").addEventListener("click", lookupCep);
document.querySelector("#checkout-form").addEventListener("submit", finishOrder);

async function initializeCheckout() {
  const user = getAuthUser();
  if (!user) {
    window.location.href = "/login?next=/checkout";
    return;
  }

  const items = getCartItems();

  if (!items.length) {
    window.location.href = "/carrinho";
    return;
  }

  try {
    checkoutSummary = await apiRequest("/cart", {
      method: "POST",
      body: JSON.stringify({
        items,
        couponCode: sessionStorage.getItem("mate-coupon") || "",
      }),
    });
    document.querySelector('[name="name"]').value = user.name;
    document.querySelector('[name="email"]').value = user.email;
    document.querySelector('[name="email"]').readOnly = true;
    renderCheckoutSummary();

    const savedCep = sessionStorage.getItem("mate-cep");
    if (savedCep) {
      document.querySelector("#checkout-cep").value = savedCep;
      await lookupCep();
    }
  } catch (error) {
    document.querySelector("#checkout-items").innerHTML = `<p class="error-message status-message">${error.message}</p>`;
  }
}

async function lookupCep() {
  const feedback = document.querySelector("#cep-feedback");

  if (!checkoutSummary) {
    feedback.textContent = "Aguarde o carregamento do resumo do pedido.";
    return;
  }

  feedback.textContent = "Consultando CEP...";

  try {
    checkoutShipping = await apiRequest("/shipping", {
      method: "POST",
      body: JSON.stringify({
        cep: document.querySelector("#checkout-cep").value,
        subtotal: checkoutSummary.subtotal,
      }),
    });

    const { address } = checkoutShipping;
    document.querySelector("#street").value = address.street;
    document.querySelector("#neighborhood").value = address.neighborhood;
    document.querySelector("#city").value = address.city;
    document.querySelector("#state").value = address.state;
    sessionStorage.setItem("mate-cep", checkoutShipping.cep);
    feedback.textContent = checkoutShipping.addressLookup
      ? `Endereço encontrado. Entrega estimada em ${checkoutShipping.deliveryDays.min} a ${checkoutShipping.deliveryDays.max} dias úteis.`
      : `Frete calculado. Preencha o endereço manualmente. Entrega em ${checkoutShipping.deliveryDays.min} a ${checkoutShipping.deliveryDays.max} dias úteis.`;
    renderCheckoutSummary();
  } catch (error) {
    feedback.textContent = error.message;
  }
}

function renderCheckoutSummary() {
  document.querySelector("#checkout-items").innerHTML = checkoutSummary.items
    .map((item) => `<div class="checkout-item"><span>${item.qty}x ${item.name}</span><strong>${formatPrice(item.lineSubtotal)}</strong></div>`)
    .join("");

  const freight = checkoutShipping ? checkoutShipping.freight : 0;
  const total = checkoutSummary.subtotal + freight - checkoutSummary.discount;
  document.querySelector("#checkout-subtotal").textContent = formatPrice(checkoutSummary.subtotal);
  document.querySelector("#checkout-freight").textContent = checkoutShipping ? formatPrice(freight) : "Calcule pelo CEP";
  document.querySelector("#checkout-discount").textContent = `- ${formatPrice(checkoutSummary.discount)}`;
  document.querySelector("#checkout-total").textContent = formatPrice(total);
}

async function finishOrder(event) {
  event.preventDefault();

  if (!checkoutShipping) {
    document.querySelector("#cep-feedback").textContent = "Calcule o frete antes de confirmar o pedido.";
    return;
  }

  const form = new FormData(event.currentTarget);
  const button = document.querySelector("#finish-order");
  button.disabled = true;
  button.textContent = "Confirmando...";

  try {
    const order = await apiRequest("/checkout", {
      method: "POST",
      body: JSON.stringify({
        items: getCartItems(),
        couponCode: sessionStorage.getItem("mate-coupon") || "",
        customer: { name: form.get("name"), email: form.get("email"), phone: form.get("phone") },
        address: {
          cep: form.get("cep"), street: form.get("street"), number: form.get("number"),
          complement: form.get("complement"), neighborhood: form.get("neighborhood"),
          city: form.get("city"), state: form.get("state"),
        },
        paymentMethod: form.get("paymentMethod"),
      }),
    });

    saveCartItems([]);
    clearCheckoutSession();
    document.body.classList.add("modal-open");
    const success = document.querySelector("#order-success");
    const successCard = document.querySelector("#order-success-card");
    success.hidden = false;
    successCard.innerHTML = `
      <div class="success-icon">✓</div>
      <p class="eyebrow">Pedido confirmado</p>
      <h1 id="order-success-title">Obrigado, ${order.customer.name}!</h1>
      <p>Seu pedido <strong>${order.orderNumber}</strong> foi criado com sucesso.</p>
      <p>Entrega estimada em ${order.delivery.deliveryDays.min} a ${order.delivery.deliveryDays.max} dias úteis.</p>
      <div class="price">${formatPrice(order.summary.total)}</div>
      <a class="button" href="/rastreamento?order=${encodeURIComponent(order.orderNumber)}&email=${encodeURIComponent(order.customer.email)}">Rastrear pedido</a>
      <a class="button button-brown" href="/">Voltar para a loja</a>
    `;
    successCard.querySelector("a").focus();
  } catch (error) {
    button.disabled = false;
    button.textContent = "Confirmar pedido";
    document.querySelector("#cep-feedback").textContent = error.message;
  }
}
