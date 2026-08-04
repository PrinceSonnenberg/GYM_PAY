const fs = require('fs');
let code = fs.readFileSync('types.ts', 'utf-8');
code = code.replace(`    uiTheme?: { 
        preset: "energetic" | "ocean" | "sunset"; 
    };`, `    uiTheme?: { 
        preset: "energetic" | "ocean" | "sunset"; 
    };
    homePreferences?: {
        showRevenue: boolean;
        showIncomeTrend: boolean;
        showQuickActions: boolean;
        showSchedule: boolean;
        showExpenses: boolean;
        showPendingInvoices: boolean;
    };`);
fs.writeFileSync('types.ts', code);
