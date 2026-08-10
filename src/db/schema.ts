import { pgTable, serial, text, timestamp, real, integer, jsonb, boolean } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

// Users table linked to Firebase Auth UID
export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  uid: text('uid').notNull().unique(), // Firebase Auth UID
  email: text('email').notNull(),
  name: text('name'),
  createdAt: timestamp('created_at').defaultNow(),
});

// Clients table
export const clients = pgTable('clients', {
  id: text('id').primaryKey(),
  userId: text('user_id').references(() => users.uid),
  name: text('name').notNull(),
  email: text('email'),
  phone: text('phone'),
  avatarUrl: text('avatar_url'),
  status: text('status').notNull().default('New'), // 'On Track' | 'At Risk' | 'New'
  notes: text('notes'),
  isArchived: boolean('is_archived').default(false),
  createdAt: timestamp('created_at').defaultNow(),
});

// Invoices table
export const invoices = pgTable('invoices', {
  id: text('id').primaryKey(),
  userId: text('user_id').references(() => users.uid),
  clientId: text('client_id').references(() => clients.id, { onDelete: 'cascade' }),
  issuedDate: text('issued_date').notNull(),
  dueDate: text('due_date').notNull(),
  notes: text('notes'),
  status: text('status').notNull().default('sent'), // 'sent' | 'paid'
  taxRate: real('tax_rate').notNull().default(0.05),
  items: jsonb('items').notNull(), // array of InvoiceItem
  lastReminderSentAt: text('last_reminder_sent_at'),
  remindersCount: integer('reminders_count').default(0),
  appliedCreditSessions: jsonb('applied_credit_sessions'),
  createdAt: timestamp('created_at').defaultNow(),
});

// Expenses table
export const expenses = pgTable('expenses', {
  id: text('id').primaryKey(),
  userId: text('user_id').references(() => users.uid),
  name: text('name').notNull(),
  date: text('date').notNull(),
  amount: real('amount').notNull(),
  category: text('category').notNull(),
  icon: text('icon').notNull(),
  iconBg: text('icon_bg').notNull(),
  iconColor: text('icon_color').notNull(),
  receiptImage: text('receipt_image'),
  createdAt: timestamp('created_at').defaultNow(),
});

// Sessions table
export const sessions = pgTable('sessions', {
  id: text('id').primaryKey(),
  userId: text('user_id').references(() => users.uid),
  clientId: text('client_id').references(() => clients.id, { onDelete: 'cascade' }),
  date: text('date').notNull(),
  time: text('time').notNull(),
  sessionType: text('session_type').notNull(),
  format: text('format').notNull(), // 'video' | 'location'
  status: text('status').default('scheduled'), // 'scheduled' | 'attended' | 'cancelled_late' | 'cancelled_advance' | 'carry_over'
  notes: text('notes'),
  createdAt: timestamp('created_at').defaultNow(),
});

// Goals table
export const goals = pgTable('goals', {
  id: text('id').primaryKey(),
  userId: text('user_id').references(() => users.uid),
  clientId: text('client_id').references(() => clients.id, { onDelete: 'cascade' }),
  icon: text('icon').notNull(),
  iconBg: text('icon_bg').notNull(),
  iconColor: text('icon_color').notNull(),
  title: text('title').notNull(),
  description: text('description').notNull(),
  progress: integer('progress').notNull(),
  currentValue: text('current_value').notNull(),
  targetValue: text('target_value').notNull(),
  progressLabel: text('progress_label').notNull(),
  progressColor: text('progress_color').notNull(),
  createdAt: timestamp('created_at').defaultNow(),
});

// User Settings table
export const settings = pgTable('settings', {
  userId: text('user_id').primaryKey().references(() => users.uid),
  data: jsonb('data').notNull(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

// Relations
export const clientsRelations = relations(clients, ({ many }) => ({
  invoices: many(invoices),
  sessions: many(sessions),
  goals: many(goals),
}));

export const invoicesRelations = relations(invoices, ({ one }) => ({
  client: one(clients, {
    fields: [invoices.clientId],
    references: [clients.id],
  }),
}));

export const sessionsRelations = relations(sessions, ({ one }) => ({
  client: one(clients, {
    fields: [sessions.clientId],
    references: [clients.id],
  }),
}));

export const goalsRelations = relations(goals, ({ one }) => ({
  client: one(clients, {
    fields: [goals.clientId],
    references: [clients.id],
  }),
}));
