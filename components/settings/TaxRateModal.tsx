import React, { useState, useEffect } from 'react';
import Icon from '../Icon';
import Modal from '../Modal';
import { useData } from '../../context/DataContext';

export const TaxRateModal: React.FC<{ open: boolean, onClose: () => void, onSuccess: (msg: string) => void }> = ({ open, onClose, onSuccess }) => {
    const { settings, updateInvoiceDefaults } = useData();
    const [taxRatePercent, setTaxRatePercent] = useState((settings.invoiceDefaults.defaultTaxRate * 100).toString());

    useEffect(() => {
        if (open) {
            setTaxRatePercent((settings.invoiceDefaults.defaultTaxRate * 100).toString());
        }
    }, [open, settings.invoiceDefaults.defaultTaxRate]);

    const handleSave = () => {
        const rate = parseFloat(taxRatePercent);
        if (isNaN(rate) || rate < 0) return;
        updateInvoiceDefaults({ defaultTaxRate: rate / 100 });
        onClose();
        onSuccess(`Tax rate updated to ${rate}%`);
    };

    return (
        <Modal open={open} onClose={onClose}>
            <div className="p-5 space-y-4">
                <div className="flex items-center justify-between border-b pb-3 border-border-light">
                    <h3 className="font-display text-lg tracking-wide text-ink">DEFAULT TAX RATE</h3>
                    <button onClick={onClose} className="text-text-muted hover:text-ink">
                        <Icon name="close" />
                    </button>
                </div>
                <div className="space-y-3 text-xs">
                    <div>
                        <label className="block text-text-muted text-[10px] font-bold uppercase tracking-widest mb-1">Tax Percentage</label>
                        <div className="relative">
                            <input
                                type="number"
                                step="0.1"
                                min="0"
                                max="100"
                                value={taxRatePercent}
                                onChange={e => setTaxRatePercent(e.target.value)}
                                className="w-full rounded-xl bg-background border-2 border-border-light focus:border-primary focus:outline-none px-4 py-2.5 font-mono font-bold text-lg pr-12"
                            />
                            <span className="absolute right-4 top-1/2 -translate-y-1/2 text-text-muted font-bold">%</span>
                        </div>
                        <p className="text-[10px] text-text-muted mt-2 leading-relaxed">
                            This rate will be automatically applied to all new invoices. You can always override this on individual invoices.
                        </p>
                    </div>
                </div>
                <div className="flex gap-2 pt-2">
                    <button
                        onClick={handleSave}
                        className="flex-1 rounded-xl bg-signal text-white font-bold uppercase text-xs tracking-wide py-3 hover:bg-signal/90 transition-colors"
                    >
                        Save Tax Rate
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
