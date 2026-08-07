import React, { useState } from 'react';
import Icon from '../Icon';
import Modal from '../Modal';
import { useData } from '../../context/DataContext';

export const ServicesSettingsModal: React.FC<{ open: boolean, onClose: () => void, onSuccess: (msg: string) => void }> = ({ open, onClose, onSuccess }) => {
    const { services, addServicePreset, updateServicePreset, deleteServicePreset } = useData();
    const [showAddServiceForm, setShowAddServiceForm] = useState(false);
    const [newServiceTitle, setNewServiceTitle] = useState('');
    const [newServiceRate, setNewServiceRate] = useState('');
    const [newServiceSessions, setNewServiceSessions] = useState(4);
    const [editingServiceId, setEditingServiceId] = useState<string | null>(null);

    return (
        <Modal open={open} onClose={onClose}>
            <div className="flex flex-col max-h-[90vh]">
                <div className="flex items-center justify-between border-b-2 border-ink p-5 bg-background">
                    <div>
                        <h2 className="font-display text-xl text-ink">SERVICE CATALOG</h2>
                        <p className="text-xs text-text-muted">Manage your default offerings</p>
                    </div>
                    <button onClick={onClose} className="flex items-center justify-center size-8 rounded-full border-2 border-ink hover:bg-black hover:text-white transition-colors">
                        <Icon name="close" className="text-[18px]" />
                    </button>
                </div>
                <div className="p-5 overflow-y-auto space-y-4 pb-safe">
                    {services.map(srv => (
                        <div key={srv.id} className="p-4 rounded-2xl border-2 border-border-light bg-background space-y-3">
                            <div className="flex justify-between items-start gap-2">
                                <div className="flex-1 min-w-0">
                                    <input
                                        value={srv.title}
                                        onChange={e => updateServicePreset(srv.id, { title: e.target.value })}
                                        className="w-full bg-transparent font-bold text-sm text-ink focus:outline-none border-b border-transparent focus:border-border-light truncate"
                                    />
                                    <input
                                        value={srv.details}
                                        onChange={e => updateServicePreset(srv.id, { details: e.target.value })}
                                        className="w-full bg-transparent text-xs text-text-muted focus:outline-none border-b border-transparent focus:border-border-light mt-0.5 truncate"
                                    />
                                </div>
                                <button
                                    onClick={() => {
                                        if (confirm(`Remove ${srv.title} from presets?`)) {
                                            deleteServicePreset(srv.id);
                                        }
                                    }}
                                    className="p-1.5 text-text-muted hover:text-danger transition-colors shrink-0"
                                >
                                    <Icon name="delete" className="text-[18px]" />
                                </button>
                            </div>

                            <div className="grid grid-cols-2 gap-3 pt-2 border-t border-border-light">
                                <div>
                                    <span className="block text-[9px] font-bold text-text-muted uppercase">Default Rate</span>
                                    <input
                                        type="number"
                                        value={srv.defaultRate}
                                        onChange={e => {
                                            const r = parseFloat(e.target.value) || 0;
                                            updateServicePreset(srv.id, { defaultRate: r });
                                        }}
                                        className="w-full rounded-lg border border-border-light px-2 py-1 font-mono font-bold text-xs bg-white"
                                    />
                                </div>
                                <div>
                                    <span className="block text-[9px] font-bold text-text-muted uppercase">Default Sessions</span>
                                    <input
                                        type="number"
                                        min="1"
                                        value={srv.defaultSessions}
                                        onChange={e => {
                                            const s = parseInt(e.target.value) || 1;
                                            updateServicePreset(srv.id, { defaultSessions: s });
                                        }}
                                        className="w-full rounded-lg border border-border-light px-2 py-1 font-mono font-bold text-xs bg-white text-center"
                                    />
                                </div>
                            </div>
                        </div>
                    ))}

                    {showAddServiceForm ? (
                        <div className="p-4 rounded-2xl border-2 border-primary bg-primary-soft/30 space-y-3">
                            <p className="text-xs font-bold uppercase tracking-wide text-primary">New Service Preset</p>
                            <div>
                                <label className="block text-[10px] font-bold text-text-muted uppercase mb-1">Service Title</label>
                                <input
                                    value={newServiceTitle}
                                    onChange={e => setNewServiceTitle(e.target.value)}
                                    placeholder="e.g. 10x Semi-Private Group Pack"
                                    className="w-full rounded-xl bg-white border border-border-light px-3 py-2 text-xs font-bold focus:outline-none"
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-2">
                                <div>
                                    <label className="block text-[10px] font-bold text-text-muted uppercase mb-1">Default Rate</label>
                                    <input
                                        type="number"
                                        value={newServiceRate}
                                        onChange={e => setNewServiceRate(e.target.value)}
                                        placeholder="75.00"
                                        className="w-full rounded-xl bg-white border border-border-light px-3 py-2 text-xs font-bold font-mono focus:outline-none"
                                    />
                                </div>
                                <div>
                                    <label className="block text-[10px] font-bold text-text-muted uppercase mb-1">Sessions</label>
                                    <input
                                        type="number"
                                        min="1"
                                        value={newServiceSessions}
                                        onChange={e => setNewServiceSessions(parseInt(e.target.value) || 1)}
                                        className="w-full rounded-xl bg-white border border-border-light px-3 py-2 text-xs font-bold font-mono text-center focus:outline-none"
                                    />
                                </div>
                            </div>
                            <div className="flex gap-2 pt-1">
                                <button
                                    onClick={() => {
                                        const rate = parseFloat(newServiceRate);
                                        if (!newServiceTitle.trim() || Number.isNaN(rate)) return;
                                        addServicePreset({
                                            title: newServiceTitle.trim(),
                                            category: 'Custom Service',
                                            details: 'Custom service added by user',
                                            defaultRate: rate,
                                            defaultSessions: newServiceSessions,
                                            icon: 'fitness_center',
                                            iconBg: 'bg-primary-soft',
                                            iconColor: 'text-primary',
                                        });
                                        setNewServiceTitle('');
                                        setNewServiceRate('');
                                        setNewServiceSessions(4);
                                        setShowAddServiceForm(false);
                                        onSuccess('New service preset added');
                                    }}
                                    className="flex-1 rounded-xl bg-primary text-white font-bold uppercase text-xs py-2.5"
                                >
                                    Save Service
                                </button>
                                <button
                                    onClick={() => setShowAddServiceForm(false)}
                                    className="rounded-xl border border-ink font-bold uppercase text-xs px-3"
                                >
                                    Cancel
                                </button>
                            </div>
                        </div>
                    ) : (
                        <button
                            onClick={() => setShowAddServiceForm(true)}
                            className="w-full rounded-2xl border-2 border-dashed border-ink py-3 text-xs font-bold uppercase tracking-wider text-ink hover:bg-background transition-colors flex items-center justify-center gap-1.5"
                        >
                            <Icon name="add_circle" className="text-[18px]" />
                            <span>Add New Default Service</span>
                        </button>
                    )}
                </div>
                <div className="pt-2 border-t border-border-light bg-background p-5">
                    <button
                        onClick={() => {
                            onSuccess('Services catalog saved');
                            onClose();
                        }}
                        className="w-full rounded-xl bg-ink text-white font-bold uppercase text-xs tracking-wide py-3 hover:bg-black transition-colors"
                    >
                        Done
                    </button>
                </div>
            </div>
        </Modal>
    );
};
