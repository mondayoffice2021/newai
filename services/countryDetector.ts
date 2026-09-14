/**
 * Comprehensive Country Detection & Intelligence Service
 * Provides:
 * 1. ISO Country metadata with real Emoji flags
 * 2. Extended global corporate .com domain registry
 * 3. Deep HTML contact page analyzer (JSON-LD, phone dialing codes, Impressum, addresses, geotags, html lang)
 * 4. Multi-engine search query generation & grounding parser
 * 5. International city, state, postal code, and legal corporate form heuristics
 */

export interface CountryInfo {
  name: string;
  code: string; // ISO 3166-1 alpha-2
  flag: string;
  cctld: string;
  phoneCodes: string[];
  majorCities: string[];
  statesOrRegions?: string[];
  legalForms?: string[];
  languages?: string[];
}

export interface DomainCountryResolution {
  domain: string;
  country: string;
  confidence: number; // 0 to 100
  method: 'cctld' | 'corporate_registry' | 'contact_page_address' | 'phone_code' | 'jsonld_schema' | 'meta_geotag' | 'impressum' | 'search_engine' | 'ai_grounding' | 'domain_pattern' | 'unknown';
  evidence?: string;
  flag?: string;
}

// Global Country Database with Flags, Dialing Codes, Major Cities, and Legal Forms
export const GLOBAL_COUNTRIES: Record<string, CountryInfo> = {
  'United States': {
    name: 'United States',
    code: 'US',
    flag: '🇺🇸',
    cctld: 'us',
    phoneCodes: ['+1'],
    majorCities: ['New York', 'Los Angeles', 'Chicago', 'Houston', 'Phoenix', 'Philadelphia', 'San Antonio', 'San Diego', 'Dallas', 'Austin', 'San Jose', 'San Francisco', 'Seattle', 'Denver', 'Washington', 'Boston', 'Atlanta', 'Miami', 'Detroit', 'Minneapolis', 'Las Vegas', 'Portland', 'Charlotte', 'Orlando', 'Nashville', 'Salt Lake City', 'Pittsburgh', 'Cincinnati', 'Cleveland', 'Indianapolis', 'Columbus', 'Kansas City'],
    statesOrRegions: ['California', 'Texas', 'Florida', 'New York', 'Illinois', 'Pennsylvania', 'Ohio', 'Georgia', 'North Carolina', 'Michigan', 'New Jersey', 'Virginia', 'Washington', 'Arizona', 'Massachusetts', 'Tennessee', 'Indiana', 'Missouri', 'Maryland', 'Wisconsin', 'Colorado', 'Minnesota', 'South Carolina', 'Alabama', 'Louisiana', 'Kentucky', 'Oregon', 'Oklahoma', 'Connecticut', 'Utah', 'Iowa', 'Nevada', 'Arkansas'],
    legalForms: ['Inc', 'Inc.', 'LLC', 'Corp', 'Corp.', 'Corporation', 'L.L.C.', 'LLP', 'Limited Liability Company'],
    languages: ['en-US', 'en']
  },
  'United Kingdom': {
    name: 'United Kingdom',
    code: 'GB',
    flag: '🇬🇧',
    cctld: 'uk',
    phoneCodes: ['+44'],
    majorCities: ['London', 'Manchester', 'Birmingham', 'Leeds', 'Glasgow', 'Edinburgh', 'Liverpool', 'Bristol', 'Sheffield', 'Newcastle', 'Belfast', 'Nottingham', 'Cardiff', 'Southampton', 'Reading', 'Cambridge', 'Oxford', 'Leicester', 'Aberdeen'],
    statesOrRegions: ['England', 'Scotland', 'Wales', 'Northern Ireland', 'Yorkshire', 'Greater London', 'Midlands'],
    legalForms: ['Ltd', 'Ltd.', 'Limited', 'PLC', 'Plc', 'LLP', 'L.L.P.'],
    languages: ['en-GB']
  },
  'Germany': {
    name: 'Germany',
    code: 'DE',
    flag: '🇩🇪',
    cctld: 'de',
    phoneCodes: ['+49'],
    majorCities: ['Berlin', 'Munich', 'München', 'Frankfurt', 'Hamburg', 'Cologne', 'Köln', 'Stuttgart', 'Düsseldorf', 'Leipzig', 'Dortmund', 'Essen', 'Bremen', 'Dresden', 'Hannover', 'Nuremberg', 'Nürnberg', 'Duisburg', 'Bonn', 'Karlsruhe', 'Mannheim', 'Augsburg'],
    statesOrRegions: ['Bavaria', 'Bayern', 'Baden-Württemberg', 'North Rhine-Westphalia', 'Nordrhein-Westfalen', 'Hessen', 'Saxony', 'Sachsen', 'Berlin'],
    legalForms: ['GmbH', 'AG', 'GmbH & Co. KG', 'KG', 'UG', 'e.V.', 'Gbr'],
    languages: ['de', 'de-DE', 'de-AT', 'de-CH']
  },
  'France': {
    name: 'France',
    code: 'FR',
    flag: '🇫🇷',
    cctld: 'fr',
    phoneCodes: ['+33'],
    majorCities: ['Paris', 'Marseille', 'Lyon', 'Toulouse', 'Nice', 'Nantes', 'Strasbourg', 'Montpellier', 'Bordeaux', 'Lille', 'Rennes', 'Reims', 'Saint-Étienne', 'Le Havre', 'Toulon', 'Grenoble', 'Dijon', 'Angers', 'Nîmes'],
    statesOrRegions: ['Île-de-France', 'Auvergne-Rhône-Alpes', 'Nouvelle-Aquitaine', 'Occitanie', 'Provence-Alpes-Côte d\'Azur'],
    legalForms: ['SAS', 'SASU', 'SARL', 'SA', 'S.A.', 'S.A.S.', 'SCI', 'EURL'],
    languages: ['fr', 'fr-FR']
  },
  'Canada': {
    name: 'Canada',
    code: 'CA',
    flag: '🇨🇦',
    cctld: 'ca',
    phoneCodes: ['+1'],
    majorCities: ['Toronto', 'Montreal', 'Montréal', 'Vancouver', 'Calgary', 'Edmonton', 'Ottawa', 'Winnipeg', 'Quebec City', 'Québec', 'Hamilton', 'Kitchener', 'London', 'Victoria', 'Halifax'],
    statesOrRegions: ['Ontario', 'Quebec', 'Québec', 'British Columbia', 'Alberta', 'Manitoba', 'Saskatchewan', 'Nova Scotia'],
    legalForms: ['Inc.', 'Corp.', 'Ltd.', 'ULC', 'Limitée'],
    languages: ['en-CA', 'fr-CA']
  },
  'Australia': {
    name: 'Australia',
    code: 'AU',
    flag: '🇦🇺',
    cctld: 'au',
    phoneCodes: ['+61'],
    majorCities: ['Sydney', 'Melbourne', 'Brisbane', 'Perth', 'Adelaide', 'Gold Coast', 'Canberra', 'Newcastle', 'Wollongong', 'Hobart', 'Geelong', 'Cairns', 'Darwin'],
    statesOrRegions: ['New South Wales', 'NSW', 'Victoria', 'VIC', 'Queensland', 'QLD', 'Western Australia', 'WA', 'South Australia', 'SA', 'Tasmania', 'TAS'],
    legalForms: ['Pty Ltd', 'Pty. Ltd.', 'Pty Limited', 'Limited', 'Ltd'],
    languages: ['en-AU']
  },
  'Japan': {
    name: 'Japan',
    code: 'JP',
    flag: '🇯🇵',
    cctld: 'jp',
    phoneCodes: ['+81'],
    majorCities: ['Tokyo', 'Yokohama', 'Osaka', 'Nagoya', 'Sapporo', 'Fukuoka', 'Kobe', 'Kyoto', 'Kawasaki', 'Saitama', 'Hiroshima', 'Sendai', 'Chiba'],
    statesOrRegions: ['Kanto', 'Kansai', 'Chubu', 'Tohoku', 'Kyushu', 'Hokkaido'],
    legalForms: ['K.K.', 'KK', 'Kabushiki Kaisha', 'G.K.', 'Godo Kaisha', 'Co., Ltd.'],
    languages: ['ja', 'ja-JP']
  },
  'China': {
    name: 'China',
    code: 'CN',
    flag: '🇨🇳',
    cctld: 'cn',
    phoneCodes: ['+86'],
    majorCities: ['Beijing', 'Shanghai', 'Shenzhen', 'Guangzhou', 'Chengdu', 'Hangzhou', 'Wuhan', 'Nanjing', 'Chongqing', 'Tianjin', 'Suzhou', 'Xi\'an', 'Dongguan', 'Ningbo', 'Qingdao', 'Xiamen'],
    statesOrRegions: ['Guangdong', 'Zhejiang', 'Jiangsu', 'Shandong', 'Sichuan', 'Fujian'],
    legalForms: ['Co., Ltd.', 'Group Co., Ltd.', 'Ltd.'],
    languages: ['zh', 'zh-CN', 'zh-Hans']
  },
  'India': {
    name: 'India',
    code: 'IN',
    flag: '🇮🇳',
    cctld: 'in',
    phoneCodes: ['+91'],
    majorCities: ['Mumbai', 'Delhi', 'New Delhi', 'Bangalore', 'Bengaluru', 'Hyderabad', 'Chennai', 'Kolkata', 'Pune', 'Ahmedabad', 'Surat', 'Jaipur', 'Lucknow', 'Kanpur', 'Nagpur', 'Indore', 'Noida', 'Gurugram', 'Gurgaon', 'Coimbatore'],
    statesOrRegions: ['Maharashtra', 'Karnataka', 'Tamil Nadu', 'Telangana', 'Gujarat', 'Uttar Pradesh', 'Haryana'],
    legalForms: ['Pvt Ltd', 'Pvt. Ltd.', 'Private Limited', 'Ltd', 'Limited', 'LLP'],
    languages: ['en-IN', 'hi']
  },
  'Italy': {
    name: 'Italy',
    code: 'IT',
    flag: '🇮🇹',
    cctld: 'it',
    phoneCodes: ['+39'],
    majorCities: ['Rome', 'Roma', 'Milan', 'Milano', 'Naples', 'Napoli', 'Turin', 'Torino', 'Palermo', 'Genoa', 'Genova', 'Bologna', 'Florence', 'Firenze', 'Bari', 'Catania', 'Venice', 'Venezia', 'Verona', 'Padua', 'Trieste', 'Brescia'],
    statesOrRegions: ['Lombardy', 'Lombardia', 'Lazio', 'Veneto', 'Emilia-Romagna', 'Piedmont', 'Piemonte', 'Tuscany', 'Toscana'],
    legalForms: ['S.r.l.', 'Srl', 'S.p.A.', 'SpA', 'S.n.c.', 'S.a.s.'],
    languages: ['it', 'it-IT']
  },
  'Spain': {
    name: 'Spain',
    code: 'ES',
    flag: '🇪🇸',
    cctld: 'es',
    phoneCodes: ['+34'],
    majorCities: ['Madrid', 'Barcelona', 'Valencia', 'Seville', 'Sevilla', 'Zaragoza', 'Málaga', 'Murcia', 'Palma', 'Las Palmas', 'Bilbao', 'Alicante', 'Córdoba', 'Valladolid', 'Vigo', 'Gijón'],
    statesOrRegions: ['Catalonia', 'Cataluña', 'Andalusia', 'Andalucía', 'Comunidad de Madrid', 'País Vasco', 'Basque Country'],
    legalForms: ['S.L.', 'SL', 'S.A.', 'SA', 'S.L.U.', 'S.C.'],
    languages: ['es', 'es-ES', 'ca']
  },
  'Netherlands': {
    name: 'Netherlands',
    code: 'NL',
    flag: '🇳🇱',
    cctld: 'nl',
    phoneCodes: ['+31'],
    majorCities: ['Amsterdam', 'Rotterdam', 'The Hague', 'Den Haag', 'Utrecht', 'Eindhoven', 'Groningen', 'Tilburg', 'Almere', 'Breda', 'Nijmegen', 'Enschede', 'Haarlem', 'Arnhem'],
    statesOrRegions: ['North Holland', 'South Holland', 'Noord-Brabant', 'Gelderland', 'Utrecht'],
    legalForms: ['B.V.', 'BV', 'N.V.', 'NV', 'V.O.F.'],
    languages: ['nl', 'nl-NL']
  },
  'Switzerland': {
    name: 'Switzerland',
    code: 'CH',
    flag: '🇨🇭',
    cctld: 'ch',
    phoneCodes: ['+41'],
    majorCities: ['Zurich', 'Zürich', 'Geneva', 'Genève', 'Basel', 'Lausanne', 'Bern', 'Winterthur', 'Lucerne', 'Luzern', 'St. Gallen', 'Lugano', 'Biel/Bienne', 'Thun'],
    statesOrRegions: ['Zurich', 'Geneva', 'Vaud', 'Bern', 'Basel-Stadt', 'Ticino'],
    legalForms: ['AG', 'SA', 'GmbH', 'Sarl'],
    languages: ['de-CH', 'fr-CH', 'it-CH']
  },
  'Sweden': {
    name: 'Sweden',
    code: 'SE',
    flag: '🇸🇪',
    cctld: 'se',
    phoneCodes: ['+46'],
    majorCities: ['Stockholm', 'Gothenburg', 'Göteborg', 'Malmö', 'Uppsala', 'Västerås', 'Örebro', 'Linköping', 'Helsingborg', 'Jönköping', 'Norrköping', 'Lund'],
    statesOrRegions: ['Stockholm', 'Västra Götaland', 'Skåne'],
    legalForms: ['AB', 'Aktiebolag'],
    languages: ['sv', 'sv-SE']
  },
  'Poland': {
    name: 'Poland',
    code: 'PL',
    flag: '🇵🇱',
    cctld: 'pl',
    phoneCodes: ['+48'],
    majorCities: ['Warsaw', 'Warszawa', 'Kraków', 'Cracow', 'Łódź', 'Wrocław', 'Poznań', 'Gdańsk', 'Szczecin', 'Bydgoszcz', 'Lublin', 'Katowice', 'Białystok', 'Gdynia'],
    statesOrRegions: ['Mazowieckie', 'Małopolskie', 'Dolnośląskie', 'Wielkopolskie', 'Śląskie'],
    legalForms: ['Sp. z o.o.', 'Spółka z o.o.', 'S.A.', 'Sp. k.'],
    languages: ['pl', 'pl-PL']
  },
  'Brazil': {
    name: 'Brazil',
    code: 'BR',
    flag: '🇧🇷',
    cctld: 'br',
    phoneCodes: ['+55'],
    majorCities: ['São Paulo', 'Sao Paulo', 'Rio de Janeiro', 'Brasília', 'Salvador', 'Fortaleza', 'Belo Horizonte', 'Manaus', 'Curitiba', 'Recife', 'Porto Alegre', 'Goiânia', 'Belém', 'Campinas'],
    statesOrRegions: ['São Paulo', 'Rio de Janeiro', 'Minas Gerais', 'Paraná', 'Rio Grande do Sul', 'Bahia'],
    legalForms: ['Ltda', 'Ltda.', 'S.A.', 'EIRELI', 'ME'],
    languages: ['pt', 'pt-BR']
  },
  'Mexico': {
    name: 'Mexico',
    code: 'MX',
    flag: '🇲🇽',
    cctld: 'mx',
    phoneCodes: ['+52'],
    majorCities: ['Mexico City', 'CDMX', 'Ciudad de México', 'Guadalajara', 'Monterrey', 'Puebla', 'Tijuana', 'León', 'Juárez', 'Zapopan', 'Mérida', 'Querétaro', 'Toluca', 'Cancún'],
    statesOrRegions: ['Jalisco', 'Nuevo León', 'Estado de México', 'Puebla', 'Guanajuato'],
    legalForms: ['S.A. de C.V.', 'SA de CV', 'S. de R.L. de C.V.', 'S.A.P.I. de C.V.'],
    languages: ['es-MX', 'es']
  },
  'United Arab Emirates': {
    name: 'United Arab Emirates',
    code: 'AE',
    flag: '🇦🇪',
    cctld: 'ae',
    phoneCodes: ['+971'],
    majorCities: ['Dubai', 'Abu Dhabi', 'Sharjah', 'Al Ain', 'Ajman', 'Ras Al Khaimah', 'Fujairah'],
    statesOrRegions: ['Dubai', 'Abu Dhabi', 'Sharjah'],
    legalForms: ['LLC', 'FZE', 'FZCO', 'PJSC', 'PrJSC'],
    languages: ['ar-AE', 'en']
  },
  'Singapore': {
    name: 'Singapore',
    code: 'SG',
    flag: '🇸🇬',
    cctld: 'sg',
    phoneCodes: ['+65'],
    majorCities: ['Singapore'],
    legalForms: ['Pte Ltd', 'Pte. Ltd.', 'Private Limited', 'Ltd'],
    languages: ['en-SG', 'zh-SG']
  },
  'South Korea': {
    name: 'South Korea',
    code: 'KR',
    flag: '🇰🇷',
    cctld: 'kr',
    phoneCodes: ['+82'],
    majorCities: ['Seoul', 'Busan', 'Incheon', 'Daegu', 'Daejeon', 'Gwangju', 'Suwon', 'Ulsan', 'Changwon', 'Seongnam'],
    statesOrRegions: ['Gyeonggi-do', 'Seoul Capital Area'],
    legalForms: ['Co., Ltd.', 'Inc.', 'Corp.'],
    languages: ['ko', 'ko-KR']
  },
  'Austria': {
    name: 'Austria',
    code: 'AT',
    flag: '🇦🇹',
    cctld: 'at',
    phoneCodes: ['+43'],
    majorCities: ['Vienna', 'Wien', 'Graz', 'Linz', 'Salzburg', 'Innsbruck', 'Klagenfurt', 'Villach', 'Wels'],
    legalForms: ['GmbH', 'AG'],
    languages: ['de-AT']
  },
  'Belgium': {
    name: 'Belgium',
    code: 'BE',
    flag: '🇧🇪',
    cctld: 'be',
    phoneCodes: ['+32'],
    majorCities: ['Brussels', 'Bruxelles', 'Antwerp', 'Antwerpen', 'Ghent', 'Gent', 'Charleroi', 'Liège', 'Bruges', 'Brugge', 'Namur', 'Leuven'],
    legalForms: ['NV', 'SA', 'BV', 'SRL', 'SPRL'],
    languages: ['nl-BE', 'fr-BE']
  },
  'Denmark': {
    name: 'Denmark',
    code: 'DK',
    flag: '🇩🇰',
    cctld: 'dk',
    phoneCodes: ['+45'],
    majorCities: ['Copenhagen', 'København', 'Aarhus', 'Odense', 'Aalborg', 'Esbjerg', 'Randers', 'Kolding'],
    legalForms: ['A/S', 'ApS', 'I/S'],
    languages: ['da', 'da-DK']
  },
  'Norway': {
    name: 'Norway',
    code: 'NO',
    flag: '🇳🇴',
    cctld: 'no',
    phoneCodes: ['+47'],
    majorCities: ['Oslo', 'Bergen', 'Trondheim', 'Stavanger', 'Bærum', 'Kristiansand', 'Drammen', 'Tromsø'],
    legalForms: ['AS', 'ASA', 'ANS'],
    languages: ['no', 'nb', 'nn']
  },
  'Finland': {
    name: 'Finland',
    code: 'FI',
    flag: '🇫🇮',
    cctld: 'fi',
    phoneCodes: ['+358'],
    majorCities: ['Helsinki', 'Espoo', 'Tampere', 'Vantaa', 'Oulu', 'Turku', 'Jyväskylä', 'Lahti', 'Kuopio'],
    legalForms: ['Oy', 'Oyj', 'Ky'],
    languages: ['fi', 'fi-FI', 'sv-FI']
  },
  'Ireland': {
    name: 'Ireland',
    code: 'IE',
    flag: '🇮🇪',
    cctld: 'ie',
    phoneCodes: ['+353'],
    majorCities: ['Dublin', 'Cork', 'Limerick', 'Galway', 'Waterford', 'Drogheda', 'Dundalk', 'Swords'],
    legalForms: ['DAC', 'CLG', 'Ltd', 'Limited', 'PLC'],
    languages: ['en-IE']
  },
  'Portugal': {
    name: 'Portugal',
    code: 'PT',
    flag: '🇵🇹',
    cctld: 'pt',
    phoneCodes: ['+351'],
    majorCities: ['Lisbon', 'Lisboa', 'Porto', 'Vila Nova de Gaia', 'Amadora', 'Braga', 'Funchal', 'Coimbra', 'Setúbal'],
    legalForms: ['Lda', 'Lda.', 'S.A.', 'SA'],
    languages: ['pt-PT']
  },
  'Turkey': {
    name: 'Turkey',
    code: 'TR',
    flag: '🇹🇷',
    cctld: 'tr',
    phoneCodes: ['+90'],
    majorCities: ['Istanbul', 'İstanbul', 'Ankara', 'Izmir', 'İzmir', 'Bursa', 'Antalya', 'Adana', 'Konya', 'Gaziantep', 'Kocaeli'],
    legalForms: ['A.Ş.', 'A.S.', 'Ltd. Şti.', 'Ltd. Sti.'],
    languages: ['tr', 'tr-TR']
  },
  'South Africa': {
    name: 'South Africa',
    code: 'ZA',
    flag: '🇿🇦',
    cctld: 'za',
    phoneCodes: ['+27'],
    majorCities: ['Johannesburg', 'Cape Town', 'Durban', 'Pretoria', 'Port Elizabeth', 'Bloemfontein', 'East London'],
    legalForms: ['(Pty) Ltd', 'Pty Ltd', 'Ltd', 'SOC Ltd'],
    languages: ['en-ZA', 'af']
  },
  'New Zealand': {
    name: 'New Zealand',
    code: 'NZ',
    flag: '🇳🇿',
    cctld: 'nz',
    phoneCodes: ['+64'],
    majorCities: ['Auckland', 'Wellington', 'Christchurch', 'Hamilton', 'Tauranga', 'Napier-Hastings', 'Dunedin'],
    legalForms: ['Limited', 'Ltd'],
    languages: ['en-NZ']
  },
  'Hong Kong': {
    name: 'Hong Kong',
    code: 'HK',
    flag: '🇭🇰',
    cctld: 'hk',
    phoneCodes: ['+852'],
    majorCities: ['Hong Kong', 'Kowloon', 'Central'],
    legalForms: ['Limited', 'Ltd', 'Co., Limited'],
    languages: ['zh-HK', 'en']
  },
  'Taiwan': {
    name: 'Taiwan',
    code: 'TW',
    flag: '🇹🇼',
    cctld: 'tw',
    phoneCodes: ['+886'],
    majorCities: ['Taipei', 'Kaohsiung', 'Taichung', 'Tainan', 'Taoyuan', 'Hsinchu'],
    legalForms: ['Co., Ltd.', 'Ltd.'],
    languages: ['zh-TW']
  },
  'Saudi Arabia': {
    name: 'Saudi Arabia',
    code: 'SA',
    flag: '🇸🇦',
    cctld: 'sa',
    phoneCodes: ['+966'],
    majorCities: ['Riyadh', 'Jeddah', 'Mecca', 'Medina', 'Dammam', 'Khobar', 'Dhahran', 'Tabuk'],
    legalForms: ['LLC', 'JSC', 'Closed Joint Stock'],
    languages: ['ar-SA']
  },
  'Israel': {
    name: 'Israel',
    code: 'IL',
    flag: '🇮🇱',
    cctld: 'il',
    phoneCodes: ['+972'],
    majorCities: ['Tel Aviv', 'Jerusalem', 'Haifa', 'Rishon LeZion', 'Petah Tikva', 'Ashdod', 'Netanya', 'Beer Sheva', 'Herzliya'],
    legalForms: ['Ltd', 'Limited'],
    languages: ['he', 'he-IL', 'en']
  },
  'Czech Republic': {
    name: 'Czech Republic',
    code: 'CZ',
    flag: '🇨🇿',
    cctld: 'cz',
    phoneCodes: ['+420'],
    majorCities: ['Prague', 'Praha', 'Brno', 'Ostrava', 'Plzeň', 'Liberec', 'Olomouc'],
    legalForms: ['s.r.o.', 'a.s.', 'v.o.s.'],
    languages: ['cs', 'cs-CZ']
  }
};

/**
 * Return appropriate country emoji flag
 */
export function getCountryFlag(countryName: string): string {
  if (!countryName || countryName === 'Unknown' || countryName === 'Global') {
    return '🌐';
  }
  const match = GLOBAL_COUNTRIES[countryName];
  if (match) return match.flag;

  // Search case-insensitively
  const lower = countryName.toLowerCase().trim();
  for (const [name, info] of Object.entries(GLOBAL_COUNTRIES)) {
    if (name.toLowerCase() === lower || info.code.toLowerCase() === lower) {
      return info.flag;
    }
  }

  return '🏳️';
}

/**
 * Clean domain string into base hostname
 */
export function cleanDomainName(raw: string): string {
  if (!raw) return '';
  return raw
    .toLowerCase()
    .trim()
    .replace(/^https?:\/\//i, '')
    .replace(/^www\./i, '')
    .split('/')[0]
    .split('?')[0]
    .split('#')[0]
    .split(':')[0];
}

/**
 * Inspect HTML content from website contact/about/home pages
 * Extracts country based on:
 * 1. Schema.org JSON-LD PostalAddress
 * 2. HTML lang and meta geotags (geo.region, geo.placename)
 * 3. OpenGraph locale (og:locale)
 * 4. International telephone dialing codes on contact page (+49, +44, +33, etc.)
 * 5. Impressum legal notice (German/Austrian/Swiss mandatory imprint)
 * 6. Physical address keywords and major cities
 * 7. Distinct national legal entity forms (GmbH, SAS, B.V., S.L., Pty Ltd, etc.)
 */
export function analyzeWebsiteHtmlForCountry(html: string, domain: string): { country: string; method: DomainCountryResolution['method']; evidence: string; confidence: number } | null {
  if (!html || html.length < 50) return null;

  const lowerHtml = html.toLowerCase();

  // 1. Check Schema.org JSON-LD for explicit country
  try {
    const jsonLdRegex = /<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi;
    let match;
    while ((match = jsonLdRegex.exec(html)) !== null) {
      try {
        const parsed = JSON.parse(match[1].trim());
        const nodes = Array.isArray(parsed) ? parsed : (parsed['@graph'] || [parsed]);
        for (const node of nodes) {
          if (!node || typeof node !== 'object') continue;
          
          // Address node check
          const address = node.address || (node['@type'] === 'PostalAddress' ? node : null);
          if (address && typeof address === 'object') {
            const countryVal = address.addressCountry;
            const countryStr = typeof countryVal === 'string' ? countryVal.trim() : (countryVal?.name || '');
            if (countryStr) {
              // Match 2-letter ISO or full name
              for (const [name, info] of Object.entries(GLOBAL_COUNTRIES)) {
                if (info.code.toLowerCase() === countryStr.toLowerCase() || name.toLowerCase() === countryStr.toLowerCase()) {
                  return {
                    country: name,
                    method: 'jsonld_schema',
                    evidence: `Schema.org addressCountry: "${countryStr}"`,
                    confidence: 98
                  };
                }
              }
            }
          }
        }
      } catch {}
    }
  } catch {}

  // 2. Impressum (Strictly Germany / Austria / Switzerland legal notice requirement)
  if (lowerHtml.includes('impressum') || lowerHtml.includes('handelsregister') || lowerHtml.includes('amtsgericht')) {
    if (lowerHtml.includes('deutschland') || lowerHtml.includes('germany') || lowerHtml.includes('berlin') || lowerHtml.includes('münchen') || lowerHtml.includes('munich') || lowerHtml.includes('frankfurt') || lowerHtml.includes('hamburg')) {
      return {
        country: 'Germany',
        method: 'impressum',
        evidence: 'Mandatory German Impressum / Commercial Register entry detected',
        confidence: 96
      };
    }
    if (lowerHtml.includes('österreich') || lowerHtml.includes('austria') || lowerHtml.includes('wien') || lowerHtml.includes('vienna')) {
      return {
        country: 'Austria',
        method: 'impressum',
        evidence: 'Austrian Impressum detected',
        confidence: 95
      };
    }
    if (lowerHtml.includes('schweiz') || lowerHtml.includes('suisse') || lowerHtml.includes('switzerland') || lowerHtml.includes('zürich') || lowerHtml.includes('zurich') || lowerHtml.includes('geneva')) {
      return {
        country: 'Switzerland',
        method: 'impressum',
        evidence: 'Swiss Impressum / Registry detected',
        confidence: 95
      };
    }
  }

  // 3. Meta Geotags (<meta name="geo.region" content="US-CA" /> or <meta name="geo.placename" content="London" />)
  const geoRegionMatch = html.match(/<meta[^>]+name=["']geo\.region["'][^>]+content=["']([a-zA-Z]{2})(?:-[a-zA-Z0-9]+)?["']/i);
  if (geoRegionMatch) {
    const isoCode = geoRegionMatch[1].toUpperCase();
    for (const [name, info] of Object.entries(GLOBAL_COUNTRIES)) {
      if (info.code === isoCode) {
        return {
          country: name,
          method: 'meta_geotag',
          evidence: `Meta geo.region: "${geoRegionMatch[0]}"`,
          confidence: 94
        };
      }
    }
  }

  // 4. OpenGraph Locale (<meta property="og:locale" content="en_GB" />)
  const ogLocaleMatch = html.match(/<meta[^>]+property=["']og:locale["'][^>]+content=["']([a-z]{2})_([A-Z]{2})["']/i);
  if (ogLocaleMatch) {
    const countryCode = ogLocaleMatch[2].toUpperCase();
    for (const [name, info] of Object.entries(GLOBAL_COUNTRIES)) {
      if (info.code === countryCode) {
        // High confidence for distinct non-generic locales
        if (countryCode !== 'US' || lowerHtml.includes('usa') || lowerHtml.includes('united states')) {
          return {
            country: name,
            method: 'meta_geotag',
            evidence: `og:locale: "${ogLocaleMatch[1]}_${countryCode}"`,
            confidence: 88
          };
        }
      }
    }
  }

  // 5. Telephone Dialing Codes in Contact/Footer text
  // Scan for phone numbers: e.g., "+49 30 12345", "+44 (0)20 7946 0919", "+33 1 42 68", "+81 3 5555"
  const phoneRegex = /(?:\+|00)(1|44|49|33|39|34|31|41|43|46|47|45|358|48|351|353|32|81|82|86|91|61|64|55|52|971|966|65|27|972|90)\s*[\(\)\-.\s]*[0-9]{1,4}[\(\)\-.\s]*[0-9]{3,4}[\(\)\-.\s]*[0-9]{3,5}/g;
  const phoneMatches = Array.from(html.matchAll(phoneRegex));
  if (phoneMatches.length > 0) {
    const codeCounts = new Map<string, number>();
    for (const m of phoneMatches) {
      const pCode = '+' + m[1];
      codeCounts.set(pCode, (codeCounts.get(pCode) || 0) + 1);
    }
    
    // Pick the most frequent phone code
    let bestCode = '';
    let maxCount = 0;
    for (const [code, count] of codeCounts.entries()) {
      if (count > maxCount) {
        maxCount = count;
        bestCode = code;
      }
    }

    if (bestCode && bestCode !== '+1') { // +1 is shared by US and Canada, handled below
      for (const [name, info] of Object.entries(GLOBAL_COUNTRIES)) {
        if (info.phoneCodes.includes(bestCode)) {
          return {
            country: name,
            method: 'phone_code',
            evidence: `Contact phone international dialing code: ${bestCode}`,
            confidence: 92
          };
        }
      }
    }
  }

  // 6. Distinct National Legal Entity Forms in footer or about text
  // e.g. "Acme GmbH", "Société Générale S.A.S.", "Retail B.V.", "Trading Pty Ltd"
  const legalTests: Array<{ regex: RegExp; country: string; confidence: number }> = [
    { regex: /\b(?:gmbh\s*&\s*co\.?\s*kg|gmbh|aktiengesellschaft)\b/i, country: 'Germany', confidence: 89 },
    { regex: /\b(?:s\.?a\.?s\.?|s\.?a\.?r\.?l\.?|sasu|société par actions simplifiée)\b/i, country: 'France', confidence: 88 },
    { regex: /\b(?:pty\.?\s+ltd\.?|proprietary\s+limited)\b/i, country: 'Australia', confidence: 91 },
    { regex: /\b(?:b\.?v\.?|besloten\s+vennootschap)\b/i, country: 'Netherlands', confidence: 90 },
    { regex: /\b(?:sp\.?\s+z\s+o\.?o\.?|spółka\s+z\s+o\.?o\.?)\b/i, country: 'Poland', confidence: 93 },
    { regex: /\b(?:s\.?l\.?u\.?|sociedad\s+limitada)\b/i, country: 'Spain', confidence: 87 },
    { regex: /\b(?:s\.?r\.?l\.?|società\s+a\s+responsabilità\s+limitata)\b/i, country: 'Italy', confidence: 87 },
    { regex: /\b(?:aktiebolag|ab\s+publ)\b/i, country: 'Sweden', confidence: 88 },
    { regex: /\b(?:pvt\.?\s+ltd\.?|private\s+limited)\b/i, country: 'India', confidence: 86 }
  ];

  for (const test of legalTests) {
    if (test.regex.test(html)) {
      return {
        country: test.country,
        method: 'contact_page_address',
        evidence: `National corporate legal form verified: "${html.match(test.regex)?.[0]}"`,
        confidence: test.confidence
      };
    }
  }

  // 7. City and Address mentions in text
  // Prioritize cities paired with addresses or headquarters keywords
  const hqAddressBlock = html.match(/(?:headquarters|head\s+office|registered\s+office|contact\s+us|our\s+office|location|address)[\s\S]{0,350}/gi);
  const textToScan = hqAddressBlock ? hqAddressBlock.join(' ') : lowerHtml;

  for (const [countryName, info] of Object.entries(GLOBAL_COUNTRIES)) {
    // Check if country name is explicitly in the address block
    const countryRegex = new RegExp(`\\b${countryName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i');
    if (countryRegex.test(textToScan)) {
      return {
        country: countryName,
        method: 'contact_page_address',
        evidence: `Explicit country name identified in contact section: "${countryName}"`,
        confidence: 85
      };
    }

    // Check major cities
    for (const city of info.majorCities) {
      if (city.length >= 5) {
        const cityRegex = new RegExp(`\\b${city}\\b`, 'i');
        if (cityRegex.test(textToScan)) {
          return {
            country: countryName,
            method: 'contact_page_address',
            evidence: `Major metropolitan headquarters city located: "${city}", ${countryName}`,
            confidence: 82
          };
        }
      }
    }
  }

  // 8. HTML Lang tag (<html lang="de">, <html lang="ja">)
  const langMatch = html.match(/<html[^>]+lang=["']([a-zA-Z]{2})(?:-[a-zA-Z]{2})?["']/i);
  if (langMatch) {
    const langCode = langMatch[1].toLowerCase();
    const langToCountry: Record<string, string> = {
      'de': 'Germany',
      'fr': 'France',
      'ja': 'Japan',
      'it': 'Italy',
      'nl': 'Netherlands',
      'pl': 'Poland',
      'sv': 'Sweden',
      'da': 'Denmark',
      'no': 'Norway',
      'fi': 'Finland',
      'ko': 'South Korea',
      'tr': 'Turkey',
      'cs': 'Czech Republic',
      'pt': 'Brazil',
      'es': 'Spain'
    };
    if (langToCountry[langCode]) {
      return {
        country: langToCountry[langCode],
        method: 'meta_geotag',
        evidence: `Document primary language attribute: <html lang="${langCode}">`,
        confidence: 78
      };
    }
  }

  return null;
}

/**
 * Parse Search Engine snippets (DuckDuckGo, Google, etc.) to extract headquarters country
 */
export function analyzeSearchSnippetForCountry(snippet: string, title: string = ''): { country: string; evidence: string; confidence: number } | null {
  if (!snippet && !title) return null;
  const combined = `${title} ${snippet}`.toLowerCase();

  // Pattern: "headquartered in X", "headquarters in X", "based in X", "offices in X"
  const hqPatterns = [
    /headquartered\s+(?:in|at)\s+([A-Za-z\s,]+?)(?:\.|\;|\-|\(|\)|\n|$)/i,
    /headquarters\s+(?:in|at|is)\s+([A-Za-z\s,]+?)(?:\.|\;|\-|\(|\)|\n|$)/i,
    /based\s+in\s+([A-Za-z\s,]+?)(?:\.|\;|\-|\(|\)|\n|$)/i,
    /(?:american|german|british|french|japanese|canadian|australian|italian|spanish|chinese|indian|swiss|swedish|dutch)\s+(?:company|corporation|firm|manufacturer|enterprise|retailer|agency|provider)/i
  ];

  // Check national adjective descriptors: "a German manufacturer", "an American software company"
  const demonymMap: Record<string, string> = {
    'american': 'United States',
    'german': 'Germany',
    'british': 'United Kingdom',
    'french': 'France',
    'japanese': 'Japan',
    'canadian': 'Canada',
    'australian': 'Australia',
    'italian': 'Italy',
    'spanish': 'Spain',
    'chinese': 'China',
    'indian': 'India',
    'swiss': 'Switzerland',
    'swedish': 'Sweden',
    'dutch': 'Netherlands',
    'brazilian': 'Brazil',
    'mexican': 'Mexico',
    'korean': 'South Korea',
    'danish': 'Denmark',
    'norwegian': 'Norway',
    'finnish': 'Finland',
    'austrian': 'Austria',
    'belgian': 'Belgium',
    'polish': 'Poland',
    'irish': 'Ireland'
  };

  for (const [demonym, country] of Object.entries(demonymMap)) {
    const reg = new RegExp(`\\b${demonym}\\b`, 'i');
    if (reg.test(combined)) {
      return {
        country,
        evidence: `Search engine verified national corporate entity: "${demonym} company"`,
        confidence: 88
      };
    }
  }

  // Check explicit country mentions in snippet
  for (const [name, info] of Object.entries(GLOBAL_COUNTRIES)) {
    const nameRegex = new RegExp(`\\b(?:in|at|from)\\s+${name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i');
    if (nameRegex.test(combined)) {
      return {
        country: name,
        evidence: `Search engine identified headquarters in ${name}`,
        confidence: 86
      };
    }

    // Check cities
    for (const city of info.majorCities) {
      if (city.length >= 6) {
        const cityRegex = new RegExp(`\\b(?:in|at|near)\\s+${city}\\b`, 'i');
        if (cityRegex.test(combined)) {
          return {
            country: name,
            evidence: `Search engine identified location in ${city}, ${name}`,
            confidence: 83
          };
        }
      }
    }
  }

  return null;
}
