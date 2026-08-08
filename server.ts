import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
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

      const newClient = { ...req.body, userId: uid };
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

      const result = await db
        .update(clients)
        .set(req.body)
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

      const newInvoice = { ...req.body, userId: uid };
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

      const result = await db
        .update(invoices)
        .set(req.body)
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
      const newExpense = { ...req.body, userId: uid };
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
      const newSession = { ...req.body, userId: uid };
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
      const result = await db
        .update(sessions)
        .set(req.body)
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
      const newGoal = { ...req.body, userId: uid };
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
      const result = await db
        .update(goals)
        .set(req.body)
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
  app.post("/api/dev/seed", async (req, res) => {
    try {
      const authHeader = req.headers.authorization;
      let uid = "default-user";
      if (authHeader && authHeader.startsWith('Bearer ')) {
          try {
              const token = authHeader.split('Bearer ')[1];
              const decoded = await adminAuth.verifyIdToken(token);
              uid = decoded.uid;
          } catch (e) {
              console.warn("Token verification failed for seed", e);
          }
      }
      
      // Ensure the user exists in the database to satisfy foreign key constraints
      await getOrCreateUser(uid, 'coach.alex@gympayfit.com');
      // Clear existing user data first
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
