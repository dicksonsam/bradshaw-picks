import { chromium, type Browser, type Page } from "playwright";
import { normalise, titlesMatch } from "./streaming";

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

interface SkySearchResult {
  data?: {
    search?: {
      results?: Array<{
        title?: string;
        type?: string;
      }>;
    };
  };
}

async function dismissCookieConsent(page: Page): Promise<void> {
  try {
    const consentButton = page.locator('[data-testid="cookie-consent-accept"], button:has-text("Accept"), button:has-text("Got it")');
    await consentButton.first().click({ timeout: 3000 });
    await delay(500);
  } catch {
    // No consent dialog present
  }
}

async function checkSkyAvailability(
  page: Page,
  title: string
): Promise<boolean> {
  const searchUrl = `https://www.nowtv.com/watch/search?q=${encodeURIComponent(title)}`;

  // Set up API response interception before navigating
  let apiResult: SkySearchResult | null = null;
  try {
    const [response] = await Promise.all([
      page.waitForResponse(
        (r) => r.url().includes("clip.search.sky.com"),
        { timeout: 10000 }
      ),
      page.goto(searchUrl, { waitUntil: "domcontentloaded", timeout: 15000 }),
    ]);
    apiResult = await response.json() as SkySearchResult;
  } catch {
    // Timeout or navigation error — fall through to DOM fallback
  }
  if (apiResult) {
    const results = apiResult?.data?.search?.results ?? [];
    for (const result of results) {
      if (result.title && titlesMatch(title, result.title)) {
        return true;
      }
    }
    return false;
  }

  // Fallback: check DOM for search results
  try {
    await page.waitForSelector('[data-testid="search-results"], .search-results, [class*="SearchResult"]', { timeout: 5000 });
    const resultTitles = await page.$$eval(
      '[data-testid="title"], h3, [class*="Title"]',
      (els) => els.map((el) => el.textContent?.trim() ?? "")
    );
    for (const resultTitle of resultTitles) {
      if (resultTitle && titlesMatch(title, resultTitle)) {
        return true;
      }
    }
  } catch {
    // No results found in DOM
  }

  return false;
}

const CONCURRENCY = 4;

export async function skyLookupWithProgress(
  items: { title: string }[],
  onProgress: (checked: number, total: number, title: string, found: boolean) => void,
  signal: AbortSignal
): Promise<Map<string, boolean>> {
  const results = new Map<string, boolean>();
  const total = items.length;
  let browser: Browser | null = null;

  try {
    browser = await chromium.launch({
      headless: true,
      args: [
        "--disable-blink-features=AutomationControlled",
        "--no-sandbox",
      ],
    });

    const context = await browser.newContext({
      userAgent:
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/137.0.0.0 Safari/537.36",
    });

    // Create pages upfront
    const pages: Page[] = [];
    for (let i = 0; i < Math.min(CONCURRENCY, total); i++) {
      pages.push(await context.newPage());
    }

    // Dismiss cookie consent on first page only (cookies shared via context)
    await pages[0].goto("https://www.nowtv.com", {
      waitUntil: "domcontentloaded",
      timeout: 15000,
    });
    await dismissCookieConsent(pages[0]);

    // Shared queue index and checked counter
    let nextIndex = 0;
    let checkedCount = 0;

    const worker = async (page: Page) => {
      while (true) {
        if (signal.aborted) break;
        const idx = nextIndex++;
        if (idx >= total) break;

        const { title } = items[idx];

        let found = false;
        try {
          found = await checkSkyAvailability(page, title);
        } catch (err) {
          console.warn(`Sky lookup failed for "${title}":`, err);
        }

        results.set(title, found);
        checkedCount++;
        onProgress(checkedCount, total, title, found);

        if (!signal.aborted) {
          await delay(1000);
        }
      }
    };

    await Promise.all(pages.map((page, i) => delay(i * 250).then(() => worker(page))));
  } finally {
    if (browser) {
      await browser.close().catch(() => {});
    }
  }

  return results;
}
