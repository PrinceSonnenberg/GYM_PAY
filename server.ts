import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { Resend } from "resend";
import { db } from "./src/db/index.ts";
import { clients, invoices, expenses, sessions, goals, settings, users } from "./src/db/schema.ts";
import { requireAuth, AuthRequest } from "./src/middleware/auth.ts";
import { adminAuth } from "./src/lib/firebase-admin.ts";
import { getOrCreateUser } from "./src/db/users.ts";
import { eq, and } from "drizzle-orm";
import { validateClient, validateInvoice } from "./utils/validation.ts";

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: "10mb" }));

  // API Routes
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok", db: "cloudsql-postgresql" });
  });

  /**
   * Helper function to safely convert date strings into JS Date objects
   * for Drizzle timestamp columns to prevent 'value.toISOString is not a function' errors.
   */
  function prepareTimestampFields<T extends Record<string, any>>(data: T): T {
    if (!data || typeof data !== "object") return data;
    const cleaned = { ...data };

    if ("createdAt" in cleaned && cleaned.createdAt !== null && cleaned.createdAt !== undefined) {
      if (typeof cleaned.createdAt === "string" || typeof cleaned.createdAt === "number") {
        const d = new Date(cleaned.createdAt);
        if (!isNaN(d.getTime())) {
          cleaned.createdAt = d as any;
        } else {
          delete cleaned.createdAt;
        }
      } else if (!(cleaned.createdAt instanceof Date)) {
        delete cleaned.createdAt;
      }
    }

    if ("updatedAt" in cleaned && cleaned.updatedAt !== null && cleaned.updatedAt !== undefined) {
      if (typeof cleaned.updatedAt === "string" || typeof cleaned.updatedAt === "number") {
        const d = new Date(cleaned.updatedAt);
        if (!isNaN(d.getTime())) {
          cleaned.updatedAt = d as any;
        } else {
          delete cleaned.updatedAt;
        }
      } else if (!(cleaned.updatedAt instanceof Date)) {
        delete cleaned.updatedAt;
      }
    }

    return cleaned;
  }

  // Clients API
  app.get("/api/clients", requireAuth, async (req: AuthRequest, res) => {
    try {
      const uid = req.user?.uid || "default-user";
      const result = await db.select().from(clients).where(eq(clients.userId, uid));
      res.json(result);
    } catch (error: any) {
      console.error("Error fetching clients:", error);
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/clients", requireAuth, async (req: AuthRequest, res) => {
    try {
      const uid = req.user?.uid || "default-user";
      
      const clientErrors = validateClient(req.body);
      if (clientErrors.length > 0) {
        return res.status(400).json({ error: clientErrors[0], errors: clientErrors });
      }

      const newClient = prepareTimestampFields({ ...req.body, userId: uid });
      const result = await db.insert(clients).values(newClient).returning();
      res.json(result[0]);
    } catch (error: any) {
      console.error("Error creating client:", error);
      res.status(500).json({ error: error.message });
    }
  });

  app.put("/api/clients/:id", requireAuth, async (req: AuthRequest, res) => {
    try {
      const uid = req.user?.uid || "default-user";
      const { id } = req.params;

      const clientErrors = validateClient(req.body);
      if (clientErrors.length > 0) {
        return res.status(400).json({ error: clientErrors[0], errors: clientErrors });
      }

      const updateData = prepareTimestampFields(req.body);
      const result = await db
        .update(clients)
        .set(updateData)
        .where(and(eq(clients.id, id as string), eq(clients.userId, uid)))
        .returning();
      res.json(result[0]);
    } catch (error: any) {
      console.error("Error updating client:", error);
      res.status(500).json({ error: error.message });
    }
  });

  app.delete("/api/clients/:id", requireAuth, async (req: AuthRequest, res) => {
    try {
      const uid = req.user?.uid || "default-user";
      const { id } = req.params;
      await db.delete(clients).where(and(eq(clients.id, id as string), eq(clients.userId, uid)));
      res.json({ success: true });
    } catch (error: any) {
      console.error("Error deleting client:", error);
      res.status(500).json({ error: error.message });
    }
  });

  // Invoices API
  app.get("/api/invoices", requireAuth, async (req: AuthRequest, res) => {
    try {
      const uid = req.user?.uid || "default-user";
      const result = await db.select().from(invoices).where(eq(invoices.userId, uid));
      res.json(result);
    } catch (error: any) {
      console.error("Error fetching invoices:", error);
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/invoices", requireAuth, async (req: AuthRequest, res) => {
    try {
      const uid = req.user?.uid || "default-user";

      const invoiceErrors = validateInvoice(req.body);
      if (invoiceErrors.length > 0) {
        return res.status(400).json({ error: invoiceErrors[0], errors: invoiceErrors });
      }

      // Verify client ownership
      if (req.body.clientId) {
        const clientMatch = await db
          .select()
          .from(clients)
          .where(and(eq(clients.id, req.body.clientId), eq(clients.userId, uid)));
        if (clientMatch.length === 0) {
          return res.status(400).json({ error: "Referenced client does not belong to the current user." });
        }
      }

      const newInvoice = prepareTimestampFields({ ...req.body, userId: uid });
      const result = await db.insert(invoices).values(newInvoice).returning();
      res.json(result[0]);
    } catch (error: any) {
      console.error("Error creating invoice:", error);
      res.status(500).json({ error: error.message });
    }
  });

  app.put("/api/invoices/:id", requireAuth, async (req: AuthRequest, res) => {
    try {
      const uid = req.user?.uid || "default-user";
      const { id } = req.params;

      const invoiceErrors = validateInvoice(req.body);
      if (invoiceErrors.length > 0) {
        return res.status(400).json({ error: invoiceErrors[0], errors: invoiceErrors });
      }

      if (req.body.clientId) {
        const clientMatch = await db
          .select()
          .from(clients)
          .where(and(eq(clients.id, req.body.clientId), eq(clients.userId, uid)));
        if (clientMatch.length === 0) {
          return res.status(400).json({ error: "Referenced client does not belong to the current user." });
        }
      }

      const updateData = prepareTimestampFields(req.body);
      const result = await db
        .update(invoices)
        .set(updateData)
        .where(and(eq(invoices.id, id as string), eq(invoices.userId, uid)))
        .returning();
      res.json(result[0]);
    } catch (error: any) {
      console.error("Error updating invoice:", error);
      res.status(500).json({ error: error.message });
    }
  });

  app.delete("/api/invoices/:id", requireAuth, async (req: AuthRequest, res) => {
    try {
      const uid = req.user?.uid || "default-user";
      const { id } = req.params;
      await db.delete(invoices).where(and(eq(invoices.id, id as string), eq(invoices.userId, uid)));
      res.json({ success: true });
    } catch (error: any) {
      console.error("Error deleting invoice:", error);
      res.status(500).json({ error: error.message });
    }
  });

  // Send Invoice Email via Resend API
  app.post("/api/invoices/:id/send", requireAuth, async (req: AuthRequest, res) => {
    try {
      const uid = req.user?.uid;
      if (!uid) {
        return res.status(401).json({ error: "Unauthorized: Missing user authentication" });
      }

      const { id } = req.params;

      // 1. Look up invoice and confirm ownership
      const [invoice] = await db
        .select()
        .from(invoices)
        .where(and(eq(invoices.id, id as string), eq(invoices.userId, uid)));

      if (!invoice) {
        return res.status(404).json({ error: "Invoice not found or unauthorized" });
      }

      // 2. Look up linked client and verify email
      const [client] = await db
        .select()
        .from(clients)
        .where(and(eq(clients.id, invoice.clientId as string), eq(clients.userId, uid)));

      if (!client || !client.email || client.email.trim() === "") {
        return res.status(400).json({ error: "This client has no email address on file" });
      }

      // 3. Look up user settings profile for sender details
      const userSettings = await db
        .select()
        .from(settings)
        .where(eq(settings.userId, uid));

      const profileData = (userSettings[0]?.data as any)?.profile || {};
      const senderName = profileData.name || "Fitness Trainer";

      // 4. Determine subject line based on remindersCount
      const isReminder = (invoice.remindersCount ?? 0) > 0;
      const subject = isReminder ? "Reminder: invoice due" : "Your invoice is ready";

      // 5. Build invoice item details and totals
      const items = (Array.isArray(invoice.items) ? invoice.items : []) as Array<{
        title?: string;
        details?: string;
        sessions?: number;
        rate?: number;
        amount?: number;
      }>;

      const subtotal = items.reduce((sum, item) => sum + (Number(item.amount) || 0), 0);
      const taxRate = Number(invoice.taxRate) || 0;
      const tax = subtotal * taxRate;
      const totalAmount = subtotal + tax;

      const rawOrigin = req.headers.origin || (req.headers.referer ? new URL(req.headers.referer as string).origin : "http://localhost:3000");
      const shareUrl = `${rawOrigin}/#/invoices?id=${invoice.id}`;

      const itemRowsHtml = items
        .map(
          (item) => `
          <tr style="border-bottom: 1px solid #e4e4e7;">
            <td style="padding: 10px; font-weight: bold; color: #111;">${item.title || "Service"}</td>
            <td style="padding: 10px; text-align: center; color: #555;">${item.sessions ?? "-"}</td>
            <td style="padding: 10px; text-align: right; font-weight: bold; color: #111;">R${Number(item.amount || 0).toFixed(2)}</td>
          </tr>`
        )
        .join("");

      const htmlContent = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; color: #111; border: 2px solid #111; border-radius: 12px; background-color: #ffffff;">
          <h2 style="font-size: 22px; text-transform: uppercase; margin-top: 0; color: #111;">${subject}</h2>
          <p style="font-size: 15px;">Hi <strong>${client.name}</strong>,</p>
          <p style="font-size: 14px; color: #555;">An invoice has been issued to you by <strong>${senderName}</strong>.</p>
          
          <div style="background-color: #f4f4f5; padding: 16px; border-radius: 8px; margin: 20px 0; border: 1px solid #e4e4e7;">
            <p style="margin: 4px 0; font-size: 13px;"><strong>Invoice ID:</strong> #${invoice.id.slice(-8).toUpperCase()}</p>
            <p style="margin: 4px 0; font-size: 13px;"><strong>Issued Date:</strong> ${invoice.issuedDate}</p>
            <p style="margin: 4px 0; font-size: 13px;"><strong>Due Date:</strong> ${invoice.dueDate}</p>
            <p style="margin: 8px 0 0 0; font-size: 18px; font-weight: bold; color: #2563eb;"><strong>Total Due:</strong> R${totalAmount.toFixed(2)}</p>
          </div>

          <h3 style="font-size: 14px; text-transform: uppercase; margin-bottom: 8px; letter-spacing: 0.5px;">Itemized Services</h3>
          <table style="width: 100%; border-collapse: collapse; font-size: 13px; margin-bottom: 24px;">
            <thead>
              <tr style="background-color: #111; color: #fff; text-align: left;">
                <th style="padding: 8px 10px;">Item</th>
                <th style="padding: 8px 10px; text-align: center;">Sessions</th>
                <th style="padding: 8px 10px; text-align: right;">Amount</th>
              </tr>
            </thead>
            <tbody>
              ${itemRowsHtml}
            </tbody>
          </table>

          <div style="text-align: center; margin-top: 32px;">
            <a href="${shareUrl}" style="background-color: #111; color: #ffffff; padding: 12px 24px; text-decoration: none; font-weight: bold; font-size: 13px; text-transform: uppercase; border-radius: 24px; display: inline-block;">
              View & Pay Invoice Online
            </a>
          </div>
          <p style="font-size: 11px; color: #888; text-align: center; margin-top: 24px;">Sent via GymPay Fit Invoice System</p>
        </div>
      `;

      // 6. Send via Resend
      const resendApiKey = process.env.RESEND_API_KEY;
      if (!resendApiKey) {
        return res.status(500).json({ error: "Email service is not configured (RESEND_API_KEY environment variable missing)" });
      }

      const resend = new Resend(resendApiKey);
      const fromAddress = process.env.INVOICE_FROM_EMAIL || "invoices@yourdomain.com";

      const emailResult = await resend.emails.send({
        from: `${senderName} <${fromAddress}>`,
        to: [client.email],
        subject: `${subject} - Invoice #${invoice.id.slice(-8).toUpperCase()}`,
        html: htmlContent,
      });

      if (emailResult.error) {
        console.error("Resend API error:", emailResult.error);
        return res.status(500).json({ error: emailResult.error.message || "Failed to send email via Resend" });
      }

      // 7. Update lastReminderSentAt and increment remindersCount in DB
      const nowStr = new Date().toISOString().slice(0, 10);
      const newRemindersCount = (invoice.remindersCount ?? 0) + 1;

      const [updatedInvoice] = await db
        .update(invoices)
        .set({
          lastReminderSentAt: nowStr,
          remindersCount: newRemindersCount,
        })
        .where(and(eq(invoices.id, id as string), eq(invoices.userId, uid)))
        .returning();

      return res.json({
        success: true,
        message: "Invoice sent successfully",
        invoice: updatedInvoice,
      });
    } catch (error: any) {
      console.error("Error sending invoice email:", error);
      return res.status(500).json({ error: error.message || "An error occurred while sending the invoice email" });
    }
  });

  // Expenses API
  app.get("/api/expenses", requireAuth, async (req: AuthRequest, res) => {
    try {
      const uid = req.user?.uid || "default-user";
      const result = await db.select().from(expenses).where(eq(expenses.userId, uid));
      res.json(result);
    } catch (error: any) {
      console.error("Error fetching expenses:", error);
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/expenses", requireAuth, async (req: AuthRequest, res) => {
    try {
      const uid = req.user?.uid || "default-user";
      const newExpense = prepareTimestampFields({ ...req.body, userId: uid });
      const result = await db.insert(expenses).values(newExpense).returning();
      res.json(result[0]);
    } catch (error: any) {
      console.error("Error creating expense:", error);
      res.status(500).json({ error: error.message });
    }
  });

  // Sessions API
  app.get("/api/sessions", requireAuth, async (req: AuthRequest, res) => {
    try {
      const uid = req.user?.uid || "default-user";
      const result = await db.select().from(sessions).where(eq(sessions.userId, uid));
      res.json(result);
    } catch (error: any) {
      console.error("Error fetching sessions:", error);
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/sessions", requireAuth, async (req: AuthRequest, res) => {
    try {
      const uid = req.user?.uid || "default-user";

      if (req.body.clientId) {
        const clientMatch = await db
          .select()
          .from(clients)
          .where(and(eq(clients.id, req.body.clientId), eq(clients.userId, uid)));
        if (clientMatch.length === 0) {
          return res.status(400).json({ error: "Referenced client does not exist or does not belong to the current user." });
        }
      }

      const newSession = prepareTimestampFields({ ...req.body, userId: uid });
      const result = await db.insert(sessions).values(newSession).returning();
      res.json(result[0]);
    } catch (error: any) {
      console.error("Error creating session:", error);
      res.status(500).json({ error: error.message });
    }
  });

  app.put("/api/sessions/:id", requireAuth, async (req: AuthRequest, res) => {
    try {
      const uid = req.user?.uid || "default-user";
      const { id } = req.params;

      if (req.body.clientId) {
        const clientMatch = await db
          .select()
          .from(clients)
          .where(and(eq(clients.id, req.body.clientId), eq(clients.userId, uid)));
        if (clientMatch.length === 0) {
          return res.status(400).json({ error: "Referenced client does not exist or does not belong to the current user." });
        }
      }

      const updateData = prepareTimestampFields(req.body);
      const result = await db
        .update(sessions)
        .set(updateData)
        .where(and(eq(sessions.id, id as string), eq(sessions.userId, uid)))
        .returning();
      res.json(result[0]);
    } catch (error: any) {
      console.error("Error updating session:", error);
      res.status(500).json({ error: error.message });
    }
  });

  app.delete("/api/sessions/:id", requireAuth, async (req: AuthRequest, res) => {
    try {
      const uid = req.user?.uid || "default-user";
      const { id } = req.params;
      await db.delete(sessions).where(and(eq(sessions.id, id as string), eq(sessions.userId, uid)));
      res.json({ success: true });
    } catch (error: any) {
      console.error("Error deleting session:", error);
      res.status(500).json({ error: error.message });
    }
  });

  // Goals API
  app.get("/api/goals", requireAuth, async (req: AuthRequest, res) => {
    try {
      const uid = req.user?.uid || "default-user";
      const result = await db.select().from(goals).where(eq(goals.userId, uid));
      res.json(result);
    } catch (error: any) {
      console.error("Error fetching goals:", error);
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/goals", requireAuth, async (req: AuthRequest, res) => {
    try {
      const uid = req.user?.uid || "default-user";

      if (req.body.clientId) {
        const clientMatch = await db
          .select()
          .from(clients)
          .where(and(eq(clients.id, req.body.clientId), eq(clients.userId, uid)));
        if (clientMatch.length === 0) {
          return res.status(400).json({ error: "Referenced client does not exist or does not belong to the current user." });
        }
      }

      const newGoal = prepareTimestampFields({ ...req.body, userId: uid });
      const result = await db.insert(goals).values(newGoal).returning();
      res.json(result[0]);
    } catch (error: any) {
      console.error("Error creating goal:", error);
      res.status(500).json({ error: error.message });
    }
  });

  app.put("/api/goals/:id", requireAuth, async (req: AuthRequest, res) => {
    try {
      const uid = req.user?.uid || "default-user";
      const { id } = req.params;

      if (req.body.clientId) {
        const clientMatch = await db
          .select()
          .from(clients)
          .where(and(eq(clients.id, req.body.clientId), eq(clients.userId, uid)));
        if (clientMatch.length === 0) {
          return res.status(400).json({ error: "Referenced client does not exist or does not belong to the current user." });
        }
      }

      const updateData = prepareTimestampFields(req.body);
      const result = await db
        .update(goals)
        .set(updateData)
        .where(and(eq(goals.id, id as string), eq(goals.userId, uid)))
        .returning();
      res.json(result[0]);
    } catch (error: any) {
      console.error("Error updating goal:", error);
      res.status(500).json({ error: error.message });
    }
  });

  app.delete("/api/goals/:id", requireAuth, async (req: AuthRequest, res) => {
    try {
      const uid = req.user?.uid || "default-user";
      const { id } = req.params;
      await db.delete(goals).where(and(eq(goals.id, id as string), eq(goals.userId, uid)));
      res.json({ success: true });
    } catch (error: any) {
      console.error("Error deleting goal:", error);
      res.status(500).json({ error: error.message });
    }
  });

  // Settings API
  app.get("/api/settings", requireAuth, async (req: AuthRequest, res) => {
    try {
      const uid = req.user?.uid || "default-user";
      const result = await db.select().from(settings).where(eq(settings.userId, uid));
      res.json(result[0]?.data || null);
    } catch (error: any) {
      console.error("Error fetching settings:", error);
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/settings", requireAuth, async (req: AuthRequest, res) => {
    try {
      const uid = req.user?.uid || "default-user";
      const result = await db
        .insert(settings)
        .values({ userId: uid, data: req.body })
        .onConflictDoUpdate({
          target: settings.userId,
          set: { data: req.body, updatedAt: new Date() },
        })
        .returning();
      res.json(result[0]?.data);
    } catch (error: any) {
      console.error("Error updating settings:", error);
      res.status(500).json({ error: error.message });
    }
  });

  // Dev Seed API
  app.post("/api/dev/seed", requireAuth, async (req: AuthRequest, res) => {
    try {
      if (process.env.ALLOW_DEV_SEED !== "true") {
        return res.status(403).json({ error: "Dev seed endpoint is disabled" });
      }

      const uid = req.user?.uid;
      if (!uid) {
        return res.status(401).json({ error: "Unauthorized: Missing user authentication" });
      }

      // Clear existing user data first for this authenticated user
      await db.delete(sessions).where(eq(sessions.userId, uid));
      await db.delete(expenses).where(eq(expenses.userId, uid));
      await db.delete(invoices).where(eq(invoices.userId, uid));
      await db.delete(clients).where(eq(clients.userId, uid));

      const c1Id = crypto.randomUUID();
      const c2Id = crypto.randomUUID();

      const newClients = [
        { id: c1Id, userId: uid, name: "Alice Johnson", email: "alice@example.com", phone: "555-0100", status: "On Track" },
        { id: c2Id, userId: uid, name: "Bob Smith", email: "bob@example.com", phone: "555-0200", status: "New" }
      ];
      
      const newInvoices = [
        { id: crypto.randomUUID(), userId: uid, clientId: c1Id, clientName: "Alice Johnson", items: [{ id: crypto.randomUUID(), title: "Monthly Training", details: "Monthly Training", amount: 200, icon: "fitness_center", iconBg: "bg-blue-100", iconColor: "text-blue-600" }], taxRate: 0.05, status: "paid", dueDate: new Date().toISOString().slice(0, 10), issuedDate: new Date(Date.now() - 86400000 * 5).toISOString().slice(0, 10), notes: "" },
        { id: crypto.randomUUID(), userId: uid, clientId: c2Id, clientName: "Bob Smith", items: [{ id: crypto.randomUUID(), title: "Nutrition Plan", details: "Nutrition Plan", amount: 100, icon: "restaurant", iconBg: "bg-green-100", iconColor: "text-green-600" }], taxRate: 0.05, status: "sent", dueDate: new Date(Date.now() - 86400000).toISOString().slice(0, 10), issuedDate: new Date(Date.now() - 86400000 * 30).toISOString().slice(0, 10), notes: "" }
      ];

      const newExpenses = [
        { id: crypto.randomUUID(), userId: uid, date: new Date().toISOString().slice(0, 10), amount: 50, category: "Software", name: "Gym Management App", icon: "laptop_mac", iconBg: "bg-blue-100", iconColor: "text-blue-600" },
        { id: crypto.randomUUID(), userId: uid, date: new Date(Date.now() - 86400000 * 2).toISOString().slice(0, 10), amount: 120, category: "Equipment", name: "New Weights", icon: "fitness_center", iconBg: "bg-orange-100", iconColor: "text-orange-600" }
      ];

      const newSessions = [
        { id: crypto.randomUUID(), userId: uid, clientId: c1Id, date: new Date().toISOString().slice(0, 10), time: "10:00 AM", sessionType: "Strength Training", format: "in-person", status: "scheduled" }
      ];

      await db.insert(clients).values(newClients);
      await db.insert(invoices).values(newInvoices);
      await db.insert(expenses).values(newExpenses);
      await db.insert(sessions).values(newSessions);

      res.json({ success: true });
    } catch (error: any) {
      console.error("Error seeding data:", error);
      res.status(500).json({ error: error.message });
    }
  });

  // Vite middleware in dev, static files in production
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Cloud SQL backend server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
