
export interface ScheduleItem {
    time: string;
    period: 'AM' | 'PM';
    title: string;
    category?: string;
    description: string;
    icon: string;
    type: 'video' | 'location' | 'default';
    active?: boolean;
}

export type SessionAttendanceStatus = 'scheduled' | 'attended' | 'cancelled_late' | 'cancelled_advance' | 'carry_over';

export interface Session {
    id: string;
    clientId: string;
    date: string; // ISO yyyy-mm-dd
    time: string; // e.g. "09:00 AM"
    sessionType: string; // e.g. "Leg Day • Hypertrophy"
    format: 'video' | 'location';
    status?: SessionAttendanceStatus;
    notes?: string;
}

export interface ExpenseItem {
    id: string;
    icon: string;
    iconBg: string;
    iconColor: string;
    name: string;
    date: string;
    amount: number; // negative = money out, in dollars
    category: string;
    receiptImage?: string; // base64 data URL of receipt photo for tax filing
}

export interface ActiveGoal {
    id: string;
    clientId: string;
    icon: string;
    iconBg: string;
    iconColor: string;
    title: string;
    category?: string;
    description: string;
    progress: number;
    currentValue: string;
    targetValue: string;
    progressLabel: string;
    progressColor: string;
}

export interface Client {
    id: string;
    name: string;
    email?: string;
    phone?: string;
    avatarUrl?: string;
    status: 'On Track' | 'At Risk' | 'New';
    notes?: string;
    createdAt?: string;
}

export interface InvoiceItem {
    id: string;
    icon: string;
    iconBg: string;
    iconColor: string;
    title: string;
    category?: string;
    details: string;
    amount: number;
    rate?: number;
    sessions?: number;
}

export interface ServicePreset {
    id: string;
    title: string;
    category?: string;
    details: string;
    defaultRate: number;
    defaultSessions: number;
    icon: string;
    iconBg: string;
    iconColor: string;
}

export interface Invoice {
    id: string;
    clientId: string;
    issuedDate: string;
    dueDate: string;
    items: InvoiceItem[];
    notes: string;
    status: 'sent' | 'paid';
    taxRate: number;
    lastReminderSentAt?: string;
    remindersCount?: number;
    appliedCreditSessions?: string[];
}

export interface UserSettings {
    profile: {
        name: string;
        title: string;
    category?: string;
        email: string;
        phone: string;
        bio: string;
        logoUrl?: string;
    };
    payout: {
        method: 'Stripe Direct' | 'Bank Transfer' | 'PayPal' | 'Cash App';
        accountHolder: string;
        accountNumberLast4: string;
        routingNumber: string;
        payoutSchedule: 'Daily' | 'Weekly' | 'Monthly';
    };
    notifications: {
        emailReceipts: boolean;
        paymentAlerts: boolean;
        sessionReminders: boolean;
        weeklyReport: boolean;
        autoReminders?: boolean;
        reminderDays?: number;
    };
    invoiceDefaults: {
        defaultDueDays: number;
        defaultTaxRate: number; // e.g. 0.05
        defaultNotes: string;
        currency: string;
    };
}

export enum MetricType {
    Weight = 'Weight',
    Dist = 'Dist',
    Time = 'Time',
    BodyPercent = 'Body %'
}
