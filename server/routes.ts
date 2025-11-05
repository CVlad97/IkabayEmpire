import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { openai } from "./lib/openai-client";
import { ai } from "./lib/gemini-client";
import { setupAuth, isAuthenticated } from "./replitAuth";
import { dropshippingService } from "./lib/dropshipping/dropshipping-service";
import { aiPricingService } from "./lib/ai-pricing-service";
import rateLimit from "express-rate-limit";

// Rate limiters for API protection
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: "Trop de requêtes depuis cette IP, veuillez réessayer plus tard.",
  standardHeaders: true,
  legacyHeaders: false,
});

const dropshippingSearchLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 10, // Limit to 10 searches per minute
  message: "Trop de recherches. Attendez 1 minute avant de réessayer.",
  standardHeaders: true,
  legacyHeaders: false,
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // Limit login/registration attempts
  message: "Trop de tentatives. Veuillez réessayer dans 15 minutes.",
  skipSuccessfulRequests: true,
  standardHeaders: true,
  legacyHeaders: false,
});

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

  // ============ RELAY POINTS API (v2.4 Interactive Map) ============
  
  // Get all relay points with optional filtering
  app.get("/api/relay-points", async (req, res) => {
    try {
      const { zone, status } = req.query;
      let relays = await storage.getRelays();

      // Filter by zone if provided
      if (zone && typeof zone === 'string') {
        relays = relays.filter(r => r.zone.toLowerCase() === zone.toLowerCase());
      }

      // Filter by status if provided
      if (status && typeof status === 'string') {
        relays = relays.filter(r => r.status === status);
      }

      // Enrich with partner information
      const enrichedRelays = await Promise.all(
        relays.map(async (relay) => {
          let partner = null;
          if (relay.operatorId) {
            const partners = await storage.getPartners();
            partner = partners.find(p => p.id === relay.operatorId);
          }
          return {
            ...relay,
            partner,
          };
        })
      );

      res.json(enrichedRelays);
    } catch (error) {
      console.error("Error fetching relay points:", error);
      res.status(500).json({ error: "Failed to fetch relay points" });
    }
  });

  // Get single relay point with details
  app.get("/api/relay-points/:id", async (req, res) => {
    try {
      const relay = await storage.getRelay(req.params.id);
      if (!relay) {
        return res.status(404).json({ error: "Relay point not found" });
      }

      let partner = null;
      if (relay.operatorId) {
        const partners = await storage.getPartners();
        partner = partners.find(p => p.id === relay.operatorId);
      }

      res.json({ ...relay, partner });
    } catch (error) {
      console.error("Error fetching relay point:", error);
      res.status(500).json({ error: "Failed to fetch relay point" });
    }
  });

  // Get delivery drivers/partners
  app.get("/api/partners", async (req, res) => {
    try {
      const { type, status, zone } = req.query;
      let partners = await storage.getPartners();

      // Filter by type if provided
      if (type && typeof type === 'string') {
        partners = partners.filter(p => p.type === type);
      }

      // Filter by status if provided
      if (status && typeof status === 'string') {
        partners = partners.filter(p => p.status === status);
      }

      // Filter by zone if provided
      if (zone && typeof zone === 'string') {
        partners = partners.filter(p => p.zone?.toLowerCase() === zone.toLowerCase());
      }

      res.json(partners);
    } catch (error) {
      console.error("Error fetching partners:", error);
      res.status(500).json({ error: "Failed to fetch partners" });
    }
  });

  // Partner Registration - Public route (authenticated)
  app.post("/api/partners/register", isAuthenticated, authLimiter, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress || 'unknown';
      
      // Validate request body
      const { insertPartnerSchema } = await import("../shared/schema");
      const validatedData = insertPartnerSchema.parse(req.body);

      // Check if user already has a partner registration
      const existingPartners = await storage.getPartners();
      const existingPartner = existingPartners.find(p => p.userId === userId);
      
      if (existingPartner) {
        return res.status(400).json({ 
          error: "Vous avez déjà une demande de partenariat en cours ou approuvée" 
        });
      }

      // Create partner registration
      const partner = await storage.createPartner({
        ...validatedData,
        userId,
        registrationIp: Array.isArray(ip) ? ip[0] : ip,
        cgvAcceptedAt: validatedData.cgvAccepted ? new Date() : undefined,
        status: 'pending',
      });

      res.json({
        success: true,
        partner,
        message: "Votre demande a été enregistrée. Vous serez notifié une fois approuvée.",
      });
    } catch (error: any) {
      console.error("Error registering partner:", error);
      res.status(400).json({ 
        error: error.message || "Erreur lors de l'inscription" 
      });
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

  // ========================================
  // IKABAY EMPIRE v2.2 - LOCAL STARS
  // ========================================

  // Get all artisans
  app.get("/api/artisans", async (req, res) => {
    try {
      const artisans = await storage.getArtisans();
      res.json(artisans);
    } catch (error) {
      console.error("Error fetching artisans:", error);
      res.status(500).json({ error: "Failed to fetch artisans" });
    }
  });

  // Get single artisan with their products
  app.get("/api/artisans/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const artisan = await storage.getArtisan(id);
      
      if (!artisan) {
        return res.status(404).json({ error: "Artisan not found" });
      }

      const produits = await storage.getProduitsByArtisan(id);
      
      res.json({
        ...artisan,
        produits,
      });
    } catch (error) {
      console.error("Error fetching artisan:", error);
      res.status(500).json({ error: "Failed to fetch artisan" });
    }
  });

  // Get all local products
  app.get("/api/produits-locaux", async (req, res) => {
    try {
      const produits = await storage.getProduitsLocaux();
      res.json(produits);
    } catch (error) {
      console.error("Error fetching produits locaux:", error);
      res.status(500).json({ error: "Failed to fetch produits locaux" });
    }
  });

  // Get single product
  app.get("/api/produits-locaux/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const produit = await storage.getProduitLocal(id);
      
      if (!produit) {
        return res.status(404).json({ error: "Produit not found" });
      }

      // Get artisan info
      const artisan = await storage.getArtisan(produit.artisanId);
      
      res.json({
        ...produit,
        artisan,
      });
    } catch (error) {
      console.error("Error fetching produit:", error);
      res.status(500).json({ error: "Failed to fetch produit" });
    }
  });

  // ========================================
  // IKABAY CONNECT v1.2 - WhatsApp + Voice AI
  // ========================================

  // WhatsApp Webhook - Receive incoming messages
  app.post("/api/whatsapp/webhook", async (req, res) => {
    try {
      // Validate Twilio signature for security
      const twilioSignature = req.headers['x-twilio-signature'] as string;
      
      // Always validate signature in production, reject if missing or invalid
      if (process.env.NODE_ENV === 'production') {
        if (!twilioSignature) {
          console.warn("Missing Twilio signature");
          return res.status(403).send("Forbidden - Missing signature");
        }
        
        const { validateTwilioSignature } = await import('./twilio');
        // Construct full URL including protocol and host
        const protocol = req.headers['x-forwarded-proto'] || req.protocol;
        const host = req.get('host');
        const url = `${protocol}://${host}${req.originalUrl}`;
        
        const isValid = await validateTwilioSignature(twilioSignature, url, req.body);
        if (!isValid) {
          console.warn("Invalid Twilio signature for URL:", url);
          return res.status(403).send("Forbidden - Invalid signature");
        }
      }
      
      const { From, Body, MediaUrl0, MediaContentType0, MessageSid } = req.body;
      
      // Extract phone number (remove "whatsapp:" prefix)
      const phone = From?.replace('whatsapp:', '') || '';
      
      if (!phone) {
        return res.status(400).send("Missing phone number");
      }

      // Accept both text and audio-only messages
      const messageText = Body || '';
      const hasMedia = !!MediaUrl0;
      const mediaType = MediaContentType0 || '';
      const isAudio = mediaType.startsWith('audio/');

      console.log(`WhatsApp message from ${phone}: ${messageText || '[Audio message]'}`);
      
      // Get or create WhatsApp session
      let session = await storage.getWhatsAppSession(phone);
      if (!session) {
        session = await storage.createWhatsAppSession({
          phone,
          userId: null,
          lastIntent: null,
          context: {},
        });
      } else {
        // Update last message timestamp
        session = await storage.updateWhatsAppSession(phone, {});
      }

      // Store media metadata if present
      if (hasMedia) {
        // Update session context with media info
        const currentContext = session.context || {};
        await storage.updateWhatsAppSession(phone, {
          context: {
            ...(typeof currentContext === 'object' ? currentContext : {}),
            lastMediaUrl: MediaUrl0,
            lastMediaType: mediaType,
            lastMessageSid: MessageSid,
          }
        });
      }

      const { sendWhatsAppMessage } = await import('./twilio');
      
      let finalMessage = messageText;
      let transcriptionTime = 0;
      
      // If audio message, transcribe it using Whisper
      if (isAudio && MediaUrl0) {
        try {
          const transcribeStart = Date.now();
          
          // Download audio with Twilio authentication
          const { fetchTwilioMedia } = await import('./twilio');
          const audioBuffer = await fetchTwilioMedia(MediaUrl0);
          const audioFile = new File([audioBuffer], "audio.ogg", { type: mediaType });

          // Transcribe using OpenAI Whisper
          const transcription = await openai.audio.transcriptions.create({
            file: audioFile,
            model: "whisper-1",
            language: "fr",
          });

          finalMessage = transcription.text;
          transcriptionTime = Date.now() - transcribeStart;
          
          console.log(`Transcribed audio from ${phone} (${transcriptionTime}ms): ${finalMessage}`);
        } catch (error) {
          console.error("Error transcribing audio:", error);
          finalMessage = '[Audio transcription failed]';
        }
      }
      
      // Analyze intent using Gemini AI
      let detectedIntent = 'unknown';
      let aiResponse = '';
      let intentProcessingTime = 0;
      
      if (finalMessage && finalMessage !== '[Audio transcription failed]') {
        try {
          const intentStart = Date.now();
          
          const prompt = `Tu es un assistant IA pour IKABAY CONNECT, un service de livraison caribeen.

Analyse le message suivant et determine l'intention de l'utilisateur parmi ces categories:
- nouvelle_livraison: L'utilisateur veut creer une nouvelle livraison
- valider_livraison: L'utilisateur (livreur) veut confirmer qu'une livraison est terminee
- demande_statut: L'utilisateur demande le statut de sa livraison
- devenir_relais: L'utilisateur veut devenir un point relais
- voir_solde: L'utilisateur veut voir son solde IKB
- unknown: Intention non reconnue

Message: "${finalMessage}"

Reponds en JSON avec ce format:
{
  "intent": "l'une des categories ci-dessus",
  "response": "une reponse appropriee en francais (2-3 phrases maximum)"
}`;

          const result = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: [{ role: 'user', parts: [{ text: prompt }] }],
          });
          
          const responseText = result.candidates?.[0]?.content?.parts?.[0]?.text || '';
          
          // Parse JSON response from Gemini
          try {
            const jsonMatch = responseText.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
              const intentData = JSON.parse(jsonMatch[0]);
              detectedIntent = intentData.intent || 'unknown';
              aiResponse = intentData.response || 'Je peux vous aider avec vos livraisons, statuts, et votre solde IKB.';
            }
          } catch (parseError) {
            console.error("Failed to parse Gemini response:", responseText);
            aiResponse = 'Bienvenue sur IKABAY CONNECT! Comment puis-je vous aider avec vos livraisons?';
          }
          
          intentProcessingTime = Date.now() - intentStart;
          console.log(`Detected intent: ${detectedIntent} (${intentProcessingTime}ms)`);
        } catch (error) {
          console.error("Intent recognition error:", error);
          aiResponse = 'Bienvenue sur IKABAY CONNECT! Comment puis-je vous aider?';
        }
      } else {
        aiResponse = 'Bienvenue sur IKABAY CONNECT! Comment puis-je vous aider?';
      }
      
      // Send AI-generated response
      await sendWhatsAppMessage(phone, aiResponse);

      // Update session with detected intent
      await storage.updateWhatsAppSession(phone, {
        lastIntent: detectedIntent,
        context: {
          ...(typeof session.context === 'object' ? session.context : {}),
          lastResponse: aiResponse,
        }
      });

      // Log the interaction with transcription and intent
      const totalProcessingTime = transcriptionTime + intentProcessingTime;
      await storage.createVoiceLog({
        userId: session.userId,
        phone,
        message: finalMessage || messageText || '[Audio message]',
        intent: detectedIntent,
        response: aiResponse,
        audioUrl: hasMedia ? MediaUrl0 : null,
        processingTime: totalProcessingTime,
      });

      res.status(200).send("OK");
    } catch (error) {
      console.error("WhatsApp webhook error:", error);
      res.status(500).send("Internal server error");
    }
  });

  // WhatsApp Status Callback (optional)
  app.post("/api/whatsapp/status", async (req, res) => {
    console.log("WhatsApp status update:", req.body);
    res.status(200).send("OK");
  });

  // Voice Transcription - Convert audio to text using OpenAI Whisper
  app.post("/api/voice/transcribe", async (req, res) => {
    try {
      const { audioUrl } = req.body;
      
      if (!audioUrl) {
        return res.status(400).json({ error: "Missing audioUrl" });
      }

      const startTime = Date.now();
      
      // Download audio (with Twilio auth if it's a Twilio URL)
      let audioBuffer: ArrayBuffer;
      if (audioUrl.includes('twilio.com')) {
        const { fetchTwilioMedia } = await import('./twilio');
        audioBuffer = await fetchTwilioMedia(audioUrl);
      } else {
        const audioResponse = await fetch(audioUrl);
        if (!audioResponse.ok) {
          return res.status(400).json({ error: "Failed to fetch audio" });
        }
        audioBuffer = await audioResponse.arrayBuffer();
      }

      const audioFile = new File([audioBuffer], "audio.ogg", { type: "audio/ogg" });

      // Transcribe using OpenAI Whisper
      const transcription = await openai.audio.transcriptions.create({
        file: audioFile,
        model: "whisper-1",
        language: "fr", // French for Caribbean users
      });

      const processingTime = Date.now() - startTime;

      res.json({
        text: transcription.text,
        processingTime,
      });
    } catch (error) {
      console.error("Transcription error:", error);
      res.status(500).json({ error: "Failed to transcribe audio" });
    }
  });

  // Voice Reply - Convert text to speech using OpenAI TTS
  app.post("/api/voice/reply", async (req, res) => {
    try {
      const { text } = req.body;
      
      if (!text) {
        return res.status(400).json({ error: "Missing text" });
      }

      // Generate speech using OpenAI TTS
      const mp3Response = await openai.audio.speech.create({
        model: "tts-1",
        voice: "nova", // Female voice, good for customer service
        input: text,
        response_format: "mp3",
      });

      // Convert response to buffer
      const buffer = Buffer.from(await mp3Response.arrayBuffer());
      
      // For now, return as base64 data URL
      // In production, upload to cloud storage and return URL
      const base64Audio = buffer.toString('base64');
      const audioUrl = `data:audio/mp3;base64,${base64Audio}`;

      res.json({
        audioUrl,
        size: buffer.length,
      });
    } catch (error) {
      console.error("TTS error:", error);
      res.status(500).json({ error: "Failed to generate speech" });
    }
  });

  // AI Intent Recognition - Analyze user messages and detect intents
  app.post("/api/ai/intent", async (req, res) => {
    try {
      const { message, sessionContext } = req.body;
      
      if (!message) {
        return res.status(400).json({ error: "Missing message" });
      }

      const startTime = Date.now();
      
      // Use Gemini Pro to analyze intent
      const prompt = `Tu es un assistant IA pour IKABAY CONNECT, un service de livraison caribeen.

Analyse le message suivant et determine l'intention de l'utilisateur parmi ces categories:
- nouvelle_livraison: L'utilisateur veut creer une nouvelle livraison
- valider_livraison: L'utilisateur (livreur) veut confirmer qu'une livraison est terminee
- demande_statut: L'utilisateur demande le statut de sa livraison
- devenir_relais: L'utilisateur veut devenir un point relais
- voir_solde: L'utilisateur veut voir son solde IKB
- unknown: Intention non reconnue

Message: "${message}"

${sessionContext ? `Contexte de la conversation: ${JSON.stringify(sessionContext)}` : ''}

Reponds en JSON avec ce format:
{
  "intent": "l'une des categories ci-dessus",
  "confidence": 0.0-1.0,
  "response": "une reponse appropriee en francais",
  "extractedData": {
    // donnees extraites pertinentes selon l'intent
  }
}`;

      const result = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
      });
      
      const responseText = result.candidates?.[0]?.content?.parts?.[0]?.text || '';
      
      // Parse JSON response from Gemini
      let intentData;
      try {
        // Extract JSON from response (Gemini might wrap it in markdown)
        const jsonMatch = responseText.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          intentData = JSON.parse(jsonMatch[0]);
        } else {
          throw new Error("No JSON found in response");
        }
      } catch (parseError) {
        console.error("Failed to parse Gemini response:", responseText);
        intentData = {
          intent: "unknown",
          confidence: 0.5,
          response: "Desolee, je n'ai pas compris votre demande. Pouvez-vous reformuler?",
          extractedData: {}
        };
      }

      const processingTime = Date.now() - startTime;

      res.json({
        ...intentData,
        processingTime,
      });
    } catch (error) {
      console.error("Intent recognition error:", error);
      res.status(500).json({ error: "Failed to recognize intent" });
    }
  });

  // ========================================
  // SEED DATA - Caribbean Artisans & Products
  // ========================================
  
  async function seedLocalProducts() {
    try {
      const existingArtisans = await storage.getArtisans();
      if (existingArtisans.length > 0) {
        console.log("✓ Artisan data already seeded");
        return;
      }

      console.log("Seeding Caribbean artisan data...");

      // Create artisans
      const artisan1 = await storage.createArtisan({
        name: "Marie-Claire Beauséjour",
        bio: "Passionnée par les traditions caribéennes depuis plus de 30 ans, Marie-Claire perpétue l'art ancestral du rhum arrangé martiniquais. Chaque bouteille est une célébration de notre héritage créole.",
        region: "Martinique",
        image: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=600&h=400&fit=crop",
        specialty: "Maître Rhumier - Rhums Arrangés Artisanaux",
        certified: true,
        contactEmail: "marie@rhum-caraibe.mq",
        contactPhone: "+596 696 12 34 56"
      });

      const artisan2 = await storage.createArtisan({
        name: "Jean-Baptiste Delmas",
        bio: "Artisan chocolatier de quatrième génération, Jean-Baptiste transforme le cacao antillais en œuvres d'art gustatives. Du bean-to-bar dans la pure tradition guadeloupéenne.",
        region: "Guadeloupe",
        image: "https://images.unsplash.com/photo-1560250097-0b93528c311a?w=600&h=400&fit=crop",
        specialty: "Maître Chocolatier Bean-to-Bar",
        certified: true,
        contactEmail: "jb@cacao-gwada.gp",
        contactPhone: "+590 690 23 45 67"
      });

      const artisan3 = await storage.createArtisan({
        name: "Evelyne Rochelle",
        bio: "Designer textile inspirée par les couleurs vibrantes de la Caraïbe, Evelyne crée des accessoires uniques qui racontent l'histoire de nos îles. Chaque pièce est tissée à la main avec amour.",
        region: "Sainte-Lucie",
        image: "https://images.unsplash.com/photo-1573497019940-1c28c88b4f3e?w=600&h=400&fit=crop",
        specialty: "Créatrice Textile & Accessoires Caribéens",
        certified: true,
        contactEmail: "evelyne@textile-stlucia.lc"
      });

      // Create products with AI storytelling
      await storage.createProduitLocal({
        artisanId: artisan1.id,
        name: "Rhum Arrangé Ananas Victoria",
        price: 28.90,
        description: "Rhum blanc agricole infusé avec de l'ananas Victoria caramélisé, vanille bourbon et épices secrètes. Macération de 6 mois.",
        storyFr: "Dans les hauteurs de la Martinique, Marie-Claire cueille personnellement chaque ananas Victoria à maturité parfaite. Ce fruit d'exception macère lentement dans notre rhum agricole AOC, révélant des arômes tropicaux intenses et une douceur naturelle incomparable. Un voyage sensoriel au cœur des Antilles.",
        storyEn: "In the heights of Martinique, Marie-Claire personally selects each Victoria pineapple at perfect ripeness. This exceptional fruit slowly macerates in our AOC agricultural rum, revealing intense tropical aromas and incomparable natural sweetness. A sensory journey to the heart of the Caribbean.",
        storyCreole: "An wo mòn Matinik, Marie-Claire ka chwazi chak zannanna Victoria lè y bien mi. Fwi sa ka repozé dousman nan wonm nòt AOC, épi i ka bay yon sant twopik ki cho é yon dousè ki pa gen paréy. Sé yon vwayaj pou tout sans ou, an kè Antiy.",
        images: ["https://images.unsplash.com/photo-1514362545857-3bc16c4c7d1b?w=600&h=600&fit=crop"],
        origin: "Fort-de-France, Martinique",
        inStock: true,
        certifiedLocal: true
      });

      await storage.createProduitLocal({
        artisanId: artisan1.id,
        name: "Rhum Arrangé Passion Gingembre",
        price: 26.50,
        description: "Fruit de la passion frais et gingembre confit dans rhum agricole vieux. Notes épicées et exotiques. Macération 4 mois.",
        storyFr: "Le mariage audacieux entre la passion acidulée de nos jardins et le gingembre épicé crée une symphonie de saveurs. Marie-Claire révèle ici son expertise: chaque ingrédient est minutieusement sélectionné pour atteindre l'équilibre parfait entre douceur et caractère.",
        storyEn: "The bold marriage between tangy passion fruit from our gardens and spicy ginger creates a symphony of flavors. Marie-Claire showcases her expertise: each ingredient is meticulously selected to achieve the perfect balance between sweetness and character.",
        images: ["https://images.unsplash.com/photo-1551538827-9c037cb4f32a?w=600&h=600&fit=crop"],
        origin: "Le Morne-Rouge, Martinique",
        inStock: true,
        certifiedLocal: true
      });

      await storage.createProduitLocal({
        artisanId: artisan2.id,
        name: "Tablette Cacao Pur 75% Guadeloupe",
        price: 12.90,
        description: "Chocolat noir bean-to-bar 75% cacao. Fèves de cacao cultivées en Basse-Terre, torréfiées et transformées artisanalement.",
        storyFr: "Du cacaoyer à votre palais, chaque fève raconte l'histoire des plantations ombragées de Basse-Terre. Jean-Baptiste maîtrise chaque étape: fermentation, séchage, torréfaction, conchage. Le résultat? Un chocolat aux notes florales et fruitées, révélant toute la noblesse du terroir guadeloupéen.",
        storyEn: "From cacao tree to your palate, each bean tells the story of Basse-Terre's shaded plantations. Jean-Baptiste masters every step: fermentation, drying, roasting, conching. The result? A chocolate with floral and fruity notes, revealing all the nobility of Guadeloupean terroir.",
        images: ["https://images.unsplash.com/photo-1511381939415-e44015466834?w=600&h=600&fit=crop"],
        origin: "Basse-Terre, Guadeloupe",
        inStock: true,
        certifiedLocal: true
      });

      await storage.createProduitLocal({
        artisanId: artisan2.id,
        name: "Bonbons Chocolat Rhum Vieux",
        price: 18.50,
        description: "Assortiment de 12 bonbons fins au chocolat noir 65% et ganache au rhum agricole vieux. Édition limitée.",
        storyFr: "L'alliance sublime entre le chocolat antillais et le rhum vieux crée une expérience gustative inoubliable. Chaque bonbon est façonné à la main par Jean-Baptiste, qui insuffle 40 ans de tradition familiale dans chaque création. Une gourmandise d'exception pour célébrer la richesse de notre patrimoine.",
        storyEn: "The sublime alliance between Caribbean chocolate and aged rum creates an unforgettable tasting experience. Each bonbon is hand-crafted by Jean-Baptiste, who infuses 40 years of family tradition into every creation. An exceptional delicacy to celebrate the richness of our heritage.",
        images: ["https://images.unsplash.com/photo-1548907040-4baa42d10919?w=600&h=600&fit=crop"],
        origin: "Pointe-à-Pitre, Guadeloupe",
        inStock: true,
        certifiedLocal: true
      });

      await storage.createProduitLocal({
        artisanId: artisan3.id,
        name: "Sac Cabas Madras Authentique",
        price: 45.00,
        description: "Cabas artisanal en tissu madras traditionnel. Intérieur doublé, anses renforcées. Pièce unique tissée main.",
        storyFr: "Chaque fil de ce cabas raconte l'histoire des tisserandes caribéennes. Evelyne perpétue un savoir-faire ancestral, sélectionnant les motifs madras les plus vibrants et les assemblant avec une précision millimétrique. Porter ce sac, c'est célébrer la créativité et l'élégance de notre culture créole.",
        storyEn: "Every thread of this tote tells the story of Caribbean weavers. Evelyne perpetuates ancestral know-how, selecting the most vibrant madras patterns and assembling them with millimetric precision. Carrying this bag celebrates the creativity and elegance of our Creole culture.",
        images: ["https://images.unsplash.com/photo-1590874103328-eac38a683ce7?w=600&h=600&fit=crop"],
        origin: "Castries, Sainte-Lucie",
        inStock: true,
        certifiedLocal: true
      });

      await storage.createProduitLocal({
        artisanId: artisan3.id,
        name: "Bracelet Coquillage & Coton",
        price: 15.00,
        description: "Bracelet tissé main avec coquillages naturels des plages de Sainte-Lucie et fils de coton bio. Ajustable.",
        storyFr: "Inspiré par les trésors de nos plages, ce bracelet marie la délicatesse du tissu et la beauté brute des coquillages. Evelyne ramasse elle-même chaque coquillage lors de ses promenades matinales, créant ainsi des bijoux uniques qui portent l'âme de la mer des Caraïbes.",
        storyEn: "Inspired by the treasures of our beaches, this bracelet combines the delicacy of fabric and the raw beauty of seashells. Evelyne personally collects each shell during her morning walks, creating unique jewelry that carries the soul of the Caribbean Sea.",
        images: ["https://images.unsplash.com/photo-1611591437281-460bfbe1220a?w=600&h=600&fit=crop"],
        origin: "Vieux Fort, Sainte-Lucie",
        inStock: true,
        certifiedLocal: true
      });

      console.log("✓ Successfully seeded artisan and product data");
    } catch (error) {
      console.error("Error seeding artisan data:", error);
    }
  }

  // Seed relay points for interactive map (v2.4)
  async function seedRelayPoints() {
    try {
      const existingRelays = await storage.getRelays();
      if (existingRelays.length > 0) {
        console.log("✓ Relay points already seeded");
        return;
      }

      console.log("Seeding Caribbean relay points...");

      // Martinique Relay Points
      await storage.createRelay({
        name: "Relais IKABAY Fort-de-France Centre",
        address: "12 Rue Victor Hugo, 97200 Fort-de-France",
        coords: { lat: 14.6098, lng: -61.0738 },
        zone: "Martinique",
        phone: "+596 596 71 23 45",
        whatsappNumber: "+596 696 71 23 45",
        capacity: 100,
        currentLoad: 45,
        status: "active",
        hoursOpen: "8h-19h Lun-Sam",
      });

      await storage.createRelay({
        name: "Point Relais Le Lamentin",
        address: "Zone Industrielle Place d'Armes, 97232 Le Lamentin",
        coords: { lat: 14.6167, lng: -61.0167 },
        zone: "Martinique",
        phone: "+596 596 50 12 34",
        whatsappNumber: "+596 696 50 12 34",
        capacity: 150,
        currentLoad: 120,
        status: "full",
        hoursOpen: "7h-20h Tous les jours",
      });

      await storage.createRelay({
        name: "Relais Schoelcher Marina",
        address: "Front de Mer, 97233 Schoelcher",
        coords: { lat: 14.6166, lng: -61.1019 },
        zone: "Martinique",
        phone: "+596 596 61 78 90",
        capacity: 75,
        currentLoad: 23,
        status: "active",
        hoursOpen: "9h-18h Lun-Ven",
      });

      await storage.createRelay({
        name: "Point Relais Trois-Îlets",
        address: "Village de la Poterie, 97229 Trois-Îlets",
        coords: { lat: 14.5383, lng: -61.0397 },
        zone: "Martinique",
        phone: "+596 596 68 34 56",
        whatsappNumber: "+596 696 68 34 56",
        capacity: 60,
        currentLoad: 18,
        status: "active",
        hoursOpen: "8h-17h Lun-Sam",
      });

      // Guadeloupe Relay Points
      await storage.createRelay({
        name: "Relais IKABAY Pointe-à-Pitre",
        address: "Place de la Victoire, 97110 Pointe-à-Pitre",
        coords: { lat: 16.2411, lng: -61.5331 },
        zone: "Guadeloupe",
        phone: "+590 590 82 45 67",
        whatsappNumber: "+590 690 82 45 67",
        capacity: 120,
        currentLoad: 67,
        status: "active",
        hoursOpen: "8h-19h Lun-Sam",
      });

      await storage.createRelay({
        name: "Point Relais Gosier Marina",
        address: "Marina du Gosier, 97190 Le Gosier",
        coords: { lat: 16.1975, lng: -61.5058 },
        zone: "Guadeloupe",
        phone: "+590 590 84 12 34",
        capacity: 80,
        currentLoad: 34,
        status: "active",
        hoursOpen: "9h-18h Tous les jours",
      });

      await storage.createRelay({
        name: "Relais Baie-Mahault Zone",
        address: "ZI Jarry, 97122 Baie-Mahault",
        coords: { lat: 16.2667, lng: -61.5833 },
        zone: "Guadeloupe",
        phone: "+590 590 26 78 90",
        whatsappNumber: "+590 690 26 78 90",
        capacity: 200,
        currentLoad: 156,
        status: "active",
        hoursOpen: "7h-21h Tous les jours",
      });

      // Saint-Martin
      await storage.createRelay({
        name: "Relais IKABAY Marigot",
        address: "Rue de la République, 97150 Marigot",
        coords: { lat: 18.0679, lng: -63.0827 },
        zone: "Saint-Martin",
        phone: "+590 590 87 56 78",
        capacity: 50,
        currentLoad: 12,
        status: "active",
        hoursOpen: "8h-18h Lun-Sam",
      });

      // Saint-Barthélemy
      await storage.createRelay({
        name: "Point Relais Gustavia",
        address: "Quai du Général de Gaulle, 97133 Gustavia",
        coords: { lat: 17.8962, lng: -62.8498 },
        zone: "Saint-Barthélemy",
        phone: "+590 590 27 89 01",
        capacity: 40,
        currentLoad: 8,
        status: "active",
        hoursOpen: "9h-17h Lun-Ven",
      });

      // La Réunion (DOM-TOM)
      await storage.createRelay({
        name: "Relais IKABAY Saint-Denis",
        address: "Rue Maréchal Leclerc, 97400 Saint-Denis",
        coords: { lat: -20.8824, lng: 55.4504 },
        zone: "La Réunion",
        phone: "+262 262 41 23 45",
        whatsappNumber: "+262 692 41 23 45",
        capacity: 90,
        currentLoad: 45,
        status: "active",
        hoursOpen: "8h-19h Lun-Sam",
      });

      await storage.createRelay({
        name: "Point Relais Saint-Pierre",
        address: "Front de Mer, 97410 Saint-Pierre",
        coords: { lat: -21.3394, lng: 55.4784 },
        zone: "La Réunion",
        phone: "+262 262 35 67 89",
        capacity: 70,
        currentLoad: 28,
        status: "active",
        hoursOpen: "8h-18h Lun-Sam",
      });

      console.log("✓ Successfully seeded relay points data");
    } catch (error) {
      console.error("Error seeding relay points:", error);
    }
  }

  // ============ DROPSHIPPING API (v2.4 AutoDS/CJ/Zendrop) ============
  
  // Initialize dropshipping suppliers
  app.post("/api/dropshipping/suppliers/init", isAuthenticated, async (req, res) => {
    try {
      // Check if suppliers already configured
      const existing = await storage.getDropshippingSuppliers();
      if (existing.length > 0) {
        return res.json({ message: "Suppliers already configured", suppliers: existing });
      }

      // Create default supplier configurations
      const cjSupplier = await storage.createDropshippingSupplier({
        name: "CJ Dropshipping",
        code: "cj",
        active: false, // Activate when API keys provided
        baseUrl: "https://developers.cjdropshipping.com/api2.0/v1",
      });

      const autodsSupplier = await storage.createDropshippingSupplier({
        name: "AutoDS",
        code: "autods",
        active: false,
        baseUrl: "https://api.autods.com", // Placeholder - requires approval
      });

      const zendropSupplier = await storage.createDropshippingSupplier({
        name: "Zendrop",
        code: "zendrop",
        active: false,
        baseUrl: "https://api.zendrop.com", // Placeholder - no public API
      });

      res.json({
        message: "Dropshipping suppliers initialized",
        suppliers: [cjSupplier, autodsSupplier, zendropSupplier],
      });
    } catch (error: any) {
      console.error("Error initializing suppliers:", error);
      res.status(500).json({ message: error.message });
    }
  });

  // Get all suppliers
  app.get("/api/dropshipping/suppliers", isAuthenticated, async (req, res) => {
    try {
      const suppliers = await storage.getDropshippingSuppliers();
      res.json(suppliers);
    } catch (error: any) {
      console.error("Error fetching suppliers:", error);
      res.status(500).json({ message: error.message });
    }
  });

  // Update supplier configuration (API keys)
  app.patch("/api/dropshipping/suppliers/:id", isAuthenticated, async (req, res) => {
    try {
      const { id } = req.params;
      const { apiKey, apiEmail, active } = req.body;

      // Validate required fields for activation
      if (active) {
        const supplier = await storage.getDropshippingSupplier(id);
        if (!supplier) {
          return res.status(404).json({ message: "Supplier not found" });
        }

        // CJ requires both apiKey and apiEmail
        if (supplier.code === "cj" && (!apiKey || !apiEmail)) {
          return res.status(400).json({ 
            message: "CJ Dropshipping requires both API key and email" 
          });
        }

        // AutoDS and Zendrop require apiKey (even if stubs)
        if ((supplier.code === "autods" || supplier.code === "zendrop") && !apiKey) {
          return res.status(400).json({ 
            message: `${supplier.name} requires API key to activate` 
          });
        }
      }

      const updated = await storage.updateDropshippingSupplier(id, {
        apiKey,
        apiEmail,
        active,
      });

      // Reinitialize dropshipping service with new credentials
      if (active) {
        await dropshippingService.initializeSuppliers();
      }

      res.json(updated);
    } catch (error: any) {
      console.error("Error updating supplier:", error);
      res.status(500).json({ message: error.message });
    }
  });

  // Search products from dropshipping supplier
  app.get("/api/dropshipping/search", isAuthenticated, dropshippingSearchLimiter, async (req, res) => {
    try {
      const { source, keyword, category, pageNum, pageSize } = req.query;

      if (!source || typeof source !== 'string') {
        return res.status(400).json({ message: "Source parameter required (cj, autods, or zendrop)" });
      }

      const results = await dropshippingService.searchProducts({
        source: source as "cj" | "autods" | "zendrop",
        keyword: keyword as string,
        category: category as string,
        pageNum: pageNum ? parseInt(pageNum as string) : undefined,
        pageSize: pageSize ? parseInt(pageSize as string) : undefined,
      });

      res.json(results);
    } catch (error: any) {
      console.error("Error searching products:", error);
      res.status(500).json({ message: error.message });
    }
  });

  // Import product from dropshipping supplier
  app.post("/api/dropshipping/import", isAuthenticated, apiLimiter, async (req, res) => {
    try {
      const { source, externalId } = req.body;

      if (!source || !externalId) {
        return res.status(400).json({ message: "source and externalId required" });
      }

      const product = await dropshippingService.importProduct({
        source,
        externalId,
      });

      res.json({
        message: "Product imported successfully",
        product,
      });
    } catch (error: any) {
      console.error("Error importing product:", error);
      res.status(500).json({ message: error.message });
    }
  });

  // Sync stock for a specific product
  app.post("/api/dropshipping/sync/:productId", isAuthenticated, async (req, res) => {
    try {
      const { productId } = req.params;
      await dropshippingService.syncProductStock(productId);

      const product = await storage.getProduct(productId);
      res.json({
        message: "Product synced successfully",
        product,
      });
    } catch (error: any) {
      console.error("Error syncing product:", error);
      res.status(500).json({ message: error.message });
    }
  });

  // Bulk sync all dropshipping products
  app.post("/api/dropshipping/sync-all", isAuthenticated, async (req, res) => {
    try {
      const results = await dropshippingService.bulkSyncAllProducts();
      res.json({
        message: "Bulk sync completed",
        ...results,
      });
    } catch (error: any) {
      console.error("Error during bulk sync:", error);
      res.status(500).json({ message: error.message });
    }
  });

  // Get sync logs
  app.get("/api/dropshipping/logs", isAuthenticated, async (req, res) => {
    try {
      const { limit } = req.query;
      const logs = await storage.getRecentSyncLogs(
        limit ? parseInt(limit as string) : 50
      );
      res.json(logs);
    } catch (error: any) {
      console.error("Error fetching sync logs:", error);
      res.status(500).json({ message: error.message });
    }
  });

  // ============ AI PRICING ENGINE (v2.4 Auto-Pricing) ============

  // Analyze competitor prices with Gemini AI
  app.post("/api/pricing/analyze", isAuthenticated, apiLimiter, async (req, res) => {
    try {
      const { productName, category } = req.body;

      // Validate product name
      if (!productName || typeof productName !== "string" || productName.trim().length === 0) {
        return res.status(400).json({ message: "Product name is required and must be non-empty" });
      }

      // Validate category (optional)
      if (category !== undefined && (typeof category !== "string" || category.trim().length === 0)) {
        return res.status(400).json({ message: "Category must be a non-empty string if provided" });
      }

      const analysis = await aiPricingService.analyzeCompetitorPrices(
        productName.trim(),
        category?.trim()
      );

      res.json(analysis);
    } catch (error: any) {
      console.error("Error analyzing prices:", error);
      res.status(500).json({ message: error.message });
    }
  });

  // Calculate all-inclusive price for a region
  app.post("/api/pricing/calculate", isAuthenticated, async (req, res) => {
    try {
      const { basePrice, region, targetMargin } = req.body;

      // Validate base price
      if (!basePrice || typeof basePrice !== "number" || basePrice <= 0) {
        return res.status(400).json({ message: "Base price must be a positive number" });
      }

      // Validate region
      const validRegions = ["martinique", "guadeloupe", "guyane", "reunion", "mayotte"];
      const selectedRegion = region || "martinique";
      
      if (!validRegions.includes(selectedRegion.toLowerCase())) {
        return res.status(400).json({ 
          message: `Invalid region. Must be one of: ${validRegions.join(", ")}` 
        });
      }

      // Validate target margin (optional)
      if (targetMargin !== undefined && (typeof targetMargin !== "number" || targetMargin < 0 || targetMargin > 1)) {
        return res.status(400).json({ 
          message: "Target margin must be a number between 0 and 1" 
        });
      }

      const calculation = aiPricingService.calculateAllInclusivePrice(
        basePrice,
        selectedRegion.toLowerCase() as "martinique" | "guadeloupe" | "guyane" | "reunion" | "mayotte",
        targetMargin
      );

      res.json(calculation);
    } catch (error: any) {
      console.error("Error calculating price:", error);
      res.status(500).json({ message: error.message });
    }
  });

  // Detect if a product is a good deal
  app.get("/api/pricing/detect-deal/:productId", async (req, res) => {
    try {
      const { productId } = req.params;
      const dealAnalysis = await aiPricingService.detectDeal(productId);
      res.json(dealAnalysis);
    } catch (error: any) {
      console.error("Error detecting deal:", error);
      res.status(500).json({ message: error.message });
    }
  });

  // AI System Health Status (Auto-Stabilizer)
  app.get("/api/empire/status", async (req, res) => {
    try {
      const { collectSystemMetrics, analyzeSystemHealth, getHealthScore } = await import("./lib/ai-supervisor");
      
      const metrics = collectSystemMetrics();
      const healthScore = getHealthScore(metrics);
      const aiAnalysis = await analyzeSystemHealth(metrics);

      res.json({
        status: healthScore >= 70 ? "✅ Empire stabilisé" : "⚠️ Attention requise",
        healthScore,
        system: {
          uptime: `${Math.floor(metrics.uptime / 3600)}h ${Math.floor((metrics.uptime % 3600) / 60)}m`,
          memoryUsage: `${Math.round((metrics.memory.heapUsed / metrics.memory.heapTotal) * 100)}%`,
          timestamp: metrics.timestamp,
        },
        aiReport: aiAnalysis,
      });
    } catch (error: any) {
      console.error("Error analyzing system health:", error);
      res.status(500).json({ message: error.message });
    }
  });

  // Initialize seed data on startup
  await seedLocalProducts();
  await seedRelayPoints();

  // Initialize dropshipping service on startup
  console.log("🚀 Initializing dropshipping suppliers...");
  try {
    await dropshippingService.initializeSuppliers();
    console.log("✅ Dropshipping service initialized successfully");
  } catch (err) {
    console.error("⚠️ Failed to initialize dropshipping service:", err);
    console.log("⚠️ Dropshipping will remain inactive until suppliers are configured");
  }

  // Start scheduled tasks (12h sync)
  const { startScheduledTasks } = await import("./lib/scheduler");
  startScheduledTasks();

  const httpServer = createServer(app);
  return httpServer;
}
