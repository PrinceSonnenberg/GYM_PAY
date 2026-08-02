import React, { useState } from 'react';
import Icon from './Icon';
import { Session, SessionAttendanceStatus } from '../types';
import { useData } from '../context/DataContext';

interface AttendanceModalProps {
    session: Session | null;
    onClose: () => void;
}

export const ATTENDANCE_CONFIG: Record<SessionAttendanceStatus, {
    label: string;
    icon: string;
    badgeBg: string;
    badgeText: string;
    badgeBorder: string;
    description: string;
}> = {
    scheduled: {
        label: 'Scheduled',
        icon: 'schedule',
        badgeBg: 'bg-primary-soft',
        badgeText: 'text-primary',
        badgeBorder: 'border-primary/30',
        description: 'Upcoming scheduled session',
    },
    attended: {
        label: 'Attended',
        icon: 'check_circle',
        badgeBg: 'bg-emerald-500/15',
        badgeText: 'text-emerald-700',
        badgeBorder: 'border-emerald-500/40',
        description: 'Completed session. Session count fulfilled.',
    },
    cancelled_late: {
        label: 'Late Cancel',
        icon: 'cancel',
        badgeBg: 'bg-danger/15',
        badgeText: 'text-danger',
        badgeBorder: 'border-danger/40',
        description: 'Cancelled last minute (<24h). Counts against package.',
    },
    cancelled_advance: {
        label: 'Cancelled (Advance)',
        icon: 'event_busy',
        badgeBg: 'bg-gray-100',
        badgeText: 'text-gray-600',
        badgeBorder: 'border-gray-300',
        description: 'Cancelled in advance. Session credited back.',
    },
    carry_over: {
        label: 'Carry Over',
        icon: 'autorenew',
        badgeBg: 'bg-amber-500/15',
        badgeText: 'text-amber-800',
        badgeBorder: 'border-amber-500/40',
        description: 'Rescheduled / session credit carried over to next period.',
    },
};

const AttendanceModal: React.FC<AttendanceModalProps> = ({ session, onClose }) => {
    const { clients, updateSessionStatus, removeSession } = useData();
    const [notes, setNotes] = useState('');

    React.useEffect(() => {
        if (session) {
            setNotes(session.notes || '');
        }
    }, [session]);

    if (!session) return null;

    const client = clients.find(c => c.id === session.clientId);
    const currentStatus = session.status || 'scheduled';

    const handleSelectStatus = (status: SessionAttendanceStatus) => {
        updateSessionStatus(session.id, status, notes);
        onClose();
    };

    const handleSaveNotes = () => {
        updateSessionStatus(session.id, currentStatus, notes);
        onClose();
    };

    return (
        <div className="fixed inset-0 z-50 bg-ink/70 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="w-full max-w-sm bg-white rounded-3xl border-2 border-ink p-5 space-y-4 shadow-2xl animate-fadeIn max-h-[90vh] overflow-y-auto">
                <div className="flex items-center justify-between border-b pb-3 border-border-light">
                    <div>
                        <span className="text-[10px] font-bold uppercase tracking-widest text-text-muted">Attendance Status</span>
                        <h3 className="font-display text-lg tracking-wide text-ink">{client?.name || 'Client Session'}</h3>
                        <p className="text-xs text-text-muted font-mono">{session.date} • {session.time} ({session.sessionType})</p>
                    </div>
                    <button onClick={onClose} className="text-text-muted hover:text-ink">
                        <Icon name="close" />
                    </button>
                </div>

                {/* Status Selection Buttons */}
                <div className="space-y-2">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-text-muted mb-1">Select Attendance Action</p>

                    {(['attended', 'cancelled_late', 'carry_over', 'cancelled_advance', 'scheduled'] as SessionAttendanceStatus[]).map(st => {
                        const cfg = ATTENDANCE_CONFIG[st];
                        const isSelected = currentStatus === st;
                        return (
                            <button
                                key={st}
                                onClick={() => handleSelectStatus(st)}
                                className={`w-full flex items-center justify-between p-3 rounded-2xl border-2 text-left transition-all ${
                                    isSelected
                                        ? `${cfg.badgeBg} ${cfg.badgeBorder} border-2`
                                        : 'border-border-light bg-background hover:bg-white hover:border-ink'
                                }`}
                            >
                                <div className="flex items-center gap-3">
                                    <div className={`size-8 rounded-full flex items-center justify-center ${cfg.badgeBg} ${cfg.badgeText}`}>
                                        <Icon name={cfg.icon} className="text-[18px]" />
                                    </div>
                                    <div>
                                        <p className="font-bold text-xs text-ink">{cfg.label}</p>
                                        <p className="text-[10px] text-text-muted">{cfg.description}</p>
                                    </div>
                                </div>
                                {isSelected && (
                                    <span className="text-xs font-bold text-ink flex items-center gap-1">
                                        <Icon name="check" className="text-[16px] text-emerald-600" />
                                    </span>
                                )}
                            </button>
                        );
                    })}
                </div>

                {/* Optional Session Notes */}
                <div className="space-y-1.5 pt-2 border-t border-border-light">
                    <label className="block text-[10px] font-bold uppercase tracking-widest text-text-muted">
                        Trainer Notes (Optional)
                    </label>
                    <textarea
                        rows={2}
                        value={notes}
                        onChange={e => setNotes(e.target.value)}
                        placeholder="e.g. Client requested carry-over due to work trip..."
                        className="w-full rounded-xl bg-background border-2 border-border-light p-2.5 text-xs font-medium focus:border-primary outline-none"
                    />
                </div>

                {/* Footer Buttons */}
                <div className="flex gap-2 pt-2">
                    <button
                        onClick={handleSaveNotes}
                        className="flex-1 rounded-xl bg-ink text-white font-bold uppercase text-xs tracking-wider py-3 hover:bg-black transition-colors"
                    >
                        Save & Close
                    </button>
                    <button
                        onClick={() => {
                            removeSession(session.id);
                            onClose();
                        }}
                        className="rounded-xl border-2 border-danger text-danger font-bold uppercase text-xs px-3 hover:bg-danger/10 transition-colors"
                    >
                        Delete
                    </button>
                </div>
            </div>
        </div>
    );
};

export default AttendanceModal;
