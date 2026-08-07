import React, { useState, useEffect } from 'react';
import Icon from '../Icon';
import Modal from '../Modal';
import { useData } from '../../context/DataContext';

export const PayoutSettingsModal: React.FC<{ open: boolean, onClose: () => void, onSuccess: (msg: string) => void }> = ({ open, onClose, onSuccess }) => {
    const { settings, updatePayout } = useData();
    const [payoutMethod, setPayoutMethod] = useState(settings.payout.method);
    const [accountHolder, setAccountHolder] = useState(settings.payout.accountHolder);
    const [accountNumberLast4, setAccountNumberLast4] = useState(settings.payout.accountNumberLast4);
    const [routingNumber, setRoutingNumber] = useState(settings.payout.routingNumber);
    const [payoutSchedule, setPayoutSchedule] = useState(settings.payout.payoutSchedule);

    useEffect(() => {
        if (open) {
            setPayoutMethod(settings.payout.method);
            setAccountHolder(settings.payout.accountHolder);
            setAccountNumberLast4(settings.payout.accountNumberLast4);
            setRoutingNumber(settings.payout.routingNumber);
            setPayoutSchedule(settings.payout.payoutSchedule);
        }
    }, [open, settings.payout]);

    const handleSave = () => {
        updatePayout({
            method: payoutMethod,
            accountHolder,
            accountNumberLast4,
            routingNumber,
            payoutSchedule,
        });
        onClose();
        onSuccess('Payout settings updated');
    };

    return (
        <Modal open={open} onClose={onClose}>
            <div className="p-5 space-y-4 max-h-[90vh] overflow-y-auto">
                <div className="flex items-center justify-between border-b pb-3 border-border-light">
                    <h3 className="font-display text-lg tracking-wide text-ink">PAYOUT SETTINGS</h3>
                    <button onClick={onClose} className="text-text-muted hover:text-ink">
                        <Icon name="close" />
                    </button>
                </div>
                <div className="space-y-3 text-xs">
                    <div>
                        <label className="block text-text-muted text-[10px] font-bold uppercase tracking-widest mb-1">Payout Method</label>
                        <select
                            value={payoutMethod}
                            onChange={e => setPayoutMethod(e.target.value as any)}
                            className="w-full rounded-xl bg-background border-2 border-border-light focus:border-primary focus:outline-none px-4 py-2.5 font-bold text-sm cursor-pointer"
                        >
                            <option value="Stripe Direct">Stripe Direct Deposit</option>
                            <option value="Bank Transfer">ACH Bank Transfer</option>
                            <option value="PayPal">PayPal Business</option>
                            <option value="Cash App">Cash App Business</option>
                        </select>
                    </div>
                    <div>
                        <label className="block text-text-muted text-[10px] font-bold uppercase tracking-widest mb-1">Account Holder Name</label>
                        <input
                            value={settings.profile.name}
                            disabled
                            className="w-full rounded-xl bg-background border-2 border-border-light text-text-muted px-4 py-2.5 font-bold text-sm cursor-not-allowed"
                        />
                        <p className="text-[10px] text-text-muted mt-1">This pulls from your Coach Profile Full Name.</p>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                        <div>
                            <label className="block text-text-muted text-[10px] font-bold uppercase tracking-widest mb-1">Routing Number</label>
                            <input
                                value={routingNumber}
                                onChange={e => setRoutingNumber(e.target.value)}
                                className="w-full rounded-xl bg-background border-2 border-border-light focus:border-primary focus:outline-none px-4 py-2.5 font-mono font-bold text-sm"
                            />
                        </div>
                        <div>
                            <label className="block text-text-muted text-[10px] font-bold uppercase tracking-widest mb-1">Account (Last 4)</label>
                            <input
                                maxLength={4}
                                value={accountNumberLast4}
                                onChange={e => setAccountNumberLast4(e.target.value)}
                                className="w-full rounded-xl bg-background border-2 border-border-light focus:border-primary focus:outline-none px-4 py-2.5 font-mono font-bold text-sm"
                            />
                        </div>
                    </div>
                    <div>
                        <label className="block text-text-muted text-[10px] font-bold uppercase tracking-widest mb-1">Payout Frequency</label>
                        <select
                            value={payoutSchedule}
                            onChange={e => setPayoutSchedule(e.target.value as any)}
                            className="w-full rounded-xl bg-background border-2 border-border-light focus:border-primary focus:outline-none px-4 py-2.5 font-bold text-sm cursor-pointer"
                        >
                            <option value="Daily">Daily Payouts</option>
                            <option value="Weekly">Weekly (Every Monday)</option>
                            <option value="Monthly">Monthly (1st of Month)</option>
                        </select>
                    </div>
                </div>
                <div className="flex gap-2 pt-2">
                    <button
                        onClick={handleSave}
                        className="flex-1 rounded-xl bg-signal text-white font-bold uppercase text-xs tracking-wide py-3 hover:bg-signal/90 transition-colors"
                    >
                        Save Payout Info
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
