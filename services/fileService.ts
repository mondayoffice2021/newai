import * as XLSX from 'xlsx';

/**
 * Extracts emails from a string using a robust regex.
 * Filters out common junk patterns like image001.gif, part1, etc.
 */
export const extractEmailsFromString = (text: string): string[] => {
  const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
  const matches = text.match(emailRegex);
  
  if (!matches) return [];

  const junkPrefixes = ['image', 'part', 'attachment', 'frame', 'thumb', 'clip', 'img', 'file'];
  const fileExtensions = ['.gif', '.jpg', '.jpeg', '.png', '.bmp', '.svg', '.pdf', '.doc', '.docx', '.zip', '.rar'];
  const forbiddenUsernames = new Set(['postmaster', 'privacy', 'webmaster', 'abuse', 'mailer-daemon', 'root', 'admin', 'administrator']);

  return Array.from(new Set(matches.map(e => e.toLowerCase()))).filter(email => {
    const [user] = email.split('@');
    
    // Filter out forbidden role-based usernames or anything related to noreply/news
    if (forbiddenUsernames.has(user) || 
        user.includes('noreply') || 
        user.includes('no-reply') || 
        user.includes('news') || 
        user.includes('newsletter')) return false;
    
    // Filter out usernames that are just junk prefixes followed by numbers
    const isJunkPrefix = junkPrefixes.some(prefix => {
      const regex = new RegExp(`^${prefix}\\d+`, 'i');
      return regex.test(user);
    });
    
    // Filter out usernames that end in common file extensions
    const isFile = fileExtensions.some(ext => user.endsWith(ext));
    
    // Filter out UUIDs
    const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(user);

    return !isJunkPrefix && !isFile && !isUUID;
  });
};

/**
 * Reads a file and extracts all emails found within it.
 * Supports .txt, .csv, .xlsx, .xls
 */
export const extractEmailsFromFile = async (file: File): Promise<string[]> => {
  const extension = file.name.split('.').pop()?.toLowerCase();

  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const data = e.target?.result;
        if (!data) {
          resolve([]);
          return;
        }

        let text = '';

        if (extension === 'xlsx' || extension === 'xls') {
          const workbook = XLSX.read(data, { type: 'binary' });
          workbook.SheetNames.forEach(sheetName => {
            const worksheet = workbook.Sheets[sheetName];
            // Convert to CSV to easily extract text
            text += XLSX.utils.sheet_to_csv(worksheet) + '\n';
          });
        } else {
          // For .txt and .csv, we treat as text
          text = data as string;
        }

        resolve(extractEmailsFromString(text));
      } catch (error) {
        console.error("Error parsing file:", error);
        reject(new Error("Failed to parse file. Please ensure it's a valid text, CSV, or Excel file."));
      }
    };

    reader.onerror = () => {
      reject(new Error("Failed to read file."));
    };

    if (extension === 'xlsx' || extension === 'xls') {
      reader.readAsBinaryString(file);
    } else {
      reader.readAsText(file);
    }
  });
};
