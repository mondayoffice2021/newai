import React, { useState, useMemo } from 'react';
import type { ExtractedEmail } from '../types';
import ClipboardIcon from './icons/ClipboardIcon';
import CheckIcon from './icons/CheckIcon';
import SparklesIcon from './icons/SparklesIcon';
import MagnifyingGlassIcon from './icons/MagnifyingGlassIcon';
import XCircleIcon from './icons/XCircleIcon';
import LinkIcon from './icons/LinkIcon';

interface ResultsDisplayProps {
  results: ExtractedEmail[];
  isLoading: boolean;
  error: string | null;
  progressMessage: string | null;
  onClearResults: () => void;
  onDeduplicateCompanies?: () => void;
  avoidDuplicateCompanies?: boolean;
}

const CopyButton: React.FC<{ textToCopy: string }> = ({ textToCopy }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(textToCopy);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <button
      onClick={handleCopy}
      className="p-2 rounded-md bg-gray-700/50 hover:bg-blue-600 text-gray-300 hover:text-white transition-all duration-200"
      aria-label="Copy email"
      title="Copy to clipboard"
    >
      {copied ? <CheckIcon className="w-4 h-4 text-white" /> : <ClipboardIcon className="w-4 h-4" />}
    </button>
  );
};

const SkeletonLoader: React.FC = () => (
    <div className="w-full h-full overflow-hidden p-4">
        <div className="space-y-4 animate-pulse">
            <div className="h-10 bg-gray-700/50 rounded w-full mb-6"></div>
            {[...Array(6)].map((_, i) => (
            <div key={i} className="flex space-x-4 items-center border-b border-gray-800 pb-4">
                <div className="w-1/3 h-4 bg-gray-700/30 rounded"></div>
                <div className="w-1/3 h-4 bg-gray-700/30 rounded"></div>
                <div className="w-1/6 h-4 bg-gray-700/30 rounded"></div>
                <div className="w-10 h-8 bg-gray-700/30 rounded ml-auto"></div>
            </div>
            ))}
        </div>
    </div>
);

const ResultsDisplay: React.FC<ResultsDisplayProps> = ({ 
  results, 
  isLoading, 
  error, 
  progressMessage, 
  onClearResults,
  onDeduplicateCompanies,
  avoidDuplicateCompanies = true
}) => {
  const [allCopied, setAllCopied] = useState(false);
  const [companyFilter, setCompanyFilter] = useState('');
  const [countryFilter, setCountryFilter] = useState('');
  const [validityFilter, setValidityFilter] = useState('all'); // 'all', 'yes', 'no'

  const uniqueCompaniesCount = useMemo(() => {
    const set = new Set<string>();
    results.forEach(r => {
      const comp = r.companyName?.trim().toLowerCase() || r.email.split('@')[1];
      if (comp) set.add(comp);
    });
    return set.size;
  }, [results]);

  const countriesWithCounts = useMemo(() => {
    if (results.length === 0) return [];
    
    const counts = results.reduce((acc, r) => {
      if (r.country && r.country !== 'N/A') {
        acc[r.country] = (acc[r.country] || 0) + 1;
      }
      return acc;
    }, {} as { [key: string]: number });

    return Object.entries(counts)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [results]);

  const validityCounts = useMemo(() => {
    return results.reduce((acc, r) => {
      if (r.isValid) {
        acc.valid += 1;
      } else {
        acc.invalid += 1;
      }
      return acc;
    }, { valid: 0, invalid: 0 });
  }, [results]);

  const filteredResults = useMemo(() => {
    return results.filter(result => {
      const companyMatch = companyFilter
        ? result.companyName?.toLowerCase().includes(companyFilter.toLowerCase()) || result.email.toLowerCase().includes(companyFilter.toLowerCase())
        : true;
      const countryMatch = countryFilter ? result.country === countryFilter : true;
      const validityMatch =
        validityFilter === 'all'
          ? true
          : validityFilter === 'yes'
          ? result.isValid === true
          : result.isValid === false;
      return companyMatch && countryMatch && validityMatch;
    });
  }, [results, companyFilter, countryFilter, validityFilter]);
  
  const areFiltersActive = companyFilter || countryFilter || validityFilter !== 'all';

  const downloadFile = (content: string, fileName: string, contentType: string) => {
    const a = document.createElement("a");
    const file = new Blob([content], { type: contentType });
    a.href = URL.createObjectURL(file);
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(a.href);
  };
  
  const handleCopyAll = () => {
    if (filteredResults.length > 0) {
      const allEmails = filteredResults.map(r => r.email).join('\n');
      navigator.clipboard.writeText(allEmails);
      setAllCopied(true);
      setTimeout(() => setAllCopied(false), 2000);
    }
  };

  const handleExportCSV = () => {
    const header = "Email,CompanyName,SourceURL,Country,IsValid\n";
    const csvContent = filteredResults.map(r => {
        const company = r.companyName ? `"${r.companyName.replace(/"/g, '""')}"` : '';
        return [r.email, company, r.sourceUrl, r.country || 'N/A', String(r.isValid)].join(',');
    }).join('\n');
    downloadFile(header + csvContent, 'extracted_emails.csv', 'text/csv;charset=utf-8;');
  };

  const handleExportTXT = () => {
    const txtContent = filteredResults.map(r => r.email).join('\n');
    downloadFile(txtContent, 'extracted_emails.txt', 'text/plain;charset=utf-8;');
  };

  const handleClearFilters = () => {
    setCompanyFilter('');
    setCountryFilter('');
    setValidityFilter('all');
  };

  const renderContent = () => {
    if (isLoading && results.length === 0) {
      return <SkeletonLoader />;
    }
    if (error) {
      return <div className="text-center p-10 text-red-400 bg-red-900/20 rounded-lg border border-red-900/50 m-4">{error}</div>;
    }
    if (results.length === 0) {
      return (
        <div className="flex flex-col items-center justify-center h-96 text-gray-400">
          <div className="bg-gray-800/50 p-6 rounded-full mb-4">
             <SparklesIcon className="h-12 w-12 text-gray-500" />
          </div>
          <h3 className="text-xl font-semibold text-white">Ready to extract</h3>
          <p className="mt-2 text-sm text-gray-500 max-w-sm text-center">Configure your search criteria on the left and start the extraction process.</p>
        </div>
      );
    }

    if (filteredResults.length === 0) {
      return (
        <div className="flex flex-col items-center justify-center h-96 text-gray-400">
            <MagnifyingGlassIcon className="h-12 w-12 text-gray-600 mb-3" />
            <h3 className="text-lg font-medium text-white">No Matching Results</h3>
            <p className="mt-1 text-sm text-gray-500">Try adjusting your filters or clear them to see all results.</p>
            <button onClick={handleClearFilters} className="mt-4 px-4 py-2 text-sm font-medium rounded-md bg-blue-600 hover:bg-blue-700 text-white transition">
                Clear Filters
            </button>
        </div>
      );
    }

    return (
      <div className="flex flex-col h-full">
        <div className="overflow-auto custom-scrollbar flex-grow">
            <table className="min-w-full text-left border-collapse table-fixed">
            <thead className="bg-gray-900/90 sticky top-0 z-10 backdrop-blur-md border-b border-gray-700 shadow-sm">
                <tr>
                <th scope="col" className="py-4 pl-6 pr-4 text-xs font-bold uppercase tracking-wider text-gray-400 w-[25%]">Email Address</th>
                <th scope="col" className="px-4 py-4 text-xs font-bold uppercase tracking-wider text-gray-400 w-[35%]">Organization & Source</th>
                <th scope="col" className="px-4 py-4 text-xs font-bold uppercase tracking-wider text-gray-400 w-[15%]">Region</th>
                <th scope="col" className="px-4 py-4 text-center text-xs font-bold uppercase tracking-wider text-gray-400 w-[12%]">Status</th>
                <th scope="col" className="px-4 py-4 text-right text-xs font-bold uppercase tracking-wider text-gray-400 w-[13%]">Action</th>
                </tr>
            </thead>
            <tbody className="divide-y divide-gray-800/50 bg-transparent">
                {filteredResults.map((item, index) => (
                <tr key={`${item.email}-${index}`} className="hover:bg-gray-700/40 odd:bg-gray-800/20 transition-colors duration-150 group">
                    <td className="py-4 pl-6 pr-4 align-top truncate">
                        <div className="flex items-center h-full pt-1">
                            <span className="font-mono text-base text-blue-300 font-medium selection:bg-blue-500/30 truncate" title={item.email}>{item.email}</span>
                        </div>
                    </td>
                    <td className="px-4 py-4 align-top">
                        <div className="flex flex-col">
                            <span className="text-sm font-semibold text-gray-200 mb-1 truncate" title={item.companyName}>{item.companyName || 'Unknown Organization'}</span>
                            <a 
                                href={item.sourceUrl} 
                                target="_blank" 
                                rel="noopener noreferrer" 
                                className="text-xs text-gray-500 group-hover:text-blue-400 transition-colors flex items-center gap-1.5 truncate max-w-full"
                                title={item.sourceUrl}
                            >
                                <LinkIcon className="w-3 h-3 flex-shrink-0" />
                                <span className="truncate">{item.sourceUrl}</span>
                            </a>
                        </div>
                    </td>
                    <td className="px-4 py-4 text-sm text-gray-400 align-top pt-5 truncate">
                        {item.country && item.country !== 'N/A' ? item.country : <span className="text-gray-600">-</span>}
                    </td>
                    <td className="px-4 py-4 text-center align-top pt-5">
                        {item.isValid ? 
                            <span className="inline-flex items-center rounded-md bg-green-900/30 px-2.5 py-0.5 text-xs font-bold text-green-400 ring-1 ring-inset ring-green-500/20 uppercase tracking-wide">Valid</span> :
                            <span className="inline-flex items-center rounded-md bg-red-900/30 px-2.5 py-0.5 text-xs font-bold text-red-400 ring-1 ring-inset ring-red-500/20 uppercase tracking-wide">Invalid</span>
                        }
                    </td>
                    <td className="py-4 pl-4 pr-6 text-right align-top pt-4">
                        <CopyButton textToCopy={item.email} />
                    </td>
                </tr>
                ))}
            </tbody>
            </table>
        </div>
      </div>
    );
  };

  return (
    <div className="bg-gray-800/40 backdrop-blur-md border border-gray-700 rounded-xl shadow-2xl flex flex-col h-[85vh]">
      <div className="p-5 border-b border-gray-700/50 bg-gray-800/30 shrink-0">
        <div className="flex flex-wrap gap-4 justify-between items-center mb-4">
          <div>
            <div className="flex items-center gap-2.5 flex-wrap">
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                  Results 
                  <span className="text-sm font-normal text-gray-400 bg-gray-700/50 px-2 py-0.5 rounded-full">
                      {results.length > 0 ? `${filteredResults.length} / ${results.length}`: '0'}
                  </span>
              </h2>
              {results.length > 0 && (
                <span className="text-xs bg-indigo-900/40 text-indigo-300 border border-indigo-700/50 px-2.5 py-0.5 rounded-full font-medium flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-indigo-400"></span>
                  {uniqueCompaniesCount} Unique {uniqueCompaniesCount === 1 ? 'Company' : 'Companies'}
                </span>
              )}
              {avoidDuplicateCompanies && (
                <span className="text-xs bg-emerald-900/30 text-emerald-400 border border-emerald-700/40 px-2 py-0.5 rounded-full font-medium" title="Company duplicate checker active">
                  ✓ Duplicate Checker Active
                </span>
              )}
            </div>
            {isLoading && progressMessage && (
              <p className="text-xs text-blue-300 mt-1 animate-pulse font-medium">{progressMessage}</p>
            )}
          </div>
          {results.length > 0 && (
            <div className="flex items-center gap-2 flex-shrink-0 flex-wrap">
              {onDeduplicateCompanies && (
                <button 
                  onClick={onDeduplicateCompanies} 
                  className="flex items-center px-3 py-1.5 text-xs font-bold uppercase tracking-wider rounded-md bg-amber-600/20 hover:bg-amber-600/40 text-amber-300 hover:text-white transition-all duration-200 border border-amber-600/40"
                  title="Remove duplicate company records, keeping 1 primary contact email per company"
                >
                  ⚡ Deduplicate Companies
                </button>
              )}
              <button onClick={handleCopyAll} disabled={filteredResults.length === 0} className="flex items-center px-3 py-1.5 text-xs font-bold uppercase tracking-wider rounded-md bg-gray-700 hover:bg-gray-600 text-white transition-all duration-200 disabled:opacity-50 border border-gray-600">
                {allCopied ? <><CheckIcon className="w-4 h-4 mr-1.5 text-green-400" />Copied</> : <><ClipboardIcon className="w-4 h-4 mr-1.5" />Copy All</>}
              </button>
              <div className="h-6 w-px bg-gray-700 mx-1"></div>
              <button onClick={handleExportTXT} disabled={filteredResults.length === 0} className="px-3 py-1.5 text-xs font-bold uppercase tracking-wider rounded-md bg-blue-600/80 hover:bg-blue-600 text-white transition-all duration-200 disabled:opacity-50">TXT</button>
              <button onClick={handleExportCSV} disabled={filteredResults.length === 0} className="px-3 py-1.5 text-xs font-bold uppercase tracking-wider rounded-md bg-green-600/80 hover:bg-green-600 text-white transition-all duration-200 disabled:opacity-50">CSV</button>
              <div className="h-6 w-px bg-gray-700 mx-1"></div>
              <button onClick={onClearResults} className="flex items-center px-3 py-1.5 text-xs font-bold uppercase tracking-wider rounded-md bg-red-600/20 hover:bg-red-600/40 text-red-200 hover:text-white transition-all duration-200 border border-red-900/30">
                <XCircleIcon className="w-4 h-4 mr-1.5" /> Clear
              </button>
            </div>
          )}
        </div>
        
        {results.length > 0 && (
            <div className="flex flex-wrap items-center gap-3 pt-2">
                <div className="relative group">
                    <MagnifyingGlassIcon className="pointer-events-none w-4 h-4 absolute top-1/2 transform -translate-y-1/2 left-3 text-gray-500 group-focus-within:text-blue-400 transition-colors" />
                    <input
                        type="text"
                        placeholder="Filter companies or emails..."
                        value={companyFilter}
                        onChange={(e) => setCompanyFilter(e.target.value)}
                        className="pl-9 pr-4 py-1.5 bg-gray-900/50 border border-gray-600 rounded-md focus:ring-1 focus:ring-blue-500 focus:border-blue-500 transition text-sm w-64 placeholder-gray-500 text-gray-200"
                    />
                </div>

                <select
                    value={countryFilter}
                    onChange={(e) => setCountryFilter(e.target.value)}
                    disabled={countriesWithCounts.length === 0}
                    className="px-3 py-1.5 bg-gray-900/50 border border-gray-600 rounded-md focus:ring-1 focus:ring-blue-500 focus:border-blue-500 transition text-sm disabled:opacity-50 text-gray-300"
                >
                    <option value="">All Countries</option>
                    {countriesWithCounts.map(({ name, count }) => (
                        <option key={name} value={name}>{name} ({count})</option>
                    ))}
                </select>
                
                <select
                    value={validityFilter}
                    onChange={(e) => setValidityFilter(e.target.value)}
                    className="px-3 py-1.5 bg-gray-900/50 border border-gray-600 rounded-md focus:ring-1 focus:ring-blue-500 focus:border-blue-500 transition text-sm text-gray-300"
                >
                    <option value="all">All Status</option>
                    <option value="yes">Valid Only</option>
                    <option value="no">Invalid Only</option>
                </select>
                
                {areFiltersActive && (
                    <button onClick={handleClearFilters} className="ml-auto px-3 py-1.5 text-xs font-medium rounded-md text-blue-400 hover:text-blue-300 hover:bg-blue-400/10 transition-all duration-200">
                        Reset Filters
                    </button>
                )}
            </div>
        )}
      </div>
      
      <div className="flex-grow overflow-hidden relative bg-gray-900/20">
        {renderContent()}
      </div>
    </div>
  );
};

export default ResultsDisplay;