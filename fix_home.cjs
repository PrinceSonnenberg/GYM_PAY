const fs = require('fs');
let code = fs.readFileSync('pages/HomePage.tsx', 'utf-8');

// The issue is missing closing brackets for conditional rendering.
// Let's just fix it manually.
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
`                        ))}
                    </div>
                </section>
                {(settings.homePreferences?.showPendingInvoices ?? true) && pendingInvoices.length > 0 && (`,
`                        ))}
                    </div>
                </section>
                )}
                {(settings.homePreferences?.showPendingInvoices ?? true) && pendingInvoices.length > 0 && (`
);

fs.writeFileSync('pages/HomePage.tsx', code);
