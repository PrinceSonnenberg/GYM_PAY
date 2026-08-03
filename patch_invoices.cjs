const fs = require('fs');
let code = fs.readFileSync('pages/InvoicesPage.tsx', 'utf-8');
code = code.replace(
`    const navigate = useNavigate();
    const location = useLocation();
    const queryId = new URLSearchParams(location.search).get('id');
    useEffect(() => {
        if (queryId && invoices.length > 0) {
            const target = invoices.find(inv => inv.id === queryId);
            if (target) setSelectedInvoice(target);
        }
    }, [queryId, invoices]);
    const { invoices, clients, markInvoicePaid, deleteInvoice, sendInvoiceReminder, settings } = useData();`,
`    const navigate = useNavigate();
    const location = useLocation();
    const { invoices, clients, markInvoicePaid, deleteInvoice, sendInvoiceReminder, settings } = useData();
    const queryId = new URLSearchParams(location.search).get('id');
    useEffect(() => {
        if (queryId && invoices.length > 0) {
            const target = invoices.find(inv => inv.id === queryId);
            if (target) setSelectedInvoice(target);
        }
    }, [queryId, invoices]);`
);
fs.writeFileSync('pages/InvoicesPage.tsx', code);
