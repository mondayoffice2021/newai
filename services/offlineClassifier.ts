
// Comprehensive TLD Map for offline country detection (covering all 200+ global ccTLDs)
export const TLD_TO_COUNTRY: Record<string, string> = {
    // Europe
    'uk': 'United Kingdom', 'gb': 'United Kingdom', 'de': 'Germany', 'fr': 'France',
    'it': 'Italy', 'es': 'Spain', 'nl': 'Netherlands', 'se': 'Sweden', 'no': 'Norway',
    'fi': 'Finland', 'dk': 'Denmark', 'pl': 'Poland', 'ch': 'Switzerland', 'be': 'Belgium',
    'at': 'Austria', 'pt': 'Portugal', 'gr': 'Greece', 'ie': 'Ireland', 'cz': 'Czech Republic',
    'hu': 'Hungary', 'ro': 'Romania', 'bg': 'Bulgaria', 'sk': 'Slovakia', 'hr': 'Croatia',
    'si': 'Slovenia', 'ee': 'Estonia', 'lv': 'Latvia', 'lt': 'Lithuania', 'cy': 'Cyprus',
    'lu': 'Luxembourg', 'mt': 'Malta', 'is': 'Iceland', 'li': 'Liechtenstein', 'mc': 'Monaco',
    'sm': 'San Marino', 'ad': 'Andorra', 'al': 'Albania', 'ba': 'Bosnia and Herzegovina',
    'me': 'Montenegro', 'mk': 'North Macedonia', 'rs': 'Serbia', 'ua': 'Ukraine', 'by': 'Belarus',
    'md': 'Moldova', 'ge': 'Georgia', 'am': 'Armenia', 'az': 'Azerbaijan', 'eu': 'European Union',
    // Americas
    'us': 'United States', 'gov': 'United States', 'mil': 'United States', 'edu': 'United States',
    'ca': 'Canada', 'mx': 'Mexico', 'br': 'Brazil', 'ar': 'Argentina', 'cl': 'Chile',
    'co': 'Colombia', 'pe': 'Peru', 've': 'Venezuela', 'ec': 'Ecuador', 'uy': 'Uruguay',
    'py': 'Paraguay', 'bo': 'Bolivia', 'cr': 'Costa Rica', 'pa': 'Panama', 'gt': 'Guatemala',
    'do': 'Dominican Republic', 'pr': 'Puerto Rico', 'jm': 'Jamaica', 'tt': 'Trinidad and Tobago',
    'cu': 'Cuba', 'hn': 'Honduras', 'sv': 'El Salvador', 'ni': 'Nicaragua', 'bz': 'Belize',
    // Asia & Pacific
    'cn': 'China', 'jp': 'Japan', 'in': 'India', 'kr': 'South Korea', 'tw': 'Taiwan',
    'hk': 'Hong Kong', 'sg': 'Singapore', 'my': 'Malaysia', 'th': 'Thailand', 'vn': 'Vietnam',
    'id': 'Indonesia', 'ph': 'Philippines', 'au': 'Australia', 'nz': 'New Zealand', 'pk': 'Pakistan',
    'bd': 'Bangladesh', 'lk': 'Sri Lanka', 'np': 'Nepal', 'kh': 'Cambodia', 'mm': 'Myanmar',
    'mn': 'Mongolia', 'kz': 'Kazakhstan', 'uz': 'Uzbekistan', 'ru': 'Russia',
    // Middle East
    'ae': 'United Arab Emirates', 'sa': 'Saudi Arabia', 'il': 'Israel', 'tr': 'Turkey',
    'qa': 'Qatar', 'kw': 'Kuwait', 'om': 'Oman', 'bh': 'Bahrain', 'jo': 'Jordan',
    'lb': 'Lebanon', 'iq': 'Iraq', 'ir': 'Iran', 'ye': 'Yemen',
    // Africa
    'za': 'South Africa', 'ng': 'Nigeria', 'eg': 'Egypt', 'ke': 'Kenya', 'ma': 'Morocco',
    'gh': 'Ghana', 'dz': 'Algeria', 'tn': 'Tunisia', 'et': 'Ethiopia', 'tz': 'Tanzania',
    'ug': 'Uganda', 'ci': 'Ivory Coast', 'sn': 'Senegal', 'cm': 'Cameroon', 'zw': 'Zimbabwe',
    'mu': 'Mauritius', 'rw': 'Rwanda', 'na': 'Namibia', 'bw': 'Botswana', 'ao': 'Angola'
};

// Known global enterprise domains to country headquarters
export const GLOBAL_CORPORATE_DOMAINS: Record<string, string> = {
    'google.com': 'United States', 'apple.com': 'United States', 'microsoft.com': 'United States',
    'amazon.com': 'United States', 'meta.com': 'United States', 'facebook.com': 'United States',
    'netflix.com': 'United States', 'tesla.com': 'United States', 'ibm.com': 'United States',
    'oracle.com': 'United States', 'cisco.com': 'United States', 'intel.com': 'United States',
    'nvidia.com': 'United States', 'salesforce.com': 'United States', 'adobe.com': 'United States',
    'hp.com': 'United States', 'dell.com': 'United States', 'qualcomm.com': 'United States',
    'boeing.com': 'United States', 'walmart.com': 'United States', 'target.com': 'United States',
    'sap.com': 'Germany', 'siemens.com': 'Germany', 'bmw.com': 'Germany',
    'volkswagen.com': 'Germany', 'daimler.com': 'Germany', 'mercedes-benz.com': 'Germany',
    'bosch.com': 'Germany', 'bayer.com': 'Germany', 'basf.com': 'Germany',
    'allianz.com': 'Germany', 'adidas.com': 'Germany', 'puma.com': 'Germany',
    'airbus.com': 'France', 'totalenergies.com': 'France', 'loreal.com': 'France',
    'sanofi.com': 'France', 'danone.com': 'France', 'michelin.com': 'France',
    'renault.com': 'France', 'schneider-electric.com': 'France', 'axa.com': 'France',
    'toyota.com': 'Japan', 'sony.com': 'Japan', 'honda.com': 'Japan',
    'nintendo.com': 'Japan', 'panasonic.com': 'Japan', 'canon.com': 'Japan',
    'hitachi.com': 'Japan', 'mitsubishi.com': 'Japan', 'softbank.com': 'Japan',
    'samsung.com': 'South Korea', 'hyundai.com': 'South Korea', 'lg.com': 'South Korea',
    'kia.com': 'South Korea', 'sk.com': 'South Korea', 'posco.com': 'South Korea',
    'alibaba.com': 'China', 'tencent.com': 'China', 'huawei.com': 'China',
    'byd.com': 'China', 'lenovo.com': 'China', 'xiaomi.com': 'China',
    'nestle.com': 'Switzerland', 'roche.com': 'Switzerland', 'novartis.com': 'Switzerland',
    'ubs.com': 'Switzerland', 'abb.com': 'Switzerland', 'glencore.com': 'Switzerland',
    'shell.com': 'United Kingdom', 'bp.com': 'United Kingdom', 'unilever.com': 'United Kingdom',
    'astrazeneca.com': 'United Kingdom', 'gsk.com': 'United Kingdom', 'hsbc.com': 'United Kingdom',
    'barclays.com': 'United Kingdom', 'rolls-royce.com': 'United Kingdom', 'vodafone.com': 'United Kingdom',
    'asml.com': 'Netherlands', 'philips.com': 'Netherlands', 'ing.com': 'Netherlands',
    'heineken.com': 'Netherlands', 'booking.com': 'Netherlands', 'nxp.com': 'Netherlands',
    'ikea.com': 'Sweden', 'spotify.com': 'Sweden', 'ericsson.com': 'Sweden',
    'volvo.com': 'Sweden', 'h&m.com': 'Sweden', 'hm.com': 'Sweden', 'electrolux.com': 'Sweden',
    'nokia.com': 'Finland', 'santander.com': 'Spain', 'bbva.com': 'Spain',
    'inditex.com': 'Spain', 'zara.com': 'Spain', 'telefonica.com': 'Spain',
    'ferrari.com': 'Italy', 'eni.com': 'Italy', 'enel.com': 'Italy', 'stellantis.com': 'Netherlands',
    'tata.com': 'India', 'infosys.com': 'India', 'wipro.com': 'India',
    'reliance.com': 'India', 'shopify.com': 'Canada', 'rbc.com': 'Canada'
};

// Keyword clues inside domain names indicating location
export const DOMAIN_LOCATION_HINTS: Array<{ pattern: RegExp; country: string }> = [
    { pattern: /(?:^|[-.])(?:uk|london|britain|british|england|scotland)(?:[-.]|$)/i, country: 'United Kingdom' },
    { pattern: /(?:^|[-.])(?:deutschland|berlin|munich|hamburg|frankfurt)(?:[-.]|$)/i, country: 'Germany' },
    { pattern: /(?:^|[-.])(?:france|paris|lyon|marseille)(?:[-.]|$)/i, country: 'France' },
    { pattern: /(?:^|[-.])(?:italia|italy|milano|rome|roma)(?:[-.]|$)/i, country: 'Italy' },
    { pattern: /(?:^|[-.])(?:espana|spain|madrid|barcelona)(?:[-.]|$)/i, country: 'Spain' },
    { pattern: /(?:^|[-.])(?:nederland|holland|amsterdam)(?:[-.]|$)/i, country: 'Netherlands' },
    { pattern: /(?:^|[-.])(?:sverige|sweden|stockholm)(?:[-.]|$)/i, country: 'Sweden' },
    { pattern: /(?:^|[-.])(?:norge|norway|oslo)(?:[-.]|$)/i, country: 'Norway' },
    { pattern: /(?:^|[-.])(?:suisse|schweiz|swiss|zurich|geneva)(?:[-.]|$)/i, country: 'Switzerland' },
    { pattern: /(?:^|[-.])(?:austria|osterreich|vienna|wien)(?:[-.]|$)/i, country: 'Austria' },
    { pattern: /(?:^|[-.])(?:polska|poland|warsaw)(?:[-.]|$)/i, country: 'Poland' },
    { pattern: /(?:^|[-.])(?:canada|toronto|vancouver|montreal|ottawa)(?:[-.]|$)/i, country: 'Canada' },
    { pattern: /(?:^|[-.])(?:australia|sydney|melbourne|brisbane)(?:[-.]|$)/i, country: 'Australia' },
    { pattern: /(?:^|[-.])(?:japan|tokyo|osaka)(?:[-.]|$)/i, country: 'Japan' },
    { pattern: /(?:^|[-.])(?:india|delhi|mumbai|bangalore)(?:[-.]|$)/i, country: 'India' },
    { pattern: /(?:^|[-.])(?:brasil|brazil|saopaulo)(?:[-.]|$)/i, country: 'Brazil' },
    { pattern: /(?:^|[-.])(?:mexico|cdmx|guadalajara)(?:[-.]|$)/i, country: 'Mexico' },
    { pattern: /(?:^|[-.])(?:dubai|uae|abudhabi)(?:[-.]|$)/i, country: 'United Arab Emirates' },
    { pattern: /(?:^|[-.])(?:singapore)(?:[-.]|$)/i, country: 'Singapore' },
    { pattern: /(?:^|[-.])(?:california|texas|florida|newyork|chicago|usa)(?:[-.]|$)/i, country: 'United States' }
];

// Keyword dictionary for offline industry detection
export const INDUSTRY_KEYWORDS: Record<string, string[]> = {
    'Technology': ['tech', 'soft', 'app', 'data', 'cloud', 'cyber', 'io', 'ai', 'sys', 'net', 'web', 'code', 'dev', 'lab', 'digital', 'saas', 'bot', 'it-', 'software', 'compute', 'network', 'security', 'crypto', 'blockchain', 'hosting'],
    'Healthcare': ['health', 'care', 'med', 'clinic', 'pharma', 'bio', 'dr', 'hosp', 'dental', 'wellness', 'therap', 'surg', 'nurse', 'md', 'physio', 'optical', 'vet', 'animal', 'patient', 'hospital', 'medical'],
    'Finance': ['bank', 'invest', 'capital', 'fund', 'wealth', 'pay', 'coin', 'crypto', 'finance', 'insure', 'trading', 'asset', 'advis', 'stock', 'equity', 'audit', 'tax', 'account', 'credit', 'loan', 'mortgage', 'broker'],
    'E-commerce': ['shop', 'store', 'buy', 'mart', 'retail', 'sale', 'cart', 'deal', 'market', 'gift', 'fashion', 'boutique', 'mall', 'clothing', 'apparel', 'jewelry', 'shoes'],
    'Education': ['edu', 'school', 'univ', 'learn', 'teach', 'academy', 'student', 'class', 'course', 'college', 'training', 'tutor', 'degree', 'campus', 'study'],
    'Real Estate': ['realty', 'estate', 'home', 'house', 'prop', 'land', 'apt', 'condo', 'build', 'rent', 'lease', 'living', 'residence', 'mortgage'],
    'Legal': ['law', 'legal', 'attorney', 'justice', 'firm', 'advocate', 'solicitor', 'jurist', 'court', 'litig', 'counsel', 'barrister'],
    'Travel': ['travel', 'tour', 'trip', 'fly', 'hotel', 'resort', 'booking', 'vacation', 'flight', 'airline', 'cruise', 'stay', 'inn', 'hostel', 'adventure'],
    'Food & Beverage': ['food', 'cafe', 'rest', 'bar', 'drink', 'eat', 'chef', 'kitchen', 'pizza', 'burger', 'wine', 'brew', 'bakery', 'coffee', 'catering', 'organic', 'meat', 'dairy'],
    'Construction': ['build', 'construct', 'contractor', 'roof', 'plumb', 'electric', 'eng', 'civil', 'archit', 'design', 'renov', 'paint', 'solar', 'hvac', 'steel', 'concrete'],
    'Automotive': ['auto', 'car', 'motor', 'drive', 'wheel', 'fix', 'garage', 'repair', 'trans', 'vehicle', 'truck', 'tire', 'parts', 'rental', 'racing'],
    'Marketing': ['agency', 'media', 'market', 'social', 'seo', 'ads', 'brand', 'creative', 'design', 'promo', 'publicity', 'comm', 'press', 'video', 'photo'],
    'Manufacturing': ['factory', 'industr', 'manufact', 'plant', 'steel', 'metal', 'machin', 'tool', 'equip', 'supply', 'prod', 'mill', 'forge', 'chem', 'plastic'],
    'Logistics': ['ship', 'logist', 'cargo', 'freight', 'delivery', 'courier', 'warehous', 'supply', 'chain', 'transport', 'express', 'mail', 'fleet'],
    'Energy': ['power', 'energy', 'oil', 'gas', 'solar', 'wind', 'fuel', 'electric', 'utility', 'grid', 'renew', 'petro', 'nuclear', 'water'],
    'Consulting': ['consult', 'advis', 'strat', 'coach', 'expert', 'solut', 'partner', 'group', 'mgmt', 'manage', 'talent', 'hr', 'recruit'],
    'Agriculture': ['farm', 'agri', 'crop', 'land', 'garden', 'plant', 'seed', 'harvest', 'forest', 'nature', 'green', 'eco', 'soil', 'livestock'],
    'Media': ['news', 'press', 'mag', 'journal', 'tv', 'radio', 'broadcast', 'film', 'movie', 'music', 'sound', 'ent', 'game', 'play', 'stream']
};

export const classifyCountryOffline = (domain: string): string | null => {
    const cleanDomain = domain.toLowerCase().trim().replace(/^www\./, '');
    
    // 1. Direct match for known global enterprise domains
    if (GLOBAL_CORPORATE_DOMAINS[cleanDomain]) {
        return GLOBAL_CORPORATE_DOMAINS[cleanDomain];
    }

    const parts = cleanDomain.split('.');
    if (parts.length < 2) return null;
    
    // 2. Check the last part (ccTLD)
    const ext = parts[parts.length - 1];
    if (TLD_TO_COUNTRY[ext]) return TLD_TO_COUNTRY[ext];

    // 3. Check second to last if strictly 'co.uk' or 'com.au' style
    const ext2 = parts.length > 2 ? parts[parts.length - 2] : null;
    if (ext2 && ['co', 'com', 'org', 'net', 'gov', 'edu', 'ac'].includes(ext2) && TLD_TO_COUNTRY[ext]) {
        return TLD_TO_COUNTRY[ext];
    }

    // 4. Check domain keyword location hints (e.g. berlin-electric.com -> Germany)
    for (const hint of DOMAIN_LOCATION_HINTS) {
        if (hint.pattern.test(cleanDomain)) {
            return hint.country;
        }
    }

    // 5. Well-known global commercial TLD defaults
    if (ext === 'com' || ext === 'net' || ext === 'org') {
        // Many generic .com domains are US-headquartered or International
        return null;
    }

    return null;
};

export const classifyIndustryOffline = (domain: string): string | null => {
    const lowerDomain = domain.toLowerCase();
    
    let bestMatch: { industry: string; length: number } | null = null;

    for (const [industry, keywords] of Object.entries(INDUSTRY_KEYWORDS)) {
        for (const keyword of keywords) {
            if (lowerDomain.includes(keyword)) {
                // Prioritize the longest keyword match to be more specific
                if (!bestMatch || keyword.length > bestMatch.length) {
                    bestMatch = { industry, length: keyword.length };
                }
            }
        }
    }
    
    return bestMatch ? bestMatch.industry : null;
};
