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

// ========================================
// IKABAY EMPIRE v2.2 - LOCAL STARS
// ========================================

// Artisans (local Caribbean producers)
export const artisans = pgTable("artisans", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  bio: text("bio").notNull(),
  region: text("region").notNull(), // 'Martinique', 'Guadeloupe', etc.
  image: text("image").notNull(),
  videoUrl: text("video_url"),
  specialty: text("specialty").notNull(), // 'Artisan de rhum', 'Créateur de bijoux', etc.
  certified: boolean("certified").notNull().default(true), // 'Made in Caribbean' certification
  contactEmail: varchar("contact_email"),
  contactPhone: varchar("contact_phone"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertArtisanSchema = createInsertSchema(artisans).omit({
  id: true,
  createdAt: true,
});

export type InsertArtisan = z.infer<typeof insertArtisanSchema>;
export type Artisan = typeof artisans.$inferSelect;

// Local products (Caribbean-made items)
export const produitsLocaux = pgTable("produits_locaux", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  artisanId: text("artisan_id").notNull(),
  name: text("name").notNull(),
  price: real("price").notNull(),
  description: text("description").notNull(),
  storyFr: text("story_fr"), // AI-generated storytelling in French
  storyEn: text("story_en"), // AI-generated storytelling in English
  storyCreole: text("story_creole"), // AI-generated storytelling in Creole
  images: text("images").array().notNull(), // multiple product images
  videoUrl: text("video_url"),
  origin: text("origin").notNull(), // specific location/island
  inStock: boolean("in_stock").notNull().default(true),
  certifiedLocal: boolean("certified_local").notNull().default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertProduitLocalSchema = createInsertSchema(produitsLocaux).omit({
  id: true,
  createdAt: true,
});

export type InsertProduitLocal = z.infer<typeof insertProduitLocalSchema>;
export type ProduitLocal = typeof produitsLocaux.$inferSelect;

// Legal signatures (partner consent tracking)
export const legalSignatures = pgTable("legal_signatures", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: text("user_id"),
  partnerType: text("partner_type").notNull(), // 'livreur', 'relais', 'fournisseur'
  name: text("name").notNull(),
  email: varchar("email").notNull(),
  phone: varchar("phone").notNull(),
  siret: varchar("siret"), // French business ID
  zone: text("zone").notNull(),
  cgvAccepted: boolean("cgv_accepted").notNull().default(false),
  liabilityAccepted: boolean("liability_accepted").notNull().default(false),
  ipAddress: varchar("ip_address"),
  signatureData: text("signature_data"), // digital signature image/data
  documentUrls: text("document_urls").array(), // uploaded documents
  status: text("status").notNull().default('pending'), // 'pending', 'approved', 'rejected'
  createdAt: timestamp("created_at").defaultNow(),
  approvedAt: timestamp("approved_at"),
});

export const insertLegalSignatureSchema = createInsertSchema(legalSignatures).omit({
  id: true,
  createdAt: true,
  approvedAt: true,
});

export type InsertLegalSignature = z.infer<typeof insertLegalSignatureSchema>;
export type LegalSignature = typeof legalSignatures.$inferSelect;

// ========================================
// IKABAY EMPIRE v2.4 - TRUST & FLOW ENGINE
// ========================================

// Partner reviews (AI-verified feedback on delivery/relay partners)
export const partnerReviews = pgTable("partner_reviews", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  partnerId: text("partner_id").notNull(),
  customerId: text("customer_id").notNull(),
  missionId: text("mission_id"),
  // 3 criteria scoring (1-5 scale)
  costScore: integer("cost_score").notNull(), // Prix acceptable
  qualityScore: integer("quality_score").notNull(), // Qualité service
  serviceScore: integer("service_score").notNull(), // Rapidité et professionnalisme
  // Aggregate
  overallScore: real("overall_score").notNull(), // Average of 3 criteria
  comment: text("comment"),
  aiVerified: boolean("ai_verified").notNull().default(false), // AI checked for authenticity
  aiConfidence: real("ai_confidence"), // 0-1 AI verification confidence
  aiFakeDetection: text("ai_fake_detection"), // AI notes on potential fake review
  verified: boolean("verified").notNull().default(false), // Final verified status
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertPartnerReviewSchema = createInsertSchema(partnerReviews).omit({
  id: true,
  createdAt: true,
});

export type InsertPartnerReview = z.infer<typeof insertPartnerReviewSchema>;
export type PartnerReview = typeof partnerReviews.$inferSelect;

// Zone suggestions (AI-generated recommendations for relay/delivery coverage gaps)
export const zoneSuggestions = pgTable("zone_suggestions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  zone: text("zone").notNull(), // 'Martinique', 'Guadeloupe', etc.
  suggestedType: text("suggested_type").notNull(), // 'relay', 'delivery_driver', 'food_partner'
  coords: jsonb("coords").notNull(), // {lat, lng} suggested location
  address: text("address"),
  // AI analysis data
  orderDensity: integer("order_density").notNull(), // Orders per week in area
  populationDensity: integer("population_density"), // People per km²
  currentCoverage: real("current_coverage").notNull(), // 0-1 scale (0 = no coverage, 1 = full coverage)
  estimatedDemand: real("estimated_demand").notNull(), // Projected weekly deliveries
  priorityScore: real("priority_score").notNull(), // 0-100 AI-calculated priority
  // Gemini AI reasoning
  aiReasoning: text("ai_reasoning").notNull(), // AI explanation for suggestion
  confidenceLevel: real("confidence_level").notNull(), // 0-1 AI confidence
  status: text("status").notNull().default('pending'), // 'pending', 'accepted', 'rejected', 'completed'
  createdAt: timestamp("created_at").defaultNow(),
  resolvedAt: timestamp("resolved_at"),
});

export const insertZoneSuggestionSchema = createInsertSchema(zoneSuggestions).omit({
  id: true,
  createdAt: true,
  resolvedAt: true,
});

export type InsertZoneSuggestion = z.infer<typeof insertZoneSuggestionSchema>;
export type ZoneSuggestion = typeof zoneSuggestions.$inferSelect;

// Route data for optimized delivery paths
export type RouteData = {
  distance: number; // km
  duration: number; // minutes
  geometry: any; // GeoJSON from OpenRouteService
  waypoints: {lat: number; lng: number}[];
};

// Relay with partner info (for frontend display)
export type RelayWithPartner = Relay & {
  operatorName?: string;
  operatorPhone?: string;
  operatorRating?: number;
};

// Mission with full details (for frontend display)
export type MissionWithDetails = Mission & {
  partnerName?: string;
  partnerPhone?: string;
  partnerRating?: number;
  customerName?: string;
  routeData?: RouteData;
};
