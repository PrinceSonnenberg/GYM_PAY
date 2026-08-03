const fs = require('fs');
let code = fs.readFileSync('vite.config.ts', 'utf-8');
code = code.replace(/define:\s*{\s*'process.env.API_KEY':\s*JSON.stringify\(env.GEMINI_API_KEY\),\s*'process.env.GEMINI_API_KEY':\s*JSON.stringify\(env.GEMINI_API_KEY\)\s*},\s*/g, '');
fs.writeFileSync('vite.config.ts', code);
