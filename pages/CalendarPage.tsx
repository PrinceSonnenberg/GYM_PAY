
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

const CalendarPage: React.FC = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const { clients, getSessionsForDate, addSession, removeSession } = useData();
    const [selectedDate, setSelectedDate] = useState(toISO(new Date()));
    const [showForm, setShowForm] = useState(false);
    const [draft, setDraft] = useState(emptyDraft);
    const [activeAttendanceSession, setActiveAttendanceSession] = useState<Session | null>(null);

    useEffect(() => {
        if (location.search.includes('add=true')) {
            setShowForm(true);
        }
    }, [location.search]);

    const weekDays = useMemo(() => {
        const start = new Date();
        start.setDate(start.getDate() - start.getDay());
        return Array.from({ length: 7 }, (_, i) => {
            const d = new Date(start);
            d.setDate(start.getDate() + i);
            return d;
        });
    }, []);

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

    return (
        <div className="flex flex-col min-h-screen bg-background">
            <PageHeader
                title="CALENDAR"
                onBack={() => navigate(-1)}
                rightAction={
                    <button
                        onClick={() => setShowForm(v => !v)}
                        aria-label="Book a session"
                        disabled={clients.length === 0}
                        className="flex size-10 items-center justify-center rounded-full bg-primary text-white border-2 border-white/20 hover:bg-primary-hover transition-colors disabled:opacity-40"
                    >
                        <Icon name={showForm ? 'close' : 'add'} className="text-[20px]" />
                    </button>
                }
            >
                <p className="text-white/50 text-xs font-bold uppercase tracking-widest mt-3">{monthYearLabel(new Date(selectedDate + 'T00:00:00'))}</p>
                <div className="flex justify-between mt-3 gap-1">
                    {weekDays.map(d => {
                        const iso = toISO(d);
                        const isSelected = iso === selectedDate;
                        const isToday = iso === toISO(new Date());
                        return (
                            <button
                                key={iso}
                                onClick={() => setSelectedDate(iso)}
                                className={`flex flex-1 flex-col items-center gap-1 rounded-xl py-2.5 transition-colors ${isSelected ? 'bg-volt text-ink' : 'text-white/70 hover:bg-white/10'}`}
                            >
                                <span className="text-[9px] font-bold uppercase">{dayLabel(d)}</span>
                                <span className={`text-sm font-bold font-mono ${isToday && !isSelected ? 'text-volt' : ''}`}>{d.getDate()}</span>
                            </button>
                        );
                    })}
                </div>
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
                            {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
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

            <main className="flex-1 p-5 pb-28">
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
                    <EmptyState
                        icon="event_available"
                        iconBg="bg-primary text-white"
                        title="NOTHING BOOKED"
                        description={clients.length === 0 ? 'Add a client before booking a session.' : 'Tap the + above to book a session for this day.'}
                    />
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
