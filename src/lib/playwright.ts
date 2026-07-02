import { chromium, Browser, Page } from "playwright";
import type { WebsiteData } from "@/types";

const PLAYWRIGHT_TIMEOUT = 30000;
const VIEWPORT_HEIGHT = 1080;
const VIEWPORT_WIDTH = 1920;

let browser: Browser | null = null;

async function getBrowser(): Promise<Browser> {
  if (!browser) {
    browser = await chromium.launch({
      headless: true,
    });
  }
  return browser;
}

export async function extractWithPlaywright(
  url: string
): Promise<Partial<WebsiteData>> {
  let page: Page | null = null;

  try {
    const browser = await getBrowser();
    page = await browser.newPage({
      viewport: { width: VIEWPORT_WIDTH, height: VIEWPORT_HEIGHT },
    });

    await page.goto(url, {
      timeout: PLAYWRIGHT_TIMEOUT,
      waitUntil: "domcontentloaded",
    });

    await page.waitForTimeout(2000);

    const data = await page.evaluate(() => {
      const getVisibleText = (element: Element): string => {
        const style = window.getComputedStyle(element);
        if (
          style.display === "none" ||
          style.visibility === "hidden" ||
          style.opacity === "0"
        ) {
          return "";
        }
        return element.textContent?.trim() || "";
      };

      const title = document.title;
      const description =
        document.querySelector('meta[name="description"]')?.getAttribute("content") || "";

      const h1Elements = Array.from(document.querySelectorAll("h1"))
        .map(getVisibleText)
        .filter(Boolean);

      const h2Elements = Array.from(document.querySelectorAll("h2"))
        .map(getVisibleText)
        .filter(Boolean);

      const h3Elements = Array.from(document.querySelectorAll("h3"))
        .map(getVisibleText)
        .filter(Boolean);

      const buttons = Array.from(
        document.querySelectorAll(
          'button, a[role="button"], input[type="submit"], input[type="button"]'
        )
      )
        .map(getVisibleText)
        .filter(Boolean);

      const mainContent =
        document.querySelector("main")?.textContent?.trim() ||
        document.querySelector("article")?.textContent?.trim() ||
        document.body.textContent?.trim() ||
        "";

      const links = Array.from(document.querySelectorAll("a"))
        .map((a) => ({
          text: getVisibleText(a),
          href: a.getAttribute("href") || "",
        }))
        .filter((link) => link.text && link.href)
        .slice(0, 20);

      const ctaKeywords = [
        "get started",
        "sign up",
        "try",
        "book",
        "schedule",
        "demo",
        "contact",
        "buy",
        "start",
        "learn more",
      ];

      const callsToAction = buttons.filter((btn) =>
        ctaKeywords.some((keyword) => btn.toLowerCase().includes(keyword))
      );

      const contactInfo: string[] = [];
      const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
      const phoneRegex = /(\+?[\d\s-()]+){7,}/g;

      const bodyText = document.body.textContent || "";
      const emails = bodyText.match(emailRegex) || [];
      const phones = bodyText.match(phoneRegex) || [];

      contactInfo.push(...emails.slice(0, 3));
      contactInfo.push(...phones.slice(0, 3));

      const trustKeywords = ["trusted", "certified", "award", "since", "client", "customer"];
      const trustElements = Array.from(document.querySelectorAll("*"))
        .filter((el) => {
          const text = getVisibleText(el);
          return (
            text.length < 200 &&
            trustKeywords.some((keyword) => text.toLowerCase().includes(keyword))
          );
        })
        .map(getVisibleText)
        .filter(Boolean)
        .slice(0, 10);

      return {
        title,
        description,
        mainContent: mainContent.slice(0, 5000),
        headings: {
          h1: h1Elements.slice(0, 5),
          h2: h2Elements.slice(0, 10),
          h3: h3Elements.slice(0, 10),
        },
        visibleButtons: buttons.slice(0, 20),
        importantLinks: links.map((l) => l.text),
        callsToAction,
        contactInfo,
        trustSignals: trustElements,
      };
    });

    const screenshot = await page.screenshot({
      type: "png",
      fullPage: false,
    });

    const screenshotBase64 = screenshot.toString("base64");

    return {
      ...data,
      screenshot: screenshotBase64,
    };
  } catch (error) {
    console.error("Playwright extraction error:", error);
    throw error;
  } finally {
    if (page) {
      await page.close();
    }
  }
}

export async function closeBrowser(): Promise<void> {
  if (browser) {
    await browser.close();
    browser = null;
  }
}
