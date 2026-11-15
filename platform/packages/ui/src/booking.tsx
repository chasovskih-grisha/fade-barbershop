import React, { useState } from 'react';

export interface CustomerBookingFlowProps {
  onCompleteBooking?: (details: { service: string; barber: string; date: string; time: string; extras: string[] }) => void;
  className?: string;
  ariaLabel?: string;
}

export const CustomerBookingFlow: React.FC<CustomerBookingFlowProps> = ({ 
  onCompleteBooking,
  className = '',
  ariaLabel = 'FADE Studio Appointment Booking Flow'
}) => {
  const [step, setStep] = useState<number>(1);
  const [selectedService, setSelectedService] = useState<{ id: string; name: string; price: number; duration: string } | null>(null);
  const [selectedBarber, setSelectedBarber] = useState<{ id: string; name: string; rating: number; role: string; avatarUrl?: string } | null>(null);
  const [selectedDate, setSelectedDate] = useState<string>('2026-11-18');
  const [selectedTime, setSelectedTime] = useState<string>('10:00 AM');
  const [selectedExtras, setSelectedExtras] = useState<string[]>([]);
  const [confirmed, setConfirmed] = useState<boolean>(false);

  const services = [
    { id: 'srv-1', name: 'Signature Fade & Beard Trim', price: 45, duration: '45 min' },
    { id: 'srv-2', name: 'Precision Haircut & Style', price: 35, duration: '30 min' },
    { id: 'srv-3', name: 'Hot Towel Royal Shave', price: 40, duration: '30 min' },
    { id: 'srv-4', name: 'Express Fade', price: 28, duration: '25 min' },
  ];

  const barbers = [
    { id: 'barb-1', name: 'Marcus Vance', rating: 4.9, role: 'Master Barber & Fade Specialist' },
    { id: 'barb-2', name: 'Elena Rostova', rating: 4.8, role: 'Senior Stylist & Beard Artist' },
    { id: 'barb-3', name: 'Jordan Lee', rating: 4.9, role: 'Creative Director' },
  ];

  const dates = ['2026-11-18', '2026-11-19', '2026-11-20', '2026-11-21'];
  const times = ['09:00 AM', '10:00 AM', '11:30 AM', '01:00 PM', '02:30 PM', '04:00 PM', '05:30 PM'];
  const extrasList = ['Charcoal Black Peel-Off Mask (+$15)', 'Scalp Massage Treatment (+$10)', 'Eyebrow Shaping (+$8)'];

  const toggleExtra = (item: string) => {
    setSelectedExtras(prev => 
      prev.includes(item) ? prev.filter(i => i !== item) : [...prev, item]
    );
  };

  const calculateTotal = () => {
    let base = selectedService ? selectedService.price : 0;
    const extrasTotal = selectedExtras.length * 12;
    return base + extrasTotal;
  };

  return (
    <div 
      role="region" 
      aria-label={ariaLabel}
      className={`max-w-3xl mx-auto bg-white border border-zinc-200/90 rounded-3xl shadow-2xl overflow-hidden font-sans backdrop-blur-md transition-all duration-300 ${className}`}
    >
      <div className="bg-gradient-to-r from-zinc-950 via-zinc-900 to-zinc-900 text-white px-8 py-6 flex items-center justify-between border-b border-zinc-800/80 shadow-inner">
        <div>
          <div className="flex items-center gap-2.5 mb-1">
            <span className="inline-block w-2.5 h-2.5 rounded-full bg-emerald-400 shadow-sm shadow-emerald-400/50 animate-pulse" aria-hidden="true"></span>
            <h2 className="text-base font-bold tracking-tight text-zinc-100" id="booking-flow-title">FADE Studio — Appointment Booking</h2>
          </div>
          <p className="text-xs text-zinc-300 font-medium tracking-wide" aria-live="polite">Step {step} of 4: {
            step === 1 ? 'Select Service' :
            step === 2 ? 'Choose Your Barber' :
            step === 3 ? 'Date, Time & Extras' : 'Review & Confirm'
          }</p>
        </div>
        <div className="flex gap-1.5" role="progressbar" aria-valuenow={step} aria-valuemin={1} aria-valuemax={4} aria-label={`Step ${step} of 4`}>
          {[1, 2, 3, 4].map((s) => (
            <span
              key={s}
              className={`h-2 rounded-full transition-all duration-300 ${
                step >= s ? 'bg-emerald-400 w-8 shadow-sm shadow-emerald-400/50' : 'bg-zinc-800 w-4'
              }`}
            />
          ))}
        </div>
      </div>

      <div className="p-8 bg-gradient-to-b from-white via-zinc-50/30 to-white">
        {confirmed ? (
          <div className="py-12 text-center space-y-6 animate-in fade-in zoom-in duration-300" role="status">
            <div className="inline-flex h-20 w-20 items-center justify-center rounded-full bg-emerald-50 text-emerald-700 text-3xl font-bold mb-1 shadow-inner border border-emerald-200/80 ring-8 ring-emerald-50/50" aria-hidden="true">
              ✓
            </div>
            <div>
              <h3 className="text-2xl font-extrabold text-zinc-900 tracking-tight">Appointment Confirmed!</h3>
              <p className="text-sm text-zinc-700 max-w-md mx-auto mt-2 leading-relaxed">
                Your booking with <span className="font-semibold text-zinc-900">{selectedBarber?.name}</span> for <span className="font-semibold text-zinc-900">{selectedService?.name}</span> on <span className="font-semibold text-zinc-900">{selectedDate} at {selectedTime}</span> has been successfully scheduled.
              </p>
            </div>
            <div className="bg-white border border-zinc-200/80 p-5 rounded-2xl max-w-sm mx-auto text-left text-xs space-y-2.5 shadow-md shadow-zinc-100">
              <div className="flex justify-between items-center"><span className="text-zinc-600 font-medium">Service Price:</span><span className="font-semibold text-zinc-900">${selectedService?.price}</span></div>
              <div className="flex justify-between items-center"><span className="text-zinc-600 font-medium">Optional Extras:</span><span className="font-semibold text-zinc-900">{selectedExtras.length} selected</span></div>
              <div className="border-t border-zinc-100 pt-2.5 flex justify-between items-center font-bold text-sm text-zinc-900"><span>Estimated Total:</span><span className="text-emerald-700 text-base font-extrabold">${calculateTotal()}</span></div>
            </div>
            <button
              type="button"
              onClick={() => {
                setStep(1);
                setConfirmed(false);
                setSelectedService(null);
                setSelectedBarber(null);
                setSelectedExtras([]);
              }}
              className="mt-4 px-7 py-3 bg-zinc-900 text-white rounded-xl text-xs font-semibold hover:bg-zinc-800 transition shadow-md hover:shadow-lg active:scale-[0.98] focus:outline-none focus:ring-2 focus:ring-zinc-900 focus:ring-offset-2"
            >
              Book Another Appointment
            </button>
          </div>
        ) : (
          <>
            {step === 1 && (
              <div className="space-y-4 animate-in fade-in duration-200" role="group" aria-label="Select a Service">
                <div className="flex items-center justify-between">
                  <h3 id="service-heading" className="text-xs font-bold text-zinc-700 uppercase tracking-wider">Select a Service</h3>
                  <span className="text-xs text-zinc-600 font-medium">Choose your preferred styling package</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4" role="radiogroup" aria-labelledby="service-heading">
                  {services.map((srv) => {
                    const isSelected = selectedService?.id === srv.id;
                    return (
                      <div
                        key={srv.id}
                        role="radio"
                        aria-checked={isSelected}
                        tabIndex={0}
                        aria-label={`${srv.name}, price ${srv.price} dollars, duration ${srv.duration}`}
                        onClick={() => setSelectedService(srv)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' || e.key === ' ') {
                            e.preventDefault();
                            setSelectedService(srv);
                          }
                        }}
                        className={`p-5 rounded-2xl border cursor-pointer transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-emerald-600 ${
                          isSelected
                            ? 'border-emerald-600 bg-emerald-50/60 shadow-lg shadow-emerald-600/10 ring-2 ring-emerald-600/20 scale-[1.01]'
                            : 'border-zinc-200/90 hover:border-zinc-300 hover:bg-white bg-white/80 shadow-xs hover:shadow-sm'
                        }`}
                      >
                        <div className="flex justify-between items-start mb-3">
                          <h4 className="font-bold text-sm text-zinc-900">{srv.name}</h4>
                          <span className="font-extrabold text-emerald-700 text-sm bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200 shadow-2xs">${srv.price}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-zinc-700 bg-zinc-100 px-3 py-1 rounded-full font-semibold">⏱ {srv.duration}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {step === 2 && (
              <div className="space-y-4 animate-in fade-in duration-200" role="group" aria-label="Choose Your Barber">
                <div className="flex items-center justify-between">
                  <h3 id="barber-heading" className="text-xs font-bold text-zinc-700 uppercase tracking-wider">Choose Your Barber</h3>
                  <span className="text-xs text-zinc-600 font-medium">Select expert professional</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4" role="radiogroup" aria-labelledby="barber-heading">
                  {barbers.map((barb) => {
                    const isSelected = selectedBarber?.id === barb.id;
                    return (
                      <div
                        key={barb.id}
                        role="radio"
                        aria-checked={isSelected}
                        tabIndex={0}
                        aria-label={`${barb.name}, ${barb.role}, rating ${barb.rating} out of 5`}
                        onClick={() => setSelectedBarber(barb)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' || e.key === ' ') {
                            e.preventDefault();
                            setSelectedBarber(barb);
                          }
                        }}
                        className={`p-5 rounded-2xl border cursor-pointer text-center transition-all duration-200 group focus:outline-none focus:ring-2 focus:ring-emerald-600 ${
                          isSelected
                            ? 'border-emerald-600 bg-emerald-50/60 shadow-lg shadow-emerald-600/10 ring-2 ring-emerald-600/20 scale-[1.01]'
                            : 'border-zinc-200/90 hover:border-zinc-300 hover:bg-white bg-white/80 shadow-xs hover:shadow-sm'
                        }`}
                      >
                        <div className="w-16 h-16 bg-gradient-to-tr from-zinc-950 via-zinc-900 to-zinc-800 text-white rounded-2xl flex items-center justify-center font-bold text-base mx-auto mb-3.5 shadow-md group-hover:scale-105 transition-transform" aria-hidden="true">
                          {barb.name.split(' ').map(n => n[0]).join('')}
                        </div>
                        <h4 className="font-bold text-sm text-zinc-900">{barb.name}</h4>
                        <p className="text-xs text-zinc-700 mt-1 line-clamp-1 font-medium">{barb.role}</p>
                        <div className="mt-4 inline-flex items-center gap-1 bg-amber-50 text-amber-900 border border-amber-300/80 px-3 py-1 rounded-full text-xs font-bold shadow-2xs">
                          ★ {barb.rating}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {step === 3 && (
              <div className="space-y-6 animate-in fade-in duration-200">
                <div>
                  <h3 id="date-time-heading" className="text-xs font-bold text-zinc-700 uppercase tracking-wider mb-3">Select Date & Time</h3>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 mb-3.5" role="group" aria-label="Select Date">
                    {dates.map((d) => (
                      <button
                        key={d}
                        type="button"
                        aria-pressed={selectedDate === d}
                        onClick={() => setSelectedDate(d)}
                        className={`py-3 px-3 rounded-xl border text-xs font-semibold transition-all shadow-xs focus:outline-none focus:ring-2 focus:ring-zinc-900 ${
                          selectedDate === d ? 'bg-zinc-900 text-white border-zinc-900 shadow-md ring-2 ring-zinc-900/20 scale-[1.02]' : 'bg-white text-zinc-800 border-zinc-200/90 hover:bg-zinc-50 hover:border-zinc-300'
                        }`}
                      >
                        {d}
                      </button>
                    ))}
                  </div>

                  <div className="grid grid-cols-3 sm:grid-cols-4 gap-2.5" role="group" aria-label="Select Time">
                    {times.map((t) => (
                      <button
                        key={t}
                        type="button"
                        aria-pressed={selectedTime === t}
                        onClick={() => setSelectedTime(t)}
                        className={`py-3 rounded-xl border text-xs font-semibold transition-all shadow-xs focus:outline-none focus:ring-2 focus:ring-emerald-600 ${
                          selectedTime === t ? 'bg-emerald-700 text-white border-emerald-700 shadow-md shadow-emerald-700/20 ring-2 ring-emerald-700/20 scale-[1.02]' : 'bg-white text-zinc-800 border-zinc-200/90 hover:bg-zinc-50 hover:border-zinc-300'
                        }`}
                      >
                        {t}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <h3 className="text-xs font-bold text-zinc-700 uppercase tracking-wider mb-3">Enhance Your Experience (Optional Extras)</h3>
                  <div className="space-y-2.5" role="group" aria-label="Enhancement Extras">
                    {extrasList.map((ext, idx) => {
                      const isChecked = selectedExtras.includes(ext);
                      return (
                        <label
                          key={idx}
                          className={`flex items-center justify-between p-4 rounded-2xl border cursor-pointer transition-all shadow-2xs ${
                            isChecked ? 'border-emerald-600 bg-emerald-50/60 ring-1 ring-emerald-600/20 shadow-xs' : 'border-zinc-200/90 bg-white hover:bg-zinc-50/80 hover:border-zinc-300'
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <input
                              type="checkbox"
                              checked={isChecked}
                              onChange={() => toggleExtra(ext)}
                              aria-label={`Optional extra: ${ext}`}
                              className="h-4 w-4 rounded border-zinc-400 text-emerald-700 focus:ring-emerald-600 cursor-pointer"
                            />
                            <span className="text-xs font-semibold text-zinc-900">{ext}</span>
                          </div>
                          <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-md border border-emerald-200">+$10-$15</span>
                        </label>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}

            {step === 4 && (
              <div className="space-y-4 animate-in fade-in duration-200">
                <h3 className="text-xs font-bold text-zinc-700 uppercase tracking-wider">Review Booking Details</h3>
                <div className="bg-white border border-zinc-200/90 rounded-2xl p-6 space-y-4 text-xs shadow-md shadow-zinc-100">
                  <div className="flex justify-between items-center pb-3 border-b border-zinc-100">
                    <span className="text-zinc-600 font-medium">Selected Service</span>
                    <span className="font-bold text-zinc-900">{selectedService?.name} <span className="text-emerald-700 font-extrabold ml-1.5">(${selectedService?.price})</span></span>
                  </div>
                  <div className="flex justify-between items-center pb-3 border-b border-zinc-100">
                    <span className="text-zinc-600 font-medium">Assigned Barber</span>
                    <span className="font-bold text-zinc-900">{selectedBarber?.name}</span>
                  </div>
                  <div className="flex justify-between items-center pb-3 border-b border-zinc-100">
                    <span className="text-zinc-600 font-medium">Appointment Schedule</span>
                    <span className="font-bold text-zinc-900">{selectedDate} at {selectedTime}</span>
                  </div>
                  <div className="flex justify-between items-center pb-3 border-b border-zinc-100">
                    <span className="text-zinc-600 font-medium">Add-on Enhancements</span>
                    <span className="font-bold text-zinc-900 max-w-[220px] text-right truncate">{selectedExtras.length > 0 ? selectedExtras.join(', ') : 'None selected'}</span>
                  </div>
                  <div className="flex justify-between items-center pt-1 font-bold text-sm text-zinc-900">
                    <span>Total Due at Studio</span>
                    <span className="text-emerald-700 text-lg font-extrabold">${calculateTotal()}</span>
                  </div>
                </div>
              </div>
            )}

            <div className="mt-8 pt-5 border-t border-zinc-200/80 flex justify-between items-center">
              {step > 1 ? (
                <button
                  type="button"
                  onClick={() => setStep(step - 1)}
                  className="px-5 py-2.5 border border-zinc-300 text-zinc-800 rounded-xl text-xs font-semibold hover:bg-zinc-50 hover:border-zinc-400 transition-all shadow-xs focus:outline-none focus:ring-2 focus:ring-zinc-500"
                >
                  Back
                </button>
              ) : <div />}

              {step < 4 ? (
                <button
                  type="button"
                  disabled={(step === 1 && !selectedService) || (step === 2 && !selectedBarber)}
                  onClick={() => setStep(step + 1)}
                  className="px-7 py-2.5 bg-zinc-900 text-white rounded-xl text-xs font-semibold hover:bg-zinc-800 transition-all shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-zinc-900 focus:ring-offset-2"
                >
                  Continue
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => {
                    setConfirmed(true);
                    onCompleteBooking?.({
                      service: selectedService?.name || '',
                      barber: selectedBarber?.name || '',
                      date: selectedDate,
                      time: selectedTime,
                      extras: selectedExtras,
                    });
                  }}
                  className="px-7 py-2.5 bg-emerald-700 text-white rounded-xl text-xs font-semibold hover:bg-emerald-800 transition-all shadow-lg shadow-emerald-700/20 hover:shadow-emerald-700/30 active:scale-[0.98] focus:outline-none focus:ring-2 focus:ring-emerald-700 focus:ring-offset-2"
                >
                  Confirm Appointment
                </button>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
};
