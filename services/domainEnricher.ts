import { GoogleGenAI } from "@google/genai";
import { classifyCountryOffline, classifyIndustryOffline, INDUSTRY_KEYWORDS, TLD_TO_COUNTRY, GLOBAL_CORPORATE_DOMAINS } from "./offlineClassifier";

export interface CompanyIntelligenceResult {
  domain: string;
  companyName: string;
  industry: string;
  subCategory?: string;
  overview: string;
  businessModel?: string;
  headquarters?: string;
  title?: string;
  metaDescription?: string;
  searchSnippet?: string;
  websiteUrl?: string;
  websiteStatus: 'online' | 'unreachable' | 'offline';
  favicon?: string;
  confidenceScore?: number;
  isAiEnhanced?: boolean;
}

// In-memory cache for fast repeated domain queries
const domainCache = new Map<string, CompanyIntelligenceResult>();

// Lazy Gemini SDK client initialization
let geminiClient: GoogleGenAI | null = null;
function getGemini(): GoogleGenAI | null {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return null;
  if (!geminiClient) {
    geminiClient = new GoogleGenAI({ apiKey });
  }
  return geminiClient;
}

/**
 * Clean and decode HTML entities
 */
function decodeHtmlEntities(text: string): string {
  if (!text) return '';
  return text
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&apos;/g, "'")
    .replace(/&nbsp;/g, ' ')
    .replace(/&mdash;/g, '—')
    .replace(/&ndash;/g, '–')
    .replace(/&bull;/g, '•')
    .replace(/&#(\d+);/g, (_, code) => String.fromCharCode(parseInt(code, 10)))
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Clean company name from page title or domain
 */
function cleanCompanyName(title: string, ogSiteName: string, domain: string): string {
  if (ogSiteName && ogSiteName.length >= 2 && ogSiteName.length <= 50) {
    return ogSiteName.trim();
  }

  if (title) {
    // Titles often look like: "Stripe | Financial Infrastructure for the Internet" or "Acme Corp - Home"
    const cleaned = title.split(/[-|–—:•]/)[0].trim();
    const badTokens = /^(home|welcome|official|login|index|default|untitled|untitled document)$/i;
    if (cleaned.length >= 2 && cleaned.length <= 50 && !badTokens.test(cleaned)) {
      return cleaned;
    }
  }

  // Fallback to domain name beautification
  const root = domain.replace(/\.[a-z]{2,}(\.[a-z]{2,})?$/i, '').replace(/^www\./, '');
  return root.charAt(0).toUpperCase() + root.slice(1);
}

interface RawDomainMeta {
  domain: string;
  websiteUrl: string;
  title: string;
  metaDescription: string;
  ogSiteName: string;
  keywords: string;
  websiteStatus: 'online' | 'unreachable' | 'offline';
  searchSnippet?: string;
  searchTitle?: string;
}

/**
 * Live Domain Website Metadata Scraper
 */
async function scrapeDomainMeta(domain: string): Promise<RawDomainMeta> {
  const cleanDomain = domain.toLowerCase().trim().replace(/^(https?:\/\/)?(www\.)?/, '').split('/')[0];
  const targetUrl = `https://${cleanDomain}`;

  const result: RawDomainMeta = {
    domain: cleanDomain,
    websiteUrl: targetUrl,
    title: '',
    metaDescription: '',
    ogSiteName: '',
    keywords: '',
    websiteStatus: 'unreachable'
  };

  // 1. Try HTTPS, fallback to HTTP
  let html = '';
  try {
    const res = await fetch(targetUrl, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.9"
      },
      signal: AbortSignal.timeout(3500)
    });

    if (res.ok) {
      html = await res.text();
      result.websiteStatus = 'online';
    }
  } catch {
    // Try HTTP fallback
    try {
      const httpUrl = `http://${cleanDomain}`;
      const resHttp = await fetch(httpUrl, {
        headers: {
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"
        },
        signal: AbortSignal.timeout(2500)
      });
      if (resHttp.ok) {
        html = await resHttp.text();
        result.websiteStatus = 'online';
        result.websiteUrl = httpUrl;
      }
    } catch {}
  }

  // 2. Extract meta tags if HTML was returned
  if (html) {
    // Title
    const titleMatch = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
    if (titleMatch) {
      result.title = decodeHtmlEntities(titleMatch[1]);
    }

    // Meta description (name or property)
    const descMatch = 
      html.match(/<meta[^>]+(?:name|property)=["'](?:description|og:description)["'][^>]+content=["']([^"']*)["']/i) ||
      html.match(/<meta[^>]+content=["']([^"']*)["'][^>]+(?:name|property)=["'](?:description|og:description)["']/i);
    if (descMatch) {
      result.metaDescription = decodeHtmlEntities(descMatch[1]);
    }

    // og:site_name
    const siteNameMatch = 
      html.match(/<meta[^>]+property=["']og:site_name["'][^>]+content=["']([^"']*)["']/i) ||
      html.match(/<meta[^>]+content=["']([^"']*)["'][^>]+property=["']og:site_name["']/i);
    if (siteNameMatch) {
      result.ogSiteName = decodeHtmlEntities(siteNameMatch[1]);
    }

    // Meta keywords
    const kwMatch = 
      html.match(/<meta[^>]+name=["']keywords["'][^>]+content=["']([^"']*)["']/i) ||
      html.match(/<meta[^>]+content=["']([^"']*)["'][^>]+name=["']keywords["']/i);
    if (kwMatch) {
      result.keywords = decodeHtmlEntities(kwMatch[1]);
    }
  }

  // 3. Search Engine Grounding if description is sparse or website unreachable
  if (!result.metaDescription || result.metaDescription.length < 20 || result.websiteStatus !== 'online') {
    try {
      const searchDork = `site:${cleanDomain}`;
      const searchUrl = `https://html.duckduckgo.com/html/?q=${encodeURIComponent(searchDork)}`;
      const searchRes = await fetch(searchUrl, {
        headers: {
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36"
        },
        signal: AbortSignal.timeout(3000)
      });

      if (searchRes.ok) {
        const searchHtml = await searchRes.text();
        const snippetMatch = searchHtml.match(/<a[^>]+class="[^"]*result__snippet[^"]*"[^>]*>([\s\S]*?)<\/a>/i);
        const titleMatch = searchHtml.match(/<a[^>]+class="[^"]*result__a[^"]*"[^>]*>([\s\S]*?)<\/a>/i);

        if (snippetMatch) {
          result.searchSnippet = decodeHtmlEntities(snippetMatch[1].replace(/<[^>]*>/g, ''));
        }
        if (titleMatch && !result.title) {
          result.searchTitle = decodeHtmlEntities(titleMatch[1].replace(/<[^>]*>/g, ''));
        }
      }
    } catch {}
  }

  return result;
}

// Known enterprise domain overrides for 100% precision
const ENTERPRISE_DOMAIN_PROFILES: Record<string, { companyName: string; industry: string; subCategory: string; businessModel: string; overview: string }> = {
  'stripe.com': {
    companyName: 'Stripe',
    industry: 'Finance',
    subCategory: 'Fintech & Payment Infrastructure',
    businessModel: 'B2B SaaS / FinTech',
    overview: 'Stripe provides financial infrastructure and developer APIs for internet businesses to accept payments, send payouts, and manage money movement.'
  },
  'shopify.com': {
    companyName: 'Shopify',
    industry: 'E-commerce',
    subCategory: 'E-commerce Platform & Retail Tech',
    businessModel: 'B2B SaaS',
    overview: 'Shopify powers millions of businesses worldwide with comprehensive online storefronts, retail POS, and merchant commerce solutions.'
  },
  'github.com': {
    companyName: 'GitHub',
    industry: 'Technology',
    subCategory: 'Developer Tools & Code Hosting',
    businessModel: 'B2B SaaS',
    overview: 'GitHub is the world leading software development and version control platform powered by Git and AI developer tooling.'
  },
  'salesforce.com': {
    companyName: 'Salesforce',
    industry: 'Technology',
    subCategory: 'CRM & Enterprise Cloud Software',
    businessModel: 'Enterprise SaaS',
    overview: 'Salesforce is the global leader in customer relationship management (CRM), marketing automation, and cloud enterprise software.'
  },
  'slack.com': {
    companyName: 'Slack',
    industry: 'Technology',
    subCategory: 'Enterprise Team Collaboration',
    businessModel: 'B2B SaaS',
    overview: 'Slack is a productivity platform and workplace messaging system that connects teams and tools together.'
  },
  'figma.com': {
    companyName: 'Figma',
    industry: 'Technology',
    subCategory: 'Collaborative Interface Design',
    businessModel: 'B2B SaaS',
    overview: 'Figma is a collaborative web application for interface design, wireframing, and product development.'
  },
  'datadoghq.com': {
    companyName: 'Datadog',
    industry: 'Technology',
    subCategory: 'Cloud Monitoring & Security',
    businessModel: 'B2B SaaS',
    overview: 'Datadog is an observability service for cloud-scale applications, providing monitoring of servers, databases, tools, and services.'
  },
  'notion.so': {
    companyName: 'Notion',
    industry: 'Technology',
    subCategory: 'Productivity & Workspace Wiki',
    businessModel: 'B2B SaaS',
    overview: 'Notion is a single connected workspace for teams to write docs, build wikis, and manage project workflows.'
  },
  'siemens.com': {
    companyName: 'Siemens',
    industry: 'Manufacturing',
    subCategory: 'Industrial Automation & Infrastructure Tech',
    businessModel: 'B2B Industrial & Technology',
    overview: 'Siemens is a global technology powerhouse driving innovation in industrial automation, infrastructure, mobility, and digital transformation.'
  },
  'bosch.com': {
    companyName: 'Bosch',
    industry: 'Manufacturing',
    subCategory: 'Automotive & Industrial Technology',
    businessModel: 'B2B / B2C Manufacturing',
    overview: 'Bosch is a global supplier of technology and services across mobility, industrial automation, energy, and smart home hardware.'
  }
};

/**
 * Checks if a keyword matches inside text using word boundary semantics
 * Prevents false positives like 'trip' in 'stripe' or 'car' in 'career'
 */
function matchKeywordScore(text: string, kw: string): boolean {
  if (!text) return false;
  const escaped = kw.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  // For short keywords (<= 4 chars), require word boundary or start of word
  const regex = kw.length <= 4 
    ? new RegExp(`\\b${escaped}\\b`, 'i') 
    : new RegExp(`\\b${escaped}`, 'i');
  return regex.test(text);
}

/**
 * Intelligent Rule-Based Analyzer (Fallback & Instant Zero-Quota Mode)
 */
function analyzeMetaLocally(meta: RawDomainMeta): CompanyIntelligenceResult {
  const cleanDom = meta.domain.toLowerCase().trim();

  // 1. Direct match for enterprise platforms
  if (ENTERPRISE_DOMAIN_PROFILES[cleanDom]) {
    const prof = ENTERPRISE_DOMAIN_PROFILES[cleanDom];
    return {
      domain: cleanDom,
      companyName: prof.companyName,
      industry: prof.industry,
      subCategory: prof.subCategory,
      overview: meta.metaDescription || prof.overview,
      businessModel: prof.businessModel,
      headquarters: classifyCountryOffline(cleanDom) || 'United States',
      title: meta.title || `${prof.companyName} | Official Website`,
      metaDescription: meta.metaDescription || prof.overview,
      searchSnippet: meta.searchSnippet || '',
      websiteUrl: meta.websiteUrl,
      websiteStatus: meta.websiteStatus,
      favicon: `https://www.google.com/s2/favicons?domain=${cleanDom}&sz=64`,
      confidenceScore: 98,
      isAiEnhanced: false
    };
  }

  const combinedText = `${meta.title} ${meta.metaDescription} ${meta.searchSnippet || ''} ${meta.keywords}`.toLowerCase();
  
  // 2. Determine Industry based on weighted keyword scores with word boundaries
  let bestIndustry = 'Technology';
  let highestScore = 0;

  const industryScores: Record<string, number> = {};
  for (const [ind, kws] of Object.entries(INDUSTRY_KEYWORDS)) {
    let score = 0;
    for (const kw of kws) {
      if (matchKeywordScore(meta.title, kw)) score += 5;
      if (matchKeywordScore(meta.metaDescription, kw)) score += 4;
      if (meta.searchSnippet && matchKeywordScore(meta.searchSnippet, kw)) score += 3;
      if (meta.keywords && matchKeywordScore(meta.keywords, kw)) score += 2;
      // In domain name, check if keyword is a component separated by hyphen or dot
      if (meta.domain.includes(kw) && (kw.length >= 4 || meta.domain.startsWith(kw) || meta.domain.includes(`-${kw}`) || meta.domain.includes(`${kw}-`))) {
        score += 3;
      }
    }
    industryScores[ind] = score;
    if (score > highestScore) {
      highestScore = score;
      bestIndustry = ind;
    }
  }

  if (highestScore === 0) {
    const offlineGuess = classifyIndustryOffline(meta.domain);
    bestIndustry = offlineGuess || 'General Business';
  }

  // 3. Determine Sub-Category
  let subCategory = `${bestIndustry} Solutions`;
  if (bestIndustry === 'Finance' || combinedText.includes('payment') || combinedText.includes('fintech') || combinedText.includes('billing')) {
    if (combinedText.includes('payment') || combinedText.includes('checkout') || combinedText.includes('pay') || combinedText.includes('billing')) {
      bestIndustry = 'Finance';
      subCategory = 'Fintech & Payment Infrastructure';
    } else if (combinedText.includes('invest') || combinedText.includes('capital') || combinedText.includes('wealth')) {
      subCategory = 'Investment Management & Capital';
    } else if (combinedText.includes('insur')) {
      subCategory = 'InsurTech & Risk Underwriting';
    } else {
      subCategory = 'Banking & Financial Services';
    }
  } else if (bestIndustry === 'Technology') {
    if (combinedText.includes('saas') || combinedText.includes('software') || combinedText.includes('platform')) subCategory = 'Enterprise SaaS & Cloud';
    else if (combinedText.includes('ai') || combinedText.includes('machine learning') || combinedText.includes('data')) subCategory = 'Artificial Intelligence & Data';
    else if (combinedText.includes('cyber') || combinedText.includes('security')) subCategory = 'Cybersecurity & Defense';
    else if (combinedText.includes('api') || combinedText.includes('developer') || combinedText.includes('infrastructure')) subCategory = 'Developer Infrastructure & APIs';
    else subCategory = 'Information Technology & Software';
  } else if (bestIndustry === 'Healthcare') {
    if (combinedText.includes('pharma') || combinedText.includes('bio')) subCategory = 'Biotechnology & Pharmaceuticals';
    else if (combinedText.includes('clinic') || combinedText.includes('hospital')) subCategory = 'Clinical Healthcare & Medical Centers';
    else if (combinedText.includes('dental')) subCategory = 'Dental & Oral Health';
    else subCategory = 'Medical Devices & HealthTech';
  } else if (bestIndustry === 'Manufacturing') {
    if (combinedText.includes('steel') || combinedText.includes('metal')) subCategory = 'Precision Metals & Machining';
    else if (combinedText.includes('plastic') || combinedText.includes('chem')) subCategory = 'Industrial Materials & Chemicals';
    else subCategory = 'OEM Manufacturing & Industrial Equipment';
  } else if (bestIndustry === 'E-commerce') {
    if (combinedText.includes('fashion') || combinedText.includes('clothing') || combinedText.includes('apparel')) subCategory = 'Direct-to-Consumer Apparel & Fashion';
    else subCategory = 'Digital Commerce & Retail';
  }

  // 4. Determine Business Model
  let businessModel = 'B2B';
  if (combinedText.includes('saas') || combinedText.includes('subscription') || combinedText.includes('api')) businessModel = 'B2B SaaS';
  else if (combinedText.includes('shop') || combinedText.includes('cart') || combinedText.includes('consumer') || combinedText.includes('d2c')) businessModel = 'B2C / Direct-to-Consumer';
  else if (combinedText.includes('wholesale') || combinedText.includes('distributor') || combinedText.includes('manufacturer')) businessModel = 'B2B Wholesale / Manufacturing';
  else if (combinedText.includes('agency') || combinedText.includes('consulting') || combinedText.includes('advisory')) businessModel = 'Professional Services / Agency';

  // 5. Determine Company Name
  const companyName = cleanCompanyName(meta.title || meta.searchTitle || '', meta.ogSiteName, meta.domain);

  // 6. Overview summary
  let overview = meta.metaDescription || meta.searchSnippet || '';
  if (!overview || overview.length < 20) {
    overview = `${companyName} is an established company providing specialized ${bestIndustry.toLowerCase()} and ${subCategory.toLowerCase()} services operating under domain ${meta.domain}.`;
  } else if (overview.length > 250) {
    overview = overview.slice(0, 247) + '...';
  }

  // 6. Headquarters
  const hq = classifyCountryOffline(meta.domain) || 'Global';

  // 7. Confidence Score
  let confidence = 75;
  if (meta.websiteStatus === 'online' && meta.metaDescription) confidence = 95;
  else if (meta.searchSnippet) confidence = 88;
  else if (meta.title) confidence = 82;

  return {
    domain: meta.domain,
    companyName,
    industry: bestIndustry,
    subCategory,
    overview,
    businessModel,
    headquarters: hq,
    title: meta.title || meta.searchTitle || '',
    metaDescription: meta.metaDescription || meta.searchSnippet || '',
    searchSnippet: meta.searchSnippet || '',
    websiteUrl: meta.websiteUrl,
    websiteStatus: meta.websiteStatus,
    favicon: `https://www.google.com/s2/favicons?domain=${meta.domain}&sz=64`,
    confidenceScore: confidence,
    isAiEnhanced: false
  };
}

/**
 * AI-Enhanced Synthesis via Gemini SDK
 */
async function enhanceWithGemini(
  rawMetas: RawDomainMeta[]
): Promise<Map<string, CompanyIntelligenceResult>> {
  const gemini = getGemini();
  const results = new Map<string, CompanyIntelligenceResult>();
  if (!gemini || rawMetas.length === 0) return results;

  try {
    const promptInput = rawMetas.map(m => ({
      domain: m.domain,
      pageTitle: m.title || m.searchTitle || 'N/A',
      metaDescription: m.metaDescription || 'N/A',
      searchSnippet: m.searchSnippet || 'N/A',
      ogSiteName: m.ogSiteName || 'N/A'
    }));

    const prompt = `You are a corporate intelligence analyst. For each company domain and its scraped website metadata, provide a high-accuracy company profile.
Return a valid JSON array of objects with the exact following schema:
[
  {
    "domain": "string (exact match)",
    "companyName": "string (official brand name)",
    "industry": "string (Choose one: Technology, Healthcare, Finance, E-commerce, Manufacturing, Construction, Real Estate, Education, Legal, Logistics, Energy, Food & Beverage, Automotive, Marketing, Consulting, Agriculture, Media, Travel, Non-Profit)",
    "subCategory": "string (specific niche, e.g. 'Fintech & Payment Gateway', 'Industrial Robotics', 'Direct-to-Consumer Cosmetics')",
    "overview": "string (concise 1-2 sentence overview of what the company does and its key products/services)",
    "businessModel": "string (e.g. 'B2B SaaS', 'B2B Wholesale', 'B2C E-commerce', 'Agency', 'Enterprise Hardware')",
    "headquarters": "string (Country or City, Country if identifiable from meta)",
    "confidenceScore": number (between 80 and 99)
  }
]

Input domain data:
${JSON.stringify(promptInput, null, 2)}`;

    const response = await gemini.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        temperature: 0.1
      }
    });

    const responseText = response.text || '';
    const parsed = JSON.parse(responseText);

    if (Array.isArray(parsed)) {
      for (const item of parsed) {
        if (item && item.domain) {
          const raw = rawMetas.find(r => r.domain === item.domain);
          results.set(item.domain, {
            domain: item.domain,
            companyName: item.companyName || (raw ? cleanCompanyName(raw.title, raw.ogSiteName, raw.domain) : item.domain),
            industry: item.industry || 'Technology',
            subCategory: item.subCategory || 'Enterprise Solutions',
            overview: item.overview || raw?.metaDescription || '',
            businessModel: item.businessModel || 'B2B',
            headquarters: item.headquarters || (raw ? classifyCountryOffline(raw.domain) : 'Global') || 'Global',
            title: raw?.title || raw?.searchTitle || '',
            metaDescription: raw?.metaDescription || raw?.searchSnippet || '',
            searchSnippet: raw?.searchSnippet || '',
            websiteUrl: raw?.websiteUrl || `https://${item.domain}`,
            websiteStatus: raw?.websiteStatus || 'online',
            favicon: `https://www.google.com/s2/favicons?domain=${item.domain}&sz=64`,
            confidenceScore: Math.min(99, Math.max(85, Number(item.confidenceScore) || 95)),
            isAiEnhanced: true
          });
        }
      }
    }
  } catch (err: any) {
    console.warn("[Gemini Intelligence] Fallback to heuristic parser notice:", err?.message || err);
  }

  return results;
}

/**
 * Main Entry Point: Enrich a batch of email domains with live web meta & search intelligence
 */
export async function enrichDomainsIntelligence(
  domains: string[]
): Promise<CompanyIntelligenceResult[]> {
  const uniqueDomains = Array.from(
    new Set(
      domains
        .map(d => d.toLowerCase().trim().replace(/^(https?:\/\/)?(www\.)?/, '').split('/')[0])
        .filter(d => d && d.includes('.'))
    )
  ).slice(0, 40); // Cap batch at 40 domains per request for high performance

  const finalResults: CompanyIntelligenceResult[] = [];
  const uncachedDomains: string[] = [];

  // Check cache first
  for (const domain of uniqueDomains) {
    if (domainCache.has(domain)) {
      finalResults.push(domainCache.get(domain)!);
    } else {
      uncachedDomains.push(domain);
    }
  }

  if (uncachedDomains.length === 0) {
    return finalResults;
  }

  console.log(`[Domain Intelligence] Fetching live metadata for ${uncachedDomains.length} domains...`);

  // Fetch website metadata in parallel (batches of 8)
  const rawMetas: RawDomainMeta[] = [];
  const BATCH_SIZE = 8;
  for (let i = 0; i < uncachedDomains.length; i += BATCH_SIZE) {
    const chunk = uncachedDomains.slice(i, i + BATCH_SIZE);
    const chunkResults = await Promise.all(chunk.map(d => scrapeDomainMeta(d)));
    rawMetas.push(...chunkResults);
  }

  // Attempt AI enhancement if Gemini is configured
  let aiResults = new Map<string, CompanyIntelligenceResult>();
  if (process.env.GEMINI_API_KEY) {
    aiResults = await enhanceWithGemini(rawMetas);
  }

  // Build final results using AI where available or rule-based parser
  for (const meta of rawMetas) {
    let finalIntel: CompanyIntelligenceResult;
    if (aiResults.has(meta.domain)) {
      finalIntel = aiResults.get(meta.domain)!;
    } else {
      finalIntel = analyzeMetaLocally(meta);
    }

    // Cache result
    domainCache.set(meta.domain, finalIntel);
    finalResults.push(finalIntel);
  }

  return finalResults;
}
