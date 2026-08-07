import React, { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import Icon from '../components/Icon';
import PageHeader from '../components/PageHeader';
import { useData } from '../context/DataContext';
import { formatCurrency, invoiceSubtotal } from '../utils/format';
import { Invoice } from '../types';

const StatisticsPage: React.FC = () => {
    const navigate = useNavigate();
    const { clients, invoices, expenses } = useData();

    // Invoices Paid vs Pending vs Overdue
    const totalClients = clients.length;
    const totalInvoicesSent = invoices.length;
    
    let paidCount = 0;
    let pendingCount = 0;
    let overdueCount = 0;
    let paidValue = 0;
    let pendingValue = 0;
    let overdueValue = 0;

    const todayStr = new Date().toISOString().slice(0, 10);

    const invoiceTotal = (inv: Invoice) => {
        const subtotal = invoiceSubtotal(inv.items);
        return subtotal + subtotal * inv.taxRate;
    };

    invoices.forEach(inv => {
        const val = invoiceTotal(inv);
        if (inv.status === 'paid') {
            paidCount++;
            paidValue += val;
        } else {
            // Status is 'sent' or 'draft' (our app mainly uses 'sent')
            if (inv.dueDate && inv.dueDate < todayStr) {
                overdueCount++;
                overdueValue += val;
            } else {
                pendingCount++;
                pendingValue += val;
            }
        }
    });

    // Grouping by Month
    const monthlyData = useMemo(() => {
        const data: Record<string, { income: number; expense: number; label: string; monthSort: string }> = {};

        // Helper to format YYYY-MM
        const addMonth = (dateStr: string) => {
            if (!dateStr) return null;
            const d = new Date(dateStr);
            if (isNaN(d.getTime())) return null;
            const yyyy = d.getFullYear();
            const mm = String(d.getMonth() + 1).padStart(2, '0');
            const key = `${yyyy}-${mm}`;
            if (!data[key]) {
                const monthName = d.toLocaleString('default', { month: 'short' });
                data[key] = { income: 0, expense: 0, label: `${monthName} ${yyyy}`, monthSort: key };
            }
            return key;
        };

        invoices.forEach(inv => {
            if (inv.status === 'paid') {
                const key = addMonth(inv.issuedDate || inv.dueDate || todayStr);
                if (key) {
                    data[key].income += invoiceTotal(inv);
                }
            }
        });

        expenses.forEach(exp => {
            const key = addMonth(exp.date);
            if (key) {
                data[key].expense += exp.amount;
            }
        });

        // Sort descending
        return Object.values(data).sort((a, b) => b.monthSort.localeCompare(a.monthSort));
    }, [invoices, expenses, todayStr]);

    return (
        <div className="flex flex-col h-full bg-background font-inter text-text-main pb-24">
            {/* Header */}
            <PageHeader
                title="STATISTICS"
                eyebrow="Business Overview"
                onBack={() => navigate(-1)}
            />

            <main className="flex-1 px-5 space-y-6 pt-6">
                
                {/* General Stats */}
                <section className="grid grid-cols-2 gap-4">
                    <div className="plate flex flex-col justify-between gap-3 bg-white border-2 border-ink p-5">
                        <div className="flex items-center gap-2 text-text-muted">
                            <Icon name="groups" className="text-[18px]" />
                            <p className="text-[10px] font-bold uppercase tracking-widest">Total Clients</p>
                        </div>
                        <p className="font-display text-3xl tracking-wide text-ink">{totalClients}</p>
                    </div>
                    <div className="plate flex flex-col justify-between gap-3 bg-white border-2 border-ink p-5">
                        <div className="flex items-center gap-2 text-text-muted">
                            <Icon name="receipt_long" className="text-[18px]" />
                            <p className="text-[10px] font-bold uppercase tracking-widest">Invoices Sent</p>
                        </div>
                        <p className="font-display text-3xl tracking-wide text-ink">{totalInvoicesSent}</p>
                    </div>
                </section>

                {/* Invoice Status Breakdown */}
                <section className="plate bg-surface p-6 border-2 border-ink">
                    <h3 className="font-display text-lg tracking-wide mb-4 text-ink">INVOICE STATUS</h3>
                    
                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="flex size-10 items-center justify-center rounded-xl bg-volt-soft text-emerald-600 border border-emerald-200">
                                    <Icon name="check_circle" className="text-[20px]" />
                                </div>
                                <div>
                                    <p className="font-bold text-sm text-text-main">Paid Invoices</p>
                                    <p className="text-xs text-text-muted">{paidCount} received</p>
                                </div>
                            </div>
                            <span className="font-mono font-bold text-sm">{formatCurrency(paidValue)}</span>
                        </div>

                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="flex size-10 items-center justify-center rounded-xl bg-signal-soft text-signal border border-signal/20">
                                    <Icon name="pending_actions" className="text-[20px]" />
                                </div>
                                <div>
                                    <p className="font-bold text-sm text-text-main">Pending (On Time)</p>
                                    <p className="text-xs text-text-muted">{pendingCount} awaiting</p>
                                </div>
                            </div>
                            <span className="font-mono font-bold text-sm">{formatCurrency(pendingValue)}</span>
                        </div>

                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="flex size-10 items-center justify-center rounded-xl bg-danger-soft text-danger border border-danger/20">
                                    <Icon name="error" className="text-[20px]" />
                                </div>
                                <div>
                                    <p className="font-bold text-sm text-text-main">Overdue</p>
                                    <p className="text-xs text-danger font-medium">{overdueCount} past due</p>
                                </div>
                            </div>
                            <span className="font-mono font-bold text-sm text-danger">{formatCurrency(overdueValue)}</span>
                        </div>
                    </div>
                </section>

                {/* Monthly Income vs Expenses */}
                <section>
                    <h3 className="font-display text-lg tracking-wide mb-4 text-ink px-1">MONTHLY TRENDS</h3>
                    
                    {monthlyData.length === 0 ? (
                        <div className="text-center p-6 bg-white rounded-2xl border-2 border-ink text-text-muted text-sm font-medium">
                            No financial data available yet.
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {monthlyData.map(month => (
                                <div key={month.monthSort} className="bg-white rounded-2xl border-2 border-ink p-5 flex flex-col gap-4">
                                    <div className="flex items-center justify-between pb-3 border-b-2 border-border-light">
                                        <h4 className="font-bold text-sm uppercase tracking-wide text-ink">{month.label}</h4>
                                        <div className={`px-2 py-1 rounded-md text-[10px] font-bold tracking-widest ${month.income - month.expense >= 0 ? 'bg-volt-soft text-emerald-700' : 'bg-danger-soft text-danger'}`}>
                                            PROFIT: {formatCurrency(month.income - month.expense)}
                                        </div>
                                    </div>
                                    
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <p className="text-[10px] font-bold uppercase tracking-widest text-text-muted mb-1">Income</p>
                                            <p className="font-mono font-bold text-emerald-600">{formatCurrency(month.income)}</p>
                                        </div>
                                        <div>
                                            <p className="text-[10px] font-bold uppercase tracking-widest text-text-muted mb-1">Expenses</p>
                                            <p className="font-mono font-bold text-danger">{formatCurrency(month.expense)}</p>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </section>
                
            </main>
        </div>
    );
};

export default StatisticsPage;
