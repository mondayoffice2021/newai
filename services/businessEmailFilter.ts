import { isPublicDomain } from '../constants/domains';

export type NonBusinessCategory = 
  | 'bank' 
  | 'government' 
  | 'education' 
  | 'news' 
  | 'webmaster_bot' 
  | 'public_webmail';

export interface BusinessFilterOptions {
  filterBank?: boolean;
  filterGovernment?: boolean;
  filterEducation?: boolean;
  filterNews?: boolean;
  filterWebmasterBot?: boolean;
  filterPublicWebmail?: boolean;
}

export const DEFAULT_BUSINESS_FILTER_OPTIONS: BusinessFilterOptions = {
  filterBank: true,
  filterGovernment: true,
  filterEducation: true,
  filterNews: true,
  filterWebmasterBot: true,
  filterPublicWebmail: false, // Default false so corporate users with custom domains or general contacts can decide
};

export interface BusinessFilterResult {
  isBusiness: boolean;
  category: 'business' | NonBusinessCategory | 'invalid';
  reason?: string;
  matchedRule?: string;
}

// 1. Bank & Financial institutions
const BANK_KEYWORDS = [
  'bank', 'banco', 'banque', 'banca', 'banking', 'creditunion', 'credit-union',
  'capital', 'finance', 'financial', 'invest', 'investment', 'chase', 'wellsfargo',
  'citi', 'citigroup', 'hsbc', 'barclays', 'santander', 'ubs', 'deutschebank',
  'standardchartered', 'pnc', 'usbank', 'truist', 'schwab', 'fidelity',
  'vanguard', 'paypal', 'stripe', 'visa', 'mastercard', 'amex', 'americanexpress',
  'klarna', 'revolut', 'wise.com', 'monzo', 'n26', 'crypto', 'binance', 'coinbase',
  'kraken', 'blockchain', 'wallet', 'treasury', 'lending', 'mortgage', 'wealth'
];

const EXACT_BANK_DOMAINS = new Set([
  'chase.com', 'wellsfargo.com', 'citi.com', 'citigroup.com', 'hsbc.com',
  'barclays.com', 'santander.com', 'ubs.com', 'db.com', 'sc.com',
  'pnc.com', 'usbank.com', 'truist.com', 'schwab.com', 'fidelity.com',
  'vanguard.com', 'paypal.com', 'stripe.com', 'visa.com', 'mastercard.com',
  'americanexpress.com', 'revolut.com', 'wise.com', 'binance.com', 'coinbase.com'
]);

// 2. Government & Military
const GOV_TLD_SUBSTRINGS = [
  '.gov', '.mil', '.gouv.', '.gob.', '.go.jp', '.go.kr', '.go.id', '.go.th',
  '.gv.at', '.admin.ch', '.gov.uk', '.gov.in', '.gov.cn', '.gov.au', '.gov.br',
  '.gov.it', '.gov.za', '.europa.eu', '.belgium.be', '.etat.', '.bund.'
];

const GOV_KEYWORDS = [
  'parliament', 'ministry', 'senate', 'congress', 'embassy', 'consulate',
  'police', 'customs', 'irs.gov', 'fbi.gov', 'cia.gov', 'bundeswehr',
  'bundestag', 'prefecture', 'municipality', 'cityhall', 'state.gov',
  'governance', 'department-of-', 'dept-of-', 'gov-'
];

// 3. Education & Academic
const EDU_TLD_SUBSTRINGS = [
  '.edu', '.ac.uk', '.ac.in', '.ac.jp', '.ac.kr', '.ac.nz', '.ac.za',
  '.ac.at', '.ac.be', '.edu.cn', '.edu.au', '.edu.sg', '.edu.hk',
  '.edu.my', '.edu.tw', '.edu.tr', '.edu.eg', '.edu.ng', '.edu.pk',
  '.edu.ph', '.edu.co', '.edu.ar', '.edu.br', '.edu.mx', '.school.nz'
];

const EDU_KEYWORDS = [
  'university', 'universitaet', 'universidad', 'universite', 'universite',
  'college', 'harvard', 'stanford', 'oxford', 'cambridge', 'mit.edu',
  'school', 'academy', 'campus', 'alumni', 'student', 'faculty',
  'professor', 'k12', 'highschool', 'polytechnic', 'kindergarten'
];

// 4. News & Media
const NEWS_DOMAINS = new Set([
  'cnn.com', 'bbc.com', 'bbc.co.uk', 'reuters.com', 'bloomberg.com', 'nytimes.com',
  'wsj.com', 'washingtonpost.com', 'theguardian.com', 'apnews.com', 'forbes.com',
  'ft.com', 'spiegel.de', 'lefigaro.fr', 'lemonde.fr', 'corriere.it', 'asahi.com',
  'yomiuri.co.jp', 'xinhuanet.com', 'chinadaily.com.cn', 'huffpost.com', 'buzzfeed.com',
  'foxnews.com', 'nbcnews.com', 'cbsnews.com', 'economist.com', 'politico.com',
  'aljazeera.com', 'dw.com', 'zeit.de', 'faz.net', 'bild.de', 'elpais.com'
]);

const NEWS_DOMAIN_KEYWORDS = [
  'news', 'press', 'gazette', 'tribune', 'media', 'journal', 'times', 'post',
  'herald', 'broadcast', 'chronicle', 'daily', 'magazine', 'reporters',
  'editorial', 'journalism', 'pressrelease', 'wire', 'broadcasting', 'tvnews',
  'radiostation', 'newspaper', 'pubblica'
];

const NEWS_USERNAMES = new Set([
  'press', 'media', 'news', 'editor', 'editorial', 'journalism', 'reporters',
  'journalist', 'newsroom', 'anchors', 'desk', 'breakingnews'
]);

// 5. Webmaster & Automated Bot / Technical Mailboxes
const FORBIDDEN_USERNAMES = new Set([
  'webmaster', 'postmaster', 'hostmaster', 'root', 'abuse', 'noc', 'security',
  'admin', 'administrator', 'helpdesk', 'mailer-daemon', 'mailerdaemon', 'daemon',
  'system', 'sysadmin', 'network', 'dns', 'server', 'ssl', 'cert', 'whois',
  'contact-form', 'donotreply', 'do-not-reply', 'no-reply', 'noreply', 'bounce',
  'bounces', 'bouncing', 'bounced', 'mailer', 'notification', 'notifications',
  'alert', 'alerts', 'newsletter', 'newsletters', 'marketing-automation',
  'auto-confirm', 'autoconfirm', 'support-tickets', 'tickets', 'zendesk',
  'jira', 'gitlab', 'github', 'bitbucket', 'tracking', 'spam', 'bulk',
  'unsubscribe', 'optout', 'automatic', 'reply-to', 'null', 'devnull'
]);

const JUNK_USER_PATTERNS = [
  /^image\d+/i,
  /^part\d+/i,
  /^attachment\d+/i,
  /^frame\d+/i,
  /^thumb\d+/i,
  /^clip\d+/i,
  /^img\d+/i,
  /^file\d+/i,
  /^document\d+/i,
  /^scan\d+/i
];

/**
 * Validates whether an email is a legitimate commercial/business email
 * or falls into excluded non-business categories (Bank, Gov, Edu, News, Webmaster/Bot, Public Webmail).
 */
export function classifyBusinessEmail(
  email: string, 
  options: BusinessFilterOptions = DEFAULT_BUSINESS_FILTER_OPTIONS
): BusinessFilterResult {
  const trimmed = (email || '').trim();
  if (!trimmed || !trimmed.includes('@')) {
    return { isBusiness: false, category: 'invalid', reason: 'Invalid email syntax' };
  }

  const [rawUser, rawDomain] = trimmed.toLowerCase().split('@');
  if (!rawUser || !rawDomain || !rawDomain.includes('.')) {
    return { isBusiness: false, category: 'invalid', reason: 'Incomplete domain' };
  }

  const user = rawUser.trim();
  const domain = rawDomain.trim();

  // 1. Webmaster, Technical & Bot Filter
  if (options.filterWebmasterBot !== false) {
    if (FORBIDDEN_USERNAMES.has(user)) {
      return { 
        isBusiness: false, 
        category: 'webmaster_bot', 
        reason: 'Technical or automated mailbox', 
        matchedRule: `Username "${user}"` 
      };
    }

    if (
      user.includes('noreply') || 
      user.includes('no-reply') || 
      user.includes('donotreply') || 
      user.includes('newsletter') ||
      user.includes('bounce') ||
      user.startsWith('daemon')
    ) {
      return { 
        isBusiness: false, 
        category: 'webmaster_bot', 
        reason: 'Automated notification mailbox', 
        matchedRule: `Contains automated marker "${user}"` 
      };
    }

    // Check junk / file attachments / UUIDs
    const isJunkPattern = JUNK_USER_PATTERNS.some(re => re.test(user));
    const hasFileExt = /\.(gif|jpg|jpeg|png|bmp|svg|pdf|doc|docx|zip|rar|exe|dll|bin|ico|webp)$/i.test(user);
    const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(user);
    const numDigits = (user.match(/\d/g) || []).length;
    const isOverlyNumeric = user.length > 8 && (numDigits / user.length) > 0.7;

    if (isJunkPattern || hasFileExt || isUUID || isOverlyNumeric) {
      return { 
        isBusiness: false, 
        category: 'webmaster_bot', 
        reason: 'Machine-generated / attachment / scrap artifact', 
        matchedRule: `Artifact pattern` 
      };
    }
  }

  // 2. Government & Military Filter
  if (options.filterGovernment !== false) {
    const isGovTLD = GOV_TLD_SUBSTRINGS.some(tld => domain.endsWith(tld) || domain.includes(tld));
    if (isGovTLD) {
      return { 
        isBusiness: false, 
        category: 'government', 
        reason: 'Government or military agency domain', 
        matchedRule: 'Gov TLD' 
      };
    }

    const isGovKeyword = GOV_KEYWORDS.some(kw => domain.includes(kw));
    if (isGovKeyword) {
      return { 
        isBusiness: false, 
        category: 'government', 
        reason: 'Government organization keyword', 
        matchedRule: 'Gov domain keyword' 
      };
    }
  }

  // 3. Education & Academic Filter
  if (options.filterEducation !== false) {
    const isEduTLD = EDU_TLD_SUBSTRINGS.some(tld => domain.endsWith(tld) || domain.includes(tld));
    if (isEduTLD) {
      return { 
        isBusiness: false, 
        category: 'education', 
        reason: 'Educational or academic institution domain', 
        matchedRule: 'Edu TLD' 
      };
    }

    const isEduKeyword = EDU_KEYWORDS.some(kw => domain.includes(kw) || user.includes(kw));
    if (isEduKeyword) {
      return { 
        isBusiness: false, 
        category: 'education', 
        reason: 'Academic institution keyword', 
        matchedRule: 'Edu keyword' 
      };
    }
  }

  // 4. Bank & Financial Institutions Filter
  if (options.filterBank !== false) {
    if (EXACT_BANK_DOMAINS.has(domain)) {
      return { 
        isBusiness: false, 
        category: 'bank', 
        reason: 'Banking or financial service institution', 
        matchedRule: `Financial domain ${domain}` 
      };
    }

    const isBankKeyword = BANK_KEYWORDS.some(kw => domain.includes(kw));
    if (isBankKeyword) {
      return { 
        isBusiness: false, 
        category: 'bank', 
        reason: 'Bank or financial institution keyword', 
        matchedRule: `Bank keyword in ${domain}` 
      };
    }
  }

  // 5. News & Media Outlets Filter
  if (options.filterNews !== false) {
    if (NEWS_DOMAINS.has(domain)) {
      return { 
        isBusiness: false, 
        category: 'news', 
        reason: 'News or media outlet domain', 
        matchedRule: `News publication ${domain}` 
      };
    }

    if (NEWS_USERNAMES.has(user)) {
      return { 
        isBusiness: false, 
        category: 'news', 
        reason: 'Press/media desk mailbox', 
        matchedRule: `Press mailbox "${user}@"` 
      };
    }

    const isNewsDomainKeyword = NEWS_DOMAIN_KEYWORDS.some(kw => domain.includes(kw));
    if (isNewsDomainKeyword) {
      return { 
        isBusiness: false, 
        category: 'news', 
        reason: 'News, media, or press agency', 
        matchedRule: `Media keyword in ${domain}` 
      };
    }
  }

  // 6. Public Webmail Filter (Optional)
  if (options.filterPublicWebmail === true) {
    if (isPublicDomain(domain)) {
      return { 
        isBusiness: false, 
        category: 'public_webmail', 
        reason: 'Free consumer webmail provider (Gmail/Yahoo/etc.)', 
        matchedRule: `Public domain ${domain}` 
      };
    }
  }

  // Passed all filters -> Genuine business email
  return { 
    isBusiness: true, 
    category: 'business' 
  };
}

export interface BusinessBatchFilterSummary {
  businessEmails: string[];
  excludedEmails: {
    email: string;
    category: NonBusinessCategory | 'invalid';
    reason?: string;
  }[];
  counts: {
    total: number;
    business: number;
    bank: number;
    government: number;
    education: number;
    news: number;
    webmaster_bot: number;
    public_webmail: number;
    invalid: number;
  };
}

/**
 * Filters a list of emails in bulk, separating business contacts from non-relevant emails.
 */
export function filterBusinessEmailsBulk(
  emails: string[], 
  options: BusinessFilterOptions = DEFAULT_BUSINESS_FILTER_OPTIONS
): BusinessBatchFilterSummary {
  const businessEmails: string[] = [];
  const excludedEmails: BusinessBatchFilterSummary['excludedEmails'] = [];

  const counts = {
    total: emails.length,
    business: 0,
    bank: 0,
    government: 0,
    education: 0,
    news: 0,
    webmaster_bot: 0,
    public_webmail: 0,
    invalid: 0
  };

  emails.forEach(email => {
    const res = classifyBusinessEmail(email, options);
    if (res.isBusiness) {
      businessEmails.push(email);
      counts.business++;
    } else {
      excludedEmails.push({
        email,
        category: res.category as NonBusinessCategory | 'invalid',
        reason: res.reason
      });
      if (res.category in counts) {
        (counts as any)[res.category]++;
      }
    }
  });

  return {
    businessEmails,
    excludedEmails,
    counts
  };
}
