import React, { useState, useRef, useCallback } from 'react';
import { extractEmailsFromFile } from '../services/fileService';
import DocumentArrowUpIcon from './icons/DocumentArrowUpIcon';
import FolderOpenIcon from './icons/FolderOpenIcon';
import ClipboardIcon from './icons/ClipboardIcon';
import CheckIcon from './icons/CheckIcon';
import XCircleIcon from './icons/XCircleIcon';
import TrashIcon from './icons/XCircleIcon'; // We can reuse XCircleIcon or make a clean close/delete action
import ArrowPathIcon from './icons/ArrowPathIcon';

interface FolderExtractorProps {
  showToast: (msg: string) => void;
}

interface ProcessedFile {
  id: string;
  name: string;
  relativePath?: string;
  size: number;
  emailsCount: number;
  status: 'success' | 'skipped' | 'error';
  errorMessage?: string;
}

interface ExtractedEmailItem {
  email: string;
  domain: string;
  sourceFiles: string[];
}

export const FolderExtractor: React.FC<FolderExtractorProps> = ({ showToast }) => {
  const [processedFiles, setProcessedFiles] = useState<ProcessedFile[]>([]);
  const [extractedEmails, setExtractedEmails] = useState<ExtractedEmailItem[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [progress, setProgress] = useState<{ current: number; total: number } | null>(null);
  const [statusText, setStatusText] = useState('Idle');
  const [searchQuery, setSearchQuery] = useState('');
  const [fileFilter, setFileFilter] = useState('');

  const multiFileInputRef = useRef<HTMLInputElement>(null);
  const folderInputRef = useRef<HTMLInputElement>(null);

  // Helper to format bytes
  const formatBytes = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  // Check if a file is supported or skip system/binary folders
  const isSupportedFile = (file: File): boolean => {
    const name = file.name.toLowerCase();
    // Skip hidden files and system trash
    if (name.startsWith('.') || name === 'thumbs.db' || name.startsWith('~$') || name === '.ds_store') {
      return false;
    }
    const ext = name.split('.').pop()?.toLowerCase() || '';
    const allowed = ['txt', 'csv', 'xlsx', 'xls', 'tsv', 'json', 'log', 'xml', 'html', 'htm', 'md'];
    return allowed.includes(ext);
  };

  // Recursively parse entries from dropped items (supports folders)
  const traverseFileSystemEntry = async (entry: any): Promise<File[]> => {
    const files: File[] = [];
    if (entry.isFile) {
      const file = await new Promise<File>((resolve, reject) => entry.file(resolve, reject));
      if (isSupportedFile(file)) {
        files.push(file);
      }
    } else if (entry.isDirectory) {
      const dirReader = entry.createReader();
      const readAllEntries = async (): Promise<any[]> => {
        let allEntries: any[] = [];
        let batch = await new Promise<any[]>((resolve, reject) => dirReader.readEntries(resolve, reject));
        while (batch.length > 0) {
          allEntries = allEntries.concat(batch);
          batch = await new Promise<any[]>((resolve, reject) => dirReader.readEntries(resolve, reject));
        }
        return allEntries;
      };

      try {
        const entries = await readAllEntries();
        const subFilesPromises = entries.map(childEntry => traverseFileSystemEntry(childEntry));
        const subFilesArrays = await Promise.all(subFilesPromises);
        subFilesArrays.forEach(arr => files.push(...arr));
      } catch (err) {
        console.error("Error reading subdirectory:", err);
      }
    }
    return files;
  };

  // Core Processing Engine
  const processFiles = async (filesToProcess: File[]) => {
    if (filesToProcess.length === 0) {
      showToast("No supported files found to process.");
      return;
    }

    setIsProcessing(true);
    setStatusText(`Preparing to extract from ${filesToProcess.length} files...`);
    setProgress({ current: 0, total: filesToProcess.length });

    const newProcessedFiles: ProcessedFile[] = [];
    // Map of Email -> Set of Source File Names
    const tempEmailsMap = new Map<string, Set<string>>();

    // Load existing items into the map for incremental additions
    extractedEmails.forEach(item => {
      tempEmailsMap.set(item.email, new Set(item.sourceFiles));
    });

    const fileMap = new Map<string, ProcessedFile>();
    processedFiles.forEach(f => fileMap.set(f.name, f));

    // Process files sequentially to keep UI responsive and track progress accurately
    for (let i = 0; i < filesToProcess.length; i++) {
      const file = filesToProcess[i];
      setProgress({ current: i + 1, total: filesToProcess.length });
      setStatusText(`Processing file: ${file.name} (${formatBytes(file.size)})...`);

      try {
        const emailsExtracted = await extractEmailsFromFile(file);
        
        // Add to processed log
        const fileLog: ProcessedFile = {
          id: Math.random().toString(36).substr(2, 9),
          name: file.name,
          relativePath: (file as any).webkitRelativePath || undefined,
          size: file.size,
          emailsCount: emailsExtracted.length,
          status: 'success'
        };
        newProcessedFiles.push(fileLog);

        // Map extracted emails
        emailsExtracted.forEach(email => {
          const cleanedEmail = email.toLowerCase().trim();
          if (!tempEmailsMap.has(cleanedEmail)) {
            tempEmailsMap.set(cleanedEmail, new Set());
          }
          tempEmailsMap.get(cleanedEmail)?.add(file.name);
        });

      } catch (err: any) {
        console.error(`Error reading ${file.name}:`, err);
        newProcessedFiles.push({
          id: Math.random().toString(36).substr(2, 9),
          name: file.name,
          relativePath: (file as any).webkitRelativePath || undefined,
          size: file.size,
          emailsCount: 0,
          status: 'error',
          errorMessage: err.message || 'Unknown read error'
        });
      }
    }

    // Convert map back to list of unique email items
    const mergedEmails: ExtractedEmailItem[] = Array.from(tempEmailsMap.entries()).map(([email, sourcesSet]) => {
      const domain = email.split('@')[1] || '';
      return {
        email,
        domain,
        sourceFiles: Array.from(sourcesSet)
      };
    });

    // Merge logs and ensure unique file logs by name (latest wins)
    const combinedFileLogsMap = new Map<string, ProcessedFile>();
    processedFiles.forEach(f => combinedFileLogsMap.set(f.name, f));
    newProcessedFiles.forEach(f => combinedFileLogsMap.set(f.name, f));

    setProcessedFiles(Array.from(combinedFileLogsMap.values()));
    setExtractedEmails(mergedEmails);
    setIsProcessing(false);
    setProgress(null);
    setStatusText('Idle');
    showToast(`Extraction complete! Found ${mergedEmails.length} unique emails across ${combinedFileLogsMap.size} files.`);
  };

  // Drag & Drop Handlers
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

   const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    if (isProcessing) return;

    const items = e.dataTransfer.items;
    if (!items) {
      // Fallback if webkitGetAsEntry not supported
      const files = (Array.from(e.dataTransfer.files) as File[]).filter(isSupportedFile);
      await processFiles(files);
      return;
    }

    setStatusText("Analyzing dragged items...");
    const filesToProcess: File[] = [];
    const traversePromises: Promise<File[]>[] = [];

    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      if (item.kind === 'file') {
        const entry = item.webkitGetAsEntry ? item.webkitGetAsEntry() : null;
        if (entry) {
          traversePromises.push(traverseFileSystemEntry(entry));
        } else {
          const file = item.getAsFile();
          if (file && isSupportedFile(file)) {
            filesToProcess.push(file);
          }
        }
      }
    }

    if (traversePromises.length > 0) {
      const results = await Promise.all(traversePromises);
      results.forEach(fileArray => filesToProcess.push(...fileArray));
    }

    await processFiles(filesToProcess);
  };

  // File Input Change Handlers
  const handleMultiFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files ? (Array.from(e.target.files) as File[]) : [];
    const supported = files.filter(isSupportedFile) as File[];
    await processFiles(supported);
    if (multiFileInputRef.current) multiFileInputRef.current.value = '';
  };

  const handleFolderChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files ? (Array.from(e.target.files) as File[]) : [];
    const supported = files.filter(isSupportedFile) as File[];
    await processFiles(supported);
    if (folderInputRef.current) folderInputRef.current.value = '';
  };

  // Individual item / list cleanup operations
  const handleRemoveEmail = (emailToRemove: string) => {
    setExtractedEmails(prev => prev.filter(e => e.email !== emailToRemove));
    showToast("Email removed from list.");
  };

  const handleClearAll = () => {
    if (window.confirm("Are you sure you want to clear all extracted emails and file history?")) {
      setExtractedEmails([]);
      setProcessedFiles([]);
      showToast("All data cleared.");
    }
  };

  // Exporters
  const downloadTextFile = () => {
    if (extractedEmails.length === 0) return;
    const content = extractedEmails.map(e => e.email).join('\n');
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `extracted_emails_merged_${new Date().toISOString().split('T')[0]}.txt`;
    link.click();
    URL.revokeObjectURL(url);
    showToast("Downloaded merged TXT file.");
  };

  const downloadCsvFile = () => {
    if (extractedEmails.length === 0) return;
    
    // Header
    let csvContent = "Email,Domain,Source Files\n";
    
    // Rows
    extractedEmails.forEach(item => {
      const escapedEmail = `"${item.email.replace(/"/g, '""')}"`;
      const escapedDomain = `"${item.domain.replace(/"/g, '""')}"`;
      const escapedSources = `"${item.sourceFiles.join('; ').replace(/"/g, '""')}"`;
      csvContent += `${escapedEmail},${escapedDomain},${escapedSources}\n`;
    });

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `extracted_emails_merged_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    URL.revokeObjectURL(url);
    showToast("Downloaded merged CSV file.");
  };

  const copyToClipboard = () => {
    if (extractedEmails.length === 0) return;
    const emailsList = extractedEmails.map(e => e.email).join('\n');
    navigator.clipboard.writeText(emailsList)
      .then(() => showToast("Copied all unique emails to clipboard!"))
      .catch(() => showToast("Failed to copy to clipboard."));
  };

  // Filtered lists
  const filteredEmails = extractedEmails.filter(item => {
    const matchesSearch = item.email.includes(searchQuery.toLowerCase()) || item.domain.includes(searchQuery.toLowerCase());
    const matchesFile = fileFilter === '' || item.sourceFiles.includes(fileFilter);
    return matchesSearch && matchesFile;
  });

  const uniqueSourceFiles = Array.from(new Set(extractedEmails.flatMap(e => e.sourceFiles))).sort();

  return (
    <div className="space-y-8" id="folder-file-extractor">
      
      {/* 2x2 Header layout or standard card */}
      <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-6 shadow-xl backdrop-blur-sm">
        <h2 className="text-2xl font-bold text-white mb-2 flex items-center">
          <FolderOpenIcon className="w-6 h-6 mr-2 text-blue-400" />
          Bulk File & Folder Email Extractor
        </h2>
        <p className="text-gray-400 text-sm mb-6">
          Deduplicate and extract email lists directly from files on your desktop. Upload multiple documents or select an entire folder recursively. Works instantly without sending your file contents to third-party servers!
        </p>

        {/* Upload Zone */}
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          className={`border-2 border-dashed rounded-xl p-8 flex flex-col items-center justify-center text-center transition-all ${
            isDragging
              ? 'border-blue-400 bg-blue-500/10'
              : 'border-gray-600 bg-gray-900/40 hover:border-gray-500 hover:bg-gray-900/60'
          } ${isProcessing ? 'opacity-50 pointer-events-none' : 'cursor-pointer'}`}
        >
          <DocumentArrowUpIcon className={`w-16 h-16 mb-4 transition-transform ${isDragging ? 'scale-110 text-blue-400' : 'text-gray-400'}`} />
          
          <div className="text-white font-bold text-lg mb-2">
            Drag & Drop Files or Folders Here
          </div>
          <p className="text-gray-400 text-sm max-w-md mb-6">
            Supports <strong className="text-blue-400">TXT, CSV, XLSX, XLS</strong> and other documents. Drop folders directly from your desktop to read recursively.
          </p>

          <div className="flex flex-wrap gap-4 justify-center">
            {/* Multi-file Input Trigger */}
            <button
              onClick={() => multiFileInputRef.current?.click()}
              disabled={isProcessing}
              className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm rounded-lg transition-all flex items-center shadow-lg disabled:opacity-50"
            >
              <DocumentArrowUpIcon className="w-4 h-4 mr-2" />
              Select Multiple Files
            </button>
            <input
              type="file"
              ref={multiFileInputRef}
              onChange={handleMultiFileChange}
              multiple
              accept=".txt,.csv,.xlsx,.xls,.tsv,.json,.log,.xml,.html,.htm,.md"
              className="hidden"
            />

            {/* Folder Input Trigger */}
            <button
              onClick={() => folderInputRef.current?.click()}
              disabled={isProcessing}
              className="px-5 py-2.5 bg-teal-600 hover:bg-teal-700 text-white font-bold text-sm rounded-lg transition-all flex items-center shadow-lg disabled:opacity-50"
            >
              <FolderOpenIcon className="w-4 h-4 mr-2" />
              Select Folder
            </button>
            <input
              type="file"
              ref={folderInputRef}
              onChange={handleFolderChange}
              {...({
                webkitdirectory: "",
                directory: "",
                multiple: true
              } as any)}
              className="hidden"
            />
          </div>
        </div>

        {/* Real-time Loader Indicator */}
        {isProcessing && progress && (
          <div className="mt-6 p-4 bg-gray-900/80 border border-gray-700 rounded-lg space-y-3">
            <div className="flex items-center justify-between text-sm">
              <span className="text-blue-400 font-medium flex items-center">
                <ArrowPathIcon className="w-4 h-4 mr-2 animate-spin text-blue-400" />
                {statusText}
              </span>
              <span className="text-gray-400 font-bold">
                {progress.current} / {progress.total} Files
              </span>
            </div>
            <div className="w-full bg-gray-800 h-2.5 rounded-full overflow-hidden">
              <div
                className="bg-blue-500 h-full transition-all duration-150"
                style={{ width: `${(progress.current / progress.total) * 100}%` }}
              ></div>
            </div>
          </div>
        )}
      </div>

      {/* Stats and Results Grid */}
      {processedFiles.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* File Upload History log (Left Side) */}
          <div className="lg:col-span-4 bg-gray-800/40 border border-gray-700 rounded-xl p-5 shadow-xl">
            <h3 className="text-lg font-bold text-white mb-4 flex items-center justify-between">
              <span>Source Files ({processedFiles.length})</span>
              <button
                onClick={handleClearAll}
                className="text-xs text-red-400 hover:text-red-300 transition-colors"
              >
                Clear All Data
              </button>
            </h3>

            <div className="space-y-3 max-h-[480px] overflow-y-auto pr-2 custom-scrollbar">
              {processedFiles.map(file => (
                <div key={file.id} className="p-3 bg-gray-900/50 border border-gray-800 rounded-lg flex items-center justify-between gap-3 text-xs">
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold text-gray-200 truncate" title={file.relativePath || file.name}>
                      {file.name}
                    </p>
                    <p className="text-gray-500 mt-0.5">
                      {formatBytes(file.size)}
                    </p>
                  </div>
                  <div className="text-right shrink-0">
                    {file.status === 'success' ? (
                      <div>
                        <span className="text-teal-400 font-bold block">{file.emailsCount} emails</span>
                        <span className="text-gray-500 text-[10px]">Processed</span>
                      </div>
                    ) : (
                      <div>
                        <span className="text-red-400 font-bold block">Failed</span>
                        <span className="text-gray-500 text-[10px] block max-w-[100px] truncate" title={file.errorMessage}>
                          {file.errorMessage}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Extracted Combined List (Right Side) */}
          <div className="lg:col-span-8 bg-gray-800/40 border border-gray-700 rounded-xl p-5 shadow-xl flex flex-col min-h-[500px]">
            
            {/* Filter and Export Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-gray-700 mb-4">
              <div>
                <h3 className="text-xl font-bold text-white">Extracted Email Database</h3>
                <p className="text-xs text-teal-400 mt-1 font-bold">
                  {extractedEmails.length} unique emails merged and deduplicated
                </p>
              </div>

              {/* Download Buttons */}
              <div className="flex flex-wrap gap-2 shrink-0">
                <button
                  onClick={copyToClipboard}
                  disabled={extractedEmails.length === 0}
                  className="px-3 py-1.5 bg-gray-700 hover:bg-gray-600 text-white rounded-lg text-xs font-bold transition-all flex items-center disabled:opacity-40"
                >
                  <ClipboardIcon className="w-3.5 h-3.5 mr-1" />
                  Copy Emails
                </button>
                <button
                  onClick={downloadTextFile}
                  disabled={extractedEmails.length === 0}
                  className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold transition-all flex items-center disabled:opacity-40"
                >
                  Download TXT
                </button>
                <button
                  onClick={downloadCsvFile}
                  disabled={extractedEmails.length === 0}
                  className="px-3 py-1.5 bg-teal-600 hover:bg-teal-700 text-white rounded-lg text-xs font-bold transition-all flex items-center disabled:opacity-40"
                >
                  Download CSV
                </button>
              </div>
            </div>

            {/* Filter controls */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4">
              <div>
                <input
                  type="text"
                  placeholder="Search email or domain..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full px-3 py-1.5 bg-gray-900 border border-gray-700 rounded-lg text-sm focus:ring-1 focus:ring-blue-500 focus:outline-none text-white"
                />
              </div>
              <div>
                <select
                  value={fileFilter}
                  onChange={(e) => setFileFilter(e.target.value)}
                  className="w-full px-3 py-1.5 bg-gray-900 border border-gray-700 rounded-lg text-sm focus:ring-1 focus:ring-blue-500 focus:outline-none text-gray-300"
                >
                  <option value="">All Source Files ({uniqueSourceFiles.length})</option>
                  {uniqueSourceFiles.map(fn => (
                    <option key={fn} value={fn}>{fn}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Table Area */}
            <div className="flex-1 overflow-x-auto">
              {filteredEmails.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center h-full">
                  <XCircleIcon className="w-12 h-12 text-gray-500 mb-2" />
                  <p className="text-gray-400 text-sm">No emails found matching your filters.</p>
                </div>
              ) : (
                <div className="max-h-[360px] overflow-y-auto pr-1 custom-scrollbar">
                  <table className="w-full border-collapse text-left text-xs">
                    <thead>
                      <tr className="border-b border-gray-800 text-gray-400 font-semibold uppercase tracking-wider">
                        <th className="py-2.5 px-3">Email Address</th>
                        <th className="py-2.5 px-3">Domain</th>
                        <th className="py-2.5 px-3">Source Document(s)</th>
                        <th className="py-2.5 px-3 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-800">
                      {filteredEmails.map(item => (
                        <tr key={item.email} className="hover:bg-gray-800/30 transition-colors">
                          <td className="py-2.5 px-3 font-semibold text-gray-100 select-all truncate max-w-[180px]" title={item.email}>
                            {item.email}
                          </td>
                          <td className="py-2.5 px-3 text-gray-400 select-all">
                            {item.domain}
                          </td>
                          <td className="py-2.5 px-3">
                            <div className="flex flex-wrap gap-1 max-w-[200px]">
                              {item.sourceFiles.map(src => (
                                <span key={src} className="inline-block px-1.5 py-0.5 bg-gray-700 text-gray-300 rounded text-[10px] truncate max-w-[120px]" title={src}>
                                  {src}
                                </span>
                              ))}
                            </div>
                          </td>
                          <td className="py-2.5 px-3 text-right">
                            <button
                              onClick={() => handleRemoveEmail(item.email)}
                              className="text-gray-500 hover:text-red-400 p-1 rounded transition-colors"
                              title="Delete Email"
                            >
                              <XCircleIcon className="w-4 h-4" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* Pagination / Total count summary footer */}
            {filteredEmails.length > 0 && (
              <div className="border-t border-gray-800 pt-3 mt-4 flex items-center justify-between text-xs text-gray-400">
                <span>
                  Showing {filteredEmails.length} of {extractedEmails.length} unique emails
                </span>
                <span>
                  {searchQuery || fileFilter ? 'Filters active' : 'All results'}
                </span>
              </div>
            )}

          </div>

        </div>
      )}

    </div>
  );
};
