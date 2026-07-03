import { NextRequest, NextResponse } from "next/server";
import { analysisRequestSchema } from "@/lib/validation";
import { performAnalysis } from "@/lib/analyzer";
import type { AnalysisResponse } from "@/types";
import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

export const maxDuration = 60;
export const runtime = 'nodejs';

// Configurar rate limiting con Upstash Redis (si está disponible)
let ratelimit: Ratelimit | null = null;

if (process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN) {
  const redis = new Redis({
    url: process.env.UPSTASH_REDIS_REST_URL,
    token: process.env.UPSTASH_REDIS_REST_TOKEN,
  });

  ratelimit = new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(5, "10 m"), // 5 análisis cada 10 minutos
    analytics: true,
    prefix: "ai-impression-ratelimit",
  });
} else {
  console.warn("⚠️ Upstash Redis not configured - rate limiting disabled");
}

export async function POST(request: NextRequest) {
  console.log("=== API /analyze called ===");
  console.log("OpenRouter API key present:", !!process.env.OPENROUTER_API_KEY);
  console.log("Firecrawl API key present:", !!process.env.FIRECRAWL_API_KEY);
  
  try {
    // Rate limiting por IP (fail-open si Upstash falla)
    if (ratelimit) {
      try {
        const ip = request.headers.get("x-forwarded-for") || 
                   request.headers.get("x-real-ip") || 
                   "unknown";
        
        const { success, limit, remaining, reset } = await ratelimit.limit(ip);
        
        console.log(`🚦 Rate limit check for IP ${ip}: ${remaining}/${limit} remaining`);
        
        if (!success) {
          const resetDate = new Date(reset);
          const minutesUntilReset = Math.ceil((resetDate.getTime() - Date.now()) / 60000);
          
          return NextResponse.json<AnalysisResponse>(
            {
              success: false,
              error: `Has alcanzado el límite de análisis (${limit} cada 10 minutos). Intenta de nuevo en ${minutesUntilReset} minutos.`,
            },
            { 
              status: 429,
              headers: {
                "X-RateLimit-Limit": limit.toString(),
                "X-RateLimit-Remaining": remaining.toString(),
                "X-RateLimit-Reset": reset.toString(),
              }
            }
          );
        }
      } catch (rateLimitError) {
        // Fail-open: si Upstash falla, permitir el análisis
        console.error("⚠️ Rate limit check failed, proceeding (fail-open):", rateLimitError);
      }
    }
  
    // Validar que existe la API key de OpenRouter
    if (!process.env.OPENROUTER_API_KEY || process.env.OPENROUTER_API_KEY.trim() === '') {
      console.error("❌ OPENROUTER_API_KEY missing or empty");
      return NextResponse.json<AnalysisResponse>(
        {
          success: false,
          error: "Falta OPENROUTER_API_KEY en el entorno. Configura la variable de entorno en Vercel.",
        },
        { status: 500 }
      );
    }

    const body = await request.json();
    console.log("Request body received:", { url: body.url, targetAudience: body.targetAudience });

    const validationResult = analysisRequestSchema.safeParse(body);

    if (!validationResult.success) {
      const errorMessage = validationResult.error.issues[0]?.message || "Datos de entrada inválidos";
      console.error("Validation error:", errorMessage);
      return NextResponse.json<AnalysisResponse>(
        {
          success: false,
          error: errorMessage,
        },
        { status: 400 }
      );
    }

    const { url, targetAudience, pageGoal } = validationResult.data;
    console.log("Starting analysis for:", url);

    const analysis = await performAnalysis(url, targetAudience, pageGoal);
    console.log("✅ Analysis completed successfully");

    return NextResponse.json<AnalysisResponse>({
      success: true,
      data: analysis,
    });
  } catch (error) {
    // Log completo del error para debugging
    console.error("❌ Analysis error - Full details:");
    console.error("Error object:", error);
    console.error("Error message:", error instanceof Error ? error.message : String(error));
    console.error("Error stack:", error instanceof Error ? error.stack : 'No stack trace');

    const errorMessage =
      error instanceof Error ? error.message : "Ocurrió un error inesperado durante el análisis";

    return NextResponse.json<AnalysisResponse>(
      {
        success: false,
        error: `Error en el análisis: ${errorMessage}`,
      },
      { status: 500 }
    );
  }
}
