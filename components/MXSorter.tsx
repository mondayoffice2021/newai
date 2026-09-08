import React, { useState, useRef } from 'react';
import DocumentArrowUpIcon from './icons/DocumentArrowUpIcon';
import FolderOpenIcon from './icons/FolderOpenIcon';
import ArrowPathIcon from './icons/ArrowPathIcon';
import ArrowsRightLeftIcon from './icons/ArrowsRightLeftIcon';
import PauseIcon from './icons/PauseIcon';
import PlayIcon from './icons/PlayIcon';
import StopIcon from './icons/StopIcon';
import JSZip from 'jszip';
import { useActiveWakeLock } from '../hooks/useWakeLock';

interface MXSorterProps {
  showToast: (msg: string) => void;
}

interface MXGroup {
  provider: string;
  emails: string[];
}

const MX_PATTERNS: { [key: string]: string[] } = {
  'Google Workspace': ['google.com', 'googlemail.com', 'aspmx.l.google.com'],
  'Microsoft 365': ['outlook.com', 'protection.outlook.com', 'hotmail.com', 'microsoft.com'],
  'Zoho Mail': ['zoho.com', 'zoho.eu', 'zoho.in'],
  'Mimecast': ['mimecast.com'],
  'Proofpoint': ['pphosted.com', 'ppe-hosted.com'],
  'GoDaddy': ['secureserver.net'],
  'Namecheap': ['registrar-servers.com', 'oxcs.net'],
  'Fastmail': ['fastmail.com'],
  'Yandex': ['yandex.net', 'yandex.com'],
  'Amazon SES': ['amazonses.com'],
  'Rackspace': ['emailsrvr.com']
};

const MXSorter: React.FC<MXSorterProps> = ({ showToast }) => {
  const [inputText, setInputText] = useState('');
  const [results, setResults] = useState<MXGroup[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isPaused, setIsPaused] = useState(false);

  // Keep screen awake while resolving MX DNS queries and sorting
  useActiveWakeLock(isProcessing, 'MX Sorter: Resolving DNS Records');
  const [progress, setProgress] = useState<{ current: number; total: number } | null>(null);
  const [statusText, setStatusText] = useState('Idle');
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const controlRef = useRef({ shouldStop: false, isPaused: false });
  const domainCache = useRef<Map<string, string>>(new Map());

  const fetchMX = async (domain: string): Promise<string> => {
    if (domainCache.current.has(domain)) return domainCache.current.get(domain)!;

    try {
      const response = await fetch(`https://dns.google/resolve?name=${domain}&type=MX`);
      // Cast response JSON to any to avoid 'unknown' issues in certain TS environments.
      const data = await response.json() as any;
      
      if (!data.Answer || data.Answer.length === 0) {
        domainCache.current.set(domain, 'Private/Other');
        return 'Private/Other';
      }

      // Answer format usually is "10 mx.host.com"
      const mxRecords: string[] = data.Answer.map((ans: any) => ans.data.toLowerCase());
      
      let detectedProvider = 'Private/Other';

      for (const [provider, patterns] of Object.entries(MX_PATTERNS)) {
        if (mxRecords.some(rec => patterns.some(p => rec.includes(p)))) {
          detectedProvider = provider;
          break;
        }
      }

      domainCache.current.set(domain, detectedProvider);
      return detectedProvider;
    } catch (e) {
      return 'Error/Unknown';
    }
  };

  const processEmails = async () => {
    if (!inputText.trim()) {
      showToast("Please enter emails to sort.");
      return;
    }

    const rawEmails: string[] = inputText.split(/[\s,;]+/).map(e => e.trim()).filter(e => e.includes('@'));
    const uniqueEmails: string[] = Array.from(new Set(rawEmails));

    if (uniqueEmails.length === 0) {
      showToast("No valid emails found.");
      return;
    }

    setIsProcessing(true);
    setIsPaused(false);
    controlRef.current = { shouldStop: false, isPaused: false };
    setResults([]);
    
    const domainMap = new Map<string, string[]>();
    // Fixed: Explicitly type email to resolve 'unknown' split error.
    uniqueEmails.forEach((email: string) => {
      const domain = email.split('@')[1].toLowerCase();
      if (!domainMap.has(domain)) domainMap.set(domain, []);
      domainMap.get(domain)!.push(email);
    });

    const domains: string[] = Array.from(domainMap.keys());
    const total = domains.length;
    const providerMap = new Map<string, string[]>();
    
    // Process in small parallel batches to avoid browser hanging
    const BATCH_SIZE = 10;
    
    for (let i = 0; i < domains.length; i += BATCH_SIZE) {
      if (controlRef.current.shouldStop) break;
      while (controlRef.current.isPaused) {
        await new Promise(r => setTimeout(r, 200));
        if (controlRef.current.shouldStop) break;
      }

      const batch = domains.slice(i, i + BATCH_SIZE);
      setProgress({ current: i, total });
      setStatusText(`Querying DNS for ${batch.length} domains...`);

      // Fixed: Explicitly type domain to avoid 'unknown' assignability issues.
      const batchPromises = batch.map(async (domain: string) => {
        const provider = await fetchMX(domain);
        const emails = domainMap.get(domain)!;
        if (!providerMap.has(provider)) providerMap.set(provider, []);
        providerMap.get(provider)!.push(...emails);
      });

      await Promise.all(batchPromises);

      // Partial UI Update
      setResults(Array.from(providerMap.entries()).map(([provider, emails]) => ({
        provider,
        emails
      })).sort((a, b) => b.emails.length - a.emails.length));
    }

    setProgress({ current: total, total });
    setIsProcessing(false);
    setStatusText('Complete');
    showToast(`Sorted ${uniqueEmails.length} emails by MX provider.`);
  };

  const handleExportZip = async () => {
    const zip = new JSZip();
    const folder = zip.folder("MX_Sorted_Emails");
    if (!folder) return;

    results.forEach(group => {
      const safeName = group.provider.replace(/[^a-z0-9]/gi, '_');
      folder.file(`${safeName}.txt`, group.emails.join('\n'));
    });

    const blob = await zip.generateAsync({ type: "blob" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = "MX_Sorted_Emails.zip";
    link.click();
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 h-full">
      <div className="lg:col-span-4 flex flex-col h-full space-y-4">
        <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700 rounded-xl shadow-2xl p-6 flex-grow flex flex-col">
          <div className="mb-4">
            <h2 className="text-2xl font-bold text-white flex items-center gap-2">
              <ArrowsRightLeftIcon className="w-6 h-6 text-blue-400" />
              MX Provider Sorter
            </h2>
            <p className="text-gray-400 text-sm mt-2">
              Identify if companies use Google, Microsoft, or private servers via DNS lookup.
            </p>
          </div>

          <textarea
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder="Paste emails to check MX records..."
            className="flex-grow w-full p-4 bg-gray-900/50 border border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 resize-none text-sm font-mono text-gray-300 custom-scrollbar mb-4"
            disabled={isProcessing}
          />

          <div className="flex gap-3">
            {isProcessing ? (
              <>
                <button
                  onClick={() => { setIsPaused(!isPaused); controlRef.current.isPaused = !isPaused; }}
                  className="px-4 py-2 bg-yellow-600 hover:bg-yellow-700 text-white rounded-lg text-sm font-bold flex-1 flex items-center justify-center"
                >
                  {isPaused ? <PlayIcon className="w-4 h-4 mr-2" /> : <PauseIcon className="w-4 h-4 mr-2" />}
                  {isPaused ? 'Resume' : 'Pause'}
                </button>
                <button
                  onClick={() => controlRef.current.shouldStop = true}
                  className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm font-bold flex-1 flex items-center justify-center"
                >
                  <StopIcon className="w-4 h-4 mr-2" /> Stop
                </button>
              </>
            ) : (
              <button
                onClick={processEmails}
                disabled={!inputText.trim()}
                className="w-full py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold shadow-lg disabled:opacity-50"
              >
                Start MX Analysis
              </button>
            )}
          </div>

          {isProcessing && progress && (
            <div className="mt-4">
              <div className="flex justify-between text-xs text-blue-300 mb-1">
                <span>{statusText}</span>
                <span>{Math.round((progress.current / progress.total) * 100)}%</span>
              </div>
              <div className="w-full bg-gray-700 rounded-full h-1.5">
                <div 
                  className="bg-blue-500 h-1.5 rounded-full transition-all"
                  style={{ width: `${(progress.current / progress.total) * 100}%` }}
                />
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="lg:col-span-8 flex flex-col h-full">
        <div className="bg-gray-800/40 backdrop-blur-md border border-gray-700 rounded-xl shadow-2xl flex flex-col h-[80vh]">
          <div className="p-5 border-b border-gray-700/50 bg-gray-800/30 flex justify-between items-center">
            <h2 className="text-xl font-bold text-white">MX Categories</h2>
            {results.length > 0 && (
              <button onClick={handleExportZip} className="flex items-center px-3 py-1.5 bg-green-600 hover:bg-green-700 text-white rounded text-xs font-bold transition-all">
                <FolderOpenIcon className="w-4 h-4 mr-2" /> Export ZIP
              </button>
            )}
          </div>
          <div className="flex-grow overflow-y-auto p-4 custom-scrollbar bg-gray-900/20">
            {results.length === 0 && !isProcessing ? (
              <div className="flex flex-col items-center justify-center h-full text-gray-500">
                <ArrowPathIcon className="w-12 h-12 mb-3 opacity-20" />
                <p>Run analysis to see provider groups</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {results.map((group) => (
                  <div key={group.provider} className="bg-gray-800/50 border border-gray-700 rounded-lg p-4">
                    <div className="flex justify-between items-center mb-2">
                       <span className="text-sm font-bold text-white">{group.provider}</span>
                       <span className="text-xs text-gray-400 bg-gray-900 px-2 py-0.5 rounded-full">{group.emails.length}</span>
                    </div>
                    <div className="h-32 overflow-y-auto font-mono text-[10px] text-gray-400 bg-gray-900/50 p-2 rounded custom-scrollbar">
                      {group.emails.map((e, idx) => <div key={idx} className="truncate">{e}</div>)}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default MXSorter;