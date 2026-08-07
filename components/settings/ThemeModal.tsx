import React from 'react';
import Icon from '../Icon';
import Modal from '../Modal';
import { useData } from '../../context/DataContext';

export const ThemeModal: React.FC<{ open: boolean, onClose: () => void, onSuccess: (msg: string) => void }> = ({ open, onClose, onSuccess }) => {
    const { settings, updateUiTheme } = useData();

    return (
        <Modal open={open} onClose={onClose}>
            <div className="flex items-center justify-between border-b-2 border-ink p-5 bg-background">
                <h2 className="font-display text-xl text-ink">APP THEME</h2>
                <button onClick={onClose} className="flex items-center justify-center size-8 rounded-full border-2 border-ink hover:bg-black hover:text-white transition-colors">
                    <Icon name="close" className="text-[18px]" />
                </button>
            </div>
            <div className="p-5 overflow-y-auto space-y-4 max-h-[70vh]">
                <p className="text-sm font-bold text-text-main mb-2">Select a visual theme:</p>
                {[
                    { id: 'energetic', name: 'Energetic (Default)', desc: 'Orange & Lime with Anton display font', colors: ['bg-[#FF4713]', 'bg-[#C8FF3D]'] },
                    { id: 'ocean', name: 'Ocean Clean', desc: 'Blue & Cyan with Oswald display font', colors: ['bg-[#0EA5E9]', 'bg-[#38BDF8]'] },
                    { id: 'sunset', name: 'Sunset Glow', desc: 'Rose & Amber with Righteous display font', colors: ['bg-[#E11D48]', 'bg-[#F59E0B]'] }
                ].map(theme => (
                    <button
                        key={theme.id}
                        onClick={() => {
                            // @ts-ignore
                            updateUiTheme({ preset: theme.id });
                            onSuccess('Theme updated!');
                            onClose();
                        }}
                        className={`w-full text-left p-4 rounded-2xl border-2 ${settings.uiTheme?.preset === theme.id ? 'border-primary bg-primary-soft' : 'border-border-light bg-background hover:border-primary/50'}`}
                    >
                        <div className="flex justify-between items-center mb-1">
                            <span className="font-bold text-sm text-ink">{theme.name}</span>
                            <div className="flex -space-x-1">
                                {theme.colors.map((c, i) => (
                                    <div key={i} className={`size-4 rounded-full border border-ink ${c}`}></div>
                                ))}
                            </div>
                        </div>
                        <p className="text-xs text-text-muted">{theme.desc}</p>
                    </button>
                ))}
            </div>
        </Modal>
    );
};
