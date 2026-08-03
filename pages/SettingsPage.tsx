import React, { useState } from 'react';
import Icon from '../components/Icon';
import BottomNav from '../components/BottomNav';
import { useData } from '../context/DataContext';

type ModalType = 'profile' | 'payout' | 'notifications' | 'invoiceDefaults' | 'taxRate' | 'services' | 'exportData' | 'logout' | null;

const SettingsPage: React.FC = () => {
    const { settings, services, addServicePreset, updateServicePreset, deleteServicePreset, updateProfile, updatePayout, updateNotifications, updateInvoiceDefaults, resetAllData, clients, invoices, expenses } = useData();
    const [activeModal, setActiveModal] = useState<ModalType>(null);
    const [successToast, setSuccessToast] = useState<string | null>(null);

    // Profile form state
    const [profileName, setProfileName] = useState(settings.profile.name);
    const [profileTitle, setProfileTitle] = useState(settings.profile.title);
    const [profileEmail, setProfileEmail] = useState(settings.profile.email);
    const [profilePhone, setProfilePhone] = useState(settings.profile.phone);
    const [profileBio, setProfileBio] = useState(settings.profile.bio);
    const [logoUrl, setLogoUrl] = useState(settings.profile.logoUrl || '');

    // Payout form state
    const [payoutMethod, setPayoutMethod] = useState(settings.payout.method);
    const [accountHolder, setAccountHolder] = useState(settings.payout.accountHolder);
    const [accountNumberLast4, setAccountNumberLast4] = useState(settings.payout.accountNumberLast4);
    const [routingNumber, setRoutingNumber] = useState(settings.payout.routingNumber);
    const [payoutSchedule, setPayoutSchedule] = useState(settings.payout.payoutSchedule);

    // Invoice Defaults form state
    const [defaultDueDays, setDefaultDueDays] = useState(settings.invoiceDefaults.defaultDueDays);
    const [defaultNotes, setDefaultNotes] = useState(settings.invoiceDefaults.defaultNotes);
    const [currency, setCurrency] = useState(settings.invoiceDefaults.currency);

    // Tax Rate form state
    const [taxRatePercent, setTaxRatePercent] = useState((settings.invoiceDefaults.defaultTaxRate * 100).toString());

    // Services Catalog management state
    const [showAddServiceForm, setShowAddServiceForm] = useState(false);
    const [newServiceTitle, setNewServiceTitle] = useState('');
    const [newServiceRate, setNewServiceRate] = useState('');
    const [newServiceSessions, setNewServiceSessions] = useState(4);
    const [editingServiceId, setEditingServiceId] = useState<string | null>(null);

    const triggerToast = (msg: string) => {
        setSuccessToast(msg);
        setTimeout(() => setSuccessToast(null), 3000);
    };

    const handleSaveProfile = () => {
        updateProfile({
            name: profileName,
            title: profileTitle,
            email: profileEmail,
            phone: profilePhone,
            bio: profileBio,
            logoUrl: logoUrl,
        });
        setActiveModal(null);
        triggerToast('Profile & Business Logo updated');
    };

    const handleSavePayout = () => {
        updatePayout({
            method: payoutMethod,
            accountHolder,
            accountNumberLast4,
            routingNumber,
            payoutSchedule,
        });
        setActiveModal(null);
        triggerToast('Payout settings updated');
    };

    const handleSaveInvoiceDefaults = () => {
        updateInvoiceDefaults({
            defaultDueDays: Number(defaultDueDays) || 14,
            defaultNotes,
            currency,
        });
        setActiveModal(null);
        triggerToast('Invoice defaults updated');
    };

    const handleSaveTaxRate = () => {
        const rate = parseFloat(taxRatePercent);
        if (isNaN(rate) || rate < 0) return;
        updateInvoiceDefaults({ defaultTaxRate: rate / 100 });
        setActiveModal(null);
        triggerToast(`Tax rate updated to ${rate}%`);
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
            <header className="sticky top-0 z-30 bg-ink px-5 py-5 flex items-center justify-between">
                <div>
                    <p className="text-[10px] font-bold uppercase tracking-widest text-white/50">Preferences</p>
                    <h1 className="font-display text-2xl text-white tracking-wide">SETTINGS</h1>
                </div>
                <div className="flex size-10 items-center justify-center rounded-full bg-volt text-ink font-display text-sm font-bold overflow-hidden border border-ink">
                    {settings.profile.logoUrl ? (
                        <img src={settings.profile.logoUrl} alt="Logo" className="size-full object-cover" />
                    ) : (
                        settings.profile.name.charAt(0)
                    )}
                </div>
            </header>

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
                        onClick={() => {
                            setProfileName(settings.profile.name);
                            setProfileTitle(settings.profile.title);
                            setProfileEmail(settings.profile.email);
                            setProfilePhone(settings.profile.phone);
                            setProfileBio(settings.profile.bio);
                            setLogoUrl(settings.profile.logoUrl || '');
                            setActiveModal('profile');
                        }}
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
                            onClick={() => {
                                setProfileName(settings.profile.name);
                                setProfileTitle(settings.profile.title);
                                setProfileEmail(settings.profile.email);
                                setProfilePhone(settings.profile.phone);
                                setProfileBio(settings.profile.bio);
                                setActiveModal('profile');
                            }}
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
                            onClick={() => {
                                setPayoutMethod(settings.payout.method);
                                setAccountHolder(settings.payout.accountHolder);
                                setAccountNumberLast4(settings.payout.accountNumberLast4);
                                setRoutingNumber(settings.payout.routingNumber);
                                setPayoutSchedule(settings.payout.payoutSchedule);
                                setActiveModal('payout');
                            }}
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
                            onClick={() => {
                                setDefaultDueDays(settings.invoiceDefaults.defaultDueDays);
                                setDefaultNotes(settings.invoiceDefaults.defaultNotes);
                                setCurrency(settings.invoiceDefaults.currency);
                                setActiveModal('invoiceDefaults');
                            }}
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
                            onClick={() => {
                                setTaxRatePercent((settings.invoiceDefaults.defaultTaxRate * 100).toString());
                                setActiveModal('taxRate');
                            }}
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
                            onClick={() => {
                                if (confirm('Reset all clients, invoices, expenses, and settings to original sample data?')) {
                                    resetAllData();
                                    triggerToast('App reset to initial sample state');
                                }
                            }}
                            className="flex w-full items-center gap-4 p-4 text-left hover:bg-background/60 transition-colors"
                        >
                            <div className="flex size-10 items-center justify-center rounded-full bg-danger-soft text-danger">
                                <Icon name="restart_alt" className="text-[20px]" />
                            </div>
                            <div className="flex-1">
                                <span className="block font-bold text-sm text-danger">Reset Sample Data</span>
                                <span className="block text-xs text-text-muted">Restore default demo dataset</span>
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

            {/* MODALS */}

            {/* 1. Edit Profile Modal */}
            {activeModal === 'profile' && (
                <div className="fixed inset-0 z-50 bg-ink/70 backdrop-blur-sm flex items-center justify-center p-4">
                    <div className="w-full max-w-sm bg-white rounded-3xl border-2 border-ink p-5 space-y-4 shadow-2xl animate-fadeIn">
                        <div className="flex items-center justify-between border-b pb-3 border-border-light">
                            <h3 className="font-display text-lg tracking-wide text-ink">COACH PROFILE</h3>
                            <button onClick={() => setActiveModal(null)} className="text-text-muted hover:text-ink">
                                <Icon name="close" />
                            </button>
                        </div>
                        <div className="space-y-3 text-xs">
                            <div>
                                <label className="block text-text-muted text-[10px] font-bold uppercase tracking-widest mb-1">Full Name</label>
                                <input
                                    value={profileName}
                                    onChange={e => setProfileName(e.target.value)}
                                    className="w-full rounded-xl bg-background border-2 border-border-light focus:border-primary focus:outline-none px-4 py-2.5 font-bold text-sm"
                                />
                            </div>
                            <div>
                                <label className="block text-text-muted text-[10px] font-bold uppercase tracking-widest mb-1">Professional Title</label>
                                <input
                                    value={profileTitle}
                                    onChange={e => setProfileTitle(e.target.value)}
                                    className="w-full rounded-xl bg-background border-2 border-border-light focus:border-primary focus:outline-none px-4 py-2.5 font-bold text-sm"
                                />
                            </div>
                            <div>
                                <label className="block text-text-muted text-[10px] font-bold uppercase tracking-widest mb-1">Email Address</label>
                                <input
                                    type="email"
                                    value={profileEmail}
                                    onChange={e => setProfileEmail(e.target.value)}
                                    className="w-full rounded-xl bg-background border-2 border-border-light focus:border-primary focus:outline-none px-4 py-2.5 font-bold text-sm"
                                />
                            </div>
                            <div>
                                <label className="block text-text-muted text-[10px] font-bold uppercase tracking-widest mb-1">Phone Number</label>
                                <input
                                    type="tel"
                                    value={profilePhone}
                                    onChange={e => setProfilePhone(e.target.value)}
                                    className="w-full rounded-xl bg-background border-2 border-border-light focus:border-primary focus:outline-none px-4 py-2.5 font-bold text-sm"
                                />
                            </div>
                            <div>
                                <label className="block text-text-muted text-[10px] font-bold uppercase tracking-widest mb-1">Coach Bio / Motto</label>
                                <textarea
                                    value={profileBio}
                                    onChange={e => setProfileBio(e.target.value)}
                                    rows={2}
                                    className="w-full rounded-xl bg-background border-2 border-border-light focus:border-primary focus:outline-none px-4 py-2.5 font-medium text-xs resize-none"
                                />
                            </div>

                            {/* Business Logo Upload */}
                            <div className="pt-2 border-t border-border-light">
                                <label className="block text-text-muted text-[10px] font-bold uppercase tracking-widest mb-1.5 flex items-center gap-1">
                                    <Icon name="business" className="text-primary text-[14px]" />
                                    <span>Business Logo (Appears on Invoices)</span>
                                </label>
                                {logoUrl ? (
                                    <div className="flex items-center justify-between p-2 rounded-xl bg-background border-2 border-ink">
                                        <div className="flex items-center gap-2">
                                            <img src={logoUrl} alt="Logo" className="size-10 object-cover rounded-lg border border-ink" />
                                            <span className="text-xs font-bold text-emerald-700">Logo Uploaded</span>
                                        </div>
                                        <button
                                            type="button"
                                            onClick={() => setLogoUrl('')}
                                            className="text-danger hover:text-danger/80 p-1 text-xs font-bold"
                                        >
                                            Remove
                                        </button>
                                    </div>
                                ) : (
                                    <label className="flex items-center justify-center gap-2 w-full h-11 rounded-xl bg-background border-2 border-dashed border-border-light hover:border-ink transition-colors cursor-pointer text-text-muted hover:text-ink">
                                        <Icon name="add_photo_alternate" className="text-primary text-base" />
                                        <span className="text-xs font-bold">Upload Business Logo Image</span>
                                        <input
                                            type="file"
                                            accept="image/*"
                                            onChange={e => {
                                                const file = e.target.files?.[0];
                                                if (!file) return;
                                                const reader = new FileReader();
                                                reader.onloadend = () => setLogoUrl(reader.result as string);
                                                reader.readAsDataURL(file);
                                            }}
                                            className="hidden"
                                        />
                                    </label>
                                )}
                            </div>
                        </div>
                        <div className="flex gap-2 pt-2">
                            <button
                                onClick={handleSaveProfile}
                                className="flex-1 rounded-xl bg-primary text-white font-bold uppercase text-xs tracking-wide py-3 hover:bg-primary-hover transition-colors"
                            >
                                Save Changes
                            </button>
                            <button
                                onClick={() => setActiveModal(null)}
                                className="rounded-xl border-2 border-ink font-bold uppercase text-xs tracking-wide px-4 hover:bg-background transition-colors"
                            >
                                Cancel
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* 2. Payout Modal */}
            {activeModal === 'payout' && (
                <div className="fixed inset-0 z-50 bg-ink/70 backdrop-blur-sm flex items-center justify-center p-4">
                    <div className="w-full max-w-sm bg-white rounded-3xl border-2 border-ink p-5 space-y-4 shadow-2xl animate-fadeIn">
                        <div className="flex items-center justify-between border-b pb-3 border-border-light">
                            <h3 className="font-display text-lg tracking-wide text-ink">PAYOUT SETTINGS</h3>
                            <button onClick={() => setActiveModal(null)} className="text-text-muted hover:text-ink">
                                <Icon name="close" />
                            </button>
                        </div>
                        <div className="space-y-3 text-xs">
                            <div>
                                <label className="block text-text-muted text-[10px] font-bold uppercase tracking-widest mb-1">Payout Method</label>
                                <select
                                    value={payoutMethod}
                                    onChange={e => setPayoutMethod(e.target.value as any)}
                                    className="w-full rounded-xl bg-background border-2 border-border-light focus:border-primary focus:outline-none px-4 py-2.5 font-bold text-sm cursor-pointer"
                                >
                                    <option value="Stripe Direct">Stripe Direct Deposit</option>
                                    <option value="Bank Transfer">ACH Bank Transfer</option>
                                    <option value="PayPal">PayPal Business</option>
                                    <option value="Cash App">Cash App Business</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-text-muted text-[10px] font-bold uppercase tracking-widest mb-1">Account Holder Name</label>
                                <input
                                    value={accountHolder}
                                    onChange={e => setAccountHolder(e.target.value)}
                                    className="w-full rounded-xl bg-background border-2 border-border-light focus:border-primary focus:outline-none px-4 py-2.5 font-bold text-sm"
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-2">
                                <div>
                                    <label className="block text-text-muted text-[10px] font-bold uppercase tracking-widest mb-1">Routing Number</label>
                                    <input
                                        value={routingNumber}
                                        onChange={e => setRoutingNumber(e.target.value)}
                                        className="w-full rounded-xl bg-background border-2 border-border-light focus:border-primary focus:outline-none px-4 py-2.5 font-mono font-bold text-sm"
                                    />
                                </div>
                                <div>
                                    <label className="block text-text-muted text-[10px] font-bold uppercase tracking-widest mb-1">Account (Last 4)</label>
                                    <input
                                        maxLength={4}
                                        value={accountNumberLast4}
                                        onChange={e => setAccountNumberLast4(e.target.value)}
                                        className="w-full rounded-xl bg-background border-2 border-border-light focus:border-primary focus:outline-none px-4 py-2.5 font-mono font-bold text-sm"
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="block text-text-muted text-[10px] font-bold uppercase tracking-widest mb-1">Payout Frequency</label>
                                <select
                                    value={payoutSchedule}
                                    onChange={e => setPayoutSchedule(e.target.value as any)}
                                    className="w-full rounded-xl bg-background border-2 border-border-light focus:border-primary focus:outline-none px-4 py-2.5 font-bold text-sm cursor-pointer"
                                >
                                    <option value="Daily">Daily Payouts</option>
                                    <option value="Weekly">Weekly (Every Monday)</option>
                                    <option value="Monthly">Monthly (1st of Month)</option>
                                </select>
                            </div>
                        </div>
                        <div className="flex gap-2 pt-2">
                            <button
                                onClick={handleSavePayout}
                                className="flex-1 rounded-xl bg-signal text-white font-bold uppercase text-xs tracking-wide py-3 hover:bg-signal/90 transition-colors"
                            >
                                Save Payout Info
                            </button>
                            <button
                                onClick={() => setActiveModal(null)}
                                className="rounded-xl border-2 border-ink font-bold uppercase text-xs tracking-wide px-4 hover:bg-background transition-colors"
                            >
                                Cancel
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* 3. Notifications Modal */}
            {activeModal === 'notifications' && (
                <div className="fixed inset-0 z-50 bg-ink/70 backdrop-blur-sm flex items-center justify-center p-4">
                    <div className="w-full max-w-sm bg-white rounded-3xl border-2 border-ink p-5 space-y-4 shadow-2xl animate-fadeIn">
                        <div className="flex items-center justify-between border-b pb-3 border-border-light">
                            <h3 className="font-display text-lg tracking-wide text-ink">NOTIFICATION PREFERENCES</h3>
                            <button onClick={() => setActiveModal(null)} className="text-text-muted hover:text-ink">
                                <Icon name="close" />
                            </button>
                        </div>
                        <div className="space-y-4 text-xs">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="font-bold text-sm text-ink">Payment Received Alerts</p>
                                    <p className="text-text-muted text-[11px]">Get notified when clients pay invoices</p>
                                </div>
                                <input
                                    type="checkbox"
                                    checked={settings.notifications.paymentAlerts}
                                    onChange={e => updateNotifications({ paymentAlerts: e.target.checked })}
                                    className="size-5 rounded cursor-pointer accent-primary"
                                />
                            </div>

                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="font-bold text-sm text-ink">Session Reminders</p>
                                    <p className="text-text-muted text-[11px]">Alerts 1 hour before scheduled workout</p>
                                </div>
                                <input
                                    type="checkbox"
                                    checked={settings.notifications.sessionReminders}
                                    onChange={e => updateNotifications({ sessionReminders: e.target.checked })}
                                    className="size-5 rounded cursor-pointer accent-primary"
                                />
                            </div>

                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="font-bold text-sm text-ink">Email Client Receipts</p>
                                    <p className="text-text-muted text-[11px]">Send receipt PDF automatically on payment</p>
                                </div>
                                <input
                                    type="checkbox"
                                    checked={settings.notifications.emailReceipts}
                                    onChange={e => updateNotifications({ emailReceipts: e.target.checked })}
                                    className="size-5 rounded cursor-pointer accent-primary"
                                />
                            </div>

                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="font-bold text-sm text-ink">Weekly Revenue Summary</p>
                                    <p className="text-text-muted text-[11px]">Weekly breakdown of income vs expenses</p>
                                </div>
                                <input
                                    type="checkbox"
                                    checked={settings.notifications.weeklyReport}
                                    onChange={e => updateNotifications({ weeklyReport: e.target.checked })}
                                    className="size-5 rounded cursor-pointer accent-primary"
                                />
                            </div>

                            <div className="pt-3 border-t border-border-light space-y-2">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="font-bold text-sm text-ink flex items-center gap-1">
                                            <Icon name="alarm_on" className="text-primary text-[16px]" />
                                            <span>Auto-Reminders for Past-Due Invoices</span>
                                        </p>
                                        <p className="text-text-muted text-[11px]">Automatically notify clients when past due</p>
                                    </div>
                                    <input
                                        type="checkbox"
                                        checked={settings.notifications.autoReminders ?? true}
                                        onChange={e => updateNotifications({ autoReminders: e.target.checked })}
                                        className="size-5 rounded cursor-pointer accent-primary"
                                    />
                                </div>
                                {settings.notifications.autoReminders && (
                                    <div className="flex items-center justify-between bg-background p-2.5 rounded-xl border border-border-light text-xs">
                                        <span className="text-text-muted font-bold">Reminder Trigger Interval</span>
                                        <div className="flex items-center gap-1 font-bold">
                                            <span>Every</span>
                                            <select
                                                value={settings.notifications.reminderDays ?? 3}
                                                onChange={e => updateNotifications({ reminderDays: Number(e.target.value) })}
                                                className="bg-white border border-ink rounded-lg px-2 py-1 text-xs font-bold"
                                            >
                                                <option value={1}>1 Day</option>
                                                <option value={3}>3 Days</option>
                                                <option value={7}>7 Days</option>
                                            </select>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                        <div className="pt-2">
                            <button
                                onClick={() => {
                                    setActiveModal(null);
                                    triggerToast('Notification preferences saved');
                                }}
                                className="w-full rounded-xl bg-ink text-white font-bold uppercase text-xs tracking-wide py-3 hover:bg-black transition-colors"
                            >
                                Done
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* 4. Invoice Defaults Modal */}
            {activeModal === 'invoiceDefaults' && (
                <div className="fixed inset-0 z-50 bg-ink/70 backdrop-blur-sm flex items-center justify-center p-4">
                    <div className="w-full max-w-sm bg-white rounded-3xl border-2 border-ink p-5 space-y-4 shadow-2xl animate-fadeIn">
                        <div className="flex items-center justify-between border-b pb-3 border-border-light">
                            <h3 className="font-display text-lg tracking-wide text-ink">INVOICE DEFAULTS</h3>
                            <button onClick={() => setActiveModal(null)} className="text-text-muted hover:text-ink">
                                <Icon name="close" />
                            </button>
                        </div>
                        <div className="space-y-3 text-xs">
                            <div>
                                <label className="block text-text-muted text-[10px] font-bold uppercase tracking-widest mb-1">Default Due Period</label>
                                <select
                                    value={defaultDueDays}
                                    onChange={e => setDefaultDueDays(Number(e.target.value))}
                                    className="w-full rounded-xl bg-background border-2 border-border-light focus:border-primary focus:outline-none px-4 py-2.5 font-bold text-sm cursor-pointer"
                                >
                                    <option value={7}>7 Days (1 Week)</option>
                                    <option value={14}>14 Days (2 Weeks)</option>
                                    <option value={30}>30 Days (1 Month)</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-text-muted text-[10px] font-bold uppercase tracking-widest mb-1">Base Currency</label>
                                <select
                                    value={currency}
                                    onChange={e => setCurrency(e.target.value)}
                                    className="w-full rounded-xl bg-background border-2 border-border-light focus:border-primary focus:outline-none px-4 py-2.5 font-bold text-sm cursor-pointer"
                                >
                                    <option value="ZAR (R)">ZAR (R) - South African Rand</option>
                                    <option value="USD ($)">USD ($)</option>
                                    <option value="EUR (€)">EUR (€)</option>
                                    <option value="GBP (£)">GBP (£)</option>
                                    <option value="CAD ($)">CAD ($)</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-text-muted text-[10px] font-bold uppercase tracking-widest mb-1">Default Invoice Footer Note</label>
                                <textarea
                                    value={defaultNotes}
                                    onChange={e => setDefaultNotes(e.target.value)}
                                    rows={3}
                                    className="w-full rounded-xl bg-background border-2 border-border-light focus:border-primary focus:outline-none p-3 font-medium text-xs resize-none"
                                />
                            </div>
                        </div>
                        <div className="flex gap-2 pt-2">
                            <button
                                onClick={handleSaveInvoiceDefaults}
                                className="flex-1 rounded-xl bg-primary text-white font-bold uppercase text-xs tracking-wide py-3 hover:bg-primary-hover transition-colors"
                            >
                                Save Defaults
                            </button>
                            <button
                                onClick={() => setActiveModal(null)}
                                className="rounded-xl border-2 border-ink font-bold uppercase text-xs tracking-wide px-4 hover:bg-background transition-colors"
                            >
                                Cancel
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* 5. Tax Rate Modal */}
            {activeModal === 'taxRate' && (
                <div className="fixed inset-0 z-50 bg-ink/70 backdrop-blur-sm flex items-center justify-center p-4">
                    <div className="w-full max-w-sm bg-white rounded-3xl border-2 border-ink p-5 space-y-4 shadow-2xl animate-fadeIn">
                        <div className="flex items-center justify-between border-b pb-3 border-border-light">
                            <h3 className="font-display text-lg tracking-wide text-ink">DEFAULT TAX RATE</h3>
                            <button onClick={() => setActiveModal(null)} className="text-text-muted hover:text-ink">
                                <Icon name="close" />
                            </button>
                        </div>
                        <div className="space-y-3 text-xs">
                            <div>
                                <label className="block text-text-muted text-[10px] font-bold uppercase tracking-widest mb-1">Tax Percentage (%)</label>
                                <div className="relative">
                                    <input
                                        type="number"
                                        step="0.1"
                                        min="0"
                                        max="100"
                                        value={taxRatePercent}
                                        onChange={e => setTaxRatePercent(e.target.value)}
                                        className="w-full rounded-xl bg-background border-2 border-border-light focus:border-primary focus:outline-none px-4 py-2.5 font-mono font-bold text-base"
                                    />
                                    <span className="absolute right-4 top-1/2 -translate-y-1/2 font-bold font-mono text-text-muted">%</span>
                                </div>
                            </div>
                            <p className="text-[11px] text-text-muted italic">
                                This default tax rate will be automatically applied whenever you draft a new invoice for training or services.
                            </p>
                        </div>
                        <div className="flex gap-2 pt-2">
                            <button
                                onClick={handleSaveTaxRate}
                                className="flex-1 rounded-xl bg-signal text-white font-bold uppercase text-xs tracking-wide py-3 hover:bg-signal/90 transition-colors"
                            >
                                Save Tax Rate
                            </button>
                            <button
                                onClick={() => setActiveModal(null)}
                                className="rounded-xl border-2 border-ink font-bold uppercase text-xs tracking-wide px-4 hover:bg-background transition-colors"
                            >
                                Cancel
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* 6. Services & Rates Catalog Modal */}
            {activeModal === 'services' && (
                <div className="fixed inset-0 z-50 bg-ink/70 backdrop-blur-sm flex items-center justify-center p-4">
                    <div className="w-full max-w-sm bg-white rounded-3xl border-2 border-ink p-5 space-y-4 shadow-2xl animate-fadeIn max-h-[90vh] overflow-y-auto">
                        <div className="flex items-center justify-between border-b pb-3 border-border-light sticky top-0 bg-white z-10">
                            <div>
                                <h3 className="font-display text-lg tracking-wide text-ink">SERVICES & RATES CATALOG</h3>
                                <p className="text-[11px] text-text-muted">Manage default rates & session counts</p>
                            </div>
                            <button onClick={() => setActiveModal(null)} className="text-text-muted hover:text-ink">
                                <Icon name="close" />
                            </button>
                        </div>

                        <div className="space-y-3">
                            {services.map(srv => (
                                <div key={srv.id} className="p-3 rounded-2xl bg-background border-2 border-ink space-y-2">
                                    <div className="flex items-start justify-between">
                                        <div className="flex items-center gap-2">
                                            <div className={`size-8 rounded-lg flex items-center justify-center ${srv.iconBg} ${srv.iconColor}`}>
                                                <Icon name={srv.icon} className="text-[18px]" />
                                            </div>
                                            <div>
                                                <p className="font-bold text-xs text-text-main">{srv.title}</p>
                                                <p className="text-[10px] text-text-muted">{srv.category}</p>
                                            </div>
                                        </div>
                                        <button
                                            onClick={() => {
                                                if (services.length <= 1) {
                                                    alert('You must maintain at least one default service.');
                                                    return;
                                                }
                                                deleteServicePreset(srv.id);
                                                triggerToast('Service preset removed');
                                            }}
                                            className="text-text-muted hover:text-danger p-1"
                                        >
                                            <Icon name="delete" className="text-[16px]" />
                                        </button>
                                    </div>

                                    <div className="grid grid-cols-2 gap-2 text-xs pt-1 border-t border-border-light">
                                        <div>
                                            <span className="block text-[9px] font-bold text-text-muted uppercase">Default Rate</span>
                                            <input
                                                type="number"
                                                value={srv.defaultRate}
                                                onChange={e => {
                                                    const r = parseFloat(e.target.value) || 0;
                                                    updateServicePreset(srv.id, { defaultRate: r });
                                                }}
                                                className="w-full rounded-lg border border-border-light px-2 py-1 font-mono font-bold text-xs bg-white"
                                            />
                                        </div>
                                        <div>
                                            <span className="block text-[9px] font-bold text-text-muted uppercase">Default Sessions</span>
                                            <input
                                                type="number"
                                                min="1"
                                                value={srv.defaultSessions}
                                                onChange={e => {
                                                    const s = parseInt(e.target.value) || 1;
                                                    updateServicePreset(srv.id, { defaultSessions: s });
                                                }}
                                                className="w-full rounded-lg border border-border-light px-2 py-1 font-mono font-bold text-xs bg-white text-center"
                                            />
                                        </div>
                                    </div>
                                </div>
                            ))}

                            {showAddServiceForm ? (
                                <div className="p-4 rounded-2xl border-2 border-primary bg-primary-soft/30 space-y-3">
                                    <p className="text-xs font-bold uppercase tracking-wide text-primary">New Service Preset</p>
                                    <div>
                                        <label className="block text-[10px] font-bold text-text-muted uppercase mb-1">Service Title</label>
                                        <input
                                            value={newServiceTitle}
                                            onChange={e => setNewServiceTitle(e.target.value)}
                                            placeholder="e.g. 10x Semi-Private Group Pack"
                                            className="w-full rounded-xl bg-white border border-border-light px-3 py-2 text-xs font-bold focus:outline-none"
                                        />
                                    </div>
                                    <div className="grid grid-cols-2 gap-2">
                                        <div>
                                            <label className="block text-[10px] font-bold text-text-muted uppercase mb-1">Default Rate</label>
                                            <input
                                                type="number"
                                                value={newServiceRate}
                                                onChange={e => setNewServiceRate(e.target.value)}
                                                placeholder="75.00"
                                                className="w-full rounded-xl bg-white border border-border-light px-3 py-2 text-xs font-bold font-mono focus:outline-none"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-[10px] font-bold text-text-muted uppercase mb-1">Sessions</label>
                                            <input
                                                type="number"
                                                min="1"
                                                value={newServiceSessions}
                                                onChange={e => setNewServiceSessions(parseInt(e.target.value) || 1)}
                                                className="w-full rounded-xl bg-white border border-border-light px-3 py-2 text-xs font-bold font-mono text-center focus:outline-none"
                                            />
                                        </div>
                                    </div>
                                    <div className="flex gap-2 pt-1">
                                        <button
                                            onClick={() => {
                                                const rate = parseFloat(newServiceRate);
                                                if (!newServiceTitle.trim() || Number.isNaN(rate)) return;
                                                addServicePreset({
                                                    title: newServiceTitle.trim(),
                                                    category: 'Custom Service',
                                                    details: 'Custom service added by user',
                                                    defaultRate: rate,
                                                    defaultSessions: newServiceSessions,
                                                    icon: 'fitness_center',
                                                    iconBg: 'bg-primary-soft',
                                                    iconColor: 'text-primary',
                                                });
                                                setNewServiceTitle('');
                                                setNewServiceRate('');
                                                setNewServiceSessions(4);
                                                setShowAddServiceForm(false);
                                                triggerToast('New service preset added');
                                            }}
                                            className="flex-1 rounded-xl bg-primary text-white font-bold uppercase text-xs py-2.5"
                                        >
                                            Save Service
                                        </button>
                                        <button
                                            onClick={() => setShowAddServiceForm(false)}
                                            className="rounded-xl border border-ink font-bold uppercase text-xs px-3"
                                        >
                                            Cancel
                                        </button>
                                    </div>
                                </div>
                            ) : (
                                <button
                                    onClick={() => setShowAddServiceForm(true)}
                                    className="w-full rounded-2xl border-2 border-dashed border-ink py-3 text-xs font-bold uppercase tracking-wider text-ink hover:bg-background transition-colors flex items-center justify-center gap-1.5"
                                >
                                    <Icon name="add_circle" className="text-[18px]" />
                                    <span>Add New Default Service</span>
                                </button>
                            )}
                        </div>

                        <div className="pt-2 border-t border-border-light">
                            <button
                                onClick={() => {
                                    setActiveModal(null);
                                    triggerToast('Services catalog saved');
                                }}
                                className="w-full rounded-xl bg-ink text-white font-bold uppercase text-xs tracking-wide py-3 hover:bg-black transition-colors"
                            >
                                Done
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* 6. Logout Modal */}
            {activeModal === 'logout' && (
                <div className="fixed inset-0 z-50 bg-ink/70 backdrop-blur-sm flex items-center justify-center p-4">
                    <div className="w-full max-w-sm bg-white rounded-3xl border-2 border-ink p-6 space-y-4 shadow-2xl text-center animate-fadeIn">
                        <div className="flex size-14 items-center justify-center rounded-full bg-danger-soft text-danger mx-auto border border-danger/20">
                            <Icon name="logout" className="text-3xl" />
                        </div>
                        <h3 className="font-display text-xl tracking-wide text-ink">LOG OUT OF GYMPAY?</h3>
                        <p className="text-xs text-text-muted">
                            You are logged in as <strong className="text-ink">{settings.profile.email}</strong>. Session data will remain preserved locally.
                        </p>
                        <div className="flex gap-2 pt-2">
                            <button
                                onClick={() => {
                                    setActiveModal(null);
                                    triggerToast('Logged out session');
                                }}
                                className="flex-1 rounded-xl bg-danger text-white font-bold uppercase text-xs tracking-wide py-3 hover:bg-danger/90 transition-colors shadow-sm"
                            >
                                Yes, Log Out
                            </button>
                            <button
                                onClick={() => setActiveModal(null)}
                                className="rounded-xl border-2 border-ink font-bold uppercase text-xs tracking-wide px-4 hover:bg-background transition-colors text-ink"
                            >
                                Cancel
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <BottomNav />
        </div>
    );
};

export default SettingsPage;
