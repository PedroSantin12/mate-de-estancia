require("dotenv").config();

const sequelize = require("./config/database");
const Product = require("./models/Product");

const products = [
  {
    name: "Erva-mate Tradicional",
    slug: "erva-mate-tradicional",
    description: "Erva-mate com moagem tradicional, sabor equilibrado e aroma característico para o chimarrão do dia a dia.",
    category: "ervas",
    price: 18.9,
    image: "/assets/images/erva-tradicional-real.jpg",
    stock: 100,
    featured: true,
    attributes: { tipo: "tradicional", moagem: "média", origem: "Rio Grande do Sul" },
    variants: [
      { id: "500g", label: "Pacote de 500 g", price: 18.9 },
      { id: "1kg", label: "Pacote de 1 kg", price: 34.9 },
      { id: "2kg", label: "Pacote de 2 kg", price: 64.9 }
    ]
  },
  {
    name: "Erva-mate Moída Grossa",
    slug: "erva-mate-moida-grossa",
    description: "Erva-mate de moagem grossa, indicada para quem prefere um chimarrão suave e duradouro.",
    category: "ervas",
    price: 20.9,
    image: "/assets/images/erva-grossa-real.jpg",
    stock: 80,
    featured: true,
    attributes: { tipo: "pura folha", moagem: "grossa", origem: "Rio Grande do Sul" },
    variants: [
      { id: "500g", label: "Pacote de 500 g", price: 20.9 },
      { id: "1kg", label: "Pacote de 1 kg", price: 38.9 }
    ]
  },
  {
    name: "Cuia de Porongo Clássica",
    slug: "cuia-porongo-classica",
    description: "Cuia artesanal de porongo com acabamento natural. Cada unidade possui formato único.",
    category: "cuias",
    price: 54.9,
    image: "/assets/images/cuia-classica-real.jpg",
    stock: 35,
    featured: true,
    attributes: { material: "porongo", acabamento: "natural", tamanho: "médio" },
    variants: []
  },
  {
    name: "Cuia Revestida em Couro",
    slug: "cuia-revestida-couro",
    description: "Cuia de porongo revestida em couro sintético marrom, com visual tradicional e acabamento resistente.",
    category: "cuias",
    price: 89.9,
    image: "/assets/images/cuia-couro-real.jpg",
    stock: 20,
    featured: false,
    attributes: { material: "porongo e couro sintético", acabamento: "revestido", tamanho: "médio" },
    variants: []
  },
  {
    name: "Bomba Inox Tradicional",
    slug: "bomba-inox-tradicional",
    description: "Bomba em aço inox com filtro rosqueável e acabamento polido.",
    category: "bombas",
    price: 42.9,
    image: "/assets/images/bomba-inox-real.jpg",
    stock: 60,
    featured: true,
    attributes: { material: "aço inox", comprimento: "21 cm", filtro: "rosqueável" },
    variants: []
  },
  {
    name: "Bomba Inox Dourada",
    slug: "bomba-inox-dourada",
    description: "Bomba em aço inox com acabamento dourado e filtro removível.",
    category: "bombas",
    price: 64.9,
    image: "/assets/images/bomba-dourada-real.jpg",
    stock: 40,
    featured: false,
    attributes: { material: "aço inox", acabamento: "dourado", comprimento: "21 cm" },
    variants: []
  },
  {
    name: "Garrafa Térmica 1 Litro",
    slug: "garrafa-termica-1-litro",
    description: "Garrafa térmica resistente com capacidade de 1 litro, ideal para acompanhar o chimarrão.",
    category: "termicas",
    price: 119.9,
    image: "/assets/images/termica-1l-real.jpg",
    stock: 25,
    featured: false,
    attributes: { capacidade: "1 litro", material: "plástico", cor: "verde" },
    variants: []
  },
  {
    name: "Garrafa Térmica Inox 1,2 Litro",
    slug: "garrafa-termica-inox",
    description: "Garrafa térmica em aço inox com capacidade de 1,2 litro e acabamento elegante.",
    category: "termicas",
    price: 189.9,
    image: "/assets/images/termica-inox-real.jpg",
    stock: 15,
    featured: false,
    attributes: { capacidade: "1,2 litro", material: "aço inox", cor: "inox" },
    variants: []
  },
  {
    name: "Kit Chimarrão Essencial",
    slug: "kit-chimarrao-essencial",
    description: "Kit com cuia de porongo, bomba inox e um pacote de erva-mate tradicional de 500 g.",
    category: "kits",
    price: 109.9,
    image: "/assets/images/kit-essencial-real.jpg",
    stock: 18,
    featured: false,
    attributes: { itens: "cuia, bomba e erva-mate", perfil: "iniciante" },
    variants: []
  },
  {
    name: "Kit Mateador Completo",
    slug: "kit-mateador-completo",
    description: "Kit completo com cuia revestida, bomba inox, garrafa térmica e erva-mate de 1 kg.",
    category: "kits",
    price: 299.9,
    image: "/assets/images/kit-completo-real.jpg",
    stock: 10,
    featured: false,
    attributes: { itens: "cuia, bomba, térmica e erva-mate", perfil: "completo" },
    variants: []
  }
];

async function seed() {
  try {
    await sequelize.authenticate();
    await sequelize.sync();

    const count = await Product.count();

    if (count > 0) {
      console.log("O banco já possui produtos. Nenhum item foi inserido.");
      process.exit(0);
    }

    await Product.bulkCreate(products);
    console.log(`${products.length} produtos inseridos com sucesso.`);
    process.exit(0);
  } catch (error) {
    console.error(error);
    process.exit(1);
  }
}

seed();
