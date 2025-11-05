# 🤖 IKABAY EMPIRE AUTO-STABILIZER

## Vue d'ensemble

Le module Auto-Stabilizer surveille en temps réel la santé du système IKABAY EMPIRE en utilisant l'IA (OpenAI GPT-4o-mini + Google Gemini Pro) pour analyser les métriques serveur et fournir des recommandations d'optimisation.

## Fonctionnalités

### 📊 Surveillance Continue
- **Uptime** - Temps d'activité du serveur
- **Mémoire** - Utilisation RAM (heap used/total)
- **Score de santé** - Score 0-100 basé sur les métriques

### 🧠 Analyse IA Double
1. **Gemini Pro** - Analyse approfondie des métriques système
2. **GPT-4o-mini** - Synthèse executive pour l'administrateur

### 🎯 Score de Stabilité

```typescript
Score 100 : Système optimal
Score 80+ : Bonne performance
Score 70-79 : Surveillance recommandée
Score <70 : Attention requise
```

**Facteurs de calcul :**
- Uptime < 1h → -20 points
- Mémoire > 90% → -30 points
- Mémoire > 70% → -15 points

## API Endpoints

### GET `/api/empire/status`

**Authentification :** Non requise (monitoring public)

**Réponse :**
```json
{
  "status": "✅ Empire stabilisé",
  "healthScore": 95,
  "system": {
    "uptime": "12h 34m",
    "memoryUsage": "45%",
    "timestamp": "2025-11-05T00:11:43.672Z"
  },
  "aiReport": "Système IKABAY fonctionne de manière optimale. Aucune action requise."
}
```

## Architecture Technique

### Fichiers Créés

1. **`server/lib/ai-supervisor.ts`**
   - `analyzeSystemHealth()` - Analyse IA combinée Gemini + OpenAI
   - `collectSystemMetrics()` - Collecte métriques Node.js
   - `getHealthScore()` - Calcul score 0-100

2. **`server/routes.ts`** (modifié)
   - Nouvel endpoint `/api/empire/status`
   - Import dynamique du module AI supervisor

3. **`server/lib/github-sync.ts`**
   - Client GitHub Octokit pour synchronisation repo

## Intégrations AI Utilisées

### OpenAI (Replit AI Integrations)
- Modèle : `gpt-4o-mini`
- Rôle : Synthèse executive des analyses techniques
- Limite : 150 tokens max

### Gemini (Replit AI Integrations)
- Modèle : `gemini-pro`
- Rôle : Analyse détaillée des métriques système
- Format : 3 points (stabilité, causes, recommandations)

## Utilisation

### Via API

```bash
# Vérifier le statut système
curl http://localhost:5000/api/empire/status

# Avec authentification (optionnel)
curl -H "Authorization: Bearer TOKEN" \
  http://localhost:5000/api/empire/status
```

### Via Frontend (à implémenter)

```typescript
import { useQuery } from "@tanstack/react-query";

function SystemStatus() {
  const { data } = useQuery({
    queryKey: ["/api/empire/status"],
    refetchInterval: 120000, // 2 minutes
  });

  return (
    <div>
      <h3>{data?.status}</h3>
      <p>Score: {data?.healthScore}/100</p>
      <p>Uptime: {data?.system.uptime}</p>
      <p>Mémoire: {data?.system.memoryUsage}</p>
      <blockquote>{data?.aiReport}</blockquote>
    </div>
  );
}
```

## Évolutions Futures

### Phase 2 - Watchdog Automatique
- ❌ Redémarrage auto en cas de crash (non implémenté)
- ❌ Logs persistants avec rotation (à venir)
- ❌ Alertes email/SMS via Twilio (planifié)

### Phase 3 - Prédiction IA
- Détection anomalies avant crash
- Recommandations scaling auto
- Alertes proactives basées sur patterns

## Sécurité

- ✅ Endpoint public (monitoring accessible)
- ✅ Pas d'informations sensibles exposées
- ✅ Rate limiting via Express (hérité)
- ⚠️ Ajouter authentification Admin pour actions futures

## Performance

- **Cache AI** : Pas de cache actuellement (chaque requête = 2 appels AI)
- **Coût** : ~$0.002 par analyse (Gemini + OpenAI)
- **Temps réponse** : 2-5 secondes (appels AI séquentiels)

**Optimisation recommandée :**
```typescript
// Cache les analyses pendant 2 minutes
const cachedAnalysis = new Map();
const CACHE_TTL = 120000; // 2 min
```

## Monitoring Production

### Métriques Clés à Surveiller

1. **Uptime** : > 99.9% (SLA cible)
2. **Mémoire** : < 70% utilisation moyenne
3. **Health Score** : > 80 en permanence

### Alertes Recommandées

```typescript
if (healthScore < 70) {
  // Envoyer alerte administrateur
  await sendTwilioAlert({
    to: ADMIN_PHONE,
    message: `⚠️ IKABAY Empire Health Score: ${healthScore}/100`
  });
}
```

## État Actuel

✅ **Complété :**
- Module AI Supervisor fonctionnel
- Endpoint `/api/empire/status` actif
- Analyse double IA (Gemini + OpenAI)
- Score de santé automatique

❌ **À faire :**
- Dashboard Admin frontend
- Watchdog auto-restart
- Cache des analyses AI
- Alertes automatiques
- Logs persistants

## Logs

**Startup :**
```
✅ CJ Dropshipping client initialized
✅ Dropshipping service initialized successfully
📅 Starting scheduled tasks...
✅ Scheduled tasks started (sync every 12h)
🚀 [express] serving on port 5000
```

**Test Endpoint :**
```bash
curl http://localhost:5000/api/empire/status
# → Status 200 OK
```

---

**Version :** 1.0  
**Date :** 2025-11-05  
**Auteur :** IKABAY Empire Team  
**Stack :** Express.js + TypeScript + OpenAI + Gemini
