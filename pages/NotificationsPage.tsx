import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import Icon from '../components/Icon';
import PageHeader from '../components/PageHeader';
import EmptyState from '../components/EmptyState';
import { useData } from '../context/DataContext';
import { formatCurrency, invoiceSubtotal } from '../utils/format';
import { Session, Invoice, Client } from '../types';

// MARK: - Filter Tab Type
type NotificationCategory = 'all' | 'sessions' | 'invoices' | 'settings';

interface NotificationItem {
    id: string;
    category: 'session' | 'invoice' | 'payment' | 'client';
    title: string;
    subtitle: string;
    timestamp: string;
    icon: string;
    iconBgColor: string;
    badgeText?: string;
    badgeColor?: string;
    actionLabel?: string;
    onAction?: () => void;
    secondaryActionLabel?: string;
    onSecondaryAction?: () => void;
}

const NotificationsPage: React.FC = () => {
    // MARK: - Hooks & Navigation
    const navigate = useNavigate();
    const { 
        clients, 
        invoices, 
        sessions, 
        settings, 
        markInvoicePaid, 
        sendInvoiceReminder,
        updateNotifications 
    } = useData();

    // MARK: - Local State
    const [selectedCategory, setSelectedCategory] = useState<NotificationCategory>('all');
    const [dismissedNotificationIds, setDismissedNotificationIds] = useState<Set<string>>(new Set());
    const [toastMessage, setToastMessage] = useState<string | null>(null);
    const [isProcessingReminderId, setIsProcessingReminderId] = useState<string | null>(null);

    // MARK: - Helper Functions
    const showToast = (message: string) => {
        setToastMessage(message);
        setTimeout(() => setToastMessage(null), 3000);
    };

    const getClientById = (clientId: string): Client | undefined => {
        return (clients || []).find((client) => client.id === clientId);
    };

    const calculateInvoiceTotal = (invoice: Invoice): number => {
        const subtotal = invoiceSubtotal(invoice?.items);
        const taxRate = typeof invoice?.taxRate === 'number' 
            ? invoice.taxRate 
            : parseFloat(String(invoice?.taxRate ?? 0)) || 0;
        const totalAmount = subtotal + subtotal * taxRate;
        return Number.isNaN(totalAmount) ? 0 : totalAmount;
    };

    // Today ISO date string in local timezone (YYYY-MM-DD)
    const todayIsoDate = useMemo(() => {
        const now = new Date();
        const year = now.getFullYear();
        const month = String(now.getMonth() + 1).padStart(2, '0');
        const day = String(now.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    }, []);

    // MARK: - Handlers for Invoices
    const handleSendReminder = async (invoiceId: string, clientName: string) => {
        try {
            setIsProcessingReminderId(invoiceId);
            await sendInvoiceReminder(invoiceId);
            showToast(`Reminder sent to ${clientName}`);
        } catch (error) {
            console.error('Error sending reminder:', error);
            showToast('Failed to send reminder. Please try again.');
        } finally {
            setIsProcessingReminderId(null);
        }
    };

    const handleMarkAsPaid = (invoiceId: string, clientName: string) => {
        markInvoicePaid(invoiceId);
        showToast(`Invoice for ${clientName} marked as paid`);
    };

    const handleDismissNotification = (id: string, e: React.MouseEvent) => {
        e.stopPropagation();
        setDismissedNotificationIds((prev) => {
            const next = new Set(prev);
            next.add(id);
            return next;
        });
    };

    const handleClearAll = () => {
        const allIds = activeNotificationsList.map((item) => item.id);
        setDismissedNotificationIds((prev) => new Set([...prev, ...allIds]));
        showToast('All notifications cleared');
    };

    // MARK: - Build Notification List from Real Live Data
    const activeNotificationsList = useMemo<NotificationItem[]>(() => {
        const list: NotificationItem[] = [];

        // 1. Today's and Upcoming Sessions
        (sessions || []).forEach((session: Session) => {
            const client = getClientById(session.clientId);
            const clientName = client?.name || 'Client';

            if (session.date === todayIsoDate) {
                list.push({
                    id: `session-${session.id}`,
                    category: 'session',
                    title: `Session Today: ${clientName}`,
                    subtitle: `${session.time} • ${session.sessionType} (${session.format})`,
                    timestamp: 'Today',
                    icon: 'fitness_center',
                    iconBgColor: 'bg-volt text-ink',
                    badgeText: 'TODAY',
                    badgeColor: 'bg-volt/30 text-ink border-ink/20',
                    actionLabel: 'View in Calendar',
                    onAction: () => navigate('/calendar'),
                });
            } else if (session.date > todayIsoDate) {
                // Upcoming next sessions within 2 days
                const daysDiff = Math.ceil(
                    (new Date(session.date).getTime() - new Date(todayIsoDate).getTime()) / (1000 * 3600 * 24)
                );
                if (daysDiff <= 2) {
                    list.push({
                        id: `session-upcoming-${session.id}`,
                        category: 'session',
                        title: `Upcoming Session: ${clientName}`,
                        subtitle: `${session.date} at ${session.time} • ${session.sessionType}`,
                        timestamp: daysDiff === 1 ? 'Tomorrow' : `In ${daysDiff} days`,
                        icon: 'calendar_today',
                        iconBgColor: 'bg-primary-soft text-primary',
                        badgeText: 'UPCOMING',
                        badgeColor: 'bg-primary-soft text-primary border-primary/20',
                        actionLabel: 'View in Calendar',
                        onAction: () => navigate('/calendar'),
                    });
                }
            }
        });

        // 2. Pending Invoices (Sent and awaiting payment)
        (invoices || []).forEach((invoice: Invoice) => {
            const client = getClientById(invoice.clientId);
            const clientName = client?.name || 'Client';
            const totalAmount = calculateInvoiceTotal(invoice);

            if (invoice.status === 'sent') {
                const isOverdue = invoice.dueDate && invoice.dueDate < todayIsoDate;
                list.push({
                    id: `invoice-pending-${invoice.id}`,
                    category: 'invoice',
                    title: isOverdue ? `Overdue Invoice: ${clientName}` : `Invoice Awaiting Payment: ${clientName}`,
                    subtitle: `Amount: ${formatCurrency(totalAmount)} • Due ${invoice.dueDate || 'Upon Receipt'}`,
                    timestamp: isOverdue ? 'Overdue' : 'Pending',
                    icon: isOverdue ? 'warning' : 'receipt_long',
                    iconBgColor: isOverdue ? 'bg-danger-soft text-danger' : 'bg-amber-100 text-amber-800',
                    badgeText: isOverdue ? 'OVERDUE' : 'SENT',
                    badgeColor: isOverdue ? 'bg-danger-soft text-danger border-danger/30' : 'bg-amber-50 text-amber-800 border-amber-300',
                    actionLabel: isProcessingReminderId === invoice.id ? 'Sending...' : 'Send Reminder',
                    onAction: () => handleSendReminder(invoice.id, clientName),
                    secondaryActionLabel: 'Mark Paid',
                    onSecondaryAction: () => handleMarkAsPaid(invoice.id, clientName),
                });
            } else if (invoice.status === 'paid') {
                // Show recent paid invoices
                list.push({
                    id: `invoice-paid-${invoice.id}`,
                    category: 'payment',
                    title: `Payment Received: ${clientName}`,
                    subtitle: `Paid ${formatCurrency(totalAmount)} via invoice`,
                    timestamp: invoice.issuedDate || 'Recently',
                    icon: 'check_circle',
                    iconBgColor: 'bg-emerald-100 text-emerald-700',
                    badgeText: 'PAID',
                    badgeColor: 'bg-emerald-50 text-emerald-700 border-emerald-300',
                    actionLabel: 'View Invoices',
                    onAction: () => navigate('/invoices'),
                });
            }
        });

        // 3. At Risk Client Alerts
        (clients || []).forEach((client: Client) => {
            if (client.status === 'At Risk' && !client.isArchived) {
                list.push({
                    id: `client-risk-${client.id}`,
                    category: 'client',
                    title: `Client Engagement Alert: ${client.name}`,
                    subtitle: `Marked as "At Risk". Reach out to maintain consistency.`,
                    timestamp: 'Action Needed',
                    icon: 'person_alert',
                    iconBgColor: 'bg-orange-100 text-orange-700',
                    badgeText: 'AT RISK',
                    badgeColor: 'bg-orange-50 text-orange-700 border-orange-200',
                    actionLabel: 'View Client',
                    onAction: () => navigate('/clients'),
                });
            }
        });

        // Filter out dismissed items
        return list.filter((item) => !dismissedNotificationIds.has(item.id));
    }, [sessions, invoices, clients, todayIsoDate, dismissedNotificationIds, isProcessingReminderId]);

    // MARK: - Category Filtered Notifications
    const filteredNotifications = useMemo(() => {
        if (selectedCategory === 'all') return activeNotificationsList;
        if (selectedCategory === 'sessions') return activeNotificationsList.filter((item) => item.category === 'session');
        if (selectedCategory === 'invoices') return activeNotificationsList.filter((item) => item.category === 'invoice' || item.category === 'payment');
        return [];
    }, [activeNotificationsList, selectedCategory]);

    // MARK: - Notification Preferences Settings
    const notificationPrefs = settings.notifications || {
        emailReceipts: true,
        paymentAlerts: true,
        sessionReminders: true,
        weeklyReport: false,
        autoReminders: true,
        reminderDays: 3,
    };

    const handleTogglePreference = (key: keyof typeof notificationPrefs) => {
        const currentValue = !!notificationPrefs[key];
        updateNotifications({ [key]: !currentValue });
        showToast('Notification preferences updated');
    };

    const handleUpdateReminderDays = (days: number) => {
        updateNotifications({ reminderDays: days });
        showToast(`Reminders set to ${days} days before due date`);
    };

    return (
        <div className="flex flex-col min-h-screen bg-background font-inter text-text-main pb-24">
            {/* MARK: - Header */}
            <PageHeader
                title="NOTIFICATIONS"
                eyebrow="Activity & Alerts"
                onBack={() => navigate('/settings')}
                rightAction={
                    activeNotificationsList.length > 0 && selectedCategory !== 'settings' ? (
                        <button
                            type="button"
                            onClick={handleClearAll}
                            className="px-2.5 py-1 rounded-xl bg-volt text-ink font-display text-[11px] font-bold border border-ink shadow-xs hover:bg-volt/80 transition-colors uppercase tracking-wider cursor-pointer"
                        >
                            Clear All
                        </button>
                    ) : (
                        <div className="size-10 flex items-center justify-center rounded-full bg-volt text-ink border border-ink">
                            <Icon name="notifications" className="text-[20px]" />
                        </div>
                    )
                }
            />

            {/* MARK: - Floating Toast */}
            {toastMessage && (
                <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50 bg-ink text-white px-5 py-3 rounded-2xl border-2 border-volt shadow-2xl flex items-center gap-2 animate-fadeIn text-xs font-bold">
                    <Icon name="check_circle" className="text-volt text-[18px]" />
                    <span>{toastMessage}</span>
                </div>
            )}

            {/* MARK: - Category Filter Tabs */}
            <div className="px-5 pt-4 pb-2 bg-background sticky top-[72px] z-20">
                <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-1">
                    <button
                        type="button"
                        onClick={() => setSelectedCategory('all')}
                        className={`px-3.5 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all border-2 border-ink cursor-pointer ${
                            selectedCategory === 'all'
                                ? 'bg-ink text-white shadow-sm'
                                : 'bg-white text-text-muted hover:text-ink'
                        }`}
                    >
                        All ({activeNotificationsList.length})
                    </button>
                    <button
                        type="button"
                        onClick={() => setSelectedCategory('sessions')}
                        className={`px-3.5 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all border-2 border-ink cursor-pointer ${
                            selectedCategory === 'sessions'
                                ? 'bg-ink text-white shadow-sm'
                                : 'bg-white text-text-muted hover:text-ink'
                        }`}
                    >
                        Sessions ({activeNotificationsList.filter((n) => n.category === 'session').length})
                    </button>
                    <button
                        type="button"
                        onClick={() => setSelectedCategory('invoices')}
                        className={`px-3.5 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all border-2 border-ink cursor-pointer ${
                            selectedCategory === 'invoices'
                                ? 'bg-ink text-white shadow-sm'
                                : 'bg-white text-text-muted hover:text-ink'
                        }`}
                    >
                        Invoices & Dues ({activeNotificationsList.filter((n) => n.category === 'invoice' || n.category === 'payment').length})
                    </button>
                    <button
                        type="button"
                        onClick={() => setSelectedCategory('settings')}
                        className={`px-3.5 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all border-2 border-ink cursor-pointer flex items-center gap-1 ${
                            selectedCategory === 'settings'
                                ? 'bg-ink text-white shadow-sm'
                                : 'bg-white text-text-muted hover:text-ink'
                        }`}
                    >
                        <Icon name="tune" className="text-[14px]" />
                        <span>Preferences</span>
                    </button>
                </div>
            </div>

            {/* MARK: - Main Content */}
            <main className="flex-1 px-5 py-3 space-y-4">
                {selectedCategory === 'settings' ? (
                    // MARK: - Notification Preferences Screen
                    <div className="space-y-4 animate-fadeIn">
                        <div className="rounded-2xl bg-white border-2 border-ink p-5 shadow-card">
                            <div className="flex items-center gap-3 mb-4">
                                <div className="size-10 rounded-xl bg-volt flex items-center justify-center text-ink border border-ink">
                                    <Icon name="tune" className="text-[20px]" />
                                </div>
                                <div>
                                    <h3 className="font-display text-base tracking-wide text-ink">ALERT PREFERENCES</h3>
                                    <p className="text-xs text-text-muted">Control when and how you receive alerts</p>
                                </div>
                            </div>

                            <div className="divide-y-2 divide-border-light">
                                {/* Session Reminders */}
                                <div className="py-3.5 flex items-center justify-between gap-4">
                                    <div>
                                        <p className="font-bold text-sm text-text-main">Session Reminders</p>
                                        <p className="text-xs text-text-muted">Daily alerts for scheduled client appointments</p>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => handleTogglePreference('sessionReminders')}
                                        className={`w-12 h-6 rounded-full transition-colors relative border border-ink cursor-pointer shrink-0 ${
                                            notificationPrefs.sessionReminders ? 'bg-volt' : 'bg-gray-200'
                                        }`}
                                    >
                                        <span
                                            className={`size-4 rounded-full bg-ink absolute top-0.5 transition-transform ${
                                                notificationPrefs.sessionReminders ? 'left-6' : 'left-1'
                                            }`}
                                        />
                                    </button>
                                </div>

                                {/* Payment Alerts */}
                                <div className="py-3.5 flex items-center justify-between gap-4">
                                    <div>
                                        <p className="font-bold text-sm text-text-main">Payment Alerts</p>
                                        <p className="text-xs text-text-muted">Notify when invoices are paid, due, or overdue</p>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => handleTogglePreference('paymentAlerts')}
                                        className={`w-12 h-6 rounded-full transition-colors relative border border-ink cursor-pointer shrink-0 ${
                                            notificationPrefs.paymentAlerts ? 'bg-volt' : 'bg-gray-200'
                                        }`}
                                    >
                                        <span
                                            className={`size-4 rounded-full bg-ink absolute top-0.5 transition-transform ${
                                                notificationPrefs.paymentAlerts ? 'left-6' : 'left-1'
                                            }`}
                                        />
                                    </button>
                                </div>

                                {/* Email Receipts */}
                                <div className="py-3.5 flex items-center justify-between gap-4">
                                    <div>
                                        <p className="font-bold text-sm text-text-main">Email Receipts to Clients</p>
                                        <p className="text-xs text-text-muted">Automatically send payment confirmations</p>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => handleTogglePreference('emailReceipts')}
                                        className={`w-12 h-6 rounded-full transition-colors relative border border-ink cursor-pointer shrink-0 ${
                                            notificationPrefs.emailReceipts ? 'bg-volt' : 'bg-gray-200'
                                        }`}
                                    >
                                        <span
                                            className={`size-4 rounded-full bg-ink absolute top-0.5 transition-transform ${
                                                notificationPrefs.emailReceipts ? 'left-6' : 'left-1'
                                            }`}
                                        />
                                    </button>
                                </div>

                                {/* Weekly Summary Report */}
                                <div className="py-3.5 flex items-center justify-between gap-4">
                                    <div>
                                        <p className="font-bold text-sm text-text-main">Weekly Summary Report</p>
                                        <p className="text-xs text-text-muted">Weekly digest of revenue and attendance stats</p>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => handleTogglePreference('weeklyReport')}
                                        className={`w-12 h-6 rounded-full transition-colors relative border border-ink cursor-pointer shrink-0 ${
                                            notificationPrefs.weeklyReport ? 'bg-volt' : 'bg-gray-200'
                                        }`}
                                    >
                                        <span
                                            className={`size-4 rounded-full bg-ink absolute top-0.5 transition-transform ${
                                                notificationPrefs.weeklyReport ? 'left-6' : 'left-1'
                                            }`}
                                        />
                                    </button>
                                </div>

                                {/* Auto Reminders Advance Days */}
                                <div className="py-3.5 space-y-2">
                                    <div className="flex items-center justify-between">
                                        <p className="font-bold text-sm text-text-main">Auto-Reminder Timing</p>
                                        <span className="text-xs font-bold text-ink bg-volt px-2 py-0.5 rounded border border-ink">
                                            {notificationPrefs.reminderDays || 3} days before
                                        </span>
                                    </div>
                                    <p className="text-xs text-text-muted">Send payment reminder notices ahead of the due date</p>
                                    <div className="grid grid-cols-4 gap-2 pt-1">
                                        {[1, 3, 5, 7].map((days) => (
                                            <button
                                                key={days}
                                                type="button"
                                                onClick={() => handleUpdateReminderDays(days)}
                                                className={`py-2 rounded-xl text-xs font-bold border-2 border-ink transition-all cursor-pointer ${
                                                    (notificationPrefs.reminderDays || 3) === days
                                                        ? 'bg-ink text-white shadow-sm'
                                                        : 'bg-surface text-text-main hover:bg-background'
                                                }`}
                                            >
                                                {days} {days === 1 ? 'day' : 'days'}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Back to Settings navigation pill */}
                        <div className="text-center pt-2">
                            <button
                                type="button"
                                onClick={() => navigate('/settings')}
                                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white border-2 border-ink text-xs font-bold text-text-main hover:bg-background transition-colors cursor-pointer"
                            >
                                <Icon name="arrow_back" className="text-[16px]" />
                                <span>Return to Settings Overview</span>
                            </button>
                        </div>
                    </div>
                ) : filteredNotifications.length === 0 ? (
                    // MARK: - Empty State
                    <div className="py-12 bg-white rounded-3xl border-2 border-ink p-8 text-center shadow-card">
                        <div className="size-16 rounded-2xl bg-volt-soft text-ink flex items-center justify-center mx-auto mb-3 border border-ink/10">
                            <Icon name="notifications_off" className="text-[32px] text-text-muted" />
                        </div>
                        <h3 className="font-display text-base tracking-wide text-ink mb-1">ALL CAUGHT UP</h3>
                        <p className="text-xs text-text-muted max-w-xs mx-auto mb-5">
                            You have no active alerts or pending action items in this category.
                        </p>
                        <button
                            type="button"
                            onClick={() => setSelectedCategory('all')}
                            className="px-4 py-2 rounded-xl bg-volt text-ink font-bold text-xs border-2 border-ink hover:bg-volt/80 transition-colors shadow-sm cursor-pointer"
                        >
                            View All Categories
                        </button>
                    </div>
                ) : (
                    // MARK: - Notification Cards List
                    <div className="space-y-3">
                        {filteredNotifications.map((item) => (
                            <div
                                key={item.id}
                                className="p-4 rounded-2xl border-2 border-ink bg-white shadow-card transition-all hover:translate-y-[-1px]"
                            >
                                <div className="flex items-start gap-3">
                                    {/* Icon */}
                                    <div className={`size-11 rounded-xl flex items-center justify-center shrink-0 border border-ink/15 shadow-xs ${item.iconBgColor}`}>
                                        <Icon name={item.icon} className="text-[22px]" />
                                    </div>

                                    {/* Content */}
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center justify-between gap-2">
                                            <h4 className="font-bold text-sm text-text-main truncate">{item.title}</h4>
                                            <button
                                                type="button"
                                                onClick={(e) => handleDismissNotification(item.id, e)}
                                                className="text-text-muted hover:text-danger p-0.5 rounded cursor-pointer transition-colors"
                                                title="Dismiss notification"
                                            >
                                                <Icon name="close" className="text-[16px]" />
                                            </button>
                                        </div>

                                        <p className="text-xs text-text-muted mt-0.5 line-clamp-2">{item.subtitle}</p>

                                        <div className="flex items-center justify-between mt-3 pt-2 border-t border-border-light/60">
                                            <div className="flex items-center gap-2">
                                                {item.badgeText && (
                                                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded border uppercase tracking-wider ${item.badgeColor}`}>
                                                        {item.badgeText}
                                                    </span>
                                                )}
                                                <span className="text-[11px] text-text-muted font-medium">{item.timestamp}</span>
                                            </div>

                                            {/* Action Buttons */}
                                            <div className="flex items-center gap-1.5">
                                                {item.secondaryActionLabel && item.onSecondaryAction && (
                                                    <button
                                                        type="button"
                                                        onClick={item.onSecondaryAction}
                                                        className="px-2.5 py-1 rounded-lg bg-surface border border-ink text-ink font-bold text-xs hover:bg-background transition-colors cursor-pointer"
                                                    >
                                                        {item.secondaryActionLabel}
                                                    </button>
                                                )}
                                                {item.actionLabel && item.onAction && (
                                                    <button
                                                        type="button"
                                                        onClick={item.onAction}
                                                        className="px-3 py-1 rounded-lg bg-ink text-white font-bold text-xs hover:bg-ink/80 transition-colors shadow-xs cursor-pointer flex items-center gap-1"
                                                    >
                                                        <span>{item.actionLabel}</span>
                                                        <Icon name="chevron_right" className="text-[14px]" />
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </main>
        </div>
    );
};

export default NotificationsPage;
