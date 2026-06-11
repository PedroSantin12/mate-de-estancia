async function apiRequest(url, options = {}) {
  const token = localStorage.getItem("mate-auth-token");
  const response = await fetch(url, {
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.headers || {}),
    },
    ...options,
  });

  let payload;

  try {
    payload = await response.json();
  } catch (_error) {
    throw new Error("O servidor retornou uma resposta inválida.");
  }

  if (!response.ok || payload.success === false) {
    throw new Error(payload.error?.message || "Não foi possível concluir a solicitação.");
  }

  return payload.data;
}

window.apiRequest = apiRequest;
