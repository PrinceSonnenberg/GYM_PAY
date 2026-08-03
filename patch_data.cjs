const fs = require('fs');
let code = fs.readFileSync('context/DataContext.tsx', 'utf-8');
code = code.replace(`        setSettings(prev => ({
            ...prev,
    uiTheme: { 
        preset: "energetic", 
    },
            invoiceDefaults: { ...prev.invoiceDefaults, ...defaultUpdates },
        }));`, `        setSettings(prev => ({
            ...prev,
            invoiceDefaults: { ...prev.invoiceDefaults, ...defaultUpdates },
        }));`);

code = code.replace(`    const updateInvoiceDefaults = (defaultUpdates: Partial<UserSettings['invoiceDefaults']>) => {`, `    const updateUiTheme = (themeUpdates: Partial<UserSettings['uiTheme']>) => {
        setSettings(prev => ({
            ...prev,
            uiTheme: { ...(prev.uiTheme || { preset: "energetic" }), ...themeUpdates },
        }));
    };

    const updateInvoiceDefaults = (defaultUpdates: Partial<UserSettings['invoiceDefaults']>) => {`);

code = code.replace(`                updateInvoiceDefaults,`, `                updateUiTheme,\n                updateInvoiceDefaults,`);

fs.writeFileSync('context/DataContext.tsx', code);
