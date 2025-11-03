import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { openai } from "./lib/openai-client";
import { ai } from "./lib/gemini-client";
import { setupAuth, isAuthenticated } from "./replitAuth";

// Cache for daily story
let dailyStoryCache: { text: string; generatedAt: string } | null = null;
let lastStoryDate: string | null = null;

export async function registerRoutes(app: Express): Promise<Server> {
  // Setup Replit Auth (login, logout, callback routes)
  await setupAuth(app);

  const DEFAULT_USER_ID = "default";

  // AI Story - Daily Caribbean message from OpenAI
  app.get("/api/story", async (req, res) => {
    try {
      const today = new Date().toDateString();
      
      // Return cached story if it's from today
      if (dailyStoryCache && lastStoryDate === today) {
        return res.json(dailyStoryCache);
      }

      // the newest OpenAI model is "gpt-5" which was released August 7, 2025. do not change this unless explicitly requested by the user
      const response = await openai.chat.completions.create({
        model: "gpt-5",
        messages: [{
          role: "user",
          content: "Génère une phrase d'accueil chaleureuse et inspirante en français pour un site caribéen (IKABAY EMPIRE). Maximum 20 mots. Thème: découverte, communauté, et prospérité caribéenne."
        }],
        max_completion_tokens: 100,
      });

      const text = response.choices[0]?.message?.content || "Bienvenue à IKABAY EMPIRE - Votre écosystème caribéen";
      dailyStoryCache = {
        text,
        generatedAt: new Date().toISOString(),
      };
      lastStoryDate = today;

      res.json(dailyStoryCache);
    } catch (error) {
      console.error("Error generating story:", error);
      res.json({
        text: "Bienvenue à IKABAY EMPIRE - Découvrez, achetez, gagnez!",
        generatedAt: new Date().toISOString(),
      });
    }
  });

  // Geolocation - Get user location using ipapi.co
  app.get("/api/geolocation", async (req, res) => {
    try {
      const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress || 'check';
      const response = await fetch(`https://ipapi.co/${ip === '::1' ? 'check' : ip}/json/`);
      const data = await response.json();
      
      res.json({
        city: data.city || "Fort-de-France",
        region: data.region || "Martinique",
        country: data.country_name || "France",
        countryCode: data.country_code || "MQ",
        latitude: data.latitude || 14.6415,
        longitude: data.longitude || -61.0242,
      });
    } catch (error) {
      console.error("Error getting geolocation:", error);
      // Fallback to Fort-de-France, Martinique
      res.json({
        city: "Fort-de-France",
        region: "Martinique",
        country: "France",
        countryCode: "MQ",
        latitude: 14.6415,
        longitude: -61.0242,
      });
    }
  });

  // Auth user endpoint - Get authenticated user data
  app.get('/api/auth/user', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      res.json(user);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  // Products - Get all products
  app.get("/api/products", async (req, res) => {
    try {
      const products = await storage.getProducts();
      res.json(products);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch products" });
    }
  });

  // Food Items - Get all food items
  app.get("/api/food", async (req, res) => {
    try {
      const foodItems = await storage.getFoodItems();
      res.json(foodItems);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch food items" });
    }
  });

  // Wallet - Get wallet balance (protected route)
  app.get("/api/wallet", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      let wallet = await storage.getWallet(userId);
      if (!wallet) {
        wallet = await storage.createWallet({
          userId,
          balance: 0,
          totalEarned: 0,
          miningActive: false,
        });
      }
      res.json(wallet);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch wallet" });
    }
  });

  // Wallet - Toggle mining (protected route)
  app.post("/api/wallet/toggle-mining", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      let wallet = await storage.getWallet(userId);
      if (!wallet) {
        wallet = await storage.createWallet({
          userId,
          balance: 0,
          totalEarned: 0,
          miningActive: false,
        });
      }

      const newMiningState = !wallet.miningActive;
      
      // If turning on mining, add initial mining reward
      if (newMiningState) {
        const miningReward = 0.05;
        const updated = await storage.updateWallet(userId, {
          balance: wallet.balance + miningReward,
          totalEarned: wallet.totalEarned + miningReward,
          miningActive: true,
          lastMiningTime: new Date(),
        });

        // Create transaction
        await storage.createTransaction({
          userId,
          type: "mining",
          amount: miningReward,
          description: "Récompense de mining IKB",
        });

        res.json(updated);
      } else {
        const updated = await storage.updateWallet(userId, {
          miningActive: false,
        });
        res.json(updated);
      }
    } catch (error) {
      console.error("Error toggling mining:", error);
      res.status(500).json({ error: "Failed to toggle mining" });
    }
  });

  // Transactions - Get transaction history (protected route)
  app.get("/api/transactions", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const transactions = await storage.getTransactions(userId);
      res.json(transactions);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch transactions" });
    }
  });

  // Purchase - Buy a product with cashback (protected route)
  app.post("/api/purchase", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { productId } = req.body;
      
      const product = await storage.getProduct(productId);
      if (!product) {
        return res.status(404).json({ error: "Product not found" });
      }

      if (!product.inStock) {
        return res.status(400).json({ error: "Product out of stock" });
      }

      let wallet = await storage.getWallet(userId);
      if (!wallet) {
        wallet = await storage.createWallet({
          userId,
          balance: 0,
          totalEarned: 0,
          miningActive: false,
        });
      }

      // Calculate cashback (5%)
      const cashback = product.price * 0.05;

      // Update wallet with cashback
      const updated = await storage.updateWallet(userId, {
        balance: wallet.balance + cashback,
        totalEarned: wallet.totalEarned + cashback,
      });

      // Create purchase transaction
      await storage.createTransaction({
        userId,
        type: "purchase",
        amount: -product.price,
        description: `Achat: ${product.name}`,
      });

      // Create cashback transaction
      await storage.createTransaction({
        userId,
        type: "cashback",
        amount: cashback,
        description: `Cashback 5%: ${product.name}`,
      });

      // Track user activity
      await storage.createUserActivity({
        userId,
        action: "purchase",
        itemId: productId,
        itemType: "product",
        location: null,
      });

      res.json({ success: true, cashback, wallet: updated });
    } catch (error) {
      console.error("Error processing purchase:", error);
      res.status(500).json({ error: "Failed to process purchase" });
    }
  });

  // Share - Reward for sharing (protected route)
  app.post("/api/share", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { productId } = req.body;

      let wallet = await storage.getWallet(userId);
      if (!wallet) {
        wallet = await storage.createWallet({
          userId,
          balance: 0,
          totalEarned: 0,
          miningActive: false,
        });
      }

      const shareReward = 10;

      // Update wallet
      const updated = await storage.updateWallet(userId, {
        balance: wallet.balance + shareReward,
        totalEarned: wallet.totalEarned + shareReward,
      });

      // Create transaction
      await storage.createTransaction({
        userId,
        type: "share_reward",
        amount: shareReward,
        description: "Récompense de partage",
      });

      res.json({ success: true, reward: shareReward, wallet: updated });
    } catch (error) {
      console.error("Error processing share:", error);
      res.status(500).json({ error: "Failed to process share" });
    }
  });

  // AI Recommendations - Get personalized product recommendations using Gemini (protected route)
  app.get("/api/recommend", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const products = await storage.getProducts();
      const activities = await storage.getUserActivity(userId);

      if (products.length === 0) {
        return res.json([]);
      }

      // Build context for AI
      const productList = products.map((p, i) => 
        `${i + 1}. ${p.name} (${p.category}) - ${p.price}€`
      ).join('\n');

      const recentActions = activities.slice(-5).map(a => 
        `${a.action} ${a.itemType}`
      ).join(', ');

      const prompt = `En tant qu'assistant caribéen pour un marketplace, recommande 3 produits parmi cette liste basé sur l'activité récente de l'utilisateur.

Produits disponibles:
${productList}

Activité récente: ${recentActions || 'Nouveau visiteur'}

Réponds avec seulement 3 numéros de produits séparés par des virgules (ex: 1,3,5).`;

      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: prompt,
      });

      const text = response.text || "";
      const numbers = text.match(/\d+/g)?.map(Number).filter(n => n > 0 && n <= products.length) || [];
      
      const recommendations = numbers.slice(0, 3).map(n => {
        const product = products[n - 1];
        return product ? {
          productId: product.id,
          reason: "Recommandé pour vous",
          confidence: 0.8,
        } : null;
      }).filter(Boolean);

      // If AI didn't work, return random recommendations
      if (recommendations.length === 0) {
        const shuffled = [...products].sort(() => 0.5 - Math.random());
        return res.json(shuffled.slice(0, 3).map(p => ({
          productId: p.id,
          reason: "Produit populaire",
          confidence: 0.6,
        })));
      }

      res.json(recommendations);
    } catch (error) {
      console.error("Error generating recommendations:", error);
      // Fallback: return random products
      const products = await storage.getProducts();
      const shuffled = [...products].sort(() => 0.5 - Math.random());
      res.json(shuffled.slice(0, 3).map(p => ({
        productId: p.id,
        reason: "Produit populaire",
        confidence: 0.6,
      })));
    }
  });

  // Admin Analytics - Get comprehensive analytics with AI insights (protected route)
  app.get("/api/admin/analytics", isAuthenticated, async (req: any, res) => {
    try {
      const transactions = await storage.getAllTransactions();
      const products = await storage.getProducts();
      const wallets = await storage.getAllWallets();

      // Calculate metrics across all users
      const purchaseTransactions = transactions.filter(t => t.type === "purchase");
      const totalSales = purchaseTransactions.reduce((sum, t) => sum + Math.abs(t.amount), 0);
      const totalIKBDistributed = wallets.reduce((sum, w) => sum + w.totalEarned, 0);
      const totalUsers = wallets.length;
      const activeUsers = wallets.filter(w => w.miningActive).length;

      // Sales by region (mock data for demo)
      const salesByRegion = [
        { region: "Martinique", sales: totalSales * 0.4 },
        { region: "Guadeloupe", sales: totalSales * 0.3 },
        { region: "Guyane", sales: totalSales * 0.2 },
        { region: "Autres", sales: totalSales * 0.1 },
      ];

      // Generate AI insights using OpenAI
      let aiInsights = "L'IA analyse vos données pour générer des insights personnalisés...";
      
      try {
        // the newest OpenAI model is "gpt-5" which was released August 7, 2025. do not change this unless explicitly requested by the user
        const insightsResponse = await openai.chat.completions.create({
          model: "gpt-5",
          messages: [{
            role: "user",
            content: `En tant qu'analyste business pour IKABAY EMPIRE, génère un rapport concis (3-4 phrases) basé sur ces métriques:
- Ventes totales: ${totalSales.toFixed(2)}€
- IKB distribués: ${totalIKBDistributed.toFixed(2)}
- Produits: ${products.length}
- Transactions: ${transactions.length}

Focus sur les opportunités de croissance et recommandations stratégiques.`
          }],
          max_completion_tokens: 200,
        });

        aiInsights = insightsResponse.choices[0]?.message?.content || aiInsights;
      } catch (error) {
        console.error("Error generating AI insights:", error);
      }

      res.json({
        totalSales,
        totalUsers,
        totalIKBDistributed,
        activeUsers,
        salesByRegion,
        aiInsights,
      });
    } catch (error) {
      console.error("Error fetching analytics:", error);
      res.status(500).json({ error: "Failed to fetch analytics" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
