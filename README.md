# Mate de Estância

Simulação de e-commerce desenvolvida para a disciplina de Programação Web.

O projeto demonstra modelo cliente-servidor, API REST, autenticação, tratamento
de erros, persistência em PostgreSQL e uma interface completa para clientes e
administradores.

## Principais recursos

- Catálogo com pesquisa, categorias e detalhes dos produtos.
- Carrinho local para visitantes e persistido para usuários autenticados.
- Cadastro e login com senha protegida por `scrypt` e autenticação JWT.
- Cálculo de frete por CEP e finalização de compra.
- Perfil do cliente com carrinho salvo e histórico de pedidos.
- Painel administrativo para cadastrar, editar e excluir produtos.
- Painel de vendas com dados do comprador, entrega, itens e faturamento.
- Documentação interativa da API com Swagger.

## Tecnologias

- Front-end: HTML, CSS e JavaScript puro
- Back-end: Node.js e Express
- Banco de dados: PostgreSQL
- ORM: Sequelize
- Documentação: Swagger/OpenAPI

## Estrutura

```text
mate-de-estancia/
├── backend/
│   ├── src/
│   │   ├── config/       # Conexão com o banco
│   │   ├── controllers/  # Regras das requisições
│   │   ├── data/         # Produtos adicionais para seed
│   │   ├── docs/         # Configuração Swagger
│   │   ├── middlewares/  # Autenticação e tratamento de erros
│   │   ├── models/       # Modelos Sequelize
│   │   ├── routes/       # Rotas da API
│   │   ├── services/     # Regras reutilizáveis
│   │   └── server.js     # Inicialização do servidor
│   ├── .env.example
│   └── package.json
├── frontend/
│   ├── assets/images/    # Imagens utilizadas pela loja
│   ├── css/
│   ├── js/
│   └── *.html
└── postman/
```

## Como executar

1. Crie um banco PostgreSQL chamado `loja_gaucha`.
2. Entre em `backend`.
3. Copie `.env.example` para `.env` e configure o banco.
4. Instale as dependências, alimente o banco e inicie o servidor:

```powershell
cd backend
npm install
npm run seed
npm run dev
```

Acesse:

- Loja: `http://localhost:3000`
- Perfil: `http://localhost:3000/perfil`
- Administração: `http://localhost:3000/admin`
- Swagger: `http://localhost:3000/api-docs`

## Autenticação

- A loja e o carrinho podem ser acessados sem login.
- O login é obrigatório para finalizar uma compra.
- Novos cadastros recebem o perfil de cliente.
- O administrador usa o e-mail `admin@mate.com`.
- A senha administrativa é definida em `ADMIN_PASSWORD` no `.env`.

## Rotas principais

| Método | Rota | Função |
|---|---|---|
| GET | `/health` | Verifica o funcionamento da API |
| GET | `/search` | Pesquisa e filtra produtos |
| GET | `/product/:id` | Retorna detalhes de um produto |
| POST | `/cart` | Recalcula os valores do carrinho |
| POST | `/shipping` | Consulta CEP e calcula frete |
| POST | `/checkout` | Finaliza e persiste um pedido |
| POST | `/auth/register` | Cadastra um cliente |
| POST | `/auth/login` | Autentica cliente ou administrador |
| GET/PUT | `/user/cart` | Consulta ou persiste o carrinho |
| GET | `/user/orders` | Retorna pedidos do cliente autenticado |
| GET | `/admin-api/orders` | Retorna vendas para o administrador |

## Dependências

As dependências diretas ficam declaradas em `backend/package.json`. A pasta
`node_modules` também contém dependências internas instaladas automaticamente
pelo npm. Ela não deve ser editada manualmente e pode ser recriada a qualquer
momento executando `npm install`.

## Testes com Postman

Importe `postman/Loja-Gaucha.postman_collection.json`.
