require("dotenv").config();
const mongoose = require("mongoose");
const Product = require("./models/Product");

// Paste your products array from src/data/products.ts here, converted to plain JS objects
const products = [
  // TODO: paste your product objects here, e.g.
  // { id: "sable-ring", name: "Sable Signet Ring", price: 2900, material: "18k Gold", image: "..." },
];

mongoose.connect(process.env.MONGODB_URI).then(async () => {
  await Product.deleteMany({});
  await Product.insertMany(products);
  console.log(`Seeded ${products.length} products`);
  process.exit(0);
}).catch((err) => {
  console.error(err);
  process.exit(1);
});
