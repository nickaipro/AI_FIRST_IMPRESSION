import type { AnalysisResult, WebsiteData } from "@/types";
import { extractWithFirecrawl } from "./firecrawl";
import { extractWithPlaywright } from "./playwright";
import { analyzeWithAI } from "./openrouter";
import { getMockAnalysis } from "./mock";

export async function performAnalysis(
  url: string,
  targetAudience: string,
  pageGoal?: string
): Promise<AnalysisResult> {
  console.log("Starting performAnalysis for:", url);
  
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
    console.log("⚠️ Firecrawl failed:", error instanceof Error ? error.message : String(error));

    // Intentar con Playwright solo si estamos en desarrollo o si Firecrawl falló
    // En producción (Vercel), Playwright probablemente no funcionará sin configuración especial
    if (process.env.NODE_ENV === 'development') {
      try {
        console.log("Attempting extraction with Playwright...");
        const playwrightData = await extractWithPlaywright(url);
        Object.assign(websiteData, playwrightData);
        extractionSuccess = true;
        console.log("✅ Successfully extracted data with Playwright");
      } catch (playwrightError) {
        console.error("❌ Playwright also failed:", playwrightError);
      }
    } else {
      console.log("⚠️ Skipping Playwright in production environment");
    }
  }

  if (!extractionSuccess) {
    throw new Error(
      "No se pudo extraer el contenido del sitio web. " +
      "Verifica que la URL sea accesible y que Firecrawl API key esté configurada correctamente."
    );
  }

  if (!websiteData.title && !websiteData.mainContent) {
    throw new Error(
      "El contenido extraído está vacío. El sitio web puede estar bloqueando el acceso automatizado."
    );
  }

  const hasOpenRouterKey = !!process.env.OPENROUTER_API_KEY;

  if (!hasOpenRouterKey) {
    console.log("⚠️ No OpenRouter API key found, using mock analysis");
    return getMockAnalysis(url, targetAudience, pageGoal);
  }

  try {
    console.log("Starting AI analysis...");
    const analysis = await analyzeWithAI(websiteData, targetAudience, pageGoal);
    console.log("✅ AI analysis completed");
    return analysis;
  } catch (error) {
    console.error("❌ AI analysis failed:", error);
    const errorMsg = error instanceof Error ? error.message : "Error desconocido";
    throw new Error(`Análisis con IA falló: ${errorMsg}`);
  }
}
