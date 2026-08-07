import React from 'react';
import Icon from '../Icon';
import Modal from '../Modal';
import { auth } from '../../src/lib/firebase';
import { signOut } from 'firebase/auth';

export const LogoutModal: React.FC<{ open: boolean, onClose: () => void }> = ({ open, onClose }) => {
    return (
        <Modal open={open} onClose={onClose}>
            <div className="p-6 text-center space-y-4">
                <div className="size-16 rounded-full bg-danger-soft text-danger flex items-center justify-center mx-auto mb-2">
                    <Icon name="logout" className="text-[32px]" />
                </div>
                <h3 className="font-display text-xl text-ink">Sign Out</h3>
                <p className="text-sm text-text-muted">
                    Are you sure you want to sign out of GymPay? You will need to log back in to access your business data.
                </p>
                <div className="flex gap-3 pt-4">
                    <button
                        onClick={onClose}
                        className="flex-1 rounded-xl border-2 border-ink font-bold uppercase text-xs tracking-wide py-3 hover:bg-background transition-colors"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={() => {
                            if (auth) {
                                signOut(auth);
                            }
                        }}
                        className="flex-1 rounded-xl bg-danger text-white font-bold uppercase text-xs tracking-wide py-3 hover:bg-danger/90 transition-colors"
                    >
                        Sign Out
                    </button>
                </div>
            </div>
        </Modal>
    );
};
