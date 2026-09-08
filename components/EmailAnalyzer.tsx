
import React, { useState, useRef } from 'react';
import { identifyIndustriesForDomains } from '../services/geminiService';
import { classifyIndustryOffline } from '../services/offlineClassifier';
import { extractEmailsFromFile } from '../services/fileService';
import DocumentArrowUpIcon from './icons/DocumentArrowUpIcon';
import ArrowPathIcon from './icons/ArrowPathIcon';
import FolderOpenIcon from './icons/FolderOpenIcon';
import PauseIcon from './icons/PauseIcon';
import PlayIcon from './icons/PlayIcon';
import StopIcon from './icons/StopIcon';
import BriefcaseIcon from './icons/BriefcaseIcon';
import BuildingOfficeIcon from './icons/BuildingOfficeIcon';
import Cog6ToothIcon from './icons/Cog6ToothIcon';
import ShieldCheckIcon from './icons/ShieldCheckIcon';
import GlobeAltIcon from './icons/GlobeAltIcon';
import SparklesIcon from './icons/SparklesIcon';
import LightbulbIcon from './icons/LightbulbIcon';
import ListBulletIcon from './icons/ListBulletIcon';
import FunnelIcon from './icons/FunnelIcon';
import ToggleSwitch from './ToggleSwitch';
import JSZip from 'jszip';
import { isPublicDomain } from '../constants/domains';
import { useActiveWakeLock } from '../hooks/useWakeLock';

interface EmailAnalyzerProps {
  showToast: (msg: string) => void;
}

interface AnalyzedGroup {
  industry: string;
  emails: string[];
}

const EmailAnalyzer: React.FC<EmailAnalyzerProps> = ({ showToast }) => {
  const [inputText, setInputText] = useState('');
  const [analyzedResults, setAnalyzedResults] = useState<AnalyzedGroup[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isPaused, setIsPaused] = useState(false);

  // Keep screen awake while industry batch analysis is executing
  useActiveWakeLock(isProcessing, 'Industry Analyzer: Categorizing Companies');
  const [progress, setProgress] = useState<{ current: number; total: number } | null>(null);
  const [statusText, setStatusText] = useState<string>('Initializing...');
  const [ignoredCount, setIgnoredCount] = useState<number>(0);
  const [largeFileMode, setLargeFileMode] = useState(false);
  const [useOfflineMode, setUseOfflineMode] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const rawFileContent = useRef<string | null>(null);
  const controlRef = useRef({ shouldStop: false, isPaused: false });

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setIsProcessing(true);
      setStatusText("Reading file...");
      try {
        const emails = await extractEmailsFromFile(file);
        if (emails.length === 0) {
          showToast("No emails found in the file.");
        } else {
          const isLarge = file.size > 1024 * 1024 || emails.length > 5000;
          setLargeFileMode(isLarge);

          if (isLarge) {
              rawFileContent.current = emails.join('\n');
              setInputText(`[LARGE FILE LOADED]\nName: ${file.name}\nEmails found: ${emails.length}\nSize: ${(file.size / 1024 / 1024).toFixed(2)} MB\n\nContent hidden for performance. Ready to analyze.`);
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
        setStatusText("Idle");
        if (fileInputRef.current) fileInputRef.current.value = '';
      }
    }
  };

  const downloadBlob = (blob: Blob, filename: string) => {
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleExportGroup = (group: AnalyzedGroup) => {
    const dateStr = new Date().toISOString().split('T')[0];
    const safeIndustry = group.industry.replace(/[^a-z0-9]/gi, '_');
    const filename = `${safeIndustry}_${dateStr}.txt`;
    const content = group.emails.join('\n');
    
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8;' });
    downloadBlob(blob, filename);
  };

  const handleExportZip = async () => {
    if (analyzedResults.length === 0) return;
    
    try {
        const zip = new JSZip();
        const dateStr = new Date().toISOString().split('T')[0];
        const folderName = `Industry_Analyzed_${dateStr}`;
        const folder = zip.folder(folderName);

        if (!folder) {
            showToast("Failed to create zip folder.");
            return;
        }

        analyzedResults.forEach(group => {
            const safeIndustry = group.industry.replace(/[^a-z0-9]/gi, '_');
            const filename = `${safeIndustry}_${dateStr}.txt`;
            const content = group.emails.join('\n');
            folder.file(filename, content);
        });

        const content = await zip.generateAsync({ type: "blob" });
        downloadBlob(content, `${folderName}.zip`);
        showToast("Downloaded all files as ZIP.");

    } catch (e) {
        console.error("Zip generation failed", e);
        showToast("Failed to generate ZIP file.");
    }
  };

  const handleStop = () => {
    controlRef.current.shouldStop = true;
    controlRef.current.isPaused = false;
    setIsPaused(false);
    showToast("Stopping process...");
  };

  const handlePauseToggle = () => {
    const nextState = !isPaused;
    setIsPaused(nextState);
    controlRef.current.isPaused = nextState;
  };

  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      if (largeFileMode) {
          setLargeFileMode(false);
          rawFileContent.current = null;
      }
      setInputText(e.target.value);
  };

  // Robust Retry with wider error catching
  const processBatchWithRetry = async <T,>(
      fn: () => Promise<T>,
      retries = 4,
      delayMs = 3000
  ): Promise<T | null> => {
      try {
          return await fn();
      } catch (error: any) {
          const msg = (error?.message || '').toLowerCase() + ' ' + JSON.stringify(error || '').toLowerCase();
          console.warn("API Error:", msg);

          const isRateLimit = msg.includes('429') || msg.includes('quota') || msg.includes('rate_limit') || msg.includes('exhausted') || msg.includes('resource_exhausted') || msg.includes('limit');
          const isServerError = msg.includes('500') || msg.includes('503') || msg.includes('unavailable') || msg.includes('server error');

          if (retries > 0 && (isRateLimit || isServerError)) {
              const waitTime = isRateLimit ? Math.max(delayMs * 3.5, 8000) : delayMs;

              setStatusText(isRateLimit 
                ? `Quota limit reached (429). cooling down for ${Math.round(waitTime/1000)}s... Enable 'Offline Mode' or add your API key in settings if this persists.` 
                : `Temporary server issue. Retrying in ${Math.round(waitTime/1000)}s...`
              );
              
              await new Promise(res => setTimeout(res, waitTime));
              return processBatchWithRetry(fn, retries - 1, waitTime * 1.5);
          }
          console.error("Batch processing failed finally", error);
          return null;
      }
  };

  const processEmails = async () => {
    const contentToProcess = largeFileMode && rawFileContent.current ? rawFileContent.current : inputText;

    if (!contentToProcess.trim()) {
      showToast("Please enter emails to analyze.");
      return;
    }

    controlRef.current = { shouldStop: false, isPaused: false };
    setIsPaused(false);
    setIsProcessing(true);
    setAnalyzedResults([]);
    setIgnoredCount(0);
    setStatusText('Filtering public emails...');
    
    try {
      // 1. Parse & Filter
      const rawEmails = contentToProcess.split(/[\s,;]+/).map(e => e.trim()).filter(e => e.includes('@'));
      
      const uniqueEmails = new Set<string>();
      let publicCount = 0;
      
      rawEmails.forEach(email => {
          const domain = email.split('@')[1].toLowerCase();
          if (isPublicDomain(domain)) {
              publicCount++;
          } else {
              uniqueEmails.add(email);
          }
      });
      
      setIgnoredCount(publicCount);

      if (uniqueEmails.size === 0) {
        showToast(`No business emails found. Ignored ${publicCount} public emails.`);
        setIsProcessing(false);
        return;
      }

      // Group by domain
      const domainMap = new Map<string, string[]>();
      uniqueEmails.forEach((email) => {
        const domain = email.split('@')[1].toLowerCase();
        if (!domainMap.has(domain)) {
          domainMap.set(domain, []);
        }
        domainMap.get(domain)?.push(email);
      });

      const allDomains = Array.from(domainMap.keys());
      const totalDomains = allDomains.length;

      let currentResultsMap = new Map<string, string[]>(); 

      // --- STEP 1: Pre-classify industry offline (Extremely Fast) ---
      setStatusText('Pre-classifying domains offline...');
      const unresolvedDomains: string[] = [];

      allDomains.forEach(domain => {
          const offlineIndustry = classifyIndustryOffline(domain);
          if (offlineIndustry) {
              const emailsForDomain = domainMap.get(domain) || [];
              if (!currentResultsMap.has(offlineIndustry)) {
                  currentResultsMap.set(offlineIndustry, []);
              }
              currentResultsMap.get(offlineIndustry)?.push(...emailsForDomain);
          } else {
              unresolvedDomains.push(domain);
          }
      });

      // Update UI with initial offline-analyzed results immediately
      const initialResults: AnalyzedGroup[] = Array.from(currentResultsMap.entries())
          .map(([industry, emails]) => ({ industry, emails }))
          .sort((a, b) => b.emails.length - a.emails.length);
      setAnalyzedResults(initialResults);

      if (unresolvedDomains.length === 0 || useOfflineMode) {
          // If there are no unresolved domains, or offline mode is forced, resolve all remaining as 'Other' instantly!
          if (unresolvedDomains.length > 0) {
              unresolvedDomains.forEach(domain => {
                  const emailsForDomain = domainMap.get(domain) || [];
                  if (!currentResultsMap.has('Other')) {
                      currentResultsMap.set('Other', []);
                  }
                  currentResultsMap.get('Other')?.push(...emailsForDomain);
              });

              const finalOfflineResults: AnalyzedGroup[] = Array.from(currentResultsMap.entries())
                  .map(([industry, emails]) => ({ industry, emails }))
                  .sort((a, b) => b.emails.length - a.emails.length);
              setAnalyzedResults(finalOfflineResults);
          }
          showToast(`Offline analysis complete! Processed ${uniqueEmails.size} emails instantly.`);
          setIsProcessing(false);
          setStatusText('Idle');
          return;
      }

      // --- STEP 2: Secondary Domain Resolution (Only for remaining unknown domains) ---
      const BATCH_SIZE = 50;
      const totalUnresolved = unresolvedDomains.length;

      // 2. Batch Process
      for (let i = 0; i < totalUnresolved; i += BATCH_SIZE) {
        
        if (controlRef.current.shouldStop) break;

        while (controlRef.current.isPaused) {
          await new Promise(resolve => setTimeout(resolve, 300));
          if (controlRef.current.shouldStop) break;
        }
        if (controlRef.current.shouldStop) break;

        const batch = unresolvedDomains.slice(i, i + BATCH_SIZE);
        setProgress({ current: Math.min(i + BATCH_SIZE, totalUnresolved), total: totalUnresolved });
        setStatusText(`Analyzing batch ${Math.ceil((i + 1) / BATCH_SIZE)} of unresolved domains (Industries)...`);
        
        const batchResults = new Map<string, string>();

        const identified = await processBatchWithRetry(() => identifyIndustriesForDomains(batch));
        if (identified) {
            identified.forEach(item => {
                if (item.industry) {
                    batchResults.set(item.domain.toLowerCase(), item.industry);
                }
            });
        }

        // Merge Results
        batch.forEach(domain => {
            const industry = batchResults.get(domain) || 'Other';
            const emails = domainMap.get(domain) || [];
            
            if (!currentResultsMap.has(industry)) {
                currentResultsMap.set(industry, []);
            }
            currentResultsMap.get(industry)?.push(...emails);
        });

        const partialResults: AnalyzedGroup[] = Array.from(currentResultsMap.entries())
            .map(([industry, emails]) => ({ industry, emails }))
            .sort((a, b) => b.emails.length - a.emails.length);

        setAnalyzedResults(partialResults);
      }

      if (controlRef.current.shouldStop) {
        showToast("Processing stopped by user.");
      } else {
        showToast(`Analysis complete! Processed ${uniqueEmails.size} emails.`);
      }

    } catch (error: any) {
      showToast("An error occurred during analysis.");
      console.error(error);
    } finally {
      setIsProcessing(false);
      setIsPaused(false);
      setProgress(null);
      setStatusText('Idle');
      controlRef.current.shouldStop = false;
      controlRef.current.isPaused = false;
    }
  };

   const getIndustryIcon = (industry: string) => {
      const iconClass = "w-4 h-4";
      switch (industry) {
         case 'Technology':
         case 'Manufacturing':
            return <Cog6ToothIcon className={`${iconClass} text-blue-400`} />;
         case 'Healthcare':
         case 'Education':
         case 'Energy':
            return <LightbulbIcon className={`${iconClass} text-yellow-400`} />;
         case 'Finance':
         case 'Legal':
            return <ShieldCheckIcon className={`${iconClass} text-emerald-400`} />;
         case 'E-commerce':
            return <ListBulletIcon className={`${iconClass} text-pink-400`} />;
         case 'Real Estate':
         case 'Construction':
            return <BuildingOfficeIcon className={`${iconClass} text-orange-400`} />;
         case 'Travel':
         case 'Logistics':
            return <GlobeAltIcon className={`${iconClass} text-cyan-400`} />;
         case 'Marketing':
         case 'Consulting':
            return <BriefcaseIcon className={`${iconClass} text-purple-400`} />;
         case 'Media':
            return <SparklesIcon className={`${iconClass} text-indigo-400`} />;
         case 'Agriculture':
            return <FunnelIcon className={`${iconClass} text-green-400`} />;
         default:
            return <BriefcaseIcon className={`${iconClass} text-gray-400`} />;
      }
   };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 h-full">
      {/* LEFT PANEL */}
      <div className="lg:col-span-4 flex flex-col h-full space-y-4">
        <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700 rounded-xl shadow-2xl p-6 flex-grow flex flex-col">
          <div className="mb-2">
            <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                <BriefcaseIcon className="w-6 h-6 text-purple-400" />
                Industry Analyzer
            </h2>
            <div className="mb-4 mt-4">
               <ToggleSwitch 
                  label="Instant Keyword Classification" 
                  enabled={useOfflineMode} 
                  onChange={setUseOfflineMode} 
                  disabled={isProcessing}
               />
               <p className="text-gray-400 text-xs mt-1">
                  {useOfflineMode 
                     ? "Uses domain keywords (e.g. 'clinic' -> Healthcare, 'steel' -> Manufacturing). Instant speed." 
                     : "Comprehensive heuristic classification across 15+ industry sectors."}
               </p>
            </div>
            <p className="text-gray-400 text-sm mt-1">
                Paste mixed emails. Filters out public webmail and sorts corporate domains by industry.
            </p>
          </div>
          
          <textarea
            value={inputText}
            onChange={handleTextChange}
            placeholder="ceo@techstartup.io&#10;sales@factory.com&#10;john.doe@gmail.com (will be removed)"
            className={`flex-grow w-full p-4 bg-gray-900/50 border border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none text-sm font-mono text-gray-300 custom-scrollbar mb-4 ${largeFileMode ? 'opacity-70' : ''}`}
            disabled={isProcessing || largeFileMode}
            readOnly={largeFileMode}
          />
          
          <div className="flex gap-3">
             {isProcessing ? (
                 <>
                    <button
                        onClick={handlePauseToggle}
                        className={`px-4 py-2 rounded-lg text-sm font-bold transition-all flex-1 shadow-lg flex items-center justify-center border ${
                            isPaused 
                            ? 'bg-green-600 hover:bg-green-700 text-white border-green-500' 
                            : 'bg-yellow-600 hover:bg-yellow-700 text-white border-yellow-500'
                        }`}
                    >
                        {isPaused ? <><PlayIcon className="w-4 h-4 mr-2" /> Resume</> : <><PauseIcon className="w-4 h-4 mr-2" /> Pause</>}
                    </button>
                    <button
                        onClick={handleStop}
                        className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm font-bold transition-all flex-1 shadow-lg flex items-center justify-center border border-red-500"
                    >
                        <StopIcon className="w-4 h-4 mr-2" /> Stop
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
                        className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-sm font-bold transition-all flex-1 shadow-lg shadow-purple-900/20 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                    Analyze List
                    </button>
                 </>
             )}
          </div>
          
          {ignoredCount > 0 && !isProcessing && (
              <div className="mt-3 p-2 bg-yellow-900/20 border border-yellow-700/30 rounded text-xs text-yellow-300 text-center">
                  Removed {ignoredCount} public email addresses.
              </div>
          )}

          {isProcessing && progress && (
            <div className={`mt-4 bg-gray-700/30 rounded-lg p-3 border border-gray-700 transition-opacity ${isPaused ? 'opacity-70' : 'opacity-100'}`}>
               <div className="flex justify-between text-xs text-purple-300 mb-1">
                 <span>{isPaused ? 'Paused' : statusText}</span>
                 <span>{Math.round((progress.current / progress.total) * 100)}%</span>
               </div>
               <div className="w-full bg-gray-700 rounded-full h-2">
                 <div 
                    className={`h-2 rounded-full transition-all duration-500 ${isPaused ? 'bg-yellow-500' : 'bg-purple-500'}`}
                    style={{ width: `${(progress.current / progress.total) * 100}%` }}
                 ></div>
               </div>
            </div>
          )}
        </div>
      </div>

      {/* RIGHT PANEL: RESULTS */}
      <div className="lg:col-span-8 flex flex-col h-full">
         <div className="bg-gray-800/40 backdrop-blur-md border border-gray-700 rounded-xl shadow-2xl flex flex-col h-[80vh]">
            <div className="p-5 border-b border-gray-700/50 bg-gray-800/30 flex justify-between items-center">
               <div>
                  <h2 className="text-xl font-bold text-white">Industry Breakdown</h2>
                  <p className="text-xs text-gray-400 mt-1">
                     {analyzedResults.length > 0 
                        ? `${analyzedResults.reduce((acc, g) => acc + g.emails.length, 0)} emails categorized into ${analyzedResults.length} sectors` 
                        : "Results will appear here"}
                  </p>
               </div>
               {analyzedResults.length > 0 && (
                   <button 
                      onClick={handleExportZip}
                      className="flex items-center px-3 py-2 text-xs font-bold uppercase tracking-wider rounded-md bg-green-600/80 hover:bg-green-600 text-white transition-all duration-200 shadow-lg"
                   >
                      <FolderOpenIcon className="w-4 h-4 mr-1.5" /> Export All (ZIP)
                   </button>
               )}
            </div>

            <div className="flex-grow overflow-y-auto p-4 custom-scrollbar space-y-4 bg-gray-900/20">
               {analyzedResults.length === 0 && !isProcessing ? (
                  <div className="flex flex-col items-center justify-center h-full text-gray-500 opacity-60">
                     <BriefcaseIcon className="w-12 h-12 mb-3" />
                     <p>Load emails to analyze their industries</p>
                  </div>
               ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                     {analyzedResults.map((group) => (
                        <div key={group.industry} className="bg-gray-800/50 border border-gray-700 rounded-lg p-4 hover:border-gray-600 transition-colors animate-fade-in">
                           <div className="flex justify-between items-start mb-3">
                              <div className="flex items-center">
                                 <div className="bg-gray-900/50 p-1.5 rounded mr-3">
                                     {getIndustryIcon(group.industry)}
                                 </div>
                                 <div>
                                    <h3 className="font-bold text-white text-sm">{group.industry}</h3>
                                    <span className="text-xs text-gray-400">{group.emails.length} emails</span>
                                 </div>
                              </div>
                              <button 
                                 onClick={() => handleExportGroup(group)}
                                 title="Download List (.txt)"
                                 className="flex items-center gap-1 px-2 py-1 text-xs font-medium bg-gray-700 hover:bg-purple-600 text-gray-300 hover:text-white rounded transition-all"
                              >
                                 <DocumentArrowUpIcon className="w-3 h-3" /> Export
                              </button>
                           </div>
                           <div className="bg-gray-900/50 rounded p-2 max-h-48 overflow-y-auto custom-scrollbar">
                              {group.emails.map((email, idx) => (
                                 <div key={`${email}-${idx}`} className="text-xs text-gray-300 font-mono py-0.5 truncate border-b border-gray-800 last:border-0">
                                    {email}
                                 </div>
                              ))}
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

export default EmailAnalyzer;
