import { 
  type Product, type InsertProduct,
  type FoodItem, type InsertFoodItem,
  type Wallet, type InsertWallet,
  type Transaction, type InsertTransaction,
  type UserActivity, type InsertUserActivity
} from "@shared/schema";
import { randomUUID } from "crypto";

export interface IStorage {
  // Products
  getProducts(): Promise<Product[]>;
  getProduct(id: string): Promise<Product | undefined>;
  createProduct(product: InsertProduct): Promise<Product>;
  
  // Food Items
  getFoodItems(): Promise<FoodItem[]>;
  getFoodItem(id: string): Promise<FoodItem | undefined>;
  createFoodItem(food: InsertFoodItem): Promise<FoodItem>;
  
  // Wallet
  getWallet(userId: string): Promise<Wallet | undefined>;
  createWallet(wallet: InsertWallet): Promise<Wallet>;
  updateWallet(userId: string, updates: Partial<Wallet>): Promise<Wallet>;
  
  // Transactions
  getTransactions(userId: string): Promise<Transaction[]>;
  getAllTransactions(): Promise<Transaction[]>;
  createTransaction(transaction: InsertTransaction): Promise<Transaction>;
  
  // User Activity
  getUserActivity(userId: string): Promise<UserActivity[]>;
  createUserActivity(activity: InsertUserActivity): Promise<UserActivity>;
}

export class MemStorage implements IStorage {
  private products: Map<string, Product>;
  private foodItems: Map<string, FoodItem>;
  private wallets: Map<string, Wallet>;
  private transactions: Map<string, Transaction>;
  private userActivities: Map<string, UserActivity>;

  constructor() {
    this.products = new Map();
    this.foodItems = new Map();
    this.wallets = new Map();
    this.transactions = new Map();
    this.userActivities = new Map();
    
    // Initialize with sample data
    this.initializeSampleData();
  }

  private initializeSampleData() {
    // Sample products
    const sampleProducts: InsertProduct[] = [
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
    ];

    sampleProducts.forEach(p => {
      const id = randomUUID();
      this.products.set(id, { ...p, id });
    });

    // Sample food items
    const sampleFood: InsertFoodItem[] = [
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
    ];

    sampleFood.forEach(f => {
      const id = randomUUID();
      this.foodItems.set(id, { ...f, id });
    });

    // Create default wallet
    const defaultWalletId = randomUUID();
    this.wallets.set("default", {
      id: defaultWalletId,
      userId: "default",
      balance: 50.00,
      totalEarned: 50.00,
      miningActive: false,
      lastMiningTime: null,
    });
  }

  // Products
  async getProducts(): Promise<Product[]> {
    return Array.from(this.products.values());
  }

  async getProduct(id: string): Promise<Product | undefined> {
    return this.products.get(id);
  }

  async createProduct(insertProduct: InsertProduct): Promise<Product> {
    const id = randomUUID();
    const product: Product = { ...insertProduct, id };
    this.products.set(id, product);
    return product;
  }

  // Food Items
  async getFoodItems(): Promise<FoodItem[]> {
    return Array.from(this.foodItems.values());
  }

  async getFoodItem(id: string): Promise<FoodItem | undefined> {
    return this.foodItems.get(id);
  }

  async createFoodItem(insertFood: InsertFoodItem): Promise<FoodItem> {
    const id = randomUUID();
    const food: FoodItem = { ...insertFood, id };
    this.foodItems.set(id, food);
    return food;
  }

  // Wallet
  async getWallet(userId: string): Promise<Wallet | undefined> {
    return this.wallets.get(userId);
  }

  async createWallet(insertWallet: InsertWallet): Promise<Wallet> {
    const id = randomUUID();
    const wallet: Wallet = { 
      ...insertWallet, 
      id,
      lastMiningTime: null,
    };
    this.wallets.set(insertWallet.userId, wallet);
    return wallet;
  }

  async updateWallet(userId: string, updates: Partial<Wallet>): Promise<Wallet> {
    const wallet = this.wallets.get(userId);
    if (!wallet) {
      throw new Error("Wallet not found");
    }
    const updated = { ...wallet, ...updates };
    this.wallets.set(userId, updated);
    return updated;
  }

  // Transactions
  async getTransactions(userId: string): Promise<Transaction[]> {
    return Array.from(this.transactions.values()).filter(t => t.userId === userId);
  }

  async getAllTransactions(): Promise<Transaction[]> {
    return Array.from(this.transactions.values());
  }

  async createTransaction(insertTransaction: InsertTransaction): Promise<Transaction> {
    const id = randomUUID();
    const transaction: Transaction = { 
      ...insertTransaction, 
      id,
      timestamp: new Date(),
    };
    this.transactions.set(id, transaction);
    return transaction;
  }

  // User Activity
  async getUserActivity(userId: string): Promise<UserActivity[]> {
    return Array.from(this.userActivities.values()).filter(a => a.userId === userId);
  }

  async createUserActivity(insertActivity: InsertUserActivity): Promise<UserActivity> {
    const id = randomUUID();
    const activity: UserActivity = { 
      ...insertActivity, 
      id,
      timestamp: new Date(),
    };
    this.userActivities.set(id, activity);
    return activity;
  }
}

export const storage = new MemStorage();
