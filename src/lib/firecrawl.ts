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

    const visibleButtons: string[] = [];
    const callsToAction: string[] = [];
    const contactInfo: string[] = [];
    const trustSignals: string[] = [];

    if (data.html) {
      // Extraer headings
      const h1Matches = data.html.match(/<h1[^>]*>(.*?)<\/h1>/gi) || [];
      headings.h1 = h1Matches.map((h: string) => h.replace(/<[^>]*>/g, "").trim());

      const h2Matches = data.html.match(/<h2[^>]*>(.*?)<\/h2>/gi) || [];
      headings.h2 = h2Matches.map((h: string) => h.replace(/<[^>]*>/g, "").trim());

      const h3Matches = data.html.match(/<h3[^>]*>(.*?)<\/h3>/gi) || [];
      headings.h3 = h3Matches.map((h: string) => h.replace(/<[^>]*>/g, "").trim());

      // Extraer botones visibles
      const buttonMatches = data.html.match(/<button[^>]*>(.*?)<\/button>/gi) || [];
      visibleButtons.push(
        ...buttonMatches
          .map((b: string) => b.replace(/<[^>]*>/g, "").trim())
          .filter((text: string) => text.length > 0 && text.length < 100)
          .slice(0, 15)
      );

      // Extraer enlaces que parecen botones (class con btn, button, cta)
      const linkButtonMatches = data.html.match(/<a[^>]*class="[^"]*(?:btn|button|cta)[^"]*"[^>]*>(.*?)<\/a>/gi) || [];
      visibleButtons.push(
        ...linkButtonMatches
          .map((a: string) => a.replace(/<[^>]*>/g, "").trim())
          .filter((text: string) => text.length > 0 && text.length < 100)
          .slice(0, 10)
      );

      // Extraer CTAs (texto tipo: "Get Started", "Sign Up", "Buy Now", "Learn More", "Contact", "Demo")
      const ctaPatterns = /(?:get\s+started|sign\s+up|try\s+(?:free|now)|buy\s+now|shop\s+now|learn\s+more|contact\s+(?:us|sales)|request\s+(?:demo|quote)|book\s+(?:now|demo)|start\s+free|join\s+(?:now|free)|subscribe|download)/gi;
      const ctaMatches = data.html.match(new RegExp(`<(?:button|a)[^>]*>([^<]*(?:${ctaPatterns.source})[^<]*)<\/(?:button|a)>`, 'gi')) || [];
      callsToAction.push(
        ...ctaMatches
          .map((cta: string) => cta.replace(/<[^>]*>/g, "").trim())
          .filter((text: string) => text.length > 0 && text.length < 100)
          .slice(0, 10)
      );

      // Extraer contactInfo (emails, teléfonos, mailto, tel)
      const emailMatches = data.html.match(/[\w.-]+@[\w.-]+\.\w+/g) || [];
      contactInfo.push(...emailMatches.slice(0, 3));

      const phoneMatches = data.html.match(/(?:\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/g) || [];
      contactInfo.push(...phoneMatches.slice(0, 3));

      const mailtoMatches = data.html.match(/href="mailto:([^"]+)"/gi) || [];
      contactInfo.push(
        ...mailtoMatches
          .map((m: string) => m.replace(/href="mailto:|"/gi, "").trim())
          .slice(0, 2)
      );

      // Extraer trust signals (testimonios, clientes, trusted by, ratings, logos)
      const trustPatterns = [
        /testimonial/i,
        /reviews?/i,
        /trusted\s+by/i,
        /clients?/i,
        /customers?/i,
        /(?:rating|stars?):\s*[\d.]+/i,
        /used\s+by\s+\d+/i,
        /featured\s+in/i,
      ];

      trustPatterns.forEach(pattern => {
        const matches = data.html.match(new RegExp(`<[^>]*>(.*?${pattern.source}.*?)<\/[^>]*>`, 'gi')) || [];
        trustSignals.push(
          ...matches
            .map((m: string) => m.replace(/<[^>]*>/g, "").trim())
            .filter((text: string) => text.length > 5 && text.length < 150)
            .slice(0, 3)
        );
      });

      // Eliminar duplicados
      const uniqueButtons = [...new Set(visibleButtons)];
      const uniqueCTAs = [...new Set(callsToAction)];
      const uniqueContact = [...new Set(contactInfo)];
      const uniqueTrust = [...new Set(trustSignals)];

      visibleButtons.length = 0;
      visibleButtons.push(...uniqueButtons);
      callsToAction.length = 0;
      callsToAction.push(...uniqueCTAs);
      contactInfo.length = 0;
      contactInfo.push(...uniqueContact);
      trustSignals.length = 0;
      trustSignals.push(...uniqueTrust);
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
      importantLinks: data.links || data.metadata?.links || [],
      screenshot,
      visibleButtons,
      callsToAction,
      contactInfo,
      trustSignals,
    };
  } catch (error) {
    console.error("Firecrawl extraction error:", error);
    throw error;
  }
}
