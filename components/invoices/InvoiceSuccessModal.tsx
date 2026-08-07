import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Icon from '../Icon';
import Modal from '../Modal';
import { Invoice, Client, UserSettings } from '../../types';
import { formatCurrency, invoiceSubtotal } from '../../utils/format';
import { useData } from '../../context/DataContext';

interface InvoiceSuccessModalProps {
    open: boolean;
    onClose: () => void;
    createdInvoice: Invoice | null;
    setCreatedInvoice: React.Dispatch<React.SetStateAction<Invoice | null>>;
    selectedClient: Client | undefined;
    settings: UserSettings;
    currency: string;
    onViewPdf: () => void;
}

export const InvoiceSuccessModal: React.FC<InvoiceSuccessModalProps> = ({
    open,
    onClose,
    createdInvoice,
    setCreatedInvoice,
    selectedClient,
    settings,
    currency,
    onViewPdf
}) => {
    const navigate = useNavigate();
    const { markInvoicePaid } = useData();
    const [shareToast, setShareToast] = useState(false);

    if (!createdInvoice) return null;

    const subtotal = invoiceSubtotal(createdInvoice.items);
    const tax = subtotal * createdInvoice.taxRate;
    const total = subtotal + tax;

    return (
        <Modal open={open} onClose={onClose}>
            <div className="p-6 text-center space-y-4">
                <div className="size-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto mb-2 border-2 border-emerald-500 animate-bounce">
                    <Icon name="check_circle" className="text-[32px]" />
                </div>
                <h3 className="font-display text-2xl text-ink uppercase tracking-wide">Invoice Created!</h3>
                <div className="bg-background border-2 border-border-light rounded-2xl p-4 text-left space-y-2">
                    <p className="flex justify-between text-xs font-bold text-text-muted">
                        <span>Invoice #</span>
                        <span className="text-ink">{createdInvoice.id.slice(-8).toUpperCase()}</span>
                    </p>
                    <p className="flex justify-between text-xs font-bold text-text-muted">
                        <span>Client</span>
                        <span className="text-ink">{selectedClient?.name}</span>
                    </p>
                    <p className="flex justify-between text-xs font-bold text-text-muted">
                        <span>Amount Due</span>
                        <span className="text-signal text-sm">{formatCurrency(total, currency)}</span>
                    </p>
                </div>
                
                <div className="space-y-2 pt-2">
                    <button
                        onClick={onViewPdf}
                        className="w-full bg-ink text-white py-2.5 rounded-full font-bold uppercase text-xs tracking-wide flex items-center justify-center gap-2 hover:bg-black transition-colors"
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
                            const shareUrl = `${window.location.origin}${window.location.pathname}#/invoices?id=${createdInvoice.id}`;
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
                        className="w-full bg-white border-2 border-ink py-2.5 rounded-full font-bold uppercase text-xs tracking-wide flex items-center justify-center gap-2 hover:bg-background transition-colors"
                    >
                        <Icon name="ios_share" />
                        <span>{shareToast ? 'Link Copied!' : 'Share Link'}</span>
                    </button>
                </div>
                <button
                    onClick={() => {
                        onClose();
                        navigate('/invoices');
                    }}
                    className="pt-2 text-xs font-bold text-text-muted hover:text-ink uppercase tracking-wider block w-full text-center"
                >
                    Return to Invoices List
                </button>
            </div>
        </Modal>
    );
};
