const fs = require('fs');
let code = fs.readFileSync('context/DataContext.tsx', 'utf-8');

const useDataStart = code.indexOf('export const DataProvider: React.FC<{children: ReactNode}> = ({ children }) => {');
const hooksEnd = code.indexOf('const updateProfile = (profileUpdates: Partial<UserSettings[\'profile\']>) => {');

const fetchEffect = `
    const saveSettingsToDb = (newSettings: UserSettings) => {
        apiFetch('/api/settings', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(newSettings),
        }).catch(err => console.error('Cloud SQL sync error (settings):', err));
    };

    useEffect(() => {
        const loadData = async () => {
            try {
                const settingsRes = await apiFetch('/api/settings');
                if (settingsRes.ok) {
                    const data = await settingsRes.json();
                    if (data) setSettings(data);
                }
                const clientsRes = await apiFetch('/api/clients');
                if (clientsRes.ok) {
                    const data = await clientsRes.json();
                    if (data && data.length > 0) setClients(data);
                }
                const invoicesRes = await apiFetch('/api/invoices');
                if (invoicesRes.ok) {
                    const data = await invoicesRes.json();
                    if (data && data.length > 0) setInvoices(data);
                }
                const goalsRes = await apiFetch('/api/goals');
                if (goalsRes.ok) {
                    const data = await goalsRes.json();
                    if (data && data.length > 0) setGoals(data);
                }
                const expensesRes = await apiFetch('/api/expenses');
                if (expensesRes.ok) {
                    const data = await expensesRes.json();
                    if (data && data.length > 0) setExpenses(data);
                }
                const sessionsRes = await apiFetch('/api/sessions');
                if (sessionsRes.ok) {
                    const data = await sessionsRes.json();
                    if (data && data.length > 0) setSessions(data);
                }
            } catch (err) {
                console.error('Error loading initial data from DB:', err);
            }
        };
        loadData();
    }, []);

    `;

code = code.substring(0, hooksEnd) + fetchEffect + code.substring(hooksEnd);

code = code.replace(
`    const updateProfile = (profileUpdates: Partial<UserSettings['profile']>) => {
        setSettings(prev => ({
            ...prev,
            profile: { ...prev.profile, ...profileUpdates },
        }));
    };`,
`    const updateProfile = (profileUpdates: Partial<UserSettings['profile']>) => {
        setSettings(prev => {
            const next = { ...prev, profile: { ...prev.profile, ...profileUpdates } };
            saveSettingsToDb(next);
            return next;
        });
    };`
);

code = code.replace(
`    const updatePayout = (payoutUpdates: Partial<UserSettings['payout']>) => {
        setSettings(prev => ({
            ...prev,
            payout: { ...prev.payout, ...payoutUpdates },
        }));
    };`,
`    const updatePayout = (payoutUpdates: Partial<UserSettings['payout']>) => {
        setSettings(prev => {
            const next = { ...prev, payout: { ...prev.payout, ...payoutUpdates } };
            saveSettingsToDb(next);
            return next;
        });
    };`
);

code = code.replace(
`    const updateNotifications = (notifUpdates: Partial<UserSettings['notifications']>) => {
        setSettings(prev => ({
            ...prev,
            notifications: { ...prev.notifications, ...notifUpdates },
        }));
    };`,
`    const updateNotifications = (notifUpdates: Partial<UserSettings['notifications']>) => {
        setSettings(prev => {
            const next = { ...prev, notifications: { ...prev.notifications, ...notifUpdates } };
            saveSettingsToDb(next);
            return next;
        });
    };`
);

code = code.replace(
`    const updateUiTheme = (themeUpdates: Partial<UserSettings['uiTheme']>) => {
        setSettings(prev => ({
            ...prev,
            uiTheme: { ...(prev.uiTheme || { preset: "energetic" }), ...themeUpdates },
        }));
    };`,
`    const updateUiTheme = (themeUpdates: Partial<UserSettings['uiTheme']>) => {
        setSettings(prev => {
            const next = { ...prev, uiTheme: { ...(prev.uiTheme || { preset: "energetic" }), ...themeUpdates } };
            saveSettingsToDb(next);
            return next;
        });
    };`
);

code = code.replace(
`    const updateInvoiceDefaults = (defaultUpdates: Partial<UserSettings['invoiceDefaults']>) => {
        setSettings(prev => ({
            ...prev,
            invoiceDefaults: { ...prev.invoiceDefaults, ...defaultUpdates },
        }));
    };`,
`    const updateInvoiceDefaults = (defaultUpdates: Partial<UserSettings['invoiceDefaults']>) => {
        setSettings(prev => {
            const next = { ...prev, invoiceDefaults: { ...prev.invoiceDefaults, ...defaultUpdates } };
            saveSettingsToDb(next);
            return next;
        });
    };`
);

fs.writeFileSync('context/DataContext.tsx', code);
