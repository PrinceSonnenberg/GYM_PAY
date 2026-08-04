const fs = require('fs');
let code = fs.readFileSync('pages/SettingsPage.tsx', 'utf-8');

code = code.replace(`type ModalType = 'theme' | 'profile'`, `type ModalType = 'theme' | 'home' | 'profile'`);
code = code.replace(`    const { settings`, `    const { updateHomePreferences, settings`);

const homeSection = `                        <button
                            onClick={() => setActiveModal('home')}
                            className="flex w-full items-center gap-4 p-4 text-left hover:bg-background/60 transition-colors border-t-2 border-border-light"
                        >
                            <div className="flex size-10 items-center justify-center rounded-full bg-volt-soft text-volt">
                                <Icon name="dashboard" className="text-[20px]" />
                            </div>
                            <div className="flex-1">
                                <span className="block font-bold text-sm text-text-main">Home Screen</span>
                                <span className="block text-xs text-text-muted">Customize dashboard widgets</span>
                            </div>
                            <Icon name="chevron_right" className="text-text-muted" />
                        </button>`;

code = code.replace(`                            <Icon name="chevron_right" className="text-text-muted" />
                        </button>
                    </div>
                </div>

                {/* 3. System & Data */}`, `                            <Icon name="chevron_right" className="text-text-muted" />
                        </button>
${homeSection}
                    </div>
                </div>

                {/* 3. System & Data */}`);

const homeModal = `            {/* Home Preferences Modal */}
            {activeModal === 'home' && (
                <div className="fixed inset-0 z-50 bg-ink/70 backdrop-blur-sm flex flex-col justify-end">
                    <div className="w-full bg-background rounded-t-3xl border-t-2 border-ink h-[85vh] flex flex-col shadow-pop animate-slideUp">
                        <div className="flex items-center justify-between border-b-2 border-ink p-5 bg-white rounded-t-3xl sticky top-0 z-10">
                            <div>
                                <h2 className="font-display text-xl text-ink">HOME SCREEN</h2>
                                <p className="text-xs text-text-muted">Toggle visibility of dashboard widgets</p>
                            </div>
                            <button onClick={() => setActiveModal(null)} className="flex items-center justify-center size-8 rounded-full border-2 border-ink hover:bg-black hover:text-white transition-colors">
                                <Icon name="close" className="text-[18px]" />
                            </button>
                        </div>
                        <div className="flex-1 overflow-y-auto p-5 space-y-3 pb-safe">
                            {[
                                { key: 'showRevenue', label: 'Revenue & Pending', desc: 'Top cards showing financial overview' },
                                { key: 'showIncomeTrend', label: 'Income Trend', desc: 'Chart displaying revenue over time' },
                                { key: 'showQuickActions', label: 'Quick Actions', desc: 'Shortcuts to new session, invoice, etc.' },
                                { key: 'showSchedule', label: 'Today\\'s Schedule', desc: 'List of upcoming sessions for the day' },
                                { key: 'showExpenses', label: 'Recent Expenses', desc: 'Quick view of latest logged expenses' },
                                { key: 'showPendingInvoices', label: 'Pending Invoices', desc: 'List of unpaid invoices' },
                            ].map(({ key, label, desc }) => (
                                <div key={key} className="flex items-center justify-between p-4 bg-white rounded-2xl border-2 border-ink">
                                    <div className="flex-1 min-w-0 pr-4">
                                        <p className="font-bold text-sm text-text-main">{label}</p>
                                        <p className="text-xs text-text-muted truncate">{desc}</p>
                                    </div>
                                    <button 
                                        onClick={() => {
                                            const currentPrefs = settings.homePreferences || {
                                                showRevenue: true, showIncomeTrend: true, showQuickActions: true,
                                                showSchedule: true, showExpenses: true, showPendingInvoices: true
                                            };
                                            // @ts-ignore
                                            updateHomePreferences({ [key]: !currentPrefs[key] });
                                        }}
                                        className={\`relative inline-flex h-7 w-12 shrink-0 cursor-pointer rounded-full border-2 border-ink transition-colors duration-200 ease-in-out focus:outline-none \${
                                            // @ts-ignore
                                            (settings.homePreferences?.[key] ?? true) ? 'bg-volt' : 'bg-background'
                                        }\`}
                                    >
                                        <span className={\`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-sm ring-1 ring-ink/5 transition duration-200 ease-in-out mt-[2px] \${
                                            // @ts-ignore
                                            (settings.homePreferences?.[key] ?? true) ? 'translate-x-[22px] border-2 border-ink' : 'translate-x-[2px] border-2 border-ink/30'
                                        }\`} />
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}
`;

code = code.replace(`            {/* Theme Modal */}`, homeModal + `            {/* Theme Modal */}`);
fs.writeFileSync('pages/SettingsPage.tsx', code);
