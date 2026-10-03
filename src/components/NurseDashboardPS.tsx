import React, { useState } from 'react';
import { useEmergency } from '../context/EmergencyContext';
import { Hospital, BedType, BloodGroup } from '../types';
import {
  Building2,
  Clock,
  Plus,
  Minus,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Droplet,
  Truck,
  Stethoscope,
  Send,
  UserCheck,
  ShieldCheck,
  Activity,
  Phone,
  Flame,
  Wind,
  Bed,
  Check,
  ArrowRight,
} from 'lucide-react';

export const NurseDashboardPS: React.FC = () => {
  const {
    hospitals,
    userSession,
    updateBedCount,
    updateHospitalBloodBank,
    requests,
    activeRequest,
    acceptBedHold,
    rejectBedHold,
    requestDoctorAvailability,
    respondDoctorAvailability,
    deployHospitalAmbulance,
    updateAmbulanceStage,
    setActiveView,
    loginAsNurse,
  } = useEmergency();

  // Active hospital for this nurse station
  const [selectedHospitalId, setSelectedHospitalId] = useState<string>(
    userSession.hospitalId || 'seven-hills'
  );

  const currentHospital = hospitals.find((h) => h.id === selectedHospitalId) || hospitals[0];

  // Incoming or active request for this hospital
  const hospitalRequest =
    requests.find((r) => r.hospitalId === currentHospital.id) ||
    requests.find((r) => r.patientName.toLowerCase().includes('swara')) ||
    requests[0];

  const handleHospitalChange = (newId: string) => {
    setSelectedHospitalId(newId);
    loginAsNurse({
      hospitalId: newId,
      staffId: 'NS-' + newId.toUpperCase().slice(0, 4) + '-101',
      nurseName: userSession.name || 'Sister Sneha Kadam',
    });
  };

  // Bed Categories for 10-Second Quick Update
  const bedCategories: { key: keyof Hospital['beds']; label: string; sub: string; icon: any; color: string }[] = [
    { key: 'icuAvailable', label: 'ICU Beds', sub: 'Intensive Care Unit', icon: Activity, color: 'text-purple-600 bg-purple-50' },
    { key: 'traumaAvailable', label: 'Trauma Bays', sub: 'Accidents & Hemorrhage', icon: ShieldCheck, color: 'text-rose-600 bg-rose-50' },
    { key: 'ventilatorAvailable', label: 'Ventilators', sub: 'Invasive Life Support', icon: Wind, color: 'text-blue-600 bg-blue-50' },
    { key: 'oxygenAvailable', label: 'Oxygen Beds', sub: 'High Dependency (HDU)', icon: Bed, color: 'text-emerald-600 bg-emerald-50' },
    { key: 'burnsAvailable', label: 'Burns Beds', sub: 'Specialized Burn Unit', icon: Flame, color: 'text-amber-600 bg-amber-50' },
    { key: 'regularAvailable', label: 'General Beds', sub: 'Emergency Observation', icon: Building2, color: 'text-slate-600 bg-slate-50' },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      {/* Top Bar: Hospital Station Selector & 10-Sec SLA Live Status */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-start sm:items-center gap-3.5">
            <div className="w-12 h-12 rounded-xl bg-slate-900 text-white flex items-center justify-center shrink-0">
              <Building2 className="w-6 h-6 text-rose-400" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-lg sm:text-xl font-bold text-slate-900">
                  {currentHospital.name} · Nurse Triage Desk
                </h1>
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                  <span className="w-2 h-2 rounded-full bg-emerald-600 animate-ping" />
                  Live Desk Active
                </span>
                <span className="text-[11px] font-medium text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
                  Data Freshness: {currentHospital.lastUpdatedMinutesAgo < 5 ? '🟢 < 5m ago' : '🟡 5-15m ago'}
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5 flex items-center gap-2 flex-wrap">
                <span>{currentHospital.stationDistanceText}</span>
                <span aria-hidden="true">·</span>
                <span>Emergency Portico: <strong className="text-slate-800 font-mono">{currentHospital.phone}</strong></span>
                <span aria-hidden="true">·</span>
                <span>Station: <strong className="text-slate-900">{currentHospital.station}</strong></span>
              </p>
            </div>
          </div>

          {/* Hospital Switcher */}
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-slate-500 whitespace-nowrap">Switch Hospital:</span>
            <select
              value={selectedHospitalId}
              onChange={(e) => handleHospitalChange(e.target.value)}
              className="text-xs font-bold text-slate-900 bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-rose-500 focus:outline-hidden cursor-pointer"
            >
              {hospitals.map((h) => (
                <option key={h.id} value={h.id}>
                  {h.name} ({h.station} - {h.stationDistanceKm} km)
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* 1. CONFIRM-AND-HOLD EMERGENCY RESPONSE PANEL (2-MINUTE SLA) */}
      {hospitalRequest && (
        <div className={`rounded-2xl border-2 p-5 shadow-sm transition-all ${
          hospitalRequest.slaStatus === 'pending_response'
            ? 'bg-rose-50/70 border-rose-400 ring-2 ring-rose-200'
            : hospitalRequest.slaStatus === 'accepted_held'
            ? 'bg-emerald-50/60 border-emerald-400'
            : 'bg-amber-50/60 border-amber-400'
        }`}>
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            {/* Left: Patient Details & Countdown */}
            <div className="flex items-start gap-3.5">
              {/* Circular countdown visual */}
              <div className="w-14 h-14 rounded-2xl bg-white border border-rose-200 text-rose-700 flex flex-col items-center justify-center shrink-0 shadow-2xs">
                <span className="font-mono text-lg font-black tabular-nums leading-none">
                  {hospitalRequest.slaRemainingSeconds}s
                </span>
                <span className="text-[9px] uppercase tracking-wider font-bold text-slate-400 mt-0.5">
                  2m SLA
                </span>
              </div>

              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-rose-800 bg-rose-100 px-2 py-0.5 rounded">
                    Incoming Emergency Request ({hospitalRequest.id})
                  </span>
                  <span className="text-xs font-bold text-slate-900">
                    Patient: {hospitalRequest.patientName} (26y F) · Requester: {hospitalRequest.relativeName}
                  </span>
                  {hospitalRequest.slaStatus === 'accepted_held' && (
                    <span className="text-xs font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      Bed Held & Locked
                    </span>
                  )}
                </div>

                <p className="text-xs text-slate-700 font-medium mt-1 leading-relaxed">
                  <strong>Injury:</strong> {hospitalRequest.injuryType.replace(/_/g, ' ').toUpperCase()} · {hospitalRequest.locationAddress}
                </p>

                <div className="flex items-center gap-3 mt-1.5 text-xs flex-wrap">
                  <span className="font-bold text-rose-700 flex items-center gap-1 bg-white px-2 py-0.5 rounded border border-rose-200">
                    <Droplet className="w-3.5 h-3.5 fill-rose-600 text-rose-600" />
                    Blood Needed: 2 Units ({hospitalRequest.patientBloodType})
                  </span>
                  <span className="font-bold text-blue-700 bg-white px-2 py-0.5 rounded border border-blue-200">
                    Bed: {hospitalRequest.allocatedBedNumber || `${hospitalRequest.bedType.toUpperCase()} Bay`}
                  </span>
                  <span className="font-medium text-slate-600">
                    Specialist: <strong className="text-slate-900">{hospitalRequest.specialistRequired}</strong>
                  </span>
                </div>
              </div>
            </div>

            {/* Right: Actions */}
            <div className="flex items-center gap-2.5 shrink-0 self-end lg:self-center">
              {hospitalRequest.slaStatus === 'pending_response' ? (
                <>
                  <button
                    type="button"
                    onClick={() => acceptBedHold(hospitalRequest.id)}
                    className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-md transition-all flex items-center gap-1.5 cursor-pointer"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    Accept & Hold Bed
                  </button>
                  <button
                    type="button"
                    onClick={() => rejectBedHold(hospitalRequest.id)}
                    className="px-4 py-2.5 bg-white hover:bg-rose-50 text-rose-700 border border-rose-300 font-semibold text-xs rounded-xl transition-all flex items-center gap-1.5 cursor-pointer"
                  >
                    <XCircle className="w-4 h-4" />
                    Reject (Auto-Reroute)
                  </button>
                </>
              ) : (
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setActiveView('ambulance_tracker')}
                    className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl transition-colors flex items-center gap-1.5 cursor-pointer"
                  >
                    <Truck className="w-4 h-4 text-rose-400" />
                    Track Ambulance Location
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 2. 10-SECOND BED UPDATE SCREEN (GIANT TOUCH TARGETS FOR SMARTPHONES) */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
                10-Second Bed Quick Update
              </span>
              <span className="text-xs text-emerald-600 font-semibold">One-Tap Big Buttons</span>
            </div>
            <h2 className="text-base font-bold text-slate-900 mt-0.5">
              Live Bed Inventory & Rapid Triage Counters
            </h2>
          </div>
          <span className="text-xs text-slate-400">
            Tap (+) or (-) to instantly update available count for incoming 108 ambulances.
          </span>
        </div>

        {/* Big Touch Target Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
          {bedCategories.map((item) => {
            const count = currentHospital.beds[item.key] as number;
            const Icon = item.icon;

            return (
              <div
                key={item.key}
                className="p-4 rounded-xl border border-slate-200 bg-slate-50/60 hover:bg-white hover:border-slate-300 transition-all shadow-2xs flex items-center justify-between gap-3"
              >
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${item.color}`}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-900">{item.label}</h4>
                    <p className="text-[11px] text-slate-500">{item.sub}</p>
                    <div className="text-xs font-semibold text-slate-700 mt-1">
                      Available: <span className="font-mono text-base font-extrabold text-slate-900">{count}</span>
                    </div>
                  </div>
                </div>

                {/* Giant +/- Buttons */}
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => updateBedCount(currentHospital.id, item.key, -1)}
                    disabled={count <= 0}
                    className="w-10 h-10 rounded-xl bg-white border border-slate-300 hover:bg-rose-50 hover:border-rose-300 text-slate-800 hover:text-rose-700 font-black text-lg flex items-center justify-center transition-all disabled:opacity-40 disabled:pointer-events-none active:scale-95 shadow-2xs cursor-pointer"
                  >
                    <Minus className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => updateBedCount(currentHospital.id, item.key, 1)}
                    className="w-10 h-10 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-black text-lg flex items-center justify-center transition-all active:scale-95 shadow-2xs cursor-pointer"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 3. DOCTORS PRESENT & AVAILABILITY REQUEST DESK */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-purple-100 text-purple-700 flex items-center justify-center">
              <Stethoscope className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">
                On-Duty Doctors at {currentHospital.name}
              </h2>
              <p className="text-xs text-slate-500">
                Send request for availability to on-duty specialists for acute emergency triage.
              </p>
            </div>
          </div>
          <span className="text-xs font-mono font-bold text-slate-700 bg-slate-100 px-2.5 py-1 rounded-md">
            {currentHospital.doctors.length} Doctors Registered
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
          {currentHospital.doctors.map((doc) => {
            const isAvail = doc.status === 'available';
            const isPending = doc.requestStatus === 'pending';
            const isAccepted = doc.requestStatus === 'accepted';

            return (
              <div
                key={doc.id}
                className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/50 flex flex-col justify-between gap-3"
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="text-xs font-bold text-slate-900">{doc.name}</h4>
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                          isAvail
                            ? 'bg-emerald-100 text-emerald-800'
                            : doc.status === 'in_surgery'
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-slate-200 text-slate-700'
                        }`}
                      >
                        {doc.status.replace(/_/g, ' ').toUpperCase()}
                      </span>
                    </div>
                    <p className="text-xs text-slate-700 font-semibold mt-0.5">{doc.specialty}</p>
                    <p className="text-[11px] text-slate-500">{doc.department} · {doc.qualification}</p>
                    {doc.lastSeen && (
                      <p className="text-[10px] text-slate-400 mt-1">Location: {doc.lastSeen}</p>
                    )}
                  </div>

                  <a
                    href={`tel:${doc.phone}`}
                    className="p-2 rounded-lg bg-white border border-slate-200 text-slate-700 hover:text-slate-900 hover:bg-slate-100 transition-colors"
                  >
                    <Phone className="w-3.5 h-3.5 text-slate-500" />
                  </a>
                </div>

                {/* Request Availability Buttons */}
                <div className="pt-2 border-t border-slate-200/60 flex items-center justify-between gap-2">
                  <span className="text-[11px] text-slate-500">
                    Status: <strong className="text-slate-800 capitalize">{doc.requestStatus || 'No Active Case'}</strong>
                  </span>

                  <div className="flex items-center gap-1.5">
                    {isPending ? (
                      <div className="flex items-center gap-1">
                        <span className="text-xs text-amber-700 font-bold bg-amber-100 px-2 py-1 rounded animate-pulse">
                          Awaiting Doctor Reply...
                        </span>
                        <button
                          type="button"
                          onClick={() => respondDoctorAvailability(currentHospital.id, doc.id, true)}
                          className="px-2 py-1 text-[11px] font-bold text-white bg-emerald-600 rounded hover:bg-emerald-700 cursor-pointer"
                        >
                          Simulate Accept
                        </button>
                      </div>
                    ) : isAccepted ? (
                      <span className="text-xs font-bold text-emerald-800 bg-emerald-100 px-2.5 py-1 rounded flex items-center gap-1">
                        <Check className="w-3.5 h-3.5" />
                        Confirmed Available at Bedside
                      </span>
                    ) : (
                      <button
                        type="button"
                        onClick={() => requestDoctorAvailability(currentHospital.id, doc.id)}
                        className="px-3 py-1.5 text-xs font-bold text-purple-700 bg-purple-50 hover:bg-purple-100 border border-purple-200 rounded-lg transition-colors flex items-center gap-1 cursor-pointer"
                      >
                        <Send className="w-3 h-3" />
                        Request Availability for Case
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 4. HOSPITAL AMBULANCE DEPLOYMENT & GPS ADVANCEMENT */}
      {hospitalRequest && (
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center">
                <Truck className="w-4 h-4" />
              </div>
              <div>
                <h2 className="text-base font-bold text-slate-900">
                  Ambulance Dispatch & Deployment Control
                </h2>
                <p className="text-xs text-slate-500">
                  Deploy hospital emergency ALS fleet or track incoming vehicle status.
                </p>
              </div>
            </div>
            <span className="text-xs font-bold text-blue-700 bg-blue-50 px-2.5 py-1 rounded">
              Ambulance Mode: {hospitalRequest.needAmbulance.replace(/_/g, ' ').toUpperCase()}
            </span>
          </div>

          <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
            {hospitalRequest.ambulanceInfo ? (
              <div className="space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <span className="font-mono text-xs font-bold text-slate-900">
                      Vehicle: {hospitalRequest.ambulanceInfo.vehicleNumber}
                    </span>
                    <h4 className="text-sm font-bold text-slate-900 mt-0.5">
                      Driver: {hospitalRequest.ambulanceInfo.driverName} ({hospitalRequest.ambulanceInfo.driverPhone})
                    </h4>
                    <p className="text-xs text-slate-600 mt-0.5">
                      Current Location: <strong>{hospitalRequest.ambulanceInfo.currentLocationText}</strong>
                    </p>
                  </div>
                  <div className="text-right">
                    <span className="text-xs text-slate-400">Golden Hour Reach</span>
                    <div className="font-mono text-xl font-black text-rose-600">
                      ETA ~{hospitalRequest.ambulanceInfo.etaMinutes} min
                    </div>
                  </div>
                </div>

                {/* Simulated GPS Stage Controller for Nurse */}
                <div className="pt-2 border-t border-slate-200">
                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-2">
                    Simulate Live Ambulance Location Progression:
                  </span>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                    <button
                      type="button"
                      onClick={() =>
                        updateAmbulanceStage(
                          hospitalRequest.id,
                          'en_route_pickup',
                          'Western Express Highway Flyover, near Hub Mall (1.1 km away)',
                          4
                        )
                      }
                      className="px-2.5 py-1.5 rounded-lg bg-white border border-slate-200 hover:bg-slate-100 font-semibold text-slate-700 cursor-pointer"
                    >
                      En Route to Patient (4m)
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        updateAmbulanceStage(
                          hospitalRequest.id,
                          'arrived_scene',
                          'Accident Spot: Goregaon East Flyover junction. Patient onboard.',
                          0
                        )
                      }
                      className="px-2.5 py-1.5 rounded-lg bg-white border border-slate-200 hover:bg-slate-100 font-semibold text-slate-700 cursor-pointer"
                    >
                      Arrived at Scene (Pickup)
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        updateAmbulanceStage(
                          hospitalRequest.id,
                          'in_transit_hospital',
                          'Saki Naka Metro Link Road, approaching Seven Hills ER Bay',
                          3
                        )
                      }
                      className="px-2.5 py-1.5 rounded-lg bg-white border border-slate-200 hover:bg-slate-100 font-semibold text-slate-700 cursor-pointer"
                    >
                      In Transit to Hospital (3m)
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        updateAmbulanceStage(
                          hospitalRequest.id,
                          'arrived_hospital',
                          'Seven Hills Emergency Bay Ramp. Rolling into Trauma Bay 2.',
                          0
                        )
                      }
                      className="px-2.5 py-1.5 rounded-lg bg-emerald-600 text-white font-bold hover:bg-emerald-700 cursor-pointer"
                    >
                      Arrived at Hospital ER
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-bold text-slate-900">Deploy Hospital Emergency Ambulance</h4>
                  <p className="text-[11px] text-slate-500">
                    Send hospital ALS ambulance with oxygen & paramedics to patient's GPS coordinates.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => deployHospitalAmbulance(hospitalRequest.id, currentHospital.id)}
                  className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs rounded-xl shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer"
                >
                  <Truck className="w-4 h-4" />
                  Deploy Seven Hills Ambulance
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
