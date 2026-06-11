const swaggerDocument = {
  openapi: "3.0.0",
  info: {
    title: "Mate de Estância API",
    version: "1.0.0",
    description: "API REST do trabalho individual de Programação Web.",
  },
  servers: [{ url: "http://localhost:3000" }],
  components: {
    securitySchemes: {
      basicAuth: {
        type: "http",
        scheme: "basic",
      },
    },
    schemas: {
      ErrorResponse: {
        type: "object",
        properties: {
          success: { type: "boolean", example: false },
          error: {
            type: "object",
            properties: {
              code: { type: "string", example: "PRODUCT_NOT_FOUND" },
              message: { type: "string", example: "Produto não encontrado." },
            },
          },
        },
      },
    },
  },
  paths: {
    "/health": {
      get: {
        summary: "Verifica o funcionamento da API",
        responses: {
          200: { description: "Serviço disponível" },
        },
      },
    },
    "/products": {
      post: {
        summary: "Cadastra um produto",
        security: [{ basicAuth: [] }],
        responses: {
          201: { description: "Produto criado" },
          400: { description: "Dados inválidos" },
          401: { description: "Não autorizado" },
        },
      },
    },
    "/product/{id}": {
      get: {
        summary: "Consulta um produto por ID",
        parameters: [
          { name: "id", in: "path", required: true, schema: { type: "integer" } },
        ],
        responses: {
          200: { description: "Produto encontrado" },
          404: { description: "Produto não encontrado" },
        },
      },
      delete: {
        summary: "Remove um produto por ID",
        security: [{ basicAuth: [] }],
        parameters: [
          { name: "id", in: "path", required: true, schema: { type: "integer" } },
        ],
        responses: {
          200: { description: "Produto removido" },
          401: { description: "Não autorizado" },
          404: { description: "Produto não encontrado" },
        },
      },
    },
    "/search": {
      get: {
        summary: "Lista e pesquisa produtos",
        parameters: [
          { name: "query", in: "query", schema: { type: "string" } },
          { name: "cat", in: "query", schema: { type: "string" } },
          { name: "page", in: "query", schema: { type: "integer", minimum: 1 } },
          { name: "limit", in: "query", schema: { type: "integer", minimum: 1, maximum: 50 } },
        ],
        responses: {
          200: { description: "Lista de produtos" },
          400: { description: "Parâmetro inválido" },
        },
      },
    },
    "/cart": {
      post: {
        summary: "Calcula o resumo atualizado do carrinho",
        responses: {
          200: { description: "Resumo calculado" },
          400: { description: "Carrinho inválido" },
          404: { description: "Produto não encontrado" },
        },
      },
    },
    "/shipping": {
      post: {
        summary: "Consulta endereço e calcula frete por CEP",
        responses: {
          200: { description: "Frete calculado" },
          400: { description: "CEP inválido" },
          404: { description: "CEP não encontrado" },
          503: { description: "Serviço de CEP indisponível" },
        },
      },
    },
    "/checkout": {
      post: {
        summary: "Valida os dados e confirma um pedido simulado",
        responses: {
          201: { description: "Pedido confirmado" },
          400: { description: "Dados inválidos" },
        },
      },
    },
    "/auth/register": {
      post: { summary: "Cadastra um cliente", responses: { 201: { description: "Cliente cadastrado" } } },
    },
    "/auth/login": {
      post: { summary: "Autentica cliente ou administrador e retorna JWT", responses: { 200: { description: "Login realizado" } } },
    },
    "/auth/me": {
      get: { summary: "Retorna o usuário autenticado", responses: { 200: { description: "Usuário autenticado" } } },
    },
    "/user/cart": {
      get: { summary: "Retorna o carrinho persistido do usuário", responses: { 200: { description: "Carrinho retornado" } } },
      put: { summary: "Persiste o carrinho do usuário", responses: { 200: { description: "Carrinho salvo" } } },
    },
  },
};

module.exports = swaggerDocument;
