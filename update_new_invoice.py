import re

with open('/app/applet/pages/NewInvoicePage.tsx', 'r') as f:
    lines = f.readlines()

new_lines = []
skip = False

import_added = False

for i, line in enumerate(lines):
    if line.strip() == "import { validateClient, validateInvoice } from '../utils/validation';":
        new_lines.append(line)
        if not import_added:
            new_lines.append("import { AddClientModal, InvoiceSuccessModal, InvoicePDFModal } from '../components/invoices';\n")
            import_added = True
        continue

    if "{/* Success Invoice Modal / Sheet */}" in line:
        skip = True
        new_lines.append(line)
        new_lines.append("            <InvoiceSuccessModal\n")
        new_lines.append("                open={!!createdInvoice}\n")
        new_lines.append("                onClose={() => {}}\n")
        new_lines.append("                createdInvoice={createdInvoice}\n")
        new_lines.append("                setCreatedInvoice={setCreatedInvoice}\n")
        new_lines.append("                selectedClient={selectedClient}\n")
        new_lines.append("                settings={settings}\n")
        new_lines.append("                currency={currency}\n")
        new_lines.append("                onViewPdf={() => setShowPdfView(true)}\n")
        new_lines.append("            />\n")
        new_lines.append("            <InvoicePDFModal\n")
        new_lines.append("                open={showPdfView && !!createdInvoice}\n")
        new_lines.append("                onClose={() => setShowPdfView(false)}\n")
        new_lines.append("                invoice={createdInvoice}\n")
        new_lines.append("                client={selectedClient}\n")
        new_lines.append("                settings={settings}\n")
        new_lines.append("                currency={currency}\n")
        new_lines.append("            />\n")
        new_lines.append("            <AddClientModal\n")
        new_lines.append("                open={showAddClientModal}\n")
        new_lines.append("                onClose={() => setShowAddClientModal(false)}\n")
        new_lines.append("                newClientName={newClientName}\n")
        new_lines.append("                setNewClientName={setNewClientName}\n")
        new_lines.append("                newClientEmail={newClientEmail}\n")
        new_lines.append("                setNewClientEmail={setNewClientEmail}\n")
        new_lines.append("                newClientPhone={newClientPhone}\n")
        new_lines.append("                setNewClientPhone={setNewClientPhone}\n")
        new_lines.append("                handleCreateClient={handleCreateClient}\n")
        new_lines.append("            />\n")
        continue

    if skip and i == 546: # 0-indexed, line 547 is 546
        skip = False
        continue

    if not skip:
        new_lines.append(line)

with open('/app/applet/pages/NewInvoicePage.tsx', 'w') as f:
    f.writelines(new_lines)
