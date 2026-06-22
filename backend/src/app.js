const path = require("path");
const express = require("express");
const cors = require("cors");
const swaggerUi = require("swagger-ui-express");

const healthRoutes = require("./routes/healthRoutes");
const productRoutes = require("./routes/productRoutes");
const cartRoutes = require("./routes/cartRoutes");
const checkoutRoutes = require("./routes/checkoutRoutes");
const authRoutes = require("./routes/authRoutes");
const adminRoutes = require("./routes/adminRoutes");
const swaggerDocument = require("./docs/swagger");
const { notFoundHandler, errorHandler } = require("./middlewares/errorHandler");

const app = express();
const frontendPath = path.join(__dirname, "../../frontend");

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(healthRoutes);
app.use(productRoutes);
app.use(cartRoutes);
app.use(checkoutRoutes);
app.use(authRoutes);
app.use(adminRoutes);

app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerDocument));

app.use(express.static(frontendPath));

app.get("/busca", (_req, res) => {
  res.sendFile(path.join(frontendPath, "busca.html"));
});

app.get("/p/nome/:id", (_req, res) => {
  res.sendFile(path.join(frontendPath, "produto.html"));
});

app.get("/carrinho", (_req, res) => {
  res.sendFile(path.join(frontendPath, "carrinho.html"));
});

app.get("/favoritos", (_req, res) => {
  res.sendFile(path.join(frontendPath, "favoritos.html"));
});

app.get("/sobre", (_req, res) => {
  res.sendFile(path.join(frontendPath, "sobre.html"));
});

app.get("/monte-seu-kit", (_req, res) => {
  res.sendFile(path.join(frontendPath, "monte-kit.html"));
});

app.get("/rastreamento", (_req, res) => {
  res.sendFile(path.join(frontendPath, "rastreamento.html"));
});

app.get("/checkout", (_req, res) => {
  res.sendFile(path.join(frontendPath, "checkout.html"));
});

app.get("/login", (_req, res) => res.sendFile(path.join(frontendPath, "login.html")));
app.get("/perfil", (_req, res) => res.sendFile(path.join(frontendPath, "perfil.html")));
app.get("/admin", (_req, res) => res.sendFile(path.join(frontendPath, "admin.html")));

app.use(notFoundHandler);
app.use(errorHandler);

module.exports = app;
