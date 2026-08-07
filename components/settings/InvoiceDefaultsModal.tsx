import React, { useState, useEffect } from 'react';
import Icon from '../Icon';
import Modal from '../Modal';
import { useData } from '../../context/DataContext';

export const InvoiceDefaultsModal: React.FC<{ open: boolean, onClose: () => void, onSuccess: (msg: string) => void }> = ({ open, onClose, onSuccess }) => {
    const { settings, updateInvoiceDefaults } = useData();
    const [defaultDueDays, setDefaultDueDays] = useState(settings.invoiceDefaults.defaultDueDays);
    const [defaultNotes, setDefaultNotes] = useState(settings.invoiceDefaults.defaultNotes);
    const [currency, setCurrency] = useState(settings.invoiceDefaults.currency);

    useEffect(() => {
        if (open) {
            setDefaultDueDays(settings.invoiceDefaults.defaultDueDays);
            setDefaultNotes(settings.invoiceDefaults.defaultNotes);
            setCurrency(settings.invoiceDefaults.currency);
        }
    }, [open, settings.invoiceDefaults]);

    const handleSave = () => {
        updateInvoiceDefaults({
            defaultDueDays: Number(defaultDueDays) || 14,
            defaultNotes,
            currency,
        });
        onClose();
        onSuccess('Invoice defaults updated');
    };

    return (
        <Modal open={open} onClose={onClose}>
            <div className="p-5 space-y-4 max-h-[90vh] overflow-y-auto">
                <div className="flex items-center justify-between border-b pb-3 border-border-light">
                    <h3 className="font-display text-lg tracking-wide text-ink">INVOICE DEFAULTS</h3>
                    <button onClick={onClose} className="text-text-muted hover:text-ink">
                        <Icon name="close" />
                    </button>
                </div>
                <div className="space-y-3 text-xs">
                    <div>
                        <label className="block text-text-muted text-[10px] font-bold uppercase tracking-widest mb-1">Currency Symbol</label>
                        <select
                            value={currency}
                            onChange={e => setCurrency(e.target.value as 'USD' | 'EUR' | 'GBP')}
                            className="w-full rounded-xl bg-background border-2 border-border-light focus:border-primary focus:outline-none px-4 py-2.5 font-bold text-sm cursor-pointer"
                        >
                            <option value="USD">USD ($)</option>
                            <option value="EUR">EUR (€)</option>
                            <option value="GBP">GBP (£)</option>
                        </select>
                    </div>
                    <div>
                        <label className="block text-text-muted text-[10px] font-bold uppercase tracking-widest mb-1">Default Due Terms (Days)</label>
                        <input
                            type="number"
                            value={defaultDueDays}
                            onChange={e => setDefaultDueDays(parseInt(e.target.value) || 0)}
                            className="w-full rounded-xl bg-background border-2 border-border-light focus:border-primary focus:outline-none px-4 py-2.5 font-bold text-sm"
                        />
                    </div>
                    <div>
                        <label className="block text-text-muted text-[10px] font-bold uppercase tracking-widest mb-1">Default Invoice Notes</label>
                        <textarea
                            value={defaultNotes}
                            onChange={e => setDefaultNotes(e.target.value)}
                            rows={3}
                            className="w-full rounded-xl bg-background border-2 border-border-light focus:border-primary focus:outline-none px-4 py-2.5 font-medium text-xs resize-none"
                        />
                    </div>
                </div>
                <div className="flex gap-2 pt-2">
                    <button
                        onClick={handleSave}
                        className="flex-1 rounded-xl bg-primary text-white font-bold uppercase text-xs tracking-wide py-3 hover:bg-primary-hover transition-colors"
                    >
                        Save Defaults
                    </button>
                    <button
                        onClick={onClose}
                        className="rounded-xl border-2 border-ink font-bold uppercase text-xs tracking-wide px-4 hover:bg-background transition-colors"
                    >
                        Cancel
                    </button>
                </div>
            </div>
        </Modal>
    );
};
