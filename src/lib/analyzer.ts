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

  try {
    const firecrawlData = await extractWithFirecrawl(url);
    Object.assign(websiteData, firecrawlData);
    extractionSuccess = true;
    console.log("Successfully extracted data with Firecrawl");
  } catch (error) {
    console.log("Firecrawl failed, trying Playwright...");

    try {
      const playwrightData = await extractWithPlaywright(url);
      Object.assign(websiteData, playwrightData);
      extractionSuccess = true;
      console.log("Successfully extracted data with Playwright");
    } catch (playwrightError) {
      console.error("Playwright also failed:", playwrightError);
      throw new Error(
        "Failed to extract website data. The site may be blocking automated access."
      );
    }
  }

  if (!extractionSuccess) {
    throw new Error("Could not extract website data");
  }

  if (!websiteData.title && !websiteData.mainContent) {
    throw new Error("Extracted data is empty. The website may be blocking access.");
  }

  const hasOpenRouterKey = !!process.env.OPENROUTER_API_KEY;

  if (!hasOpenRouterKey) {
    console.log("No OpenRouter API key found, using mock analysis");
    return getMockAnalysis(url, targetAudience, pageGoal);
  }

  try {
    const analysis = await analyzeWithAI(websiteData, targetAudience, pageGoal);
    return analysis;
  } catch (error) {
    console.error("AI analysis failed:", error);
    throw new Error(
      `AI analysis failed: ${error instanceof Error ? error.message : "Unknown error"}`
    );
  }
}
