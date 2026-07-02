import type { AnalysisResult, WebsiteData } from "@/types";
import { extractWithFirecrawl } from "./firecrawl";
import { analyzeWithAI } from "./openrouter";
import { getMockAnalysis } from "./mock";
import { getCachedAnalysis, setCachedAnalysis } from "./cache";

export async function performAnalysis(
  url: string,
  targetAudience: string,
  pageGoal?: string
): Promise<AnalysisResult> {
  console.log("Starting performAnalysis for:", url);
  
  // Verificar caché primero
  const cachedResult = await getCachedAnalysis(url, targetAudience, pageGoal);
  if (cachedResult) {
    console.log("📦 Returning cached analysis (saves API costs)");
    return cachedResult;
  }
  
  const websiteData: WebsiteData = {
    url,
    title: "",
    description: "",
    mainContent: "",
    headings: { h1: [], h2: [], h3: [] },
    visibleButtons: [],
    importantLinks: [],
    callsToAction: [],
    contactInfo: [],
    trustSignals: [],
  };

  let extractionSuccess = false;

  // Intentar primero con Firecrawl
  try {
    console.log("Attempting extraction with Firecrawl...");
    const firecrawlData = await extractWithFirecrawl(url);
    Object.assign(websiteData, firecrawlData);
    extractionSuccess = true;
    console.log("✅ Successfully extracted data with Firecrawl");
  } catch (error) {
    console.error("❌ Firecrawl failed:", error instanceof Error ? error.message : String(error));
    // Ya no hay fallback a Playwright - solo Firecrawl en producción
  }

  if (!extractionSuccess) {
    throw new Error(
      "No se pudo extraer el contenido del sitio web. " +
      "Verifica que la URL sea accesible y que Firecrawl API key esté configurada correctamente."
    );
  }

  // Validar contenido mínimo para evitar análisis con datos insuficientes
  const combinedContent = `${websiteData.title || ""} ${websiteData.mainContent || ""}`.trim();
  const contentLength = combinedContent.length;
  
  console.log(`📊 Content extracted - Length: ${contentLength} chars`);
  console.log(`📄 Content preview (first 200 chars): ${combinedContent.slice(0, 200)}...`);

  if (contentLength < 300) {
    throw new Error(
      "No pudimos leer suficiente contenido de esta web. Puede estar bloqueando el acceso automatizado " +
      "o requerir JavaScript para cargar el contenido. Intenta con otra URL."
    );
  }

  const hasOpenRouterKey = !!process.env.OPENROUTER_API_KEY;
  const isDevelopment = process.env.NODE_ENV !== 'production';

  // Modo mock SOLO en desarrollo cuando falta API key
  if (!hasOpenRouterKey) {
    if (isDevelopment) {
      console.log("⚠️ No OpenRouter API key found in development, using mock analysis");
      return getMockAnalysis(url, targetAudience, pageGoal);
    } else {
      // En producción, si falta API key es un error fatal
      throw new Error(
        "El análisis no está disponible en este momento. Configuración del servidor incompleta."
      );
    }
  }

  try {
    console.log("Starting AI analysis...");
    const analysis = await analyzeWithAI(websiteData, targetAudience, pageGoal);
    console.log("✅ AI analysis completed");
    
    // Guardar en caché para futuras consultas
    await setCachedAnalysis(url, targetAudience, analysis, pageGoal);
    
    return analysis;
  } catch (error) {
    console.error("❌ AI analysis failed:", error);
    const errorMsg = error instanceof Error ? error.message : "Error desconocido";
    throw new Error(`Análisis con IA falló: ${errorMsg}`);
  }
}
