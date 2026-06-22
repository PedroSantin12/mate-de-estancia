const TRACKING_STEPS = ["Pedido confirmado", "Em preparo", "Enviado", "Entregue"];

document.addEventListener("DOMContentLoaded", initializeTracking);

function initializeTracking() {
  const form = document.querySelector("#tracking-form");
  if (!form) return;

  const params = new URLSearchParams(window.location.search);
  const user = typeof getAuthUser === "function" ? getAuthUser() : null;

  form.orderNumber.value = params.get("order") || "";
  form.email.value = params.get("email") || user?.email || "";
  form.addEventListener("submit", trackOrder);

  if (form.orderNumber.value && form.email.value) {
    form.requestSubmit();
  }
}

function getStepState(orderStatus, step) {
  if (orderStatus === "Cancelado") return step === "Pedido confirmado" ? "done" : "pending";
  const currentIndex = TRACKING_STEPS.indexOf(orderStatus);
  const stepIndex = TRACKING_STEPS.indexOf(step);
  if (stepIndex < currentIndex) return "done";
  if (stepIndex === currentIndex) return "current";
  return "pending";
}

function renderTracking(order) {
  const items = Array.isArray(order.summary?.items) ? order.summary.items : [];
  const address = order.delivery?.address || {};
  const steps = order.status === "Cancelado" ? [...TRACKING_STEPS, "Cancelado"] : TRACKING_STEPS;

  document.querySelector("#tracking-result").innerHTML = `
    <div class="tracking-head">
      <div>
        <p class="eyebrow">Pedido encontrado</p>
        <h2>${order.orderNumber}</h2>
      </div>
      <span class="order-status">${order.status}</span>
    </div>
    <ol class="tracking-timeline">
      ${steps.map((step) => `<li class="${step === "Cancelado" ? "canceled" : getStepState(order.status, step)}"><span></span><strong>${step}</strong></li>`).join("")}
    </ol>
    <div class="tracking-details">
      <section>
        <h3>Entrega</h3>
        <p>${address.street || "Endereço não informado"}, ${address.number || "s/n"}<br>${address.city || ""}/${address.state || ""}<br>Previsão: ${order.delivery?.deliveryDays?.min || "-"} a ${order.delivery?.deliveryDays?.max || "-"} dias úteis</p>
      </section>
      <section>
        <h3>Resumo</h3>
        <p>${items.length} item(ns)<br>Total: <strong>${formatPrice(order.summary?.total || 0)}</strong></p>
      </section>
    </div>
    <ul class="tracking-items">
      ${items.map((item) => `<li><span>${item.qty}x ${item.name}</span><strong>${formatPrice(item.lineSubtotal)}</strong></li>`).join("")}
    </ul>
  `;
}

async function trackOrder(event) {
  event.preventDefault();
  const form = new FormData(event.currentTarget);
  const feedback = document.querySelector("#tracking-feedback");

  feedback.textContent = "Consultando pedido...";

  try {
    const order = await apiRequest("/order-tracking", {
      method: "POST",
      body: JSON.stringify({
        orderNumber: form.get("orderNumber"),
        email: form.get("email"),
      }),
    });
    feedback.textContent = "";
    renderTracking(order);
  } catch (error) {
    feedback.textContent = error.message;
    document.querySelector("#tracking-result").innerHTML = `<p class="status-message error-message">Não encontramos um pedido com esses dados.</p>`;
  }
}
