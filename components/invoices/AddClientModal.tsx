import React from 'react';
import Modal from '../Modal';

interface AddClientModalProps {
    open: boolean;
    onClose: () => void;
    newClientName: string;
    setNewClientName: (name: string) => void;
    newClientEmail: string;
    setNewClientEmail: (email: string) => void;
    newClientPhone: string;
    setNewClientPhone: (phone: string) => void;
    handleCreateClient: () => void;
}

export const AddClientModal: React.FC<AddClientModalProps> = ({
    open,
    onClose,
    newClientName,
    setNewClientName,
    newClientEmail,
    setNewClientEmail,
    newClientPhone,
    setNewClientPhone,
    handleCreateClient
}) => {
    return (
        <Modal open={open} onClose={onClose}>
            <div className="p-5 space-y-4">
                <div className="flex items-center justify-between border-b-2 border-ink pb-3 mb-2">
                    <h3 className="font-display text-lg tracking-wide text-ink">NEW CLIENT</h3>
                </div>
                <div className="space-y-3 text-xs">
                    <div>
                        <label className="block text-[10px] font-bold text-text-muted uppercase mb-1">Full Name</label>
                        <input
                            value={newClientName}
                            onChange={e => setNewClientName(e.target.value)}
                            placeholder="Alex Morgan"
                            className="w-full rounded-xl bg-background border-2 border-border-light px-3 py-2 text-sm font-bold focus:border-primary focus:outline-none"
                        />
                    </div>
                    <div>
                        <label className="block text-[10px] font-bold text-text-muted uppercase mb-1">Email Address</label>
                        <input
                            type="email"
                            value={newClientEmail}
                            onChange={e => setNewClientEmail(e.target.value)}
                            placeholder="alex@example.com"
                            className="w-full rounded-xl bg-background border-2 border-border-light px-3 py-2 text-sm font-bold focus:border-primary focus:outline-none"
                        />
                    </div>
                    <div>
                        <label className="block text-[10px] font-bold text-text-muted uppercase mb-1">Phone Number (Optional)</label>
                        <input
                            type="tel"
                            value={newClientPhone}
                            onChange={e => setNewClientPhone(e.target.value)}
                            placeholder="(555) 123-4567"
                            className="w-full rounded-xl bg-background border-2 border-border-light px-3 py-2 text-sm font-bold focus:border-primary focus:outline-none"
                        />
                    </div>
                </div>
                <div className="flex gap-2 pt-2">
                    <button
                        onClick={handleCreateClient}
                        className="flex-1 rounded-xl bg-primary text-white font-bold uppercase text-xs py-3 hover:bg-primary-hover transition-colors"
                    >
                        Create Client
                    </button>
                    <button
                        onClick={onClose}
                        className="rounded-xl border-2 border-ink font-bold uppercase text-xs px-4 hover:bg-background transition-colors"
                    >
                        Cancel
                    </button>
                </div>
            </div>
        </Modal>
    );
};
