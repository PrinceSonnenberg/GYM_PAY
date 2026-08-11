
export const getCurrencySymbol = (currency?: string): string => {
    if (!currency) return 'R';
    if (currency.includes('ZAR') || currency.includes('R')) return 'R';
    if (currency.includes('EUR') || currency.includes('€')) return '€';
    if (currency.includes('GBP') || currency.includes('£')) return '£';
    if (currency.includes('USD') || currency.includes('CAD') || currency.includes('$')) return '$';
    return 'R';
};

export const formatCurrency = (n: number | string | undefined | null, currency: string = 'ZAR (R)'): string => {
    const num = typeof n === 'number' ? n : parseFloat(String(n ?? 0));
    const safeNum = Number.isNaN(num) || !Number.isFinite(num) ? 0 : num;
    const sign = safeNum < 0 ? '-' : '';
    const symbol = getCurrencySymbol(currency);
    return `${sign}${symbol}${Math.abs(safeNum).toFixed(2)}`;
};

export const invoiceSubtotal = (items: { amount?: number | string; rate?: number | string; sessions?: number | string }[] | undefined | null): number => {
    if (!Array.isArray(items)) return 0;
    return items.reduce((sum, item: any) => {
        let amt = typeof item?.amount === 'number' ? item.amount : parseFloat(String(item?.amount ?? ''));
        if (Number.isNaN(amt) || item?.amount === undefined || item?.amount === null) {
            const rate = typeof item?.rate === 'number' ? item.rate : parseFloat(String(item?.rate ?? 0));
            const sessions = typeof item?.sessions === 'number' ? item.sessions : parseFloat(String(item?.sessions ?? 1));
            amt = (Number.isNaN(rate) ? 0 : rate) * (Number.isNaN(sessions) ? 1 : sessions);
        }
        return sum + (Number.isNaN(amt) ? 0 : amt);
    }, 0);
};

export const formatDateSA = (dateStr: string | null | undefined): string => {
    if (!dateStr) return '';
    const parts = dateStr.split('-');
    if (parts.length === 3) {
        const [year, month, day] = parts;
        return `${day}/${month}/${year}`;
    }
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    return `${day}/${month}/${year}`;
};

