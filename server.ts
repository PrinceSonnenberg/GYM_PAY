import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { db } from "./src/db/index.ts";
import { clients, invoices, expenses, sessions, goals, settings, users } from "./src/db/schema.ts";
import { requireAuth, AuthRequest } from "./src/middleware/auth.ts";
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
      await getOrCreateUser(uid, req.user?.email || "coach@gympayfit.com");
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
      await getOrCreateUser(uid, req.user?.email || "coach@gympayfit.com");
      
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
      await getOrCreateUser(uid, req.user?.email || "coach@gympayfit.com");
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
      await getOrCreateUser(uid, req.user?.email || "coach@gympayfit.com");
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
