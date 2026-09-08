export interface ExtractedEmail {
  email: string;
  sourceUrl: string;
  companyName?: string;
  country?: string;
  isValid?: boolean;
}

export interface CompanyIntel {
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
  emails: string[];
}

export interface IndustryGroupIntel {
  industry: string;
  emails: string[];
  companies: CompanyIntel[];
}
