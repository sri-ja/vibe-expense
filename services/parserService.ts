import { CustomParser } from '../types';
import { ParsedTransactionData } from './ruleBasedParsers';

/**
 * Escapes special characters in a string for use in a regular expression.
 */
const escapeRegex = (str: string) => {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
};

/**
 * Tries to parse a date string, prioritizing the dd/mm/yyyy format.
 * Falls back to native Date parsing if the format doesn't match.
 * @param dateString - The date string to parse.
 * @returns A Date object or null if parsing fails.
 */
const parseDateString = (dateString: string): Date | null => {
    const trimmed = dateString.trim();
    // Regex to capture dd, mm, yyyy or yy with common separators
    const match = trimmed.match(/^(\d{1,2})[\/\.-](\d{1,2})[\/\.-](\d{2,4})$/);
    
    if (match) {
        const day = parseInt(match[1], 10);
        const month = parseInt(match[2], 10);
        let year = parseInt(match[3], 10);

        if (!isNaN(day) && !isNaN(month) && !isNaN(year) && month >= 1 && month <= 12 && day >= 1 && day <= 31) {
             // Handle 2-digit year. Assume it's in the current century.
            if (year < 100) {
                 const currentCentury = Math.floor(new Date().getFullYear() / 100) * 100; // e.g., 2000
                 year += currentCentury;
            }
            
            // Use UTC to prevent timezone shifts during date creation
            const date = new Date(Date.UTC(year, month - 1, day));

            // Check if the created date is valid (e.g., handles Feb 30, which JS would roll over)
            // The created date's month and day must match what we passed in.
            if (date.getUTCFullYear() === year && date.getUTCMonth() === month - 1 && date.getUTCDate() === day) {
                return date;
            }
        }
    }
    
    // Fallback for other formats that `new Date` can handle (e.g., ISO, "Month Day, Year")
    const d = new Date(trimmed);
    return isNaN(d.getTime()) ? null : d;
};


/**
 * Creates a dynamic parser function from a user-defined template.
 * @param parserDef - The custom parser definition with a name and template.
 * @returns A parser function or null if the template is invalid.
 */
export const createDynamicParser = (parserDef: CustomParser): ((text: string) => ParsedTransactionData | null) | null => {
    const { template } = parserDef;
    const placeholders = ['{merchant}', '{amount}', '{date}'];
    
    // Ensure all required placeholders are present
    if (!placeholders.every(p => template.includes(p))) {
        console.warn(`Parser "${parserDef.name}" has an invalid template: missing one or more placeholders.`);
        return null;
    }

    const captureOrder: ('merchant' | 'amount' | 'date')[] = [];
    
    const sortedPlaceholders = template.match(/\{(merchant|amount|date)\}/g);
    if (sortedPlaceholders) {
        sortedPlaceholders.forEach(p => {
            captureOrder.push(p.slice(1, -1) as 'merchant' | 'amount' | 'date');
        });
    }

    // 1. Replace placeholders with unique, non-regex markers.
    let regexString = template
        .replace('{merchant}', '@@MERCHANT@@')
        .replace('{amount}', '@@AMOUNT@@')
        .replace('{date}', '@@DATE@@');
    
    // 2. Escape the entire string to handle special regex characters in the template.
    regexString = escapeRegex(regexString);
    
    // 3. Replace all whitespace sequences with `\s+` to make the parser
    //    robust to blank lines and extra spaces. This looks for sequences of
    //    escaped spaces (`\ `) or literal newlines/tabs (`\n`, `\t`, `\r`).
    regexString = regexString.replace(/(?:\\ |\n|\t|\r)+/g, '\\s+');
    
    // 4. Replace markers with actual regex capture groups.
    regexString = regexString
        .replace('@@MERCHANT@@', '(.*?)')
        .replace('@@AMOUNT@@', '([\\d,]+\\.?\\d*)')
        .replace('@@DATE@@', '(.*?)');

    try {
        const regex = new RegExp(`^${regexString}$`, 's');

        return (text: string) => {
            const match = text.match(regex);
            if (!match) return null;

            try {
                const result: Partial<ParsedTransactionData> = {};
                
                // The first match is the full string, captures start at index 1
                for (let i = 0; i < captureOrder.length; i++) {
                    const placeholder = captureOrder[i];
                    const value = match[i + 1];

                    if (placeholder === 'amount') {
                        result.amount = parseFloat(value.replace(/,/g, ''));
                    } else if (placeholder === 'merchant') {
                        result.merchant = value.trim();
                    } else if (placeholder === 'date') {
                        const parsedDate = parseDateString(value.trim());
                        if (!parsedDate) return null; // Invalid date
                        
                        // Using UTC methods to avoid timezone shifts when formatting to string.
                        result.date = `${parsedDate.getUTCFullYear()}-${String(parsedDate.getUTCMonth() + 1).padStart(2, '0')}-${String(parsedDate.getUTCDate()).padStart(2, '0')}`;
                    }
                }

                if (result.merchant && result.amount && result.date) {
                    return result as ParsedTransactionData;
                }
            } catch (e) {
                 console.error(`Error executing dynamic parser "${parserDef.name}":`, e);
                 return null;
            }

            return null;
        };
    } catch (e) {
        console.error(`Failed to create regex for parser "${parserDef.name}":`, e);
        return null;
    }
};
