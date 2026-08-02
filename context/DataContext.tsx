
import React, { createContext, useContext, useState, ReactNode } from 'react';
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
    addClient: (name: string, email?: string, phone?: string, status?: 'On Track' | 'At Risk' | 'New') => Client;
    updateClient: (id: string, updates: Partial<Client>) => void;
    deleteClient: (id: string) => void;
    addInvoice: (invoice: Omit<Invoice, 'id' | 'status'>) => Invoice;
    markInvoicePaid: (id: string) => void;
    sendInvoiceReminder: (id: string) => void;
    deleteInvoice: (id: string) => void;
    addExpense: (expense: Omit<ExpenseItem, 'id'>) => void;
    addGoal: (goal: Omit<ActiveGoal, 'id'>) => void;
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
    { id: 'g1', clientId: 'c1', icon: 'fitness_center', iconBg: 'bg-primary-soft', iconColor: 'text-primary', title: 'Bench Press Max', description: 'Strength • Ends Dec 12', progress: 87, currentValue: '215', targetValue: '245 lbs', progressLabel: '87%', progressColor: 'bg-primary' },
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

export const DataProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [clients, setClients] = useState<Client[]>(seedClients);
    const [invoices, setInvoices] = useState<Invoice[]>(seedInvoices);
    const [expenses, setExpenses] = useState<ExpenseItem[]>(seedExpenses);
    const [goals, setGoals] = useState<ActiveGoal[]>(seedGoals);
    const [sessions, setSessions] = useState<Session[]>(seedSessions);
    const [services, setServices] = useState<ServicePreset[]>(DEFAULT_SERVICES);
    const [settings, setSettings] = useState<UserSettings>(defaultUserSettings);

    const updateProfile = (profileUpdates: Partial<UserSettings['profile']>) => {
        setSettings(prev => ({
            ...prev,
            profile: { ...prev.profile, ...profileUpdates },
        }));
    };

    const updatePayout = (payoutUpdates: Partial<UserSettings['payout']>) => {
        setSettings(prev => ({
            ...prev,
            payout: { ...prev.payout, ...payoutUpdates },
        }));
    };

    const updateNotifications = (notifUpdates: Partial<UserSettings['notifications']>) => {
        setSettings(prev => ({
            ...prev,
            notifications: { ...prev.notifications, ...notifUpdates },
        }));
    };

    const updateInvoiceDefaults = (defaultUpdates: Partial<UserSettings['invoiceDefaults']>) => {
        setSettings(prev => ({
            ...prev,
            invoiceDefaults: { ...prev.invoiceDefaults, ...defaultUpdates },
        }));
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
        const newPreset: ServicePreset = { ...service, id: `srv-${Date.now()}` };
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
            id: `c${Date.now()}`,
            name: name.trim(),
            email: email?.trim() || undefined,
            phone: phone?.trim() || undefined,
            status,
            createdAt: new Date().toISOString(),
        };
        setClients(prev => [...prev, client]);
        return client;
        };

    const updateClient = (id: string, updates: Partial<Client>) => {
        setClients(prev => prev.map(c => c.id === id ? { ...c, ...updates } : c));
    };

    const deleteClient = (id: string) => {
        setClients(prev => prev.filter(c => c.id !== id));
    };

    const addInvoice = (invoice: Omit<Invoice, 'id' | 'status'>): Invoice => {
        const newInv: Invoice = { ...invoice, id: `inv${Date.now()}`, status: 'sent' };
        setInvoices(prev => [newInv, ...prev]);
        return newInv;
    };

    const markInvoicePaid = (id: string) => {
        setInvoices(prev => prev.map(inv => (inv.id === id ? { ...inv, status: 'paid' } : inv)));
    };

    const sendInvoiceReminder = (id: string) => {
        const nowStr = new Date().toISOString().slice(0, 10);
        setInvoices(prev => prev.map(inv => {
            if (inv.id === id) {
                return {
                    ...inv,
                    lastReminderSentAt: nowStr,
                    remindersCount: (inv.remindersCount || 0) + 1,
                };
            }
            return inv;
        }));
    };

    const deleteInvoice = (id: string) => {
        setInvoices(prev => prev.filter(inv => inv.id !== id));
    };

    const addExpense: DataContextType['addExpense'] = (expense) => {
        setExpenses(prev => [{ ...expense, id: `e${Date.now()}` }, ...prev]);
    };

    const addGoal: DataContextType['addGoal'] = (goal) => {
        setGoals(prev => [...prev, { ...goal, id: `g${Date.now()}` }]);
    };

    const addSession: DataContextType['addSession'] = (session) => {
        setSessions(prev => [...prev, { ...session, id: `s${Date.now()}`, status: session.status || 'scheduled' }]);
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
                deleteClient,
                addInvoice,
                markInvoicePaid,
                sendInvoiceReminder,
                deleteInvoice,
                addExpense,
                addGoal,
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
