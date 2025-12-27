import { Expense } from '../types';
import { getStartOfWeek, toLocalDateString } from './dateUtils';

type TrendPeriod = 'day' | 'week' | 'month';
export interface MultiTrendDataPoint {
    date: string;
    [category: string]: number | string; // 'date' is string, others are numbers
}

const getStartOfMonth = (date: Date): Date => {
    const d = new Date(date);
    d.setDate(1);
    d.setHours(0, 0, 0, 0);
    return d;
}


export const aggregateMultiCategoryExpenses = (
    expenses: Expense[], 
    categories: string[], 
    period: TrendPeriod
): MultiTrendDataPoint[] => {
    if (expenses.length === 0 || categories.length === 0) {
        return [];
    }
        
    const aggregationMap = new Map<string, { [category: string]: number }>();
    const isOverall = categories.includes('overall');

    const relevantExpenses = isOverall 
        ? expenses 
        : expenses.filter(exp => categories.includes(exp.category));

    for (const expense of relevantExpenses) {
        // This correctly interprets the date string in the user's local timezone.
        const [year, month, day] = expense.date.split('-').map(Number);
        const expenseDate = new Date(year, month - 1, day);

        let periodStart: Date;

        switch (period) {
            case 'day':
                periodStart = expenseDate;
                break;
            case 'week':
                periodStart = getStartOfWeek(expenseDate);
                break;
            case 'month':
                periodStart = getStartOfMonth(expenseDate);
                break;
        }
        
        // FIX: Use a timezone-agnostic 'YYYY-MM-DD' string as the key
        // This avoids issues where local dates are converted to the previous day in UTC.
        const key = toLocalDateString(periodStart);
        const currentTotals = aggregationMap.get(key) || {};

        if (isOverall) {
            currentTotals['overall'] = (currentTotals['overall'] || 0) + expense.amount;
        } else {
            currentTotals[expense.category] = (currentTotals[expense.category] || 0) + expense.amount;
        }
        
        aggregationMap.set(key, currentTotals);
    }
    
    const aggregatedData = Array.from(aggregationMap.entries()).map(([date, totals]) => {
        const point: MultiTrendDataPoint = { date };
        for (const cat of categories) {
            point[cat] = totals[cat] || 0;
        }
        return point;
    });

    // Sorting works correctly with 'YYYY-MM-DD' strings
    return aggregatedData.sort((a, b) => a.date.localeCompare(b.date));
};

export const formatTrendDate = (dateString: string, period: TrendPeriod): string => {
    // FIX: Safely parse 'YYYY-MM-DD' string into a local date object
    // This prevents new Date('YYYY-MM-DD') from being interpreted as UTC midnight.
    const [year, month, day] = dateString.split('-').map(Number);
    const date = new Date(year, month - 1, day);

    switch (period) {
        case 'day':
             // Format using the local timezone
            return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        case 'week':
            const endDate = new Date(date);
            // Use local date methods instead of UTC methods
            endDate.setDate(date.getDate() + 6);

            const startMonth = date.toLocaleDateString('en-US', { month: 'short' });
            const endMonth = endDate.toLocaleDateString('en-US', { month: 'short' });
            const startDay = date.getDate();
            const endDay = endDate.getDate();
            
            if (startMonth === endMonth) {
                return `${startMonth} ${startDay} - ${endDay}`;
            } else {
                return `${startMonth} ${startDay} - ${endMonth} ${endDay}`;
            }
        case 'month':
            // Format using the local timezone
            return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
    }
};