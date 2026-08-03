
import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import Icon from '../components/Icon';
import { useData } from '../context/DataContext';
import { InvoiceItem, Invoice } from '../types';
import { formatCurrency, invoiceSubtotal } from '../utils/format';
import { downloadInvoicePdf } from '../utils/pdf';

const todayISO = () => new Date().toISOString().slice(0, 10);
const plusDaysISO = (days: number) => {
    const d = new Date();
    d.setDate(d.getDate() + days);
    return d.toISOString().slice(0, 10);
};

const defaultServices: InvoiceItem[] = [
    { id: 'srv-1', icon: 'fitness_center', iconBg: 'bg-primary-soft', iconColor: 'text-primary', title: '1 hr Personal Training', details: '1 session × R80.00/hr', amount: 80 },
    { id: 'srv-2', icon: 'restaurant', iconBg: 'bg-signal-soft', iconColor: 'text-signal', title: 'Monthly Nutrition Plan', details: 'Custom macro assessment & meal guide', amount: 60 },
    { id: 'srv-3', icon: 'videocam', iconBg: 'bg-volt-soft', iconColor: 'text-ink', title: 'Online Form Check & Coaching', details: 'Weekly video breakdown', amount: 45 },
];

const NewInvoicePage: React.FC = () => {
    const navigate = useNavigate();
    const { clientId: routeClientId } = useParams<{ clientId: string }>();
    const { clients, services, addClient, addInvoice, markInvoicePaid, getClientSessions, settings } = useData();

    const currency = settings.invoiceDefaults.currency;

    const [clientId, setClientId] = useState<string>(routeClientId || (clients[0]?.id || ''));
    const [issuedDate, setIssuedDate] = useState(todayISO());
    const [dueDate, setDueDate] = useState(plusDaysISO(settings.invoiceDefaults.defaultDueDays || 14));
    
    // Initial draft item using 1-on-1 training from default catalog
    const [items, setItems] = useState<InvoiceItem[]>([
        {
            id: 'draft-1',
            icon: 'fitness_center',
            iconBg: 'bg-primary-soft',
            iconColor: 'text-primary',
            title: '1-on-1 Personal Training',
            details: `4 sessions × ${formatCurrency(80, currency)} / session`,
            amount: 320,
            rate: 80,
            sessions: 4,
        }
    ]);
    const [notes, setNotes] = useState(settings.invoiceDefaults.defaultNotes || 'Thank you for your business!');
    const [taxRate, setTaxRate] = useState<number>(settings.invoiceDefaults.defaultTaxRate ?? 0.05);
    
    // Interactive Service & Sessions Builder State
    const [selectedServiceId, setSelectedServiceId] = useState<string>(services[0]?.id || 'srv-1on1');
    const [itemTitle, setItemTitle] = useState(services[0]?.title || '1-on-1 Personal Training');
    const [itemRate, setItemRate] = useState<string>(services[0]?.defaultRate?.toString() || '80');
    const [itemSessions, setItemSessions] = useState<number>(services[0]?.defaultSessions || 4);
    const [itemDetails, setItemDetails] = useState('');
    const [showItemForm, setShowItemForm] = useState(false);
    
    // Inline quick customer creation modal
    const [showAddCustomerModal, setShowAddCustomerModal] = useState(false);
    const [newCustName, setNewCustName] = useState('');
    const [newCustEmail, setNewCustEmail] = useState('');
    const [newCustPhone, setNewCustPhone] = useState('');

    // Error & Success state
    const [errorMessage, setErrorMessage] = useState('');
    const [createdInvoice, setCreatedInvoice] = useState<Invoice | null>(null);
    const [showPdfView, setShowPdfView] = useState(false);
    const [shareToast, setShareToast] = useState(false);

    // Keep clientId synced if routeClientId changes or clients loaded
    useEffect(() => {
        if (!clientId && clients.length > 0) {
            setClientId(clients[0].id);
        }
    }, [clients, clientId]);

    const selectedClient = clients.find(c => c.id === clientId);

    const subtotal = invoiceSubtotal(items);
    const tax = subtotal * taxRate;
    const total = subtotal + tax;

    const removeItem = (id: string) => setItems(prev => prev.filter(i => i.id !== id));

    // When dropdown service selection changes
    const handleSelectService = (serviceId: string) => {
        setSelectedServiceId(serviceId);
        if (serviceId === 'custom') {
            setItemTitle('Custom Service');
            setItemRate('50');
            setItemSessions(1);
            setItemDetails('');
            return;
        }
        const preset = services.find(s => s.id === serviceId);
        if (preset) {
            setItemTitle(preset.title);
            setItemRate(preset.defaultRate.toString());
            setItemSessions(preset.defaultSessions);
            setItemDetails('');
        }
    };

    const handleAddServiceItem = () => {
        const rateNum = parseFloat(itemRate);
        const count = Math.max(1, itemSessions);
        if (!itemTitle.trim() || Number.isNaN(rateNum) || rateNum < 0) return;

        const preset = services.find(s => s.id === selectedServiceId);
        const calcSubtotal = rateNum * count;
        const detailsText = itemDetails.trim() || `${count} session${count > 1 ? 's' : ''} × ${formatCurrency(rateNum, currency)} / session`;

        setItems(prev => [...prev, {
            id: `draft-${Date.now()}`,
            icon: preset?.icon || 'sell',
            iconBg: preset?.iconBg || 'bg-volt-soft',
            iconColor: preset?.iconColor || 'text-ink',
            title: itemTitle.trim(),
            details: detailsText,
            amount: calcSubtotal,
            rate: rateNum,
            sessions: count,
        }]);

        // Reset form to defaults
        setShowItemForm(false);
    };

    const addQuickPreset = (preset: typeof services[0]) => {
        const calcSubtotal = preset.defaultRate * preset.defaultSessions;
        setItems(prev => [...prev, {
            id: `draft-${Date.now()}`,
            icon: preset.icon,
            iconBg: preset.iconBg,
            iconColor: preset.iconColor,
            title: preset.title,
            details: `${preset.defaultSessions} session${preset.defaultSessions > 1 ? 's' : ''} × ${formatCurrency(preset.defaultRate, currency)}`,
            amount: calcSubtotal,
            rate: preset.defaultRate,
            sessions: preset.defaultSessions,
        }]);
    };

    const handleCreateCustomer = () => {
        if (!newCustName.trim()) return;
        const created = addClient(newCustName, newCustEmail, newCustPhone);
        setClientId(created.id);
        setNewCustName('');
        setNewCustEmail('');
        setNewCustPhone('');
        setShowAddCustomerModal(false);
        setErrorMessage('');
    };

    const handleSend = () => {
        setErrorMessage('');
        if (!clientId) {
            setErrorMessage('Customer details required! Please select or add a customer to bill.');
            return;
        }
        if (dueDate < todayISO()) {
            setErrorMessage('Due date cannot be set to a past date. Please select today or a future date.');
            return;
        }
        if (items.length === 0) {
            setErrorMessage('Please add at least one line item/service.');
            return;
        }
        if (total <= 0) {
            setErrorMessage('Invoice total balance cannot be zero or negative. Please add billable line items or adjust credits.');
            return;
        }

        const newInv = addInvoice({
            clientId,
            issuedDate,
            dueDate,
            items,
            notes,
            taxRate,
        });

        setCreatedInvoice(newInv);
    };

    return (
        <div className="relative flex flex-col min-h-screen w-full max-w-md mx-auto overflow-hidden bg-background font-inter text-text-main">
            <header className="flex items-center justify-between px-5 py-4 sticky top-0 z-30 bg-ink">
                <button onClick={() => navigate(-1)} className="flex items-center justify-center size-10 -ml-2 rounded-full hover:bg-white/10 transition-colors text-white">
                    <Icon name="close" style={{ fontSize: '24px' }} />
                </button>
                <h2 className="font-display text-lg tracking-wide text-white">CREATE INVOICE</h2>
                <button
                    onClick={handleSend}
                    className="flex items-center justify-center h-9 px-4 -mr-1 rounded-full bg-volt hover:bg-volt/80 transition-colors"
                >
                    <span className="text-ink text-sm font-bold uppercase tracking-wide">Save</span>
                </button>
            </header>

            {/* Success Invoice Modal / Sheet */}
            {createdInvoice && (
                <div className="fixed inset-0 z-50 bg-ink/80 backdrop-blur-sm flex items-center justify-center p-4">
                    <div className="w-full max-w-sm bg-white rounded-3xl border-2 border-ink overflow-hidden shadow-2xl animate-fadeIn flex flex-col max-h-[90vh]">
                        <div className="bg-signal p-6 text-center text-white border-b-2 border-ink">
                            <div className="inline-flex size-14 items-center justify-center rounded-full bg-white text-signal mb-3 shadow-md">
                                <Icon name="check_circle" className="text-3xl" />
                            </div>
                            <h3 className="font-display text-2xl tracking-wide">INVOICE CREATED!</h3>
                            <p className="text-xs font-bold text-white/90 uppercase tracking-widest mt-1">
                                Invoice #{createdInvoice.id.slice(-6).toUpperCase()}
                            </p>
                        </div>

                        <div className="p-5 overflow-y-auto space-y-4">
                            <div className="bg-background rounded-2xl p-4 border border-border-light space-y-2 text-xs">
                                <div className="flex justify-between">
                                    <span className="text-text-muted uppercase font-bold text-[10px]">Billed To</span>
                                    <span className="font-bold text-text-main text-sm">{selectedClient?.name || 'Customer'}</span>
                                </div>
                                {selectedClient?.email && (
                                    <div className="flex justify-between text-text-muted">
                                        <span>Email:</span>
                                        <span className="font-medium text-text-main">{selectedClient.email}</span>
                                    </div>
                                )}
                                {selectedClient?.phone && (
                                    <div className="flex justify-between text-text-muted">
                                        <span>Phone:</span>
                                        <span className="font-mono text-text-main">{selectedClient.phone}</span>
                                    </div>
                                )}
                                <div className="flex justify-between">
                                    <span className="text-text-muted uppercase font-bold text-[10px]">Due Date</span>
                                    <span className="font-bold text-text-main">{createdInvoice.dueDate}</span>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <p className="text-[10px] font-bold uppercase tracking-widest text-text-muted">Items Breakdown</p>
                                {createdInvoice.items.map((item) => (
                                    <div key={item.id} className="flex justify-between items-center text-xs py-1.5 border-b border-border-light last:border-none">
                                        <div>
                                            <p className="font-bold">{item.title}</p>
                                            <p className="text-[10px] text-text-muted">{item.details}</p>
                                        </div>
                                        <span className="font-mono font-bold">{formatCurrency(item.amount)}</span>
                                    </div>
                                ))}
                            </div>

                            <div className="bg-ink p-4 rounded-xl text-white flex justify-between items-center">
                                <span className="font-display text-sm">TOTAL DUE</span>
                                <span className="font-mono text-volt font-bold text-xl">{formatCurrency(total)}</span>
                            </div>
                        </div>

                        <div className="p-4 bg-background border-t-2 border-ink space-y-2">
                            {shareToast && (
                                <div className="p-2.5 rounded-xl bg-primary text-white text-xs font-bold text-center animate-fadeIn flex items-center justify-center gap-1.5">
                                    <Icon name="check_circle" className="text-volt" />
                                    <span>Invoice payment link copied to clipboard!</span>
                                </div>
                            )}

                            <button
                                onClick={() => setShowPdfView(true)}
                                className="w-full py-3 rounded-full bg-ink text-volt border-2 border-ink font-bold uppercase text-xs tracking-wide hover:bg-black transition-colors flex items-center justify-center gap-2 shadow-sm"
                            >
                                <Icon name="picture_as_pdf" />
                                <span>Preview & Download PDF</span>
                            </button>

                            <button
                                onClick={() => {
                                    markInvoicePaid(createdInvoice.id);
                                    setCreatedInvoice(prev => prev ? { ...prev, status: 'paid' } : null);
                                }}
                                disabled={createdInvoice.status === 'paid'}
                                className={`w-full py-2.5 rounded-full font-bold uppercase text-xs tracking-wide flex items-center justify-center gap-2 border-2 border-ink ${
                                    createdInvoice.status === 'paid' ? 'bg-signal-soft text-signal cursor-default' : 'bg-volt text-ink hover:bg-volt/80'
                                }`}
                            >
                                <Icon name={createdInvoice.status === 'paid' ? 'task_alt' : 'payments'} />
                                <span>{createdInvoice.status === 'paid' ? 'Status: PAID' : 'Mark as Paid'}</span>
                            </button>

                            <button
                                onClick={async () => {
                                    const shareUrl = `${window.location.origin}/invoices?id=${createdInvoice.id}`;
                                    if (navigator.share) {
                                        try {
                                            await navigator.share({
                                                title: `Invoice #${createdInvoice.id.slice(-8).toUpperCase()}`,
                                                text: `Invoice from ${settings.profile.name || 'Trainer'} for ${selectedClient?.name || 'Client'}`,
                                                url: shareUrl,
                                            });
                                        } catch {
                                            navigator.clipboard.writeText(shareUrl).catch(() => {});
                                            setShareToast(true);
                                            setTimeout(() => setShareToast(false), 3000);
                                        }
                                    } else {
                                        navigator.clipboard.writeText(shareUrl).catch(() => {});
                                        setShareToast(true);
                                        setTimeout(() => setShareToast(false), 3000);
                                    }
                                }}
                                className="w-full py-2.5 rounded-full bg-white text-ink border-2 border-ink font-bold uppercase text-xs tracking-wide hover:bg-background transition-colors flex items-center justify-center gap-2"
                            >
                                <Icon name="share" />
                                <span>Share Invoice Link</span>
                            </button>

                            <button
                                onClick={() => navigate('/invoices')}
                                className="w-full py-2.5 text-text-muted font-bold uppercase text-xs tracking-wide hover:text-ink transition-colors text-center"
                            >
                                View All Invoices
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* PDF Printable Invoice Modal */}
            {showPdfView && createdInvoice && (
                <div className="fixed inset-0 z-50 bg-ink/80 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
                    <div className="w-full max-w-xl bg-white rounded-3xl border-2 border-ink shadow-2xl overflow-hidden my-auto flex flex-col max-h-[95vh]">
                        {/* Header */}
                        <div className="bg-ink p-4 text-white flex justify-between items-center border-b-2 border-ink shrink-0">
                            <div className="flex items-center gap-2">
                                <Icon name="picture_as_pdf" className="text-volt text-2xl" />
                                <div>
                                    <h3 className="font-display text-base tracking-wide">OFFICIAL INVOICE PDF</h3>
                                    <p className="text-[10px] text-white/60">Ready for Download & Printing</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-2">
                                <button
                                    onClick={() => downloadInvoicePdf('printable-invoice', `Invoice_${createdInvoice.id.slice(-8)}`)}
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

                        {/* Printable Body */}
                        <div className="p-8 overflow-y-auto text-ink font-inter bg-white" id="printable-invoice">
                            <div className="flex justify-between items-start border-b-2 border-ink pb-6 mb-6">
                                <div className="mb-4">
                                    {settings.profile.logoUrl ? (
                                        <img src={settings.profile.logoUrl} alt="Business Logo" className="h-14 max-w-xs object-contain mb-2" />
                                    ) : (
                                        <div className="size-12 rounded-2xl bg-ink text-volt font-display text-2xl flex items-center justify-center border-2 border-ink mb-2">
                                            {settings.profile.name.charAt(0)}
                                        </div>
                                    )}
                                    <div>
                                        <h2 className="font-display text-xl tracking-wide uppercase">{settings.profile.name || 'Alex Sonnenberg'}</h2>
                                        <p className="text-xs font-bold text-primary">{settings.profile.title || 'Strength & Conditioning Coach'}</p>
                                        <p className="text-xs text-text-muted">{settings.profile.email} • {settings.profile.phone}</p>
                                    </div>
                                </div>

                                <div className="text-right">
                                    <span className={`inline-block px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider mb-2 ${
                                        createdInvoice.status === 'paid' ? 'bg-signal text-white' : 'bg-danger text-white'
                                    }`}>
                                        INVOICE: {createdInvoice.status.toUpperCase()}
                                    </span>
                                    <p className="font-mono text-sm font-bold text-ink">#{createdInvoice.id.slice(-8).toUpperCase()}</p>
                                    <p className="text-xs text-text-muted">Issued: <strong>{createdInvoice.issuedDate}</strong></p>
                                    <p className="text-xs text-text-muted">Due Date: <strong>{createdInvoice.dueDate}</strong></p>
                                </div>
                            </div>

                            <div className="p-4 rounded-2xl bg-background border border-border-light flex justify-between items-center mb-6">
                                <div>
                                    <p className="text-[10px] font-bold uppercase tracking-widest text-text-muted mb-1">Billed Customer</p>
                                    <h4 className="font-bold text-base">{selectedClient?.name || 'Valued Client'}</h4>
                                    <p className="text-xs text-text-muted">{selectedClient?.email || 'Client Email N/A'}</p>
                                    {selectedClient?.phone && (
                                        <p className="text-xs text-text-muted mt-1">{selectedClient.phone}</p>
                                    )}
                                </div>
                                <div className="text-right">
                                    <p className="text-[10px] font-bold uppercase tracking-widest text-text-muted mb-1">Payment Term</p>
                                    <p className="text-xs font-bold text-ink">Net 14 Days</p>
                                </div>
                            </div>

                            <div className="mb-6">
                                <p className="text-[10px] font-bold uppercase tracking-widest text-text-muted mb-2">Itemized Services & Credits</p>
                                <table className="w-full border-collapse text-xs">
                                    <thead>
                                        <tr className="border-b-2 border-ink bg-background text-left">
                                            <th className="py-2.5 px-3 font-bold uppercase">Description</th>
                                            <th className="py-2.5 px-3 font-bold uppercase text-center">Sessions</th>
                                            <th className="py-2.5 px-3 font-bold uppercase text-right">Rate</th>
                                            <th className="py-2.5 px-3 font-bold uppercase text-right">Amount</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {createdInvoice.items.map((item) => (
                                            <tr key={item.id} className="border-b border-border-light">
                                                <td className="py-3 px-3">
                                                    <p className="font-bold text-ink">{item.title}</p>
                                                    <p className="text-[10px] text-text-muted mt-1">{item.details}</p>
                                                </td>
                                                <td className="py-3 px-3 text-center font-mono">{item.sessions || '-'}</td>
                                                <td className="py-3 px-3 text-right font-mono">{item.rate ? formatCurrency(item.rate, currency) : '-'}</td>
                                                <td className={`py-3 px-3 text-right font-mono font-bold ${item.amount < 0 ? 'text-emerald-700' : 'text-ink'}`}>
                                                    {formatCurrency(item.amount, currency)}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>

                            <div className="flex justify-end pt-2 mb-6">
                                <div className="w-64 text-xs">
                                    <div className="flex justify-between text-text-muted font-medium mb-2">
                                        <span>Subtotal:</span>
                                        <span className="font-mono">{formatCurrency(invoiceSubtotal(createdInvoice.items), currency)}</span>
                                    </div>
                                    {createdInvoice.taxRate > 0 && (
                                        <div className="flex justify-between text-text-muted font-medium mb-2">
                                            <span>Tax ({(createdInvoice.taxRate * 100).toFixed(0)}%):</span>
                                            <span className="font-mono">{formatCurrency(invoiceSubtotal(createdInvoice.items) * createdInvoice.taxRate, currency)}</span>
                                        </div>
                                    )}
                                    <div className="flex justify-between items-center pt-2 mt-2 border-t-2 border-ink font-bold text-sm text-ink">
                                        <span>Total Balance Due:</span>
                                        <span className="font-mono text-base font-extrabold text-primary">{formatCurrency(total, currency)}</span>
                                    </div>
                                </div>
                            </div>

                            <div className="p-4 rounded-2xl bg-ink text-white text-xs">
                                <p className="text-[10px] font-bold uppercase text-volt tracking-widest mb-1">Payment Instructions</p>
                                <p className="text-white/80 mb-1">Please transfer payment to <strong>{settings.payout.method}</strong> linked account.</p>
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

            {/* Inline Add Customer Modal */}
            {showAddCustomerModal && (
                <div className="fixed inset-0 z-50 bg-ink/70 backdrop-blur-sm flex items-center justify-center p-4">
                    <div className="w-full max-w-sm bg-white rounded-3xl border-2 border-ink p-6 space-y-4 shadow-2xl animate-fadeIn">
                        <div className="flex items-center justify-between border-b pb-3 border-border-light">
                            <h3 className="font-display text-lg tracking-wide text-ink">ADD NEW CUSTOMER</h3>
                            <button onClick={() => setShowAddCustomerModal(false)} className="text-text-muted hover:text-ink">
                                <Icon name="close" />
                            </button>
                        </div>

                        <div className="space-y-3">
                            <div>
                                <label className="block text-text-muted text-[10px] font-bold uppercase tracking-widest mb-1">Customer Name *</label>
                                <input
                                    autoFocus
                                    value={newCustName}
                                    onChange={e => setNewCustName(e.target.value)}
                                    placeholder="e.g. Alex Morgan"
                                    className="w-full rounded-xl bg-background border-2 border-border-light focus:border-primary focus:outline-none px-4 py-2.5 font-bold text-sm"
                                />
                            </div>
                            <div>
                                <label className="block text-text-muted text-[10px] font-bold uppercase tracking-widest mb-1">Email Address</label>
                                <input
                                    type="email"
                                    value={newCustEmail}
                                    onChange={e => setNewCustEmail(e.target.value)}
                                    placeholder="alex@example.com"
                                    className="w-full rounded-xl bg-background border-2 border-border-light focus:border-primary focus:outline-none px-4 py-2.5 font-bold text-sm"
                                />
                            </div>
                            <div>
                                <label className="block text-text-muted text-[10px] font-bold uppercase tracking-widest mb-1">Phone Number</label>
                                <input
                                    type="tel"
                                    value={newCustPhone}
                                    onChange={e => setNewCustPhone(e.target.value)}
                                    placeholder="(555) 123-4567"
                                    className="w-full rounded-xl bg-background border-2 border-border-light focus:border-primary focus:outline-none px-4 py-2.5 font-bold text-sm"
                                />
                            </div>
                        </div>

                        <div className="flex gap-2 pt-2">
                            <button
                                onClick={handleCreateCustomer}
                                disabled={!newCustName.trim()}
                                className="flex-1 rounded-xl bg-primary text-white font-bold uppercase text-xs tracking-wide py-3 hover:bg-primary-hover transition-colors disabled:opacity-40"
                            >
                                Save Customer
                            </button>
                            <button
                                onClick={() => setShowAddCustomerModal(false)}
                                className="rounded-xl border-2 border-ink font-bold uppercase text-xs tracking-wide px-4 hover:bg-background transition-colors"
                            >
                                Cancel
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <main className="flex-1 overflow-y-auto pb-24">
                {errorMessage && (
                    <div className="mx-5 mt-4 p-3 rounded-xl bg-danger-soft border-2 border-danger text-danger text-xs font-bold flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <Icon name="error" className="text-[18px]" />
                            <span>{errorMessage}</span>
                        </div>
                        <button onClick={() => setErrorMessage('')}><Icon name="close" className="text-[16px]" /></button>
                    </div>
                )}

                {/* Bill To Customer Selector */}
                <section className="px-5 pt-6 pb-2">
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-text-muted text-[10px] font-bold uppercase tracking-widest ml-1">Bill To Customer</span>
                        <button
                            type="button"
                            onClick={() => setShowAddCustomerModal(true)}
                            className="text-xs font-bold text-primary hover:text-primary-hover flex items-center gap-1 uppercase tracking-wide"
                        >
                            <Icon name="person_add" className="text-[16px]" />
                            <span>+ Add Customer</span>
                        </button>
                    </div>

                    <div className="relative">
                        <select
                            value={clientId}
                            onChange={e => {
                                setClientId(e.target.value);
                                setErrorMessage('');
                            }}
                            className="w-full h-14 pl-4 pr-10 rounded-xl bg-white border-2 border-ink font-bold text-base focus:ring-0 focus:border-primary transition-all outline-none cursor-pointer"
                            style={{ appearance: 'none', backgroundImage: 'url("data:image/svg+xml,%3csvg xmlns=\'http://www.w3.org/2000/svg\' fill=\'none\' viewBox=\'0 0 20 20\'%3e%3cpath stroke=\'%2314161f\' stroke-linecap=\'round\' stroke-linejoin=\'round\' stroke-width=\'2\' d=\'M6 8l4 4 4-4\'/%3e%3c/svg%3e")', backgroundPosition: 'right 0.75rem center', backgroundRepeat: 'no-repeat', backgroundSize: '1.5em 1.5em' }}
                        >
                            <option value="" disabled>-- Select Customer --</option>
                            {clients.map(c => (
                                <option key={c.id} value={c.id}>
                                    {c.name} {c.email ? `(${c.email})` : ''}
                                </option>
                            ))}
                        </select>
                    </div>

                    {selectedClient && (
                        <div className="mt-2.5 p-3 rounded-xl bg-white border border-border-light flex items-center justify-between text-xs">
                            <div className="space-y-0.5">
                                <p className="font-bold text-text-main">{selectedClient.name}</p>
                                {selectedClient.email && <p className="text-text-muted">{selectedClient.email}</p>}
                                {selectedClient.phone && <p className="text-text-muted font-mono">{selectedClient.phone}</p>}
                            </div>
                            <span className="text-[10px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-full bg-volt-soft text-ink">
                                Selected
                            </span>
                        </div>
                    )}

                    {clientId && getClientSessions(clientId).filter(s => s.status === 'cancelled_advance').length > 0 && (
                        <div className="mt-3 p-3.5 rounded-2xl bg-emerald-500/10 border-2 border-emerald-500/30 flex flex-col gap-2">
                            <div className="flex items-center gap-2 text-emerald-800 text-xs font-bold">
                                <Icon name="event_busy" className="text-emerald-600 text-[18px]" />
                                <span>Advance Cancelled Sessions Available for Credit</span>
                            </div>
                            <p className="text-[11px] font-medium text-emerald-900">
                                This client has {getClientSessions(clientId).filter(s => s.status === 'cancelled_advance').length} session(s) cancelled in advance. You can apply a refund credit item to this invoice.
                            </p>
                            <div className="flex flex-wrap gap-2 pt-1">
                                {getClientSessions(clientId).filter(s => s.status === 'cancelled_advance').map(sess => (
                                    <button
                                        key={sess.id}
                                        type="button"
                                        onClick={() => {
                                            const creditAmount = -80;
                                            setItems(prev => [
                                                ...prev,
                                                {
                                                    id: `credit-${sess.id}-${Date.now()}`,
                                                    icon: 'replay',
                                                    iconBg: 'bg-emerald-500/20',
                                                    iconColor: 'text-emerald-700',
                                                    title: `Credit: Cancelled Session (${sess.date})`,
                                                    details: `${sess.sessionType} cancelled in advance`,
                                                    amount: creditAmount,
                                                    rate: creditAmount,
                                                    sessions: 1,
                                                }
                                            ]);
                                        }}
                                        className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-sm transition-all active:scale-95"
                                    >
                                        <Icon name="add_circle" className="text-[16px]" />
                                        <span>Apply Credit for {sess.date} (-{formatCurrency(80, currency)})</span>
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}
                </section>

                {/* Dates Section */}
                <section className="px-5 py-4 flex gap-4">
                    <label className="flex flex-col flex-1">
                        <span className="text-text-muted text-[10px] font-bold uppercase tracking-widest mb-2 ml-1">Issued Date</span>
                        <input value={issuedDate} onChange={e => setIssuedDate(e.target.value)} className="w-full h-14 px-4 rounded-xl bg-white border-2 border-ink font-bold text-base focus:ring-0 focus:border-primary transition-all outline-none" type="date" />
                    </label>
                    <label className="flex flex-col flex-1">
                        <span className="text-text-muted text-[10px] font-bold uppercase tracking-widest mb-2 ml-1">Due Date</span>
                        <input value={dueDate} onChange={e => setDueDate(e.target.value)} className="w-full h-14 px-4 rounded-xl bg-white border-2 border-ink font-bold text-base focus:ring-0 focus:border-primary transition-all outline-none" type="date" />
                    </label>
                </section>

                {/* Service Line Items */}
                <section className="mt-2 bg-white border-y-2 border-ink">
                    <div className="px-5 py-3 flex justify-between items-center">
                        <h3 className="text-xs font-bold uppercase tracking-widest text-text-muted">Services & Charges</h3>
                        <span className="px-2.5 py-0.5 rounded-full bg-background border-2 border-ink text-xs font-bold">{items.length} item{items.length === 1 ? '' : 's'}</span>
                    </div>

                    {items.length === 0 ? (
                        <p className="px-5 py-6 text-center text-text-muted text-xs font-bold italic">
                            No service items added yet. Select a service or add custom charge below.
                        </p>
                    ) : items.map((item) => (
                        <div key={item.id} className="group relative flex gap-4 px-5 py-4 hover:bg-background/60 transition-colors border-t-2 border-border-light">
                            <div className="flex items-start gap-3 flex-1">
                                <div className={`flex items-center justify-center rounded-xl shrink-0 size-11 ${item.iconBg} ${item.iconColor}`}>
                                    <Icon name={item.icon} style={{ fontSize: '22px' }} />
                                </div>
                                <div className="flex flex-1 flex-col justify-center pt-0.5">
                                    <p className="text-sm font-bold leading-tight mb-0.5 text-text-main">{item.title}</p>
                                    <p className="text-text-muted text-xs font-medium">{item.details}</p>
                                </div>
                            </div>
                            <div className="shrink-0 flex items-center gap-3">
                                <span className="text-sm font-bold font-mono text-ink">{formatCurrency(item.amount, currency)}</span>
                                <button onClick={() => removeItem(item.id)} aria-label={`Remove ${item.title}`} className="text-text-muted hover:text-danger transition-colors p-1">
                                    <Icon name="close" className="text-[18px]" />
                                </button>
                            </div>
                        </div>
                    ))}

                    <div className="px-5 py-5 space-y-4">
                        {/* Quick Presets row */}
                        <div>
                            <p className="text-[10px] font-bold uppercase tracking-widest text-text-muted mb-2">Quick One-Tap Presets</p>
                            <div className="flex gap-2 overflow-x-auto pb-1" style={{ scrollbarWidth: 'none' }}>
                                {services.map(preset => (
                                    <button
                                        key={preset.id}
                                        type="button"
                                        onClick={() => addQuickPreset(preset)}
                                        className="px-3 py-1.5 rounded-full border border-border-light bg-background hover:bg-primary-soft hover:border-primary text-xs font-bold whitespace-nowrap transition-colors flex items-center gap-1.5 shrink-0"
                                    >
                                        <Icon name="add" className="text-[14px]" />
                                        <span>{preset.title} ({preset.defaultSessions}x @ {formatCurrency(preset.defaultRate, currency)})</span>
                                    </button>
                                ))}
                            </div>
                        </div>

                        {showItemForm ? (
                            <div className="flex flex-col gap-3 rounded-2xl border-2 border-ink p-4 bg-background animate-fadeIn">
                                <div className="flex items-center justify-between border-b border-border-light pb-2">
                                    <p className="text-xs font-bold uppercase tracking-wider text-ink flex items-center gap-1.5">
                                        <Icon name="build" className="text-[16px] text-primary" />
                                        <span>Add Service or Custom Charge</span>
                                    </p>
                                    <button onClick={() => setShowItemForm(false)} className="text-text-muted hover:text-ink">
                                        <Icon name="close" className="text-[16px]" />
                                    </button>
                                </div>

                                {/* Service Dropdown */}
                                <div>
                                    <label className="block text-[10px] font-bold uppercase tracking-widest text-text-muted mb-1">Select Service Type</label>
                                    <select
                                        value={selectedServiceId}
                                        onChange={e => handleSelectService(e.target.value)}
                                        className="w-full h-11 px-3 rounded-xl bg-white border-2 border-border-light font-bold text-xs focus:border-primary outline-none"
                                    >
                                        {services.map(s => (
                                            <option key={s.id} value={s.id}>
                                                {s.title} ({formatCurrency(s.defaultRate, currency)} / session)
                                            </option>
                                        ))}
                                        <option value="custom">+ Custom Service Entry...</option>
                                    </select>
                                </div>

                                {/* Service Title */}
                                <div>
                                    <label className="block text-[10px] font-bold uppercase tracking-widest text-text-muted mb-1">Service Title</label>
                                    <input
                                        value={itemTitle}
                                        onChange={e => setItemTitle(e.target.value)}
                                        placeholder="Service title (e.g. Mobile Personal Training)"
                                        className="w-full rounded-xl bg-white border-2 border-border-light px-3 py-2 text-xs font-bold focus:border-primary outline-none"
                                    />
                                </div>

                                {/* Pricing Rate & Amount of Sessions Row */}
                                <div className="grid grid-cols-2 gap-3">
                                    {/* Rate Per Session */}
                                    <div>
                                        <label className="block text-[10px] font-bold uppercase tracking-widest text-text-muted mb-1">Rate per Session</label>
                                        <div className="relative">
                                            <span className="absolute left-3 top-1/2 -translate-y-1/2 font-bold font-mono text-xs text-text-muted">
                                                {currency.includes('ZAR') || currency.includes('R') ? 'R' : currency.slice(0, 1)}
                                            </span>
                                            <input
                                                value={itemRate}
                                                onChange={e => setItemRate(e.target.value)}
                                                placeholder="0.00"
                                                type="number"
                                                step="any"
                                                className="w-full rounded-xl bg-white border-2 border-border-light pl-7 pr-3 py-2 text-xs font-bold font-mono focus:border-primary outline-none"
                                            />
                                        </div>
                                    </div>

                                    {/* Amount of Sessions (Quantity) */}
                                    <div>
                                        <label className="block text-[10px] font-bold uppercase tracking-widest text-text-muted mb-1">Sessions (Amount)</label>
                                        <div className="flex items-center gap-1 rounded-xl bg-white border-2 border-border-light p-1">
                                            <button
                                                type="button"
                                                onClick={() => setItemSessions(prev => Math.max(1, prev - 1))}
                                                className="size-7 rounded-lg bg-background hover:bg-border-light flex items-center justify-center font-bold text-sm text-ink shrink-0"
                                            >
                                                -
                                            </button>
                                            <input
                                                type="number"
                                                min="1"
                                                value={itemSessions}
                                                onChange={e => setItemSessions(Math.max(1, parseInt(e.target.value) || 1))}
                                                className="w-full text-center font-bold font-mono text-xs outline-none bg-transparent"
                                            />
                                            <button
                                                type="button"
                                                onClick={() => setItemSessions(prev => prev + 1)}
                                                className="size-7 rounded-lg bg-background hover:bg-border-light flex items-center justify-center font-bold text-sm text-ink shrink-0"
                                            >
                                                +
                                            </button>
                                        </div>
                                    </div>
                                </div>

                                {/* Quick Session Quantity Pills */}
                                <div className="flex items-center gap-1.5 overflow-x-auto pt-1">
                                    <span className="text-[10px] font-bold text-text-muted uppercase shrink-0">Quick Pack:</span>
                                    {[1, 4, 8, 10, 12, 16, 20].map(cnt => (
                                        <button
                                            key={cnt}
                                            type="button"
                                            onClick={() => setItemSessions(cnt)}
                                            className={`px-2 py-1 rounded-lg text-[10px] font-bold uppercase transition-colors shrink-0 ${
                                                itemSessions === cnt ? 'bg-ink text-volt' : 'bg-white border border-border-light text-text-muted hover:text-ink'
                                            }`}
                                        >
                                            {cnt} session{cnt > 1 ? 's' : ''}
                                        </button>
                                    ))}
                                </div>

                                {/* Custom Details / Notes */}
                                <div>
                                    <label className="block text-[10px] font-bold uppercase tracking-widest text-text-muted mb-1">Details / Note (Optional)</label>
                                    <input
                                        value={itemDetails}
                                        onChange={e => setItemDetails(e.target.value)}
                                        placeholder={`Default: ${itemSessions} session${itemSessions > 1 ? 's' : ''} × ${formatCurrency(parseFloat(itemRate) || 0, currency)}`}
                                        className="w-full rounded-xl bg-white border-2 border-border-light px-3 py-2 text-xs font-medium focus:border-primary outline-none"
                                    />
                                </div>

                                {/* Total Calculation Summary Box */}
                                <div className="p-3 rounded-xl bg-white border-2 border-ink flex items-center justify-between">
                                    <div>
                                        <p className="text-[10px] font-bold text-text-muted uppercase">Calculated Item Total</p>
                                        <p className="text-xs font-medium text-text-main">
                                            {itemSessions} session{itemSessions > 1 ? 's' : ''} × {formatCurrency(parseFloat(itemRate) || 0, currency)}
                                        </p>
                                    </div>
                                    <p className="font-display text-lg text-signal">
                                        {formatCurrency((parseFloat(itemRate) || 0) * itemSessions, currency)}
                                    </p>
                                </div>

                                <div className="flex gap-2 pt-1">
                                    <button
                                        type="button"
                                        onClick={handleAddServiceItem}
                                        className="flex-1 rounded-xl bg-primary text-white font-bold uppercase text-xs tracking-wider py-3 hover:bg-primary-hover transition-colors shadow-sm"
                                    >
                                        + Add Service to Invoice
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setShowItemForm(false)}
                                        className="rounded-xl border-2 border-ink font-bold uppercase text-xs tracking-wider px-4 hover:bg-background transition-colors"
                                    >
                                        Cancel
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <button
                                type="button"
                                onClick={() => setShowItemForm(true)}
                                className="flex w-full items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-ink py-3.5 hover:bg-primary-soft hover:border-primary hover:text-primary transition-all duration-200 bg-background"
                            >
                                <Icon name="add_circle" style={{ fontSize: '20px' }} />
                                <span className="text-xs font-bold uppercase tracking-wider">Configure & Add Service</span>
                            </button>
                        )}
                    </div>
                </section>

                <section className="px-5 pb-6 pt-6">
                    <label className="flex flex-col w-full">
                        <span className="text-text-muted text-[10px] font-bold uppercase tracking-widest mb-2 ml-1">Invoice Notes / Terms</span>
                        <textarea value={notes} onChange={e => setNotes(e.target.value)} className="w-full p-4 rounded-xl bg-white border-2 border-ink text-sm placeholder:text-gray-400 focus:ring-0 focus:border-primary transition-all resize-none outline-none" placeholder="Add payment instructions or notes..." rows={3}></textarea>
                    </label>
                </section>

                <section className="px-5 py-8 mt-4 bg-ink">
                    <div className="space-y-3">
                        <div className="flex justify-between items-center"><span className="text-white/60 text-sm font-medium">Subtotal</span><span className="text-sm font-bold font-mono text-white">{formatCurrency(subtotal, currency)}</span></div>
                        <div className="flex justify-between items-center"><span className="text-white/60 text-sm font-medium">Tax ({ (taxRate * 100).toFixed(0) }%)</span><span className="text-sm font-bold font-mono text-white">{formatCurrency(tax, currency)}</span></div>
                        <div className="h-px bg-white/20 my-2 w-full"></div>
                        <div className="flex justify-between items-center pt-1">
                            <span className="font-display text-lg tracking-wide text-white">TOTAL DUE</span>
                            <span className="text-volt text-3xl font-bold tracking-tight font-mono">{formatCurrency(total, currency)}</span>
                        </div>
                    </div>
                    <div className="mt-8">
                        <button
                            onClick={handleSend}
                            className="w-full bg-primary hover:bg-primary-hover text-white font-bold uppercase text-base tracking-wide py-4 rounded-full border-2 border-white/20 flex items-center justify-center gap-2 transition-all active:scale-[0.98] shadow-lg"
                        >
                            <span>Generate & Send Invoice</span>
                            <Icon name="send" style={{ fontSize: '20px' }} />
                        </button>
                    </div>
                </section>
            </main>
        </div>
    );
};

export default NewInvoicePage;
