import { apiFetch } from "../utils/api";
import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { auth } from '../src/lib/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { Client, Invoice, InvoiceItem, ExpenseItem, ActiveGoal, Session, SessionAttendanceStatus, UserSettings, ServicePreset } from '../types';
import { DEFAULT_SERVICES } from '../data/servicesData';

const defaultUserSettings: UserSettings = {
    profile: {
        name: 'Alex Sonnenberg',
        title: 'Head Strength & Conditioning Coach',
        email: 'coach.alex@gympayfit.com',
        phone: '(555) 789-0123',
        bio: 'Cert. CSCS Coach with 8+ years helping clients crush fitness goals.',
    },
    payout: {
        method: 'Stripe Direct',
        accountHolder: 'Alex Sonnenberg Fitness LLC',
        accountNumberLast4: '4892',
        routingNumber: '121000358',
        payoutSchedule: 'Weekly',
    },
    notifications: {
        emailReceipts: true,
        paymentAlerts: true,
        sessionReminders: true,
        weeklyReport: false,
        autoReminders: true,
        reminderDays: 3,
    },
    uiTheme: { 
        preset: "energetic", 
    },
    homePreferences: {
        showRevenue: true,
        showIncomeTrend: true,
        showQuickActions: true,
        showSchedule: true,
        showExpenses: true,
        showPendingInvoices: true,
    },
    invoiceDefaults: {
        defaultDueDays: 14,
        defaultTaxRate: 0.05,
        defaultNotes: 'Thank you for your business! Payment due upon receipt.',
        currency: 'ZAR (R)',
    },
};

interface DataContextType {
    clients: Client[];
    invoices: Invoice[];
    expenses: ExpenseItem[];
    goals: ActiveGoal[];
    sessions: Session[];
    services: ServicePreset[];
    settings: UserSettings;
    updateUiTheme: (theme: Partial<UserSettings["uiTheme"]>) => void;
    updateHomePreferences: (prefs: Partial<UserSettings["homePreferences"]>) => void;
    addClient: (name: string, email?: string, phone?: string, status?: 'On Track' | 'At Risk' | 'New') => Client;
    updateClient: (id: string, updates: Partial<Client>) => void;
    archiveClient: (id: string) => void;
    restoreClient: (id: string) => void;
    deleteClient: (id: string) => void;
    addInvoice: (invoice: Omit<Invoice, 'id'> & { status?: 'sent' | 'paid' | 'overdue' }) => Invoice;
    markInvoicePaid: (id: string) => void;
    sendInvoiceReminder: (id: string) => Promise<void>;
    deleteInvoice: (id: string) => void;
    addExpense: (expense: Omit<ExpenseItem, 'id'>) => void;
    addGoal: (goal: Omit<ActiveGoal, 'id'>) => void;
    updateGoal: (id: string, updates: Partial<ActiveGoal>) => void;
    deleteGoal: (id: string) => void;
    addSession: (session: Omit<Session, 'id'>) => void;
    updateSessionStatus: (id: string, status: SessionAttendanceStatus, notes?: string) => void;
    updateSession: (id: string, updates: Partial<Session>) => void;
    removeSession: (id: string) => void;
    addServicePreset: (service: Omit<ServicePreset, 'id'>) => ServicePreset;
    updateServicePreset: (id: string, updates: Partial<ServicePreset>) => void;
    deleteServicePreset: (id: string) => void;
    getClientGoals: (clientId: string) => ActiveGoal[];
    getClientInvoices: (clientId: string) => Invoice[];
    getClientSessions: (clientId: string) => Session[];
    getSessionsForDate: (date: string) => Session[];
    updateProfile: (profile: Partial<UserSettings['profile']>) => void;
    updatePayout: (payout: Partial<UserSettings['payout']>) => void;
    updateNotifications: (notifications: Partial<UserSettings['notifications']>) => void;
    updateInvoiceDefaults: (defaults: Partial<UserSettings['invoiceDefaults']>) => void;
    resetAllData: () => void;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

const seedClients: Client[] = [
    { id: 'c1', name: 'Sarah Jenkins', email: 'sarah.jenkins@fitmail.com', phone: '(555) 234-5678', status: 'On Track', createdAt: '2023-09-15' },
    { id: 'c2', name: 'Mike Ross', email: 'mike.ross@pearson.com', phone: '(555) 876-5432', status: 'At Risk', createdAt: '2023-10-01' },
    { id: 'c3', name: 'Jessica Pearson', email: 'jessica.p@pearsonlaw.com', phone: '(555) 999-0011', status: 'New', createdAt: '2023-10-18' },
];

const seedGoals: ActiveGoal[] = [
    { id: 'g1', clientId: 'c1', icon: 'fitness_center', iconBg: 'bg-primary-soft', iconColor: 'text-primary', title: 'Bench Press Max', description: 'Strength • Ends Dec 12', progress: 87, currentValue: '215', targetValue: '245 kg', progressLabel: '87%', progressColor: 'bg-primary' },
    { id: 'g2', clientId: 'c1', icon: 'local_fire_department', iconBg: 'bg-signal-soft', iconColor: 'text-signal', title: 'Body Fat %', description: 'Composition • Ends Nov 30', progress: 40, currentValue: '18.5', targetValue: '15 %', progressLabel: '-3.5%', progressColor: 'bg-signal' },
];

const seedExpenses: ExpenseItem[] = [
    { id: 'e1', name: 'Gym Rent - Monthly', date: 'Nov 12, 2023', amount: -500, category: 'Rent', icon: 'real_estate_agent', iconBg: 'bg-primary-soft', iconColor: 'text-primary' },
    { id: 'e2', name: 'Resistance Bands', date: 'Nov 10, 2023', amount: -45.99, category: 'Equipment', icon: 'fitness_center', iconBg: 'bg-signal-soft', iconColor: 'text-signal' },
    { id: 'e3', name: 'IG Ads Campaign', date: 'Nov 08, 2023', amount: -120, category: 'Marketing', icon: 'campaign', iconBg: 'bg-volt-soft', iconColor: 'text-ink' },
    { id: 'e4', name: 'Travel to Client', date: 'Nov 05, 2023', amount: -25.5, category: 'Travel', icon: 'local_gas_station', iconBg: 'bg-danger-soft', iconColor: 'text-danger' },
];

const seedInvoices: Invoice[] = [
    {
        id: 'inv1', clientId: 'c1', issuedDate: '2023-10-24', dueDate: '2023-11-07', status: 'sent', taxRate: 0.05,
        notes: 'Thank you for your hard work! Keep crushing those goals.',
        items: [
            { id: 'i1', icon: 'fitness_center', iconBg: 'bg-primary-soft', iconColor: 'text-primary', title: '1 hr Personal Training', details: '1 hr × $80.00/hr', amount: 80 },
            { id: 'i2', icon: 'restaurant', iconBg: 'bg-signal-soft', iconColor: 'text-signal', title: 'Nutrition Plan', details: 'Monthly Plan', amount: 50 },
        ],
    },
    {
        id: 'inv2', clientId: 'c2', issuedDate: '2023-10-20', dueDate: '2023-11-03', status: 'paid', taxRate: 0.05,
        notes: '',
        items: [
            { id: 'i3', icon: 'fitness_center', iconBg: 'bg-primary-soft', iconColor: 'text-primary', title: '1 hr Personal Training', details: '1 hr × $80.00/hr', amount: 80 },
        ],
    },
];

const isoOffset = (days: number) => {
    const d = new Date();
    d.setDate(d.getDate() + days);
    return d.toISOString().slice(0, 10);
};

const seedSessions: Session[] = [
    { id: 's1', clientId: 'c1', date: isoOffset(0), time: '09:00 AM', sessionType: 'Leg Day • Hypertrophy', format: 'video', status: 'attended' },
    { id: 's2', clientId: 'c2', date: isoOffset(0), time: '11:30 AM', sessionType: 'HIIT Session • Endurance', format: 'location', status: 'scheduled' },
    { id: 's3', clientId: 'c3', date: isoOffset(0), time: '02:00 PM', sessionType: 'Video Call • Assessment', format: 'video', status: 'cancelled_late' },
    { id: 's4', clientId: 'c1', date: isoOffset(2), time: '10:00 AM', sessionType: 'Upper Body • Strength', format: 'location', status: 'carry_over' },
    { id: 's5', clientId: 'c2', date: isoOffset(5), time: '04:00 PM', sessionType: 'Nutrition Check-in', format: 'video', status: 'scheduled' },
];

const loadLocal = <T,>(key: string, fallback: T): T => {
    try {
        const item = localStorage.getItem(key);
        return item ? JSON.parse(item) : fallback;
    } catch {
        return fallback;
    }
};

const getInvoiceTotalAmount = (inv: Partial<Invoice>): number => {
    if (!inv || !Array.isArray(inv.items) || inv.items.length === 0) return 0;
    const sub = inv.items.reduce((sum, item) => {
        const amt = typeof item?.amount === 'number' ? item.amount : parseFloat(String(item?.amount ?? 0));
        return sum + (Number.isNaN(amt) ? 0 : amt);
    }, 0);
    const tax = typeof inv.taxRate === 'number' ? inv.taxRate : parseFloat(String(inv.taxRate ?? 0)) || 0;
    return sub + sub * tax;
};

export const DataProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [clients, setClients] = useState<Client[]>(() => loadLocal('app_clients', seedClients));
    const [invoices, setInvoices] = useState<Invoice[]>(() => 
        loadLocal<Invoice[]>('app_invoices', seedInvoices).filter(inv => getInvoiceTotalAmount(inv) > 0)
    );
    const [expenses, setExpenses] = useState<ExpenseItem[]>(() => loadLocal('app_expenses', seedExpenses));
    const [goals, setGoals] = useState<ActiveGoal[]>(() => loadLocal('app_goals', seedGoals));
    const [sessions, setSessions] = useState<Session[]>(() => loadLocal('app_sessions', seedSessions));
    const [services, setServices] = useState<ServicePreset[]>(() => loadLocal('app_services', DEFAULT_SERVICES));
    const [settings, setSettings] = useState<UserSettings>(() => loadLocal('app_settings', defaultUserSettings));

    useEffect(() => localStorage.setItem('app_clients', JSON.stringify(clients)), [clients]);
    useEffect(() => localStorage.setItem('app_invoices', JSON.stringify(invoices)), [invoices]);
    useEffect(() => localStorage.setItem('app_expenses', JSON.stringify(expenses)), [expenses]);
    useEffect(() => localStorage.setItem('app_goals', JSON.stringify(goals)), [goals]);
    useEffect(() => localStorage.setItem('app_sessions', JSON.stringify(sessions)), [sessions]);
    useEffect(() => localStorage.setItem('app_services', JSON.stringify(services)), [services]);
    useEffect(() => localStorage.setItem('app_settings', JSON.stringify(settings)), [settings]);

    
    /**
     * Persists updated user settings to the backend database.
     */
    const saveSettingsToDb = (newSettings: UserSettings) => {
        apiFetch('/api/settings', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(newSettings),
        }).catch(err => console.error('Cloud SQL sync error (settings):', err));
    };

    /**
     * Loads initial application state (settings, clients, invoices, goals, expenses, sessions)
     * from the backend server database once Firebase authentication state has initialized.
     */
    useEffect(() => {
        const fetchInitialAppData = async () => {
            try {
                // Fetch saved user settings and preferences
                const settingsRes = await apiFetch('/api/settings');
                if (settingsRes.ok) {
                    const settingsData = await settingsRes.json();
                    if (settingsData) {
                        setSettings(prev => ({
                            ...prev, 
                            ...settingsData, 
                            homePreferences: { ...prev.homePreferences, ...(settingsData.homePreferences || {}) }
                        }));
                    }
                }

                // Fetch clients list
                const clientsRes = await apiFetch('/api/clients');
                if (clientsRes.ok) {
                    const clientsData = await clientsRes.json();
                    if (clientsData) setClients(clientsData);
                }

                // Fetch invoices list
                const invoicesRes = await apiFetch('/api/invoices');
                if (invoicesRes.ok) {
                    const invoicesData = await invoicesRes.json();
                    if (Array.isArray(invoicesData)) {
                        setInvoices(invoicesData.filter(inv => getInvoiceTotalAmount(inv) > 0));
                    }
                }

                // Fetch client goals
                const goalsRes = await apiFetch('/api/goals');
                if (goalsRes.ok) {
                    const goalsData = await goalsRes.json();
                    if (goalsData) setGoals(goalsData);
                }

                // Fetch expenses list
                const expensesRes = await apiFetch('/api/expenses');
                if (expensesRes.ok) {
                    const expensesData = await expensesRes.json();
                    if (expensesData) setExpenses(expensesData);
                }

                // Fetch calendar training sessions
                const sessionsRes = await apiFetch('/api/sessions');
                if (sessionsRes.ok) {
                    const sessionsData = await sessionsRes.json();
                    if (sessionsData) setSessions(sessionsData);
                }
            } catch (err) {
                console.error('Error loading initial data from DB:', err);
            }
        };

        // Listen for Firebase authentication state readiness before fetching user data
        const unsubscribe = onAuthStateChanged(auth, (_user) => {
            fetchInitialAppData();
        });
        
        return () => unsubscribe();
    }, []);

    const updateProfile = (profileUpdates: Partial<UserSettings['profile']>) => {
        setSettings(prev => {
            const next = { ...prev, profile: { ...prev.profile, ...profileUpdates } };
            saveSettingsToDb(next);
            return next;
        });
    };

    const updatePayout = (payoutUpdates: Partial<UserSettings['payout']>) => {
        setSettings(prev => {
            const next = { ...prev, payout: { ...prev.payout, ...payoutUpdates } };
            saveSettingsToDb(next);
            return next;
        });
    };

    const updateNotifications = (notifUpdates: Partial<UserSettings['notifications']>) => {
        setSettings(prev => {
            const next = { ...prev, notifications: { ...prev.notifications, ...notifUpdates } };
            saveSettingsToDb(next);
            return next;
        });
    };


    const updateHomePreferences = (prefs: Partial<UserSettings['homePreferences']>) => {
        setSettings(prev => {
            const next = { ...prev, homePreferences: { ...(prev.homePreferences || {
                showRevenue: true,
                showIncomeTrend: true,
                showQuickActions: true,
                showSchedule: true,
                showExpenses: true,
                showPendingInvoices: true,
            }), ...prefs } };
            saveSettingsToDb(next);
            return next;
        });
    };

    const updateUiTheme = (themeUpdates: Partial<UserSettings['uiTheme']>) => {
        setSettings(prev => {
            const next = { ...prev, uiTheme: { ...(prev.uiTheme || { preset: "energetic" }), ...themeUpdates } };
            saveSettingsToDb(next);
            return next;
        });
    };

    const updateInvoiceDefaults = (defaultUpdates: Partial<UserSettings['invoiceDefaults']>) => {
        setSettings(prev => {
            const next = { ...prev, invoiceDefaults: { ...prev.invoiceDefaults, ...defaultUpdates } };
            saveSettingsToDb(next);
            return next;
        });
    };

    const resetAllData = () => {
        setClients(seedClients);
        setInvoices(seedInvoices);
        setExpenses(seedExpenses);
        setGoals(seedGoals);
        setSessions(seedSessions);
        setServices(DEFAULT_SERVICES);
        setSettings(defaultUserSettings);
    };

    const addServicePreset = (service: Omit<ServicePreset, 'id'>): ServicePreset => {
        const newPreset: ServicePreset = { ...service, id: crypto.randomUUID() };
        setServices(prev => [...prev, newPreset]);
        return newPreset;
    };

    const updateServicePreset = (id: string, updates: Partial<ServicePreset>) => {
        setServices(prev => prev.map(s => s.id === id ? { ...s, ...updates } : s));
    };

    const deleteServicePreset = (id: string) => {
        setServices(prev => prev.filter(s => s.id !== id));
    };

    const addClient = (name: string, email?: string, phone?: string, status: 'On Track' | 'At Risk' | 'New' = 'New'): Client => {
        const client: Client = {
            id: crypto.randomUUID(),
            name: name.trim(),
            email: email?.trim() || undefined,
            phone: phone?.trim() || undefined,
            status,
            createdAt: new Date().toISOString(),
        };
        setClients(prev => [...prev, client]);
        apiFetch('/api/clients', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(client),
        }).catch(err => console.error('Cloud SQL sync error:', err));
        return client;
    };

    const updateClient = (id: string, updates: Partial<Client>) => {
        setClients(prev => {
            const updated = prev.map(c => c.id === id ? { ...c, ...updates } : c);
            const target = updated.find(c => c.id === id);
            if (target) {
                apiFetch(`/api/clients/${id}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(target),
                }).catch(err => console.error('Cloud SQL sync error:', err));
            }
            return updated;
        });
    };

    const archiveClient = (id: string) => {
        updateClient(id, { isArchived: true });
    };

    const restoreClient = (id: string) => {
        updateClient(id, { isArchived: false });
    };

    const deleteClient = (id: string) => {
        setClients(prev => prev.filter(c => c.id !== id));
        apiFetch(`/api/clients/${id}`, { method: 'DELETE' }).catch(err => console.error('Cloud SQL sync error:', err));
    };

    const addInvoice = (invoice: Omit<Invoice, 'id'> & { status?: 'sent' | 'paid' | 'overdue' }): Invoice => {
        const newInv: Invoice = { status: invoice.status || 'sent', ...invoice, id: crypto.randomUUID() };
        if (getInvoiceTotalAmount(newInv) <= 0) {
            throw new Error("Invoice total must be greater than zero.");
        }
        setInvoices(prev => [newInv, ...prev].filter(inv => getInvoiceTotalAmount(inv) > 0));
        apiFetch('/api/invoices', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(newInv),
        }).catch(err => console.error('Cloud SQL sync error:', err));
        return newInv;
    };

    const markInvoicePaid = (id: string) => {
        let updatedInvoice: Invoice | null = null;
        setInvoices(prev => prev.map(inv => {
            if (inv.id === id) {
                updatedInvoice = { ...inv, status: 'paid' };
                return updatedInvoice;
            }
            return inv;
        }));
        if (updatedInvoice) {
            apiFetch(`/api/invoices/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(updatedInvoice),
            }).catch(err => console.error('Cloud SQL sync error (mark invoice paid):', err));
        }
    };

    const sendInvoiceReminder = async (id: string): Promise<void> => {
        const res = await apiFetch(`/api/invoices/${id}/send`, {
            method: 'POST',
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) {
            throw new Error(data.error || 'Failed to send invoice email.');
        }
        const updatedInvoice = data.invoice;
        const nowStr = new Date().toISOString().slice(0, 10);
        setInvoices(prev => prev.map(inv => {
            if (inv.id === id) {
                return {
                    ...inv,
                    lastReminderSentAt: updatedInvoice?.lastReminderSentAt || nowStr,
                    remindersCount: updatedInvoice?.remindersCount ?? ((inv.remindersCount || 0) + 1),
                };
            }
            return inv;
        }));
    };

    const deleteInvoice = (id: string) => {
        setInvoices(prev => prev.filter(inv => inv.id !== id));
    };

    const addExpense: DataContextType['addExpense'] = (expense) => {
        setExpenses(prev => [{ ...expense, id: crypto.randomUUID() }, ...prev]);
    };

    const addGoal: DataContextType['addGoal'] = (goal) => {
        const newGoal = { ...goal, id: crypto.randomUUID() };
        setGoals(prev => [...prev, newGoal]);
        apiFetch('/api/goals', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(newGoal),
        }).catch(err => console.error('Cloud SQL sync error:', err));
    };

    const updateGoal = (id: string, updates: Partial<ActiveGoal>) => {
        setGoals(prev => prev.map(g => g.id === id ? { ...g, ...updates } : g));
        apiFetch(`/api/goals/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(updates),
        }).catch(err => console.error('Cloud SQL sync error:', err));
    };

    const deleteGoal = (id: string) => {
        setGoals(prev => prev.filter(g => g.id !== id));
        apiFetch(`/api/goals/${id}`, { method: 'DELETE' }).catch(err => console.error('Cloud SQL sync error:', err));
    };

    const addSession: DataContextType['addSession'] = (session) => {
        setSessions(prev => [...prev, { ...session, id: crypto.randomUUID(), status: session.status || 'scheduled' }]);
    };

    const updateSessionStatus = (id: string, status: SessionAttendanceStatus, notes?: string) => {
        setSessions(prev => prev.map(s => s.id === id ? { ...s, status, ...(notes !== undefined ? { notes } : {}) } : s));
    };

    const updateSession = (id: string, updates: Partial<Session>) => {
        setSessions(prev => prev.map(s => s.id === id ? { ...s, ...updates } : s));
    };

    const removeSession = (id: string) => {
        setSessions(prev => prev.filter(s => s.id !== id));
    };

    const getClientGoals = (clientId: string) => goals.filter(g => g.clientId === clientId);
    const getClientInvoices = (clientId: string) => invoices.filter(i => i.clientId === clientId);
    const getClientSessions = (clientId: string) => sessions.filter(s => s.clientId === clientId);
    const getSessionsForDate = (date: string) => sessions.filter(s => s.date === date).sort((a, b) => a.time.localeCompare(b.time));

    return (
        <DataContext.Provider
            value={{
                clients,
                invoices,
                expenses,
                goals,
                sessions,
                services,
                settings,
                addClient,
                updateClient,
                archiveClient,
                restoreClient,
                deleteClient,
                addInvoice,
                markInvoicePaid,
                sendInvoiceReminder,
                deleteInvoice,
                addExpense,
                addGoal,
                updateGoal,
                deleteGoal,
                addSession,
                updateSessionStatus,
                updateSession,
                removeSession,
                addServicePreset,
                updateServicePreset,
                deleteServicePreset,
                getClientGoals,
                getClientInvoices,
                getClientSessions,
                getSessionsForDate,
                updateProfile,
                updatePayout,
                updateNotifications,
                updateUiTheme,
                updateHomePreferences,
                updateInvoiceDefaults,
                resetAllData,
            }}
        >
            {children}
        </DataContext.Provider>
    );
};

export const useData = (): DataContextType => {
    const ctx = useContext(DataContext);
    if (!ctx) throw new Error('useData must be used within a DataProvider');
    return ctx;
};
