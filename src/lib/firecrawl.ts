import FirecrawlApp from "@mendable/firecrawl-js";
import type { WebsiteData } from "@/types";

const FIRECRAWL_TIMEOUT = 30000;

export async function extractWithFirecrawl(
  url: string
): Promise<Partial<WebsiteData>> {
  const apiKey = process.env.FIRECRAWL_API_KEY;

  if (!apiKey) {
    throw new Error("FIRECRAWL_API_KEY not configured");
  }

  try {
    const app = new FirecrawlApp({ apiKey });

    const result = await Promise.race([
      app.scrapeUrl(url, {
        formats: ["markdown", "html", "screenshot"],
      }),
      new Promise((_, reject) =>
        setTimeout(() => reject(new Error("Firecrawl timeout")), FIRECRAWL_TIMEOUT)
      ),
    ]);

    if (!result || typeof result !== "object") {
      throw new Error("Invalid Firecrawl response");
    }

    const data = result as any;

    const headings = {
      h1: [] as string[],
      h2: [] as string[],
      h3: [] as string[],
    };

    if (data.html) {
      const h1Matches = data.html.match(/<h1[^>]*>(.*?)<\/h1>/gi) || [];
      headings.h1 = h1Matches.map((h: string) => h.replace(/<[^>]*>/g, "").trim());

      const h2Matches = data.html.match(/<h2[^>]*>(.*?)<\/h2>/gi) || [];
      headings.h2 = h2Matches.map((h: string) => h.replace(/<[^>]*>/g, "").trim());

      const h3Matches = data.html.match(/<h3[^>]*>(.*?)<\/h3>/gi) || [];
      headings.h3 = h3Matches.map((h: string) => h.replace(/<[^>]*>/g, "").trim());
    }

    // Extraer screenshot si está disponible
    const screenshot = data.screenshot || undefined;
    
    if (screenshot) {
      console.log("📸 Screenshot captured successfully");
    } else {
      console.log("⚠️ No screenshot available from Firecrawl");
    }

    return {
      title: data.metadata?.title || data.title || "",
      description: data.metadata?.description || data.description || "",
      mainContent: data.markdown || data.content || "",
      headings,
      importantLinks: data.metadata?.links || [],
      screenshot,
    };
  } catch (error) {
    console.error("Firecrawl extraction error:", error);
    throw error;
  }
}
