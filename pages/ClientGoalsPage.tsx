
import React, { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import Icon from '../components/Icon';
import { useData } from '../context/DataContext';
import { MetricType, ActiveGoal } from '../types';

const templates = ['Weight Loss', 'Hypertrophy', 'Endurance', 'Flexibility', 'Strength Max', 'Fat Loss %', 'Joint Mobility', 'Cardio Fitness'];
const templateIcons: { [key: string]: string } = {
    'Weight Loss': 'monitor_weight',
    'Hypertrophy': 'fitness_center',
    'Endurance': 'directions_run',
    'Flexibility': 'self_improvement',
    'Strength Max': 'sports_gymnastics',
    'Fat Loss %': 'percent',
    'Joint Mobility': 'accessibility_new',
    'Cardio Fitness': 'favorite',
};
const templateDefaults: { [key: string]: MetricType } = {
    'Weight Loss': MetricType.Weight,
    'Hypertrophy': MetricType.Weight,
    'Endurance': MetricType.Dist,
    'Flexibility': MetricType.Time,
    'Strength Max': MetricType.Weight,
    'Fat Loss %': MetricType.BodyPercent,
    'Joint Mobility': MetricType.Time,
    'Cardio Fitness': MetricType.Time,
};

const metricTypes = [
    { type: MetricType.Weight, icon: 'fitness_center', unit: 'lbs' },
    { type: MetricType.Dist, icon: 'straighten', unit: 'mi' },
    { type: MetricType.Time, icon: 'timer', unit: 'min' },
    { type: MetricType.BodyPercent, icon: 'percent', unit: '%' }
];

const emptyDraft = { title: '', metric: MetricType.Weight, current: '', target: '', date: '' };

const ClientGoalsPage: React.FC = () => {
    const navigate = useNavigate();
    const { clientId } = useParams<{ clientId: string }>();
    const { clients, getClientGoals, addGoal, updateGoal, deleteGoal } = useData();
    const client = clients.find(c => c.id === clientId);
    const goals = clientId ? getClientGoals(clientId) : [];

    const [draft, setDraft] = useState(emptyDraft);
    const [editingGoal, setEditingGoal] = useState<ActiveGoal | null>(null);

    const selectedUnit = metricTypes.find(m => m.type === draft.metric)?.unit || 'lbs';

    const applyTemplate = (template: string) => {
        setDraft(d => ({ ...d, title: template, metric: templateDefaults[template] }));
    };

    const draftIsValid = draft.title.trim() && draft.current.trim() && draft.target.trim();

    const commitDraft = (): boolean => {
        if (!draftIsValid || !clientId) return false;
        const currentNum = parseFloat(draft.current) || 0;
        const targetNum = parseFloat(draft.target) || 1;
        const progressPct = Math.min(100, Math.max(0, Math.round((currentNum / targetNum) * 100)));

        const goal: Omit<ActiveGoal, 'id'> = {
            clientId,
            icon: metricTypes.find(m => m.type === draft.metric)?.icon || 'flag',
            iconBg: 'bg-primary-soft',
            iconColor: 'text-primary',
            title: draft.title.trim(),
            description: draft.date ? `${draft.metric} • Target: ${draft.date}` : draft.metric,
            progress: progressPct,
            currentValue: draft.current,
            targetValue: `${draft.target} ${selectedUnit}`,
            progressLabel: `${progressPct}%`,
            progressColor: progressPct >= 100 ? 'bg-signal' : 'bg-primary',
        };
        addGoal(goal);
        return true;
    };

    const handleAddAnother = () => {
        if (commitDraft()) setDraft(emptyDraft);
    };

    const handleSave = () => {
        commitDraft();
        navigate(clientId ? `/clients/${clientId}/goals` : '/clients');
    };

    const handleSaveEditingGoal = () => {
        if (!editingGoal) return;
        const currentNum = parseFloat(editingGoal.currentValue) || 0;
        // Parse target numerical part
        const targetNumStr = editingGoal.targetValue.replace(/[^0-9.]/g, '');
        const targetNum = parseFloat(targetNumStr) || 1;
        const progressPct = Math.min(100, Math.max(0, Math.round((currentNum / targetNum) * 100)));

        updateGoal(editingGoal.id, {
            title: editingGoal.title,
            currentValue: editingGoal.currentValue,
            targetValue: editingGoal.targetValue,
            progress: progressPct,
            progressLabel: `${progressPct}%`,
            progressColor: progressPct >= 100 ? 'bg-signal' : 'bg-primary',
        });
        setEditingGoal(null);
    };

    const handleDeleteEditingGoal = () => {
        if (!editingGoal) return;
        deleteGoal(editingGoal.id);
        setEditingGoal(null);
    };

    if (!client) {
        return (
            <div className="flex min-h-screen flex-col items-center justify-center bg-background p-8 text-center">
                <Icon name="person_off" className="text-5xl text-text-muted mb-4" />
                <h2 className="font-display text-xl tracking-wide">CLIENT NOT FOUND</h2>
                <button onClick={() => navigate('/clients')} className="mt-4 text-primary font-bold uppercase text-sm tracking-wide">Back to Clients</button>
            </div>
        );
    }

    return (
        <div className="relative flex min-h-screen w-full flex-col overflow-x-hidden bg-background font-inter text-text-main">
            <div className="sticky top-0 z-50 flex items-center bg-ink p-4 pb-3 justify-between">
                <button onClick={() => navigate(-1)} className="flex size-10 items-center justify-start text-white cursor-pointer">
                    <Icon name="arrow_back" className="text-2xl" />
                </button>
                <h2 className="font-display text-lg tracking-wide text-white flex-1 text-center">SET CLIENT GOALS</h2>
                <button onClick={() => navigate('/clients')} className="flex w-10 items-center justify-end cursor-pointer">
                    <p className="text-white/60 text-sm font-bold uppercase shrink-0">Cancel</p>
                </button>
            </div>

            <main className="flex-1 pb-32">
                <div className="p-4">
                    <div className="flex gap-4 items-center">
                        <div className="flex items-center justify-center rounded-full h-20 w-20 bg-ink text-volt font-display text-3xl ring-4 ring-volt ring-offset-2 ring-offset-background">
                            {client.name.charAt(0)}
                        </div>
                        <div className="flex flex-col justify-center">
                            <p className="font-display text-xl tracking-wide">{client.name.toUpperCase()}</p>
                            <div className="flex items-center gap-1.5 mt-1">
                                <Icon name="check_circle" className="text-signal text-base" />
                                <p className="text-text-muted text-sm font-bold">{client.status}</p>
                                <span className="text-gray-300 mx-1">•</span>
                                <p className="text-text-muted text-sm font-bold">{goals.length} Active Goal{goals.length === 1 ? '' : 's'}</p>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="flex flex-col gap-3 my-4">
                    <h3 className="font-display text-lg tracking-wide px-4 text-left">QUICK TEMPLATES</h3>
                    <div 
                        className="w-full overflow-x-auto flex gap-3 px-4 pb-2 shrink-0 touch-pan-x"
                        style={{ scrollbarWidth: 'none', WebkitOverflowScrolling: 'touch' }}
                    >
                        {templates.map(template => (
                            <button 
                                key={template} 
                                onClick={() => applyTemplate(template)} 
                                className={`flex h-10 shrink-0 items-center justify-center gap-x-2 rounded-full bg-white border-2 px-4 active:scale-95 transition-all shadow-sm ${
                                    draft.title === template ? 'border-primary bg-primary-soft text-primary' : 'border-ink text-ink hover:bg-background'
                                }`}
                            >
                                <Icon name={templateIcons[template] || 'flag'} className="text-primary text-[18px]" />
                                <p className="text-sm font-bold whitespace-nowrap">{template}</p>
                            </button>
                        ))}
                    </div>
                </div>

                {goals.length > 0 && (
                    <div className="flex flex-col gap-4 mt-4">
                        <div className="flex items-center justify-between px-4">
                            <h3 className="font-display text-xl tracking-wide">ACTIVE GOALS</h3>
                            <span className="text-xs text-text-muted font-bold">Click goal to edit</span>
                        </div>
                        <div className="flex flex-col gap-3 px-4">
                            {goals.map((goal) => (
                                <div 
                                    key={goal.id} 
                                    onClick={() => setEditingGoal(goal)}
                                    className="bg-white rounded-2xl p-4 border-2 border-ink hover:border-primary hover:shadow-md transition-all cursor-pointer group relative"
                                >
                                    <div className="flex justify-between items-start mb-3">
                                        <div className="flex items-center gap-3">
                                            <div className={`size-10 rounded-lg flex items-center justify-center ${goal.iconBg} ${goal.iconColor}`}>
                                                <Icon name={goal.icon} />
                                            </div>
                                            <div>
                                                <h4 className="font-bold text-base text-ink group-hover:text-primary transition-colors flex items-center gap-2">
                                                    {goal.title}
                                                    <Icon name="edit" className="text-text-muted text-sm opacity-0 group-hover:opacity-100 transition-opacity" />
                                                </h4>
                                                <p className="text-xs text-text-muted">{goal.description}</p>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex items-end justify-between mb-2">
                                        <div className="flex flex-col">
                                            <span className="text-text-muted text-[10px] font-bold uppercase tracking-widest">Progress</span>
                                            <div className="flex items-baseline gap-1">
                                                <span className="text-xl font-bold font-mono text-ink">{goal.currentValue}</span>
                                                <span className="text-sm text-text-muted font-mono">/ {goal.targetValue}</span>
                                            </div>
                                        </div>
                                        <span className={`text-sm font-bold px-2 py-1 rounded-full ${goal.iconBg} ${goal.iconColor}`}>
                                            {goal.progressLabel}
                                        </span>
                                    </div>
                                    <div className="w-full bg-background h-2 rounded-full overflow-hidden border border-border-light">
                                        <div className={`${goal.progressColor} h-full rounded-full transition-all duration-300`} style={{ width: `${goal.progress}%` }}></div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                <div className="flex flex-col gap-4 mt-8 px-4">
                    <h3 className="font-display text-xl tracking-wide">ADD NEW GOAL</h3>
                    <div className="bg-white rounded-2xl p-5 border-2 border-ink">
                        <div className="mb-5">
                            <label className="block text-text-muted text-xs font-bold uppercase tracking-widest mb-2">Goal Title</label>
                            <input
                                value={draft.title}
                                onChange={e => setDraft(d => ({ ...d, title: e.target.value }))}
                                className="w-full bg-background border-2 border-border-light rounded-xl px-4 py-3 placeholder-text-muted/60 focus:outline-none focus:border-primary transition-all text-ink font-semibold"
                                placeholder="e.g. Run a 5k Marathon"
                                type="text"
                            />
                        </div>
                        <div className="mb-5">
                            <label className="block text-text-muted text-xs font-bold uppercase tracking-widest mb-2">Metric Type</label>
                            <div className="grid grid-cols-4 gap-2">
                                {metricTypes.map(({ type, icon }) => (
                                    <label key={type} className="cursor-pointer group">
                                        <input
                                            type="radio"
                                            name="metric_type"
                                            className="peer sr-only"
                                            checked={draft.metric === type}
                                            onChange={() => setDraft(d => ({ ...d, metric: type }))}
                                        />
                                        <div className="flex flex-col items-center justify-center p-2 rounded-lg border-2 border-border-light bg-background peer-checked:border-primary peer-checked:bg-primary-soft transition-all h-20">
                                            <Icon name={icon} className="text-text-muted peer-checked:text-primary mb-1" />
                                            <span className="text-[10px] text-text-muted peer-checked:text-primary font-bold uppercase tracking-wide">{type}</span>
                                        </div>
                                    </label>
                                ))}
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4 mb-5">
                            <div>
                                <label className="block text-text-muted text-xs font-bold uppercase tracking-widest mb-2">Current</label>
                                <div className="relative">
                                    <input
                                        value={draft.current}
                                        onChange={e => setDraft(d => ({ ...d, current: e.target.value }))}
                                        className="w-full bg-background border-2 border-border-light rounded-xl px-4 py-3 placeholder-text-muted/60 focus:outline-none focus:border-primary transition-all font-mono"
                                        placeholder="0" type="number"
                                    />
                                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-text-muted text-sm font-bold">{selectedUnit}</span>
                                </div>
                            </div>
                            <div>
                                <label className="block text-text-muted text-xs font-bold uppercase tracking-widest mb-2">Target</label>
                                <div className="relative">
                                    <input
                                        value={draft.target}
                                        onChange={e => setDraft(d => ({ ...d, target: e.target.value }))}
                                        className="w-full bg-background border-2 border-border-light rounded-xl px-4 py-3 placeholder-text-muted/60 focus:outline-none focus:border-primary transition-all font-mono"
                                        placeholder="0" type="number"
                                    />
                                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-text-muted text-sm font-bold">{selectedUnit}</span>
                                </div>
                            </div>
                        </div>
                        <div>
                            <label className="block text-text-muted text-xs font-bold uppercase tracking-widest mb-2">Target Completion Date</label>
                            <input
                                value={draft.date}
                                onChange={e => setDraft(d => ({ ...d, date: e.target.value }))}
                                className="w-full bg-background border-2 border-border-light rounded-xl px-4 py-3 placeholder-text-muted/60 focus:outline-none focus:border-primary transition-all"
                                type="date"
                            />
                        </div>
                    </div>
                    <button
                        onClick={handleAddAnother}
                        disabled={!draftIsValid}
                        className="flex w-full items-center justify-center gap-2 rounded-xl border-2 border-dashed border-ink p-4 text-text-muted hover:bg-primary-soft hover:text-primary hover:border-primary transition-colors disabled:opacity-40 disabled:hover:bg-transparent disabled:hover:text-text-muted disabled:hover:border-ink cursor-pointer"
                    >
                        <Icon name="add" />
                        <span className="font-bold uppercase text-sm tracking-wide">Add Another Goal</span>
                    </button>
                </div>
            </main>

            {/* Edit Active Goal Modal */}
            {editingGoal && (
                <div className="fixed inset-0 z-50 bg-ink/70 backdrop-blur-sm flex items-center justify-center p-4">
                    <div className="w-full max-w-sm bg-white rounded-3xl border-2 border-ink p-5 space-y-4 shadow-2xl animate-fadeIn">
                        <div className="flex items-center justify-between border-b pb-3 border-border-light">
                            <div className="flex items-center gap-2.5">
                                <div className={`size-10 rounded-xl flex items-center justify-center ${editingGoal.iconBg} ${editingGoal.iconColor}`}>
                                    <Icon name={editingGoal.icon} />
                                </div>
                                <div>
                                    <h3 className="font-display text-base tracking-wide text-ink">EDIT GOAL</h3>
                                    <p className="text-[10px] text-text-muted font-bold uppercase">Update Progress & Target</p>
                                </div>
                            </div>
                            <button
                                onClick={() => setEditingGoal(null)}
                                className="size-8 flex items-center justify-center rounded-full hover:bg-background text-text-muted hover:text-ink"
                            >
                                <Icon name="close" />
                            </button>
                        </div>

                        <div className="space-y-3 pt-1">
                            <div>
                                <label className="block text-text-muted text-[10px] font-bold uppercase tracking-widest mb-1">Goal Title</label>
                                <input
                                    value={editingGoal.title}
                                    onChange={e => setEditingGoal({ ...editingGoal, title: e.target.value })}
                                    className="w-full bg-background border-2 border-border-light rounded-xl px-3.5 py-2.5 text-sm font-semibold text-ink focus:outline-none focus:border-primary"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-text-muted text-[10px] font-bold uppercase tracking-widest mb-1">Current Progress</label>
                                    <input
                                        value={editingGoal.currentValue}
                                        onChange={e => setEditingGoal({ ...editingGoal, currentValue: e.target.value })}
                                        className="w-full bg-background border-2 border-border-light rounded-xl px-3.5 py-2.5 text-sm font-mono font-bold text-ink focus:outline-none focus:border-primary"
                                    />
                                </div>
                                <div>
                                    <label className="block text-text-muted text-[10px] font-bold uppercase tracking-widest mb-1">Target Value</label>
                                    <input
                                        value={editingGoal.targetValue}
                                        onChange={e => setEditingGoal({ ...editingGoal, targetValue: e.target.value })}
                                        className="w-full bg-background border-2 border-border-light rounded-xl px-3.5 py-2.5 text-sm font-mono font-bold text-ink focus:outline-none focus:border-primary"
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="flex gap-2 pt-2 border-t border-border-light">
                            <button
                                onClick={handleDeleteEditingGoal}
                                className="px-3 py-2.5 rounded-xl border-2 border-danger text-danger hover:bg-danger/10 font-bold text-xs uppercase flex items-center gap-1.5 transition-colors cursor-pointer"
                            >
                                <Icon name="delete" className="text-base" />
                                <span>Delete</span>
                            </button>
                            <button
                                onClick={handleSaveEditingGoal}
                                className="flex-1 bg-primary hover:bg-primary-hover text-white rounded-xl py-2.5 border-2 border-ink font-bold text-xs uppercase tracking-wide flex items-center justify-center gap-1.5 transition-all shadow-sm active:scale-95 cursor-pointer"
                            >
                                <Icon name="check" className="text-base" />
                                <span>Update Goal</span>
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <div className="fixed bottom-0 left-0 w-full p-4 bg-gradient-to-t from-background via-background to-transparent z-40 pb-6 pt-12 pointer-events-none">
                <button
                    onClick={handleSave}
                    disabled={!draftIsValid && goals.length === 0}
                    className="pointer-events-auto w-full max-w-md mx-auto bg-primary hover:bg-primary-hover text-white text-base font-bold uppercase tracking-wide rounded-full py-4 border-2 border-ink shadow-pop active:translate-y-1.5 active:shadow-none transition-all flex items-center justify-center gap-2 disabled:opacity-40 cursor-pointer"
                >
                    <Icon name="save" />
                    Save Goals
                </button>
            </div>
        </div>
    );
};

export default ClientGoalsPage;
