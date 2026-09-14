/**
 * Deep Country Resolution Engine
 * Goes deep for ambiguous and generic domains (.com, .net, .org, .io, .co, etc.)
 * by combining:
 * 1. Offline high-speed corporate registry & ccTLD maps
 * 2. Live website contact page & impressum deep scraping (Schema.org address, phone dialing codes, legal entity forms)
 * 3. Multi-engine search grounding (DuckDuckGo Instant Answer, DuckDuckGo Organic, Google search)
 * 4. DNS MX mail exchanger host country deduction
 * 5. Gemini AI synthesis (when API key is configured)
 */

import dns from 'dns';
import { promisify } from 'util';
import { 
  GLOBAL_COUNTRIES, 
  getCountryFlag, 
  cleanDomainName, 
  analyzeWebsiteHtmlForCountry, 
  analyzeSearchSnippetForCountry,
  type DomainCountryResolution 
} from './countryDetector';
import { classifyCountryOffline, GLOBAL_CORPORATE_DOMAINS, DOMAIN_LOCATION_HINTS } from './offlineClassifier';
import { GoogleGenAI } from '@google/genai';

const resolveMx = promisify(dns.resolveMx);

// In-memory cache to prevent redundant scraping of common domains
const resolutionCache = new Map<string, DomainCountryResolution>();

const BROWSER_HEADERS = {
  "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
  "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8",
  "Accept-Language": "en-US,en;q=0.9"
};

/**
 * Probe website homepage and key contact/about/impressum pages
 */
async function crawlWebsiteForCountry(domain: string): Promise<DomainCountryResolution | null> {
  const cleanDomain = cleanDomainName(domain);
  if (!cleanDomain) return null;

  const targetUrls = [
    `https://${cleanDomain}`,
    `https://www.${cleanDomain}`,
    `http://${cleanDomain}`
  ];

  let homepageHtml = '';
  let successfulBase = '';

  // 1. Fetch Homepage
  for (const url of targetUrls) {
    try {
      const res = await fetch(url, {
        headers: BROWSER_HEADERS,
        redirect: 'follow',
        signal: AbortSignal.timeout(3500)
      });
      if (res.ok) {
        homepageHtml = await res.text();
        successfulBase = url;
        break;
      }
    } catch {}
  }

  // 2. Analyze Homepage Content
  if (homepageHtml) {
    const homeAnalysis = analyzeWebsiteHtmlForCountry(homepageHtml, cleanDomain);
    if (homeAnalysis && homeAnalysis.confidence >= 85) {
      return {
        domain: cleanDomain,
        country: homeAnalysis.country,
        confidence: homeAnalysis.confidence,
        method: homeAnalysis.method,
        evidence: homeAnalysis.evidence,
        flag: getCountryFlag(homeAnalysis.country)
      };
    }

    // 3. Proactively Probe Contact & Impressum Pages
    // Discover contact links in homepage HTML or try standard paths
    const contactPaths = ['/contact', '/contact-us', '/impressum', '/kontakt', '/about', '/about-us', '/legal'];
    const contactLinksFound = Array.from(homepageHtml.matchAll(/<a[^>]+href=["']([^"']*(?:contact|impressum|kontakt|about)[^"']*)["']/gi))
      .map(m => m[1])
      .filter(href => !href.startsWith('#') && !href.startsWith('mailto:') && !href.startsWith('tel:'))
      .slice(0, 3);

    const pagesToProbe = new Set<string>();
    for (const link of contactLinksFound) {
      if (link.startsWith('http')) {
        pagesToProbe.add(link);
      } else if (successfulBase) {
        pagesToProbe.add(new URL(link, successfulBase).href);
      }
    }
    // Add default fallbacks
    for (const p of contactPaths.slice(0, 3)) {
      if (successfulBase) pagesToProbe.add(`${successfulBase}${p}`);
    }

    for (const pageUrl of Array.from(pagesToProbe).slice(0, 4)) {
      try {
        const contactRes = await fetch(pageUrl, {
          headers: BROWSER_HEADERS,
          redirect: 'follow',
          signal: AbortSignal.timeout(2800)
        });
        if (contactRes.ok) {
          const contactHtml = await contactRes.text();
          const contactAnalysis = analyzeWebsiteHtmlForCountry(contactHtml, cleanDomain);
          if (contactAnalysis) {
            return {
              domain: cleanDomain,
              country: contactAnalysis.country,
              confidence: contactAnalysis.confidence,
              method: contactAnalysis.method,
              evidence: `${contactAnalysis.evidence} (verified on ${pageUrl.replace(/^https?:\/\/[^\/]+/, '') || '/'})`,
              flag: getCountryFlag(contactAnalysis.country)
            };
          }
        }
      } catch {}
    }

    // If home had a lower confidence match, return it now
    if (homeAnalysis) {
      return {
        domain: cleanDomain,
        country: homeAnalysis.country,
        confidence: homeAnalysis.confidence,
        method: homeAnalysis.method,
        evidence: homeAnalysis.evidence,
        flag: getCountryFlag(homeAnalysis.country)
      };
    }
  }

  return null;
}

/**
 * Multi-Engine Search Grounding for Domain Headquarters
 */
async function searchEngineCountryGrounding(domain: string): Promise<DomainCountryResolution | null> {
  const cleanDomain = cleanDomainName(domain);

  // 1. DuckDuckGo Instant Answer API (Instant, structured, zero rate limits)
  try {
    const ddgApiUrl = `https://api.duckduckgo.com/?q=${encodeURIComponent(cleanDomain)}&format=json&no_html=1&skip_disambig=1`;
    const ddgRes = await fetch(ddgApiUrl, { signal: AbortSignal.timeout(2500) });
    if (ddgRes.ok) {
      const data = await ddgRes.json();
      const text = `${data.Heading || ''} ${data.AbstractText || ''}`;
      if (text.trim().length >= 25) {
        const analysis = analyzeSearchSnippetForCountry(text, data.Heading);
        if (analysis) {
          return {
            domain: cleanDomain,
            country: analysis.country,
            confidence: analysis.confidence,
            method: 'search_engine',
            evidence: `DuckDuckGo Instant Answer: ${analysis.evidence}`,
            flag: getCountryFlag(analysis.country)
          };
        }
      }
    }
  } catch {}

  // 2. DuckDuckGo Organic Search Engine
  try {
    const dorkQuery = `"${cleanDomain}" (headquarters OR "head office" OR "contact us" OR impressum OR address)`;
    const ddgHtmlUrl = `https://html.duckduckgo.com/html/?q=${encodeURIComponent(dorkQuery)}`;
    const ddgRes = await fetch(ddgHtmlUrl, {
      headers: BROWSER_HEADERS,
      signal: AbortSignal.timeout(3200)
    });

    if (ddgRes.ok) {
      const html = await ddgRes.text();
      const snippetMatches = Array.from(html.matchAll(/<a[^>]+class="[^"]*result__snippet[^"]*"[^>]*>([\s\S]*?)<\/a>/gi));
      for (const sm of snippetMatches) {
        const cleanSnippet = sm[1].replace(/<[^>]*>/g, '').trim();
        if (cleanSnippet.length >= 30) {
          const analysis = analyzeSearchSnippetForCountry(cleanSnippet);
          if (analysis) {
            return {
              domain: cleanDomain,
              country: analysis.country,
              confidence: analysis.confidence,
              method: 'search_engine',
              evidence: `DuckDuckGo Search snippet: ${analysis.evidence}`,
              flag: getCountryFlag(analysis.country)
            };
          }
        }
      }
    }
  } catch {}

  // 3. Google Organic Search Engine (fallback)
  try {
    const gQuery = `"${cleanDomain}" headquarters OR "contact us" OR country`;
    const gUrl = `https://www.google.com/search?q=${encodeURIComponent(gQuery)}&hl=en`;
    const gRes = await fetch(gUrl, {
      headers: BROWSER_HEADERS,
      signal: AbortSignal.timeout(3200)
    });

    if (gRes.ok) {
      const gHtml = await gRes.text();
      const snippetMatches = Array.from(gHtml.matchAll(/<div[^>]+class="[^"]*(?:BNeawe\s+s3v9rd|VwiC3b|yXK7lf)[^"]*"[^>]*>([\s\S]*?)<\/div>/gi));
      for (const sm of snippetMatches) {
        const text = sm[1].replace(/<[^>]*>/g, '').trim();
        if (text.length >= 30 && !text.includes('Missing:') && !text.includes('Must include:')) {
          const analysis = analyzeSearchSnippetForCountry(text);
          if (analysis) {
            return {
              domain: cleanDomain,
              country: analysis.country,
              confidence: analysis.confidence,
              method: 'search_engine',
              evidence: `Google Search snippet: ${analysis.evidence}`,
              flag: getCountryFlag(analysis.country)
            };
          }
        }
      }
    }
  } catch {}

  return null;
}

/**
 * Check DNS Mail Exchanger (MX) host for regional country indicators
 */
async function checkDnsMxCountry(domain: string): Promise<DomainCountryResolution | null> {
  const cleanDomain = cleanDomainName(domain);
  try {
    const mxRecords = await resolveMx(cleanDomain);
    if (mxRecords && mxRecords.length > 0) {
      mxRecords.sort((a, b) => a.priority - b.priority);
      for (const record of mxRecords.slice(0, 2)) {
        const mxHost = record.exchange.toLowerCase();
        const parts = mxHost.split('.');
        const lastPart = parts[parts.length - 1];
        
        // Exclude generic global mail hosts (google, outlook, protonmail, etc.)
        if (['com', 'net', 'org'].includes(lastPart)) {
          if (mxHost.includes('ovh.net')) {
            return {
              domain: cleanDomain,
              country: 'France',
              confidence: 76,
              method: 'cctld',
              evidence: `Regional French MX mail provider: ${record.exchange}`,
              flag: getCountryFlag('France')
            };
          }
          if (mxHost.includes('hetzner')) {
            return {
              domain: cleanDomain,
              country: 'Germany',
              confidence: 76,
              method: 'cctld',
              evidence: `Regional German MX host: ${record.exchange}`,
              flag: getCountryFlag('Germany')
            };
          }
          continue;
        }

        // Check if MX host has a distinct ccTLD (.de, .fr, .it, .uk, .jp, .ch, etc.)
        for (const [countryName, info] of Object.entries(GLOBAL_COUNTRIES)) {
          if (info.cctld === lastPart) {
            return {
              domain: cleanDomain,
              country: countryName,
              confidence: 84,
              method: 'cctld',
              evidence: `Official MX mail server registered under .${lastPart} (${record.exchange})`,
              flag: info.flag
            };
          }
        }
      }
    }
  } catch {}

  return null;
}

/**
 * AI Grounding with Gemini (Optional fallback for remaining tricky domains)
 */
async function aiCountryReasoning(domains: string[], apiKey?: string): Promise<Map<string, DomainCountryResolution>> {
  const results = new Map<string, DomainCountryResolution>();
  const effectiveKey = apiKey || process.env.GEMINI_API_KEY;
  if (!effectiveKey || domains.length === 0) return results;

  try {
    const ai = new GoogleGenAI({ apiKey: effectiveKey });
    const prompt = `You are an expert corporate intelligence investigator. Identify the authentic country headquarters for the following company domains:
${domains.join('\n')}

For each domain, identify the primary country where the company is headquartered or founded.
Return strictly a JSON array of objects with the exact structure:
[
  { "domain": "example.com", "country": "Country Name", "confidence": 90, "reason": "Brief 1-sentence explanation" }
]
Only use recognized sovereign country names (e.g. "United States", "Germany", "United Kingdom", "France", "Japan", etc.). If completely impossible to determine, set country to "Unknown".`;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json'
      }
    });

    const jsonText = response.text?.trim() || '';
    if (jsonText) {
      const parsed = JSON.parse(jsonText);
      if (Array.isArray(parsed)) {
        for (const item of parsed) {
          if (item && item.domain && item.country && item.country !== 'Unknown') {
            results.set(cleanDomainName(item.domain), {
              domain: cleanDomainName(item.domain),
              country: item.country,
              confidence: item.confidence || 85,
              method: 'ai_grounding',
              evidence: item.reason || 'Gemini corporate grounding verified headquarters',
              flag: getCountryFlag(item.country)
            });
          }
        }
      }
    }
  } catch (err: any) {
    console.warn("[Deep Country AI Grounding] Notice:", err.message);
  }

  return results;
}

/**
 * Resolve a single domain using all deep methods sequentially
 */
export async function resolveDomainDeeply(domain: string, apiKey?: string): Promise<DomainCountryResolution> {
  const cleanDomain = cleanDomainName(domain);
  if (!cleanDomain) {
    return { domain, country: 'Unknown', confidence: 0, method: 'unknown', flag: '🌐' };
  }

  // 1. Check memory cache
  if (resolutionCache.has(cleanDomain)) {
    return resolutionCache.get(cleanDomain)!;
  }

  // 2. High-speed offline check (ccTLD & Corporate Registry)
  const offlineMatch = classifyCountryOffline(cleanDomain);
  if (offlineMatch) {
    const isCorp = Boolean(GLOBAL_CORPORATE_DOMAINS[cleanDomain]);
    const res: DomainCountryResolution = {
      domain: cleanDomain,
      country: offlineMatch,
      confidence: isCorp ? 99 : 98,
      method: isCorp ? 'corporate_registry' : 'cctld',
      evidence: isCorp ? 'Global enterprise corporate headquarters registry' : `ccTLD country code extension: .${cleanDomain.split('.').pop()}`,
      flag: getCountryFlag(offlineMatch)
    };
    resolutionCache.set(cleanDomain, res);
    return res;
  }

  // Check domain keyword location hints
  for (const hint of DOMAIN_LOCATION_HINTS) {
    if (hint.pattern.test(cleanDomain)) {
      const res: DomainCountryResolution = {
        domain: cleanDomain,
        country: hint.country,
        confidence: 90,
        method: 'domain_pattern',
        evidence: `Domain title incorporates distinct geographic location pattern: ${hint.country}`,
        flag: getCountryFlag(hint.country)
      };
      resolutionCache.set(cleanDomain, res);
      return res;
    }
  }

  // --- GO DEEPER: Ambiguous generic domains (.com, .net, .org, .io, .co, .app, .ai, etc.) ---

  // Step A: Live Website Contact & Impressum Page Crawling
  try {
    const webResult = await crawlWebsiteForCountry(cleanDomain);
    if (webResult && webResult.country !== 'Unknown' && webResult.confidence >= 80) {
      resolutionCache.set(cleanDomain, webResult);
      return webResult;
    }
  } catch (e: any) {
    console.warn(`[Deep Country] Web crawl notice for ${cleanDomain}:`, e.message);
  }

  // Step B: Multi-Engine Search Grounding (DuckDuckGo / Google)
  try {
    const searchResult = await searchEngineCountryGrounding(cleanDomain);
    if (searchResult && searchResult.country !== 'Unknown') {
      resolutionCache.set(cleanDomain, searchResult);
      return searchResult;
    }
  } catch (e: any) {
    console.warn(`[Deep Country] Search grounding notice for ${cleanDomain}:`, e.message);
  }

  // Step C: DNS MX Mail Exchanger Country Indicator
  try {
    const mxResult = await checkDnsMxCountry(cleanDomain);
    if (mxResult && mxResult.country !== 'Unknown') {
      resolutionCache.set(cleanDomain, mxResult);
      return mxResult;
    }
  } catch {}

  // Fallback default for remaining unresolved .com / generic domains
  const fallback: DomainCountryResolution = {
    domain: cleanDomain,
    country: 'Unknown',
    confidence: 0,
    method: 'unknown',
    evidence: 'Domain has generic extension (.com/.net/.org) with no public physical contact page or search entity',
    flag: '🌐'
  };

  resolutionCache.set(cleanDomain, fallback);
  return fallback;
}

/**
 * Resolve a batch of domains concurrently with controlled pool size
 */
export async function resolveBatchDomainsDeeply(
  domains: string[],
  apiKey?: string,
  concurrency = 5
): Promise<DomainCountryResolution[]> {
  const cleanDomains = Array.from(new Set(domains.map(cleanDomainName).filter(Boolean)));
  const results: DomainCountryResolution[] = [];

  // Split into chunks of `concurrency`
  for (let i = 0; i < cleanDomains.length; i += concurrency) {
    const chunk = cleanDomains.slice(i, i + concurrency);
    const chunkPromises = chunk.map(dom => resolveDomainDeeply(dom, apiKey));
    const chunkResults = await Promise.all(chunkPromises);
    results.push(...chunkResults);
  }

  // For domains still 'Unknown', if Gemini API key exists, do a quick batch AI lookup
  const stillUnknown = results.filter(r => r.country === 'Unknown').map(r => r.domain);
  if (stillUnknown.length > 0 && (apiKey || process.env.GEMINI_API_KEY)) {
    try {
      const aiResults = await aiCountryReasoning(stillUnknown.slice(0, 30), apiKey);
      for (let i = 0; i < results.length; i++) {
        if (results[i].country === 'Unknown' && aiResults.has(results[i].domain)) {
          results[i] = aiResults.get(results[i].domain)!;
          resolutionCache.set(results[i].domain, results[i]);
        }
      }
    } catch {}
  }

  return results;
}
