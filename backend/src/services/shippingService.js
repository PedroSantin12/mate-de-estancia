const AppError = require("../utils/AppError");

function normalizeCep(value) {
  const cep = String(value || "").replace(/\D/g, "");

  if (cep.length !== 8) {
    throw new AppError("Informe um CEP válido com 8 dígitos.", 400, "INVALID_CEP");
  }

  return cep;
}

function calculateFreightByState(state, subtotal) {
  if (Number(subtotal) >= 200) return 0;
  if (state === "RS") return 18.9;
  if (["SC", "PR"].includes(state)) return 24.9;
  if (["SP", "RJ", "MG", "ES"].includes(state)) return 32.9;
  return 42.9;
}

function calculateDeliveryDays(state) {
  if (state === "RS") return { min: 2, max: 4 };
  if (["SC", "PR"].includes(state)) return { min: 3, max: 6 };
  if (["SP", "RJ", "MG", "ES"].includes(state)) return { min: 5, max: 8 };
  return { min: 7, max: 12 };
}

function inferStateFromCep(cep) {
  const prefix = Number(cep.slice(0, 2));

  if (prefix >= 90) return "RS";
  if (prefix >= 88) return "SC";
  if (prefix >= 80) return "PR";
  if (prefix <= 19) return "SP";
  if (prefix <= 28) return "RJ";
  if (prefix <= 29) return "ES";
  if (prefix <= 39) return "MG";
  return "BR";
}

function buildOfflineQuote(cep, subtotal) {
  const state = inferStateFromCep(cep);
  const freight = calculateFreightByState(state, subtotal);

  return {
    cep,
    address: { street: "", neighborhood: "", city: "", state: state === "BR" ? "" : state },
    freight,
    deliveryDays: calculateDeliveryDays(state),
    freeShipping: freight === 0,
    addressLookup: false,
  };
}

async function calculateShipping(cepValue, subtotal = 0) {
  const cep = normalizeCep(cepValue);
  let response;

  try {
    response = await fetch(`https://viacep.com.br/ws/${cep}/json/`);
  } catch (_error) {
    return buildOfflineQuote(cep, subtotal);
  }

  if (!response.ok) {
    return buildOfflineQuote(cep, subtotal);
  }

  const address = await response.json();

  if (address.erro) {
    throw new AppError("CEP não encontrado.", 404, "CEP_NOT_FOUND");
  }

  const freight = calculateFreightByState(address.uf, subtotal);
  const deliveryDays = calculateDeliveryDays(address.uf);

  return {
    cep,
    address: {
      street: address.logradouro,
      neighborhood: address.bairro,
      city: address.localidade,
      state: address.uf,
    },
    freight,
    deliveryDays,
    freeShipping: freight === 0,
    addressLookup: true,
  };
}

module.exports = { calculateShipping, normalizeCep };
