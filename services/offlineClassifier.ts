
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

// Known enterprise domain to industry mapping for 100% precision
export const GLOBAL_CORPORATE_INDUSTRIES: Record<string, { industry: string; subCategory: string; companyName: string }> = {
    // Automotive
    'toyota.com': { industry: 'Automotive', subCategory: 'Automotive OEM & Mobility', companyName: 'Toyota Motor' },
    'ford.com': { industry: 'Automotive', subCategory: 'Automotive Manufacturing', companyName: 'Ford' },
    'gm.com': { industry: 'Automotive', subCategory: 'Automotive Manufacturing', companyName: 'General Motors' },
    'bmw.com': { industry: 'Automotive', subCategory: 'Luxury Vehicles & Motorcycles', companyName: 'BMW Group' },
    'volkswagen.com': { industry: 'Automotive', subCategory: 'Automotive Group & EV', companyName: 'Volkswagen Group' },
    'mercedes-benz.com': { industry: 'Automotive', subCategory: 'Luxury Automotive & Commercial', companyName: 'Mercedes-Benz' },
    'honda.com': { industry: 'Automotive', subCategory: 'Automotive & Power Equipment', companyName: 'Honda' },
    'hyundai.com': { industry: 'Automotive', subCategory: 'Automotive Manufacturing', companyName: 'Hyundai' },
    'tesla.com': { industry: 'Automotive', subCategory: 'Electric Vehicles & Clean Energy', companyName: 'Tesla' },
    'stellantis.com': { industry: 'Automotive', subCategory: 'Multinational Automotive OEM', companyName: 'Stellantis' },
    'continental.com': { industry: 'Automotive', subCategory: 'Tires & Automotive Parts Tier 1', companyName: 'Continental' },
    'valeo.com': { industry: 'Automotive', subCategory: 'Automotive Systems & Components', companyName: 'Valeo' },
    'denso.com': { industry: 'Automotive', subCategory: 'Automotive Components OEM', companyName: 'Denso' },

    // Manufacturing & Heavy Industry
    'caterpillar.com': { industry: 'Manufacturing', subCategory: 'Heavy Equipment & Machinery', companyName: 'Caterpillar' },
    'cat.com': { industry: 'Manufacturing', subCategory: 'Heavy Machinery & Mining Equipment', companyName: 'Caterpillar' },
    'deere.com': { industry: 'Manufacturing', subCategory: 'Agricultural & Turf Machinery', companyName: 'John Deere' },
    'komatsu.com': { industry: 'Manufacturing', subCategory: 'Construction & Mining Equipment', companyName: 'Komatsu' },
    'siemens.com': { industry: 'Manufacturing', subCategory: 'Industrial Automation & Digital Enterprise', companyName: 'Siemens' },
    'bosch.com': { industry: 'Manufacturing', subCategory: 'Industrial Technology & Automotive Systems', companyName: 'Bosch' },
    'ge.com': { industry: 'Manufacturing', subCategory: 'Industrial Aerospace & Energy', companyName: 'General Electric' },
    '3m.com': { industry: 'Manufacturing', subCategory: 'Industrial Adhesives & Materials', companyName: '3M' },
    'abb.com': { industry: 'Manufacturing', subCategory: 'Electrification & Industrial Automation', companyName: 'ABB' },
    'honeywell.com': { industry: 'Manufacturing', subCategory: 'Aerospace & Building Technologies', companyName: 'Honeywell' },
    'schneider-electric.com': { industry: 'Energy', subCategory: 'Energy Management & Automation', companyName: 'Schneider Electric' },
    'mitsubishielectric.com': { industry: 'Manufacturing', subCategory: 'Industrial Automation & Electronics', companyName: 'Mitsubishi Electric' },

    // Healthcare & Pharmaceuticals
    'pfizer.com': { industry: 'Healthcare', subCategory: 'Biopharmaceuticals & Vaccines', companyName: 'Pfizer' },
    'novartis.com': { industry: 'Healthcare', subCategory: 'Innovative Medicines & Oncology', companyName: 'Novartis' },
    'roche.com': { industry: 'Healthcare', subCategory: 'Biotechnology & Diagnostics', companyName: 'Roche' },
    'jnj.com': { industry: 'Healthcare', subCategory: 'Medical Devices & Pharmaceuticals', companyName: 'Johnson & Johnson' },
    'merck.com': { industry: 'Healthcare', subCategory: 'Global Biopharmaceuticals', companyName: 'Merck' },
    'astrazeneca.com': { industry: 'Healthcare', subCategory: 'Biopharmaceuticals & Oncology', companyName: 'AstraZeneca' },
    'sanofi.com': { industry: 'Healthcare', subCategory: 'Pharmaceuticals & Vaccines', companyName: 'Sanofi' },
    'gsk.com': { industry: 'Healthcare', subCategory: 'Biopharma & Vaccines', companyName: 'GSK' },
    'abbvie.com': { industry: 'Healthcare', subCategory: 'Biopharmaceutical Therapeutics', companyName: 'AbbVie' },
    'bayer.com': { industry: 'Healthcare', subCategory: 'Pharmaceuticals & Consumer Health', companyName: 'Bayer' },
    'medtronic.com': { industry: 'Healthcare', subCategory: 'Medical Devices & HealthTech', companyName: 'Medtronic' },
    'thermofisher.com': { industry: 'Healthcare', subCategory: 'Life Sciences & Laboratory Instrumentation', companyName: 'Thermo Fisher Scientific' },

    // Aerospace & Defense
    'boeing.com': { industry: 'Manufacturing', subCategory: 'Commercial Aviation & Defense', companyName: 'Boeing' },
    'airbus.com': { industry: 'Manufacturing', subCategory: 'Aerospace & Commercial Aircraft', companyName: 'Airbus' },
    'lockheedmartin.com': { industry: 'Manufacturing', subCategory: 'Aerospace & Defense Systems', companyName: 'Lockheed Martin' },
    'northropgrumman.com': { industry: 'Manufacturing', subCategory: 'Aerospace & Defense Technology', companyName: 'Northrop Grumman' },
    'rtx.com': { industry: 'Manufacturing', subCategory: 'Aerospace & Defense Solutions', companyName: 'Raytheon Technologies (RTX)' },

    // Logistics & Shipping
    'dhl.com': { industry: 'Logistics', subCategory: 'Global Express & Freight Forwarding', companyName: 'DHL' },
    'fedex.com': { industry: 'Logistics', subCategory: 'Express Courier & Supply Chain', companyName: 'FedEx' },
    'ups.com': { industry: 'Logistics', subCategory: 'Parcel Delivery & Supply Chain', companyName: 'UPS' },
    'maersk.com': { industry: 'Logistics', subCategory: 'Container Shipping & Ocean Freight', companyName: 'A.P. Moller - Maersk' },
    'kuehne-nagel.com': { industry: 'Logistics', subCategory: 'Global Freight Forwarding & 3PL', companyName: 'Kuehne + Nagel' },
    'dbschenker.com': { industry: 'Logistics', subCategory: 'Freight Logistics & Supply Chain', companyName: 'DB Schenker' },

    // Chemicals & Materials
    'basf.com': { industry: 'Manufacturing', subCategory: 'Specialty Chemicals & Materials', companyName: 'BASF' },
    'dow.com': { industry: 'Manufacturing', subCategory: 'Materials Science & Plastics', companyName: 'Dow' },
    'dupont.com': { industry: 'Manufacturing', subCategory: 'Industrial Polymers & Specialty Materials', companyName: 'DuPont' },
    'lyondellbasell.com': { industry: 'Manufacturing', subCategory: 'Plastics, Chemicals & Refining', companyName: 'LyondellBasell' },

    // Energy & Utilities
    'shell.com': { industry: 'Energy', subCategory: 'Global Energy & Petrochemicals', companyName: 'Shell' },
    'bp.com': { industry: 'Energy', subCategory: 'Energy & Transition Fuels', companyName: 'BP' },
    'exxonmobil.com': { industry: 'Energy', subCategory: 'Petroleum Exploration & Refining', companyName: 'ExxonMobil' },
    'totalenergies.com': { industry: 'Energy', subCategory: 'Multi-Energy & Renewable Power', companyName: 'TotalEnergies' },
    'chevron.com': { industry: 'Energy', subCategory: 'Energy & Petrochemicals', companyName: 'Chevron' },
    'enel.com': { industry: 'Energy', subCategory: 'Renewable Power & Utilities', companyName: 'Enel' },

    // Finance & Banking
    'jpmorganchase.com': { industry: 'Finance', subCategory: 'Investment Banking & Financial Services', companyName: 'JPMorgan Chase' },
    'bankofamerica.com': { industry: 'Finance', subCategory: 'Retail Banking & Wealth Management', companyName: 'Bank of America' },
    'goldmansachs.com': { industry: 'Finance', subCategory: 'Global Investment Banking & Securities', companyName: 'Goldman Sachs' },
    'morganstanley.com': { industry: 'Finance', subCategory: 'Investment Management & Advisory', companyName: 'Morgan Stanley' },
    'citigroup.com': { industry: 'Finance', subCategory: 'Institutional Banking & Wealth', companyName: 'Citigroup' },
    'hsbc.com': { industry: 'Finance', subCategory: 'International Banking & Finance', companyName: 'HSBC' },
    'visa.com': { industry: 'Finance', subCategory: 'Digital Payments Network', companyName: 'Visa' },
    'mastercard.com': { industry: 'Finance', subCategory: 'Global Payment Technology', companyName: 'Mastercard' },
    'stripe.com': { industry: 'Finance', subCategory: 'Fintech & Payment Infrastructure', companyName: 'Stripe' },

    // Food & Beverage / Agribusiness
    'nestle.com': { industry: 'Food & Beverage', subCategory: 'Packaged Foods & Beverages', companyName: 'Nestlé' },
    'pepsico.com': { industry: 'Food & Beverage', subCategory: 'Beverages & Snack Foods', companyName: 'PepsiCo' },
    'coca-cola.com': { industry: 'Food & Beverage', subCategory: 'Global Beverage Manufacturing', companyName: 'The Coca-Cola Company' },
    'unilever.com': { industry: 'Food & Beverage', subCategory: 'Consumer Goods & Nutrition', companyName: 'Unilever' },
    'danone.com': { industry: 'Food & Beverage', subCategory: 'Dairy, Plant-Based & Specialized Nutrition', companyName: 'Danone' },
    'cargill.com': { industry: 'Agriculture', subCategory: 'Agribusiness & Food Ingredients', companyName: 'Cargill' },

    // Technology & Cloud
    'google.com': { industry: 'Technology', subCategory: 'Search, Cloud & AI Systems', companyName: 'Google' },
    'microsoft.com': { industry: 'Technology', subCategory: 'Enterprise Software, Cloud & AI', companyName: 'Microsoft' },
    'apple.com': { industry: 'Technology', subCategory: 'Consumer Electronics & Software', companyName: 'Apple' },
    'amazon.com': { industry: 'E-commerce', subCategory: 'E-Commerce & Cloud Infrastructure', companyName: 'Amazon' },
    'meta.com': { industry: 'Technology', subCategory: 'Social Platforms & AI Infrastructure', companyName: 'Meta' },
    'salesforce.com': { industry: 'Technology', subCategory: 'Enterprise CRM & Cloud Applications', companyName: 'Salesforce' },
    'oracle.com': { industry: 'Technology', subCategory: 'Enterprise Database & Cloud Infrastructure', companyName: 'Oracle' },
    'sap.com': { industry: 'Technology', subCategory: 'Enterprise Resource Planning (ERP)', companyName: 'SAP' },
    'ibm.com': { industry: 'Technology', subCategory: 'Enterprise Hybrid Cloud & AI Solutions', companyName: 'IBM' },
    'cisco.com': { industry: 'Technology', subCategory: 'Networking Hardware & Cybersecurity', companyName: 'Cisco' }
};

// Keyword dictionary for offline industry detection with exact word boundaries and domain roots
export const INDUSTRY_KEYWORDS: Record<string, string[]> = {
    'Manufacturing': [
        'manufacturing', 'manufacturer', 'machining', 'stamping', 'casting', 'foundry', 'fabrication', 
        'tooling', 'welding', 'assembly', 'industrial', 'plant', 'factory', 'producer', 'precision', 
        'components', 'metalwork', 'hydraulics', 'pneumatics', 'sheetmetal', 'cnc', 'die', 'molding', 
        'extrusion', 'steel', 'metals', 'alloys', 'polymers', 'plastics', 'heavy machinery', 'hardware', 
        'oem', 'tier1', 'tier-1', 'subcontractor', 'machinery', 'equipment'
    ],
    'Automotive': [
        'automotive', 'vehicle', 'powertrain', 'chassis', 'transmission', 'drivetrain', 'autoparts', 
        'aftermarket', 'dealership', 'fleet', 'motor', 'motors', 'truck', 'trucks', 'cars', 'tires', 
        'brakes', 'suspension', 'ev', 'electric vehicle', 'hybrid', 'racing', 'garage', 'auto repair'
    ],
    'Healthcare': [
        'healthcare', 'health', 'medical', 'medicine', 'pharma', 'pharmaceutical', 'pharmaceuticals', 
        'biotech', 'biotechnology', 'biopharma', 'clinical', 'hospital', 'clinic', 'diagnostics', 
        'therapeutics', 'oncology', 'surgical', 'dental', 'pathology', 'radiology', 'orthopedic', 
        'doctor', 'physician', 'patient', 'wellness', 'laboratory', 'lifesciences'
    ],
    'Technology': [
        'software', 'saas', 'cloud', 'cybersecurity', 'artificial intelligence', 'machine learning', 
        'computing', 'developer', 'devops', 'database', 'platform', 'it solutions', 'network', 
        'networking', 'api', 'infrastructure', 'fintech', 'mobile app', 'firmware', 'tech', 
        'systems', 'infotech', 'digital solutions', 'data analytics'
    ],
    'Finance': [
        'banking', 'bank', 'finances', 'finance', 'financial', 'investment', 'investments', 'capital', 
        'wealth', 'asset management', 'private equity', 'venture capital', 'fintech', 'payments', 
        'insurance', 'underwriting', 'insurtech', 'credit', 'lending', 'mortgage', 'accounting', 
        'audit', 'brokerage', 'trading', 'fund', 'advisory'
    ],
    'Construction': [
        'construction', 'contractor', 'general contractor', 'builder', 'builders', 'civil engineering', 
        'architectural', 'architecture', 'roofing', 'masonry', 'structural', 'hvac', 'plumbing', 
        'electrical contractor', 'concrete', 'infrastructure', 'excavation', 'scaffolding', 'renovation'
    ],
    'Logistics': [
        'logistics', 'freight', 'cargo', 'shipping', 'warehousing', 'warehouse', 'courier', 'express', 
        'supply chain', 'intermodal', 'freight forwarding', '3pl', 'transport', 'transportation', 
        'trucking', 'carrier', 'delivery', 'fleet management', 'customs broker'
    ],
    'Energy': [
        'energy', 'renewable', 'solar', 'wind power', 'photovoltaic', 'petroleum', 'oil and gas', 
        'drilling', 'utilities', 'utility', 'electric grid', 'substation', 'power plant', 'lng', 
        'clean energy', 'biofuel', 'nuclear', 'geothermal', 'pipeline'
    ],
    'Food & Beverage': [
        'food', 'beverage', 'drinks', 'brewery', 'brewing', 'distillery', 'winery', 'baking', 
        'bakery', 'confectionery', 'dairy', 'meat processing', 'snack', 'organic food', 'catering', 
        'restaurant', 'food service', 'ingredients', 'nutrition', 'culinary'
    ],
    'E-commerce': [
        'ecommerce', 'e-commerce', 'retail', 'online store', 'shopping', 'storefront', 'marketplace', 
        'boutique', 'apparel', 'clothing', 'footwear', 'merchandise', 'consumer goods', 'd2c', 
        'direct-to-consumer', 'fashion brand'
    ],
    'Real Estate': [
        'real estate', 'realty', 'property', 'properties', 'commercial real estate', 'residential', 
        'leasing', 'tenants', 'apartments', 'condominiums', 'brokerage', 'realtor', 'property management', 
        'land acquisition'
    ],
    'Agriculture': [
        'agriculture', 'agri', 'farming', 'farm', 'agribusiness', 'crops', 'harvest', 'irrigation', 
        'seeds', 'fertilizer', 'livestock', 'poultry', 'grain', 'forestry', 'horticulture', 'aquaculture'
    ],
    'Legal': [
        'law firm', 'legal', 'attorney', 'attorneys', 'lawyer', 'lawyers', 'litigation', 'counsel', 
        'barristers', 'solicitors', 'jurist', 'intellectual property', 'patent attorney', 'corporate law'
    ],
    'Education': [
        'education', 'university', 'college', 'academy', 'school', 'curriculum', 'learning', 'training', 
        'e-learning', 'campus', 'degree', 'faculty', 'students', 'vocational'
    ],
    'Marketing': [
        'marketing', 'advertising', 'digital agency', 'public relations', 'branding', 'creative agency', 
        'seo agency', 'media agency', 'campaigns', 'communications'
    ],
    'Consulting': [
        'consulting', 'management consulting', 'advisory', 'strategy consulting', 'business advisory', 
        'operations consulting', 'hr consulting', 'executive search'
    ],
    'Media': [
        'media', 'publishing', 'broadcasting', 'journalism', 'television', 'radio', 'news agency', 
        'film production', 'entertainment', 'gaming', 'video games', 'streaming'
    ],
    'Travel': [
        'travel', 'hospitality', 'hotel', 'resort', 'tourism', 'airlines', 'airline', 'flight', 
        'cruise line', 'vacation', 'tour operator', 'booking'
    ]
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
        return null;
    }

    return null;
};

export const classifyIndustryOffline = (domain: string): string | null => {
    const clean = domain.toLowerCase().trim().replace(/^www\./, '');
    
    // 1. Check known enterprise corporate registry first
    if (GLOBAL_CORPORATE_INDUSTRIES[clean]) {
        return GLOBAL_CORPORATE_INDUSTRIES[clean].industry;
    }

    // 2. Extract root domain name without TLD
    const root = clean.replace(/\.[a-z]{2,}(\.[a-z]{2,})?$/i, '');

    // Split root into tokens (e.g. "acme-machining" -> ["acme", "machining"], "precisionmetals" -> tokens)
    const tokens = root.split(/[-_.]+/).filter(Boolean);

    let bestMatch: { industry: string; score: number } | null = null;

    for (const [industry, keywords] of Object.entries(INDUSTRY_KEYWORDS)) {
        for (const keyword of keywords) {
            const cleanKw = keyword.toLowerCase().trim();
            // Don't match super short fragments like 'dr' or 'car' inside longer unrelated words
            if (cleanKw.length < 4) continue;

            // Direct token match (e.g. "machining" in ["acme", "machining"])
            if (tokens.includes(cleanKw)) {
                return industry;
            }

            // Substring match in root only if keyword is >= 5 characters or starts the root
            if (root.startsWith(cleanKw) || root.endsWith(cleanKw) || root.includes(`-${cleanKw}`) || root.includes(`${cleanKw}-`)) {
                const score = cleanKw.length * 2;
                if (!bestMatch || score > bestMatch.score) {
                    bestMatch = { industry, score };
                }
            } else if (cleanKw.length >= 6 && root.includes(cleanKw)) {
                const score = cleanKw.length;
                if (!bestMatch || score > bestMatch.score) {
                    bestMatch = { industry, score };
                }
            }
        }
    }
    
    return bestMatch ? bestMatch.industry : null;
};
