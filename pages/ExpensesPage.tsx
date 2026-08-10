
import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Icon from '../components/Icon';
import BottomNav from '../components/BottomNav';
import PageHeader from '../components/PageHeader';
import Modal from '../components/Modal';
import { useData } from '../context/DataContext';
import { formatCurrency, getCurrencySymbol } from '../utils/format';
import { ExpenseItem } from '../types';

const iconForCategory: Record<string, { icon: string; iconBg: string; iconColor: string }> = {
    Rent: { icon: 'real_estate_agent', iconBg: 'bg-primary-soft', iconColor: 'text-primary' },
    Equipment: { icon: 'fitness_center', iconBg: 'bg-signal-soft', iconColor: 'text-signal' },
    Marketing: { icon: 'campaign', iconBg: 'bg-volt-soft', iconColor: 'text-ink' },
    Travel: { icon: 'local_gas_station', iconBg: 'bg-danger-soft', iconColor: 'text-danger' },
    Other: { icon: 'receipt_long', iconBg: 'bg-background', iconColor: 'text-text-muted' },
};
const categoryOptions = ['Equipment', 'Rent', 'Marketing', 'Travel', 'Other'];

const ExpensesPage: React.FC = () => {
    const navigate = useNavigate();
    const { expenses, addExpense, settings } = useData();
    const currencySymbol = getCurrencySymbol(settings.invoiceDefaults.currency);
    const [activeCategory, setActiveCategory] = useState('All');
    const [amount, setAmount] = useState('');
    const [category, setCategory] = useState('Equipment');
    const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
    
    // Receipt Photo Upload & Preview State
    const [receiptImage, setReceiptImage] = useState<string | null>(null);
    const [selectedExpense, setSelectedExpense] = useState<ExpenseItem | null>(null);

    const categories = useMemo(() => ['All', ...Array.from(new Set(expenses.map(e => e.category)))], [expenses]);
    const filtered = activeCategory === 'All' ? expenses : expenses.filter(e => e.category === activeCategory);
    const totalSpend = expenses.reduce((sum, e) => sum + e.amount, 0);

    const handleReceiptFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onloadend = () => {
            setReceiptImage(reader.result as string);
        };
        reader.readAsDataURL(file);
    };

    const handleSave = () => {
        const parsed = parseFloat(amount);
        if (Number.isNaN(parsed) || parsed === 0) return;
        const style = iconForCategory[category] || iconForCategory.Other;
        addExpense({
            name: `${category} Expense`,
            date: new Date(date).toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' }),
            amount: -Math.abs(parsed),
            category,
            receiptImage: receiptImage || undefined,
            ...style,
        });
        setAmount('');
        setReceiptImage(null);
    };

    const handleBack = () => {
        if (window.history.state && window.history.state.idx > 0) {
            navigate(-1);
        } else {
            navigate('/');
        }
    };

    return (
        <div className="relative mx-auto flex h-full min-h-screen w-full max-w-md flex-col overflow-x-hidden bg-background font-inter pb-24">
            <PageHeader
                title="EXPENSES & RECEIPTS"
                centered
                onBack={handleBack}
            />

            {/* Receipt Modal for Tax Filing */}
            <Modal open={!!selectedExpense} onClose={() => setSelectedExpense(null)}>
                {selectedExpense && (
                    <div className="flex flex-col max-h-[90vh]">
                        <div className="bg-ink p-4 text-white flex justify-between items-center border-b-2 border-ink">
                            <div className="flex items-center gap-2">
                                <Icon name="receipt" className="text-volt text-xl" />
                                <div>
                                    <h3 className="font-display text-base tracking-wide">{selectedExpense.name}</h3>
                                    <p className="text-[10px] text-white/60">Tax Proof Receipt</p>
                                </div>
                            </div>
                            <button onClick={() => setSelectedExpense(null)} className="text-white/70 hover:text-white">
                                <Icon name="close" />
                            </button>
                        </div>

                        <div className="p-5 overflow-y-auto space-y-4">
                            <div className="bg-background rounded-2xl p-4 border border-border-light space-y-2 text-xs">
                                <div className="flex justify-between">
                                    <span className="text-text-muted font-bold text-[10px] uppercase">Category</span>
                                    <span className="font-bold text-text-main">{selectedExpense.category}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-text-muted font-bold text-[10px] uppercase">Date Logged</span>
                                    <span className="font-bold text-text-main">{selectedExpense.date}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-text-muted font-bold text-[10px] uppercase">Amount</span>
                                    <span className="font-mono font-bold text-danger text-sm">{formatCurrency(selectedExpense.amount, settings.invoiceDefaults.currency)}</span>
                                </div>
                                <div className="pt-2 border-t border-border-light flex items-center gap-1.5 text-emerald-700 font-bold text-[11px]">
                                    <Icon name="check_circle" className="text-emerald-600 text-[14px]" />
                                    <span>Verified for Year-End Tax Deduction Filing</span>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <p className="text-[10px] font-bold uppercase tracking-widest text-text-muted">Receipt Photo Scan</p>
                                {selectedExpense.receiptImage ? (
                                    <div className="rounded-2xl overflow-hidden border-2 border-ink bg-ink/5 max-h-64 flex items-center justify-center p-1">
                                        <img src={selectedExpense.receiptImage} alt="Receipt scan" className="max-h-60 w-full object-contain rounded-xl" />
                                    </div>
                                ) : (
                                    <div className="p-6 text-center bg-background rounded-2xl border-2 border-dashed border-border-light text-text-muted text-xs space-y-1">
                                        <Icon name="no_photography" className="text-3xl" />
                                        <p className="font-bold">No receipt image was attached for this item.</p>
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="p-4 bg-background border-t border-border-light">
                            <button
                                onClick={() => setSelectedExpense(null)}
                                className="w-full py-3 rounded-full bg-ink text-white font-bold uppercase text-xs tracking-wide hover:bg-black transition-colors"
                            >
                                Close Receipt View
                            </button>
                        </div>
                    </div>
                )}
            </Modal>

            <main className="flex-1 overflow-y-auto pb-28">
                <div className="px-6 pb-6 pt-4">
                    <div className="plate flex w-full flex-col gap-1 bg-ink p-8 items-center text-center">
                        <p className="text-white/50 text-[11px] font-bold uppercase tracking-widest">Total Spend</p>
                        <p className="font-display text-5xl text-white my-2 tracking-wide">{formatCurrency(Math.abs(totalSpend))}</p>
                        <div className="flex items-center gap-1.5 px-3 py-1 bg-signal/20 rounded-full mt-1 border border-signal/40">
                            <Icon name="receipt_long" className="text-signal text-sm" />
                            <p className="text-signal text-xs font-bold">{expenses.length} logged this period</p>
                        </div>
                    </div>
                </div>
                <div className="px-6 pb-8">
                    <h3 className="text-xs font-bold uppercase tracking-widest mb-4 flex items-center gap-2 text-text-muted"><span className="w-2 h-2 bg-primary rounded-full inline-block"></span>Add Expense & Receipt</h3>
                    <div className="space-y-4 bg-white p-5 rounded-2xl border-2 border-ink">
                        <label className="flex flex-col w-full group">
                            <p className="text-text-muted text-[10px] font-bold uppercase tracking-widest mb-1.5 ml-1">Amount</p>
                            <div className="relative">
                                <span className="absolute left-4 top-1/2 -translate-y-1/2 font-bold text-lg font-mono">{currencySymbol}</span>
                                <input value={amount} onChange={e => setAmount(e.target.value)} className="w-full rounded-xl bg-background border-2 border-border-light focus:border-primary focus:ring-0 h-12 pl-9 pr-4 text-lg font-bold font-mono placeholder:text-gray-400 transition-all" placeholder="0.00" type="number" />
                            </div>
                        </label>
                        <div className="flex gap-3">
                            <label className="flex flex-col flex-1">
                                <p className="text-text-muted text-[10px] font-bold uppercase tracking-widest mb-1.5 ml-1">Category</p>
                                <div className="relative">
                                    <select value={category} onChange={e => setCategory(e.target.value)} className="w-full appearance-none rounded-xl bg-background border-2 border-border-light focus:border-primary focus:ring-0 h-12 pl-4 pr-10 text-sm font-bold transition-all">
                                        {categoryOptions.map(c => <option key={c} value={c}>{c}</option>)}
                                    </select>
                                    <div className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 flex items-center text-text-muted"><Icon name="expand_more" /></div>
                                </div>
                            </label>
                            <label className="flex flex-col flex-1">
                                <p className="text-text-muted text-[10px] font-bold uppercase tracking-widest mb-1.5 ml-1">Date</p>
                                <input value={date} onChange={e => setDate(e.target.value)} className="w-full rounded-xl bg-background border-2 border-border-light focus:border-primary focus:ring-0 h-12 px-4 text-sm font-bold transition-all text-center" type="date" />
                            </label>
                        </div>

                        {/* Receipt Photo Capture for Tax Filing */}
                        <div className="pt-2 border-t border-border-light">
                            <p className="text-text-muted text-[10px] font-bold uppercase tracking-widest mb-2 ml-1 flex items-center gap-1">
                                <Icon name="photo_camera" className="text-primary text-[14px]" />
                                <span>Receipt Photo (For Tax Filing)</span>
                            </p>
                            
                            {receiptImage ? (
                                <div className="relative rounded-xl border-2 border-ink bg-background p-2 flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <img src={receiptImage} alt="Receipt preview" className="size-12 object-cover rounded-lg border border-ink" />
                                        <div>
                                            <p className="text-xs font-bold text-emerald-700 flex items-center gap-1">
                                                <Icon name="check_circle" className="text-[14px]" />
                                                <span>Photo Attached</span>
                                            </p>
                                            <p className="text-[10px] text-text-muted">Ready for tax records</p>
                                        </div>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => setReceiptImage(null)}
                                        className="text-danger hover:text-danger/80 p-2"
                                    >
                                        <Icon name="delete" />
                                    </button>
                                </div>
                            ) : (
                                <label className="flex items-center justify-center gap-2 w-full h-12 rounded-xl bg-background border-2 border-dashed border-border-light hover:border-ink transition-colors cursor-pointer text-text-muted hover:text-ink">
                                    <Icon name="add_a_photo" className="text-lg text-primary" />
                                    <span className="text-xs font-bold">Snap or Upload Receipt Photo</span>
                                    <input
                                        type="file"
                                        accept="image/*"
                                        capture="environment"
                                        onChange={handleReceiptFileChange}
                                        className="hidden"
                                    />
                                </label>
                            )}
                        </div>

                        <button onClick={handleSave} className="w-full h-12 rounded-full bg-ink text-white font-bold uppercase text-sm tracking-wide hover:bg-black transition-colors mt-2">Save Expense</button>
                    </div>
                </div>
                <div className="flex items-center justify-between px-6 pt-2 pb-3">
                    <h3 className="text-xs font-bold uppercase tracking-widest text-text-muted">Recent</h3>
                </div>
                <div className="flex gap-2 px-6 pb-5 overflow-x-auto" style={{ scrollbarWidth: 'none' }}>
                    {categories.map(cat => (
                        <button key={cat} onClick={() => setActiveCategory(cat)} className={`whitespace-nowrap rounded-full px-5 py-2 text-xs font-bold uppercase tracking-wide transition-colors border-2 ${activeCategory === cat ? 'bg-ink text-white border-ink' : 'bg-white border-border-light text-text-muted hover:border-ink hover:text-ink'}`}>{cat}</button>
                    ))}
                </div>
                <div className="flex flex-col px-6 gap-3">
                    {filtered.length === 0 ? (
                        <p className="text-center text-text-muted text-sm py-8">No expenses in this category yet.</p>
                    ) : filtered.map((exp) => (
                        <div
                            key={exp.id}
                            onClick={() => setSelectedExpense(exp)}
                            className="group flex items-center justify-between gap-4 rounded-2xl bg-white p-4 border-2 border-transparent hover:border-ink transition-all cursor-pointer shadow-sm"
                        >
                            <div className="flex items-center gap-4">
                                <div className={`flex size-12 items-center justify-center rounded-2xl ${exp.iconBg} ${exp.iconColor}`}><Icon name={exp.icon} className="text-[22px]" /></div>
                                <div className="flex flex-col">
                                    <p className="text-sm font-bold leading-tight mb-0.5">{exp.name}</p>
                                    <div className="flex items-center gap-2">
                                        <p className="text-text-muted text-xs font-medium">{exp.date}</p>
                                        {exp.receiptImage && (
                                            <span className="text-[9px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-1.5 py-0.5 rounded flex items-center gap-0.5">
                                                <Icon name="photo_camera" className="text-[10px]" />
                                                <span>Receipt</span>
                                            </span>
                                        )}
                                    </div>
                                </div>
                            </div>
                            <div className="text-right"><p className="text-sm font-bold font-mono">{formatCurrency(exp.amount)}</p><p className="text-text-muted text-[10px] uppercase font-bold tracking-wide mt-0.5">{exp.category}</p></div>
                        </div>
                    ))}
                </div>
            </main>
        </div>
    );
};

export default ExpensesPage;
