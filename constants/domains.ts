export const PUBLIC_DOMAINS = new Set([
  'gmail.com', 'googlemail.com', 'yahoo.com', 'hotmail.com', 'outlook.com', 'live.com', 'msn.com',
  'aol.com', 'icloud.com', 'me.com', 'protonmail.com', 'zoho.com', 'yandex.com', 'mail.com', 'gmx.com',
  'mail.ru', 'rambler.ru', 'list.ru', 'bk.ru', 'inbox.ru', 't-online.de', 'web.de', 'freenet.de',
  'libero.it', 'virgilio.it', 'alice.it', 'wanadoo.fr', 'orange.fr', 'free.fr', 'laposte.net',
  'comcast.net', 'sbcglobal.net', 'verizon.net', 'att.net', 'bellsouth.net', 'cox.net', 'charter.net',
  'shaw.ca', 'rogers.com', 'sympatico.ca', 'telus.net',
  'btinternet.com', 'virginmedia.com', 'sky.com', 'talktalk.net',
  'amazon.com', 'amazon.co.uk', 'amazon.de', 'amazon.fr', 'amazon.it', 'amazon.es', 'amazon.in', 'amazon.ca'
]);

/**
 * Checks if a domain is a public/consumer domain, including subdomains.
 */
export const isPublicDomain = (domain: string): boolean => {
  const d = domain.toLowerCase();
  if (PUBLIC_DOMAINS.has(d)) return true;
  
  // Check if it's a subdomain of a public domain (e.g., mail.gmail.com)
  for (const publicDomain of PUBLIC_DOMAINS) {
    if (d.endsWith('.' + publicDomain)) return true;
  }
  
  return false;
};
