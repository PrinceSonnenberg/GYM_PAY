import React, { useMemo, useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import Icon from '../components/Icon';
import AttendanceBadge from '../components/AttendanceBadge';
import AttendanceModal from '../components/AttendanceModal';
import { useData } from '../context/DataContext';
import PageHeader from '../components/PageHeader';
import EmptyState from '../components/EmptyState';
import { Session, SessionAttendanceStatus } from '../types';

// Utility helper functions for robust local date calculations (no UTC shifts)
const toISO = (d: Date): string => {
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
};

const dayLabel = (d: Date) => d.toLocaleDateString('en-US', { weekday: 'short' });
const monthYearLabel = (d: Date) => d.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

const fullDateLabel = (iso: string) => {
    if (!iso) return '';
    const [year, month, day] = iso.split('-').map(Number);
    if (!year || !month || !day) return iso;
    const d = new Date(year, month - 1, day);
    return d.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });
};

// Check if a selected date and time string is in the past
const isPastDateTime = (dateIso: string, timeStr: string): boolean => {
    if (!dateIso) return false;
    const now = new Date();
    const todayIso = toISO(now);

    if (dateIso < todayIso) return true;
    if (dateIso > todayIso) return false;

    // Same day: check time if provided
    if (!timeStr) return false;
    try {
        let time = timeStr.trim();
        let modifier = '';
        if (time.toUpperCase().includes('AM') || time.toUpperCase().includes('PM')) {
            const parts = time.split(/\s+/);
            time = parts[0];
            modifier = parts[1] || '';
        }

        let [hoursStr, minutesStr] = time.split(':');
        let hours = parseInt(hoursStr, 10);
        let minutes = parseInt(minutesStr || '0', 10);

        if (isNaN(hours)) hours = 9;
        if (isNaN(minutes)) minutes = 0;

        if (modifier.toUpperCase() === 'PM' && hours < 12) hours += 12;
        if (modifier.toUpperCase() === 'AM' && hours === 12) hours = 0;

        const [year, month, day] = dateIso.split('-').map(Number);
        const targetDate = new Date(year, month - 1, day, hours, minutes, 0);
        return targetDate.getTime() < Date.now();
    } catch (e) {
        return false;
    }
};

const SESSION_FOCUS_PRESETS = [
    'Strength Training',
    'Leg Day • Hypertrophy',
    'Cardio & Core',
    'Full Body Conditioning',
    'Mobility & Assessment',
    'Nutrition Review',
];

const TIME_PRESETS = [
    '08:00 AM',
    '09:00 AM',
    '10:00 AM',
    '11:00 AM',
    '01:00 PM',
    '02:00 PM',
    '04:00 PM',
    '06:00 PM',
];

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

    // Next month leading days to complete grid
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

    const [selectedDate, setSelectedDate] = useState(() => toISO(new Date()));
    const [viewMode, setViewMode] = useState<'week' | 'month'>('week');

    // Month navigation state (year, month index 0-11)
    const [monthNav, setMonthNav] = useState(() => {
        const d = new Date();
        return { year: d.getFullYear(), month: d.getMonth() };
    });

    // Week navigation state
    const [weekStart, setWeekStart] = useState(() => {
        const now = new Date();
        const start = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        start.setDate(start.getDate() - start.getDay());
        return start;
    });

    const [showForm, setShowForm] = useState(false);
    const [formError, setFormError] = useState<string | null>(null);
    const [formSuccess, setFormSuccess] = useState<string | null>(null);

    const [draft, setDraft] = useState({
        clientId: '',
        time: '09:00 AM',
        sessionType: 'Strength Training',
        format: 'location' as 'video' | 'location',
        notes: '',
        status: 'scheduled' as SessionAttendanceStatus,
    });

    const [activeAttendanceSession, setActiveAttendanceSession] = useState<Session | null>(null);

    // Sync default client selection
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

    // Check if current draft session is for a past date/time
    const isPastSessionDraft = useMemo(() => {
        return isPastDateTime(selectedDate, draft.time);
    }, [selectedDate, draft.time]);

    // Synchronize month/week navigation when selected date is picked
    const handleSelectDate = (iso: string) => {
        setSelectedDate(iso);
        const [y, m, d] = iso.split('-').map(Number);
        const dateObj = new Date(y, m - 1, d);
        setMonthNav({ year: dateObj.getFullYear(), month: dateObj.getMonth() });

        const wStart = new Date(y, m - 1, d);
        wStart.setDate(wStart.getDate() - wStart.getDay());
        setWeekStart(wStart);

        // Smoothly scroll to the day activities list
        setTimeout(() => {
            const el = document.getElementById('day-activities');
            if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }, 100);
    };

    const weekDays = useMemo(() => {
        return Array.from({ length: 7 }, (_, i) => {
            return new Date(weekStart.getFullYear(), weekStart.getMonth(), weekStart.getDate() + i);
        });
    }, [weekStart]);

    const monthGridDays = useMemo(() => {
        return getDaysForMonth(monthNav.year, monthNav.month);
    }, [monthNav]);

    // Map of dates to sessions for indicators
    const sessionsByDateMap = useMemo(() => {
        const map: Record<string, Session[]> = {};
        allSessions.forEach(s => {
            if (!map[s.date]) map[s.date] = [];
            map[s.date].push(s);
        });
        return map;
    }, [allSessions]);

    const sessions = getSessionsForDate(selectedDate);
    const clientName = (id: string) => clients.find(c => c.id === id)?.name || 'Unknown Client';

    // Attendance stats for selected day
    const attendedCount = sessions.filter(s => s.status === 'attended').length;
    const lateCancelCount = sessions.filter(s => s.status === 'cancelled_late').length;
    const carryOverCount = sessions.filter(s => s.status === 'carry_over').length;

    const handleAdd = () => {
        setFormError(null);
        setFormSuccess(null);

        if (!draft.clientId) {
            setFormError('Client selection is required to book a session.');
            return;
        }
        if (!draft.time.trim()) {
            setFormError('Session time is required.');
            return;
        }
        if (!draft.sessionType.trim()) {
            setFormError('Session Description / Focus is required in order to save the booking.');
            return;
        }

        const isPast = isPastDateTime(selectedDate, draft.time);
        const finalStatus: SessionAttendanceStatus = isPast ? (draft.status === 'scheduled' ? 'attended' : draft.status) : draft.status;
        
        let notesClean = draft.notes.trim();
        if (isPast && !notesClean.includes('[Post-Session Record]')) {
            notesClean = notesClean ? `[Post-Session Record] ${notesClean}` : '[Post-Session Record]';
        }

        addSession({
            clientId: draft.clientId,
            date: selectedDate,
            time: draft.time.trim(),
            sessionType: draft.sessionType.trim(),
            format: draft.format,
            status: finalStatus,
            notes: notesClean,
            isPostSessionCapture: isPast,
        });

        setFormSuccess(isPast ? 'Post-session entry captured & persisted!' : 'Session booked & persisted successfully!');
        
        setTimeout(() => {
            setShowForm(false);
            setFormSuccess(null);
            setDraft({
                clientId: activeClients[0]?.id || '',
                time: '09:00 AM',
                sessionType: 'Strength Training',
                format: 'location',
                notes: '',
                status: 'scheduled',
            });
        }, 1000);
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
            const d = new Date(prev.getFullYear(), prev.getMonth(), prev.getDate() - 7);
            return d;
        });
    };

    const handleNextWeek = () => {
        setWeekStart(prev => {
            const d = new Date(prev.getFullYear(), prev.getMonth(), prev.getDate() + 7);
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
                        onClick={() => {
                            setShowForm(v => !v);
                            setFormError(null);
                            setFormSuccess(null);
                        }}
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
                                        isSelected ? 'bg-volt text-ink border-2 border-ink' : 'text-white/70 hover:bg-white/10'
                                    }`}
                                >
                                    <span className="text-[9px] font-bold uppercase">{dayLabel(d)}</span>
                                    <span className={`text-sm font-bold font-mono ${isToday && !isSelected ? 'text-volt font-black underline' : ''}`}>
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

            {/* New Session Form */}
            {showForm && (
                <div className="p-5 bg-white border-b-2 border-ink space-y-4 shadow-md animate-fadeIn">
                    <div className="flex items-center justify-between border-b border-border-light pb-2">
                        <p className="text-xs font-bold uppercase tracking-widest text-text-muted">
                            New session • <span className="text-ink">{fullDateLabel(selectedDate)}</span>
                        </p>
                        <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded bg-amber-100 text-amber-900">
                            * Required fields
                        </span>
                    </div>

                    {formError && (
                        <div className="p-3 rounded-xl bg-danger/10 border-2 border-danger text-danger text-xs font-bold flex items-center gap-2">
                            <Icon name="error" className="text-[18px] shrink-0" />
                            <span>{formError}</span>
                        </div>
                    )}

                    {formSuccess && (
                        <div className="p-3 rounded-xl bg-emerald-500/10 border-2 border-emerald-600 text-emerald-800 text-xs font-bold flex items-center gap-2">
                            <Icon name="check_circle" className="text-[18px] shrink-0 text-emerald-600" />
                            <span>{formSuccess}</span>
                        </div>
                    )}

                    {/* Post-session capture indicator banner */}
                    {isPastSessionDraft && (
                        <div className="p-3 rounded-xl bg-amber-50 border-2 border-amber-300 text-amber-900 text-xs font-medium flex items-start gap-2.5">
                            <Icon name="history" className="text-[20px] text-amber-600 shrink-0 mt-0.5" />
                            <div>
                                <p className="font-bold uppercase tracking-wider text-[11px] text-amber-800">Post-Session Capture</p>
                                <p className="text-[11px] text-amber-900/90 mt-0.5">
                                    The selected time has already passed. This session will be logged as a completed past activity.
                                </p>
                            </div>
                        </div>
                    )}

                    {/* Client Select */}
                    <div>
                        <label className="block text-[10px] font-bold uppercase tracking-wider text-text-muted mb-1">
                            Client <span className="text-danger">*</span>
                        </label>
                        <div className="relative">
                            <select
                                value={draft.clientId}
                                onChange={e => {
                                    setDraft(d => ({ ...d, clientId: e.target.value }));
                                    setFormError(null);
                                }}
                                className="w-full appearance-none rounded-xl bg-background border-2 border-border-light focus:border-primary h-12 px-4 text-sm font-bold outline-none"
                            >
                                <option value="" disabled>Select client...</option>
                                {activeClients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                            </select>
                            <Icon name="expand_more" className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-text-muted" />
                        </div>
                    </div>

                    {/* Time Input & Presets */}
                    <div>
                        <label className="block text-[10px] font-bold uppercase tracking-wider text-text-muted mb-1">
                            Session Time <span className="text-danger">*</span>
                        </label>
                        <div className="flex gap-2 mb-2">
                            <input
                                value={draft.time}
                                onChange={e => {
                                    setDraft(d => ({ ...d, time: e.target.value }));
                                    setFormError(null);
                                }}
                                placeholder="e.g. 09:00 AM"
                                className="flex-1 rounded-xl bg-background border-2 border-border-light focus:border-primary h-12 px-4 text-sm font-bold font-mono outline-none"
                            />
                            <select
                                value={draft.format}
                                onChange={e => setDraft(d => ({ ...d, format: e.target.value as 'video' | 'location' }))}
                                className="rounded-xl bg-background border-2 border-border-light focus:border-primary h-12 px-3 text-sm font-bold outline-none shrink-0"
                            >
                                <option value="location">In Person</option>
                                <option value="video">Video Call</option>
                            </select>
                        </div>
                        {/* Quick Time Presets */}
                        <div className="flex flex-wrap gap-1.5">
                            {TIME_PRESETS.map(t => (
                                <button
                                    key={t}
                                    type="button"
                                    onClick={() => setDraft(d => ({ ...d, time: t }))}
                                    className={`px-2 py-1 rounded-lg text-[10px] font-mono font-bold transition-colors ${
                                        draft.time === t ? 'bg-ink text-white' : 'bg-background hover:bg-border-light text-text-muted'
                                    }`}
                                >
                                    {t}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Session Focus / Description (Required) */}
                    <div>
                        <div className="flex items-center justify-between mb-1">
                            <label className="block text-[10px] font-bold uppercase tracking-wider text-text-muted">
                                Session Description / Focus <span className="text-danger">* Required</span>
                            </label>
                        </div>
                        <input
                            value={draft.sessionType}
                            onChange={e => {
                                setDraft(d => ({ ...d, sessionType: e.target.value }));
                                setFormError(null);
                            }}
                            placeholder="e.g. Strength Training, Leg Day, Hypertrophy"
                            className="w-full rounded-xl bg-background border-2 border-border-light focus:border-primary h-12 px-4 text-sm font-bold outline-none mb-2"
                        />
                        {/* Session Focus Presets */}
                        <div className="flex flex-wrap gap-1.5">
                            {SESSION_FOCUS_PRESETS.map(preset => (
                                <button
                                    key={preset}
                                    type="button"
                                    onClick={() => {
                                        setDraft(d => ({ ...d, sessionType: preset }));
                                        setFormError(null);
                                    }}
                                    className={`px-2.5 py-1 rounded-lg text-[10px] font-bold transition-colors ${
                                        draft.sessionType === preset ? 'bg-primary text-white' : 'bg-background hover:bg-border-light text-text-muted'
                                    }`}
                                >
                                    {preset}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Status selection for post-session vs upcoming */}
                    {isPastSessionDraft ? (
                        <div>
                            <label className="block text-[10px] font-bold uppercase tracking-wider text-text-muted mb-1">
                                Initial Attendance Status
                            </label>
                            <select
                                value={draft.status === 'scheduled' ? 'attended' : draft.status}
                                onChange={e => setDraft(d => ({ ...d, status: e.target.value as SessionAttendanceStatus }))}
                                className="w-full rounded-xl bg-background border-2 border-border-light focus:border-primary h-11 px-3 text-sm font-bold outline-none"
                            >
                                <option value="attended">Attended (Completed)</option>
                                <option value="cancelled_late">Cancelled Late</option>
                                <option value="cancelled_advance">Cancelled Advance</option>
                                <option value="carry_over">Carry Over</option>
                            </select>
                        </div>
                    ) : null}

                    {/* Optional Notes */}
                    <div>
                        <label className="block text-[10px] font-bold uppercase tracking-wider text-text-muted mb-1">
                            Session Notes (Optional)
                        </label>
                        <input
                            value={draft.notes}
                            onChange={e => setDraft(d => ({ ...d, notes: e.target.value }))}
                            placeholder="e.g. Focus on squat form, weights, client feedback"
                            className="w-full rounded-xl bg-background border-2 border-border-light focus:border-primary h-10 px-3 text-xs font-medium outline-none"
                        />
                    </div>

                    <button
                        onClick={handleAdd}
                        className="w-full rounded-xl bg-ink text-white font-bold uppercase text-sm tracking-wide py-3 hover:bg-black transition-colors shadow-sm flex items-center justify-center gap-2"
                    >
                        <Icon name={isPastSessionDraft ? 'history' : 'event_available'} className="text-[18px]" />
                        <span>{isPastSessionDraft ? 'Capture Past Session' : 'Book Session'}</span>
                    </button>
                </div>
            )}

            <main className="flex-1 p-4 pb-24">
                {/* Month Grid (When viewMode === 'month') */}
                {viewMode === 'month' && (
                    <div className="plate bg-surface border-2 border-ink rounded-2xl p-3.5 mb-5 shadow-pop">
                        {/* Month Header Banner */}
                        <div className="flex items-center justify-between mb-3 px-1">
                            <span className="text-xs font-bold uppercase tracking-wider text-text-main">{monthTitle}</span>
                            <span className="text-[10px] font-bold text-text-muted">Click any day to view activities</span>
                        </div>

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
                                                ? 'bg-volt text-ink font-bold border-2 border-ink shadow-sm ring-2 ring-ink/20 scale-[1.02]'
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
                                            <div className="flex items-center gap-0.5 mb-0.5">
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

                {/* Selected Day Agenda Section */}
                <div id="day-activities" className="scroll-mt-6">
                    <div className="flex items-center justify-between mb-3">
                        <div>
                            <h3 className="text-xs font-bold uppercase tracking-widest text-text-muted">
                                Day Activities • <span className="text-ink">{fullDateLabel(selectedDate)}</span>
                            </h3>
                        </div>
                        {sessions.length > 0 && (
                            <div className="flex gap-1.5 text-[10px] font-bold">
                                <span className="px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-800 border border-emerald-500/20">{attendedCount} Attended</span>
                                {lateCancelCount > 0 && <span className="px-2 py-0.5 rounded-md bg-danger/10 text-danger border border-danger/20">{lateCancelCount} Late Cancel</span>}
                                {carryOverCount > 0 && <span className="px-2 py-0.5 rounded-md bg-amber-500/10 text-amber-800 border border-amber-500/20">{carryOverCount} Carry Over</span>}
                            </div>
                        )}
                    </div>

                    {sessions.length === 0 ? (
                        <div className="plate bg-surface border-2 border-ink rounded-2xl p-6 mb-6 shadow-pop text-center">
                            <EmptyState
                                icon="event_available"
                                iconBg="bg-primary text-white"
                                title="NO ACTIVITIES LOGGED FOR THIS DAY"
                                description={activeClients.length === 0 ? 'Add an active client to start booking sessions.' : `No sessions currently scheduled or captured for ${fullDateLabel(selectedDate)}.`}
                                action={
                                    activeClients.length > 0
                                        ? {
                                              label: `Book / Capture Session for ${fullDateLabel(selectedDate).split(',')[0]}`,
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
                            <div className="flex justify-end mb-1">
                                <button
                                    onClick={() => {
                                        setShowForm(true);
                                        window.scrollTo({ top: 0, behavior: 'smooth' });
                                    }}
                                    className="text-xs font-bold text-primary hover:underline flex items-center gap-1"
                                >
                                    <Icon name="add" className="text-[16px]" />
                                    <span>Add another session for this date</span>
                                </button>
                            </div>

                            {sessions.map(session => {
                                const isPostCapture = session.isPostSessionCapture || (session.notes && session.notes.includes('[Post-Session Record]'));
                                return (
                                    <div key={session.id} className="flex flex-col gap-2 rounded-2xl p-4 border-2 border-ink bg-white shadow-sm hover:shadow-md transition-shadow">
                                        <div className="flex items-center gap-3">
                                            <div className="flex flex-col items-center justify-center rounded-lg px-2.5 py-1.5 w-18 bg-ink text-white shrink-0">
                                                <span className="font-mono text-xs font-bold text-center leading-tight">{session.time}</span>
                                            </div>

                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-2">
                                                    <h4 className="font-bold truncate text-text-main">{clientName(session.clientId)}</h4>
                                                    {isPostCapture && (
                                                        <span className="shrink-0 inline-flex items-center gap-1 text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-amber-100 text-amber-900 border border-amber-300">
                                                            <Icon name="history" className="text-[12px]" />
                                                            Post-Session
                                                        </span>
                                                    )}
                                                </div>
                                                <p className="text-xs font-semibold truncate text-primary">{session.sessionType}</p>
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
                                                    <span className="text-[10px] italic text-text-muted truncate max-w-[150px]" title={session.notes}>
                                                        "{session.notes.replace('[Post-Session Record]', '').trim()}"
                                                    </span>
                                                )}
                                                <button onClick={() => removeSession(session.id)} aria-label="Cancel session" className="text-text-muted hover:text-danger transition-colors p-1">
                                                    <Icon name="close" className="text-[16px]" />
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            </main>

            {/* Attendance Status Modal */}
            <AttendanceModal
                session={activeAttendanceSession}
                onClose={() => setActiveAttendanceSession(null)}
            />
        </div>
    );
};

export default CalendarPage;
