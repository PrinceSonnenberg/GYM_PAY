import React, { useState, useEffect } from 'react';
import Icon from '../Icon';
import Modal from '../Modal';
import { useData } from '../../context/DataContext';

export const ProfileSettingsModal: React.FC<{ open: boolean, onClose: () => void, onSuccess: (msg: string) => void }> = ({ open, onClose, onSuccess }) => {
    const { settings, updateProfile } = useData();
    const [profileName, setProfileName] = useState(settings.profile.name);
    const [profileTitle, setProfileTitle] = useState(settings.profile.title);
    const [profileEmail, setProfileEmail] = useState(settings.profile.email);
    const [profilePhone, setProfilePhone] = useState(settings.profile.phone);
    const [profileBio, setProfileBio] = useState(settings.profile.bio);
    const [logoUrl, setLogoUrl] = useState(settings.profile.logoUrl || '');

    useEffect(() => {
        if (open) {
            setProfileName(settings.profile.name);
            setProfileTitle(settings.profile.title);
            setProfileEmail(settings.profile.email);
            setProfilePhone(settings.profile.phone);
            setProfileBio(settings.profile.bio);
            setLogoUrl(settings.profile.logoUrl || '');
        }
    }, [open, settings.profile]);

    const handleSaveProfile = () => {
        updateProfile({
            name: profileName,
            title: profileTitle,
            email: profileEmail,
            phone: profilePhone,
            bio: profileBio,
            logoUrl: logoUrl,
        });
        onClose();
        onSuccess('Profile & Business Logo updated');
    };

    return (
        <Modal open={open} onClose={onClose}>
            <div className="p-5 space-y-4 max-h-[90vh] overflow-y-auto">
                <div className="flex items-center justify-between border-b pb-3 border-border-light">
                    <h3 className="font-display text-lg tracking-wide text-ink">COACH PROFILE</h3>
                    <button onClick={onClose} className="text-text-muted hover:text-ink">
                        <Icon name="close" />
                    </button>
                </div>
                <div className="space-y-3 text-xs">
                    <div>
                        <label className="block text-text-muted text-[10px] font-bold uppercase tracking-widest mb-1">Full Name</label>
                        <input
                            value={profileName}
                            onChange={e => setProfileName(e.target.value)}
                            className="w-full rounded-xl bg-background border-2 border-border-light focus:border-primary focus:outline-none px-4 py-2.5 font-bold text-sm"
                        />
                    </div>
                    <div>
                        <label className="block text-text-muted text-[10px] font-bold uppercase tracking-widest mb-1">Professional Title</label>
                        <input
                            value={profileTitle}
                            onChange={e => setProfileTitle(e.target.value)}
                            className="w-full rounded-xl bg-background border-2 border-border-light focus:border-primary focus:outline-none px-4 py-2.5 font-bold text-sm"
                        />
                    </div>
                    <div>
                        <label className="block text-text-muted text-[10px] font-bold uppercase tracking-widest mb-1">Email Address</label>
                        <input
                            type="email"
                            value={profileEmail}
                            onChange={e => setProfileEmail(e.target.value)}
                            className="w-full rounded-xl bg-background border-2 border-border-light focus:border-primary focus:outline-none px-4 py-2.5 font-bold text-sm"
                        />
                    </div>
                    <div>
                        <label className="block text-text-muted text-[10px] font-bold uppercase tracking-widest mb-1">Phone Number</label>
                        <input
                            type="tel"
                            value={profilePhone}
                            onChange={e => setProfilePhone(e.target.value)}
                            className="w-full rounded-xl bg-background border-2 border-border-light focus:border-primary focus:outline-none px-4 py-2.5 font-bold text-sm"
                        />
                    </div>
                    <div>
                        <label className="block text-text-muted text-[10px] font-bold uppercase tracking-widest mb-1">Coach Bio / Motto</label>
                        <textarea
                            value={profileBio}
                            onChange={e => setProfileBio(e.target.value)}
                            rows={2}
                            className="w-full rounded-xl bg-background border-2 border-border-light focus:border-primary focus:outline-none px-4 py-2.5 font-medium text-xs resize-none"
                        />
                    </div>

                    {/* Business Logo Upload */}
                    <div className="pt-2 border-t border-border-light">
                        <label className="block text-text-muted text-[10px] font-bold uppercase tracking-widest mb-1.5 flex items-center gap-1">
                            <Icon name="business" className="text-primary text-[14px]" />
                            <span>Business Logo (Appears on Invoices)</span>
                        </label>
                        {logoUrl ? (
                            <div className="flex items-center justify-between p-2 rounded-xl bg-background border-2 border-ink">
                                <div className="flex items-center gap-2">
                                    <img src={logoUrl} alt="Logo" className="size-10 object-cover rounded-lg border border-ink" />
                                    <span className="text-xs font-bold text-emerald-700">Logo Uploaded</span>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => setLogoUrl('')}
                                    className="text-danger hover:text-danger/80 p-1 text-xs font-bold"
                                >
                                    Remove
                                </button>
                            </div>
                        ) : (
                            <label className="flex items-center justify-center gap-2 w-full h-11 rounded-xl bg-background border-2 border-dashed border-border-light hover:border-ink transition-colors cursor-pointer text-text-muted hover:text-ink">
                                <Icon name="add_photo_alternate" className="text-primary text-base" />
                                <span className="text-xs font-bold">Upload Business Logo Image</span>
                                <input
                                    type="file"
                                    accept="image/*"
                                    onChange={e => {
                                        const file = e.target.files?.[0];
                                        if (!file) return;
                                        const reader = new FileReader();
                                        reader.onloadend = () => setLogoUrl(reader.result as string);
                                        reader.readAsDataURL(file);
                                    }}
                                    className="hidden"
                                />
                            </label>
                        )}
                    </div>
                </div>
                <div className="flex gap-2 pt-2">
                    <button
                        onClick={handleSaveProfile}
                        className="flex-1 rounded-xl bg-primary text-white font-bold uppercase text-xs tracking-wide py-3 hover:bg-primary-hover transition-colors"
                    >
                        Save Changes
                    </button>
                    <button
                        onClick={onClose}
                        className="rounded-xl border-2 border-ink font-bold uppercase text-xs tracking-wide px-4 hover:bg-background transition-colors"
                    >
                        Cancel
                    </button>
                </div>
            </div>
        </Modal>
    );
};
