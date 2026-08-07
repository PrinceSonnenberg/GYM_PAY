import React from 'react';
import Icon from '../Icon';
import Modal from '../Modal';
import { Invoice, Client, UserSettings } from '../../types';
import { formatCurrency, invoiceSubtotal } from '../../utils/format';
import { downloadInvoicePdf } from '../../utils/pdf';

interface InvoicePDFModalProps {
    open: boolean;
    onClose: () => void;
    invoice: Invoice | null;
    client: Client | undefined;
    settings: UserSettings;
    currency: string;
}

export const InvoicePDFModal: React.FC<InvoicePDFModalProps> = ({
    open,
    onClose,
    invoice,
    client,
    settings,
    currency
}) => {
    if (!invoice || !client) return null;

    const subtotal = invoiceSubtotal(invoice.items);
    const tax = subtotal * invoice.taxRate;
    const total = subtotal + tax;

    return (
        <Modal open={open} onClose={onClose} maxWidth="max-w-md">
            <div className="flex flex-col h-[85vh]">
                <div className="flex items-center justify-between p-4 border-b-2 border-ink bg-background shrink-0">
                    <div>
                        <h3 className="font-display text-lg">PDF PREVIEW</h3>
                        <p className="text-[10px] text-text-muted font-mono">#{invoice.id.slice(-8).toUpperCase()}</p>
                    </div>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => downloadInvoicePdf('printable-invoice', `Invoice_${invoice.id.slice(-8)}`)}
                            className="flex items-center gap-1.5 px-3 py-1.5 bg-volt border-2 border-ink rounded-lg font-bold text-xs uppercase"
                        >
                            <Icon name="download" className="text-[16px]" />
                            Download
                        </button>
                        <button onClick={onClose} className="p-1.5 border-2 border-transparent hover:border-ink rounded-full">
                            <Icon name="close" />
                        </button>
                    </div>
                </div>
                
                <div className="flex-1 overflow-y-auto bg-gray-100 p-4 sm:p-6">
                    {/* Simulated PDF Paper */}
                    <div id="printable-invoice" className="bg-white shadow-md mx-auto aspect-[1/1.414] w-full max-w-[500px] p-6 text-ink flex flex-col font-sans relative">
                        <div className="flex justify-between items-start mb-8">
                            <div>
                                {settings.profile.logoUrl ? (
                                    <img src={settings.profile.logoUrl} alt="Logo" className="h-12 w-auto object-contain mb-2" />
                                ) : (
                                    <h1 className="font-display text-2xl tracking-tight mb-1">{settings.profile.name}</h1>
                                )}
                                <p className="text-[10px] text-text-muted leading-tight">{settings.profile.title}</p>
                                <p className="text-[10px] text-text-muted leading-tight">{settings.profile.email}</p>
                            </div>
                            <div className="text-right">
                                <h2 className="text-2xl font-black tracking-widest uppercase text-border-light mb-2">INVOICE</h2>
                                <p className="text-[9px] font-bold"># {invoice.id.slice(-8).toUpperCase()}</p>
                                <p className="text-[9px]"><span className="text-text-muted">Issued:</span> {invoice.issuedDate}</p>
                                <p className="text-[9px]"><span className="text-text-muted">Due:</span> {invoice.dueDate}</p>
                            </div>
                        </div>

                        <div className="mb-8">
                            <p className="text-[9px] font-bold text-text-muted uppercase tracking-widest mb-1">Bill To:</p>
                            <p className="font-bold text-sm">{client.name}</p>
                            <p className="text-[10px]">{client.email}</p>
                            {client.phone && <p className="text-[10px]">{client.phone}</p>}
                        </div>

                        <div className="flex-1">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="border-b-2 border-ink">
                                        <th className="py-2 text-[10px] uppercase font-bold tracking-wider">Description</th>
                                        <th className="py-2 text-[10px] uppercase font-bold tracking-wider text-right">Amount</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {invoice.items.map(item => (
                                        <tr key={item.id} className="border-b border-border-light">
                                            <td className="py-3 pr-2">
                                                <p className="font-bold text-xs">{item.title}</p>
                                                <p className="text-[9px] text-text-muted mt-0.5">{item.details}</p>
                                            </td>
                                            <td className="py-3 text-right font-mono font-bold text-xs">
                                                {formatCurrency(item.amount, currency)}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        <div className="mt-8 flex justify-end">
                            <div className="w-1/2 min-w-[150px]">
                                <div className="flex justify-between py-1 text-xs">
                                    <span className="text-text-muted">Subtotal</span>
                                    <span className="font-mono">{formatCurrency(subtotal, currency)}</span>
                                </div>
                                <div className="flex justify-between py-1 text-xs border-b border-ink">
                                    <span className="text-text-muted">Tax ({(invoice.taxRate * 100).toFixed(1)}%)</span>
                                    <span className="font-mono">{formatCurrency(tax, currency)}</span>
                                </div>
                                <div className="flex justify-between py-2 text-sm font-black">
                                    <span>Total Due</span>
                                    <span className="font-mono">{formatCurrency(total, currency)}</span>
                                </div>
                            </div>
                        </div>

                        {invoice.notes && (
                            <div className="mt-8 pt-4 border-t border-border-light">
                                <p className="text-[9px] font-bold text-text-muted uppercase tracking-widest mb-1">Notes / Terms</p>
                                <p className="text-[10px] leading-relaxed whitespace-pre-wrap">{invoice.notes}</p>
                            </div>
                        )}
                        
                        <div className="mt-8 text-center border-t border-border-light pt-4">
                             <p className="text-[8px] text-text-muted font-bold uppercase tracking-widest">
                                Payment via {settings.payout.method} • Acct ending in *{settings.payout.accountNumberLast4}
                             </p>
                        </div>
                    </div>
                </div>
            </div>
        </Modal>
    );
};
