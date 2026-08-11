
import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import Icon from '../components/Icon';
import AttendanceBadge from '../components/AttendanceBadge';
import AttendanceModal from '../components/AttendanceModal';
import NotificationsModal from '../components/NotificationsModal';
import Modal from '../components/Modal';
import { useData } from '../context/DataContext';
import { formatCurrency, invoiceSubtotal } from '../utils/format';
import { Session, Invoice } from '../types';

const todayISO = () => new Date().toISOString().slice(0, 10);

const HomePage: React.FC = () => {
    const navigate = useNavigate();
    const { invoices, expenses, clients, getSessionsForDate, settings, markInvoicePaid, sendInvoiceReminder } = useData();
    const [activeAttendanceSession, setActiveAttendanceSession] = useState<Session | null>(null);
    const [showNotifications, setShowNotifications] = useState(false);
    const [trendPeriod, setTrendPeriod] = useState<'This Month' | 'Last Month' | 'Yearly'>('This Month');
    const [hoveredPoint, setHoveredPoint] = useState<number | null>(null);

    // Pending Invoice Action Modal State
    const [selectedPendingInvoice, setSelectedPendingInvoice] = useState<Invoice | null>(null);
    const [actionToast, setActionToast] = useState<string | null>(null);
    const [isSendingReminder, setIsSendingReminder] = useState(false);

    const pressTimerRef = useRef<NodeJS.Timeout | null>(null);
    const isLongPressRef = useRef<boolean>(false);

    const handlePressStart = (inv: Invoice) => {
        isLongPressRef.current = false;
        if (pressTimerRef.current) clearTimeout(pressTimerRef.current);
        pressTimerRef.current = setTimeout(() => {
            isLongPressRef.current = true;
            setSelectedPendingInvoice(inv);
        }, 400);
    };

    const handlePressEnd = () => {
        if (pressTimerRef.current) {
            clearTimeout(pressTimerRef.current);
            pressTimerRef.current = null;
        }
    };

    const handleInvoiceClick = (inv: Invoice) => {
        if (isLongPressRef.current) {
            isLongPressRef.current = false;
            return;
        }
        setSelectedPendingInvoice(inv);
    };

    const handleMarkAsPaid = (invId: string) => {
        markInvoicePaid(invId);
        setActionToast('Invoice marked as paid! Added to Revenue.');
        setSelectedPendingInvoice(null);
        setTimeout(() => setActionToast(null), 3500);
    };

    const handleSendReminder = async (invId: string) => {
        setIsSendingReminder(true);
        try {
            await sendInvoiceReminder(invId);
            setActionToast('Payment reminder sent to client!');
            setSelectedPendingInvoice(null);
            setTimeout(() => setActionToast(null), 3500);
        } catch (err: any) {
            setActionToast(err.message || 'Failed to send reminder.');
            setTimeout(() => setActionToast(null), 3500);
        } finally {
            setIsSendingReminder(false);
        }
    };

    const allTodaySessions = getSessionsForDate(todayISO());
    // Filter active today sessions: default is scheduled; if marked as attended, it drops off
    const activeTodaySessions = allTodaySessions.filter(s => s.status === 'scheduled');
    const clientNameFor = (id: string) => clients.find(c => c.id === id)?.name || 'Unknown';

    const invoiceTotal = (inv: typeof invoices[number]) => {
        const subtotal = invoiceSubtotal(inv?.items);
        let afterDiscount = subtotal;
        if (inv.discountType === 'percentage' && typeof inv.discountValue === 'number') {
            afterDiscount = subtotal - (subtotal * (inv.discountValue / 100));
        } else if (inv.discountType === 'fixed' && typeof inv.discountValue === 'number') {
            afterDiscount = Math.max(0, subtotal - inv.discountValue);
        }
        const taxRate = typeof inv?.taxRate === 'number' ? inv.taxRate : parseFloat(String(inv?.taxRate ?? 0)) || 0;
        const total = afterDiscount + afterDiscount * taxRate;
        return Number.isNaN(total) ? 0 : total;
    };
    const paidInvoices = invoices.filter(i => i.status === 'paid' && invoiceTotal(i) > 0);
    const pendingInvoices = invoices.filter(i => i.status === 'sent' && invoiceTotal(i) > 0);
    const hasPendingInvoices: boolean = pendingInvoices.length >= 1;
    const revenue = paidInvoices.reduce((sum, inv) => sum + invoiceTotal(inv), 0 as number);
    const pending = pendingInvoices.reduce((sum, inv) => sum + invoiceTotal(inv), 0 as number);
    const recentExpenses = expenses.slice(0, 2);
    const clientName = (id: string) => clients.find(c => c.id === id)?.name || 'Unknown';

    // Coach Profile Info
    const coachName = settings.profile.name || 'Alex Sonnenberg';
    const coachTitle = settings.profile.title || 'Strength & Conditioning Coach';

    // Notifications Count
    const activeNotifCount = pendingInvoices.length + activeTodaySessions.length;

    // Income Trend Dynamic Calculations
    const getTrendData = () => {
        const now = new Date();
        if (trendPeriod === 'This Month') {
            const currentMonth = now.getMonth();
            const currentYear = now.getFullYear();
            let weeks: number[] = [0, 0, 0, 0];
            paidInvoices.forEach(inv => {
                const d = new Date(inv.issuedDate || inv.dueDate || now);
                if (d.getMonth() === currentMonth && d.getFullYear() === currentYear) {
                    const dateNum = d.getDate();
                    if (dateNum <= 7) weeks[0] += invoiceTotal(inv);
                    else if (dateNum <= 14) weeks[1] += invoiceTotal(inv);
                    else if (dateNum <= 21) weeks[2] += invoiceTotal(inv);
                    else weeks[3] += invoiceTotal(inv);
                }
            });
            // Default sample distribution if user has overall revenue but dates fall in single week or demo
            if (weeks.every(w => w === 0 as number) && revenue > 0) {
                weeks[3] = revenue;
            }
            return {
                labels: ['Week 1', 'Week 2', 'Week 3', 'Week 4'],
                values: weeks,
                total: weeks.reduce((a, b) => a + b, 0)
            };
        } else if (trendPeriod === 'Last Month') {
            const lastMonthDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
            const lm = lastMonthDate.getMonth();
            const ly = lastMonthDate.getFullYear();
            let weeks: number[] = [0, 0, 0, 0];
            paidInvoices.forEach(inv => {
                const d = new Date(inv.issuedDate || inv.dueDate || now);
                if (d.getMonth() === lm && d.getFullYear() === ly) {
                    const dateNum = d.getDate();
                    if (dateNum <= 7) weeks[0] += invoiceTotal(inv);
                    else if (dateNum <= 14) weeks[1] += invoiceTotal(inv);
                    else if (dateNum <= 21) weeks[2] += invoiceTotal(inv);
                    else weeks[3] += invoiceTotal(inv);
                }
            });
            return {
                labels: ['Week 1', 'Week 2', 'Week 3', 'Week 4'],
                values: weeks,
                total: weeks.reduce((a, b) => a + b, 0)
            };
        } else {
            // Yearly
            let quarters: number[] = [0, 0, 0, 0];
            const currentYear = now.getFullYear();
            paidInvoices.forEach(inv => {
                const d = new Date(inv.issuedDate || inv.dueDate || now);
                if (d.getFullYear() === currentYear) {
                    const m = d.getMonth();
                    if (m < 3) quarters[0] += invoiceTotal(inv);
                    else if (m < 6) quarters[1] += invoiceTotal(inv);
                    else if (m < 9) quarters[2] += invoiceTotal(inv);
                    else quarters[3] += invoiceTotal(inv);
                }
            });
            if (quarters.every(q => q === 0 as number) && revenue > 0) {
                quarters[2] = revenue;
            }
            return {
                labels: ['Q1 (Jan-Mar)', 'Q2 (Apr-Jun)', 'Q3 (Jul-Sep)', 'Q4 (Oct-Dec)'],
                values: quarters,
                total: quarters.reduce((a, b) => a + b, 0)
            };
        }
    };

    const trendData = getTrendData();
    const maxVal = Math.max(...trendData.values.map(v => v || 0), 100);

    // Calculate Y coords for SVG (0..100 X, 0..50 Y, lower Y = higher value)
    const points = trendData.values.map((v, i) => {
        let x = (i / (trendData.values.length - 1)) * 100;
        let y = 45 - ((v || 0) / maxVal) * 35;
        if (Number.isNaN(x)) x = 0;
        if (Number.isNaN(y)) y = 45;
        return { x, y, val: v || 0, label: trendData.labels[i] };
    });

    const pathD = points.reduce((acc, p, i) => {
        if (i === 0) return `M ${p.x} ${p.y}`;
        const prev = points[i - 1];
        const cx1 = prev.x + (p.x - prev.x) / 2;
        const cy1 = prev.y;
        const cx2 = prev.x + (p.x - prev.x) / 2;
        const cy2 = p.y;
        return `${acc} C ${cx1} ${cy1}, ${cx2} ${cy2}, ${p.x} ${p.y}`;
    }, '');

    const areaD = `${pathD} L 100 50 L 0 50 Z`;

    return (
        <>
            <header className="sticky top-0 z-30 flex items-center justify-between bg-ink px-5 py-4 shadow-md">
                <div 
                    onClick={() => navigate('/settings')} 
                    className="flex items-center gap-3 cursor-pointer group min-w-0"
                    title="Click to edit Coach Profile in Settings"
                >
                    <div className="relative size-11 overflow-hidden rounded-full border-2 border-volt shrink-0 bg-primary flex items-center justify-center text-white font-display text-lg">
                        {coachName.charAt(0)}
                    </div>
                    <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                            <p className="text-[10px] font-bold uppercase tracking-wider text-white/60">Coach Profile</p>
                            <Icon name="edit" className="text-[12px] text-volt opacity-80 group-hover:opacity-100 transition-opacity" />
                        </div>
                        <h2 className="font-display text-xl leading-tight text-white tracking-wide truncate group-hover:text-volt transition-colors">
                            {coachName.toUpperCase()}
                        </h2>
                    </div>
                </div>
                <button 
                    onClick={() => setShowNotifications(true)}
                    aria-label="Open notifications"
                    className="relative flex size-10 items-center justify-center rounded-full bg-white/10 text-white transition-colors hover:bg-white/20 shrink-0"
                >
                    <Icon name="notifications" className="text-[22px]" />
                    {activeNotifCount > 0 && (
                        <span className="absolute right-2 top-2 size-2.5 rounded-full bg-volt border-2 border-ink animate-pulse"></span>
                    )}
                </button>
            </header>
            <main className="flex-1 px-5 space-y-4 pt-4 pb-28">
                
                {(settings.homePreferences?.showRevenue ?? true) && (
                <section className="grid grid-cols-2 gap-3">
                    <div onClick={() => navigate('/invoices')} className="plate flex flex-col justify-between gap-2 bg-ink p-3.5 text-white cursor-pointer hover:opacity-95 transition-opacity">
                        <div className="flex items-center gap-1.5 text-white/60">
                            <Icon name="payments" className="text-[16px]" />
                            <p className="text-[9px] font-bold uppercase tracking-widest">Revenue</p>
                        </div>
                        <div>
                            <p className="font-display text-2xl tracking-wide">{formatCurrency(revenue)}</p>
                            <div className="flex items-center gap-1 mt-0.5">
                                <Icon name="trending_up" className="text-[13px] text-volt" />
                                <span className="text-[10px] font-bold text-volt">{paidInvoices.length} PAID INVOICE{paidInvoices.length === 1 ? '' : 'S'}</span>
                            </div>
                        </div>
                    </div>
                    <div onClick={() => navigate('/invoices')} className="plate flex flex-col justify-between gap-2 bg-primary p-3.5 text-white cursor-pointer hover:opacity-95 transition-opacity">
                        <div className="flex items-center gap-1.5 text-white/70">
                            <Icon name="pending_actions" className="text-[16px]" />
                            <p className="text-[9px] font-bold uppercase tracking-widest">Pending</p>
                        </div>
                        <div>
                            <p className="font-display text-2xl tracking-wide">{formatCurrency(pending)}</p>
                            <div className="flex items-center gap-1 mt-0.5">
                                <Icon name="error" className="text-[13px]" />
                                <span className="text-[10px] font-bold">{pendingInvoices.length} INVOICE{pendingInvoices.length === 1 ? '' : 'S'}</span>
                            </div>
                        </div>
                    </div>
                </section>
                )}
                {(settings.homePreferences?.showIncomeTrend ?? true) && (
                <section className="plate bg-surface p-4 border-2 border-ink">
                    <div className="mb-3 flex flex-col gap-1">
                        <div className="flex items-center justify-between gap-3">
                            <h3 className="font-display text-lg tracking-wide uppercase leading-none text-ink">
                                INCOME TREND
                            </h3>
                            <div className="relative shrink-0">
                                <select 
                                     value={trendPeriod}
                                    onChange={e => {
                                        setTrendPeriod(e.target.value as any);
                                        setHoveredPoint(null);
                                    }}
                                    className="appearance-none bg-background border-2 border-ink rounded-lg py-1 pl-2.5 pr-7 text-[11px] font-bold uppercase tracking-wide focus:outline-none cursor-pointer hover:bg-white transition-colors"
                                >
                                    <option value="This Month">This Month</option>
                                    <option value="Last Month">Last Month</option>
                                    <option value="Yearly">Yearly</option>
                                </select>
                                <Icon name="expand_more" className="absolute right-1.5 top-1.5 text-[16px] pointer-events-none text-ink" />
                            </div>
                        </div>
                        <div className="flex items-center justify-between mt-1">
                            <button onClick={() => navigate('/statistics')} className="text-[13px] font-bold uppercase tracking-widest text-primary hover:text-primary-hover transition-colors flex items-center gap-0.5">
                                Stats <Icon name="chevron_right" className="text-[16px]" />
                            </button>
                            <p className="text-xs font-bold text-text-muted">{formatCurrency(trendData.total)} total in period</p>
                        </div>
                    </div>

                    {hoveredPoint !== null && (
                        <div className="mb-2 px-2.5 py-1 rounded-lg bg-ink text-volt text-[11px] font-bold flex items-center justify-between animate-fadeIn">
                            <span>{points[hoveredPoint].label}:</span>
                            <span className="font-mono text-xs">{formatCurrency(points[hoveredPoint].val)}</span>
                        </div>
                    )}

                    <div className="relative h-20 w-full pt-1">
                        <svg className="h-full w-full overflow-visible" preserveAspectRatio="none" viewBox="0 0 100 50">
                            <defs>
                                <linearGradient id="chartGradient" x1="0" x2="0" y1="0" y2="1">
                                    <stop offset="0%" stopColor="#FF4713" stopOpacity="0.3"></stop>
                                    <stop offset="100%" stopColor="#FF4713" stopOpacity="0"></stop>
                                </linearGradient>
                            </defs>
                            <path d={areaD} fill="url(#chartGradient)"></path>
                            <path d={pathD} fill="none" stroke="#FF4713" strokeLinecap="round" strokeWidth="3" vectorEffect="non-scaling-stroke"></path>
                            
                            {points.map((p, idx) => (
                                <g key={idx}>
                                    <circle
                                        cx={p.x}
                                        cy={p.y}
                                        r={hoveredPoint === idx ? "4" : "2.5"}
                                        fill="#FF4713"
                                        stroke="#18181B"
                                        strokeWidth="1"
                                        className="cursor-pointer transition-all"
                                        onMouseEnter={() => setHoveredPoint(idx)}
                                        onClick={() => setHoveredPoint(idx)}
                                    />
                                </g>
                            ))}
                        </svg>
                    </div>

                    <div className="mt-2 grid grid-cols-4 gap-1 px-1 text-center">
                        {trendData.labels.map((lbl, idx) => (
                            <button
                                key={idx}
                                onClick={() => setHoveredPoint(idx)}
                                className={`text-[9px] font-bold uppercase tracking-wider py-0.5 rounded-md transition-colors ${hoveredPoint === idx ? 'bg-primary text-white' : 'text-text-muted hover:text-text-main'}`}
                            >
                                {lbl}
                            </button>
                        ))}
                    </div>
                </section>
                )}
                {(settings.homePreferences?.showQuickActions ?? true) && (
                <section>
                    <h3 className="mb-4 text-xs font-bold text-text-muted uppercase tracking-widest px-1">Quick Actions</h3>
                    <div className="grid grid-cols-3 gap-3">
                        <button onClick={() => navigate('/invoice')} className="group flex flex-col items-center justify-center gap-2.5 plate-sm bg-white p-5 border-2 border-ink transition-all active:translate-y-1 hover:bg-primary-soft">
                            <div className="flex size-12 items-center justify-center rounded-full bg-primary text-white"><Icon name="add" className="text-[26px]" /></div>
                            <span className="text-[11px] font-bold uppercase tracking-wide">Invoice</span>
                        </button>
                        <button onClick={() => navigate('/clients')} className="group flex flex-col items-center justify-center gap-2.5 plate-sm bg-white p-5 border-2 border-ink transition-all active:translate-y-1 hover:bg-volt-soft">
                            <div className="flex size-12 items-center justify-center rounded-full bg-ink text-volt"><Icon name="fitness_center" className="text-[26px]" /></div>
                            <span className="text-[11px] font-bold uppercase tracking-wide">Clients</span>
                        </button>
                        <button onClick={() => navigate('/expenses')} className="group flex flex-col items-center justify-center gap-2.5 plate-sm bg-white p-5 border-2 border-ink transition-all active:translate-y-1 hover:bg-signal-soft">
                            <div className="flex size-12 items-center justify-center rounded-full bg-signal text-white"><Icon name="receipt_long" className="text-[26px]" /></div>
                            <span className="text-[11px] font-bold uppercase tracking-wide">Expense</span>
                        </button>
                    </div>
                </section>
                )}
                {(settings.homePreferences?.showSchedule ?? true) && (
                <section>
                    <div className="mb-3 flex items-center justify-between px-1">
                        <h3 className="text-xs font-bold text-text-muted uppercase tracking-widest">Today's Schedule</h3>
                        {activeTodaySessions.length > 0 && (
                            <a className="text-xs font-bold text-primary hover:text-primary-hover transition-colors uppercase tracking-wide" href="#/calendar">View All</a>
                        )}
                    </div>
                    {activeTodaySessions.length === 0 ? (
                        <p className="text-center text-text-muted text-xs font-medium py-3 px-4 bg-white rounded-xl border-2 border-ink">Nothing booked for today.</p>
                    ) : (
                        <div className="space-y-3">
                            {activeTodaySessions.map((session) => (
                                <div 
                                    key={session.id} 
                                    onClick={() => setActiveAttendanceSession(session)}
                                    className="flex flex-col gap-2 rounded-2xl p-4 border-2 border-ink bg-white cursor-pointer hover:border-primary transition-colors active:scale-[0.995]"
                                >
                                    <div className="flex items-center gap-3">
                                        <div className="flex flex-col items-center justify-center rounded-lg px-2.5 py-1.5 w-16 bg-ink text-white shrink-0">
                                            <span className="font-mono text-xs font-bold text-center">{session.time}</span>
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <h4 className="font-bold truncate text-text-main">{clientNameFor(session.clientId)}</h4>
                                            <p className="text-xs font-medium truncate text-text-muted">{session.sessionType}</p>
                                        </div>
                                        <div className={`flex size-9 items-center justify-center rounded-full shrink-0 ${session.format === 'video' ? 'bg-primary-soft text-primary' : 'bg-background text-text-muted'}`}>
                                            <Icon name={session.format === 'video' ? 'videocam' : 'location_on'} className="text-[18px]" />
                                        </div>
                                    </div>
                                    <div className="flex items-center justify-between pt-2 border-t border-border-light">
                                        <span className="text-[10px] font-bold uppercase tracking-wider text-text-muted">Attendance:</span>
                                        <AttendanceBadge
                                            status={session.status}
                                        />
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </section>
                )}
                {(settings.homePreferences?.showExpenses ?? true) && (
                <section>
                    <div className="mb-4 flex items-center justify-between px-1">
                        <h3 className="text-xs font-bold text-text-muted uppercase tracking-widest">Recent Expenses</h3>
                        <button onClick={() => navigate('/expenses')} className="text-xs font-bold text-primary hover:text-primary-hover transition-colors uppercase tracking-wide">View All</button>
                    </div>
                    <div className="overflow-hidden rounded-2xl bg-white border-2 border-ink">
                        {recentExpenses.length === 0 ? (
                            <p className="text-center text-text-muted text-sm py-6">No expenses logged yet.</p>
                        ) : recentExpenses.map((exp, index) => (
                            <div key={exp.id} className={`flex items-center justify-between p-5 hover:bg-background/60 transition-colors ${index < recentExpenses.length - 1 ? 'border-b-2 border-border-light' : ''}`}>
                                <div className="flex items-center gap-4">
                                    <div className={`flex size-10 items-center justify-center rounded-full ${exp.iconBg} ${exp.iconColor}`}><Icon name={exp.icon} className="text-[20px]" /></div>
                                    <div>
                                        <p className="text-sm font-bold text-text-main">{exp.name}</p>
                                        <p className="text-xs font-medium text-text-muted">{exp.date}</p>
                                    </div>
                                </div>
                                <span className="font-mono font-bold text-text-main">{formatCurrency(exp.amount)}</span>
                            </div>
                        ))}
                    </div>
                </section>
                )}
                
                {(settings.homePreferences?.showPendingInvoices ?? true) && hasPendingInvoices && (
                <section>
                        <div className="mb-4 flex items-center justify-between px-1">
                            <h3 className="text-xs font-bold text-text-muted uppercase tracking-widest">Pending Invoices</h3>
                            <span className="text-[10px] font-bold uppercase tracking-wider text-primary flex items-center gap-1">
                                <Icon name="touch_app" className="text-xs" />
                                Tap to Manage
                            </span>
                        </div>
                        <div className="overflow-hidden rounded-2xl bg-white border-2 border-ink">
                            {pendingInvoices.map((inv, index) => (
                                <div 
                                    key={inv.id} 
                                    onTouchStart={() => handlePressStart(inv)}
                                    onTouchEnd={handlePressEnd}
                                    onMouseDown={() => handlePressStart(inv)}
                                    onMouseUp={handlePressEnd}
                                    onMouseLeave={handlePressEnd}
                                    onClick={() => handleInvoiceClick(inv)}
                                    className={`flex items-center justify-between p-5 cursor-pointer hover:bg-primary-soft/30 transition-all active:bg-primary-soft/60 select-none ${index < pendingInvoices.length - 1 ? 'border-b-2 border-border-light' : ''}`}
                                >
                                    <div>
                                        <div className="flex items-center gap-2">
                                            <p className="text-sm font-bold text-text-main">{clientName(inv.clientId)}</p>
                                            <span className="text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-primary-soft text-primary border border-primary/20">Sent</span>
                                        </div>
                                        <p className="text-xs font-medium text-text-muted mt-0.5">Due {inv.dueDate}</p>
                                    </div>
                                    <span className="font-mono font-bold text-primary text-base">{formatCurrency(invoiceTotal(inv))}</span>
                                </div>
                            ))}
                        </div>
                    </section>
                )}
            </main>

            {/* Action Notification Toast */}
            {actionToast && (
                <div className="fixed bottom-24 left-1/2 -translate-x-1/2 z-50 max-w-[88vw] px-3 py-1.5 rounded-xl bg-ink text-volt font-bold text-[9px] uppercase tracking-wider border border-volt shadow-lg flex items-center gap-1.5 animate-bounce">
                    <Icon name="check_circle" className="text-sm shrink-0" />
                    <span className="truncate">{actionToast}</span>
                </div>
            )}

            {/* Pending Invoice Action Modal */}
            <Modal open={!!selectedPendingInvoice} onClose={() => setSelectedPendingInvoice(null)}>
                {selectedPendingInvoice && (
                    <div className="flex flex-col">
                        <div className="bg-ink p-5 text-white flex justify-between items-center border-b-2 border-ink">
                            <div>
                                <p className="text-[10px] font-bold uppercase tracking-widest text-volt">Manage Invoice</p>
                                <h3 className="font-display text-lg tracking-wide">{clientName(selectedPendingInvoice.clientId)}</h3>
                                <p className="text-xs text-white/60">Due {selectedPendingInvoice.dueDate}</p>
                            </div>
                            <button onClick={() => setSelectedPendingInvoice(null)} className="text-white/70 hover:text-white p-1">
                                <Icon name="close" />
                            </button>
                        </div>

                        <div className="p-5 space-y-4">
                            <div className="p-4 rounded-xl bg-background border-2 border-ink flex justify-between items-center">
                                <div>
                                    <p className="text-[10px] uppercase font-bold text-text-muted">Total Amount</p>
                                    <p className="font-mono text-xl font-bold text-primary">{formatCurrency(invoiceTotal(selectedPendingInvoice))}</p>
                                </div>
                                <span className="text-[10px] font-bold uppercase tracking-wide px-3 py-1 rounded-full bg-primary-soft text-primary border border-primary/20">
                                    {selectedPendingInvoice.status}
                                </span>
                            </div>

                            <p className="text-xs text-text-muted font-medium text-center">
                                Quick Invoice Actions
                            </p>

                            <div className="space-y-2.5">
                                <button
                                    type="button"
                                    onClick={() => handleMarkAsPaid(selectedPendingInvoice.id)}
                                    className="w-full py-3.5 px-4 rounded-xl bg-volt text-ink border-2 border-ink font-bold uppercase text-xs tracking-wider hover:bg-volt/80 transition-all flex items-center justify-center gap-2 shadow-sm active:scale-[0.98]"
                                >
                                    <Icon name="payments" className="text-lg" />
                                    <span>Mark as Paid</span>
                                </button>

                                <button
                                    type="button"
                                    onClick={() => handleSendReminder(selectedPendingInvoice.id)}
                                    disabled={isSendingReminder}
                                    className="w-full py-3 px-4 rounded-xl bg-white text-ink border-2 border-ink font-bold uppercase text-xs tracking-wider hover:bg-background transition-all flex items-center justify-center gap-2 active:scale-[0.98]"
                                >
                                    <Icon name="mail" className="text-lg text-primary" />
                                    <span>{isSendingReminder ? 'Sending...' : 'Send Reminder'}</span>
                                </button>

                                <button
                                    type="button"
                                    onClick={() => {
                                        const id = selectedPendingInvoice.id;
                                        setSelectedPendingInvoice(null);
                                        navigate(`/invoices?id=${id}`);
                                    }}
                                    className="w-full py-2.5 px-4 rounded-xl bg-background text-text-muted hover:text-ink font-bold uppercase text-xs tracking-wider transition-colors flex items-center justify-center gap-2"
                                >
                                    <Icon name="visibility" className="text-lg" />
                                    <span>View Invoice Details</span>
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </Modal>

            <AttendanceModal
                session={activeAttendanceSession}
                onClose={() => setActiveAttendanceSession(null)}
            />

            <NotificationsModal
                isOpen={showNotifications}
                onClose={() => setShowNotifications(false)}
                invoices={invoices}
                todaySessions={activeTodaySessions}
                clients={clients}
            />
        </>
    );
};

export default HomePage;
