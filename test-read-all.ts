import { db } from "./src/db/index.ts";
import { clients } from "./src/db/schema.ts";
async function run() {
  const all = await db.select().from(clients);
  console.log(JSON.stringify(all, null, 2));
}
run();
