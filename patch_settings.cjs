const fs = require('fs');
let code = fs.readFileSync('pages/SettingsPage.tsx', 'utf-8');

const themeSection = `                {/* 2.5 Appearance */}
                <div>
                    <h3 className="text-xs font-bold text-text-muted uppercase tracking-widest px-1 mb-2">Appearance</h3>
                    <div className="rounded-2xl bg-white border-2 border-ink overflow-hidden shadow-sm">
                        <button
                            onClick={() => setActiveModal('theme')}
                            className="flex w-full items-center gap-4 p-4 text-left hover:bg-background/60 transition-colors"
                        >
                            <div className="flex size-10 items-center justify-center rounded-full bg-signal-soft text-signal">
                                <Icon name="palette" className="text-[20px]" />
                            </div>
                            <div className="flex-1">
                                <span className="block font-bold text-sm text-text-main">App Theme</span>
                                <span className="block text-xs text-text-muted capitalize">{settings.uiTheme?.preset || 'Energetic'} (Default)</span>
                            </div>
                            <Icon name="chevron_right" className="text-text-muted" />
                        </button>
                    </div>
                </div>

`;

code = code.replace(`                {/* 3. System & Data */}`, themeSection + `                {/* 3. System & Data */}`);

const themeModal = `            {/* Theme Modal */}
            {activeModal === 'theme' && (
                <div className="fixed inset-0 z-50 bg-ink/70 backdrop-blur-sm flex items-center justify-center p-4">
                    <div className="w-full max-w-sm rounded-3xl bg-white border-2 border-ink overflow-hidden shadow-pop animate-slideUp flex flex-col max-h-[90vh]">
                        <div className="flex items-center justify-between border-b-2 border-ink p-5 bg-background">
                            <h2 className="font-display text-xl text-ink">APP THEME</h2>
                            <button onClick={() => setActiveModal(null)} className="flex items-center justify-center size-8 rounded-full border-2 border-ink hover:bg-black hover:text-white transition-colors">
                                <Icon name="close" className="text-[18px]" />
                            </button>
                        </div>
                        <div className="p-5 overflow-y-auto space-y-4">
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
                                        setSuccessToast('Theme updated!');
                                        setTimeout(() => setSuccessToast(null), 3000);
                                    }}
                                    className={\`w-full text-left p-4 rounded-2xl border-2 \${settings.uiTheme?.preset === theme.id ? 'border-primary bg-primary-soft' : 'border-border-light bg-background hover:border-primary/50'}\`}
                                >
                                    <div className="flex justify-between items-center mb-1">
                                        <span className="font-bold text-sm text-ink">{theme.name}</span>
                                        <div className="flex -space-x-1">
                                            {theme.colors.map((c, i) => (
                                                <div key={i} className={\`size-4 rounded-full border border-ink \${c}\`}></div>
                                            ))}
                                        </div>
                                    </div>
                                    <p className="text-xs text-text-muted">{theme.desc}</p>
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            )}

`;

code = code.replace(`            {/* MODALS */}`, `            {/* MODALS */}\n` + themeModal);
fs.writeFileSync('pages/SettingsPage.tsx', code);
