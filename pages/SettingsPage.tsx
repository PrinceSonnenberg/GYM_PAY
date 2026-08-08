import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Icon from '../components/Icon';
import PageHeader from '../components/PageHeader';
import Modal from '../components/Modal';
import { useData } from '../context/DataContext';
import { apiFetch } from '../utils/api';

import {
    HomePreferencesModal,
    ThemeModal,
    ProfileSettingsModal,
    PayoutSettingsModal,
    InvoiceDefaultsModal,
    TaxRateModal,
    ServicesSettingsModal,
    LogoutModal
} from '../components/settings';

type ModalType = 'theme' | 'home' | 'profile' | 'payout' | 'notifications' | 'invoiceDefaults' | 'taxRate' | 'services' | 'exportData' | 'logout' | 'seedData' | null;

const SettingsPage: React.FC = () => {
    const navigate = useNavigate();
    const { settings, services, resetAllData, clients, invoices, expenses } = useData();
    const [activeModal, setActiveModal] = useState<ModalType>(null);
    const [successToast, setSuccessToast] = useState<string | null>(null);

    const triggerToast = (msg: string) => {
        setSuccessToast(msg);
        setTimeout(() => setSuccessToast(null), 3000);
    };

    const handleExportJSON = () => {
        const exportObj = { clients, invoices, expenses, settings, exportedAt: new Date().toISOString() };
        const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(exportObj, null, 2));
        const downloadAnchor = document.createElement('a');
        downloadAnchor.setAttribute("href", dataStr);
        downloadAnchor.setAttribute("download", `gympay_backup_${new Date().toISOString().slice(0, 10)}.json`);
        document.body.appendChild(downloadAnchor);
        downloadAnchor.click();
        downloadAnchor.remove();
        triggerToast('Backup JSON exported');
    };

    return (
        <div className="flex flex-col min-h-screen bg-background font-inter text-text-main">
            {/* Header */}
            <PageHeader
                title="SETTINGS"
                eyebrow="Preferences"
                onBack={() => navigate(-1)}
                rightAction={
                    <div className="flex size-10 items-center justify-center rounded-full bg-volt text-ink font-display text-sm font-bold overflow-hidden border border-ink">
                        {settings.profile.logoUrl ? (
                            <img src={settings.profile.logoUrl} alt="Logo" className="size-full object-cover" />
                        ) : (
                            settings.profile.name.charAt(0)
                        )}
                    </div>
                }
            />

            {/* Success Toast */}
            {successToast && (
                <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50 bg-ink text-white px-5 py-3 rounded-2xl border-2 border-volt shadow-2xl flex items-center gap-2 animate-fadeIn text-xs font-bold">
                    <Icon name="check_circle" className="text-volt text-[18px]" />
                    <span>{successToast}</span>
                </div>
            )}

            <main className="flex-1 p-5 pb-28 space-y-6">
                {/* User Card */}
                <div className="p-5 rounded-3xl bg-white border-2 border-ink shadow-card flex items-center gap-4">
                    <div className="flex size-14 shrink-0 items-center justify-center rounded-2xl bg-ink text-volt font-display text-2xl ring-2 ring-ink/10 overflow-hidden">
                        {settings.profile.logoUrl ? (
                            <img src={settings.profile.logoUrl} alt="Business logo" className="size-full object-cover" />
                        ) : (
                            settings.profile.name.charAt(0)
                        )}
                    </div>
                    <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5">
                            <h2 className="font-display text-lg tracking-wide text-ink truncate">{settings.profile.name}</h2>
                            {settings.profile.logoUrl && (
                                <span className="text-[9px] font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">
                                    Logo Set
                                </span>
                            )}
                        </div>
                        <p className="text-xs font-bold text-primary truncate">{settings.profile.title}</p>
                        <p className="text-xs text-text-muted truncate mt-0.5">{settings.profile.email}</p>
                    </div>
                    <button
                        onClick={() => setActiveModal('profile')}
                        className="px-3 py-1.5 rounded-xl bg-background border-2 border-ink text-xs font-bold hover:bg-primary-soft hover:text-primary transition-colors"
                    >
                        Edit
                    </button>
                </div>

                {/* Settings Section Groups */}
                {/* 1. Account */}
                <div>
                    <h3 className="text-xs font-bold text-text-muted uppercase tracking-widest px-1 mb-2">Account & Profile</h3>
                    <div className="rounded-2xl bg-white border-2 border-ink overflow-hidden shadow-sm">
                        <button
                            onClick={() => setActiveModal('profile')}
                            className="flex w-full items-center gap-4 p-4 text-left hover:bg-background/60 transition-colors border-b-2 border-border-light"
                        >
                            <div className="flex size-10 items-center justify-center rounded-full bg-primary-soft text-primary">
                                <Icon name="person" className="text-[20px]" />
                            </div>
                            <div className="flex-1">
                                <span className="block font-bold text-sm text-text-main">Coach Profile</span>
                                <span className="block text-xs text-text-muted">{settings.profile.name} • {settings.profile.email}</span>
                            </div>
                            <Icon name="chevron_right" className="text-text-muted" />
                        </button>

                        <button
                            onClick={() => setActiveModal('payout')}
                            className="flex w-full items-center gap-4 p-4 text-left hover:bg-background/60 transition-colors border-b-2 border-border-light"
                        >
                            <div className="flex size-10 items-center justify-center rounded-full bg-signal-soft text-signal">
                                <Icon name="account_balance" className="text-[20px]" />
                            </div>
                            <div className="flex-1">
                                <span className="block font-bold text-sm text-text-main">Payout Details</span>
                                <span className="block text-xs text-text-muted">{settings.payout.method} • Ending in *{settings.payout.accountNumberLast4}</span>
                            </div>
                            <Icon name="chevron_right" className="text-text-muted" />
                        </button>

                        <button
                            onClick={() => setActiveModal('notifications')}
                            className="flex w-full items-center gap-4 p-4 text-left hover:bg-background/60 transition-colors"
                        >
                            <div className="flex size-10 items-center justify-center rounded-full bg-volt-soft text-ink">
                                <Icon name="notifications" className="text-[20px]" />
                            </div>
                            <div className="flex-1">
                                <span className="block font-bold text-sm text-text-main">Notifications</span>
                                <span className="block text-xs text-text-muted">Receipts, alerts, session reminders</span>
                            </div>
                            <Icon name="chevron_right" className="text-text-muted" />
                        </button>
                    </div>
                </div>

                {/* 2. Business & Invoicing */}
                <div>
                    <h3 className="text-xs font-bold text-text-muted uppercase tracking-widest px-1 mb-2">Business & Invoicing</h3>
                    <div className="rounded-2xl bg-white border-2 border-ink overflow-hidden shadow-sm">
                        <button
                            onClick={() => setActiveModal('invoiceDefaults')}
                            className="flex w-full items-center gap-4 p-4 text-left hover:bg-background/60 transition-colors border-b-2 border-border-light"
                        >
                            <div className="flex size-10 items-center justify-center rounded-full bg-primary-soft text-primary">
                                <Icon name="receipt_long" className="text-[20px]" />
                            </div>
                            <div className="flex-1">
                                <span className="block font-bold text-sm text-text-main">Invoice Defaults</span>
                                <span className="block text-xs text-text-muted">Due in {settings.invoiceDefaults.defaultDueDays} days • {settings.invoiceDefaults.currency}</span>
                            </div>
                            <Icon name="chevron_right" className="text-text-muted" />
                        </button>

                        <button
                            onClick={() => setActiveModal('taxRate')}
                            className="flex w-full items-center gap-4 p-4 text-left hover:bg-background/60 transition-colors border-b-2 border-border-light"
                        >
                            <div className="flex size-10 items-center justify-center rounded-full bg-signal-soft text-signal">
                                <Icon name="sell" className="text-[20px]" />
                            </div>
                            <div className="flex-1">
                                <span className="block font-bold text-sm text-text-main">Default Tax Rate</span>
                                <span className="block text-xs text-text-muted">Currently {(settings.invoiceDefaults.defaultTaxRate * 100).toFixed(1)}%</span>
                            </div>
                            <Icon name="chevron_right" className="text-text-muted" />
                        </button>

                        <button
                            onClick={() => setActiveModal('services')}
                            className="flex w-full items-center gap-4 p-4 text-left hover:bg-background/60 transition-colors"
                        >
                            <div className="flex size-10 items-center justify-center rounded-full bg-volt-soft text-ink">
                                <Icon name="fitness_center" className="text-[20px]" />
                            </div>
                            <div className="flex-1">
                                <span className="block font-bold text-sm text-text-main">Default Services & Rates</span>
                                <span className="block text-xs text-text-muted">{services.length} services configured • Rates & sessions</span>
                            </div>
                            <Icon name="chevron_right" className="text-text-muted" />
                        </button>
                    </div>
                </div>

                {/* 2.5 Appearance */}
                <div>
                    <h3 className="text-xs font-bold text-text-muted uppercase tracking-widest px-1 mb-2">Appearance</h3>
                    <div className="rounded-2xl bg-white border-2 border-ink overflow-hidden shadow-sm">
                        <button
                            onClick={() => setActiveModal('theme')}
                            className="flex w-full items-center gap-4 p-4 text-left hover:bg-background/60 transition-colors"
                        >
                            <div className="flex size-10 items-center justify-center rounded-full bg-signal-soft text-signal">
                                <Icon name="palette" className="text-[20px]" />
                            </div>
                            <div className="flex-1">
                                <span className="block font-bold text-sm text-text-main">App Theme</span>
                                <span className="block text-xs text-text-muted capitalize">{settings.uiTheme?.preset || 'Energetic'} (Default)</span>
                            </div>
                            <Icon name="chevron_right" className="text-text-muted" />
                        </button>
                        <button
                            onClick={() => setActiveModal('home')}
                            className="flex w-full items-center gap-4 p-4 text-left hover:bg-background/60 transition-colors border-t-2 border-border-light"
                        >
                            <div className="flex size-10 items-center justify-center rounded-full bg-volt-soft text-volt">
                                <Icon name="dashboard" className="text-[20px]" />
                            </div>
                            <div className="flex-1">
                                <span className="block font-bold text-sm text-text-main">Home Screen</span>
                                <span className="block text-xs text-text-muted">Customize dashboard widgets</span>
                            </div>
                            <Icon name="chevron_right" className="text-text-muted" />
                        </button>
                    </div>
                </div>

                {/* 3. System & Data */}
                <div>
                    <h3 className="text-xs font-bold text-text-muted uppercase tracking-widest px-1 mb-2">Data & Backup</h3>
                    <div className="rounded-2xl bg-white border-2 border-ink overflow-hidden shadow-sm">
                        <button
                            onClick={handleExportJSON}
                            className="flex w-full items-center gap-4 p-4 text-left hover:bg-background/60 transition-colors border-b-2 border-border-light"
                        >
                            <div className="flex size-10 items-center justify-center rounded-full bg-volt-soft text-ink">
                                <Icon name="download" className="text-[20px]" />
                            </div>
                            <div className="flex-1">
                                <span className="block font-bold text-sm text-text-main">Export Business Backup</span>
                                <span className="block text-xs text-text-muted">Download JSON backup of clients & invoices</span>
                            </div>
                            <Icon name="chevron_right" className="text-text-muted" />
                        </button>

                        <button
                            onClick={() => setActiveModal('seedData')}
                            className="flex w-full items-center gap-4 p-4 text-left hover:bg-background/60 transition-colors"
                        >
                            <div className="flex size-10 items-center justify-center rounded-full bg-danger-soft text-danger">
                                <Icon name="restart_alt" className="text-[20px]" />
                            </div>
                            <div className="flex-1">
                                <span className="block font-bold text-sm text-danger">Load DB Sample Data</span>
                                <span className="block text-xs text-text-muted">Populate DB with sample dataset</span>
                            </div>
                            <Icon name="chevron_right" className="text-text-muted" />
                        </button>
                    </div>
                </div>

                {/* Logout Button */}
                <button
                    onClick={() => setActiveModal('logout')}
                    className="w-full rounded-2xl border-2 border-ink bg-white text-ink font-bold uppercase text-xs tracking-wide py-4 hover:bg-danger-soft hover:text-danger hover:border-danger transition-colors flex items-center justify-center gap-2 shadow-sm"
                >
                    <Icon name="logout" className="text-[18px]" />
                    <span>Log Out Account</span>
                </button>
            </main>

            {/* Render Modals */}
            <HomePreferencesModal open={activeModal === 'home'} onClose={() => setActiveModal(null)} />
            <ThemeModal open={activeModal === 'theme'} onClose={() => setActiveModal(null)} onSuccess={triggerToast} />
            <ProfileSettingsModal open={activeModal === 'profile'} onClose={() => setActiveModal(null)} onSuccess={triggerToast} />
            <PayoutSettingsModal open={activeModal === 'payout'} onClose={() => setActiveModal(null)} onSuccess={triggerToast} />
            <InvoiceDefaultsModal open={activeModal === 'invoiceDefaults'} onClose={() => setActiveModal(null)} onSuccess={triggerToast} />
            <TaxRateModal open={activeModal === 'taxRate'} onClose={() => setActiveModal(null)} onSuccess={triggerToast} />
            <ServicesSettingsModal open={activeModal === 'services'} onClose={() => setActiveModal(null)} onSuccess={triggerToast} />
            <LogoutModal open={activeModal === 'logout'} onClose={() => setActiveModal(null)} />

            <Modal open={activeModal === 'seedData'} onClose={() => setActiveModal(null)}>
                <div className="p-6">
                    <h2 className="text-xl font-display text-ink mb-2">Load DB Sample Data</h2>
                    <p className="text-sm text-text-muted mb-6">
                        Are you sure you want to load sample data? This will clear your current data and add seed records.
                    </p>
                    <div className="flex gap-3">
                        <button
                            onClick={() => setActiveModal(null)}
                            className="flex-1 rounded-full border-2 border-ink py-2.5 font-bold uppercase tracking-wide text-ink text-sm hover:bg-background transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={async () => {
                                setActiveModal(null);
                                try {
                                    const res = await apiFetch('/api/dev/seed', { method: 'POST' });
                                    if (res.ok) {
                                        triggerToast('Sample data seeded successfully. Refreshing...');
                                        setTimeout(() => window.location.reload(), 1500);
                                    } else {
                                        triggerToast('Failed to seed data');
                                    }
                                } catch (e) {
                                    console.error(e);
                                    triggerToast('Error seeding data');
                                }
                            }}
                            className="flex-1 rounded-full bg-danger border-2 border-danger py-2.5 font-bold uppercase tracking-wide text-white text-sm hover:bg-danger/80 transition-colors"
                        >
                            Proceed
                        </button>
                    </div>
                </div>
            </Modal>
        </div>
    );
};

export default SettingsPage;
