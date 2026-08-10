import { db } from "./src/db/index.ts";
import { clients } from "./src/db/schema.ts";
import { eq } from "drizzle-orm";
async function run() {
  const reqBody = { isArchived: true, status: 'Archived', someOtherProp: 1 };
  try {
    const res = await db.update(clients).set(reqBody as any).where(eq(clients.id, 'c1')).returning();
    console.log(res);
  } catch (e) {
    console.log("Error:", e.message);
  }
}
run();
