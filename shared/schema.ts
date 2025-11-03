import { sql } from "drizzle-orm";
import { pgTable, text, varchar, real, integer, timestamp, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Products for marketplace
export const products = pgTable("products", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  description: text("description").notNull(),
  price: real("price").notNull(),
  image: text("image").notNull(),
  category: text("category").notNull(),
  inStock: boolean("in_stock").notNull().default(true),
});

export const insertProductSchema = createInsertSchema(products).omit({
  id: true,
});

export type InsertProduct = z.infer<typeof insertProductSchema>;
export type Product = typeof products.$inferSelect;

// Food items for Delikreol
export const foodItems = pgTable("food_items", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  description: text("description").notNull(),
  price: real("price").notNull(),
  image: text("image").notNull(),
  restaurant: text("restaurant").notNull(),
  category: text("category").notNull(),
  prepTime: integer("prep_time").notNull(), // minutes
  available: boolean("available").notNull().default(true),
});

export const insertFoodItemSchema = createInsertSchema(foodItems).omit({
  id: true,
});

export type InsertFoodItem = z.infer<typeof insertFoodItemSchema>;
export type FoodItem = typeof foodItems.$inferSelect;

// User wallet and IKB balance
export const wallets = pgTable("wallets", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: text("user_id").notNull().unique(),
  balance: real("balance").notNull().default(0),
  totalEarned: real("total_earned").notNull().default(0),
  miningActive: boolean("mining_active").notNull().default(false),
  lastMiningTime: timestamp("last_mining_time"),
});

export const insertWalletSchema = createInsertSchema(wallets).omit({
  id: true,
});

export type InsertWallet = z.infer<typeof insertWalletSchema>;
export type Wallet = typeof wallets.$inferSelect;

// Transaction history
export const transactions = pgTable("transactions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: text("user_id").notNull(),
  type: text("type").notNull(), // 'purchase', 'cashback', 'mining', 'share_reward'
  amount: real("amount").notNull(),
  description: text("description").notNull(),
  timestamp: timestamp("timestamp").notNull().default(sql`now()`),
});

export const insertTransactionSchema = createInsertSchema(transactions).omit({
  id: true,
  timestamp: true,
});

export type InsertTransaction = z.infer<typeof insertTransactionSchema>;
export type Transaction = typeof transactions.$inferSelect;

// User activity for AI recommendations
export const userActivity = pgTable("user_activity", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: text("user_id").notNull(),
  action: text("action").notNull(), // 'view_product', 'purchase', 'view_food', 'search'
  itemId: text("item_id"),
  itemType: text("item_type"), // 'product' or 'food'
  location: text("location"),
  timestamp: timestamp("timestamp").notNull().default(sql`now()`),
});

export const insertUserActivitySchema = createInsertSchema(userActivity).omit({
  id: true,
  timestamp: true,
});

export type InsertUserActivity = z.infer<typeof insertUserActivitySchema>;
export type UserActivity = typeof userActivity.$inferSelect;

// Admin analytics data
export type AdminAnalytics = {
  totalSales: number;
  totalUsers: number;
  totalIKBDistributed: number;
  salesByRegion: { region: string; sales: number }[];
  recentTransactions: Transaction[];
  activeUsers: number;
};

// AI-generated content types
export type DailyStory = {
  text: string;
  generatedAt: string;
};

export type ProductRecommendation = {
  productId: string;
  reason: string;
  confidence: number;
};

// Geolocation data
export type GeolocationData = {
  city: string;
  region: string;
  country: string;
  countryCode: string;
  latitude: number;
  longitude: number;
};
