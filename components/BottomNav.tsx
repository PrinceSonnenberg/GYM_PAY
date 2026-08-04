
import React, { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import Icon from './Icon';

const NavItem: React.FC<{ to: string; icon: string; label: string }> = ({ to, icon, label }) => (
    <NavLink 
        to={to} 
        className={({ isActive }) => 
            `flex flex-col items-center gap-1 p-2 transition-colors ${isActive ? 'text-primary' : 'text-slate-400 hover:text-ink'}`
        }
    >
        <Icon name={icon} className="text-[24px]" />
        <span className="text-[10px] font-bold uppercase tracking-wide">{label}</span>
    </NavLink>
);

const BottomNav: React.FC = () => {
    const navigate = useNavigate();
    const [isOpen, setIsOpen] = useState(false);

    return (
        <>
            {/* Quick Action Overlay Sheet */}
            {isOpen && (
                <div 
                    className="fixed inset-0 z-50 bg-ink/70 backdrop-blur-sm flex items-end justify-center p-4 animate-fadeIn"
                    onClick={() => setIsOpen(false)}
                >
                    <div 
                        className="w-full max-w-sm bg-white rounded-3xl border-2 border-ink p-5 space-y-3 shadow-2xl mb-16 animate-slideUp"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="flex items-center justify-between border-b pb-2 border-border-light">
                            <div>
                                <h3 className="font-display text-base tracking-wide text-ink">CREATE NEW</h3>
                                <p className="text-[10px] text-text-muted font-bold uppercase">Select Item Type</p>
                            </div>
                            <button 
                                onClick={() => setIsOpen(false)}
                                className="size-8 flex items-center justify-center rounded-full text-text-muted hover:text-ink hover:bg-background"
                            >
                                <Icon name="close" className="text-[18px]" />
                            </button>
                        </div>

                        <div className="space-y-2 pt-1">
                            <button
                                onClick={() => {
                                    setIsOpen(false);
                                    navigate('/calendar?add=true');
                                }}
                                className="w-full flex items-center gap-3.5 p-3.5 rounded-2xl bg-background hover:bg-emerald-500/10 border-2 border-ink text-left transition-all group cursor-pointer"
                            >
                                <div className="flex size-11 items-center justify-center rounded-xl bg-signal text-white border-2 border-ink group-hover:scale-105 transition-transform shrink-0">
                                    <Icon name="event_available" className="text-[22px]" />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="font-bold text-sm text-ink group-hover:text-emerald-700 transition-colors">New Session</p>
                                    <p className="text-[11px] text-text-muted truncate">Book training session on calendar</p>
                                </div>
                                <Icon name="chevron_right" className="text-text-muted text-[18px] shrink-0" />
                            </button>

                            <button
                                onClick={() => {
                                    setIsOpen(false);
                                    navigate('/invoice');
                                }}
                                className="w-full flex items-center gap-3.5 p-3.5 rounded-2xl bg-background hover:bg-primary-soft border-2 border-ink text-left transition-all group cursor-pointer"
                            >
                                <div className="flex size-11 items-center justify-center rounded-xl bg-primary text-white border-2 border-ink group-hover:scale-105 transition-transform shrink-0">
                                    <Icon name="receipt_long" className="text-[22px]" />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="font-bold text-sm text-ink group-hover:text-primary transition-colors">New Invoice</p>
                                    <p className="text-[11px] text-text-muted truncate">Bill a client for sessions or packages</p>
                                </div>
                                <Icon name="chevron_right" className="text-text-muted text-[18px] shrink-0" />
                            </button>

                            <button
                                onClick={() => {
                                    setIsOpen(false);
                                    navigate('/clients?add=true');
                                }}
                                className="w-full flex items-center gap-3.5 p-3.5 rounded-2xl bg-background hover:bg-volt-soft border-2 border-ink text-left transition-all group cursor-pointer"
                            >
                                <div className="flex size-11 items-center justify-center rounded-xl bg-volt text-ink border-2 border-ink group-hover:scale-105 transition-transform shrink-0">
                                    <Icon name="person_add" className="text-[22px]" />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="font-bold text-sm text-ink transition-colors">New Client</p>
                                    <p className="text-[11px] text-text-muted truncate">Add a client to your roster</p>
                                </div>
                                <Icon name="chevron_right" className="text-text-muted text-[18px] shrink-0" />
                            </button>

                            <button
                                onClick={() => {
                                    setIsOpen(false);
                                    navigate('/expenses?add=true');
                                }}
                                className="w-full flex items-center gap-3.5 p-3.5 rounded-2xl bg-background hover:bg-danger-soft border-2 border-ink text-left transition-all group cursor-pointer"
                            >
                                <div className="flex size-11 items-center justify-center rounded-xl bg-ink text-volt border-2 border-ink group-hover:scale-105 transition-transform shrink-0">
                                    <Icon name="payments" className="text-[22px]" />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="font-bold text-sm text-ink group-hover:text-danger transition-colors">New Expense</p>
                                    <p className="text-[11px] text-text-muted truncate">Log business cost & receipt photo</p>
                                </div>
                                <Icon name="chevron_right" className="text-text-muted text-[18px] shrink-0" />
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <nav className="fixed bottom-0 z-40 w-full max-w-md border-t-2 border-ink bg-white/95 pb-safe pt-1.5 backdrop-blur-xl shadow-lg">
                <div className="grid grid-cols-5 items-center justify-items-center h-[58px] pb-1">
                    <NavItem to="/" icon="grid_view" label="Home" />
                    <NavItem to="/clients" icon="groups" label="Clients" />
                    <div className="relative -top-2 flex items-center justify-center">
                        <button 
                            onClick={() => setIsOpen(!isOpen)}
                            aria-label="Create new item options"
                            className={`flex size-12 items-center justify-center rounded-full border-2 border-ink shadow-md transition-all active:scale-95 ${
                                isOpen ? 'bg-ink text-volt rotate-45' : 'bg-primary text-white hover:bg-primary-hover'
                            }`}
                        >
                            <Icon name="add" className="text-[26px]" />
                        </button>
                    </div>
                    <NavItem to="/calendar" icon="calendar_month" label="Calendar" />
                    <NavItem to="/settings" icon="settings" label="Settings" />
                </div>
            </nav>
        </>
    );
};

export default BottomNav;
