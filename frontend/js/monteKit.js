let kitProducts = [];
let currentKit = [];

document.addEventListener("DOMContentLoaded", initializeKitBuilder);

async function initializeKitBuilder() {
  document.querySelector("#kit-form").addEventListener("submit", generateKit);
  document.querySelector("#add-kit-to-cart").addEventListener("click", addCurrentKitToCart);

  try {
    const data = await apiRequest("/search?limit=50");
    kitProducts = data.items || [];
    document.querySelector("#kit-feedback").textContent = "Catálogo carregado. Ajuste as preferências e gere sua recomendação.";
    generateKit(new Event("submit"));
  } catch (error) {
    document.querySelector("#kit-feedback").textContent = error.message;
  }
}

function normalizeText(value) {
  return String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

function productsFrom(category) {
  return kitProducts.filter((product) => product.category === category && Number(product.stock) > 0);
}

function chooseByWords(category, words, budget) {
  const options = productsFrom(category);
  const matches = options.filter((product) => {
    const text = normalizeText(`${product.name} ${product.description}`);
    return words.some((word) => text.includes(normalizeText(word)));
  });
  return chooseByBudget(matches.length ? matches : options, budget);
}

function chooseByBudget(options, budget) {
  const sorted = [...options].sort((a, b) => Number(a.price) - Number(b.price));
  if (!sorted.length) return null;
  if (budget === "premium") return sorted[sorted.length - 1];
  if (budget === "intermediario") return sorted[Math.floor(sorted.length / 2)];
  return sorted[0];
}

function generateKit(event) {
  event.preventDefault();
  if (!kitProducts.length) return;

  const form = new FormData(document.querySelector("#kit-form"));
  const level = form.get("level");
  const taste = form.get("taste");
  const use = form.get("use");
  const budget = form.get("budget");
  const includeThermos = form.get("thermos") === "on";

  const ervaWords = {
    suave: ["tradicional", "nativa"],
    forte: ["grossa", "premium", "uruguaia"],
    menta: ["menta"],
  }[taste] || ["tradicional"];

  const cuiaWords = use === "presente"
    ? ["couro", "imbuia", "bago"]
    : level === "iniciante"
      ? ["coquinho", "classica"]
      : ["uruguaia", "bago", "couro"];

  const bombaWords = budget === "premium" ? ["dourada", "alpaca"] : use === "viagem" ? ["desmontavel", "inox"] : ["inox", "bojo"];
  const thermosWords = use === "viagem" ? ["compacta", "inox"] : budget === "premium" ? ["couro", "pressao"] : ["1l", "preta"];

  currentKit = [
    chooseByWords("ervas", ervaWords, budget),
    chooseByWords("cuias", cuiaWords, budget),
    chooseByWords("bombas", bombaWords, budget),
    includeThermos ? chooseByWords("termicas", thermosWords, budget) : null,
  ].filter(Boolean);

  renderKit({ level, taste, use, budget, includeThermos });
}

function renderKit(answers) {
  const title = {
    economico: "Kit Buenacho",
    intermediario: "Kit Mate de Estância",
    premium: "Kit Patrão da Roda",
  }[answers.budget];
  const total = currentKit.reduce((sum, product) => sum + Number(product.price), 0);

  document.querySelector("#kit-title").textContent = title;
  document.querySelector("#kit-description").textContent = answers.use === "presente"
    ? "Uma seleção bonita para presentear sem perder a utilidade no dia a dia."
    : answers.use === "viagem"
      ? "Produtos pensados para levar o chimarrão junto com praticidade."
      : "Uma combinação equilibrada para preparar o mate em casa com conforto.";

  document.querySelector("#kit-items").innerHTML = currentKit.map((product) => `
    <article class="kit-item">
      <img src="${product.image}" alt="${product.name}">
      <div>
        <small>${formatCategory(product.category)}</small>
        <strong>${product.name}</strong>
        <span>${formatPrice(product.price)}</span>
      </div>
    </article>
  `).join("");

  document.querySelector("#kit-total").textContent = formatPrice(total);
  document.querySelector("#add-kit-to-cart").disabled = currentKit.length < 3;
  document.querySelector("#kit-feedback").textContent = `${currentKit.length} produto(s) selecionados para o seu kit.`;
}

function addCurrentKitToCart() {
  currentKit.forEach((product) => addCartItem({ productId: product.id, qty: 1 }));
  document.querySelector("#kit-feedback").innerHTML = `Kit adicionado ao carrinho. <a href="/carrinho">Abrir carrinho</a>`;
}
