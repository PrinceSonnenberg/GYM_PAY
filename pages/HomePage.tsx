
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Icon from '../components/Icon';
import AttendanceBadge from '../components/AttendanceBadge';
import AttendanceModal from '../components/AttendanceModal';
import NotificationsModal from '../components/NotificationsModal';
import { useData } from '../context/DataContext';
import { formatCurrency, invoiceSubtotal } from '../utils/format';
import { Session } from '../types';

const todayISO = () => new Date().toISOString().slice(0, 10);

const HomePage: React.FC = () => {
    const navigate = useNavigate();
    const { invoices, expenses, clients, getSessionsForDate, settings } = useData();
    const [activeAttendanceSession, setActiveAttendanceSession] = useState<Session | null>(null);
    const [showNotifications, setShowNotifications] = useState(false);
    const [trendPeriod, setTrendPeriod] = useState<'This Month' | 'Last Month' | 'Yearly'>('This Month');
    const [hoveredPoint, setHoveredPoint] = useState<number | null>(null);

    const allTodaySessions = getSessionsForDate(todayISO());
    // Filter active today sessions: default is scheduled; if marked as attended, it drops off
    const activeTodaySessions = allTodaySessions.filter(s => s.status === 'scheduled');
    const clientNameFor = (id: string) => clients.find(c => c.id === id)?.name || 'Unknown';

    const invoiceTotal = (inv: typeof invoices[number]) => {
        const subtotal = invoiceSubtotal(inv.items);
        return subtotal + subtotal * inv.taxRate;
    };
    const paidInvoices = invoices.filter(i => i.status === 'paid');
    const pendingInvoices = invoices.filter(i => i.status === 'sent');
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
    const maxVal = Math.max(...trendData.values, 100);

    // Calculate Y coords for SVG (0..100 X, 0..50 Y, lower Y = higher value)
    const points = trendData.values.map((v, i) => {
        const x = (i / (trendData.values.length - 1)) * 100;
        const y = 45 - (v / maxVal) * 35;
        return { x, y, val: v, label: trendData.labels[i] };
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
            <main className="flex-1 px-5 space-y-6 pt-6 pb-28">
                
                {(settings.homePreferences?.showRevenue ?? true) && (
                <section className="grid grid-cols-2 gap-4">
                    <div onClick={() => navigate('/invoices')} className="plate flex flex-col justify-between gap-3 bg-ink p-5 text-white cursor-pointer hover:opacity-95 transition-opacity">
                        <div className="flex items-center gap-2 text-white/60">
                            <Icon name="payments" className="text-[18px]" />
                            <p className="text-[10px] font-bold uppercase tracking-widest">Revenue</p>
                        </div>
                        <div>
                            <p className="font-display text-3xl tracking-wide">{formatCurrency(revenue)}</p>
                            <div className="flex items-center gap-1 mt-1">
                                <Icon name="trending_up" className="text-[15px] text-volt" />
                                <span className="text-xs font-bold text-volt">{paidInvoices.length} PAID INVOICE{paidInvoices.length === 1 ? '' : 'S'}</span>
                            </div>
                        </div>
                    </div>
                    <div onClick={() => navigate('/invoices')} className="plate flex flex-col justify-between gap-3 bg-primary p-5 text-white cursor-pointer hover:opacity-95 transition-opacity">
                        <div className="flex items-center gap-2 text-white/70">
                            <Icon name="pending_actions" className="text-[18px]" />
                            <p className="text-[10px] font-bold uppercase tracking-widest">Pending</p>
                        </div>
                        <div>
                            <p className="font-display text-3xl tracking-wide">{formatCurrency(pending)}</p>
                            <div className="flex items-center gap-1 mt-1">
                                <Icon name="error" className="text-[15px]" />
                                <span className="text-xs font-bold">{pendingInvoices.length} INVOICE{pendingInvoices.length === 1 ? '' : 'S'}</span>
                            </div>
                        </div>
                    </div>
                </section>
                )}
                {(settings.homePreferences?.showIncomeTrend ?? true) && (
                <section className="plate bg-surface p-6 border-2 border-ink">
                    <div className="mb-4 flex items-center justify-between">
                        <div>
                            <h3 className="font-display text-lg tracking-wide">INCOME TREND</h3>
                            <p className="text-xs font-bold text-text-muted">{formatCurrency(trendData.total)} total in period</p>
                        </div>
                        <div className="relative">
                            <select 
                                value={trendPeriod}
                                onChange={e => {
                                    setTrendPeriod(e.target.value as any);
                                    setHoveredPoint(null);
                                }}
                                className="appearance-none bg-background border-2 border-ink rounded-full py-1 pl-3 pr-8 text-xs font-bold uppercase tracking-wide focus:outline-none cursor-pointer hover:bg-white transition-colors"
                            >
                                <option value="This Month">This Month</option>
                                <option value="Last Month">Last Month</option>
                                <option value="Yearly">Yearly</option>
                            </select>
                            <Icon name="expand_more" className="absolute right-2 top-1.5 text-[16px] pointer-events-none" />
                        </div>
                    </div>

                    {hoveredPoint !== null && (
                        <div className="mb-3 px-3 py-1.5 rounded-xl bg-ink text-volt text-xs font-bold flex items-center justify-between animate-fadeIn">
                            <span>{points[hoveredPoint].label}:</span>
                            <span className="font-mono text-sm">{formatCurrency(points[hoveredPoint].val)}</span>
                        </div>
                    )}

                    <div className="relative h-32 w-full pt-2">
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

                    <div className="mt-4 grid grid-cols-4 gap-1 px-1 text-center">
                        {trendData.labels.map((lbl, idx) => (
                            <button
                                key={idx}
                                onClick={() => setHoveredPoint(idx)}
                                className={`text-[9px] font-bold uppercase tracking-wider py-1 rounded-md transition-colors ${hoveredPoint === idx ? 'bg-primary text-white' : 'text-text-muted hover:text-text-main'}`}
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
                    <div className="mb-4 flex items-center justify-between px-1">
                        <h3 className="text-xs font-bold text-text-muted uppercase tracking-widest">Today's Schedule</h3>
                        <a className="text-xs font-bold text-primary hover:text-primary-hover transition-colors uppercase tracking-wide" href="#/calendar">View All</a>
                    </div>
                    {activeTodaySessions.length === 0 ? (
                        <p className="text-center text-text-muted text-sm py-6 bg-white rounded-2xl border-2 border-ink">Nothing booked for today.</p>
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
                
                {(settings.homePreferences?.showPendingInvoices ?? true) && pendingInvoices.length > 0 && (
                <section>
                        <div className="mb-4 flex items-center justify-between px-1">
                            <h3 className="text-xs font-bold text-text-muted uppercase tracking-widest">Pending Invoices</h3>
                        </div>
                        <div className="overflow-hidden rounded-2xl bg-white border-2 border-ink">
                            {pendingInvoices.map((inv, index) => (
                                <div key={inv.id} className={`flex items-center justify-between p-5 ${index < pendingInvoices.length - 1 ? 'border-b-2 border-border-light' : ''}`}>
                                    <div>
                                        <p className="text-sm font-bold text-text-main">{clientName(inv.clientId)}</p>
                                        <p className="text-xs font-medium text-text-muted">Due {inv.dueDate}</p>
                                    </div>
                                    <span className="font-mono font-bold text-primary">{formatCurrency(invoiceTotal(inv))}</span>
                                </div>
                            ))}
                        </div>
                    </section>
                )}
            </main>

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
