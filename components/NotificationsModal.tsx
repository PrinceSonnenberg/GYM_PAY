import React from 'react';
import Icon from './Icon';
import { Invoice, Session, Client } from '../types';
import { formatCurrency, invoiceSubtotal } from '../utils/format';
import { useNavigate } from 'react-router-dom';

interface NotificationsModalProps {
    isOpen: boolean;
    onClose: () => void;
    invoices: Invoice[];
    todaySessions: Session[];
    clients: Client[];
}

const NotificationsModal: React.FC<NotificationsModalProps> = ({
    isOpen,
    onClose,
    invoices,
    todaySessions,
    clients
}) => {
    const navigate = useNavigate();
    if (!isOpen) return null;

    const getClientName = (id: string) => clients.find(c => c.id === id)?.name || 'Client';

    const invoiceTotal = (inv: Invoice) => {
        const sub = invoiceSubtotal(inv.items);
        return sub + sub * inv.taxRate;
    };

    const pendingInvoices = invoices.filter(i => i.status === 'sent');
    const paidInvoices = invoices.filter(i => i.status === 'paid').slice(-3);

    const notificationsList = [
        ...todaySessions.map(s => ({
            id: `session-${s.id}`,
            type: 'session' as const,
            title: `Session Today at ${s.time}`,
            description: `${getClientName(s.clientId)} - ${s.sessionType} (${s.format})`,
            icon: 'event',
            iconBg: 'bg-primary-soft text-primary',
            action: () => { onClose(); navigate('/calendar'); }
        })),
        ...pendingInvoices.map(inv => ({
            id: `inv-${inv.id}`,
            type: 'invoice' as const,
            title: `Invoice Pending`,
            description: `${getClientName(inv.clientId)} • ${formatCurrency(invoiceTotal(inv))}`,
            icon: 'pending_actions',
            iconBg: 'bg-amber-500/10 text-amber-600',
            action: () => { onClose(); navigate('/invoices'); }
        })),
        ...paidInvoices.map(inv => ({
            id: `paid-${inv.id}`,
            type: 'payment' as const,
            title: `Payment Received`,
            description: `${getClientName(inv.clientId)} paid ${formatCurrency(invoiceTotal(inv))}`,
            icon: 'check_circle',
            iconBg: 'bg-emerald-500/10 text-emerald-600',
            action: () => { onClose(); navigate('/invoices'); }
        }))
    ];

    return (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm p-0 sm:p-4 animate-fadeIn">
            <div className="w-full max-w-md bg-white rounded-t-3xl sm:rounded-3xl border-2 border-ink shadow-2xl overflow-hidden max-h-[85vh] flex flex-col">
                <div className="flex items-center justify-between p-5 border-b-2 border-ink bg-ink text-white">
                    <div className="flex items-center gap-2">
                        <Icon name="notifications" className="text-volt text-[22px]" />
                        <h3 className="font-display text-lg tracking-wide">NOTIFICATIONS</h3>
                    </div>
                    <button 
                        onClick={onClose}
                        className="size-8 rounded-full bg-white/10 flex items-center justify-center text-white hover:bg-white/20 transition-colors"
                    >
                        <Icon name="close" className="text-[18px]" />
                    </button>
                </div>

                <div className="p-5 overflow-y-auto space-y-3 flex-1">
                    {notificationsList.length === 0 ? (
                        <div className="text-center py-10 text-text-muted">
                            <Icon name="notifications_off" className="text-[36px] mb-2 opacity-50" />
                            <p className="text-xs font-bold uppercase tracking-wider">No new notifications</p>
                        </div>
                    ) : (
                        notificationsList.map(item => (
                            <div 
                                key={item.id}
                                onClick={item.action}
                                className="flex items-center gap-3 p-3.5 rounded-2xl border-2 border-ink bg-surface hover:bg-background cursor-pointer transition-all active:scale-[0.98]"
                            >
                                <div className={`size-10 rounded-full flex items-center justify-center shrink-0 ${item.iconBg}`}>
                                    <Icon name={item.icon} className="text-[20px]" />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="font-bold text-xs text-text-main truncate">{item.title}</p>
                                    <p className="text-[11px] font-medium text-text-muted truncate">{item.description}</p>
                                </div>
                                <Icon name="chevron_right" className="text-text-muted text-[18px]" />
                            </div>
                        ))
                    )}
                </div>

                <div className="p-4 border-t border-border-light bg-background text-center">
                    <p className="text-[10px] font-bold text-text-muted uppercase tracking-widest">
                        GymPay Notification Center
                    </p>
                </div>
            </div>
        </div>
    );
};

export default NotificationsModal;
