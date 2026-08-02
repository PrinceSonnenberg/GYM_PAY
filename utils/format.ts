
export const getCurrencySymbol = (currency?: string): string => {
    if (!currency) return 'R';
    if (currency.includes('ZAR') || currency.includes('R')) return 'R';
    if (currency.includes('EUR') || currency.includes('€')) return '€';
    if (currency.includes('GBP') || currency.includes('£')) return '£';
    if (currency.includes('USD') || currency.includes('CAD') || currency.includes('$')) return '$';
    return 'R';
};

export const formatCurrency = (n: number, currency: string = 'ZAR (R)'): string => {
    const sign = n < 0 ? '-' : '';
    const symbol = getCurrencySymbol(currency);
    return `${sign}${symbol}${Math.abs(n).toFixed(2)}`;
};

export const invoiceSubtotal = (items: { amount: number }[]): number =>
    items.reduce((sum, item) => sum + item.amount, 0);
