import { db } from "./src/db/index.ts";
import { clients } from "./src/db/schema.ts";
import { eq } from "drizzle-orm";

async function run() {
  const all = await db.select().from(clients);
  console.log("All clients before:", all.map(c => ({id: c.id, isArchived: c.isArchived, is_archived: (c as any).is_archived})));
  
  if (all.length > 0) {
    const id = all[0].id;
    console.log("Updating", id);
    const result = await db.update(clients).set({ isArchived: true }).where(eq(clients.id, id)).returning();
    console.log("Update result:", result.map(c => ({id: c.id, isArchived: c.isArchived})));
  }
}
run();
