import { 
  type Product, type InsertProduct,
  type FoodItem, type InsertFoodItem,
  type Wallet, type InsertWallet,
  type Transaction, type InsertTransaction,
  type UserActivity, type InsertUserActivity,
  type User, type UpsertUser,
  type Partner, type InsertPartner,
  type Mission, type InsertMission,
  type Relay, type InsertRelay,
  type WhatsAppSession, type InsertWhatsAppSession,
  type VoiceLog, type InsertVoiceLog,
  type RewardsHistory, type InsertRewardsHistory,
  type Artisan, type InsertArtisan,
  type ProduitLocal, type InsertProduitLocal,
  type LegalSignature, type InsertLegalSignature,
  type PartnerReview, type InsertPartnerReview,
  type ZoneSuggestion, type InsertZoneSuggestion,
  type DropshippingSupplier, type InsertDropshippingSupplier,
  type ProductSyncLog, type InsertProductSyncLog,
  products, foodItems, wallets, transactions, userActivity, users,
  partners, missions, relays, whatsappSessions, voiceLogs, rewardsHistory,
  artisans, produitsLocaux, legalSignatures, partnerReviews, zoneSuggestions,
  dropshippingSuppliers, productSyncLogs
} from "@shared/schema";
import { db } from "./db";
import { eq, desc } from "drizzle-orm";

export interface IStorage {
  // User operations (for Replit Auth)
  getUser(id: string): Promise<User | undefined>;
  upsertUser(user: UpsertUser): Promise<User>;
  
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
  getAllWallets(): Promise<Wallet[]>;
  createWallet(wallet: InsertWallet): Promise<Wallet>;
  updateWallet(userId: string, updates: Partial<Wallet>): Promise<Wallet>;
  
  // Transactions
  getTransactions(userId: string): Promise<Transaction[]>;
  getAllTransactions(): Promise<Transaction[]>;
  createTransaction(transaction: InsertTransaction): Promise<Transaction>;
  
  // User Activity
  getUserActivity(userId: string): Promise<UserActivity[]>;
  createUserActivity(activity: InsertUserActivity): Promise<UserActivity>;
  
  // Partners (IKABAY CONNECT v1.2)
  getPartner(id: string): Promise<Partner | undefined>;
  getPartnerByPhone(phone: string): Promise<Partner | undefined>;
  getPartnerByUserId(userId: string): Promise<Partner | undefined>;
  getPartners(): Promise<Partner[]>;
  getPartnersByStatus(status: string): Promise<Partner[]>;
  createPartner(partner: InsertPartner): Promise<Partner>;
  updatePartner(id: string, updates: Partial<Partner>): Promise<Partner>;
  
  // Missions (IKABAY CONNECT v1.2)
  getMission(id: string): Promise<Mission | undefined>;
  getMissionsByCustomer(customerId: string): Promise<Mission[]>;
  getMissionsByPartner(partnerId: string): Promise<Mission[]>;
  getMissionsByStatus(status: string): Promise<Mission[]>;
  getAllMissions(): Promise<Mission[]>;
  createMission(mission: InsertMission): Promise<Mission>;
  updateMission(id: string, updates: Partial<Mission>): Promise<Mission>;
  
  // Relays (IKABAY CONNECT v1.2)
  getRelay(id: string): Promise<Relay | undefined>;
  getRelays(): Promise<Relay[]>;
  getRelaysByZone(zone: string): Promise<Relay[]>;
  createRelay(relay: InsertRelay): Promise<Relay>;
  updateRelay(id: string, updates: Partial<Relay>): Promise<Relay>;
  
  // WhatsApp Sessions (IKABAY CONNECT v1.2)
  getWhatsAppSession(phone: string): Promise<WhatsAppSession | undefined>;
  createWhatsAppSession(session: InsertWhatsAppSession): Promise<WhatsAppSession>;
  updateWhatsAppSession(phone: string, updates: Partial<WhatsAppSession>): Promise<WhatsAppSession>;
  
  // Voice Logs (IKABAY CONNECT v1.2)
  getVoiceLogs(userId: string): Promise<VoiceLog[]>;
  getRecentVoiceLogs(limit: number): Promise<VoiceLog[]>;
  createVoiceLog(log: InsertVoiceLog): Promise<VoiceLog>;
  
  // Rewards History (IKABAY CONNECT v1.2)
  getRewardsHistory(userId: string): Promise<RewardsHistory[]>;
  getAllRewardsHistory(): Promise<RewardsHistory[]>;
  createRewardsHistory(reward: InsertRewardsHistory): Promise<RewardsHistory>;
  
  // Artisans (IKABAY EMPIRE v2.2)
  getArtisan(id: string): Promise<Artisan | undefined>;
  getArtisans(): Promise<Artisan[]>;
  getArtisansByRegion(region: string): Promise<Artisan[]>;
  createArtisan(artisan: InsertArtisan): Promise<Artisan>;
  updateArtisan(id: string, updates: Partial<Artisan>): Promise<Artisan>;
  
  // Produits Locaux (IKABAY EMPIRE v2.2)
  getProduitLocal(id: string): Promise<ProduitLocal | undefined>;
  getProduitsLocaux(): Promise<ProduitLocal[]>;
  getProduitsByArtisan(artisanId: string): Promise<ProduitLocal[]>;
  createProduitLocal(produit: InsertProduitLocal): Promise<ProduitLocal>;
  updateProduitLocal(id: string, updates: Partial<ProduitLocal>): Promise<ProduitLocal>;
  
  // Legal Signatures (IKABAY EMPIRE v2.2)
  getLegalSignature(id: string): Promise<LegalSignature | undefined>;
  getLegalSignatures(): Promise<LegalSignature[]>;
  getLegalSignaturesByStatus(status: string): Promise<LegalSignature[]>;
  createLegalSignature(signature: InsertLegalSignature): Promise<LegalSignature>;
  updateLegalSignature(id: string, updates: Partial<LegalSignature>): Promise<LegalSignature>;
  
  // Partner Reviews (IKABAY EMPIRE v2.4 - Trust & Flow)
  getPartnerReview(id: string): Promise<PartnerReview | undefined>;
  getPartnerReviews(): Promise<PartnerReview[]>;
  getReviewsByPartner(partnerId: string): Promise<PartnerReview[]>;
  getReviewsByCustomer(customerId: string): Promise<PartnerReview[]>;
  getVerifiedReviews(): Promise<PartnerReview[]>;
  createPartnerReview(review: InsertPartnerReview): Promise<PartnerReview>;
  updatePartnerReview(id: string, updates: Partial<PartnerReview>): Promise<PartnerReview>;
  
  // Zone Suggestions (IKABAY EMPIRE v2.4 - AI Optimizer)
  getZoneSuggestion(id: string): Promise<ZoneSuggestion | undefined>;
  getZoneSuggestions(): Promise<ZoneSuggestion[]>;
  getZoneSuggestionsByZone(zone: string): Promise<ZoneSuggestion[]>;
  getZoneSuggestionsByStatus(status: string): Promise<ZoneSuggestion[]>;
  getTopPrioritySuggestions(limit: number): Promise<ZoneSuggestion[]>;
  createZoneSuggestion(suggestion: InsertZoneSuggestion): Promise<ZoneSuggestion>;
  updateZoneSuggestion(id: string, updates: Partial<ZoneSuggestion>): Promise<ZoneSuggestion>;
  
  // Dropshipping Suppliers (IKABAY EMPIRE v2.4 - AutoDS/CJ/Zendrop)
  getDropshippingSupplier(id: string): Promise<DropshippingSupplier | undefined>;
  getDropshippingSupplierByCode(code: string): Promise<DropshippingSupplier | undefined>;
  getDropshippingSuppliers(): Promise<DropshippingSupplier[]>;
  getActiveSuppliers(): Promise<DropshippingSupplier[]>;
  createDropshippingSupplier(supplier: InsertDropshippingSupplier): Promise<DropshippingSupplier>;
  updateDropshippingSupplier(id: string, updates: Partial<DropshippingSupplier>): Promise<DropshippingSupplier>;
  
  // Product Sync Logs (IKABAY EMPIRE v2.4 - Dropshipping)
  getProductSyncLog(id: string): Promise<ProductSyncLog | undefined>;
  getProductSyncLogs(): Promise<ProductSyncLog[]>;
  getSyncLogsBySupplier(supplierId: string): Promise<ProductSyncLog[]>;
  getRecentSyncLogs(limit: number): Promise<ProductSyncLog[]>;
  createProductSyncLog(log: InsertProductSyncLog): Promise<ProductSyncLog>;
  updateProductSyncLog(id: string, updates: Partial<ProductSyncLog>): Promise<ProductSyncLog>;
  
  // Products - Extended for dropshipping
  getProductsBySource(source: string): Promise<Product[]>;
  getProductByExternalId(externalId: string, source: string): Promise<Product | undefined>;
  updateProduct(id: string, updates: Partial<Product>): Promise<Product>;
}

export class DatabaseStorage implements IStorage {
  // User operations (for Replit Auth)
  async getUser(id: string): Promise<User | undefined> {
    const result = await db.select().from(users).where(eq(users.id, id));
    return result[0];
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    const result = await db
      .insert(users)
      .values(userData)
      .onConflictDoUpdate({
        target: users.id,
        set: {
          ...userData,
          updatedAt: new Date(),
        },
      })
      .returning();
    return result[0];
  }

  // Products
  async getProducts(): Promise<Product[]> {
    return await db.select().from(products);
  }

  async getProduct(id: string): Promise<Product | undefined> {
    const result = await db.select().from(products).where(eq(products.id, id));
    return result[0];
  }

  async createProduct(insertProduct: InsertProduct): Promise<Product> {
    const result = await db.insert(products).values(insertProduct).returning();
    return result[0];
  }

  // Food Items
  async getFoodItems(): Promise<FoodItem[]> {
    return await db.select().from(foodItems);
  }

  async getFoodItem(id: string): Promise<FoodItem | undefined> {
    const result = await db.select().from(foodItems).where(eq(foodItems.id, id));
    return result[0];
  }

  async createFoodItem(insertFood: InsertFoodItem): Promise<FoodItem> {
    const result = await db.insert(foodItems).values(insertFood).returning();
    return result[0];
  }

  // Wallet
  async getWallet(userId: string): Promise<Wallet | undefined> {
    const result = await db.select().from(wallets).where(eq(wallets.userId, userId));
    return result[0];
  }

  async getAllWallets(): Promise<Wallet[]> {
    return await db.select().from(wallets);
  }

  async createWallet(insertWallet: InsertWallet): Promise<Wallet> {
    const result = await db.insert(wallets).values(insertWallet).returning();
    return result[0];
  }

  async updateWallet(userId: string, updates: Partial<Wallet>): Promise<Wallet> {
    const result = await db
      .update(wallets)
      .set(updates)
      .where(eq(wallets.userId, userId))
      .returning();
    
    if (!result[0]) {
      throw new Error("Wallet not found");
    }
    return result[0];
  }

  // Transactions
  async getTransactions(userId: string): Promise<Transaction[]> {
    return await db
      .select()
      .from(transactions)
      .where(eq(transactions.userId, userId))
      .orderBy(desc(transactions.timestamp));
  }

  async getAllTransactions(): Promise<Transaction[]> {
    return await db.select().from(transactions).orderBy(desc(transactions.timestamp));
  }

  async createTransaction(insertTransaction: InsertTransaction): Promise<Transaction> {
    const result = await db.insert(transactions).values(insertTransaction).returning();
    return result[0];
  }

  // User Activity
  async getUserActivity(userId: string): Promise<UserActivity[]> {
    return await db.select().from(userActivity).where(eq(userActivity.userId, userId));
  }

  async createUserActivity(insertActivity: InsertUserActivity): Promise<UserActivity> {
    const result = await db.insert(userActivity).values(insertActivity).returning();
    return result[0];
  }

  // Partners (IKABAY CONNECT v1.2)
  async getPartner(id: string): Promise<Partner | undefined> {
    const result = await db.select().from(partners).where(eq(partners.id, id));
    return result[0];
  }

  async getPartnerByPhone(phone: string): Promise<Partner | undefined> {
    const result = await db.select().from(partners).where(eq(partners.phone, phone));
    return result[0];
  }

  async getPartnerByUserId(userId: string): Promise<Partner | undefined> {
    const result = await db.select().from(partners).where(eq(partners.userId, userId));
    return result[0];
  }

  async getPartners(): Promise<Partner[]> {
    return await db.select().from(partners);
  }

  async getPartnersByStatus(status: string): Promise<Partner[]> {
    return await db.select().from(partners).where(eq(partners.status, status));
  }

  async createPartner(insertPartner: InsertPartner): Promise<Partner> {
    const result = await db.insert(partners).values(insertPartner).returning();
    return result[0];
  }

  async updatePartner(id: string, updates: Partial<Partner>): Promise<Partner> {
    const result = await db
      .update(partners)
      .set(updates)
      .where(eq(partners.id, id))
      .returning();
    
    if (!result[0]) {
      throw new Error("Partner not found");
    }
    return result[0];
  }

  // Missions (IKABAY CONNECT v1.2)
  async getMission(id: string): Promise<Mission | undefined> {
    const result = await db.select().from(missions).where(eq(missions.id, id));
    return result[0];
  }

  async getMissionsByCustomer(customerId: string): Promise<Mission[]> {
    return await db
      .select()
      .from(missions)
      .where(eq(missions.customerId, customerId))
      .orderBy(desc(missions.createdAt));
  }

  async getMissionsByPartner(partnerId: string): Promise<Mission[]> {
    return await db
      .select()
      .from(missions)
      .where(eq(missions.partnerId, partnerId))
      .orderBy(desc(missions.createdAt));
  }

  async getMissionsByStatus(status: string): Promise<Mission[]> {
    return await db
      .select()
      .from(missions)
      .where(eq(missions.status, status))
      .orderBy(desc(missions.createdAt));
  }

  async getAllMissions(): Promise<Mission[]> {
    return await db.select().from(missions).orderBy(desc(missions.createdAt));
  }

  async createMission(insertMission: InsertMission): Promise<Mission> {
    const result = await db.insert(missions).values(insertMission).returning();
    return result[0];
  }

  async updateMission(id: string, updates: Partial<Mission>): Promise<Mission> {
    const result = await db
      .update(missions)
      .set(updates)
      .where(eq(missions.id, id))
      .returning();
    
    if (!result[0]) {
      throw new Error("Mission not found");
    }
    return result[0];
  }

  // Relays (IKABAY CONNECT v1.2)
  async getRelay(id: string): Promise<Relay | undefined> {
    const result = await db.select().from(relays).where(eq(relays.id, id));
    return result[0];
  }

  async getRelays(): Promise<Relay[]> {
    return await db.select().from(relays);
  }

  async getRelaysByZone(zone: string): Promise<Relay[]> {
    return await db.select().from(relays).where(eq(relays.zone, zone));
  }

  async createRelay(insertRelay: InsertRelay): Promise<Relay> {
    const result = await db.insert(relays).values(insertRelay).returning();
    return result[0];
  }

  async updateRelay(id: string, updates: Partial<Relay>): Promise<Relay> {
    const result = await db
      .update(relays)
      .set(updates)
      .where(eq(relays.id, id))
      .returning();
    
    if (!result[0]) {
      throw new Error("Relay not found");
    }
    return result[0];
  }

  // WhatsApp Sessions (IKABAY CONNECT v1.2)
  async getWhatsAppSession(phone: string): Promise<WhatsAppSession | undefined> {
    const result = await db.select().from(whatsappSessions).where(eq(whatsappSessions.phone, phone));
    return result[0];
  }

  async createWhatsAppSession(insertSession: InsertWhatsAppSession): Promise<WhatsAppSession> {
    const result = await db.insert(whatsappSessions).values(insertSession).returning();
    return result[0];
  }

  async updateWhatsAppSession(phone: string, updates: Partial<WhatsAppSession>): Promise<WhatsAppSession> {
    const result = await db
      .update(whatsappSessions)
      .set({ ...updates, lastMessageAt: new Date() })
      .where(eq(whatsappSessions.phone, phone))
      .returning();
    
    if (!result[0]) {
      throw new Error("WhatsApp session not found");
    }
    return result[0];
  }

  // Voice Logs (IKABAY CONNECT v1.2)
  async getVoiceLogs(userId: string): Promise<VoiceLog[]> {
    return await db
      .select()
      .from(voiceLogs)
      .where(eq(voiceLogs.userId, userId))
      .orderBy(desc(voiceLogs.createdAt));
  }

  async getRecentVoiceLogs(limit: number): Promise<VoiceLog[]> {
    return await db
      .select()
      .from(voiceLogs)
      .orderBy(desc(voiceLogs.createdAt))
      .limit(limit);
  }

  async createVoiceLog(insertLog: InsertVoiceLog): Promise<VoiceLog> {
    const result = await db.insert(voiceLogs).values(insertLog).returning();
    return result[0];
  }

  // Rewards History (IKABAY CONNECT v1.2)
  async getRewardsHistory(userId: string): Promise<RewardsHistory[]> {
    return await db
      .select()
      .from(rewardsHistory)
      .where(eq(rewardsHistory.userId, userId))
      .orderBy(desc(rewardsHistory.timestamp));
  }

  async getAllRewardsHistory(): Promise<RewardsHistory[]> {
    return await db.select().from(rewardsHistory).orderBy(desc(rewardsHistory.timestamp));
  }

  async createRewardsHistory(insertReward: InsertRewardsHistory): Promise<RewardsHistory> {
    const result = await db.insert(rewardsHistory).values(insertReward).returning();
    return result[0];
  }

  // Artisans (IKABAY EMPIRE v2.2)
  async getArtisan(id: string): Promise<Artisan | undefined> {
    const result = await db.select().from(artisans).where(eq(artisans.id, id));
    return result[0];
  }

  async getArtisans(): Promise<Artisan[]> {
    return await db.select().from(artisans);
  }

  async getArtisansByRegion(region: string): Promise<Artisan[]> {
    return await db.select().from(artisans).where(eq(artisans.region, region));
  }

  async createArtisan(insertArtisan: InsertArtisan): Promise<Artisan> {
    const result = await db.insert(artisans).values(insertArtisan).returning();
    return result[0];
  }

  async updateArtisan(id: string, updates: Partial<Artisan>): Promise<Artisan> {
    const result = await db
      .update(artisans)
      .set(updates)
      .where(eq(artisans.id, id))
      .returning();
    
    if (!result[0]) {
      throw new Error("Artisan not found");
    }
    return result[0];
  }

  // Produits Locaux (IKABAY EMPIRE v2.2)
  async getProduitLocal(id: string): Promise<ProduitLocal | undefined> {
    const result = await db.select().from(produitsLocaux).where(eq(produitsLocaux.id, id));
    return result[0];
  }

  async getProduitsLocaux(): Promise<ProduitLocal[]> {
    return await db.select().from(produitsLocaux);
  }

  async getProduitsByArtisan(artisanId: string): Promise<ProduitLocal[]> {
    return await db.select().from(produitsLocaux).where(eq(produitsLocaux.artisanId, artisanId));
  }

  async createProduitLocal(insertProduit: InsertProduitLocal): Promise<ProduitLocal> {
    const result = await db.insert(produitsLocaux).values(insertProduit).returning();
    return result[0];
  }

  async updateProduitLocal(id: string, updates: Partial<ProduitLocal>): Promise<ProduitLocal> {
    const result = await db
      .update(produitsLocaux)
      .set(updates)
      .where(eq(produitsLocaux.id, id))
      .returning();
    
    if (!result[0]) {
      throw new Error("Produit local not found");
    }
    return result[0];
  }

  // Legal Signatures (IKABAY EMPIRE v2.2)
  async getLegalSignature(id: string): Promise<LegalSignature | undefined> {
    const result = await db.select().from(legalSignatures).where(eq(legalSignatures.id, id));
    return result[0];
  }

  async getLegalSignatures(): Promise<LegalSignature[]> {
    return await db.select().from(legalSignatures);
  }

  async getLegalSignaturesByStatus(status: string): Promise<LegalSignature[]> {
    return await db.select().from(legalSignatures).where(eq(legalSignatures.status, status));
  }

  async createLegalSignature(insertSignature: InsertLegalSignature): Promise<LegalSignature> {
    const result = await db.insert(legalSignatures).values(insertSignature).returning();
    return result[0];
  }

  async updateLegalSignature(id: string, updates: Partial<LegalSignature>): Promise<LegalSignature> {
    const result = await db
      .update(legalSignatures)
      .set(updates)
      .where(eq(legalSignatures.id, id))
      .returning();
    
    if (!result[0]) {
      throw new Error("Legal signature not found");
    }
    return result[0];
  }

  // Partner Reviews (IKABAY EMPIRE v2.4 - Trust & Flow)
  async getPartnerReview(id: string): Promise<PartnerReview | undefined> {
    const result = await db.select().from(partnerReviews).where(eq(partnerReviews.id, id));
    return result[0];
  }

  async getPartnerReviews(): Promise<PartnerReview[]> {
    return await db.select().from(partnerReviews).orderBy(desc(partnerReviews.createdAt));
  }

  async getReviewsByPartner(partnerId: string): Promise<PartnerReview[]> {
    return await db.select().from(partnerReviews)
      .where(eq(partnerReviews.partnerId, partnerId))
      .orderBy(desc(partnerReviews.createdAt));
  }

  async getReviewsByCustomer(customerId: string): Promise<PartnerReview[]> {
    return await db.select().from(partnerReviews)
      .where(eq(partnerReviews.customerId, customerId))
      .orderBy(desc(partnerReviews.createdAt));
  }

  async getVerifiedReviews(): Promise<PartnerReview[]> {
    return await db.select().from(partnerReviews)
      .where(eq(partnerReviews.verified, true))
      .orderBy(desc(partnerReviews.createdAt));
  }

  async createPartnerReview(insertReview: InsertPartnerReview): Promise<PartnerReview> {
    const result = await db.insert(partnerReviews).values(insertReview).returning();
    return result[0];
  }

  async updatePartnerReview(id: string, updates: Partial<PartnerReview>): Promise<PartnerReview> {
    const result = await db
      .update(partnerReviews)
      .set(updates)
      .where(eq(partnerReviews.id, id))
      .returning();
    
    if (!result[0]) {
      throw new Error("Partner review not found");
    }
    return result[0];
  }

  // Zone Suggestions (IKABAY EMPIRE v2.4 - AI Optimizer)
  async getZoneSuggestion(id: string): Promise<ZoneSuggestion | undefined> {
    const result = await db.select().from(zoneSuggestions).where(eq(zoneSuggestions.id, id));
    return result[0];
  }

  async getZoneSuggestions(): Promise<ZoneSuggestion[]> {
    return await db.select().from(zoneSuggestions).orderBy(desc(zoneSuggestions.priorityScore));
  }

  async getZoneSuggestionsByZone(zone: string): Promise<ZoneSuggestion[]> {
    return await db.select().from(zoneSuggestions)
      .where(eq(zoneSuggestions.zone, zone))
      .orderBy(desc(zoneSuggestions.priorityScore));
  }

  async getZoneSuggestionsByStatus(status: string): Promise<ZoneSuggestion[]> {
    return await db.select().from(zoneSuggestions)
      .where(eq(zoneSuggestions.status, status))
      .orderBy(desc(zoneSuggestions.priorityScore));
  }

  async getTopPrioritySuggestions(limit: number): Promise<ZoneSuggestion[]> {
    return await db.select().from(zoneSuggestions)
      .where(eq(zoneSuggestions.status, 'pending'))
      .orderBy(desc(zoneSuggestions.priorityScore))
      .limit(limit);
  }

  async createZoneSuggestion(insertSuggestion: InsertZoneSuggestion): Promise<ZoneSuggestion> {
    const result = await db.insert(zoneSuggestions).values(insertSuggestion).returning();
    return result[0];
  }

  async updateZoneSuggestion(id: string, updates: Partial<ZoneSuggestion>): Promise<ZoneSuggestion> {
    const result = await db
      .update(zoneSuggestions)
      .set(updates)
      .where(eq(zoneSuggestions.id, id))
      .returning();
    
    if (!result[0]) {
      throw new Error("Zone suggestion not found");
    }
    return result[0];
  }

  // Dropshipping Suppliers (IKABAY EMPIRE v2.4 - AutoDS/CJ/Zendrop)
  async getDropshippingSupplier(id: string): Promise<DropshippingSupplier | undefined> {
    const result = await db.select().from(dropshippingSuppliers).where(eq(dropshippingSuppliers.id, id));
    return result[0];
  }

  async getDropshippingSupplierByCode(code: string): Promise<DropshippingSupplier | undefined> {
    const result = await db.select().from(dropshippingSuppliers).where(eq(dropshippingSuppliers.code, code));
    return result[0];
  }

  async getDropshippingSuppliers(): Promise<DropshippingSupplier[]> {
    return await db.select().from(dropshippingSuppliers);
  }

  async getActiveSuppliers(): Promise<DropshippingSupplier[]> {
    return await db.select().from(dropshippingSuppliers).where(eq(dropshippingSuppliers.active, true));
  }

  async createDropshippingSupplier(insertSupplier: InsertDropshippingSupplier): Promise<DropshippingSupplier> {
    const result = await db.insert(dropshippingSuppliers).values(insertSupplier).returning();
    return result[0];
  }

  async updateDropshippingSupplier(id: string, updates: Partial<DropshippingSupplier>): Promise<DropshippingSupplier> {
    const result = await db
      .update(dropshippingSuppliers)
      .set(updates)
      .where(eq(dropshippingSuppliers.id, id))
      .returning();
    
    if (!result[0]) {
      throw new Error("Dropshipping supplier not found");
    }
    return result[0];
  }

  // Product Sync Logs (IKABAY EMPIRE v2.4 - Dropshipping)
  async getProductSyncLog(id: string): Promise<ProductSyncLog | undefined> {
    const result = await db.select().from(productSyncLogs).where(eq(productSyncLogs.id, id));
    return result[0];
  }

  async getProductSyncLogs(): Promise<ProductSyncLog[]> {
    return await db.select().from(productSyncLogs).orderBy(desc(productSyncLogs.createdAt));
  }

  async getSyncLogsBySupplier(supplierId: string): Promise<ProductSyncLog[]> {
    return await db.select().from(productSyncLogs)
      .where(eq(productSyncLogs.supplierId, supplierId))
      .orderBy(desc(productSyncLogs.createdAt));
  }

  async getRecentSyncLogs(limit: number): Promise<ProductSyncLog[]> {
    return await db.select().from(productSyncLogs)
      .orderBy(desc(productSyncLogs.createdAt))
      .limit(limit);
  }

  async createProductSyncLog(insertLog: InsertProductSyncLog): Promise<ProductSyncLog> {
    const result = await db.insert(productSyncLogs).values(insertLog).returning();
    return result[0];
  }

  async updateProductSyncLog(id: string, updates: Partial<ProductSyncLog>): Promise<ProductSyncLog> {
    const result = await db
      .update(productSyncLogs)
      .set(updates)
      .where(eq(productSyncLogs.id, id))
      .returning();
    
    if (!result[0]) {
      throw new Error("Product sync log not found");
    }
    return result[0];
  }

  // Products - Extended for dropshipping
  async getProductsBySource(source: string): Promise<Product[]> {
    return await db.select().from(products).where(eq(products.source, source));
  }

  async getProductByExternalId(externalId: string, source: string): Promise<Product | undefined> {
    const result = await db.select().from(products)
      .where(eq(products.externalId, externalId));
    const filtered = result.filter(p => p.source === source);
    return filtered[0];
  }

  async updateProduct(id: string, updates: Partial<Product>): Promise<Product> {
    const result = await db
      .update(products)
      .set(updates)
      .where(eq(products.id, id))
      .returning();
    
    if (!result[0]) {
      throw new Error("Product not found");
    }
    return result[0];
  }
}

export const storage = new DatabaseStorage();
