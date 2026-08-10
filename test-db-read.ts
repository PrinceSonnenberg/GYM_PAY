import { db } from "./src/db/index.ts";
import { clients } from "./src/db/schema.ts";
async function run() {
  const all = await db.select().from(clients);
  console.log(all.map(c => ({id: c.id, name: c.name, isArchived: c.isArchived, is_archived: (c as any).is_archived, status: c.status})));
}
run();
