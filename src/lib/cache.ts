import { Redis } from "@upstash/redis";
import type { AnalysisResult } from "@/types";
import crypto from "crypto";

// Configurar Redis client (si está disponible)
let redis: Redis | null = null;

if (process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN) {
  redis = new Redis({
    url: process.env.UPSTASH_REDIS_REST_URL,
    token: process.env.UPSTASH_REDIS_REST_TOKEN,
  });
} else {
  console.warn("⚠️ Upstash Redis not configured - caching disabled");
}

const CACHE_TTL = 24 * 60 * 60; // 24 horas en segundos
const CACHE_PREFIX = "ai-impression-cache:";
const PROMPT_VERSION = "v3"; // Incrementar cuando cambie el prompt/scoring para invalidar caché viejo

/**
 * Genera una key de caché basada en los parámetros de análisis
 */
function generateCacheKey(url: string, targetAudience: string, pageGoal?: string): string {
  const data = `${PROMPT_VERSION}|${url}|${targetAudience}|${pageGoal || ""}`;
  const hash = crypto.createHash("sha256").update(data).digest("hex");
  return `${CACHE_PREFIX}${hash}`;
}

/**
 * Obtiene un análisis cacheado si existe y no ha expirado
 */
export async function getCachedAnalysis(
  url: string,
  targetAudience: string,
  pageGoal?: string
): Promise<AnalysisResult | null> {
  if (!redis) {
    return null;
  }

  try {
    const key = generateCacheKey(url, targetAudience, pageGoal);
    const cached = await redis.get<AnalysisResult>(key);
    
    if (cached) {
      console.log("✅ Cache HIT - returning cached analysis");
      return cached;
    }
    
    console.log("❌ Cache MISS - will perform new analysis");
    return null;
  } catch (error) {
    console.error("Cache retrieval error:", error);
    return null;
  }
}

/**
 * Guarda un análisis en caché
 */
export async function setCachedAnalysis(
  url: string,
  targetAudience: string,
  analysis: AnalysisResult,
  pageGoal?: string
): Promise<void> {
  if (!redis) {
    return;
  }

  try {
    const key = generateCacheKey(url, targetAudience, pageGoal);
    await redis.set(key, analysis, {
      ex: CACHE_TTL, // TTL de 24 horas
    });
    console.log(`💾 Analysis cached for 24h (key: ${key.slice(0, 40)}...)`);
  } catch (error) {
    console.error("Cache storage error:", error);
    // No lanzar error - el caché es opcional
  }
}

/**
 * Invalida el caché para una URL específica
 */
export async function invalidateCache(
  url: string,
  targetAudience: string,
  pageGoal?: string
): Promise<void> {
  if (!redis) {
    return;
  }

  try {
    const key = generateCacheKey(url, targetAudience, pageGoal);
    await redis.del(key);
    console.log(`🗑️ Cache invalidated for key: ${key.slice(0, 40)}...`);
  } catch (error) {
    console.error("Cache invalidation error:", error);
  }
}
