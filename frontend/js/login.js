document.querySelectorAll("[data-auth-tab]").forEach((button) => button.addEventListener("click", () => {
  document.querySelectorAll("[data-auth-tab]").forEach((item) => item.classList.toggle("active", item === button));
  document.querySelector("#login-form").hidden = button.dataset.authTab !== "login";
  document.querySelector("#register-form").hidden = button.dataset.authTab !== "register";
  document.querySelector("#auth-feedback").textContent = "";
}));

document.querySelector("#login-form").addEventListener("submit", (event) => authenticate(event, "/auth/login"));
document.querySelector("#register-form").addEventListener("submit", (event) => authenticate(event, "/auth/register"));

async function authenticate(event, endpoint) {
  event.preventDefault();
  const form = new FormData(event.currentTarget);
  const feedback = document.querySelector("#auth-feedback");
  feedback.textContent = "Autenticando...";
  try {
    const data = await apiRequest(endpoint, { method: "POST", body: JSON.stringify(Object.fromEntries(form)) });
    saveAuth(data);
    await syncAuthenticatedCart(true);
    const next = new URLSearchParams(location.search).get("next");
    location.href = next || (data.user.role === "admin" ? "/admin" : "/perfil");
  } catch (error) { feedback.textContent = error.message; }
}
