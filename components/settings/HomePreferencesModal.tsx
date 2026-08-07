import React from 'react';
import Icon from '../Icon';
import Modal from '../Modal';
import { useData } from '../../context/DataContext';

export const HomePreferencesModal: React.FC<{ open: boolean, onClose: () => void }> = ({ open, onClose }) => {
    const { settings, updateHomePreferences } = useData();

    return (
        <Modal open={open} onClose={onClose}>
            <div className="flex items-center justify-between border-b-2 border-ink p-5 bg-background">
                <div>
                    <h2 className="font-display text-xl text-ink">HOME SCREEN</h2>
                    <p className="text-xs text-text-muted">Toggle visibility of widgets</p>
                </div>
                <button onClick={onClose} className="flex items-center justify-center size-8 rounded-full border-2 border-ink hover:bg-black hover:text-white transition-colors">
                    <Icon name="close" className="text-[18px]" />
                </button>
            </div>
            <div className="p-5 overflow-y-auto space-y-3 pb-safe max-h-[70vh]">
                {[
                    { key: 'showRevenue', label: 'Revenue & Pending', desc: 'Top cards showing financial overview' },
                    { key: 'showIncomeTrend', label: 'Income Trend', desc: 'Chart displaying revenue over time' },
                    { key: 'showQuickActions', label: 'Quick Actions', desc: 'Shortcuts to new session, invoice, etc.' },
                    { key: 'showSchedule', label: 'Today\'s Schedule', desc: 'List of upcoming sessions for the day' },
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
                                // @ts-ignore
                                const currentValue = settings.homePreferences?.[key] ?? true;
                                // @ts-ignore
                                updateHomePreferences({ [key]: !currentValue });
                            }}
                            className={`relative inline-flex h-7 w-12 shrink-0 cursor-pointer rounded-full border-2 border-ink transition-colors duration-200 ease-in-out focus:outline-none ${
                                // @ts-ignore
                                (settings.homePreferences?.[key] ?? true) ? 'bg-volt' : 'bg-background'
                            }`}
                        >
                            <span className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-sm ring-1 ring-ink/5 transition duration-200 ease-in-out mt-[2px] ${
                                // @ts-ignore
                                (settings.homePreferences?.[key] ?? true) ? 'translate-x-[22px] border-2 border-ink' : 'translate-x-[2px] border-2 border-ink/30'
                            }`} />
                        </button>
                    </div>
                ))}
            </div>
        </Modal>
    );
};
