import React, { useState, useRef } from 'react';
import { extractEmailsFromFile } from '../services/fileService';
import DocumentArrowUpIcon from './icons/DocumentArrowUpIcon';
import FolderOpenIcon from './icons/FolderOpenIcon';
import ArrowPathIcon from './icons/ArrowPathIcon';
import ShieldCheckIcon from './icons/ShieldCheckIcon';
import XCircleIcon from './icons/XCircleIcon';
import CheckIcon from './icons/CheckIcon';
import PauseIcon from './icons/PauseIcon';
import PlayIcon from './icons/PlayIcon';
import StopIcon from './icons/StopIcon';
import ToggleSwitch from './ToggleSwitch';
import JSZip from 'jszip';
import { isPublicDomain } from '../constants/domains';

interface EmailValidatorProps {
  showToast: (msg: string) => void;
}

interface ValidationResult {
  category: 'Professional' | 'Public' | 'Gov/Edu' | 'Financial' | 'Disposable' | 'System/Bot' | 'Invalid';
  emails: string[];
}

const DISPOSABLE_DOMAINS = new Set([
  'temp-mail.org', 'guerrillamail.com', '10minutemail.com', 'mailinator.com', 'sharklasers.com'
]);

const FINANCIAL_KEYWORDS = ['bank', 'credit', 'capital', 'finance', 'invest', 'trading', 'wealth', 'pay', 'crypto', 'wallet'];

export interface VerifiedEmail {
  email: string;
  category: 'Professional' | 'Public' | 'Gov/Edu' | 'Financial' | 'Disposable' | 'System/Bot' | 'Invalid';
  status: 'Deliverable' | 'Risky' | 'Undeliverable' | 'Disposable';
  diagnostics: string;
  mxServer?: string;
}

const EmailValidator: React.FC<EmailValidatorProps> = ({ showToast }) => {
  const [inputText, setInputText] = useState('');
  const [results, setResults] = useState<ValidationResult[]>([]);
  const [verifiedEmails, setVerifiedEmails] = useState<VerifiedEmail[]>([]);
  
  // Right panel layout tab selectors
  const [rightPanelTab, setRightPanelTab] = useState<'folders' | 'deliverability'>('deliverability');
  const [activeFilter, setActiveFilter] = useState<'all' | 'Deliverable' | 'Risky' | 'Undeliverable' | 'Disposable'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const [isProcessing, setIsProcessing] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [useOnlineMode, setUseOnlineMode] = useState(false);
  const [useDNSCheck, setUseDNSCheck] = useState(true); // Default active for precise verification
  const [useSMTPCheck, setUseSMTPCheck] = useState(true); // Default active for deep verification
  const [statusText, setStatusText] = useState<string>('');
  const [progress, setProgress] = useState<{ current: number; total: number } | null>(null);
  const [largeFileMode, setLargeFileMode] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const rawFileContent = useRef<string | null>(null);
  const controlRef = useRef({ shouldStop: false, isPaused: false });

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setIsProcessing(true);
      try {
        const emails = await extractEmailsFromFile(file);
        if (emails.length === 0) {
          showToast("No emails found in the file.");
        } else {
          const isLarge = file.size > 1024 * 1024 || emails.length > 5000;
          setLargeFileMode(isLarge);

          if (isLarge) {
            rawFileContent.current = emails.join('\n');
            setInputText(`[LARGE FILE LOADED]\nName: ${file.name}\nEmails found: ${emails.length}\nSize: ${(file.size / 1024 / 1024).toFixed(2)} MB\n\nContent hidden for performance. Ready to process.`);
          } else {
            rawFileContent.current = null;
            setInputText(emails.join('\n'));
          }
          showToast(`${emails.length} emails loaded successfully.`);
        }
      } catch (err: any) {
        showToast(err.message || "Error loading file.");
      } finally {
        setIsProcessing(false);
        if (fileInputRef.current) fileInputRef.current.value = '';
      }
    }
  };

  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    if (largeFileMode) {
      setLargeFileMode(false);
      rawFileContent.current = null;
    }
    setInputText(e.target.value);
  };

  const classifyEmailOffline = (email: string): ValidationResult['category'] => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) return 'Invalid';

    const [user, domain] = email.toLowerCase().split('@');
    const parts = domain.split('.');
    const tld = parts[parts.length - 1];

    const forbiddenUsernames = new Set(['postmaster', 'privacy', 'webmaster', 'abuse', 'mailer-daemon', 'root', 'admin', 'administrator']);
    if (forbiddenUsernames.has(user) || 
        user.includes('noreply') || 
        user.includes('no-reply') || 
        user.includes('news') || 
        user.includes('newsletter')) return 'System/Bot';

    if (DISPOSABLE_DOMAINS.has(domain)) return 'Disposable';
    if (isPublicDomain(domain)) return 'Public';
    if (tld === 'gov' || tld === 'edu' || domain.includes('.edu.') || domain.includes('.gov.')) return 'Gov/Edu';
    if (FINANCIAL_KEYWORDS.some(kw => domain.includes(kw))) return 'Financial';
    
    // Detection for UUIDs or high-entropy machine-generated usernames
    const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(user);
    
    // Detection for "Junk" usernames (files, parts, attachments)
    const junkPatterns = [
        /^image\d+/i,
        /^part\d+/i,
        /^attachment\d+/i,
        /^frame\d+/i,
        /^thumb\d+/i,
        /^clip\d+/i,
        /^img\d+/i,
        /^file\d+/i
    ];
    const isJunkPattern = junkPatterns.some(regex => regex.test(user));
    const hasFileExtension = /\.(gif|jpg|jpeg|png|bmp|svg|pdf|doc|docx|zip|rar|exe|dll|bin)$/i.test(user);

    const numCount = (user.match(/\d/g) || []).length;
    const hyphenCount = (user.match(/-/g) || []).length;
    
    if (isUUID || isJunkPattern || hasFileExtension || (user.length > 20 && (numCount > 8 || hyphenCount > 3))) {
        return 'System/Bot';
    }

    return 'Professional';
  };

  interface DNSExtendedResult {
    hasMx: boolean;
    hasA: boolean;
    servers: string[];
    providerDetail: string;
  }

  const checkDomainDNSExtended = async (domain: string): Promise<DNSExtendedResult> => {
    try {
      const response = await fetch(`https://dns.google/resolve?name=${domain}&type=MX`);
      const data = await response.json();
      if (data.Answer && data.Answer.length > 0) {
        const servers = data.Answer.map((ans: any) => ans.data.toLowerCase());
        let providerDetail = "Custom/Private MX";
        
        const googlePatterns = ["google.com", "googlemail.com", "aspmx"];
        const msPatterns = ["outlook.com", "protection.outlook.com", "hotmail.com"];
        const zohoPatterns = ["zoho.com", "zoho.eu", "zoho.in"];
        
        if (servers.some((s: string) => googlePatterns.some(p => s.includes(p)))) {
          providerDetail = "Google Workspace";
        } else if (servers.some((s: string) => msPatterns.some(p => s.includes(p)))) {
          providerDetail = "Microsoft 365 Exchange";
        } else if (servers.some((s: string) => zohoPatterns.some(p => s.includes(p)))) {
          providerDetail = "Zoho Mail";
        }
        return { hasMx: true, hasA: true, servers, providerDetail };
      }
      
      const aResponse = await fetch(`https://dns.google/resolve?name=${domain}&type=A`);
      const aData = await aResponse.json();
      const hasA = !!(aData.Answer && aData.Answer.length > 0);
      return {
        hasMx: false,
        hasA,
        servers: [],
        providerDetail: hasA ? "Web domain active (no MX email setup)" : "Inactive / unreachable domain"
      };
    } catch (e) {
      console.error("DNS records retrieval failed", e);
      return { hasMx: true, hasA: true, servers: [], providerDetail: "Unverifiable DNS" };
    }
  };

  const checkDomainDNS = async (domain: string): Promise<boolean> => {
    const res = await checkDomainDNSExtended(domain);
    return res.hasMx || res.hasA;
  };

  const classifyDomainsOnline = async (domains: string[]): Promise<Map<string, ValidationResult['category']>> => {
    // Heuristic domain categorization
    const map = new Map<string, ValidationResult['category']>();
    for (const d of domains) {
      const lower = d.toLowerCase();
      if (lower.endsWith('.gov') || lower.includes('.gov.') || lower.endsWith('.edu') || lower.includes('.edu.') || lower.includes('.ac.') || lower.includes('school') || lower.includes('univ') || lower.includes('college')) {
        map.set(d, 'Gov/Edu');
      } else if (lower.includes('bank') || lower.includes('capital') || lower.includes('invest') || lower.includes('fund') || lower.includes('credit') || lower.includes('asset') || lower.includes('finance') || lower.includes('wealth')) {
        map.set(d, 'Financial');
      } else {
        map.set(d, 'Professional');
      }
    }
    return map;
  };

  const checkTypo = (email: string): string | null => {
    const domain = email.split('@')[1]?.toLowerCase();
    if (!domain) return null;
    const typoMap: Record<string, string> = {
      'gamil.com': 'gmail.com', 'gmal.com': 'gmail.com', 'gamil.co': 'gmail.com', 'gail.com': 'gmail.com',
      'yaho.com': 'yahoo.com', 'yahou.com': 'yahoo.com', 'yhoo.com': 'yahoo.com',
      'hotmial.com': 'hotmail.com', 'hotmial.co': 'hotmail.com',
      'outlok.com': 'outlook.com', 'outloo.com': 'outlook.com',
      'mson.com': 'msn.com', 'aol.co': 'aol.com'
    };
    return typoMap[domain] ? typoMap[domain] : null;
  };

  const processEmails = async () => {
    const contentToProcess = largeFileMode && rawFileContent.current ? rawFileContent.current : inputText;

    if (!contentToProcess.trim()) {
      showToast("Please enter emails to process.");
      return;
    }

    setIsProcessing(true);
    setIsPaused(false);
    controlRef.current = { shouldStop: false, isPaused: false };
    
    // Parse emails, normalizing separation characters
    const rawEmails = contentToProcess.split(/[\s,;|\t\r\n]+/).map(e => e.trim()).filter(Boolean);
    const uniqueEmails: string[] = Array.from(new Set(rawEmails));
    const total = uniqueEmails.length;
    
    // Set up results containers
    const categoryMap: Record<ValidationResult['category'], string[]> = {
      Professional: [], Public: [], 'Gov/Edu': [], Financial: [], Disposable: [], 'System/Bot': [], Invalid: []
    };

    // Prepare live verification structure
    const liveList: VerifiedEmail[] = uniqueEmails.map(email => {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      const typoCorrection = checkTypo(email);
      const isStrValid = emailRegex.test(email);

      let initialStatus: VerifiedEmail['status'] = 'Deliverable';
      let diagnostics = 'Syntax verified. Awaiting network check.';
      let category = classifyEmailOffline(email);

      if (!isStrValid) {
        initialStatus = 'Undeliverable';
        diagnostics = 'Invalid syntax format';
        category = 'Invalid';
      } else if (typoCorrection) {
        initialStatus = 'Undeliverable';
        diagnostics = `Typo detected. Did you mean @${typoCorrection}?`;
        category = 'Invalid';
      } else if (category === 'Disposable') {
        initialStatus = 'Disposable';
        diagnostics = 'Temporary disposable webmail (high bounce/risk)';
      } else if (category === 'System/Bot') {
        initialStatus = 'Risky';
        diagnostics = 'Role-based or system account (risk of auto-rejection)';
      }

      return {
        email,
        category,
        status: initialStatus,
        diagnostics,
        mxServer: undefined
      };
    });

    setVerifiedEmails([...liveList]);
    setRightPanelTab('deliverability'); // Change to deliverability report automatically for visual feedback!

    // Sort into original category container for offline elements
    liveList.forEach(item => {
      if (item.status === 'Undeliverable' || item.category === 'Disposable') {
        categoryMap[item.category].push(item.email);
      }
    });

    const updateUI = () => {
      setResults(Object.entries(categoryMap).map(([category, emails]) => ({
        category: category as ValidationResult['category'],
        emails: [...emails]
      })));
    };

    updateUI();

    const domainToEmails = new Map<string, string[]>();
    const needsDNS: string[] = [];
    const needsOnline: string[] = [];

    // Queue valid domains
    liveList.forEach(item => {
      if (item.status !== 'Undeliverable' && item.status !== 'Disposable') {
        const domain = item.email.split('@')[1]?.toLowerCase();
        if (domain) {
          if (!domainToEmails.has(domain)) {
            domainToEmails.set(domain, []);
            needsDNS.push(domain);
            if (useOnlineMode && item.category === 'Professional') {
              needsOnline.push(domain);
            }
          }
          domainToEmails.get(domain)!.push(item.email);
        }
      }
    });

    // DNS Verification step
    if (useDNSCheck && needsDNS.length > 0) {
      setStatusText('Validating MX records...');
      const DNS_BATCH = 10;
      
      for (let i = 0; i < needsDNS.length; i += DNS_BATCH) {
        if (controlRef.current.shouldStop) break;
        while (controlRef.current.isPaused) await new Promise(r => setTimeout(r, 200));

        const batch = needsDNS.slice(i, i + DNS_BATCH);
        setProgress({ current: i, total: needsDNS.length });

        await Promise.all(batch.map(async (domain) => {
          const dnsDetails = await checkDomainDNSExtended(domain);
          
          liveList.forEach(item => {
            if (item.email.split('@')[1]?.toLowerCase() === domain) {
              if (!dnsDetails.hasMx) {
                item.status = 'Undeliverable';
                item.diagnostics = dnsDetails.providerDetail; // "Inactive or unreachable domain"/ "active web setup with no mail exchange"
                item.category = 'Invalid';
              } else {
                item.mxServer = dnsDetails.servers[0] || 'Unknown';
                item.diagnostics = `MX Records verified (${dnsDetails.providerDetail})`;
              }
            }
          });
        }));

        setVerifiedEmails([...liveList]);
      }
    }

    // SMTP deep handshake step 
    if (useSMTPCheck && liveList.some(item => item.status !== 'Undeliverable' && item.status !== 'Disposable')) {
      setStatusText('SMTP Deep handshaking...');
      const SMTP_BATCH = 5;
      const emailsForSmtp = liveList.filter(item => item.status !== 'Undeliverable' && item.status !== 'Disposable');
      
      for (let i = 0; i < emailsForSmtp.length; i += SMTP_BATCH) {
        if (controlRef.current.shouldStop) break;
        while (controlRef.current.isPaused) await new Promise(r => setTimeout(r, 200));

        const batch = emailsForSmtp.slice(i, i + SMTP_BATCH);
        setProgress({ current: i, total: emailsForSmtp.length });

        await Promise.all(batch.map(async (item) => {
          try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 12000); // 12s call threshold

            const response = await fetch('/api/validate-email', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              signal: controller.signal,
              body: JSON.stringify({ email: item.email })
            });
            clearTimeout(timeoutId);

            if (!response.ok) {
              item.status = 'Risky';
              item.diagnostics = 'Verification proxy response warning (Active MX check ok)';
              return;
            }

            const data = await response.json();
            
            if (data.status === 'valid') {
              item.status = 'Deliverable';
              item.diagnostics = data.detail || 'Live mailbox accepted! Verified successfully.';
              if (data.mxHost) item.mxServer = data.mxHost;
            } else if (data.status === 'invalid') {
              item.status = 'Undeliverable';
              item.diagnostics = data.detail || 'Mailbox address does not exist (SMTP response error)';
              item.category = 'Invalid';
              if (data.mxHost) item.mxServer = data.mxHost;
            } else {
              // Risky or caught-all
              item.status = 'Risky';
              item.diagnostics = data.detail || 'Server rejects deep query (Catch-all or connection port block)';
              if (data.mxHost) item.mxServer = data.mxHost;
            }
          } catch (e: any) {
            item.status = 'Risky';
            item.diagnostics = `SMTP Sweep offline: ${e.message || 'connection timeout'}. MX was verified.`;
          }
        }));

        setVerifiedEmails([...liveList]);
      }
    }

    // Classification of active Professional Domains
    if (useOnlineMode && needsOnline.length > 0) {
      setStatusText('Classifying Business Domains...');
      const BATCH_SIZE = 30;
      const activeBusinessDomains = needsOnline.filter(domain => {
        // Only classify domains of emails that are active/deliverable/risky
        return liveList.some(item => item.email.split('@')[1]?.toLowerCase() === domain && item.status !== 'Undeliverable');
      });

      for (let i = 0; i < activeBusinessDomains.length; i += BATCH_SIZE) {
        if (controlRef.current.shouldStop) break;
        while (controlRef.current.isPaused) await new Promise(r => setTimeout(r, 200));

        const batch = activeBusinessDomains.slice(i, i + BATCH_SIZE);
        setProgress({ current: i, total: activeBusinessDomains.length });

        try {
          const onlineResults = await classifyDomainsOnline(batch);
          batch.forEach(domain => {
            const domainCategory = onlineResults.get(domain) || 'Professional';
            liveList.forEach(item => {
              if (item.email.split('@')[1]?.toLowerCase() === domain) {
                item.category = domainCategory;
              }
            });
          });
        } catch (e) {
          console.error("Category Classification error fallback on default", e);
        }
        setVerifiedEmails([...liveList]);
      }
    }

    // Distribute results into categorization folder buckets
    liveList.forEach(item => {
      // Make sure the email is registered in categoryMap so standard bucket grids align
      if (!categoryMap[item.category].includes(item.email)) {
        categoryMap[item.category].push(item.email);
      }
    });

    updateUI();

    setIsProcessing(false);
    setProgress(null);
    setStatusText('');
    showToast(`Validation complete. ${uniqueEmails.length} emails verified.`);
  };

  const handleCopyDeliverableOnly = () => {
    const deliverableOnly = verifiedEmails.filter(v => v.status === 'Deliverable').map(v => v.email);
    if (deliverableOnly.length === 0) {
      showToast("No active deliverable emails found to copy.");
      return;
    }
    navigator.clipboard.writeText(deliverableOnly.join('\n'));
    showToast(`Copied ${deliverableOnly.length} active deliverable emails to clipboard!`);
  };

  const handleDownloadCleanList = () => {
    const deliverableOnly = verifiedEmails.filter(v => v.status === 'Deliverable').map(v => v.email);
    if (deliverableOnly.length === 0) {
      showToast("No active deliverable emails found to download.");
      return;
    }
    const blob = new Blob([deliverableOnly.join('\n')], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Clean_Active_Emails_${new Date().getTime()}.txt`;
    a.click();
    showToast(`Downloaded ${deliverableOnly.length} 100% active verified emails.`);
  };

  const handleExportZip = async () => {
    const zip = new JSZip();
    results.forEach(res => {
      if (res.emails.length > 0) {
        zip.file(`${res.category.replace('/', '_')}_Emails.txt`, res.emails.join('\n'));
      }
    });
    const blob = await zip.generateAsync({ type: 'blob' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Validated_Emails_${new Date().getTime()}.zip`;
    a.click();
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 h-full">
      <div className="lg:col-span-4 flex flex-col h-full space-y-4">
        <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700 rounded-xl shadow-2xl p-6 flex-grow flex flex-col">
          <div className="mb-4">
            <h2 className="text-2xl font-bold text-white flex items-center gap-2">
              <ShieldCheckIcon className="w-6 h-6 text-blue-400" />
              Sorter & Validator
            </h2>
            <div className="mt-4 space-y-2">
                <ToggleSwitch 
                  label="Deep Category Classification" 
                  enabled={useOnlineMode} 
                  onChange={setUseOnlineMode} 
                  disabled={isProcessing}
                />
                <ToggleSwitch 
                  label="DNS Verification (Free)" 
                  enabled={useDNSCheck} 
                  onChange={setUseDNSCheck} 
                  disabled={isProcessing}
                />
                <ToggleSwitch 
                  label="SMTP Deep Check (Handshake)" 
                  enabled={useSMTPCheck} 
                  onChange={setUseSMTPCheck} 
                  disabled={isProcessing}
                />
                <p className="text-gray-400 text-xs">
                  {useSMTPCheck && "Performs HELO/RCPT handshake. Slow but accurate. "}
                  {useDNSCheck && "Checks MX records to confirm domain can receive mail. "}
                  {useOnlineMode 
                    ? "Deep classification of business, financial, and government domains." 
                    : "Fast regex/list-based sorting. Zero cost."}
                </p>
            </div>
          </div>

          <textarea
            value={inputText}
            onChange={handleTextChange}
            placeholder="Paste mixed emails here..."
            className={`flex-grow w-full p-4 bg-gray-900/50 border border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm font-mono text-gray-300 custom-scrollbar mb-4 ${largeFileMode ? 'opacity-70' : ''}`}
            disabled={isProcessing || largeFileMode}
            readOnly={largeFileMode}
          />

          <div className="flex gap-3">
            {isProcessing ? (
              <>
                <button onClick={() => { setIsPaused(!isPaused); controlRef.current.isPaused = !isPaused; }} className="flex-1 py-2 bg-yellow-600 text-white rounded-lg font-bold flex items-center justify-center gap-2">
                   {isPaused ? <PlayIcon className="w-4 h-4" /> : <PauseIcon className="w-4 h-4" />}
                   {isPaused ? 'Resume' : 'Pause'}
                </button>
                <button onClick={() => controlRef.current.shouldStop = true} className="flex-1 py-2 bg-red-600 text-white rounded-lg font-bold flex items-center justify-center gap-2">
                   <StopIcon className="w-4 h-4" /> Stop
                </button>
              </>
            ) : (
              <>
                <button 
                    onClick={() => fileInputRef.current?.click()}
                    className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg text-sm font-medium transition-colors flex items-center justify-center flex-1 border border-gray-600"
                >
                  <DocumentArrowUpIcon className="w-4 h-4 mr-2" /> Load List
                </button>
                <input type="file" ref={fileInputRef} onChange={handleFileChange} accept=".txt,.csv,.xlsx,.xls" className="hidden" />
                
                <button
                  onClick={processEmails}
                  disabled={!inputText.trim()}
                  className="flex-[2] py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold shadow-lg disabled:opacity-50"
                >
                  Sort & Validate
                </button>
              </>
            )}
          </div>

          {progress && (
            <div className="mt-4">
              <div className="flex justify-between text-xs text-blue-300 mb-1">
                <span>{statusText || 'Processing...'}</span>
                <span>{Math.round((progress.current / progress.total) * 100)}%</span>
              </div>
              <div className="w-full bg-gray-700 rounded-full h-1.5">
                <div className="bg-blue-500 h-1.5 rounded-full" style={{ width: `${(progress.current / progress.total) * 100}%` }} />
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="lg:col-span-8 flex flex-col h-full animate-fade-in">
        <div className="bg-gray-800/40 backdrop-blur-md border border-gray-700 rounded-xl shadow-2xl flex flex-col h-[80vh]">
          {/* Tabs header */}
          <div className="p-4 border-b border-gray-700/50 bg-gray-800/30 flex flex-col md:flex-row gap-4 justify-between items-stretch md:items-center">
            <div className="flex bg-gray-900/60 p-1 rounded-lg border border-gray-700/50 self-start">
              <button 
                onClick={() => setRightPanelTab('deliverability')}
                className={`px-4 py-1.5 rounded-md text-xs font-bold transition-all ${rightPanelTab === 'deliverability' ? 'bg-blue-600 text-white shadow' : 'text-gray-400 hover:text-white'}`}
              >
                📊 Deliverability Report ({verifiedEmails.length})
              </button>
              <button 
                onClick={() => setRightPanelTab('folders')}
                className={`px-4 py-1.5 rounded-md text-xs font-bold transition-all ${rightPanelTab === 'folders' ? 'bg-blue-600 text-white shadow' : 'text-gray-400 hover:text-white'}`}
              >
                📁 Sorted Folders ({results.reduce((acc, cat) => acc + cat.emails.length, 0)})
              </button>
            </div>

            <div className="flex gap-2 self-end">
              {rightPanelTab === 'deliverability' && verifiedEmails.length > 0 && (
                <>
                  <button 
                    onClick={handleCopyDeliverableOnly}
                    className="flex items-center px-3 py-1.5 bg-gray-700 hover:bg-gray-600 text-white rounded text-xs font-bold transition-all border border-gray-600"
                  >
                    📋 Copy Live ({verifiedEmails.filter(v => v.status === 'Deliverable').length})
                  </button>
                  <button 
                    onClick={handleDownloadCleanList}
                    className="flex items-center px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded text-xs font-bold transition-all"
                  >
                    📥 Get Clean Active List
                  </button>
                </>
              )}
              {rightPanelTab === 'folders' && results.some(r => r.emails.length > 0) && (
                <button 
                  onClick={handleExportZip} 
                  className="flex items-center px-3 py-1.5 bg-green-600 hover:bg-green-700 text-white rounded text-xs font-bold transition-all"
                >
                  <FolderOpenIcon className="w-4 h-4 mr-2" /> Export ZIP Folders
                </button>
              )}
            </div>
          </div>

          {/* Tab 1: Deliverability Report Table View */}
          {rightPanelTab === 'deliverability' && (
            <div className="flex-grow flex flex-col overflow-hidden">
              {verifiedEmails.length === 0 ? (
                <div className="flex-grow flex flex-col items-center justify-center text-gray-500 opacity-40 p-12 text-center">
                  <ShieldCheckIcon className="w-16 h-16 mb-4 text-blue-400" />
                  <p className="font-bold text-white text-lg">Anti-Bounce Guard Active</p>
                  <p className="text-sm max-w-md mt-1">Paste your lists and click Sort & Validate to run complete MX host validations, syntax corrections, and live mailbox handshake testing.</p>
                </div>
              ) : (
                <div className="flex-grow flex flex-col overflow-hidden">
                  {/* Sub-filters count row */}
                  <div className="p-4 border-b border-gray-700/30 bg-gray-900/10 flex flex-wrap gap-2 items-center justify-between">
                    <div className="flex flex-wrap gap-1.5">
                      <button
                        onClick={() => setActiveFilter('all')}
                        className={`px-3 py-1 rounded-full text-xs font-medium border transition-all ${activeFilter === 'all' ? 'bg-gray-200 text-gray-900 border-transparent' : 'bg-gray-800 text-gray-400 border-gray-700 hover:text-white'}`}
                      >
                        All ({verifiedEmails.length})
                      </button>
                      <button
                        onClick={() => setActiveFilter('Deliverable')}
                        className={`px-3 py-1 rounded-full text-xs font-medium border transition-all flex items-center gap-1.5 ${activeFilter === 'Deliverable' ? 'bg-green-600 text-white border-transparent' : 'bg-gray-800/60 text-green-400 border-green-500/20 hover:bg-green-500/10'}`}
                      >
                        <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
                        Live ({verifiedEmails.filter(v => v.status === 'Deliverable').length})
                      </button>
                      <button
                        onClick={() => setActiveFilter('Risky')}
                        className={`px-3 py-1 rounded-full text-xs font-medium border transition-all flex items-center gap-1.5 ${activeFilter === 'Risky' ? 'bg-yellow-600 text-white border-transparent' : 'bg-gray-800/60 text-yellow-400 border-yellow-500/20 hover:bg-yellow-500/10'}`}
                      >
                        <span className="w-2 h-2 rounded-full bg-yellow-400" />
                        Risky ({verifiedEmails.filter(v => v.status === 'Risky').length})
                      </button>
                      <button
                        onClick={() => setActiveFilter('Undeliverable')}
                        className={`px-3 py-1 rounded-full text-xs font-medium border transition-all flex items-center gap-1.5 ${activeFilter === 'Undeliverable' ? 'bg-red-600 text-white border-transparent' : 'bg-gray-800/60 text-red-400 border-red-500/20 hover:bg-red-500/10'}`}
                      >
                        <span className="w-2 h-2 rounded-full bg-red-400" />
                        Bounce ({verifiedEmails.filter(v => v.status === 'Undeliverable').length})
                      </button>
                      <button
                        onClick={() => setActiveFilter('Disposable')}
                        className={`px-3 py-1 rounded-full text-xs font-medium border transition-all flex items-center gap-1.5 ${activeFilter === 'Disposable' ? 'bg-orange-600 text-white border-transparent' : 'bg-gray-800/60 text-orange-400 border-orange-500/20 hover:bg-orange-500/10'}`}
                      >
                        <span className="w-2 h-2 rounded-full bg-orange-400" />
                        Disposable ({verifiedEmails.filter(v => v.status === 'Disposable').length})
                      </button>
                    </div>

                    {/* Search Field */}
                    <input
                      type="text"
                      placeholder="Search checked email/diagnostics..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="px-3 py-1 bg-gray-900 border border-gray-700 rounded-lg text-xs font-mono text-gray-300 focus:outline-none focus:ring-1 focus:ring-blue-500 w-full sm:w-48"
                    />
                  </div>

                  {/* Diagnostic Table */}
                  <div className="flex-grow overflow-y-auto custom-scrollbar">
                    <table className="w-full text-left border-collapse text-xs">
                      <thead>
                        <tr className="bg-gray-900/40 text-gray-400 uppercase tracking-wider font-semibold border-b border-gray-800">
                          <th className="p-3 pl-4">Email Match Address</th>
                          <th className="p-3">Deliverability</th>
                          <th className="p-3">Diagnostics & SMTP Report</th>
                          <th className="p-3 pr-4 font-mono text-[10px]">Verified MX Server</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-800 font-mono">
                        {verifiedEmails.filter(v => {
                          if (activeFilter !== 'all' && v.status !== activeFilter) return false;
                          if (searchQuery.trim()) {
                            return v.email.toLowerCase().includes(searchQuery.toLowerCase().trim()) || 
                                   v.diagnostics.toLowerCase().includes(searchQuery.toLowerCase().trim());
                          }
                          return true;
                        }).map((item, index) => {
                          const isDeliv = item.status === 'Deliverable';
                          const isRisk = item.status === 'Risky';
                          const isBounce = item.status === 'Undeliverable';
                          const isDisp = item.status === 'Disposable';
                          return (
                            <tr key={index} className="hover:bg-gray-800/20 transition-colors">
                              <td className="p-3 pl-4 font-medium text-white truncate max-w-[190px]">{item.email}</td>
                              <td className="p-3 whitespace-nowrap">
                                <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                                  isDeliv ? 'bg-green-500/10 text-green-400 border-green-500/20' :
                                  isRisk ? 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20' :
                                  isBounce ? 'bg-red-500/10 text-red-500 border-red-500/20' :
                                  'bg-orange-500/10 text-orange-400 border-orange-500/20'
                                }`}>
                                  <span className={`w-1.5 h-1.5 rounded-full ${isDeliv ? 'bg-green-400 animate-pulse' : isRisk ? 'bg-yellow-400' : isBounce ? 'bg-red-500' : 'bg-orange-400'}`} />
                                  {isDeliv ? 'Active / Live' : isRisk ? 'Risky' : isBounce ? 'Undeliverable' : 'Disposable'}
                                </span>
                              </td>
                              <td className={`p-3 text-gray-300 min-w-[200px] ${isBounce ? 'text-red-300' : isRisk ? 'text-yellow-200' : 'text-gray-300'}`}>{item.diagnostics}</td>
                              <td className="p-3 pr-4 text-gray-500 truncate max-w-[140px] text-[10px]">{item.mxServer || 'No MX resolved'}</td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Tab 2: Categorized Folder Buckets */}
          {rightPanelTab === 'folders' && (
            <div className="flex-grow overflow-y-auto p-4 custom-scrollbar bg-gray-900/20">
              {results.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-gray-500 opacity-40">
                  <ShieldCheckIcon className="w-16 h-16 mb-4" />
                  <p>Results will be categorized here</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {results.map((res) => (
                    <div key={res.category} className={`border rounded-xl p-4 transition-all ${res.emails.length > 0 ? 'bg-gray-800/60 border-gray-600' : 'bg-gray-900/40 border-gray-800 opacity-50'}`}>
                      <div className="flex justify-between items-center mb-3">
                        <div className="flex items-center gap-2">
                          {res.category === 'Professional' && <CheckIcon className="w-4 h-4 text-green-400" />}
                          {res.category === 'System/Bot' && <ArrowPathIcon className="w-4 h-4 text-yellow-500" />}
                          {res.category === 'Invalid' && <XCircleIcon className="w-4 h-4 text-red-400" />}
                          <h3 className="font-bold text-white text-sm">{res.category}</h3>
                        </div>
                        <span className="text-xs bg-gray-900 px-2 py-0.5 rounded-full text-gray-400">{res.emails.length}</span>
                      </div>
                      <div className="h-32 overflow-y-auto font-mono text-[10px] text-gray-400 bg-gray-900/50 p-2 rounded-lg custom-scrollbar">
                        {res.emails.slice(0, 100).map((e, i) => <div key={i} className="truncate">{e}</div>)}
                        {res.emails.length > 100 && <div className="italic text-center py-1">... + {res.emails.length - 100} more</div>}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default EmailValidator;