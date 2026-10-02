import React from 'react';
import { useEmergency } from '../context/EmergencyContext';
import {
  Truck,
  MapPin,
  Phone,
  Clock,
  CheckCircle2,
  Building2,
  Droplet,
  Stethoscope,
  Compass,
  Radio,
} from 'lucide-react';

export const AmbulanceTrackerView: React.FC = () => {
  const { activeRequest, requests, setActiveView, userSession } = useEmergency();

  // Primary case to track
  const currentCase = activeRequest || requests[0];
  const amb = currentCase?.ambulanceInfo;

  const stages: {
    key: 'dispatched' | 'en_route_pickup' | 'arrived_scene' | 'in_transit_hospital' | 'arrived_hospital';
    title: string;
    sub: string;
    icon: any;
  }[] = [
    { key: 'dispatched', title: '1. Ambulance Dispatched', sub: 'Siren on, crew departed bay', icon: Truck },
    { key: 'en_route_pickup', title: '2. En Route to Patient', sub: 'Navigating Western Express Hwy', icon: Compass },
    { key: 'arrived_scene', title: '3. Arrived at Scene', sub: 'Patient pickup & stabilization', icon: MapPin },
    { key: 'in_transit_hospital', title: '4. Transit to Hospital', sub: 'Green corridor to ER ramp', icon: Radio },
    { key: 'arrived_hospital', title: '5. Arrived at ER Bay', sub: 'Direct entry into Trauma Bay', icon: Building2 },
  ];

  const getStageIndex = (stage?: string) => {
    switch (stage) {
      case 'dispatched':
        return 0;
      case 'en_route_pickup':
        return 1;
      case 'arrived_scene':
        return 2;
      case 'in_transit_hospital':
        return 3;
      case 'arrived_hospital':
        return 4;
      default:
        return 1;
    }
  };

  const currentStageIndex = getStageIndex(amb?.currentStage);

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-600 animate-ping" />
            <span className="text-xs font-bold uppercase tracking-wider text-rose-700 bg-rose-50 px-2 py-0.5 rounded">
              Live Ambulance Telemetry
            </span>
            <span className="text-xs text-slate-500">Case ID: {currentCase?.id}</span>
          </div>
          <h1 className="text-xl font-bold text-slate-900 mt-1">
            Emergency Ambulance GPS Tracking & Arrival Status
          </h1>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setActiveView('bed_grid')}
            className="px-4 py-2 text-xs font-bold text-slate-800 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors cursor-pointer"
          >
            ← Back to Bed Availability
          </button>
        </div>
      </div>

      {!amb ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center space-y-3">
          <Truck className="w-10 h-10 text-slate-400 mx-auto" />
          <h3 className="text-base font-bold text-slate-900">No Ambulance Dispatched Yet</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            You have not requested an emergency ambulance for this case, or the hospital is currently assigning an available vehicle.
          </p>
          <a
            href="tel:108"
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-rose-600 text-white font-bold text-xs rounded-xl shadow-xs"
          >
            <Phone className="w-4 h-4" />
            Dial 108 Emergency Ambulance
          </a>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left Column: Live GPS Visual & Journey Stepper (8 cols) */}
          <div className="lg:col-span-8 space-y-5">
            {/* Live GPS Map Simulation Card */}
            <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
              <div className="bg-slate-900 p-5 text-white flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-rose-600 text-white flex items-center justify-center shrink-0">
                    <Truck className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="text-[11px] font-bold text-rose-300 uppercase tracking-wider">
                      Vehicle: {amb.vehicleNumber} ({amb.type} Advanced Life Support)
                    </span>
                    <h2 className="text-base font-bold text-white mt-0.5">
                      Driver: {amb.driverName}
                    </h2>
                  </div>
                </div>

                <div className="text-right">
                  <span className="text-xs text-slate-400">Current Reach Time</span>
                  <div className="font-mono text-2xl font-black text-rose-400">
                    ETA ~{amb.etaMinutes} mins
                  </div>
                </div>
              </div>

              {/* Graphic Map Representation */}
              <div className="p-6 bg-gradient-to-b from-slate-100 to-slate-50 border-b border-slate-200 text-center space-y-3 relative overflow-hidden">
                <div className="max-w-md mx-auto p-4 bg-white rounded-xl border border-slate-200 shadow-sm space-y-2 text-left">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-slate-500 uppercase tracking-wider">
                      Current Telemetry Location
                    </span>
                    <span className="font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 text-[10px]">
                      GPS Signal Active
                    </span>
                  </div>
                  <p className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                    <MapPin className="w-4 h-4 text-rose-600 shrink-0" />
                    {amb.currentLocationText}
                  </p>
                  <p className="text-xs text-slate-500">
                    Target: <strong>{currentCase.hospitalName}</strong> Emergency Portico (Andheri East)
                  </p>
                </div>
              </div>

              {/* 5-Stage Live Progress Pipeline */}
              <div className="p-6 space-y-4">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
                  Real-Time Journey Pipeline: Where Did It Arrive?
                </span>

                <div className="space-y-3">
                  {stages.map((stageItem, index) => {
                    const isDone = currentStageIndex >= index;
                    const isCurrent = currentStageIndex === index;
                    const Icon = stageItem.icon;

                    return (
                      <div
                        key={stageItem.key}
                        className={`p-3.5 rounded-xl border transition-all flex items-start gap-3.5 ${
                          isCurrent
                            ? 'border-rose-400 bg-rose-50/70 ring-2 ring-rose-200'
                            : isDone
                            ? 'border-emerald-200 bg-emerald-50/40 text-emerald-900'
                            : 'border-slate-200 bg-slate-50/40 opacity-60'
                        }`}
                      >
                        <div
                          className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 mt-0.5 ${
                            isCurrent
                              ? 'bg-rose-600 text-white'
                              : isDone
                              ? 'bg-emerald-600 text-white'
                              : 'bg-slate-200 text-slate-600'
                          }`}
                        >
                          <Icon className="w-4 h-4" />
                        </div>

                        <div className="flex-1">
                          <div className="flex items-center justify-between">
                            <h4 className="text-xs font-bold text-slate-900">
                              {stageItem.title}
                            </h4>
                            {isCurrent && (
                              <span className="text-[10px] font-bold text-rose-700 bg-rose-100 px-2 py-0.5 rounded animate-pulse">
                                Live Stage
                              </span>
                            )}
                            {isDone && !isCurrent && (
                              <span className="text-[10px] font-bold text-emerald-700 flex items-center gap-1">
                                <CheckCircle2 className="w-3 h-3" /> Completed
                              </span>
                            )}
                          </div>
                          <p className="text-[11px] text-slate-600 mt-0.5">{stageItem.sub}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Connected Case, Blood Group & Specialist Info (4 cols) */}
          <div className="lg:col-span-4 space-y-4">
            {/* Connected Patient Details Card */}
            <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-4">
              <div className="border-b border-slate-100 pb-3">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  Your Emergency Case
                </span>
                <h3 className="text-base font-bold text-slate-900 mt-0.5">
                  {currentCase.patientName} (26y F)
                </h3>
                <p className="text-xs text-slate-500">
                  Requester: <strong>{currentCase.relativeName}</strong> ({currentCase.relativePhone})
                </p>
              </div>

              {/* Blood Group Matched */}
              <div className="p-3 bg-rose-50 rounded-xl border border-rose-200 space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-slate-900 flex items-center gap-1">
                    <Droplet className="w-3.5 h-3.5 text-rose-600 fill-rose-600" />
                    Patient Blood Type:
                  </span>
                  <span className="font-mono text-sm font-extrabold text-rose-700">
                    {currentCase.patientBloodType}
                  </span>
                </div>
                <p className="text-[11px] text-slate-600">
                  {currentCase.hospitalName} Blood Bank pre-reserved 2 units for trauma bay transfusion.
                </p>
              </div>

              {/* Required Specialist */}
              <div className="p-3 bg-purple-50 rounded-xl border border-purple-200 space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-slate-900 flex items-center gap-1">
                    <Stethoscope className="w-3.5 h-3.5 text-purple-600" />
                    Specialist Booked:
                  </span>
                  <span className="text-[10px] font-bold text-purple-700 bg-purple-100 px-2 py-0.5 rounded">
                    Confirmed
                  </span>
                </div>
                <div className="text-xs font-bold text-purple-950">
                  {currentCase.specialistRequired}
                </div>
                <p className="text-[11px] text-slate-600">
                  Surgeon alerted at {currentCase.hospitalName} Emergency Bay.
                </p>
              </div>

              {/* Direct Driver Contact */}
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-2 text-xs">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-700">Ambulance Pilot:</span>
                  <span className="font-mono text-slate-900 font-bold">{amb.driverName}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-700">Vehicle No:</span>
                  <span className="font-mono text-slate-900 font-bold">{amb.vehicleNumber}</span>
                </div>

                <a
                  href={`tel:${amb.driverPhone}`}
                  className="w-full mt-2 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-lg transition-colors flex items-center justify-center gap-1.5"
                >
                  <Phone className="w-3.5 h-3.5 text-rose-400" />
                  Call Driver ({amb.driverPhone})
                </a>
              </div>

              {/* 108 Emergency Fallback */}
              <div className="pt-2 border-t border-slate-100">
                <p className="text-[11px] text-slate-400 leading-tight">
                  In case of traffic blockage or vehicle breakdown, tap below to ring 108 Central Control.
                </p>
                <a
                  href="tel:108"
                  className="w-full mt-2 py-2 bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-700 font-bold text-xs rounded-lg flex items-center justify-center gap-1.5"
                >
                  <Phone className="w-3.5 h-3.5" />
                  Call 108 City Backup Dispatch
                </a>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
