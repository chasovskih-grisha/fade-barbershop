import React, { useState } from 'react';

export interface CustomerProfilePreferencesProps {
  initialName?: string;
  initialEmail?: string;
  initialPhone?: string;
  initialSmsNotifications?: boolean;
  initialEmailNotifications?: boolean;
  initialFavoriteBarber?: string;
  onSave?: (profile: {
    name: string;
    email: string;
    phone: string;
    smsNotifications: boolean;
    emailNotifications: boolean;
    favoriteBarber: string;
  }) => void;
  className?: string;
  ariaLabel?: string;
}

export const CustomerProfilePreferences: React.FC<CustomerProfilePreferencesProps> = ({
  initialName = 'Alex Morgan',
  initialEmail = 'alex.morgan@example.com',
  initialPhone = '+1 (555) 234-5678',
  initialSmsNotifications = true,
  initialEmailNotifications = false,
  initialFavoriteBarber = 'Marcus Vance',
  onSave,
  className = '',
  ariaLabel = 'FADE Customer Profile & Preferences Management'
}) => {
  const [name, setName] = useState(initialName);
  const [email, setEmail] = useState(initialEmail);
  const [phone, setPhone] = useState(initialPhone);
  const [smsNotifications, setSmsNotifications] = useState(initialSmsNotifications);
  const [emailNotifications, setEmailNotifications] = useState(initialEmailNotifications);
  const [favoriteBarber, setFavoriteBarber] = useState(initialFavoriteBarber);
  const [saved, setSaved] = useState(false);

  const barbers = ['Marcus Vance', 'Elena Rostova', 'Jordan Lee', 'No Preference'];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSaved(true);
    onSave?.({
      name,
      email,
      phone,
      smsNotifications,
      emailNotifications,
      favoriteBarber
    });
    setTimeout(() => setSaved(false), 3000);
  };

  return (
    <div
      role="region"
      aria-label={ariaLabel}
      className={`max-w-2xl mx-auto bg-white border border-zinc-200/90 rounded-3xl shadow-2xl overflow-hidden font-sans backdrop-blur-md transition-all ${className}`}
    >
      <div className="bg-gradient-to-r from-zinc-950 via-zinc-900 to-zinc-900 text-white px-8 py-6 flex items-center justify-between border-b border-zinc-800/80 shadow-inner">
        <div>
          <div className="flex items-center gap-2.5 mb-1">
            <span className="inline-block w-2.5 h-2.5 rounded-full bg-emerald-400 shadow-sm shadow-emerald-400/50" aria-hidden="true"></span>
            <h2 className="text-base font-bold tracking-tight text-zinc-100">FADE Studio — Client Profile & Preferences</h2>
          </div>
          <p className="text-xs text-zinc-400 font-medium tracking-wide">Manage your personal information, notification settings, and barber preference.</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="p-8 bg-gradient-to-b from-white via-zinc-50/30 to-white space-y-6">
        {saved && (
          <div className="bg-emerald-50 border border-emerald-200 p-4 rounded-2xl text-xs text-emerald-800 flex items-center gap-3 shadow-xs animate-in fade-in duration-200" role="status">
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-emerald-600 text-white font-bold text-xs">✓</span>
            <div>
              <p className="font-bold">Preferences Saved Successfully!</p>
              <p className="text-emerald-700/90 mt-0.5">Your updates have been securely synchronized with your FADE account.</p>
            </div>
          </div>
        )}

        <div className="space-y-4">
          <h3 className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Personal Information</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-zinc-700 mb-1.5">Full Name</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-3.5 py-2.5 border border-zinc-300 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-zinc-900 shadow-2xs font-medium bg-white"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-zinc-700 mb-1.5">Email Address</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-3.5 py-2.5 border border-zinc-300 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-zinc-900 shadow-2xs font-medium bg-white"
                required
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-xs font-semibold text-zinc-700 mb-1.5">Phone Number (for SMS reminders)</label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full px-3.5 py-2.5 border border-zinc-300 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-zinc-900 shadow-2xs font-medium bg-white"
                required
              />
            </div>
          </div>
        </div>

        <div className="space-y-4 pt-4 border-t border-zinc-200/80">
          <h3 className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Studio Preferences</h3>
          <div>
            <label className="block text-xs font-semibold text-zinc-700 mb-1.5">Preferred Barber</label>
            <select
              value={favoriteBarber}
              onChange={(e) => setFavoriteBarber(e.target.value)}
              className="w-full px-3.5 py-2.5 border border-zinc-300 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-zinc-900 shadow-2xs font-medium bg-white cursor-pointer"
            >
              {barbers.map((b) => (
                <option key={b} value={b}>{b}</option>
              ))}
            </select>
            <p className="text-[11px] text-zinc-500 mt-1">We prioritize scheduling your favorite barber when available.</p>
          </div>
        </div>

        <div className="space-y-4 pt-4 border-t border-zinc-200/80">
          <h3 className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Notification Channels</h3>
          <div className="space-y-3">
            <label className="flex items-center justify-between p-3.5 bg-white border border-zinc-200 rounded-xl cursor-pointer hover:border-zinc-300 transition shadow-2xs">
              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  checked={smsNotifications}
                  onChange={(e) => setSmsNotifications(e.target.checked)}
                  className="h-4 w-4 rounded border-zinc-300 text-zinc-900 focus:ring-zinc-900 cursor-pointer"
                />
                <div>
                  <span className="block text-xs font-bold text-zinc-900">SMS Appointment Reminders</span>
                  <span className="block text-[11px] text-zinc-500">Receive text alerts 2 hours prior to your scheduled slot.</span>
                </div>
              </div>
              <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-md border border-emerald-100">Recommended</span>
            </label>

            <label className="flex items-center justify-between p-3.5 bg-white border border-zinc-200 rounded-xl cursor-pointer hover:border-zinc-300 transition shadow-2xs">
              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  checked={emailNotifications}
                  onChange={(e) => setEmailNotifications(e.target.checked)}
                  className="h-4 w-4 rounded border-zinc-300 text-zinc-900 focus:ring-zinc-900 cursor-pointer"
                />
                <div>
                  <span className="block text-xs font-bold text-zinc-900">Email Marketing & Special Offers</span>
                  <span className="block text-[11px] text-zinc-500">Receive early access to holiday slots and grooming tips.</span>
                </div>
              </div>
            </label>
          </div>
        </div>

        <div className="pt-6 border-t border-zinc-200/80 flex justify-end">
          <button
            type="submit"
            className="px-7 py-2.5 bg-zinc-900 text-white rounded-xl text-xs font-semibold hover:bg-zinc-800 transition shadow-md active:scale-[0.98] focus:outline-none focus:ring-2 focus:ring-zinc-900 focus:ring-offset-2"
          >
            Save Profile & Preferences
          </button>
        </div>
      </form>
    </div>
  );
};
