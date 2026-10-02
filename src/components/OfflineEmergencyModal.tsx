import React from 'react';
import { useEmergency } from '../context/EmergencyContext';
import {
  WifiOff,
  Phone,
  Building2,
  MapPin,
  CheckCircle2,
  AlertTriangle,
  Radio,
  X,
} from 'lucide-react';

export const OfflineEmergencyModal: React.FC = () => {
  const { isOffline, toggleSimulateOffline, getNearest3OfflineHospitals, userSession, selectedStation } =
    useEmergency();

  if (!isOffline) return null;

  const offlineHospitals = getNearest3OfflineHospitals();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl bg-white rounded-3xl shadow-2xl border-2 border-rose-400 overflow-hidden">
        {/* Offline Alert Header */}
        <div className="bg-gradient-to-r from-rose-600 via-rose-700 to-slate-900 p-6 text-white">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-white/10 backdrop-blur-md flex items-center justify-center text-rose-200 shrink-0">
                <WifiOff className="w-6 h-6 animate-pulse" />
              </div>
              <div>
                <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-white/20 text-white text-[11px] font-bold uppercase tracking-wider mb-1">
                  Offline Mode Active · Zero Network Delay
                </div>
                <h2 className="text-xl font-extrabold tracking-tight">
                  Direct Phone Access to 3 Nearest Hospitals
                </h2>
                <p className="text-xs text-rose-100 mt-0.5">
                  Internet connection is offline. Tap below to directly call hospital emergency triage desks without waiting.
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={toggleSimulateOffline}
              title="Close or test online mode"
              className="p-1.5 text-white/70 hover:text-white rounded-xl hover:bg-white/10 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* 3 Nearest Hospitals Phone Directory */}
        <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
          <div className="flex items-center justify-between text-xs text-slate-500 pb-2 border-b border-slate-100">
            <span>
              Nearest Station: <strong className="text-slate-900">{userSession.selectedStation || selectedStation}</strong>
            </span>
            <span className="font-semibold text-rose-600">3 Priority Hospitals Cached</span>
          </div>

          <div className="space-y-3">
            {offlineHospitals.map((hosp, idx) => (
              <div
                key={hosp.id}
                className="p-4 rounded-2xl border border-slate-200 bg-slate-50/70 hover:bg-white hover:border-rose-300 transition-all shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-3"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="w-6 h-6 rounded-full bg-rose-600 text-white text-xs font-bold flex items-center justify-center font-mono">
                      #{idx + 1}
                    </span>
                    <h3 className="text-sm font-bold text-slate-900">{hosp.name}</h3>
                  </div>

                  <p className="text-xs text-slate-500 flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-slate-400" />
                    <strong>{hosp.stationDistanceText}</strong> · Near {hosp.station} Station
                  </p>

                  <div className="flex items-center gap-3 text-[11px] text-slate-600 pt-1">
                    <span>ICU: <strong className="text-slate-900">{hosp.beds.icuAvailable} avail</strong></span>
                    <span>·</span>
                    <span>Trauma: <strong className="text-slate-900">{hosp.beds.traumaAvailable} bays</strong></span>
                    <span>·</span>
                    <span className="text-rose-700 font-semibold">O+ Blood: {hosp.bloodBank['O+'] || 0}u</span>
                  </div>
                </div>

                {/* Big Direct Call Button */}
                <a
                  href={`tel:${hosp.phone}`}
                  className="px-5 py-3 bg-slate-900 hover:bg-slate-800 text-white text-xs font-extrabold rounded-xl transition-all shadow-md flex items-center justify-center gap-2 shrink-0 active:scale-95 cursor-pointer"
                >
                  <Phone className="w-4 h-4 text-rose-400" />
                  <span>Call Hospital: {hosp.phone}</span>
                </a>
              </div>
            ))}
          </div>

          {/* Direct 108 Emergency Hotline Backup */}
          <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-rose-600 text-white flex items-center justify-center shrink-0">
                <Radio className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-slate-900">National 108 Ambulance Hotline</h4>
                <p className="text-[11px] text-slate-500">
                  Direct cellular voice link to Government Emergency Medical Service dispatch.
                </p>
              </div>
            </div>

            <a
              href="tel:108"
              className="px-5 py-2.5 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs rounded-xl shadow-xs flex items-center justify-center gap-2 shrink-0"
            >
              <Phone className="w-4 h-4" />
              Dial 108 Helpline
            </a>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-100 border-t border-slate-200 flex items-center justify-between text-xs text-slate-600">
          <span>Hospitals are cached locally on your device for offline connectivity dropouts.</span>
          <button
            type="button"
            onClick={toggleSimulateOffline}
            className="text-xs font-bold text-slate-800 hover:text-slate-900 underline cursor-pointer"
          >
            Dismiss / Switch to Online
          </button>
        </div>
      </div>
    </div>
  );
};
