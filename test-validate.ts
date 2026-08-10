import { validateClient } from "./utils/validation.ts";
const errs = validateClient({ name: 'Sarah', email: 's@s.com', phone: '(555) 234-5678' });
console.log(errs);
