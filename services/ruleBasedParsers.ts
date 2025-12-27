import { Transaction, CustomParser } from '../types';
import { createDynamicParser } from './parserService';
import { logService } from './logService';

// Omit 'id' because we'll generate it later.
export type ParsedTransactionData = Omit<Transaction, 'id'>;
type ParserFunction = (text: string) => ParsedTransactionData | null;

export type RuleParseResult = {
  data: ParsedTransactionData;
  ruleName: string;
} | null;


/**
 * Parses the "Jupiter" format.
 */
function parseJupiterFormat(text: string): ParsedTransactionData | null {
    // This regex now specifically captures the first line after "Paid to" as the merchant,
    // and ignores subsequent lines before the date.
    const pattern = /You paid\s+₹([\d,]+\.?\d*)\s+Paid to\s+([^\n\r]+)[\s\S]*?Date\s+([A-Za-z]+\s+\d{1,2},\s+\d{4})/;
    const match = text.match(pattern);

    if (match) {
        try {
            const amount = parseFloat(match[1].replace(/,/g, ''));
            const merchant = match[2].trim();
            const dateStr = match[3];

            const date = new Date(dateStr);
            if (isNaN(date.getTime())) return null;

            const year = date.getFullYear();
            const month = String(date.getMonth() + 1).padStart(2, '0');
            const day = String(date.getDate()).padStart(2, '0');
            
            return {
                merchant,
                amount,
                date: `${year}-${month}-${day}`,
            };
        } catch (e) {
            console.error("Error parsing Jupiter format:", e);
            return null;
        }
    }
    return null;
}

/**
 * Parses the "Axis" / Amount Debited format.
 */
function parseAxisFormat(text: string): ParsedTransactionData | null {
    const pattern = /Amount Debited:\s+INR\s+([\d,]+\.?\d*)[\s\S]*?Date & Time:\s+(\d{2}-\d{2}-\d{2})[\s\S]*?Transaction Info:.*?\/([^\/\n\r]+?)\s*$/s;
    const match = text.match(pattern);

    if (match) {
        try {
            const amount = parseFloat(match[1].replace(/,/g, ''));
            const dateParts = match[2].split('-'); // DD-MM-YY
            const merchant = match[3].trim();

            if (dateParts.length === 3) {
                const year = parseInt(`20${dateParts[2]}`);
                const month = dateParts[1];
                const day = dateParts[0];

                if (parseInt(month) > 12 || parseInt(day) > 31 || isNaN(year)) return null;

                return {
                    merchant,
                    amount,
                    date: `${year}-${month}-${day}`,
                };
            }
        } catch (e) {
            console.error("Error parsing Axis format:", e);
            return null;
        }
    }
    return null;
}

const builtInParsers: { name: string; parser: ParserFunction }[] = [
    { name: "Jupiter Parser", parser: parseJupiterFormat },
    { name: "Axis Parser", parser: parseAxisFormat },
];

/**
 * Prepares a single function that attempts to parse a transaction string
 * using a series of rule-based parsers, including custom ones.
 * @param customParsers An array of user-defined custom parsers.
 * @returns A function that takes a text string and returns a transaction object with rule name, or null.
 */
export const parseWithRules = async (customParsers: CustomParser[]): Promise<(text: string) => RuleParseResult> => {
    logService.addLog(`Loading ${customParsers.length} custom parser(s).`, 'info');
    
    const dynamicParsers = customParsers
        .map(parserDef => {
            const parser = createDynamicParser(parserDef);
            if (parser) {
                return { name: parserDef.name, parser };
            }
            return null;
        })
        .filter((p): p is { name: string; parser: ParserFunction } => p !== null);

    const allParsers = [...dynamicParsers, ...builtInParsers];

    return (text: string) => {
        for (const { name, parser } of allParsers) {
            const result = parser(text);
            if (result) {
                return { data: result, ruleName: name };
            }
        }
        return null;
    };
};