
import { GoogleGenAI, Type } from "@google/genai";
import { Transaction, Expense } from "../types";
import { logService } from "./logService";

// Assume process.env.API_KEY is configured in the environment
const API_KEY = process.env.API_KEY;

if (!API_KEY) {
  console.warn("API_KEY environment variable not set. AI features will be disabled.");
  logService.addLog("API_KEY environment variable not set. AI features will be disabled.", 'error');
}

const ai = new GoogleGenAI({ apiKey: API_KEY! });

const transactionSchema = {
    type: Type.OBJECT,
    properties: {
      merchant: {
        type: Type.STRING,
        description: "The name of the merchant, service provider, or person.",
      },
      amount: {
        type: Type.NUMBER,
        description: "The transaction amount as a positive number.",
      },
      date: {
        type: Type.STRING,
        description: "The date of the transaction in YYYY-MM-DD format. Use the current year. If no date is specified, use today's date.",
      },
    },
    required: ["merchant", "amount", "date"]
};

const singleTransactionSchema = {
    type: Type.OBJECT,
    properties: {
      merchant: {
        type: Type.STRING,
        description: "The name of the merchant or store. If not found, return an empty string.",
      },
      amount: {
        type: Type.NUMBER,
        description: "The total transaction amount as a positive number. If not found, return 0.",
      },
      date: {
        type: Type.STRING,
        description: "The date of the transaction in YYYY-MM-DD format. Use the current year if not specified. If not found, return an empty string.",
      },
    },
    required: ["merchant", "amount", "date"]
};

export const parseTransactionsFromText = async (text: string): Promise<Omit<Transaction, 'id'>[]> => {
    if (!API_KEY) {
        throw new Error("API_KEY not configured.");
    }
    try {
        logService.addLog("Calling Gemini API to parse transactions.", 'api');
        // Fix: Use 'gemini-3-flash-preview' for basic text extraction tasks
        const response = await ai.models.generateContent({
            model: "gemini-3-flash-preview",
            contents: `Parse the following text which should contain a single financial transaction notification. Extract the merchant, amount, and date. Assume the currency is Indian Rupees (₹) unless another currency is explicitly mentioned. If the text is not a valid financial transaction, return an empty array.\n\n---\n\n${text}`,
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.ARRAY,
                    items: transactionSchema,
                },
            },
        });

        const jsonString = response.text.trim();
        const parsedTransactions = JSON.parse(jsonString);

        if (Array.isArray(parsedTransactions)) {
            logService.addLog(`Gemini API returned ${parsedTransactions.length} potential transaction(s).`, 'api');
            // Basic validation to ensure the returned data matches our expected structure
            return parsedTransactions.filter(t => t.merchant && typeof t.amount === 'number' && t.date);
        }
        logService.addLog("Gemini API returned a non-array response.", 'api');
        return [];
    } catch(error: any) {
        logService.addLog(`Gemini API call failed: ${error.message}`, 'error');
        console.error("Error parsing transactions with Gemini:", error);
        throw new Error("Failed to understand the provided messages. Please check the format and try again.");
    }
};

export const parseTransactionFromReceipt = async (base64ImageData: string): Promise<Partial<Omit<Transaction, 'id'>>> => {
    if (!API_KEY) {
        throw new Error("API_KEY not configured.");
    }
    try {
        logService.addLog("Calling Gemini API to parse receipt image.", 'api');
        
        const imagePart = {
          inlineData: {
            mimeType: 'image/jpeg',
            data: base64ImageData,
          },
        };

        const textPart = {
            text: "Analyze this receipt image and extract the merchant name, the total amount paid, and the transaction date. Respond in the requested JSON format. If a value cannot be found, use an empty string for the merchant or date, and 0 for the amount.",
        };

        // Fix: Use 'gemini-3-flash-preview' for multimodal content extraction
        const response = await ai.models.generateContent({
            model: "gemini-3-flash-preview",
            contents: { parts: [textPart, imagePart] },
            config: {
                responseMimeType: "application/json",
                responseSchema: singleTransactionSchema,
            },
        });

        const jsonString = response.text.trim();
        const parsedTransaction = JSON.parse(jsonString);
        
        logService.addLog(`Gemini API returned receipt data: ${jsonString}`, 'api');
        
        return {
            merchant: parsedTransaction.merchant || '',
            amount: parsedTransaction.amount || undefined, // Use undefined so the form shows placeholder
            date: parsedTransaction.date || '',
        };

    } catch(error: any) {
        logService.addLog(`Gemini API call for receipt failed: ${error.message}`, 'error');
        console.error("Error parsing receipt with Gemini:", error);
        throw new Error("Failed to understand the receipt image. Please try again or enter details manually.");
    }
};

export const getSpendingInsights = async (expenses: Expense[]): Promise<string> => {
    if (!API_KEY) {
        throw new Error("API_KEY not configured.");
    }
    try {
        logService.addLog(`Calling Gemini API for spending insights on ${expenses.length} expenses.`, 'api');
        
        const prompt = `
            You are a friendly and insightful financial assistant.
            Analyze the following list of a user's expenses for the specified period.
            Provide a short, easy-to-read summary of their spending habits.
            Your response should be structured with the following sections:

            ### Spending Summary
            A brief, friendly overview of the total spending.

            ### Top Categories
            List the top 2-3 spending categories with their total amounts.

            ### Noteworthy Observations
            Point out any unusual or high spending patterns, or a high frequency of small purchases that add up. If nothing is unusual, mention that spending seems consistent.

            ### Savings Tip
            Offer one specific, actionable tip for saving money based on their actual spending data.

            ### Keep it Up!
            End with a brief, encouraging, and positive note.

            Here is the expense data in JSON format:
            ${JSON.stringify(expenses, null, 2)}
        `;

        // Fix: Use recommended model 'gemini-3-pro-preview' for complex text tasks involving reasoning/analysis
        const response = await ai.models.generateContent({
            model: "gemini-3-pro-preview",
            contents: prompt,
        });
        
        const insights = response.text;
        logService.addLog("Successfully received spending insights from Gemini.", 'api');
        return insights;

    } catch (error: any) {
        logService.addLog(`Gemini API call for insights failed: ${error.message}`, 'error');
        console.error("Error getting spending insights from Gemini:", error);
        throw new Error("Failed to generate insights. The AI service may be temporarily unavailable.");
    }
};
