import React from 'react';
import Icon from './Icon';
import { SessionAttendanceStatus } from '../types';
import { ATTENDANCE_CONFIG } from './AttendanceModal';

interface AttendanceBadgeProps {
    status?: SessionAttendanceStatus;
    onClick?: () => void;
    size?: 'sm' | 'md';
}

export const AttendanceBadge: React.FC<AttendanceBadgeProps> = ({ status = 'scheduled', onClick, size = 'sm' }) => {
    const config = ATTENDANCE_CONFIG[status] || ATTENDANCE_CONFIG.scheduled;

    return (
        <button
            type="button"
            onClick={onClick}
            className={`inline-flex items-center gap-1.5 rounded-full border font-bold uppercase transition-all shrink-0 ${
                config.badgeBg
            } ${config.badgeText} ${config.badgeBorder} ${
                size === 'sm' ? 'px-2.5 py-1 text-[10px]' : 'px-3 py-1.5 text-xs'
            } ${onClick ? 'hover:scale-105 active:scale-95 cursor-pointer shadow-sm' : ''}`}
        >
            <Icon name={config.icon} className={size === 'sm' ? 'text-[13px]' : 'text-[15px]'} />
            <span>{config.label}</span>
            {onClick && <Icon name="arrow_drop_down" className="text-[12px] -ml-0.5" />}
        </button>
    );
};

export default AttendanceBadge;
