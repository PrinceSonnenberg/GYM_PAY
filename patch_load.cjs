const fs = require('fs');
let code = fs.readFileSync('context/DataContext.tsx', 'utf-8');

code = code.replace(
`                    const data = await settingsRes.json();
                    if (data) setSettings(data);`,
`                    const data = await settingsRes.json();
                    if (data) {
                        setSettings(prev => ({
                            ...prev, 
                            ...data, 
                            homePreferences: { ...prev.homePreferences, ...(data.homePreferences || {}) }
                        }));
                    }`
);
fs.writeFileSync('context/DataContext.tsx', code);
