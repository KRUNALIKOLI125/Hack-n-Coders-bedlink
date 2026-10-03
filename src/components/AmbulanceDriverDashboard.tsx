import React, { useState } from 'react';
import { useEmergency } from '../context/EmergencyContext';
import {
  Truck,
  MapPin,
  Phone,
  Radio,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Building2,
  Droplet,
  Stethoscope,
  Compass,
  Volume2,
  Navigation,
  ShieldAlert,
  ArrowRight,
} from 'lucide-react';

export const AmbulanceDriverDashboard: React.FC = () => {
  const { userSession, requests, updateAmbulanceStage, hospitals, setActiveView } = useEmergency();

  const [sirenActive, setSirenActive] = useState(true);

  // Active case for this driver (e.g. Swara Patil at Seven Hills)
  const currentCase = requests[0];
  const amb = currentCase?.ambulanceInfo;

  const currentStage = amb?.currentStage || 'en_route_pickup';

  const stages = [
    { key: 'dispatched', label: '1. Dispatched from Bay', sub: 'Departed Seven Hills ER Portico' },
    { key: 'en_route_pickup', label: '2. En Route to Scene', sub: 'Navigating Western Express Highway' },
    { key: 'arrived_scene', label: '3. Arrived at Scene', sub: 'Accident spot: Patient onboard & oxygen connected' },
    { key: 'in_transit_hospital', label: '4. Transit to Hospital', sub: 'Green corridor to Seven Hills ER ramp' },
    { key: 'arrived_hospital', label: '5. Patient Delivered to ER', sub: 'Rolled directly into Trauma Resuscitation Bay 2' },
  ];

  const handleStageChange = (
    stage: 'dispatched' | 'en_route_pickup' | 'arrived_scene' | 'in_transit_hospital' | 'arrived_hospital',
    locationText: string,
    etaMinutes: number
  ) => {
    if (currentCase) {
      updateAmbulanceStage(currentCase.id, stage, locationText, etaMinutes);
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      {/* Top Driver Console Header */}
      <div className="bg-slate-900 rounded-2xl p-5 text-white shadow-lg border border-slate-800">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-xl bg-rose-600 text-white flex items-center justify-center shrink-0">
              <Truck className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-lg sm:text-xl font-bold">
                  Ambulance Driver Dispatch Console
                </h1>
                <span className="text-xs font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-2.5 py-0.5 rounded-full flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                  GPS Telemetry Active
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Pilot: <strong className="text-white">{userSession.name}</strong> · Vehicle:{' '}
                <strong className="text-rose-400 font-mono">{amb?.vehicleNumber || 'MH-02-ER-9192'}</strong> (ALS Unit)
              </p>
            </div>
          </div>

          {/* Siren Status & Hotline */}
          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={() => setSirenActive(!sirenActive)}
              className={`px-3 py-1.5 text-xs font-bold rounded-xl transition-all flex items-center gap-1.5 cursor-pointer ${
                sirenActive
                  ? 'bg-rose-600 text-white animate-pulse shadow-md shadow-rose-600/30'
                  : 'bg-slate-800 text-slate-400 hover:text-white'
              }`}
            >
              <Volume2 className="w-4 h-4" />
              {sirenActive ? 'Siren Active (Priority)' : 'Siren Silent'}
            </button>

            <a
              href="tel:02267676767"
              className="px-3.5 py-1.5 bg-white hover:bg-slate-100 text-slate-900 font-bold text-xs rounded-xl transition-colors flex items-center gap-1.5"
            >
              <Phone className="w-3.5 h-3.5 text-rose-600" />
              Call Seven Hills ER Desk
            </a>
          </div>
        </div>
      </div>

      {/* Main Grid: Active Mission (Left 8 cols) & Patient/Hospital Info (Right 4 cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Driver Stage Management & Route Progress */}
        <div className="lg:col-span-8 space-y-5">
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-rose-700 bg-rose-50 px-2 py-0.5 rounded">
                  Current Emergency Mission
                </span>
                <h2 className="text-base font-bold text-slate-900 mt-1">
                  Accident Extraction & Rapid Transport
                </h2>
              </div>
              <div className="text-right">
                <span className="text-xs text-slate-400">Current Reach Time</span>
                <div className="font-mono text-xl font-black text-rose-600">
                  ETA ~{amb?.etaMinutes || 4} min
                </div>
              </div>
            </div>

            {/* Current GPS Telemetry Readout */}
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                <Navigation className="w-3.5 h-3.5 text-blue-600" />
                Live Vehicle GPS Coordinate & Street
              </span>
              <p className="text-sm font-bold text-slate-900 leading-snug">
                {amb?.currentLocationText || 'Western Express Highway, Goregaon East Flyover junction'}
              </p>
              <p className="text-xs text-slate-500">
                Route: Western Express Highway ➔ Saki Naka Metro Link ➔ Seven Hills Emergency Bay
              </p>
            </div>

            {/* Driver Interactive Stage Buttons */}
            <div className="space-y-3 pt-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                  Driver Action: Advance Emergency Progression
                </span>
                <span className="text-[11px] text-slate-400">
                  Tap when you reach each milestone
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <button
                  type="button"
                  onClick={() =>
                    handleStageChange(
                      'en_route_pickup',
                      'Western Express Highway Flyover, near Hub Mall (1.2 km away)',
                      4
                    )
                  }
                  className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                    currentStage === 'en_route_pickup'
                      ? 'border-blue-600 bg-blue-50/70 ring-2 ring-blue-200 text-blue-950 font-bold'
                      : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                  }`}
                >
                  <div className="text-xs font-bold">2. En Route to Patient</div>
                  <div className="text-[11px] text-slate-500 mt-0.5">Siren active on highway · ETA 4m</div>
                </button>

                <button
                  type="button"
                  onClick={() =>
                    handleStageChange(
                      'arrived_scene',
                      'Accident Spot: Goregaon East Flyover junction. Patient onboard, tourniquet inspected.',
                      0
                    )
                  }
                  className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                    currentStage === 'arrived_scene'
                      ? 'border-rose-600 bg-rose-50/70 ring-2 ring-rose-200 text-rose-950 font-bold'
                      : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                  }`}
                >
                  <div className="text-xs font-bold">3. Arrived at Scene (Pickup)</div>
                  <div className="text-[11px] text-slate-500 mt-0.5">Patient onboarded, vitals stable</div>
                </button>

                <button
                  type="button"
                  onClick={() =>
                    handleStageChange(
                      'in_transit_hospital',
                      'Saki Naka Link Road, approaching Seven Hills ER Bay (1.1 km to hospital)',
                      3
                    )
                  }
                  className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                    currentStage === 'in_transit_hospital'
                      ? 'border-amber-600 bg-amber-50/70 ring-2 ring-amber-200 text-amber-950 font-bold'
                      : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                  }`}
                >
                  <div className="text-xs font-bold">4. In Transit to Hospital</div>
                  <div className="text-[11px] text-slate-500 mt-0.5">Approaching hospital ER ramp · ETA 3m</div>
                </button>

                <button
                  type="button"
                  onClick={() =>
                    handleStageChange(
                      'arrived_hospital',
                      'Seven Hills Emergency Bay Ramp. Patient rolled directly into Trauma Bay #02.',
                      0
                    )
                  }
                  className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                    currentStage === 'arrived_hospital'
                      ? 'border-emerald-600 bg-emerald-50/70 ring-2 ring-emerald-200 text-emerald-950 font-bold'
                      : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                  }`}
                >
                  <div className="text-xs font-bold">5. Delivered to ER Bay</div>
                  <div className="text-[11px] text-slate-500 mt-0.5">Handed over to Sister Sneha & Trauma Surgeon</div>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Destination Hospital & Patient Medical Details */}
        <div className="lg:col-span-4 space-y-4">
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-4">
            <div className="border-b border-slate-100 pb-3">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                Destination Trauma Center
              </span>
              <h3 className="text-base font-bold text-slate-900 mt-0.5">
                Seven Hills Hospital
              </h3>
              <p className="text-xs text-slate-500">
                Marol Maroshi Rd, Andheri East · 1.4 km from Andheri Station
              </p>
            </div>

            {/* Patient Vitals & Blood Alert */}
            <div className="p-3 bg-rose-50 rounded-xl border border-rose-200 space-y-1.5 text-xs">
              <div className="flex items-center justify-between">
                <span className="font-bold text-rose-900">Patient: Swara Patil (26y F)</span>
                <span className="font-mono font-extrabold text-rose-700 bg-rose-100 px-1.5 py-0.5 rounded">
                  Blood: O+
                </span>
              </div>
              <p className="text-slate-700">
                <strong>Condition:</strong> Severe active arterial bleed from two-wheeler highway skid.
              </p>
              <p className="text-[11px] text-rose-800 font-semibold">
                Seven Hills Blood Bank has 2 units O+ PRBC held in Trauma Bay 2 refrigerator.
              </p>
            </div>

            {/* Bed & Specialist Ready */}
            <div className="p-3 bg-blue-50 rounded-xl border border-blue-200 space-y-1 text-xs">
              <div className="font-bold text-blue-900">
                Reserved Bed: Trauma Resuscitation Bay #02
              </div>
              <p className="text-[11px] text-slate-600">
                Surgeon on Standby: <strong>Dr. Anita Deshmukh</strong> (Vascular & Trauma Surgery).
              </p>
            </div>

            {/* Direct Relative Calling Button */}
            <div className="pt-2">
              <a
                href={`tel:${currentCase?.contactPhone || '+919820154321'}`}
                className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-2 shadow-xs transition-colors"
              >
                <Phone className="w-3.5 h-3.5 text-rose-400" />
                Call Patient / Relative ({currentCase?.contactPhone || '+91 98201 54321'})
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
