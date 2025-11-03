import { sql } from "drizzle-orm";
import { pgTable, text, varchar, real, integer, timestamp, boolean, jsonb, index } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Session storage table for Replit Auth
// (IMPORTANT) This table is mandatory for Replit Auth, don't drop it.
export const sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: jsonb("sess").notNull(),
    expire: timestamp("expire").notNull(),
  },
  (table) => [index("IDX_session_expire").on(table.expire)],
);

// User storage table for Replit Auth
// (IMPORTANT) This table is mandatory for Replit Auth, don't drop it.
export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  email: varchar("email").unique(),
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  profileImageUrl: varchar("profile_image_url"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export type UpsertUser = typeof users.$inferInsert;
export type User = typeof users.$inferSelect;

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

// ========================================
// IKABAY CONNECT v1.2 - WhatsApp + Voice AI
// ========================================

// Partners (delivery drivers, relay operators)
export const partners = pgTable("partners", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: text("user_id").notNull(),
  phone: varchar("phone").notNull().unique(),
  whatsappNumber: varchar("whatsapp_number"),
  type: text("type").notNull(), // 'delivery_driver', 'relay_operator'
  status: text("status").notNull().default('pending'), // 'pending', 'approved', 'suspended'
  vehicleType: text("vehicle_type"), // 'scooter', 'car', 'bike'
  zone: text("zone"), // 'martinique', 'guadeloupe', etc.
  ikbBalance: real("ikb_balance").notNull().default(0),
  totalDeliveries: integer("total_deliveries").notNull().default(0),
  rating: real("rating").default(5.0),
  createdAt: timestamp("created_at").defaultNow(),
  approvedAt: timestamp("approved_at"),
});

export const insertPartnerSchema = createInsertSchema(partners).omit({
  id: true,
  createdAt: true,
  approvedAt: true,
});

export type InsertPartner = z.infer<typeof insertPartnerSchema>;
export type Partner = typeof partners.$inferSelect;

// Missions (delivery tasks)
export const missions = pgTable("missions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  customerId: text("customer_id").notNull(),
  partnerId: text("partner_id"),
  type: text("type").notNull(), // 'delivery', 'pickup', 'relay'
  status: text("status").notNull().default('pending'), // 'pending', 'assigned', 'in_progress', 'completed', 'cancelled'
  itemDescription: text("item_description").notNull(),
  pickupLocation: text("pickup_location").notNull(),
  deliveryLocation: text("delivery_location").notNull(),
  pickupCoords: jsonb("pickup_coords"), // {lat, lng}
  deliveryCoords: jsonb("delivery_coords"), // {lat, lng}
  ikbReward: real("ikb_reward").notNull().default(10),
  customerNotes: text("customer_notes"),
  partnerNotes: text("partner_notes"),
  createdAt: timestamp("created_at").defaultNow(),
  assignedAt: timestamp("assigned_at"),
  completedAt: timestamp("completed_at"),
});

export const insertMissionSchema = createInsertSchema(missions).omit({
  id: true,
  createdAt: true,
  assignedAt: true,
  completedAt: true,
});

export type InsertMission = z.infer<typeof insertMissionSchema>;
export type Mission = typeof missions.$inferSelect;

// Relays (pickup points, storage locations)
export const relays = pgTable("relays", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  operatorId: text("operator_id"),
  address: text("address").notNull(),
  coords: jsonb("coords"), // {lat, lng}
  zone: text("zone").notNull(),
  phone: varchar("phone").notNull(),
  whatsappNumber: varchar("whatsapp_number"),
  capacity: integer("capacity").notNull().default(50), // number of packages
  currentLoad: integer("current_load").notNull().default(0),
  status: text("status").notNull().default('active'), // 'active', 'inactive', 'full'
  hoursOpen: text("hours_open"), // "8h-20h"
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertRelaySchema = createInsertSchema(relays).omit({
  id: true,
  createdAt: true,
});

export type InsertRelay = z.infer<typeof insertRelaySchema>;
export type Relay = typeof relays.$inferSelect;

// WhatsApp sessions (conversation context)
export const whatsappSessions = pgTable("whatsapp_sessions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: text("user_id"),
  phone: varchar("phone").notNull().unique(),
  lastIntent: text("last_intent"), // 'nouvelle_livraison', 'valider_livraison', etc.
  context: jsonb("context"), // conversation state
  lastMessageAt: timestamp("last_message_at").defaultNow(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertWhatsAppSessionSchema = createInsertSchema(whatsappSessions).omit({
  id: true,
  createdAt: true,
  lastMessageAt: true,
});

export type InsertWhatsAppSession = z.infer<typeof insertWhatsAppSessionSchema>;
export type WhatsAppSession = typeof whatsappSessions.$inferSelect;

// Voice logs (AI voice interaction history)
export const voiceLogs = pgTable("voice_logs", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: text("user_id"),
  phone: varchar("phone").notNull(),
  message: text("message").notNull(), // transcribed text
  intent: text("intent"), // detected intent
  response: text("response"), // AI response
  audioUrl: text("audio_url"), // URL to voice response MP3
  processingTime: integer("processing_time"), // milliseconds
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertVoiceLogSchema = createInsertSchema(voiceLogs).omit({
  id: true,
  createdAt: true,
});

export type InsertVoiceLog = z.infer<typeof insertVoiceLogSchema>;
export type VoiceLog = typeof voiceLogs.$inferSelect;

// Rewards history (IKB distribution tracking)
export const rewardsHistory = pgTable("rewards_history", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: text("user_id").notNull(),
  type: text("type").notNull(), // 'delivery_completed', 'relay_approved', 'fast_response'
  ikbAmount: real("ikb_amount").notNull(),
  relatedMissionId: text("related_mission_id"),
  relatedPartnerId: text("related_partner_id"),
  description: text("description").notNull(),
  timestamp: timestamp("timestamp").notNull().default(sql`now()`),
});

export const insertRewardsHistorySchema = createInsertSchema(rewardsHistory).omit({
  id: true,
  timestamp: true,
});

export type InsertRewardsHistory = z.infer<typeof insertRewardsHistorySchema>;
export type RewardsHistory = typeof rewardsHistory.$inferSelect;

// AI Intent types for WhatsApp interactions
export type AIIntent = 
  | 'nouvelle_livraison'
  | 'valider_livraison'
  | 'demande_statut'
  | 'devenir_relais'
  | 'voir_solde'
  | 'unknown';

export type WhatsAppMessage = {
  from: string;
  body: string;
  mediaUrl?: string;
  mediaType?: string;
};

export type AIIntentResponse = {
  intent: AIIntent;
  response: string;
  audioUrl?: string;
  action?: string;
  data?: any;
};
