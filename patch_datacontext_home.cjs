const fs = require('fs');
let code = fs.readFileSync('context/DataContext.tsx', 'utf-8');

code = code.replace(
`    uiTheme: { 
        preset: "energetic", 
    },`,
`    uiTheme: { 
        preset: "energetic", 
    },
    homePreferences: {
        showRevenue: true,
        showIncomeTrend: true,
        showQuickActions: true,
        showSchedule: true,
        showExpenses: true,
        showPendingInvoices: true,
    },`
);

code = code.replace(
`    updateUiTheme: (theme: Partial<UserSettings["uiTheme"]>) => void;`,
`    updateUiTheme: (theme: Partial<UserSettings["uiTheme"]>) => void;
    updateHomePreferences: (prefs: Partial<UserSettings["homePreferences"]>) => void;`
);

const newFunction = `
    const updateHomePreferences = (prefs: Partial<UserSettings['homePreferences']>) => {
        setSettings(prev => {
            const next = { ...prev, homePreferences: { ...(prev.homePreferences || {
                showRevenue: true,
                showIncomeTrend: true,
                showQuickActions: true,
                showSchedule: true,
                showExpenses: true,
                showPendingInvoices: true,
            }), ...prefs } };
            saveSettingsToDb(next);
            return next;
        });
    };
`;

code = code.replace(
`    const updateUiTheme = (themeUpdates: Partial<UserSettings['uiTheme']>) => {`,
newFunction + `\n    const updateUiTheme = (themeUpdates: Partial<UserSettings['uiTheme']>) => {`
);

code = code.replace(
`                updateUiTheme,`,
`                updateUiTheme,\n                updateHomePreferences,`
);

fs.writeFileSync('context/DataContext.tsx', code);
