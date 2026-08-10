import { db } from "./src/db/index.ts";
import { clients } from "./src/db/schema.ts";
import { eq } from "drizzle-orm";
async function run() {
  const reqBody = {
    isArchived: true,
    is_archived: false,
    status: "Archived"
  };
  try {
    const res = await db.update(clients).set(reqBody as any).where(eq(clients.id, '6a938585-52ff-40d4-8d22-dccef3146812')).returning();
    console.log("Success:", res);
  } catch(e) {
    console.log("Error:", e);
  }
}
run();
