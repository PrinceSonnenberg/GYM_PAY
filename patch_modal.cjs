const fs = require('fs');
let code = fs.readFileSync('pages/SettingsPage.tsx', 'utf-8');

const oldModal = `            {/* Home Preferences Modal */}
            {activeModal === 'home' && (
                <div className="fixed inset-0 z-50 bg-ink/70 backdrop-blur-sm flex flex-col justify-end items-center">
                    <div className="w-full max-w-md bg-background rounded-t-3xl border-t-2 border-ink h-[85vh] flex flex-col shadow-pop animate-slideUp">
                        <div className="flex items-center justify-between border-b-2 border-ink p-5 bg-white rounded-t-3xl sticky top-0 z-10">
                            <div>
                                <h2 className="font-display text-xl text-ink">HOME SCREEN</h2>
                                <p className="text-xs text-text-muted">Toggle visibility of dashboard widgets</p>
                            </div>
                            <button onClick={() => setActiveModal(null)} className="flex items-center justify-center size-8 rounded-full border-2 border-ink hover:bg-black hover:text-white transition-colors">
                                <Icon name="close" className="text-[18px]" />
                            </button>
                        </div>
                        <div className="flex-1 overflow-y-auto p-5 space-y-3 pb-safe">`;

const newModal = `            {/* Home Preferences Modal */}
            {activeModal === 'home' && (
                <div className="fixed inset-0 z-50 bg-ink/70 backdrop-blur-sm flex items-center justify-center p-4">
                    <div className="w-full max-w-sm rounded-3xl bg-white border-2 border-ink overflow-hidden shadow-pop animate-slideUp flex flex-col max-h-[90vh]">
                        <div className="flex items-center justify-between border-b-2 border-ink p-5 bg-background">
                            <div>
                                <h2 className="font-display text-xl text-ink">HOME SCREEN</h2>
                                <p className="text-xs text-text-muted">Toggle visibility of widgets</p>
                            </div>
                            <button onClick={() => setActiveModal(null)} className="flex items-center justify-center size-8 rounded-full border-2 border-ink hover:bg-black hover:text-white transition-colors">
                                <Icon name="close" className="text-[18px]" />
                            </button>
                        </div>
                        <div className="p-5 overflow-y-auto space-y-3 pb-safe">`;

code = code.replace(oldModal, newModal);
fs.writeFileSync('pages/SettingsPage.tsx', code);
