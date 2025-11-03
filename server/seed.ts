import { db } from "./db";
import { products, foodItems, wallets } from "@shared/schema";

async function seed() {
  console.log("Seeding database...");

  // Check if data already exists
  const existingProducts = await db.select().from(products);
  if (existingProducts.length > 0) {
    console.log("Database already seeded!");
    return;
  }

  // Seed products
  await db.insert(products).values([
    {
      name: "Rhum Agricole XO",
      description: "Rhum vieilli de qualité supérieure, distillé en Martinique avec des cannes à sucre locales",
      price: 45.99,
      image: "https://images.unsplash.com/photo-1582283404919-5e90b7508068?q=80&w=800",
      category: "Spiritueux",
      inStock: true,
    },
    {
      name: "Panier Artisanal",
      description: "Panier tissé à la main par des artisans locaux, parfait pour vos courses au marché",
      price: 29.99,
      image: "https://images.unsplash.com/photo-1590736969955-71cc94901144?q=80&w=800",
      category: "Artisanat",
      inStock: true,
    },
    {
      name: "Épices Caribéennes",
      description: "Mélange d'épices authentiques: colombo, bois d'Inde, piment végétarien",
      price: 12.50,
      image: "https://images.unsplash.com/photo-1596040033229-a0b57a1fd76d?q=80&w=800",
      category: "Épices",
      inStock: true,
    },
    {
      name: "Café Blue Mountain",
      description: "Café premium cultivé dans les montagnes de la Jamaïque, torréfaction locale",
      price: 22.00,
      image: "https://images.unsplash.com/photo-1447933601403-0c6688de566e?q=80&w=800",
      category: "Café",
      inStock: true,
    },
    {
      name: "Savon Coco-Vanille",
      description: "Savon artisanal à base d'huile de coco et vanille Bourbon, fabriqué localement",
      price: 8.99,
      image: "https://images.unsplash.com/photo-1588945403387-19ce1e2b1dcd?q=80&w=800",
      category: "Cosmétiques",
      inStock: true,
    },
    {
      name: "T-Shirt Madras",
      description: "T-shirt en coton avec motifs madras traditionnels, design moderne et confortable",
      price: 24.99,
      image: "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?q=80&w=800",
      category: "Vêtements",
      inStock: false,
    },
  ]);

  // Seed food items
  await db.insert(foodItems).values([
    {
      name: "Poulet Boucané",
      description: "Poulet mariné aux épices locales, grillé et servi avec riz créole et pois rouges",
      price: 14.50,
      image: "https://images.unsplash.com/photo-1598103442097-8b74394b95c6?q=80&w=800",
      restaurant: "Chez Tatie",
      category: "Plat Principal",
      prepTime: 25,
      available: true,
    },
    {
      name: "Accras de Morue",
      description: "Beignets croustillants de morue salée, servis avec sauce chien pimentée",
      price: 8.00,
      image: "https://images.unsplash.com/photo-1626190407342-41a0aaf151af?q=80&w=800",
      restaurant: "La Case Créole",
      category: "Entrée",
      prepTime: 15,
      available: true,
    },
    {
      name: "Colombo de Porc",
      description: "Ragoût de porc aux épices colombo, pommes de terre et légumes locaux",
      price: 16.00,
      image: "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?q=80&w=800",
      restaurant: "Chez Tatie",
      category: "Plat Principal",
      prepTime: 30,
      available: true,
    },
    {
      name: "Salade Créole",
      description: "Salade fraîche avec avocat, tomates, concombre et vinaigrette passion",
      price: 9.50,
      image: "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?q=80&w=800",
      restaurant: "La Case Créole",
      category: "Salade",
      prepTime: 10,
      available: true,
    },
  ]);

  // Create default wallet for testing
  await db.insert(wallets).values({
    userId: "default",
    balance: 50.00,
    totalEarned: 50.00,
    miningActive: false,
  });

  console.log("Database seeded successfully!");
  process.exit(0);
}

seed().catch((error) => {
  console.error("Error seeding database:", error);
  process.exit(1);
});
