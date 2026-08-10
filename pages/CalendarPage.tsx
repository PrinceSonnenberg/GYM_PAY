
import React, { useMemo, useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import Icon from '../components/Icon';
import AttendanceBadge from '../components/AttendanceBadge';
import AttendanceModal from '../components/AttendanceModal';
import { useData } from '../context/DataContext';
import PageHeader from '../components/PageHeader';
import EmptyState from '../components/EmptyState';
import { Session } from '../types';

const toISO = (d: Date) => d.toISOString().slice(0, 10);
const dayLabel = (d: Date) => d.toLocaleDateString('en-US', { weekday: 'short' });
const monthYearLabel = (d: Date) => d.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
const fullDateLabel = (iso: string) => new Date(iso + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });

const emptyDraft = { clientId: '', time: '', sessionType: '', format: 'video' as 'video' | 'location' };

const getDaysForMonth = (year: number, month: number) => {
    const firstDay = new Date(year, month, 1);
    const startingDayOfWeek = firstDay.getDay(); // 0 = Sun
    const totalDays = new Date(year, month + 1, 0).getDate();

    const days: { date: Date; isCurrentMonth: boolean; iso: string }[] = [];

    // Previous month trailing days
    const prevMonthLastDay = new Date(year, month, 0).getDate();
    for (let i = startingDayOfWeek - 1; i >= 0; i--) {
        const d = new Date(year, month - 1, prevMonthLastDay - i);
        days.push({ date: d, isCurrentMonth: false, iso: toISO(d) });
    }

    // Current month days
    for (let i = 1; i <= totalDays; i++) {
        const d = new Date(year, month, i);
        days.push({ date: d, isCurrentMonth: true, iso: toISO(d) });
    }

    // Next month leading days to complete grid (35 or 42 cells)
    const totalCells = days.length > 35 ? 42 : 35;
    const remaining = totalCells - days.length;
    for (let i = 1; i <= remaining; i++) {
        const d = new Date(year, month + 1, i);
        days.push({ date: d, isCurrentMonth: false, iso: toISO(d) });
    }

    return days;
};

const CalendarPage: React.FC = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const { clients, getSessionsForDate, addSession, removeSession, sessions: allSessions } = useData();
    const activeClients = useMemo(
        () => clients.filter(c => !c.isArchived && (c as any).is_archived !== true && c.status !== 'Archived'),
        [clients]
    );

    const [selectedDate, setSelectedDate] = useState(toISO(new Date()));
    const [viewMode, setViewMode] = useState<'week' | 'month'>('week');
    
    // Month navigation state (year, month index 0-11)
    const [monthNav, setMonthNav] = useState(() => {
        const d = new Date();
        return { year: d.getFullYear(), month: d.getMonth() };
    });

    // Week navigation state
    const [weekStart, setWeekStart] = useState(() => {
        const start = new Date();
        start.setDate(start.getDate() - start.getDay());
        return start;
    });

    const [showForm, setShowForm] = useState(false);
    const [draft, setDraft] = useState(emptyDraft);
    const [activeAttendanceSession, setActiveAttendanceSession] = useState<Session | null>(null);

    useEffect(() => {
        if (showForm && (!draft.clientId || !activeClients.some(c => c.id === draft.clientId))) {
            if (activeClients.length > 0) {
                setDraft(d => ({ ...d, clientId: activeClients[0].id }));
            }
        }
    }, [showForm, activeClients]);

    useEffect(() => {
        if (location.search.includes('add=true')) {
            setShowForm(true);
        }
    }, [location.search]);

    // Keep month/week nav in sync when selectedDate changes
    const handleSelectDate = (iso: string) => {
        setSelectedDate(iso);
        const dateObj = new Date(iso + 'T00:00:00');
        setMonthNav({ year: dateObj.getFullYear(), month: dateObj.getMonth() });
        
        const wStart = new Date(dateObj);
        wStart.setDate(wStart.getDate() - wStart.getDay());
        setWeekStart(wStart);
    };

    const weekDays = useMemo(() => {
        return Array.from({ length: 7 }, (_, i) => {
            const d = new Date(weekStart);
            d.setDate(weekStart.getDate() + i);
            return d;
        });
    }, [weekStart]);

    const monthGridDays = useMemo(() => {
        return getDaysForMonth(monthNav.year, monthNav.month);
    }, [monthNav]);

    // Map of dates to sessions for month view indicators
    const sessionsByDateMap = useMemo(() => {
        const map: Record<string, Session[]> = {};
        allSessions.forEach(s => {
            if (!map[s.date]) map[s.date] = [];
            map[s.date].push(s);
        });
        return map;
    }, [allSessions]);

    const sessions = getSessionsForDate(selectedDate);
    const clientName = (id: string) => clients.find(c => c.id === id)?.name || 'Unknown';

    // Attendance stats for selected day
    const attendedCount = sessions.filter(s => s.status === 'attended').length;
    const lateCancelCount = sessions.filter(s => s.status === 'cancelled_late').length;
    const carryOverCount = sessions.filter(s => s.status === 'carry_over').length;

    const handleAdd = () => {
        if (!draft.clientId || !draft.time.trim() || !draft.sessionType.trim()) return;
        addSession({ ...draft, date: selectedDate, status: 'scheduled' });
        setDraft(emptyDraft);
        setShowForm(false);
    };

    const handleBack = () => {
        if (window.history.state && window.history.state.idx > 0) {
            navigate(-1);
        } else {
            navigate('/');
        }
    };

    const handlePrevMonth = () => {
        setMonthNav(prev => {
            if (prev.month === 0) return { year: prev.year - 1, month: 11 };
            return { year: prev.year, month: prev.month - 1 };
        });
    };

    const handleNextMonth = () => {
        setMonthNav(prev => {
            if (prev.month === 11) return { year: prev.year + 1, month: 0 };
            return { year: prev.year, month: prev.month + 1 };
        });
    };

    const handlePrevWeek = () => {
        setWeekStart(prev => {
            const d = new Date(prev);
            d.setDate(d.getDate() - 7);
            return d;
        });
    };

    const handleNextWeek = () => {
        setWeekStart(prev => {
            const d = new Date(prev);
            d.setDate(d.getDate() + 7);
            return d;
        });
    };

    const handleToday = () => {
        const todayIso = toISO(new Date());
        handleSelectDate(todayIso);
    };

    const monthTitle = monthYearLabel(new Date(monthNav.year, monthNav.month, 1));

    return (
        <div className="flex flex-col min-h-screen bg-background">
            <PageHeader
                title="CALENDAR"
                onBack={handleBack}
                rightAction={
                    <button
                        onClick={() => setShowForm(v => !v)}
                        aria-label="Book a session"
                        disabled={activeClients.length === 0}
                        className="flex size-10 items-center justify-center rounded-full bg-primary text-white border-2 border-white/20 hover:bg-primary-hover transition-colors disabled:opacity-40"
                    >
                        <Icon name={showForm ? 'close' : 'add'} className="text-[20px]" />
                    </button>
                }
            >
                {/* Header Controls: Nav & View Switcher */}
                <div className="flex items-center justify-between mt-2 pt-1">
                    <div className="flex items-center gap-1.5 text-white">
                        <button
                            onClick={viewMode === 'month' ? handlePrevMonth : handlePrevWeek}
                            aria-label="Previous"
                            className="flex size-7 items-center justify-center rounded-full hover:bg-white/10 transition-colors"
                        >
                            <Icon name="chevron_left" className="text-[20px]" />
                        </button>

                        <span className="text-xs font-bold uppercase tracking-wider text-white">
                            {viewMode === 'month' ? monthTitle : monthYearLabel(weekDays[0])}
                        </span>

                        <button
                            onClick={viewMode === 'month' ? handleNextMonth : handleNextWeek}
                            aria-label="Next"
                            className="flex size-7 items-center justify-center rounded-full hover:bg-white/10 transition-colors"
                        >
                            <Icon name="chevron_right" className="text-[20px]" />
                        </button>

                        <button
                            onClick={handleToday}
                            className="ml-1 px-2 py-0.5 text-[10px] font-bold uppercase rounded bg-white/10 text-white/80 hover:bg-white/20 transition-colors"
                        >
                            Today
                        </button>
                    </div>

                    {/* View Switcher Pill */}
                    <div className="flex p-0.5 rounded-xl bg-white/10 border border-white/10">
                        <button
                            onClick={() => setViewMode('week')}
                            className={`px-3 py-1 text-[10px] font-bold uppercase rounded-lg transition-all ${
                                viewMode === 'week'
                                    ? 'bg-volt text-ink shadow-sm'
                                    : 'text-white/70 hover:text-white'
                            }`}
                        >
                            Week
                        </button>
                        <button
                            onClick={() => setViewMode('month')}
                            className={`px-3 py-1 text-[10px] font-bold uppercase rounded-lg transition-all ${
                                viewMode === 'month'
                                    ? 'bg-volt text-ink shadow-sm'
                                    : 'text-white/70 hover:text-white'
                            }`}
                        >
                            Month
                        </button>
                    </div>
                </div>

                {/* Week Strip (When viewMode === 'week') */}
                {viewMode === 'week' && (
                    <div className="flex justify-between mt-3 gap-1">
                        {weekDays.map(d => {
                            const iso = toISO(d);
                            const isSelected = iso === selectedDate;
                            const isToday = iso === toISO(new Date());
                            const daySessions = sessionsByDateMap[iso] || [];
                            return (
                                <button
                                    key={iso}
                                    onClick={() => handleSelectDate(iso)}
                                    className={`relative flex flex-1 flex-col items-center gap-1 rounded-xl py-2.5 transition-colors ${
                                        isSelected ? 'bg-volt text-ink' : 'text-white/70 hover:bg-white/10'
                                    }`}
                                >
                                    <span className="text-[9px] font-bold uppercase">{dayLabel(d)}</span>
                                    <span className={`text-sm font-bold font-mono ${isToday && !isSelected ? 'text-volt' : ''}`}>
                                        {d.getDate()}
                                    </span>
                                    {daySessions.length > 0 && (
                                        <span
                                            className={`size-1.5 rounded-full ${
                                                isSelected ? 'bg-ink' : 'bg-volt'
                                            }`}
                                        />
                                    )}
                                </button>
                            );
                        })}
                    </div>
                )}
            </PageHeader>

            {showForm && (
                <div className="p-5 bg-white border-b-2 border-ink space-y-3">
                    <p className="text-xs font-bold uppercase tracking-widest text-text-muted">New session • {fullDateLabel(selectedDate)}</p>
                    <div className="relative">
                        <select
                            value={draft.clientId}
                            onChange={e => setDraft(d => ({ ...d, clientId: e.target.value }))}
                            className="w-full appearance-none rounded-xl bg-background border-2 border-border-light focus:border-primary h-12 px-4 text-sm font-bold outline-none"
                        >
                            <option value="" disabled>Select client</option>
                            {activeClients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                        </select>
                        <Icon name="expand_more" className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-text-muted" />
                    </div>
                    <div className="flex gap-3">
                        <input
                            value={draft.time}
                            onChange={e => setDraft(d => ({ ...d, time: e.target.value }))}
                            placeholder="e.g. 09:00 AM"
                            className="flex-1 rounded-xl bg-background border-2 border-border-light focus:border-primary h-12 px-4 text-sm font-bold font-mono outline-none"
                        />
                        <select
                            value={draft.format}
                            onChange={e => setDraft(d => ({ ...d, format: e.target.value as 'video' | 'location' }))}
                            className="rounded-xl bg-background border-2 border-border-light focus:border-primary h-12 px-3 text-sm font-bold outline-none"
                        >
                            <option value="video">Video</option>
                            <option value="location">In Person</option>
                        </select>
                    </div>
                    <input
                        value={draft.sessionType}
                        onChange={e => setDraft(d => ({ ...d, sessionType: e.target.value }))}
                        placeholder="e.g. Leg Day • Hypertrophy"
                        className="w-full rounded-xl bg-background border-2 border-border-light focus:border-primary h-12 px-4 text-sm font-bold outline-none"
                    />
                    <button onClick={handleAdd} className="w-full rounded-xl bg-ink text-white font-bold uppercase text-sm tracking-wide py-3 hover:bg-black transition-colors">
                        Book Session
                    </button>
                </div>
            )}

            <main className="flex-1 p-4 pb-24">
                {/* Month Grid (When viewMode === 'month') */}
                {viewMode === 'month' && (
                    <div className="plate bg-surface border-2 border-ink rounded-2xl p-3.5 mb-5 shadow-pop">
                        {/* Weekday Column Headers */}
                        <div className="grid grid-cols-7 gap-1 mb-2 text-center">
                            {['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'].map(dayName => (
                                <span key={dayName} className="text-[10px] font-bold tracking-wider text-text-muted">
                                    {dayName}
                                </span>
                            ))}
                        </div>

                        {/* Calendar Grid Days */}
                        <div className="grid grid-cols-7 gap-1">
                            {monthGridDays.map(({ date, isCurrentMonth, iso }) => {
                                const isSelected = iso === selectedDate;
                                const isToday = iso === toISO(new Date());
                                const daySessions = sessionsByDateMap[iso] || [];
                                const hasSessions = daySessions.length > 0;

                                return (
                                    <button
                                        key={iso}
                                        onClick={() => handleSelectDate(iso)}
                                        className={`relative flex flex-col items-center justify-between h-12 py-1 rounded-xl border transition-all ${
                                            isSelected
                                                ? 'bg-volt text-ink font-bold border-2 border-ink shadow-sm'
                                                : isToday
                                                ? 'bg-primary/10 text-primary border-2 border-primary/40 font-bold'
                                                : isCurrentMonth
                                                ? 'bg-white text-text-main border-border-light hover:border-ink/40'
                                                : 'bg-background/50 text-text-muted/40 border-transparent'
                                        }`}
                                    >
                                        <span className={`text-xs font-mono font-bold leading-none ${!isCurrentMonth && !isSelected ? 'text-text-muted/40' : ''}`}>
                                            {date.getDate()}
                                        </span>

                                        {hasSessions && (
                                            <div className="flex items-center gap-0.5">
                                                <span
                                                    className={`px-1 rounded text-[9px] font-bold font-mono leading-tight ${
                                                        isSelected
                                                            ? 'bg-ink text-white'
                                                            : 'bg-primary text-white'
                                                    }`}
                                                >
                                                    {daySessions.length}
                                                </span>
                                            </div>
                                        )}
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                )}

                {/* Selected Day Agenda Header */}
                <div className="flex items-center justify-between mb-3">
                    <h3 className="text-xs font-bold uppercase tracking-widest text-text-muted">{fullDateLabel(selectedDate)}</h3>
                    {sessions.length > 0 && (
                        <div className="flex gap-2 text-[10px] font-bold">
                            <span className="px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-700">{attendedCount} Attended</span>
                            {lateCancelCount > 0 && <span className="px-2 py-0.5 rounded-md bg-danger/10 text-danger">{lateCancelCount} Late Cancel</span>}
                            {carryOverCount > 0 && <span className="px-2 py-0.5 rounded-md bg-amber-500/10 text-amber-800">{carryOverCount} Carry Over</span>}
                        </div>
                    )}
                </div>

                {sessions.length === 0 ? (
                    <div className="plate bg-surface border-2 border-ink rounded-2xl p-6 mt-8 mb-6 shadow-pop">
                        <EmptyState
                            icon="event_available"
                            iconBg="bg-primary text-white"
                            title="NOTHING BOOKED"
                            description={activeClients.length === 0 ? 'Add an active client to start booking sessions.' : undefined}
                            action={
                                activeClients.length > 0
                                    ? {
                                          label: 'Book a Session',
                                          icon: 'add',
                                          onClick: () => {
                                              setShowForm(true);
                                              window.scrollTo({ top: 0, behavior: 'smooth' });
                                          },
                                      }
                                    : {
                                          label: 'Add Active Client',
                                          icon: 'person_add',
                                          onClick: () => navigate('/clients'),
                                      }
                            }
                        />
                    </div>
                ) : (
                    <div className="space-y-3">
                        {sessions.map(session => (
                            <div key={session.id} className="flex flex-col gap-2 rounded-2xl p-4 border-2 border-ink bg-white">
                                <div className="flex items-center gap-3">
                                    <div className="flex flex-col items-center justify-center rounded-lg px-2.5 py-1.5 w-18 bg-ink text-white shrink-0">
                                        <span className="font-mono text-xs font-bold text-center leading-tight">{session.time}</span>
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <h4 className="font-bold truncate text-text-main">{clientName(session.clientId)}</h4>
                                        <p className="text-xs font-medium truncate text-text-muted">{session.sessionType}</p>
                                    </div>
                                    <div className={`flex size-9 items-center justify-center rounded-full shrink-0 ${session.format === 'video' ? 'bg-primary-soft text-primary' : 'bg-background text-text-muted'}`}>
                                        <Icon name={session.format === 'video' ? 'videocam' : 'location_on'} className="text-[18px]" />
                                    </div>
                                </div>

                                <div className="flex items-center justify-between pt-2 border-t border-border-light">
                                    <div className="flex items-center gap-2">
                                        <span className="text-[10px] font-bold uppercase tracking-wider text-text-muted">Attendance:</span>
                                        <AttendanceBadge
                                            status={session.status}
                                            onClick={() => setActiveAttendanceSession(session)}
                                        />
                                    </div>

                                    <div className="flex items-center gap-2">
                                        {session.notes && (
                                            <span className="text-[10px] italic text-text-muted truncate max-w-[120px]" title={session.notes}>
                                                "{session.notes}"
                                            </span>
                                        )}
                                        <button onClick={() => removeSession(session.id)} aria-label="Cancel session" className="text-text-muted hover:text-danger transition-colors p-1">
                                            <Icon name="close" className="text-[16px]" />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </main>

            {/* Attendance Modal */}
            <AttendanceModal
                session={activeAttendanceSession}
                onClose={() => setActiveAttendanceSession(null)}
            />
        </div>
    );
};

export default CalendarPage;

