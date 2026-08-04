const fs = require('fs');
let code = fs.readFileSync('pages/SettingsPage.tsx', 'utf-8');

code = code.replace(
`                                        onClick={() => {
                                            const currentPrefs = settings.homePreferences || {
                                                showRevenue: true, showIncomeTrend: true, showQuickActions: true,
                                                showSchedule: true, showExpenses: true, showPendingInvoices: true
                                            };
                                            // @ts-ignore
                                            updateHomePreferences({ [key]: !currentPrefs[key] });
                                        }}`,
`                                        onClick={() => {
                                            // @ts-ignore
                                            const currentValue = settings.homePreferences?.[key] ?? true;
                                            // @ts-ignore
                                            updateHomePreferences({ [key]: !currentValue });
                                        }}`
);
fs.writeFileSync('pages/SettingsPage.tsx', code);
