import { NextRequest, NextResponse } from "next/server";
import { analysisRequestSchema } from "@/lib/validation";
import { performAnalysis } from "@/lib/analyzer";
import type { AnalysisResponse } from "@/types";

export const maxDuration = 60;
export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  console.log("=== API /analyze called ===");
  console.log("OpenRouter API key present:", !!process.env.OPENROUTER_API_KEY);
  console.log("Firecrawl API key present:", !!process.env.FIRECRAWL_API_KEY);
  
  try {
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
