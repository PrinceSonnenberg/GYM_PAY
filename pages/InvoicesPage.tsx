import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Icon from '../components/Icon';
import BottomNav from '../components/BottomNav';
import { useData } from '../context/DataContext';
import { formatCurrency, invoiceSubtotal } from '../utils/format';
import { downloadInvoicePdf } from '../utils/pdf';
import { Invoice } from '../types';

const InvoicesPage: React.FC = () => {
    const navigate = useNavigate();
    const { invoices, clients, markInvoicePaid, deleteInvoice, sendInvoiceReminder, settings } = useData();
    const [filter, setFilter] = useState<'all' | 'sent' | 'paid'>('all');
    const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
    const [reminderToast, setReminderToast] = useState<string | null>(null);

    const todayStr = new Date().toISOString().slice(0, 10);

    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    const clientFor = (clientId: string) => clients.find(c => c.id === clientId);

    const calcTotal = (inv: Invoice) => {
        const sub = invoiceSubtotal(inv.items);
        return sub + sub * inv.taxRate;
    };

    const filteredInvoices = invoices.filter(inv => {
        if (filter === 'all') return true;
        return inv.status === filter;
    });

    const totalPaid = invoices.filter(i => i.status === 'paid').reduce((sum, i) => sum + calcTotal(i), 0);
    const totalPending = invoices.filter(i => i.status === 'sent').reduce((sum, i) => sum + calcTotal(i), 0);
    
    const billedThisMonth = invoices.reduce((sum, inv) => {
        const d = new Date(inv.issuedDate || inv.dueDate || now);
        if (d.getMonth() === currentMonth && d.getFullYear() === currentYear) {
            return sum + calcTotal(inv);
        }
        return sum;
    }, 0);

    const [showPdfView, setShowPdfView] = useState(false);

    return (
        <div className="flex flex-col min-h-screen bg-background font-inter text-text-main">
            <header className="sticky top-0 z-30 bg-ink px-5 py-5 flex items-center justify-between">
                <div>
                    <p className="text-[10px] font-bold uppercase tracking-widest text-white/50">Billing Overview</p>
                    <h1 className="font-display text-2xl text-white tracking-wide">INVOICES</h1>
                </div>
                <button
                    onClick={() => navigate('/invoice')}
                    className="flex h-10 px-4 items-center justify-center gap-1 rounded-full bg-volt text-ink font-bold uppercase text-xs tracking-wide hover:bg-volt/80 transition-colors"
                >
                    <Icon name="add" className="text-[18px]" />
                    <span>New Invoice</span>
                </button>
            </header>

            {/* Selected Invoice Preview Modal */}
            {selectedInvoice && (
                <div className="fixed inset-0 z-50 bg-ink/70 backdrop-blur-sm flex items-center justify-center p-4">
                    <div className="w-full max-w-sm bg-white rounded-3xl border-2 border-ink overflow-hidden shadow-2xl animate-fadeIn flex flex-col max-h-[90vh]">
                        <div className="bg-ink p-5 text-white flex justify-between items-center border-b-2 border-ink">
                            <div>
                                <h3 className="font-display text-lg tracking-wide">INVOICE #{selectedInvoice.id.slice(-6).toUpperCase()}</h3>
                                <p className="text-xs text-white/60">Issued: {selectedInvoice.issuedDate}</p>
                            </div>
                            <button onClick={() => setSelectedInvoice(null)} className="text-white/70 hover:text-white">
                                <Icon name="close" />
                            </button>
                        </div>

                        <div className="p-5 overflow-y-auto space-y-4">
                            <div className="flex justify-between items-center p-3 rounded-xl bg-background border border-border-light">
                                <div>
                                    <p className="text-[10px] uppercase font-bold text-text-muted">Billed To</p>
                                    <p className="font-bold text-sm">{clientFor(selectedInvoice.clientId)?.name || 'Unknown Client'}</p>
                                    {clientFor(selectedInvoice.clientId)?.email && (
                                        <p className="text-xs text-text-muted">{clientFor(selectedInvoice.clientId)?.email}</p>
                                    )}
                                </div>
                                <span className={`text-[10px] font-bold uppercase tracking-wide px-3 py-1 rounded-full ${
                                    selectedInvoice.status === 'paid' ? 'bg-signal-soft text-signal' : 'bg-primary-soft text-primary'
                                }`}>
                                    {selectedInvoice.status}
                                </span>
                            </div>

                            <div className="space-y-2">
                                <p className="text-[10px] font-bold uppercase tracking-widest text-text-muted">Services Breakdown</p>
                                {selectedInvoice.items.map((item) => (
                                    <div key={item.id} className="flex justify-between items-center text-xs py-2 border-b border-border-light last:border-none">
                                        <div>
                                            <p className="font-bold">{item.title}</p>
                                            <p className="text-[10px] text-text-muted">{item.details}</p>
                                        </div>
                                        <span className="font-mono font-bold">{formatCurrency(item.amount)}</span>
                                    </div>
                                ))}
                            </div>

                            {selectedInvoice.notes && (
                                <div className="p-3 bg-background rounded-xl text-xs space-y-1 border border-border-light">
                                    <p className="text-[10px] font-bold uppercase text-text-muted">Notes</p>
                                    <p className="text-text-main italic">{selectedInvoice.notes}</p>
                                </div>
                            )}

                            <div className="bg-ink p-4 rounded-xl text-white flex justify-between items-center">
                                <span className="font-display text-sm">TOTAL AMOUNT</span>
                                <span className="font-mono text-volt font-bold text-xl">{formatCurrency(calcTotal(selectedInvoice))}</span>
                            </div>
                        </div>

                        <div className="p-4 bg-background border-t-2 border-ink space-y-2">
                            <button
                                onClick={() => setShowPdfView(true)}
                                className="w-full py-2.5 rounded-full bg-ink text-volt border-2 border-ink font-bold uppercase text-xs tracking-wide hover:bg-black transition-colors flex items-center justify-center gap-2 shadow-sm"
                            >
                                <Icon name="picture_as_pdf" />
                                <span>Preview & Download PDF</span>
                            </button>

                            {selectedInvoice.status === 'sent' && (
                                <>
                                    <button
                                        onClick={() => {
                                            markInvoicePaid(selectedInvoice.id);
                                            setSelectedInvoice(prev => prev ? { ...prev, status: 'paid' } : null);
                                        }}
                                        className="w-full py-3 rounded-full bg-volt text-ink border-2 border-ink font-bold uppercase text-xs tracking-wide hover:bg-volt/80 transition-colors flex items-center justify-center gap-2"
                                    >
                                        <Icon name="payments" />
                                        <span>Mark as Paid</span>
                                    </button>

                                    <button
                                        onClick={() => {
                                            sendInvoiceReminder(selectedInvoice.id);
                                            const cName = clientFor(selectedInvoice.clientId)?.name || 'Customer';
                                            setReminderToast(`Overdue reminder sent to ${cName} via Email & SMS!`);
                                            setSelectedInvoice(prev => prev ? {
                                                ...prev,
                                                lastReminderSentAt: todayStr,
                                                remindersCount: (prev.remindersCount || 0) + 1
                                            } : null);
                                            setTimeout(() => setReminderToast(null), 4000);
                                        }}
                                        className="w-full py-2.5 rounded-full bg-primary text-white border-2 border-ink font-bold uppercase text-xs tracking-wide hover:bg-primary-hover transition-colors flex items-center justify-center gap-2 shadow-sm"
                                    >
                                        <Icon name="notifications_active" />
                                        <span>
                                            {selectedInvoice.remindersCount 
                                                ? `Send Overdue Reminder (${selectedInvoice.remindersCount} Sent)`
                                                : 'Send Overdue Reminder'}
                                        </span>
                                    </button>
                                </>
                            )}

                            <button
                                onClick={() => {
                                    if (confirm('Delete this invoice?')) {
                                        deleteInvoice(selectedInvoice.id);
                                        setSelectedInvoice(null);
                                    }
                                }}
                                className="w-full py-2.5 rounded-full border-2 border-danger text-danger font-bold uppercase text-xs tracking-wide hover:bg-danger-soft transition-colors flex items-center justify-center gap-2"
                            >
                                <Icon name="delete" />
                                <span>Delete Invoice</span>
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* PDF Printable Invoice Modal */}
            {showPdfView && selectedInvoice && (
                <div className="fixed inset-0 z-50 bg-ink/80 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
                    <div className="w-full max-w-xl bg-white rounded-3xl border-2 border-ink shadow-2xl overflow-hidden my-auto flex flex-col max-h-[95vh]">
                        {/* Action Header */}
                        <div className="bg-ink p-4 text-white flex justify-between items-center border-b-2 border-ink shrink-0">
                            <div className="flex items-center gap-2">
                                <Icon name="picture_as_pdf" className="text-volt text-2xl" />
                                <div>
                                    <h3 className="font-display text-base tracking-wide">OFFICIAL INVOICE PDF</h3>
                                    <p className="text-[10px] text-white/60">Ready for Reconciliation & Printing</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-2">
                                <button
                                    onClick={() => downloadInvoicePdf('printable-invoice', `Invoice_${selectedInvoice.id.slice(-8)}`)}
                                    className="px-3.5 py-2 rounded-full bg-volt text-ink font-bold uppercase text-xs flex items-center gap-1.5 hover:bg-volt/80 transition-all shadow-sm active:scale-95"
                                >
                                    <Icon name="download" className="text-[16px]" />
                                    <span>Download PDF</span>
                                </button>
                                <button
                                    onClick={() => window.print()}
                                    className="p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-all"
                                    title="Print Document"
                                >
                                    <Icon name="print" className="text-[18px]" />
                                </button>
                                <button
                                    onClick={() => setShowPdfView(false)}
                                    className="text-white/70 hover:text-white p-1"
                                >
                                    <Icon name="close" />
                                </button>
                            </div>
                        </div>

                        {/* Printable Document Body */}
                        <div className="p-8 overflow-y-auto space-y-6 text-ink font-inter bg-white" id="printable-invoice">
                            {/* Document Header with Logo & Business Profile */}
                            <div className="flex justify-between items-start border-b-2 border-ink pb-6">
                                <div className="space-y-2">
                                    {settings.profile.logoUrl ? (
                                        <img src={settings.profile.logoUrl} alt="Business Logo" className="h-14 max-w-xs object-contain" />
                                    ) : (
                                        <div className="size-12 rounded-2xl bg-ink text-volt font-display text-2xl flex items-center justify-center border-2 border-ink">
                                            {settings.profile.name.charAt(0)}
                                        </div>
                                    )}
                                    <div>
                                        <h2 className="font-display text-xl tracking-wide uppercase">{settings.profile.name || 'Alex Sonnenberg'}</h2>
                                        <p className="text-xs font-bold text-primary">{settings.profile.title || 'Strength & Conditioning Coach'}</p>
                                        <p className="text-xs text-text-muted">{settings.profile.email} • {settings.profile.phone}</p>
                                    </div>
                                </div>

                                <div className="text-right space-y-1">
                                    <span className={`inline-block px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${
                                        selectedInvoice.status === 'paid' ? 'bg-signal text-white' : 'bg-danger text-white'
                                    }`}>
                                        INVOICE: {selectedInvoice.status.toUpperCase()}
                                    </span>
                                    <p className="font-mono text-sm font-bold text-ink">#{selectedInvoice.id.slice(-8).toUpperCase()}</p>
                                    <p className="text-xs text-text-muted">Issued: <strong>{selectedInvoice.issuedDate}</strong></p>
                                    <p className="text-xs text-text-muted">Due Date: <strong>{selectedInvoice.dueDate}</strong></p>
                                </div>
                            </div>

                            {/* Customer Billed To */}
                            <div className="p-4 rounded-2xl bg-background border border-border-light flex justify-between items-center">
                                <div>
                                    <p className="text-[10px] font-bold uppercase tracking-widest text-text-muted">Billed Customer</p>
                                    <h4 className="font-bold text-base">{clientFor(selectedInvoice.clientId)?.name || 'Valued Client'}</h4>
                                    <p className="text-xs text-text-muted">{clientFor(selectedInvoice.clientId)?.email || 'Client Email N/A'}</p>
                                    {clientFor(selectedInvoice.clientId)?.phone && (
                                        <p className="text-xs text-text-muted">{clientFor(selectedInvoice.clientId)?.phone}</p>
                                    )}
                                </div>
                                <div className="text-right">
                                    <p className="text-[10px] font-bold uppercase tracking-widest text-text-muted">Payment Term</p>
                                    <p className="text-xs font-bold text-ink">Net 14 Days</p>
                                </div>
                            </div>

                            {/* Itemized Table */}
                            <div>
                                <p className="text-[10px] font-bold uppercase tracking-widest text-text-muted mb-2">Itemized Services & Credits</p>
                                <table className="w-full border-collapse text-xs">
                                    <thead>
                                        <tr className="border-b-2 border-ink bg-background text-left">
                                            <th className="py-2.5 px-3 font-bold uppercase">Description</th>
                                            <th className="py-2.5 px-3 font-bold uppercase text-center">Qty / Sessions</th>
                                            <th className="py-2.5 px-3 font-bold uppercase text-right">Rate</th>
                                            <th className="py-2.5 px-3 font-bold uppercase text-right">Amount</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {selectedInvoice.items.map((item) => (
                                            <tr key={item.id} className="border-b border-border-light">
                                                <td className="py-3 px-3">
                                                    <p className="font-bold text-ink">{item.title}</p>
                                                    <p className="text-[10px] text-text-muted">{item.details}</p>
                                                </td>
                                                <td className="py-3 px-3 text-center font-mono">{item.sessions}</td>
                                                <td className="py-3 px-3 text-right font-mono">{formatCurrency(item.rate)}</td>
                                                <td className={`py-3 px-3 text-right font-mono font-bold ${item.amount < 0 ? 'text-emerald-700' : 'text-ink'}`}>
                                                    {formatCurrency(item.amount)}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>

                            {/* Totals Calculation */}
                            <div className="flex justify-end pt-2">
                                <div className="w-64 space-y-2 text-xs">
                                    <div className="flex justify-between text-text-muted font-medium">
                                        <span>Subtotal:</span>
                                        <span className="font-mono">{formatCurrency(invoiceSubtotal(selectedInvoice.items))}</span>
                                    </div>
                                    {selectedInvoice.taxRate > 0 && (
                                        <div className="flex justify-between text-text-muted font-medium">
                                            <span>Tax ({(selectedInvoice.taxRate * 100).toFixed(0)}%):</span>
                                            <span className="font-mono">{formatCurrency(invoiceSubtotal(selectedInvoice.items) * selectedInvoice.taxRate)}</span>
                                        </div>
                                    )}
                                    <div className="flex justify-between items-center pt-2 border-t-2 border-ink font-bold text-sm text-ink">
                                        <span>Total Balance Due:</span>
                                        <span className="font-mono text-base font-extrabold text-primary">{formatCurrency(calcTotal(selectedInvoice))}</span>
                                    </div>
                                </div>
                            </div>

                            {/* Payment Instructions */}
                            <div className="p-4 rounded-2xl bg-ink text-white text-xs space-y-1">
                                <p className="text-[10px] font-bold uppercase text-volt tracking-widest">Payment Instructions</p>
                                <p className="text-white/80">Please transfer payment to <strong>{settings.payout.method}</strong> linked account.</p>
                                <p className="text-[10px] text-white/50 pt-1">Thank you for training with us!</p>
                            </div>
                        </div>

                        <div className="p-4 bg-background border-t-2 border-ink">
                            <button
                                onClick={() => setShowPdfView(false)}
                                className="w-full py-3 rounded-full bg-ink text-white font-bold uppercase text-xs tracking-wide hover:bg-black transition-colors"
                            >
                                Close PDF Preview
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <main className="flex-1 p-5 pb-28 space-y-6">
                {reminderToast && (
                    <div className="p-3.5 rounded-2xl bg-primary text-white text-xs font-bold flex items-center justify-between shadow-lg animate-fadeIn border-2 border-ink">
                        <div className="flex items-center gap-2">
                            <Icon name="notifications_active" className="text-volt text-[18px]" />
                            <span>{reminderToast}</span>
                        </div>
                        <button onClick={() => setReminderToast(null)}><Icon name="close" /></button>
                    </div>
                )}

                {/* Metrics */}
                <div className="grid grid-cols-3 gap-2.5">
                    <div className="p-3.5 rounded-2xl bg-white border-2 border-ink flex flex-col justify-between shadow-sm">
                        <div className="flex items-center gap-1 text-text-muted">
                            <Icon name="receipt_long" className="text-[14px]" />
                            <p className="text-[9px] font-bold uppercase tracking-wider">Billed This Month</p>
                        </div>
                        <p className="font-display text-xl text-ink mt-1.5 leading-none">{formatCurrency(billedThisMonth)}</p>
                    </div>

                    <div className="p-3.5 rounded-2xl bg-ink text-white border-2 border-ink flex flex-col justify-between shadow-sm">
                        <div className="flex items-center gap-1 text-white/60">
                            <Icon name="payments" className="text-[14px]" />
                            <p className="text-[9px] font-bold uppercase tracking-wider">Paid</p>
                        </div>
                        <p className="font-display text-xl text-volt mt-1.5 leading-none">{formatCurrency(totalPaid)}</p>
                    </div>

                    <div className="p-3.5 rounded-2xl bg-white border-2 border-ink flex flex-col justify-between shadow-sm">
                        <div className="flex items-center gap-1 text-text-muted">
                            <Icon name="pending_actions" className="text-[14px]" />
                            <p className="text-[9px] font-bold uppercase tracking-wider">Outstanding</p>
                        </div>
                        <p className="font-display text-xl text-primary mt-1.5 leading-none">{formatCurrency(totalPending)}</p>
                    </div>
                </div>

                {/* Filters */}
                <div className="flex gap-2 bg-white p-1.5 rounded-2xl border-2 border-ink">
                    {(['all', 'sent', 'paid'] as const).map(tab => (
                        <button
                            key={tab}
                            onClick={() => setFilter(tab)}
                            className={`flex-1 py-2 rounded-xl text-xs font-bold uppercase tracking-wide transition-colors ${
                                filter === tab ? 'bg-ink text-white' : 'text-text-muted hover:text-ink'
                            }`}
                        >
                            {tab === 'all' ? 'All Invoices' : tab}
                        </button>
                    ))}
                </div>

                {/* List */}
                {filteredInvoices.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-12 text-center bg-white rounded-2xl border-2 border-ink p-6">
                        <Icon name="receipt_long" className="text-5xl text-text-muted mb-3" />
                        <h3 className="font-display text-lg tracking-wide">NO INVOICES FOUND</h3>
                        <p className="text-xs text-text-muted mt-1 max-w-xs">Create your first invoice to bill customers for training sessions or meal plans.</p>
                        <button
                            onClick={() => navigate('/invoice')}
                            className="mt-4 px-5 py-2.5 rounded-full bg-primary text-white font-bold uppercase text-xs tracking-wide border-2 border-ink shadow-pop"
                        >
                            Create Invoice
                        </button>
                    </div>
                ) : (
                    <div className="space-y-3">
                        {filteredInvoices.map(inv => {
                            const client = clientFor(inv.clientId);
                            const total = calcTotal(inv);
                            const isOverdue = inv.status === 'sent' && inv.dueDate < todayStr;

                            return (
                                <div
                                    key={inv.id}
                                    onClick={() => setSelectedInvoice(inv)}
                                    className={`p-4 rounded-2xl bg-white border-2 hover:border-primary cursor-pointer transition-all space-y-3 shadow-card ${
                                        isOverdue ? 'border-danger bg-danger-soft/20' : 'border-ink'
                                    }`}
                                >
                                    <div className="flex justify-between items-start">
                                        <div>
                                            <p className="font-bold text-base text-text-main">{client?.name || 'Unknown Client'}</p>
                                            <p className={`text-xs font-medium ${isOverdue ? 'text-danger font-bold' : 'text-text-muted'}`}>
                                                Due: {inv.dueDate} {isOverdue ? '(OVERDUE)' : ''}
                                            </p>
                                        </div>
                                        <div className="flex flex-col items-end gap-1">
                                            <span className={`text-[10px] font-bold uppercase tracking-wide px-2.5 py-1 rounded-full ${
                                                inv.status === 'paid' ? 'bg-signal-soft text-signal' : isOverdue ? 'bg-danger text-white' : 'bg-volt-soft text-ink'
                                            }`}>
                                                {inv.status === 'paid' ? 'PAID' : isOverdue ? 'OVERDUE' : 'SENT'}
                                            </span>
                                            {inv.remindersCount ? (
                                                <span className="text-[9px] font-bold text-primary flex items-center gap-0.5">
                                                    <Icon name="notifications" className="text-[11px]" />
                                                    <span>Reminder {inv.remindersCount}x</span>
                                                </span>
                                            ) : null}
                                        </div>
                                    </div>

                                    <div className="flex justify-between items-center pt-2 border-t border-border-light text-xs">
                                        <span className="text-text-muted font-mono">#{inv.id.slice(-6).toUpperCase()}</span>
                                        <span className="font-display text-lg text-ink font-mono">{formatCurrency(total)}</span>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </main>

            <BottomNav />
        </div>
    );
};

export default InvoicesPage;
