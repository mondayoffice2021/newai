import React, { useState, useCallback, useRef, useEffect, useMemo } from 'react';
import type { ExtractedEmail } from './types';
import CountrySelector from './components/CountrySelector';
import ResultsDisplay from './components/ResultsDisplay';
import EmailSorter from './components/EmailSorter';
import EmailAnalyzer from './components/EmailAnalyzer';
import EmailValidator from './components/EmailValidator';
import SupplyChainExtractor from './components/SupplyChainExtractor';
import MXSorter from './components/MXSorter';
import SettingsModal from './components/SettingsModal';
import { FolderExtractor } from './components/FolderExtractor';
import { BulkUrlOpener } from './components/BulkUrlOpener';
import { findAndExtractEmails, suggestKeywords, generateDeepSearchPlan, analyzeCompanyFromEmail, setGlobalApiKey } from './services/geminiService';
import { buildDorkQuery, getCountryCcTLD, getSearchEngineUrl, SEARCH_ENGINES_LIST, EMAIL_PREFIX_OPTIONS, extractEmailsFromText } from './services/dorkHelper';
import { filterDuplicateCompanies } from './services/duplicateChecker';
import SparklesIcon from './components/icons/SparklesIcon';
import MagnifyingGlassIcon from './components/icons/MagnifyingGlassIcon';
import LinkIcon from './components/icons/LinkIcon';
import DocumentArrowUpIcon from './components/icons/DocumentArrowUpIcon';
import LightbulbIcon from './components/icons/LightbulbIcon';
import ToggleSwitch from './components/ToggleSwitch';
import XCircleIcon from './components/icons/XCircleIcon';
import BuildingOfficeIcon from './components/icons/BuildingOfficeIcon';
import FolderOpenIcon from './components/icons/FolderOpenIcon';
import ListBulletIcon from './components/icons/ListBulletIcon';
import Cog6ToothIcon from './components/icons/Cog6ToothIcon';
import BriefcaseIcon from './components/icons/BriefcaseIcon';
import ShieldCheckIcon from './components/icons/ShieldCheckIcon';
import ArrowsRightLeftIcon from './components/icons/ArrowsRightLeftIcon';
import GlobeAltIcon from './components/icons/GlobeAltIcon';
import CheckIcon from './components/icons/CheckIcon';
import ClipboardIcon from './components/icons/ClipboardIcon';


const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'extractor' | 'sorter' | 'analyzer' | 'validator' | 'mx-sorter' | 'supply-chain' | 'bulk-extractor' | 'bulk-url-opener'>('extractor');
  
  // Extractor State
  const [country, setCountry] = useState<string>('Germany');
  const [keywords, setKeywords] = useState<string>('steel manufacturer');
  const [sourceEmail, setSourceEmail] = useState<string>('');
  const [industry, setIndustry] = useState<string>('');
  const [companySize, setCompanySize] = useState<string>('');
  const [urls, setUrls] = useState<string>('');
  const [results, setResults] = useState<ExtractedEmail[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isSuggesting, setIsSuggesting] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [isDeepSearch, setIsDeepSearch] = useState<boolean>(false);
  const [verifyDomains, setVerifyDomains] = useState<boolean>(false);
  const [progressMessage, setProgressMessage] = useState<string | null>(null);

  // Search Engine & Dork Strategy State
  const [selectedEngine, setSelectedEngine] = useState<string>('google');
  const [emailPrefix, setEmailPrefix] = useState<string>('info@');
  const [extraDorkTerms, setExtraDorkTerms] = useState<string>('contact us sales export procurement');
  const [avoidDuplicateCompanies, setAvoidDuplicateCompanies] = useState<boolean>(true);

  // Snippet / Paste Modal State
  const [isPasteModalOpen, setIsPasteModalOpen] = useState<boolean>(false);
  const [pasteInputText, setPasteInputText] = useState<string>('');
  const [dorkCopied, setDorkCopied] = useState<boolean>(false);
  
  // Settings State
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const stopSearchRef = useRef(false);

  const [toast, setToast] = useState<{ message: string; visible: boolean }>({ message: '', visible: false });

  // Init API Key from storage
  useEffect(() => {
    const storedKey = localStorage.getItem('gemini_api_key');
    if (storedKey) {
      setGlobalApiKey(storedKey);
    }
  }, []);

  const handleSaveApiKey = (key: string) => {
    if (key) {
      localStorage.setItem('gemini_api_key', key);
      setGlobalApiKey(key);
      showToast("API Key updated successfully.");
    } else {
      localStorage.removeItem('gemini_api_key');
      setGlobalApiKey('');
      showToast("API Key cleared. Using default if available.");
    }
  };

  const showToast = (message: string) => {
    setToast({ message, visible: true });
    setTimeout(() => {
      setToast({ message: '', visible: false });
    }, 4000);
  };

  const handleStopSearch = () => {
    stopSearchRef.current = true;
  };

  // Dynamic Dork Query Construction
  const currentCcTLD = useMemo(() => getCountryCcTLD(country || 'Germany'), [country]);
  
  const currentDorkQuery = useMemo(() => {
    return buildDorkQuery(country || 'Germany', keywords || 'steel manufacturer', emailPrefix, extraDorkTerms);
  }, [country, keywords, emailPrefix, extraDorkTerms]);

  const handleCopyDork = useCallback(() => {
    navigator.clipboard.writeText(currentDorkQuery);
    setDorkCopied(true);
    setTimeout(() => setDorkCopied(false), 2000);
    showToast("Search query copied to clipboard!");
  }, [currentDorkQuery]);

  const handleLaunchEngine = useCallback((engineId: string = selectedEngine) => {
    if (engineId === 'all') {
      SEARCH_ENGINES_LIST.filter(e => e.id !== 'all').forEach(eng => {
        const url = getSearchEngineUrl(eng.id, currentDorkQuery);
        window.open(url, '_blank', 'noopener,noreferrer');
      });
      showToast("Opened all 6 search engines in separate tabs!");
    } else {
      const url = getSearchEngineUrl(engineId, currentDorkQuery);
      window.open(url, '_blank', 'noopener,noreferrer');
      const engineName = SEARCH_ENGINES_LIST.find(e => e.id === engineId)?.name || engineId.toUpperCase();
      showToast(`Launched ${engineName} search in new tab!`);
    }
  }, [selectedEngine, currentDorkQuery]);

  const handleApplyPreset = (presetCountry: string, presetKeyword: string, presetPrefix: string) => {
    setCountry(presetCountry);
    setKeywords(presetKeyword);
    setEmailPrefix(presetPrefix);
    showToast(`Loaded: ${presetCountry} - ${presetKeyword}`);
  };

  const handleDeduplicateCompanies = useCallback(() => {
    if (results.length === 0) return;
    const { unique, duplicateCompaniesCount } = filterDuplicateCompanies(results, [], true);
    if (duplicateCompaniesCount === 0) {
      showToast("Duplicate Checker: All companies in the list are already unique.");
    } else {
      setResults(unique);
      showToast(`Removed ${duplicateCompaniesCount} duplicate company records. Retained primary contacts.`);
    }
  }, [results]);

  const handleExtractPastedText = useCallback(() => {
    if (!pasteInputText.trim()) {
      showToast("Please paste text, search snippets, or HTML first.");
      return;
    }
    const extracted = extractEmailsFromText(pasteInputText, country || 'N/A');
    if (extracted.length === 0) {
      showToast("No email addresses found in the pasted content.");
      return;
    }

    const { unique, duplicateEmailsCount, duplicateCompaniesCount } = filterDuplicateCompanies(
      extracted,
      results,
      avoidDuplicateCompanies
    );

    setResults(prev => [...prev, ...unique]);
    setPasteInputText('');
    setIsPasteModalOpen(false);

    let msg = `Extracted ${unique.length} new business emails!`;
    if (avoidDuplicateCompanies && duplicateCompaniesCount > 0) {
      msg += ` (${duplicateCompaniesCount} duplicate companies avoided)`;
    }
    if (duplicateEmailsCount > 0) {
      msg += ` (${duplicateEmailsCount} duplicate emails skipped)`;
    }
    showToast(msg);
  }, [pasteInputText, country, results, avoidDuplicateCompanies]);

  const handleDorkDirectSearch = useCallback(async () => {
    if (isLoading) return;
    setError(null);
    setIsLoading(true);
    stopSearchRef.current = false;
    setProgressMessage(`Running web search for ${country || 'target'} companies...`);

    try {
      const res = await fetch('/api/dork-search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: currentDorkQuery,
          country: country || 'N/A'
        })
      });

      if (!res.ok) {
        throw new Error(`Search request returned status ${res.status}`);
      }

      const data = await res.json();
      const rawResults: ExtractedEmail[] = data.results || [];

      const { unique, duplicateEmailsCount, duplicateCompaniesCount } = filterDuplicateCompanies(
        rawResults,
        results,
        avoidDuplicateCompanies
      );

      setResults(prev => [...prev, ...unique]);

      let toastMessage = '';
      if (unique.length === 0) {
        toastMessage = rawResults.length > 0
          ? `Found ${rawResults.length} emails, but all were duplicates${avoidDuplicateCompanies ? ' or belong to existing companies' : ''}.`
          : "No emails found in web index results. Use 'Launch in Engine' to browse directly or paste HTML snippets.";
      } else {
        toastMessage = `Successfully extracted ${unique.length} new business emails!`;
        if (avoidDuplicateCompanies && duplicateCompaniesCount > 0) {
          toastMessage += ` (${duplicateCompaniesCount} duplicate companies avoided.)`;
        }
        if (duplicateEmailsCount > 0) {
          toastMessage += ` (${duplicateEmailsCount} duplicate emails skipped.)`;
        }
      }
      showToast(toastMessage);

    } catch (err: any) {
      setError(err.message || 'Direct search encountered an issue.');
      showToast("Direct search note: You can launch search engines directly or paste search results.");
    } finally {
      setIsLoading(false);
      setProgressMessage(null);
    }
  }, [isLoading, currentDorkQuery, country, results, avoidDuplicateCompanies]);

  const executeSearch = async (searchKeywords: string) => {
     try {
      if (isDeepSearch) {
        setProgressMessage("Phase 1: Generating deep search plan...");
        const searchPlan = await generateDeepSearchPlan(searchKeywords, country, industry);
        
        let totalNewEmails = 0;
        let totalDupCompanies = 0;

        for (let i = 0; i < searchPlan.length; i++) {
          if (stopSearchRef.current) {
            showToast("Deep search stopped by user.");
            break;
          }
          const subKeyword = searchPlan[i];
          setProgressMessage(`Phase 2 (${i + 1}/${searchPlan.length}): Searching for "${subKeyword}"...`);

          const extracted = await findAndExtractEmails(subKeyword, country, industry, companySize, '', verifyDomains);

          setResults(prevResults => {
            const { unique, duplicateCompaniesCount } = filterDuplicateCompanies(
              extracted,
              prevResults,
              avoidDuplicateCompanies
            );
            totalNewEmails += unique.length;
            totalDupCompanies += duplicateCompaniesCount;
            return [...prevResults, ...unique];
          });
        }
        showToast(`Deep search complete! Found ${totalNewEmails} new emails.${avoidDuplicateCompanies && totalDupCompanies > 0 ? ` (${totalDupCompanies} duplicate companies avoided)` : ''}`);

      } else {
        setProgressMessage("Searching for companies and extracting emails...");
        const extractedEmails = await findAndExtractEmails(searchKeywords, country, industry, companySize, urls, verifyDomains);
        
        const { unique, duplicateEmailsCount, duplicateCompaniesCount } = filterDuplicateCompanies(
          extractedEmails,
          results,
          avoidDuplicateCompanies
        );
        
        setResults(prevResults => [...prevResults, ...unique]);
        
        let toastMessage = '';
        if (unique.length === 0) {
          toastMessage = (duplicateEmailsCount > 0 || duplicateCompaniesCount > 0)
            ? `Found items, but ignored duplicates (${duplicateCompaniesCount} duplicate companies, ${duplicateEmailsCount} duplicate emails).` 
            : "No new emails found for the given criteria.";
        } else {
          toastMessage = `Successfully extracted ${unique.length} new emails!`;
          if (avoidDuplicateCompanies && duplicateCompaniesCount > 0) {
            toastMessage += ` (${duplicateCompaniesCount} duplicate companies avoided.)`;
          }
          if (duplicateEmailsCount > 0) {
            toastMessage += ` (${duplicateEmailsCount} duplicate emails skipped.)`;
          }
        }
        showToast(toastMessage);
      }
    } catch (e: any) {
      setError(e.message || 'An unknown error occurred.');
      showToast("An error occurred during extraction.");
    }
  }

  const handleExtract = useCallback(async () => {
    if (isLoading) return;
    setError(null);
    setIsLoading(true);
    stopSearchRef.current = false;
    
    try {
        await executeSearch(keywords);
    } finally {
        setIsLoading(false);
        setProgressMessage(null);
    }
  }, [keywords, country, industry, companySize, urls, isLoading, results, isDeepSearch, verifyDomains, avoidDuplicateCompanies]);

  const handleSimilarSearch = useCallback(async () => {
    if (isLoading || !sourceEmail) return;
    if (!country) {
        showToast("Please select a target country for the competitor search.");
        return;
    }

    setError(null);
    setIsLoading(true);
    stopSearchRef.current = false;

    try {
        setProgressMessage(`Analyzing company profile for ${sourceEmail}...`);
        const generatedQueries = await analyzeCompanyFromEmail(sourceEmail, country);
        
        if (generatedQueries.length > 0) {
            const newKeywords = generatedQueries.join('\n');
            setKeywords(newKeywords); // Update UI for visibility
            
            setProgressMessage("Company identified. Searching for similar businesses...");
            await executeSearch(newKeywords);
        } else {
            showToast("Could not identify similar companies. Please check the email.");
        }

    } catch (e: any) {
        setError(e.message || 'Failed to analyze email.');
        showToast("Error analyzing email.");
    } finally {
        setIsLoading(false);
        setProgressMessage(null);
    }

  }, [sourceEmail, country, isLoading, isDeepSearch, verifyDomains]);

  const handleClear = () => {
    setResults([]);
    setError(null);
    showToast("Results cleared.");
  };

  const handleSuggestKeywords = async () => {
    if (isSuggesting || !keywords.trim()) {
        showToast("Please enter some base keywords first.");
        return;
    };
    setIsSuggesting(true);
    try {
        const suggestions = await suggestKeywords(keywords);
        if (suggestions.length > 0) {
            const newKeywords = suggestions.join('\n');
            setKeywords(prev => `${prev}\n${newKeywords}`);
            showToast("New keyword suggestions added!");
        } else {
            showToast("Could not suggest new keywords at this time.");
        }
    } catch (e) {
        showToast("Failed to get keyword suggestions.");
    } finally {
        setIsSuggesting(false);
    }
  };
  
  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const text = e.target?.result as string;
        setKeywords(text);
        showToast("Keywords loaded from file.");
      };
      reader.readAsText(file);
    }
  };
  
  const isUrlMode = urls.trim().length > 0;
  const isKeywordMode = !isUrlMode && !sourceEmail;
  const isSimilarMode = !isUrlMode && !!sourceEmail && keywords.trim().length === 0; 

  const [validatorInitialEmails, setValidatorInitialEmails] = useState<string[]>([]);

  const handleSendToValidator = (customList?: string[]) => {
    const list = customList && customList.length > 0 ? customList : results.map(r => r.email).filter(Boolean);
    if (list.length === 0) {
      showToast("No extracted emails available to validate.");
      return;
    }
    const unique = Array.from(new Set(list));
    setValidatorInitialEmails(unique);
    setActiveTab('validator');
    showToast(`Transferred ${unique.length} extracted emails to Sorter & Validator!`);
  };

  const renderContent = () => {
      switch(activeTab) {
          case 'bulk-extractor':
              return <FolderExtractor showToast={showToast} onSendToValidator={handleSendToValidator} />;
          case 'sorter':
              return <EmailSorter showToast={showToast} />;
          case 'analyzer':
              return <EmailAnalyzer showToast={showToast} />;
          case 'validator':
              return (
                <EmailValidator 
                  showToast={showToast} 
                  initialEmails={validatorInitialEmails.length > 0 ? validatorInitialEmails : results.map(r => r.email).filter(Boolean)} 
                />
              );
          case 'mx-sorter':
              return <MXSorter showToast={showToast} />;
          case 'supply-chain':
              return <SupplyChainExtractor showToast={showToast} />;
          case 'bulk-url-opener':
              return <BulkUrlOpener showToast={showToast} />;
          default:
              return (
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                  {/* EXTRACTOR SIDEBAR */}
                  <div className="lg:col-span-4 bg-gray-800/50 backdrop-blur-sm border border-gray-700 rounded-xl shadow-2xl p-6 h-fit space-y-5">
                    <div className="flex items-center justify-between pb-3 border-b border-gray-700/60">
                      <div>
                        <h2 className="text-xl font-bold text-white flex items-center gap-2">
                          <MagnifyingGlassIcon className="w-5 h-5 text-blue-400" />
                          Targeted Extractor
                        </h2>
                        <p className="text-xs text-gray-400">Precision search syntax & duplicate prevention</p>
                      </div>
                      <span className="text-xs px-2.5 py-1 rounded-full font-mono font-bold bg-blue-900/60 text-blue-300 border border-blue-600/50">
                        site:{currentCcTLD}
                      </span>
                    </div>

                    {/* STATUS CARD */}
                    <div className="p-3.5 bg-emerald-950/30 border border-emerald-500/30 rounded-lg space-y-1.5">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-emerald-400 flex items-center gap-1.5">
                          <CheckIcon className="w-4 h-4" /> Native Engine (Unlimited)
                        </span>
                        <span className="text-[10px] px-2 py-0.5 rounded font-bold bg-emerald-900/60 text-emerald-300 border border-emerald-600/50">
                          Original Engine
                        </span>
                      </div>
                      <p className="text-xs text-gray-400 leading-relaxed">
                        Uses standardized precision dorks across 6 web engines (Google, Bing, Brave, DDG, Yahoo, Yandex) and authentic web crawlers. Zero rate limits or token quotas!
                      </p>
                    </div>

                    {/* DUPLICATE CHECKER TOGGLE */}
                    <div className="p-3.5 bg-gray-800/80 border border-gray-700 rounded-lg space-y-2">
                      <div className="flex items-center justify-between">
                        <ToggleSwitch 
                          label="Avoid Duplicate Companies"
                          enabled={avoidDuplicateCompanies}
                          onChange={setAvoidDuplicateCompanies}
                          disabled={isLoading}
                        />
                        <span className="text-xs px-2 py-0.5 rounded font-medium bg-emerald-900/40 text-emerald-300 border border-emerald-700/40">
                          {avoidDuplicateCompanies ? 'Deduplication Active' : 'All Contacts'}
                        </span>
                      </div>
                      <p className="text-xs text-gray-400 leading-relaxed">
                        Duplicate Checker prevents multiple contacts from the same corporate domain or organization name.
                      </p>
                    </div>

                    {/* TARGET COUNTRY */}
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label htmlFor="country" className="block text-sm font-medium text-gray-300">
                          Target Country (Required)
                        </label>
                        <span className="text-xs text-gray-400 font-mono">
                          ccTLD: <strong className="text-blue-400">.{currentCcTLD}</strong>
                        </span>
                      </div>
                      <CountrySelector selectedCountry={country} setSelectedCountry={setCountry} disabled={isLoading} />
                    </div>

                    {/* SEARCH ENGINES SELECTOR */}
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <label className="block text-sm font-medium text-gray-300">Search Engine</label>
                        <span className="text-xs text-gray-400">6 major engines</span>
                      </div>
                      <div className="grid grid-cols-3 gap-1.5">
                        {SEARCH_ENGINES_LIST.map((eng) => (
                          <button
                            key={eng.id}
                            type="button"
                            onClick={() => setSelectedEngine(eng.id)}
                            className={`px-2.5 py-1.5 text-xs font-semibold rounded-md transition-all text-center border ${
                              selectedEngine === eng.id
                                ? 'bg-blue-600 text-white border-blue-400 shadow-sm'
                                : 'bg-gray-700/60 text-gray-300 hover:bg-gray-700 border-gray-600'
                            }`}
                          >
                            {eng.name}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* TARGET EMAIL SYNTAX */}
                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <label className="block text-sm font-medium text-gray-300">Target Email Syntax</label>
                        <span className="text-xs text-gray-400">Tail query parameter</span>
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        {EMAIL_PREFIX_OPTIONS.map((opt) => (
                          <button
                            key={opt.id}
                            type="button"
                            onClick={() => setEmailPrefix(opt.id)}
                            className={`px-2.5 py-1 text-xs font-mono font-bold rounded-md transition-all border ${
                              emailPrefix === opt.id
                                ? 'bg-indigo-600 text-white border-indigo-400 shadow-sm'
                                : 'bg-gray-700/60 text-gray-300 hover:bg-gray-700 border-gray-600'
                            }`}
                          >
                            {opt.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* INDUSTRY & KEYWORDS */}
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label htmlFor="keywords" className="block text-sm font-medium text-gray-300">
                          Industry & Keywords
                        </label>
                        <span className="text-xs text-gray-400">e.g. shipyard, steel manufacturer</span>
                      </div>
                      <textarea
                        id="keywords"
                        rows={2}
                        value={keywords}
                        onChange={(e) => setKeywords(e.target.value)}
                        placeholder="e.g., 'steel manufacturer'"
                        disabled={isLoading || isUrlMode}
                        className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 transition disabled:cursor-not-allowed resize-y text-sm font-medium"
                      />
                      <div className="mt-2 flex items-center gap-2 flex-wrap justify-between">
                        <div className="flex items-center gap-2">
                          <button onClick={() => fileInputRef.current?.click()} disabled={isLoading || isUrlMode} className="text-xs text-blue-400 hover:text-blue-300 flex items-center">
                            <DocumentArrowUpIcon className="w-3.5 h-3.5 mr-1" /> Load File
                          </button>
                          <input type="file" ref={fileInputRef} onChange={handleFileChange} accept=".txt" className="hidden" />
                          <button onClick={handleSuggestKeywords} disabled={isLoading || isUrlMode || isSuggesting} className="text-xs text-yellow-400 hover:text-yellow-300 flex items-center">
                            <LightbulbIcon className="w-3.5 h-3.5 mr-1" /> Suggest Keywords
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* QUICK EXAMPLE PRESETS */}
                    <div className="p-3 bg-gray-900/60 border border-gray-700/80 rounded-lg">
                      <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
                        Target Country Presets:
                      </p>
                      <div className="space-y-1.5">
                        <button
                          type="button"
                          onClick={() => handleApplyPreset('Germany', 'steel manufacturer', 'info@')}
                          className="w-full text-left text-xs font-mono px-2 py-1 rounded bg-gray-800 hover:bg-gray-700/80 text-blue-300 truncate border border-gray-700 block"
                        >
                          🇩🇪 site:de steel manufacturer ... info@
                        </button>
                        <button
                          type="button"
                          onClick={() => handleApplyPreset('China', 'shipyard', 'info@')}
                          className="w-full text-left text-xs font-mono px-2 py-1 rounded bg-gray-800 hover:bg-gray-700/80 text-cyan-300 truncate border border-gray-700 block"
                        >
                          🇨🇳 site:cn shipyard ... info@
                        </button>
                        <button
                          type="button"
                          onClick={() => handleApplyPreset('Italy', 'pharmaceutical equipment manufacturer', '@')}
                          className="w-full text-left text-xs font-mono px-2 py-1 rounded bg-gray-800 hover:bg-gray-700/80 text-emerald-300 truncate border border-gray-700 block"
                        >
                          🇮🇹 site:it pharmaceutical equipment ... @
                        </button>
                        <button
                          type="button"
                          onClick={() => handleApplyPreset('Japan', 'marine engine manufacturer', '@')}
                          className="w-full text-left text-xs font-mono px-2 py-1 rounded bg-gray-800 hover:bg-gray-700/80 text-amber-300 truncate border border-gray-700 block"
                        >
                          🇯🇵 site:jp marine engine manufacturer ... @
                        </button>
                        <button
                          type="button"
                          onClick={() => handleApplyPreset('South Korea', 'shipbuilding company', '@')}
                          className="w-full text-left text-xs font-mono px-2 py-1 rounded bg-gray-800 hover:bg-gray-700/80 text-rose-300 truncate border border-gray-700 block"
                        >
                          🇰🇷 site:kr shipbuilding company ... @
                        </button>
                      </div>
                    </div>

                    {/* LIVE DORK QUERY PREVIEW */}
                    <div className="bg-gray-900/90 border border-gray-700 rounded-lg p-3 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold uppercase tracking-wider text-gray-400 flex items-center gap-1">
                          <GlobeAltIcon className="w-3.5 h-3.5 text-blue-400" />
                          Generated Search Query:
                        </span>
                        <button
                          type="button"
                          onClick={handleCopyDork}
                          className="text-xs text-gray-300 hover:text-white flex items-center gap-1 bg-gray-800 px-2 py-0.5 rounded border border-gray-700"
                        >
                          {dorkCopied ? <CheckIcon className="w-3 h-3 text-green-400" /> : <ClipboardIcon className="w-3 h-3" />}
                          {dorkCopied ? 'Copied' : 'Copy'}
                        </button>
                      </div>
                      <div className="bg-black/60 p-2.5 rounded font-mono text-xs text-emerald-400 break-all select-all border border-gray-800">
                        {currentDorkQuery}
                      </div>
                    </div>

                    {/* ACTION BUTTONS */}
                    <div className="space-y-2.5 pt-1">
                      <button
                        type="button"
                        onClick={handleDorkDirectSearch}
                        disabled={isLoading}
                        className="w-full py-2.5 px-4 text-sm font-bold rounded-lg bg-blue-600 hover:bg-blue-700 text-white shadow-lg transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                      >
                        <MagnifyingGlassIcon className="w-4 h-4" />
                        {isLoading ? 'Searching Web Index...' : 'Run Search & Extract Emails'}
                      </button>

                      <div className="grid grid-cols-2 gap-2">
                        <button
                          type="button"
                          onClick={() => handleLaunchEngine(selectedEngine)}
                          disabled={isLoading}
                          className="py-2 px-3 text-xs font-bold rounded-lg bg-gray-700 hover:bg-gray-600 text-white transition-all border border-gray-600 flex items-center justify-center gap-1.5 truncate"
                        >
                          <GlobeAltIcon className="w-3.5 h-3.5 text-blue-400" />
                          Launch in {selectedEngine === 'all' ? 'All' : SEARCH_ENGINES_LIST.find(e => e.id === selectedEngine)?.name}
                        </button>
                        <button
                          type="button"
                          onClick={() => handleLaunchEngine('all')}
                          disabled={isLoading}
                          className="py-2 px-3 text-xs font-bold rounded-lg bg-indigo-700/80 hover:bg-indigo-600 text-white transition-all border border-indigo-500/50 flex items-center justify-center gap-1.5 truncate"
                        >
                          Open All 6 Engines
                        </button>
                      </div>

                      <button
                        type="button"
                        onClick={() => setIsPasteModalOpen(true)}
                        disabled={isLoading}
                        className="w-full py-2 px-3 text-xs font-semibold rounded-lg bg-gray-800 hover:bg-gray-700 text-gray-200 transition-all border border-gray-700 flex items-center justify-center gap-1.5"
                      >
                        <DocumentArrowUpIcon className="w-4 h-4 text-emerald-400" />
                        Paste Search Results / Snippets
                      </button>

                      {isLoading && (
                        <button 
                          type="button"
                          onClick={handleStopSearch} 
                          className="w-full flex items-center justify-center py-2 px-4 text-xs font-bold rounded-lg bg-red-600/80 hover:bg-red-600 text-white shadow-lg transition-all border border-red-500"
                        >
                          <XCircleIcon className="w-4 h-4 mr-1.5" /> Stop Search
                        </button>
                      )}
                    </div>
                  </div>

                  {/* EXTRACTOR RESULTS */}
                  <div className="lg:col-span-8">
                    <ResultsDisplay 
                      results={results} 
                      isLoading={isLoading} 
                      error={error} 
                      progressMessage={progressMessage} 
                      onClearResults={handleClear} 
                      onDeduplicateCompanies={handleDeduplicateCompanies}
                      avoidDuplicateCompanies={avoidDuplicateCompanies}
                      onSendToValidator={() => handleSendToValidator()}
                    />
                  </div>
                </div>
              );
      }
  }

  return (
    <>
      <div className={`fixed top-5 right-5 bg-blue-600 text-white px-4 py-2 rounded-lg shadow-lg transition-transform duration-300 z-[110] ${toast.visible ? 'translate-x-0' : 'translate-x-full'}`} style={{ transform: toast.visible ? 'translateX(0)' : 'translateX(calc(100% + 20px))' }}>
        {toast.message}
      </div>
      
      <SettingsModal 
        isOpen={isSettingsOpen} 
        onClose={() => setIsSettingsOpen(false)} 
        onSave={handleSaveApiKey} 
      />

      <div className="min-h-screen w-full bg-gray-900 text-white p-4 sm:p-6 lg:p-8 font-sans">
        <div className="max-w-[98%] mx-auto">
          <header className="text-center mb-8 relative">
            <div className="absolute right-0 top-0">
                <button 
                    onClick={() => setIsSettingsOpen(true)}
                    className="p-2 rounded-full text-gray-400 hover:text-white hover:bg-gray-800 transition"
                    title="Settings"
                >
                    <Cog6ToothIcon className="w-6 h-6" />
                </button>
            </div>
            <div className="inline-flex items-center justify-center">
                <SparklesIcon className="w-10 h-10 text-blue-400" />
                <h1 className="text-4xl sm:text-5xl font-extrabold ml-3 bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-teal-300">
                Email Extractor Pro
                </h1>
            </div>
            <p className="mt-2 max-w-2xl mx-auto text-lg text-gray-400">
              Precision Search Engine Dorking, Web Crawlers & Native SMTP Verification
            </p>
          </header>

          {/* TABS NAVIGATION */}
          <div className="flex justify-center mb-8 flex-wrap gap-2">
             <div className="bg-gray-800/50 p-1 rounded-xl inline-flex shadow-xl border border-gray-700 flex-wrap justify-center">
                <button
                  onClick={() => setActiveTab('extractor')}
                  className={`flex items-center px-6 py-2.5 rounded-lg text-sm font-bold transition-all duration-200 ${
                    activeTab === 'extractor' 
                    ? 'bg-blue-600 text-white shadow-md' 
                    : 'text-gray-400 hover:text-white hover:bg-gray-700/50'
                  }`}
                >
                  <ListBulletIcon className="w-4 h-4 mr-2" />
                  Extractor
                </button>
                <button
                  onClick={() => setActiveTab('bulk-extractor')}
                  className={`flex items-center px-6 py-2.5 rounded-lg text-sm font-bold transition-all duration-200 ${
                    activeTab === 'bulk-extractor' 
                    ? 'bg-blue-600 text-white shadow-md' 
                    : 'text-gray-400 hover:text-white hover:bg-gray-700/50'
                  }`}
                >
                  <FolderOpenIcon className="w-4 h-4 mr-2" />
                  Folder Extractor
                </button>
                <button
                  onClick={() => setActiveTab('sorter')}
                  className={`flex items-center px-6 py-2.5 rounded-lg text-sm font-bold transition-all duration-200 ${
                    activeTab === 'sorter' 
                    ? 'bg-blue-600 text-white shadow-md' 
                    : 'text-gray-400 hover:text-white hover:bg-gray-700/50'
                  }`}
                >
                  <FolderOpenIcon className="w-4 h-4 mr-2" />
                  Country Sorter
                </button>
                <button
                  onClick={() => setActiveTab('analyzer')}
                  className={`flex items-center px-6 py-2.5 rounded-lg text-sm font-bold transition-all duration-200 ${
                    activeTab === 'analyzer' 
                    ? 'bg-purple-600 text-white shadow-md' 
                    : 'text-gray-400 hover:text-white hover:bg-gray-700/50'
                  }`}
                >
                  <BriefcaseIcon className="w-4 h-4 mr-2" />
                  Industry Analyzer
                </button>
                <button
                  onClick={() => setActiveTab('validator')}
                  className={`flex items-center px-6 py-2.5 rounded-lg text-sm font-bold transition-all duration-200 ${
                    activeTab === 'validator' 
                    ? 'bg-orange-600 text-white shadow-md' 
                    : 'text-gray-400 hover:text-white hover:bg-gray-700/50'
                  }`}
                >
                  <ShieldCheckIcon className="w-4 h-4 mr-2" />
                  Sorter & Validator
                </button>
                <button
                  onClick={() => setActiveTab('mx-sorter')}
                  className={`flex items-center px-6 py-2.5 rounded-lg text-sm font-bold transition-all duration-200 ${
                    activeTab === 'mx-sorter' 
                    ? 'bg-blue-800 text-white shadow-md' 
                    : 'text-gray-400 hover:text-white hover:bg-gray-700/50'
                  }`}
                >
                  <ArrowsRightLeftIcon className="w-4 h-4 mr-2" />
                  MX Sorter
                </button>
                <button
                  onClick={() => setActiveTab('supply-chain')}
                  className={`flex items-center px-6 py-2.5 rounded-lg text-sm font-bold transition-all duration-200 ${
                    activeTab === 'supply-chain' 
                    ? 'bg-purple-800 text-white shadow-md' 
                    : 'text-gray-400 hover:text-white hover:bg-gray-700/50'
                  }`}
                >
                  <BriefcaseIcon className="w-4 h-4 mr-2" />
                  CEO Search
                </button>
                <button
                  onClick={() => setActiveTab('bulk-url-opener')}
                  className={`flex items-center px-6 py-2.5 rounded-lg text-sm font-bold transition-all duration-200 ${
                    activeTab === 'bulk-url-opener' 
                    ? 'bg-blue-600 text-white shadow-md' 
                    : 'text-gray-400 hover:text-white hover:bg-gray-700/50'
                  }`}
                >
                  <GlobeAltIcon className="w-4 h-4 mr-2" />
                  Bulk URL Opener
                </button>
             </div>
          </div>

          <main>
             {renderContent()}
          </main>
        </div>
      </div>

      {/* QUICK PASTE SEARCH RESULTS MODAL */}
      {isPasteModalOpen && (
        <div className="fixed inset-0 z-[120] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-gray-900 border border-gray-700 rounded-2xl max-w-2xl w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-gray-800">
              <div className="flex items-center gap-2">
                <DocumentArrowUpIcon className="w-5 h-5 text-emerald-400" />
                <h3 className="text-lg font-bold text-white">Paste Search Results or Web Content</h3>
              </div>
              <button
                onClick={() => setIsPasteModalOpen(false)}
                className="text-gray-400 hover:text-white p-1 rounded-lg hover:bg-gray-800"
              >
                <XCircleIcon className="w-6 h-6" />
              </button>
            </div>

            <p className="text-xs text-gray-300 leading-relaxed">
              Copy content directly from Google, Bing, Brave, DuckDuckGo, Yahoo, or Yandex search result pages, catalogs, or contact listings. The extractor will harvest all emails and apply the <strong>Duplicate Checker</strong> to ensure unique company records.
            </p>

            <textarea
              rows={8}
              value={pasteInputText}
              onChange={(e) => setPasteInputText(e.target.value)}
              placeholder="Paste raw text, snippets, or HTML here..."
              className="w-full p-3 bg-gray-800 border border-gray-700 rounded-lg text-sm text-gray-200 focus:ring-2 focus:ring-blue-500 font-mono"
            />

            <div className="flex items-center justify-between pt-2">
              <span className="text-xs text-gray-400">
                Country: <strong className="text-blue-400">{country || 'Default'}</strong> • Avoid Duplicate Companies: <strong className={avoidDuplicateCompanies ? "text-emerald-400" : "text-gray-400"}>{avoidDuplicateCompanies ? "Enabled" : "Disabled"}</strong>
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setIsPasteModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold rounded-lg bg-gray-800 text-gray-300 hover:bg-gray-700 border border-gray-700"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleExtractPastedText}
                  className="px-4 py-2 text-xs font-bold rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg transition-all"
                >
                  Extract Emails & Deduplicate
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default App;