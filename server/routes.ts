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

  // Initialize seed data on startup
  await seedLocalProducts();

  const httpServer = createServer(app);
  return httpServer;
}
