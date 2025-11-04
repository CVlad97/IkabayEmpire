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

  const httpServer = createServer(app);
  return httpServer;
}
