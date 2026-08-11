
import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import Icon from '../components/Icon';
import AttendanceBadge from '../components/AttendanceBadge';
import AttendanceModal from '../components/AttendanceModal';
import { useData } from '../context/DataContext';
import PageHeader from '../components/PageHeader';
import EmptyState from '../components/EmptyState';
import Modal from '../components/Modal';
import { Client, Session } from '../types';
import { formatCurrency } from '../utils/format';
import { validateClient } from '../utils/validation';

const statusDotStyle: Record<string, string> = {
    'On Track': 'bg-emerald-500 ring-2 ring-emerald-500/20',
    'At Risk': 'bg-rose-500 ring-2 ring-rose-500/20',
    'New': 'bg-sky-500 ring-2 ring-sky-500/20',
};

const statusBadgeStyle: Record<string, string> = {
    'On Track': 'bg-emerald-50 text-emerald-700 border-emerald-200',
    'At Risk': 'bg-rose-50 text-rose-700 border-rose-200',
    'New': 'bg-sky-50 text-sky-700 border-sky-200',
};

const ClientsPage: React.FC = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const { clients, invoices, settings, addClient, updateClient, archiveClient, restoreClient, deleteClient, getClientSessions, clientError, clearClientError } = useData();
    const [showForm, setShowForm] = useState(false);
    const [viewTab, setViewTab] = useState<'active' | 'archived'>('active');

    useEffect(() => {
        if (location.search.includes('add=true')) {
            setShowForm(true);
        }
    }, [location.search]);
    const [searchQuery, setSearchQuery] = useState('');
    const [editingClient, setEditingClient] = useState<Client | null>(null);
    const [selectedDetailClient, setSelectedDetailClient] = useState<Client | null>(null);
    const [showContactInfo, setShowContactInfo] = useState(false);
    const [activeAttendanceSession, setActiveAttendanceSession] = useState<Session | null>(null);

    // Form state for creating or editing clients
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [phone, setPhone] = useState('');
    const [status, setStatus] = useState<'On Track' | 'At Risk' | 'New'>('New');
    const [formError, setFormError] = useState<string | null>(null);

    /**
     * Resets form fields and closes modal dialogs.
     */
    const resetForm = () => {
        setName('');
        setEmail('');
        setPhone('');
        setStatus('New');
        setFormError(null);
        setShowForm(false);
        setEditingClient(null);
    };

    /**
     * Creates a new client record after validating input fields.
     */
    const handleAdd = () => {
        setFormError(null);
        const errors = validateClient({ name, email, phone });
        if (errors.length > 0) {
            setFormError(errors[0]);
            return;
        }
        const newClient = addClient(name.trim(), email.trim() || undefined, phone.trim() || undefined, status);
        resetForm();
        navigate(`/clients/${newClient.id}/goals`);
    };

    /**
     * Updates an existing client record after validating input fields.
     */
    const handleUpdate = () => {
        if (!editingClient) return;
        setFormError(null);
        const errors = validateClient({ name, email, phone });
        if (errors.length > 0) {
            setFormError(errors[0]);
            return;
        }
        updateClient(editingClient.id, {
            name: name.trim(),
            email: email.trim() || undefined,
            phone: phone.trim() || undefined,
            status,
        });
        resetForm();
    };

    /**
     * Populates form state to edit an existing client.
     */
    const startEditing = (client: Client, e: React.MouseEvent) => {
        e.stopPropagation();
        setEditingClient(client);
        setName(client.name);
        setEmail(client.email || '');
        setPhone(client.phone || '');
        setStatus(client.status);
        setFormError(null);
        setShowForm(true);
        setSelectedDetailClient(null);
    };

    const activeClients = clients.filter(c => !c.isArchived && (c as any).is_archived !== true && c.status !== 'Archived');
    const archivedClients = clients.filter(c => Boolean(c.isArchived || (c as any).is_archived || c.status === 'Archived'));
    const currentRoster = viewTab === 'active' ? activeClients : archivedClients;

    const filteredClients = currentRoster.filter(c =>
        c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (c.email && c.email.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (c.phone && c.phone.includes(searchQuery))
    );

    const getClientInvoiceSummary = (clientId: string) => {
        const clientInvoices = invoices.filter(i => i.clientId === clientId);
        const totalBilled = clientInvoices.reduce((sum, inv) => {
            if (inv.status === 'cancelled') return sum;
            const subtotal = (inv.items || []).reduce((s, item) => s + (item.amount || 0), 0);
            let afterDiscount = subtotal;
            if (inv.discountType === 'percentage' && typeof inv.discountValue === 'number') {
                afterDiscount = subtotal - (subtotal * (inv.discountValue / 100));
            } else if (inv.discountType === 'fixed' && typeof inv.discountValue === 'number') {
                afterDiscount = Math.max(0, subtotal - inv.discountValue);
            }
            const tax = afterDiscount * (inv.taxRate ?? 0);
            return sum + afterDiscount + tax;
        }, 0);
        const paidInvoices = clientInvoices.filter(i => (i.status || '').toLowerCase() === 'paid');
        return { count: clientInvoices.length, paidCount: paidInvoices.length, totalBilled };
    };

    const formatClientSince = (dateStr?: string) => {
        if (!dateStr) return 'Sep 2023';
        const parsed = new Date(dateStr);
        if (isNaN(parsed.getTime())) return 'Sep 2023';
        return parsed.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
    };

    const handleBack = () => {
        if (window.history.state && window.history.state.idx > 0) {
            navigate(-1);
        } else {
            navigate('/');
        }
    };

    return (
        <div className="flex flex-col min-h-screen bg-background font-inter text-text-main">
            <PageHeader
                title={viewTab === 'active' ? `CLIENTS (${activeClients.length})` : `ARCHIVED (${archivedClients.length})`}
                eyebrow={viewTab === 'active' ? "Active Roster" : "Archived Clients"}
                onBack={handleBack}
                rightAction={
                    <button
                        onClick={() => {
                            if (showForm) {
                                resetForm();
                            } else {
                                setShowForm(true);
                            }
                        }}
                        aria-label="Add a client"
                        className="flex size-11 items-center justify-center rounded-full bg-primary text-white border-2 border-white/20 hover:bg-primary-hover transition-colors shadow-sm"
                    >
                        <Icon name={showForm ? 'close' : 'person_add'} className="text-[22px]" />
                    </button>
                }
            >
                {clients.length > 0 && !showForm && (
                    <div className="relative">
                        <Icon name="search" className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/40 text-[18px]" />
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={e => setSearchQuery(e.target.value)}
                            placeholder="Search by name, email, or phone..."
                            className="w-full rounded-xl bg-white/10 border border-white/20 text-white placeholder-white/40 pl-10 pr-4 py-2 text-xs font-medium focus:outline-none focus:border-volt"
                        />
                        {searchQuery && (
                            <button onClick={() => setSearchQuery('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-white">
                                <Icon name="close" className="text-[16px]" />
                            </button>
                        )}
                    </div>
                )}
            </PageHeader>

            {/* Active vs Archived Tab Switcher */}
            <div className="flex items-center gap-2 p-3 bg-white border-b-2 border-ink">
                <button
                    onClick={() => setViewTab('active')}
                    className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl font-bold text-xs uppercase tracking-wider transition-all ${
                        viewTab === 'active'
                            ? 'bg-ink text-volt border-2 border-ink shadow-sm'
                            : 'bg-background text-text-muted hover:text-ink border-2 border-transparent'
                    }`}
                >
                    <Icon name="person" className="text-sm shrink-0" />
                    <span>Active ({activeClients.length})</span>
                </button>
                <button
                    onClick={() => setViewTab('archived')}
                    className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl font-bold text-xs uppercase tracking-wider transition-all ${
                        viewTab === 'archived'
                            ? 'bg-amber-500 text-white border-2 border-amber-600 shadow-sm'
                            : 'bg-background text-text-muted hover:text-ink border-2 border-transparent'
                    }`}
                >
                    <Icon name="archive" className="text-sm shrink-0" />
                    <span>Archived ({archivedClients.length})</span>
                </button>
            </div>

            {/* Add / Edit Form Modal */}
            {showForm && (
                <div className="p-5 bg-white border-b-2 border-ink space-y-4 shadow-lg animate-fadeIn">
                    <div className="flex items-center justify-between border-b pb-2 border-border-light">
                        <h3 className="font-display text-base tracking-wide text-ink">
                            {editingClient ? 'EDIT CLIENT DETAILS' : 'CREATE NEW CLIENT'}
                        </h3>
                        <span className="text-xs text-text-muted font-bold">Required: Name + Email or Phone</span>
                    </div>

                    {(formError || clientError) && (
                        <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs font-bold rounded-xl flex items-center justify-between">
                            <span>{formError || clientError}</span>
                            {clientError && (
                                <button onClick={clearClientError} className="text-rose-500 hover:text-rose-700 text-sm font-bold ml-2">
                                    ✕
                                </button>
                            )}
                        </div>
                    )}

                    <div className="space-y-3">
                        <div>
                            <label className="block text-text-muted text-[10px] font-bold uppercase tracking-widest mb-1">Full Name *</label>
                            <input
                                autoFocus
                                value={name}
                                onChange={e => setName(e.target.value)}
                                placeholder="e.g. Sarah Jenkins"
                                className="w-full rounded-xl bg-background border-2 border-border-light focus:border-primary focus:outline-none px-4 py-2.5 font-bold text-sm"
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <label className="block text-text-muted text-[10px] font-bold uppercase tracking-widest mb-1">
                                    Email Address <span className="text-danger">*</span>
                                </label>
                                <input
                                    type="email"
                                    required
                                    value={email}
                                    onChange={e => setEmail(e.target.value)}
                                    placeholder="sarah@example.com"
                                    className="w-full rounded-xl bg-background border-2 border-border-light focus:border-primary focus:outline-none px-4 py-2.5 font-bold text-sm"
                                />
                            </div>
                            <div>
                                <label className="block text-text-muted text-[10px] font-bold uppercase tracking-widest mb-1">Phone Number (Optional)</label>
                                <input
                                    type="tel"
                                    value={phone}
                                    onChange={e => setPhone(e.target.value)}
                                    placeholder="082 123 4567 or +27 82 123 4567"
                                    className="w-full rounded-xl bg-background border-2 border-border-light focus:border-primary focus:outline-none px-4 py-2.5 font-bold text-sm"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-text-muted text-[10px] font-bold uppercase tracking-widest mb-1">Client Status</label>
                            <select
                                value={status}
                                onChange={e => setStatus(e.target.value as 'On Track' | 'At Risk' | 'New')}
                                className="w-full rounded-xl bg-background border-2 border-border-light focus:border-primary focus:outline-none px-4 py-2.5 font-bold text-sm cursor-pointer"
                            >
                                <option value="New">New Client</option>
                                <option value="On Track">On Track</option>
                                <option value="At Risk">At Risk</option>
                            </select>
                        </div>
                    </div>

                    <div className="flex gap-2 pt-2">
                        <button
                            onClick={editingClient ? handleUpdate : handleAdd}
                            disabled={!name.trim() || !email.trim()}
                            className="flex-1 rounded-xl bg-primary text-white font-bold uppercase text-xs tracking-wide py-3 hover:bg-primary-hover transition-colors disabled:opacity-40 shadow-sm"
                        >
                            {editingClient ? 'Save Changes' : 'Create Client'}
                        </button>
                        <button
                            onClick={resetForm}
                            className="rounded-xl border-2 border-ink font-bold uppercase text-xs tracking-wide px-5 hover:bg-background transition-colors"
                        >
                            Cancel
                        </button>
                    </div>
                </div>
            )}

            {currentRoster.length === 0 ? (
                <main className="flex-1">
                    <EmptyState
                        icon={viewTab === 'active' ? 'groups' : 'archive'}
                        title={viewTab === 'active' ? 'NO ACTIVE CLIENTS' : 'NO ARCHIVED CLIENTS'}
                        description={viewTab === 'active' 
                            ? 'Add your first client to manage goals and invoices cleanly.'
                            : 'Archived clients will appear here. You can restore them to your active roster anytime.'
                        }
                        action={viewTab === 'active' ? { label: "Add a Client", icon: "person_add", onClick: () => setShowForm(true) } : undefined}
                    />
                </main>
            ) : (
                <main className="flex-1 p-5 pb-28 space-y-3">
                    {filteredClients.length === 0 ? (
                        <div className="text-center py-10 bg-white rounded-2xl border-2 border-ink p-6">
                            <Icon name="search_off" className="text-4xl text-text-muted mb-2" />
                            <p className="font-bold text-sm">No clients match "{searchQuery}"</p>
                        </div>
                    ) : (
                        filteredClients.map(client => {
                            const summary = getClientInvoiceSummary(client.id);
                            return (
                                <div
                                    key={client.id}
                                    onClick={() => {
                                        setSelectedDetailClient(client);
                                        setShowContactInfo(false);
                                    }}
                                    className="group rounded-2xl bg-white border-2 border-ink p-4 space-y-3 shadow-card transition-all hover:border-primary cursor-pointer active:scale-[0.995]"
                                >
                                    <div className="flex items-center justify-between gap-3">
                                        <div className="flex items-center gap-3 min-w-0 flex-1">
                                            <div className="relative flex size-11 shrink-0 items-center justify-center rounded-full bg-ink text-volt font-display text-base font-bold ring-2 ring-ink/10">
                                                {client.name.charAt(0)}
                                                {/* Round status dot with clean tooltip */}
                                                <span
                                                    title={`Status: ${client.status}`}
                                                    className={`absolute -top-0.5 -right-0.5 size-3.5 rounded-full border-2 border-white ${statusDotStyle[client.status]}`}
                                                />
                                            </div>
                                            <div className="min-w-0 flex-1">
                                                <div className="flex items-center gap-2">
                                                    <p className="font-bold text-base text-text-main truncate group-hover:text-primary transition-colors">{client.name}</p>
                                                    {client.isArchived && (
                                                        <span className="text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 border border-amber-300">
                                                            Archived
                                                        </span>
                                                    )}
                                                </div>
                                                <p className="text-xs text-text-muted truncate mt-0.5 font-medium">
                                                    {summary.count === 0 ? 'No invoices yet' : `${summary.count} invoice${summary.count > 1 ? 's' : ''} • ${summary.paidCount} paid`}
                                                </p>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-1 shrink-0">
                                            {!client.isArchived && (
                                                <button
                                                    onClick={(e) => startEditing(client, e)}
                                                    title="Edit Client"
                                                    className="p-2 rounded-xl text-text-muted hover:text-ink hover:bg-background transition-colors"
                                                >
                                                    <Icon name="edit" className="text-[18px]" />
                                                </button>
                                            )}
                                            {!client.isArchived ? (
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        archiveClient(client.id);
                                                    }}
                                                    title="Archive Client"
                                                    className="p-2 rounded-xl text-amber-600 hover:text-amber-800 hover:bg-amber-50 transition-colors"
                                                >
                                                    <Icon name="archive" className="text-[18px]" />
                                                </button>
                                            ) : (
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        restoreClient(client.id);
                                                    }}
                                                    title="Restore Client"
                                                    className="p-2 rounded-xl text-emerald-600 hover:text-emerald-800 hover:bg-emerald-50 transition-colors"
                                                >
                                                    <Icon name="unarchive" className="text-[18px]" />
                                                </button>
                                            )}
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    if (confirm(`Remove ${client.name} permanently from roster?`)) {
                                                        deleteClient(client.id);
                                                    }
                                                }}
                                                title="Delete Client"
                                                className="p-2 rounded-xl text-text-muted hover:text-danger hover:bg-danger-soft transition-colors"
                                            >
                                                <Icon name="delete" className="text-[18px]" />
                                            </button>
                                        </div>
                                    </div>

                                    {/* Actions Row */}
                                    {!client.isArchived ? (
                                        <div className="flex items-center gap-2 pt-2 border-t border-border-light">
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    navigate(`/invoice/${client.id}`);
                                                }}
                                                className="flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-background hover:bg-primary-soft hover:text-primary text-xs font-bold uppercase tracking-wider transition-colors border-2 border-ink text-ink whitespace-nowrap"
                                            >
                                                <Icon name="receipt" className="text-[16px] shrink-0" />
                                                <span>Create Invoice</span>
                                            </button>
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    navigate(`/clients/${client.id}/goals`);
                                                }}
                                                className="flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-background hover:bg-volt-soft hover:text-ink text-xs font-bold uppercase tracking-wider transition-colors border-2 border-ink text-ink whitespace-nowrap"
                                            >
                                                <Icon name="flag" className="text-[16px] shrink-0" />
                                                <span>Goals</span>
                                            </button>
                                        </div>
                                    ) : (
                                        <div className="flex items-center gap-2 pt-2 border-t border-border-light">
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    restoreClient(client.id);
                                                }}
                                                className="w-full flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold uppercase tracking-wider transition-colors border-2 border-amber-600 shadow-sm"
                                            >
                                                <Icon name="unarchive" className="text-[16px] shrink-0" />
                                                <span>Restore to Active Roster</span>
                                            </button>
                                        </div>
                                    )}
                                </div>
                            );
                        })
                    )}
                </main>
            )}

            {/* Client Detail Modal */}
            <Modal open={!!selectedDetailClient} onClose={() => setSelectedDetailClient(null)}>
                {selectedDetailClient && (
                    <div className="p-5 space-y-4">
                        <div className="flex items-center justify-between border-b pb-3 border-border-light">
                            <div className="flex items-center gap-3">
                                <div className="flex size-12 items-center justify-center rounded-2xl bg-ink text-volt font-display text-xl font-bold">
                                    {selectedDetailClient.name.charAt(0)}
                                </div>
                                <div>
                                    <h3 className="font-display text-lg tracking-wide text-ink">{selectedDetailClient.name}</h3>
                                    <span className={`inline-block text-[10px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-full border ${statusBadgeStyle[selectedDetailClient.status]}`}>
                                        {selectedDetailClient.status}
                                    </span>
                                </div>
                            </div>
                            <button
                                onClick={() => setSelectedDetailClient(null)}
                                className="size-8 flex items-center justify-center rounded-full hover:bg-background text-text-muted hover:text-ink"
                            >
                                <Icon name="close" />
                            </button>
                        </div>

                        {/* Contact Information */}
                        <div className="space-y-2">
                            <div className="flex items-center justify-between">
                                <h4 className="text-[10px] font-bold uppercase tracking-widest text-text-muted">Contact Information</h4>
                                <button
                                    type="button"
                                    onClick={() => setShowContactInfo(!showContactInfo)}
                                    className="flex items-center gap-1.5 text-xs font-bold text-primary hover:text-primary-hover px-2.5 py-1 rounded-full bg-primary-soft hover:bg-primary-soft/80 border border-primary/20 transition-all cursor-pointer active:scale-95"
                                >
                                    <Icon name={showContactInfo ? 'visibility_off' : 'visibility'} className="text-[15px]" />
                                    <span>{showContactInfo ? 'Hide Details' : 'Show Details'}</span>
                                </button>
                            </div>

                            {showContactInfo ? (
                                <div className="bg-background rounded-2xl p-3 border border-border-light space-y-2 text-xs animate-fadeIn">
                                    <div className="flex items-center justify-between">
                                        <span className="text-text-muted flex items-center gap-1.5">
                                            <Icon name="mail" className="text-[16px]" />
                                            Email:
                                        </span>
                                        {selectedDetailClient.email ? (
                                            <a href={`mailto:${selectedDetailClient.email}`} className="font-bold text-primary hover:underline truncate max-w-[180px]">
                                                {selectedDetailClient.email}
                                            </a>
                                        ) : (
                                            <span className="text-text-muted italic">Not provided</span>
                                        )}
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <span className="text-text-muted flex items-center gap-1.5">
                                            <Icon name="call" className="text-[16px]" />
                                            Phone:
                                        </span>
                                        {selectedDetailClient.phone ? (
                                            <a href={`tel:${selectedDetailClient.phone}`} className="font-mono font-bold text-ink hover:underline">
                                                {selectedDetailClient.phone}
                                            </a>
                                        ) : (
                                            <span className="text-text-muted italic">Not provided</span>
                                        )}
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <span className="text-text-muted flex items-center gap-1.5">
                                            <Icon name="event" className="text-[16px]" />
                                            Client Since:
                                        </span>
                                        <span className="font-bold text-ink">
                                            {formatClientSince(selectedDetailClient.createdAt)}
                                        </span>
                                    </div>
                                </div>
                            ) : (
                                <div 
                                    onClick={() => setShowContactInfo(true)}
                                    className="bg-background/60 hover:bg-background rounded-2xl p-3 border border-dashed border-border-light text-center cursor-pointer transition-all group"
                                >
                                    <p className="text-xs text-text-muted font-medium group-hover:text-ink transition-colors flex items-center justify-center gap-1.5">
                                        <Icon name="lock" className="text-sm text-text-muted" />
                                        Personal details hidden • Tap to view
                                    </p>
                                </div>
                            )}
                        </div>

                        {/* Financial Summary */}
                        {(() => {
                            const summary = getClientInvoiceSummary(selectedDetailClient.id);
                            return (
                                <div className="space-y-2">
                                    <h4 className="text-[10px] font-bold uppercase tracking-widest text-text-muted">Account Summary</h4>
                                    <div className="grid grid-cols-2 gap-2">
                                        <div className="bg-white border-2 border-ink rounded-xl p-3">
                                            <p className="text-[10px] text-text-muted font-bold uppercase">Total Invoices</p>
                                            <p className="font-display text-lg text-ink">{summary.count}</p>
                                        </div>
                                        <div className="bg-white border-2 border-ink rounded-xl p-3">
                                            <p className="text-[10px] text-text-muted font-bold uppercase">Total Billed</p>
                                            <p className="font-display text-lg text-signal">{formatCurrency(summary.totalBilled, settings.invoiceDefaults.currency)}</p>
                                        </div>
                                    </div>
                                </div>
                            );
                        })()}

                        {/* Session Attendance Breakdown */}
                        {(() => {
                            const clientSessions = getClientSessions(selectedDetailClient.id);
                            const attended = clientSessions.filter(s => s.status === 'attended').length;
                            const lateCancel = clientSessions.filter(s => s.status === 'cancelled_late').length;
                            const carryOver = clientSessions.filter(s => s.status === 'carry_over').length;

                            return (
                                <div className="space-y-2">
                                    <h4 className="text-[10px] font-bold uppercase tracking-widest text-text-muted">Session Attendance</h4>
                                    <div className="bg-background border border-border-light rounded-2xl p-3 space-y-2">
                                        <div className="grid grid-cols-3 gap-1 text-center">
                                            <div className="bg-emerald-500/10 rounded-lg p-2 border border-emerald-500/20">
                                                <p className="text-[9px] font-bold uppercase text-emerald-800">Attended</p>
                                                <p className="font-display text-base text-emerald-700">{attended}</p>
                                            </div>
                                            <div className="bg-danger/10 rounded-lg p-2 border border-danger/20">
                                                <p className="text-[9px] font-bold uppercase text-danger">Late Cancel</p>
                                                <p className="font-display text-base text-danger">{lateCancel}</p>
                                            </div>
                                            <div className="bg-amber-500/10 rounded-lg p-2 border border-amber-500/20">
                                                <p className="text-[9px] font-bold uppercase text-amber-800">Carry Over</p>
                                                <p className="font-display text-base text-amber-700">{carryOver}</p>
                                            </div>
                                        </div>

                                        {clientSessions.length > 0 && (
                                            <div className="space-y-1.5 pt-1">
                                                <p className="text-[9px] font-bold uppercase text-text-muted">Client Sessions</p>
                                                <div className="space-y-1 max-h-36 overflow-y-auto pr-1">
                                                    {clientSessions.map(s => (
                                                        <div key={s.id} className="flex items-center justify-between bg-white rounded-xl p-2 border border-border-light text-xs">
                                                            <div>
                                                                <p className="font-bold text-text-main text-[11px]">{s.sessionType}</p>
                                                                <p className="text-[10px] text-text-muted">{s.date} • {s.time}</p>
                                                            </div>
                                                            <AttendanceBadge
                                                                status={s.status}
                                                                onClick={() => setActiveAttendanceSession(s)}
                                                            />
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            );
                        })()}

                        {/* Actions in Modal */}
                        <div className="space-y-2 pt-2 border-t border-border-light">
                            {!selectedDetailClient.isArchived ? (
                                <>
                                    <button
                                        onClick={() => {
                                            const id = selectedDetailClient.id;
                                            setSelectedDetailClient(null);
                                            navigate(`/invoice/${id}`);
                                        }}
                                        className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-primary text-white font-bold uppercase text-xs tracking-wider hover:bg-primary-hover transition-colors shadow-sm"
                                    >
                                        <Icon name="receipt" className="text-[18px]" />
                                        <span>Create New Invoice</span>
                                    </button>
                                    <div className="flex gap-2">
                                        <button
                                            onClick={() => {
                                                const id = selectedDetailClient.id;
                                                setSelectedDetailClient(null);
                                                navigate(`/clients/${id}/goals`);
                                            }}
                                            className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl border-2 border-ink font-bold uppercase text-xs tracking-wide hover:bg-background transition-colors text-ink"
                                        >
                                            <Icon name="flag" className="text-[16px]" />
                                            <span>Goals</span>
                                        </button>
                                        <button
                                            onClick={(e) => startEditing(selectedDetailClient, e)}
                                            className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl border-2 border-ink font-bold uppercase text-xs tracking-wide hover:bg-background transition-colors text-ink"
                                        >
                                            <Icon name="edit" className="text-[16px]" />
                                            <span>Edit Info</span>
                                        </button>
                                    </div>
                                    <button
                                        onClick={() => {
                                            const id = selectedDetailClient.id;
                                            archiveClient(id);
                                            setSelectedDetailClient(null);
                                        }}
                                        className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl border-2 border-amber-500 text-amber-700 font-bold uppercase text-xs tracking-wider hover:bg-amber-50 transition-colors"
                                    >
                                        <Icon name="archive" className="text-[18px]" />
                                        <span>Archive Client</span>
                                    </button>
                                </>
                            ) : (
                                <button
                                    onClick={() => {
                                        const id = selectedDetailClient.id;
                                        restoreClient(id);
                                        setSelectedDetailClient(null);
                                    }}
                                    className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-amber-500 text-white font-bold uppercase text-xs tracking-wider hover:bg-amber-600 transition-colors shadow-sm"
                                >
                                    <Icon name="unarchive" className="text-[18px]" />
                                    <span>Restore Client to Active Roster</span>
                                </button>
                            )}
                        </div>
                    </div>
                )}
            </Modal>

            {/* Attendance Modal */}
            <AttendanceModal
                session={activeAttendanceSession}
                onClose={() => setActiveAttendanceSession(null)}
            />
        </div>
    );
};

export default ClientsPage;

