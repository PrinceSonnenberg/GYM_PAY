const fs = require('fs');
let code = fs.readFileSync('pages/HomePage.tsx', 'utf-8');

code = code.replace(`    const { clients`, `    const { settings, clients`);

code = code.replace(
`                <section className="grid grid-cols-2 gap-4">`,
`                {(settings.homePreferences?.showRevenue ?? true) && (
                <section className="grid grid-cols-2 gap-4">`
);

code = code.replace(
`                    </div>
                </section>

                <section className="plate bg-surface p-6 border-2 border-ink">`,
`                    </div>
                </section>
                )}

                {(settings.homePreferences?.showIncomeTrend ?? true) && (
                <section className="plate bg-surface p-6 border-2 border-ink">`
);

code = code.replace(
`                        </svg>
                    </div>
                </section>

                <section className="plate bg-ink p-6">`,
`                        </svg>
                    </div>
                </section>
                )}

                {(settings.homePreferences?.showQuickActions ?? true) && (
                <section className="plate bg-ink p-6">`
);

code = code.replace(
`                        </button>
                    </div>
                </section>

                <section>
                    <div className="mb-4 flex items-center justify-between px-1">`,
`                        </button>
                    </div>
                </section>
                )}

                {(settings.homePreferences?.showSchedule ?? true) && (
                <section>
                    <div className="mb-4 flex items-center justify-between px-1">`
);

code = code.replace(
`                        </div>
                    )}
                </section>

                <section>
                    <div className="mb-4 flex items-center justify-between px-1">
                        <h3 className="text-xs font-bold text-text-muted uppercase tracking-widest">Recent Expenses</h3>`,
`                        </div>
                    )}
                </section>
                )}

                {(settings.homePreferences?.showExpenses ?? true) && (
                <section>
                    <div className="mb-4 flex items-center justify-between px-1">
                        <h3 className="text-xs font-bold text-text-muted uppercase tracking-widest">Recent Expenses</h3>`
);

code = code.replace(
`                        </div>
                    </section>
                )}
            </main>`,
`                        </div>
                    </section>
                )}
                )}
            </main>`
);

code = code.replace(
`                {pendingInvoices.length > 0 && (
                    <section>`,
`                {(settings.homePreferences?.showPendingInvoices ?? true) && pendingInvoices.length > 0 && (
                    <section>`
);

// We need to fix the duplicate nested braces for expenses section.
code = code.replace(
`                        </div>
                    </section>
                )}
                )}
            </main>`,
`                        </div>
                    </section>
                )}
            </main>`
);


fs.writeFileSync('pages/HomePage.tsx', code);
