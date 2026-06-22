const bearerSecurity = [{ bearerAuth: [] }];
const basicSecurity = [{ basicAuth: [] }];

const responses = {
  unauthorized: { 401: { description: "Não autorizado" } },
  forbidden: { 403: { description: "Acesso permitido somente para administradores" } },
  notFound: { 404: { description: "Recurso não encontrado" } },
  validation: { 400: { description: "Dados inválidos" } },
};

const swaggerDocument = {
  openapi: "3.0.0",
  info: {
    title: "Mate de Estância API",
    version: "1.0.0",
    description: "Documentação da API REST do e-commerce Mate de Estância.",
  },
  servers: [{ url: "http://localhost:3000", description: "Servidor local" }],
  tags: [
    { name: "Sistema", description: "Funcionamento da API" },
    { name: "Produtos", description: "Catálogo e pesquisa" },
    { name: "Carrinho e compra", description: "Carrinho, frete e checkout" },
    { name: "Autenticação", description: "Cadastro, login e perfil" },
    { name: "Administração", description: "Operações exclusivas do administrador" },
  ],
  components: {
    securitySchemes: {
      basicAuth: { type: "http", scheme: "basic" },
      bearerAuth: { type: "http", scheme: "bearer", bearerFormat: "JWT" },
    },
    schemas: {
      ProductInput: {
        type: "object",
        required: ["name", "slug", "description", "category", "price", "image"],
        properties: {
          name: { type: "string", example: "Cuia de Porongo" },
          slug: { type: "string", example: "cuia-de-porongo" },
          description: { type: "string" },
          category: { type: "string", example: "cuias" },
          price: { type: "number", example: 59.9 },
          image: { type: "string", example: "/assets/images/cuia-classica-real.jpg" },
          stock: { type: "integer", example: 20 },
          featured: { type: "boolean", example: false },
        },
      },
      ReviewInput: {
        type: "object",
        required: ["rating", "comment"],
        properties: {
          rating: { type: "integer", minimum: 1, maximum: 5, example: 5 },
          comment: { type: "string", minLength: 5, maxLength: 500, example: "Produto excelente para o chimarrão do dia a dia." },
        },
      },
      AuthInput: {
        type: "object",
        required: ["email", "password"],
        properties: {
          email: { type: "string", format: "email" },
          password: { type: "string", format: "password" },
        },
      },
      CartInput: {
        type: "object",
        properties: {
          items: {
            type: "array",
            items: {
              type: "object",
              properties: {
                productId: { type: "integer" },
                variantId: { type: "string" },
                qty: { type: "integer", minimum: 1 },
              },
            },
          },
          couponCode: { type: "string", example: "URI10" },
        },
      },
      TrackingInput: {
        type: "object",
        required: ["orderNumber", "email"],
        properties: {
          orderNumber: { type: "string", example: "ME123456789" },
          email: { type: "string", format: "email", example: "cliente@email.com" },
        },
      },
    },
  },
  paths: {
    "/health": {
      get: {
        tags: ["Sistema"],
        summary: "Verifica o funcionamento da API",
        responses: { 200: { description: "Serviço disponível" } },
      },
    },
    "/search": {
      get: {
        tags: ["Produtos"],
        summary: "Lista e pesquisa produtos",
        parameters: [
          { name: "query", in: "query", schema: { type: "string" } },
          { name: "cat", in: "query", schema: { type: "string" } },
          { name: "sort", in: "query", schema: { type: "string", enum: ["price_asc", "price_desc", "name_asc"] } },
          { name: "page", in: "query", schema: { type: "integer", minimum: 1 } },
          { name: "limit", in: "query", schema: { type: "integer", minimum: 1, maximum: 50 } },
        ],
        responses: { 200: { description: "Lista de produtos" }, ...responses.validation },
      },
    },
    "/product/{id}": {
      get: {
        tags: ["Produtos"],
        summary: "Consulta um produto por ID",
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "integer" } }],
        responses: { 200: { description: "Produto encontrado" }, ...responses.notFound },
      },
      delete: {
        tags: ["Produtos"],
        summary: "Remove um produto usando Basic Auth",
        security: basicSecurity,
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "integer" } }],
        responses: { 200: { description: "Produto removido" }, ...responses.unauthorized, ...responses.notFound },
      },
    },
    "/product/{id}/reviews": {
      get: {
        tags: ["Produtos"],
        summary: "Lista avaliações reais de um produto",
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "integer" } }],
        responses: { 200: { description: "Avaliações retornadas" }, ...responses.notFound },
      },
      post: {
        tags: ["Produtos"],
        summary: "Publica ou atualiza a avaliação do usuário autenticado",
        security: bearerSecurity,
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "integer" } }],
        requestBody: { required: true, content: { "application/json": { schema: { $ref: "#/components/schemas/ReviewInput" } } } },
        responses: { 201: { description: "Avaliação publicada" }, 200: { description: "Avaliação atualizada" }, ...responses.validation, ...responses.unauthorized, ...responses.notFound },
      },
    },
    "/products": {
      post: {
        tags: ["Produtos"],
        summary: "Cadastra um produto usando Basic Auth",
        security: basicSecurity,
        requestBody: { required: true, content: { "application/json": { schema: { $ref: "#/components/schemas/ProductInput" } } } },
        responses: { 201: { description: "Produto criado" }, ...responses.validation, ...responses.unauthorized },
      },
    },
    "/cart": {
      post: {
        tags: ["Carrinho e compra"],
        summary: "Recalcula valores do carrinho",
        requestBody: { required: true, content: { "application/json": { schema: { $ref: "#/components/schemas/CartInput" } } } },
        responses: { 200: { description: "Resumo calculado" }, ...responses.validation, ...responses.notFound },
      },
    },
    "/shipping": {
      post: {
        tags: ["Carrinho e compra"],
        summary: "Consulta endereço e calcula frete por CEP",
        requestBody: {
          required: true,
          content: { "application/json": { schema: { type: "object", properties: { cep: { type: "string", example: "90010000" }, subtotal: { type: "number", example: 150 } } } } },
        },
        responses: { 200: { description: "Frete calculado" }, ...responses.validation, ...responses.notFound },
      },
    },
    "/checkout": {
      post: {
        tags: ["Carrinho e compra"],
        summary: "Finaliza e persiste um pedido",
        security: bearerSecurity,
        responses: { 201: { description: "Pedido confirmado" }, ...responses.validation, ...responses.unauthorized },
      },
    },
    "/order-tracking": {
      post: {
        tags: ["Carrinho e compra"],
        summary: "Consulta o rastreamento de um pedido por número e e-mail",
        requestBody: { required: true, content: { "application/json": { schema: { $ref: "#/components/schemas/TrackingInput" } } } },
        responses: { 200: { description: "Pedido encontrado" }, ...responses.validation, ...responses.notFound },
      },
    },
    "/auth/register": {
      post: {
        tags: ["Autenticação"],
        summary: "Cadastra um cliente",
        responses: { 201: { description: "Cliente cadastrado" }, ...responses.validation },
      },
    },
    "/auth/login": {
      post: {
        tags: ["Autenticação"],
        summary: "Autentica cliente ou administrador e retorna JWT",
        requestBody: { required: true, content: { "application/json": { schema: { $ref: "#/components/schemas/AuthInput" } } } },
        responses: { 200: { description: "Login realizado" }, ...responses.unauthorized },
      },
    },
    "/auth/me": {
      get: {
        tags: ["Autenticação"],
        summary: "Retorna o usuário autenticado",
        security: bearerSecurity,
        responses: { 200: { description: "Usuário autenticado" }, ...responses.unauthorized },
      },
    },
    "/user/cart": {
      get: {
        tags: ["Autenticação"],
        summary: "Retorna o carrinho persistido",
        security: bearerSecurity,
        responses: { 200: { description: "Carrinho retornado" }, ...responses.unauthorized },
      },
      put: {
        tags: ["Autenticação"],
        summary: "Persiste o carrinho do usuário",
        security: bearerSecurity,
        responses: { 200: { description: "Carrinho salvo" }, ...responses.validation, ...responses.unauthorized },
      },
    },
    "/user/favorites": {
      get: {
        tags: ["Autenticação"],
        summary: "Retorna os produtos favoritos do usuário",
        security: bearerSecurity,
        responses: { 200: { description: "Favoritos retornados" }, ...responses.unauthorized },
      },
      put: {
        tags: ["Autenticação"],
        summary: "Persiste os produtos favoritos do usuário",
        security: bearerSecurity,
        requestBody: { required: true, content: { "application/json": { schema: { type: "object", properties: { items: { type: "array", items: { type: "integer" } } } } } } },
        responses: { 200: { description: "Favoritos salvos" }, ...responses.validation, ...responses.unauthorized },
      },
    },
    "/user/reviewable-products": {
      get: {
        tags: ["Autenticação"],
        summary: "Lista produtos comprados que podem ser avaliados",
        security: bearerSecurity,
        responses: { 200: { description: "IDs de produtos retornados" }, ...responses.unauthorized },
      },
    },
    "/user/orders": {
      get: {
        tags: ["Autenticação"],
        summary: "Retorna o histórico de pedidos do usuário",
        security: bearerSecurity,
        responses: { 200: { description: "Pedidos retornados" }, ...responses.unauthorized },
      },
    },
    "/admin-api/dashboard": {
      get: {
        tags: ["Administração"],
        summary: "Retorna indicadores administrativos",
        security: bearerSecurity,
        responses: { 200: { description: "Indicadores retornados" }, ...responses.unauthorized, ...responses.forbidden },
      },
    },
    "/admin-api/users": {
      get: {
        tags: ["Administração"],
        summary: "Lista usuários cadastrados",
        security: bearerSecurity,
        responses: { 200: { description: "Usuários retornados" }, ...responses.unauthorized, ...responses.forbidden },
      },
    },
    "/admin-api/orders": {
      get: {
        tags: ["Administração"],
        summary: "Lista vendas e dados dos compradores",
        security: bearerSecurity,
        responses: { 200: { description: "Vendas retornadas" }, ...responses.unauthorized, ...responses.forbidden },
      },
    },
    "/admin-api/reviews": {
      get: {
        tags: ["Administração"],
        summary: "Lista avaliações publicadas pelos clientes",
        security: bearerSecurity,
        responses: { 200: { description: "Avaliações retornadas" }, ...responses.unauthorized, ...responses.forbidden },
      },
    },
    "/admin-api/review/{id}": {
      delete: {
        tags: ["Administração"],
        summary: "Exclui uma avaliação inadequada",
        security: bearerSecurity,
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "integer" } }],
        responses: { 200: { description: "Avaliação excluída" }, ...responses.unauthorized, ...responses.forbidden, ...responses.notFound },
      },
    },
    "/admin-api/order/{id}/status": {
      patch: {
        tags: ["Administração"],
        summary: "Atualiza o status de um pedido",
        security: bearerSecurity,
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "integer" } }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["status"],
                properties: { status: { type: "string", enum: ["Pedido confirmado", "Em preparo", "Enviado", "Entregue", "Cancelado"] } },
              },
            },
          },
        },
        responses: { 200: { description: "Status atualizado" }, ...responses.validation, ...responses.unauthorized, ...responses.forbidden, ...responses.notFound },
      },
    },
    "/admin-api/products": {
      post: {
        tags: ["Administração"],
        summary: "Cadastra produto pelo painel administrativo",
        security: bearerSecurity,
        requestBody: { required: true, content: { "application/json": { schema: { $ref: "#/components/schemas/ProductInput" } } } },
        responses: { 201: { description: "Produto criado" }, ...responses.validation, ...responses.unauthorized, ...responses.forbidden },
      },
    },
    "/admin-api/product/{id}": {
      put: {
        tags: ["Administração"],
        summary: "Atualiza um produto",
        security: bearerSecurity,
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "integer" } }],
        requestBody: { required: true, content: { "application/json": { schema: { $ref: "#/components/schemas/ProductInput" } } } },
        responses: { 200: { description: "Produto atualizado" }, ...responses.validation, ...responses.unauthorized, ...responses.forbidden, ...responses.notFound },
      },
      delete: {
        tags: ["Administração"],
        summary: "Exclui um produto",
        security: bearerSecurity,
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "integer" } }],
        responses: { 200: { description: "Produto excluído" }, ...responses.unauthorized, ...responses.forbidden, ...responses.notFound },
      },
    },
  },
};

module.exports = swaggerDocument;
