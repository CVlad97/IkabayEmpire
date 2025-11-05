import { openai } from "./openai-client";
import { ai as geminiClient } from "./gemini-client";

interface SystemMetrics {
  uptime: number;
  memory: NodeJS.MemoryUsage;
  timestamp: string;
  activeConnections?: number;
  errorCount?: number;
}

export async function analyzeSystemHealth(metrics: SystemMetrics): Promise<string> {
  try {
    const geminiPrompt = `
Analyse ces données serveur IKABAY EMPIRE:
${JSON.stringify(metrics, null, 2)}

Fournis une analyse en 3 points:
1️⃣ Score de stabilité (0-100)
2️⃣ Causes possibles d'instabilité
3️⃣ Recommandations d'optimisation

Format: texte concis, max 200 mots.
    `.trim();

    const geminiResult = await geminiClient.models.generateContent({
      model: "gemini-pro",
      contents: [{ parts: [{ text: geminiPrompt }], role: "user" }],
    });
    
    const geminiAnalysis = geminiResult.text || "Analyse indisponible";

    const openaiResponse = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: "Tu es un expert système qui synthétise les analyses pour l'administrateur IKABAY EMPIRE."
        },
        {
          role: "user",
          content: `Synthétise cette analyse technique en 3 lignes claires:\n${geminiAnalysis}`
        }
      ],
      max_tokens: 150,
    });

    return openaiResponse.choices[0]?.message?.content || geminiAnalysis;
  } catch (err: any) {
    console.error("Erreur analyse IA :", err.message);
    return `⚠️ Analyse IA indisponible (${err.message}). Système en mode basique.`;
  }
}

export function collectSystemMetrics(): SystemMetrics {
  return {
    uptime: process.uptime(),
    memory: process.memoryUsage(),
    timestamp: new Date().toISOString(),
  };
}

export function getHealthScore(metrics: SystemMetrics): number {
  let score = 100;
  
  const uptimeHours = metrics.uptime / 3600;
  if (uptimeHours < 1) score -= 20;
  
  const memUsagePercent = (metrics.memory.heapUsed / metrics.memory.heapTotal) * 100;
  if (memUsagePercent > 90) score -= 30;
  else if (memUsagePercent > 70) score -= 15;
  
  return Math.max(0, score);
}
