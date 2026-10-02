import React, { useState } from 'react';
import { useEmergency } from '../context/EmergencyContext';
import {
  Building2,
  Clock,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Droplet,
  Truck,
  Wind,
  ShieldCheck,
  ArrowRight,
  RotateCcw,
  MapPin,
  Phone,
  Check,
  X,
} from 'lucide-react';

export const MultiHoldConfirmModal: React.FC = () => {
  const {
    multiHoldSession,
    confirmMultiHoldHospital,
    confirmAmbulanceDecision,
    triggerNextIteration,
    closeMultiHoldModal,
  } = useEmergency();

  // Local state for Step 2 (Ambulance with/without oxygen)
  const [needAmbulance, setNeedAmbulance] = useState<boolean>(true);
  const [withOxygen, setWithOxygen] = useState<boolean>(true);

  if (!multiHoldSession) return null;

  const {
    hospitals,
    hospitalTimerSeconds,
    patientDecisionTimerSeconds,
    phase,
    iterationNumber,
    selectedHospitalId,
    selectedHospitalName,
    bedType,
    bloodType,
  } = multiHoldSession;

  const acceptedHospitals = hospitals.filter((h) => h.status === 'accepted');
  const allHospitalsResponded = hospitals.every((h) => h.status !== 'pending');
  const anyAccepted = acceptedHospitals.length > 0;

  // Format seconds to mm:ss
  const formatTimer = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-4xl bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="p-6 bg-slate-900 text-white flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-wider text-rose-300 bg-rose-950/80 border border-rose-800 px-2.5 py-0.5 rounded-full">
                Multi-Hospital Hold & Confirm (Iteration {iterationNumber})
              </span>
              <span className="text-xs text-slate-400">
                Patient: <strong className="text-white">{multiHoldSession.patientName}</strong> · Blood: {bloodType}
              </span>
            </div>
            <h2 className="text-lg sm:text-xl font-extrabold mt-1">
              {phase === 'waiting_hospitals' && 'Concurrent Request Sent to Top 3 Ranked Hospitals'}
              {phase === 'patient_selecting' && 'Hospital(s) Accepted! Choose Your Final Destination'}
              {phase === 'confirmed_selecting_ambulance' && 'Hospital & Bed Confirmed! Select Ambulance Requirement'}
              {phase === 'failed_need_next_iteration' && 'No Capacity in Current Set - Request Next 3 Hospitals'}
            </h2>
          </div>

          {/* Active Countdown Timer */}
          <div className="flex items-center gap-3">
            {phase === 'waiting_hospitals' && (
              <div className="bg-rose-950/90 border border-rose-600/50 px-4 py-2 rounded-2xl text-center">
                <span className="text-[10px] text-rose-300 uppercase tracking-wider font-bold block">
                  Hospital SLA Timer
                </span>
                <span className="font-mono text-xl font-black text-rose-400">
                  {formatTimer(hospitalTimerSeconds)}
                </span>
              </div>
            )}

            {phase === 'patient_selecting' && (
              <div className="bg-emerald-950/90 border border-emerald-500/50 px-4 py-2 rounded-2xl text-center animate-pulse">
                <span className="text-[10px] text-emerald-300 uppercase tracking-wider font-bold block">
                  Patient Decision SLA
                </span>
                <span className="font-mono text-xl font-black text-emerald-400">
                  {formatTimer(patientDecisionTimerSeconds)}
                </span>
              </div>
            )}

            <button
              type="button"
              onClick={closeMultiHoldModal}
              className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1 text-slate-900">
          {/* PHASE 1 & 2: Top 3 Hospitals Response Cards */}
          {(phase === 'waiting_hospitals' || phase === 'patient_selecting') && (
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs text-slate-500">
                <span>
                  Simultaneous hold request dispatched to the 3 highest ranked hospitals based on your location and availability.
                </span>
                <span className="font-bold text-slate-800">
                  {acceptedHospitals.length} of 3 Accepted
                </span>
              </div>

              {/* 3 Hospital Cards Grid */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {hospitals.map((hosp, idx) => {
                  const isAccepted = hosp.status === 'accepted';
                  const isPending = hosp.status === 'pending';
                  const isDeclined = hosp.status === 'declined' || hosp.status === 'timed_out';

                  return (
                    <div
                      key={hosp.hospitalId}
                      className={`p-5 rounded-2xl border transition-all flex flex-col justify-between space-y-4 ${
                        isAccepted
                          ? 'border-emerald-500 bg-emerald-50/50 ring-2 ring-emerald-200 shadow-md'
                          : isPending
                          ? 'border-slate-200 bg-slate-50/60'
                          : 'border-slate-200 bg-slate-100 opacity-60'
                      }`}
                    >
                      <div className="space-y-2">
                        {/* Rank Badge & Status */}
                        <div className="flex items-center justify-between">
                          <span className="font-mono text-xs font-black text-slate-500 bg-white border border-slate-200 px-2 py-0.5 rounded">
                            Rank #{idx + 1}
                          </span>

                          {isAccepted && (
                            <span className="text-[11px] font-bold text-emerald-800 bg-emerald-100 border border-emerald-300 px-2 py-0.5 rounded-full flex items-center gap-1">
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              Accepted & Held
                            </span>
                          )}
                          {isPending && (
                            <span className="text-[11px] font-bold text-slate-600 bg-white border border-slate-200 px-2 py-0.5 rounded-full flex items-center gap-1 animate-pulse">
                              <Clock className="w-3.5 h-3.5" />
                              Nurse Reviewing...
                            </span>
                          )}
                          {isDeclined && (
                            <span className="text-[11px] font-bold text-rose-700 bg-rose-100 px-2 py-0.5 rounded-full">
                              No Available Bed
                            </span>
                          )}
                        </div>

                        <h3 className="text-sm font-bold text-slate-900 leading-snug">
                          {hosp.hospitalName}
                        </h3>

                        <p className="text-xs text-slate-500 flex items-center gap-1">
                          <MapPin className="w-3.5 h-3.5 text-slate-400" />
                          <strong>{hosp.distanceText}</strong> ({hosp.station})
                        </p>

                        {/* Capacity Highlights */}
                        <div className="pt-2 border-t border-slate-200/60 text-xs space-y-1">
                          <div className="flex justify-between">
                            <span className="text-slate-500">Reserved Bed:</span>
                            <strong className="text-slate-900">
                              {hosp.confirmedBedNumber || `${bedType.toUpperCase()} Bay`}
                            </strong>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-slate-500">{bloodType} Blood Stock:</span>
                            <strong className="text-rose-700">{hosp.bloodAvailableUnits} Units Available</strong>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-slate-500">Hospital Phone:</span>
                            <span className="font-mono text-slate-700">{hosp.phone}</span>
                          </div>
                        </div>
                      </div>

                      {/* Action Button: Confirm this Hospital if accepted */}
                      <div>
                        {isAccepted ? (
                          <button
                            type="button"
                            onClick={() => confirmMultiHoldHospital(hosp.hospitalId)}
                            className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-md transition-all flex items-center justify-center gap-1.5 cursor-pointer active:scale-95"
                          >
                            <Check className="w-4 h-4" />
                            Confirm & Lock {hosp.hospitalName.split(' ')[0]}
                          </button>
                        ) : isPending ? (
                          <div className="w-full py-2 text-center text-xs text-slate-400 font-medium">
                            Awaiting Triage Desk...
                          </div>
                        ) : (
                          <div className="w-full py-2 text-center text-xs text-slate-400">
                            Unavailable
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Patient Decision Callout */}
              {phase === 'patient_selecting' && anyAccepted && (
                <div className="p-4 bg-emerald-50 border-2 border-emerald-300 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                  <div className="flex items-center gap-2.5 text-emerald-950 font-semibold">
                    <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                    <span>
                      {acceptedHospitals.length} hospital(s) have confirmed and locked a bed! You have{' '}
                      <strong>{formatTimer(patientDecisionTimerSeconds)} minutes</strong> to confirm your choice.
                    </span>
                  </div>
                </div>
              )}

              {/* If all declined or user wants next iteration */}
              {allHospitalsResponded && !anyAccepted && (
                <div className="p-4 bg-amber-50 border border-amber-200 rounded-2xl text-center space-y-3 text-xs">
                  <AlertTriangle className="w-8 h-8 text-amber-600 mx-auto" />
                  <p className="text-slate-700 font-semibold">
                    The current set of 3 hospitals has reached emergency capacity.
                  </p>
                  <button
                    type="button"
                    onClick={triggerNextIteration}
                    className="px-6 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl transition-all inline-flex items-center gap-2 cursor-pointer"
                  >
                    <RotateCcw className="w-4 h-4" />
                    Request Next 3 Ranked Hospitals (Iteration {iterationNumber + 1})
                  </button>
                </div>
              )}
            </div>
          )}

          {/* REQUIREMENT 3: AMBULANCE REQUIREMENT STEP (ONCE HOSPITAL & BED IS CONFIRMED) */}
          {phase === 'confirmed_selecting_ambulance' && (
            <div className="space-y-6 animate-in fade-in zoom-in-95 duration-200">
              {/* Confirmed Hospital & Bed Banner */}
              <div className="p-4 bg-emerald-50 border-2 border-emerald-400 rounded-2xl flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0">
                    <Building2 className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded">
                      Hospital & Bed Confirmed
                    </span>
                    <h3 className="text-base font-extrabold text-slate-900 mt-0.5">
                      {selectedHospitalName}
                    </h3>
                    <p className="text-xs text-slate-600">
                      Reserved Bed: <strong className="text-emerald-800">{bedType.toUpperCase()} Bay #02</strong> · Blood Held: 2 Units {bloodType}
                    </p>
                  </div>
                </div>

                <div className="hidden sm:block text-right">
                  <span className="text-[11px] font-bold text-emerald-700 bg-white border border-emerald-200 px-3 py-1 rounded-full">
                    Bed Locked for 120s
                  </span>
                </div>
              </div>

              {/* Ambulance Prompt: YES or NO */}
              <div className="space-y-4">
                <div className="border-b border-slate-100 pb-2">
                  <h3 className="text-base font-bold text-slate-900">
                    Do you need an emergency ambulance to transport the patient?
                  </h3>
                  <p className="text-xs text-slate-500">
                    Select your transport mode to dispatch paramedics or prepare the ER ramp for private arrival.
                  </p>
                </div>

                {/* Two Main Options: YES vs NO */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Option 1: YES */}
                  <div
                    onClick={() => setNeedAmbulance(true)}
                    className={`p-5 rounded-2xl border-2 cursor-pointer transition-all space-y-3 ${
                      needAmbulance
                        ? 'border-rose-600 bg-rose-50/50 ring-2 ring-rose-200 shadow-sm'
                        : 'border-slate-200 hover:border-slate-300 bg-white'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Truck className="w-5 h-5 text-rose-600" />
                        <h4 className="text-sm font-bold text-slate-900">YES - Request Ambulance</h4>
                      </div>
                      <input
                        type="radio"
                        checked={needAmbulance}
                        onChange={() => setNeedAmbulance(true)}
                        className="text-rose-600 focus:ring-rose-500"
                      />
                    </div>
                    <p className="text-xs text-slate-600 leading-relaxed">
                      Deploy emergency ambulance from {selectedHospitalName} directly to your GPS coordinates with live tracking.
                    </p>

                    {/* Oxygen Sub-Choice: With Oxygen or Without */}
                    {needAmbulance && (
                      <div className="pt-3 border-t border-rose-200 space-y-2.5 animate-in fade-in">
                        <span className="text-[11px] font-bold text-slate-700 uppercase tracking-wider block">
                          Oxygen Requirement:
                        </span>
                        <div className="grid grid-cols-2 gap-2 text-xs">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setWithOxygen(true);
                            }}
                            className={`p-3 rounded-xl border text-left font-bold transition-all cursor-pointer ${
                              withOxygen
                                ? 'bg-rose-600 text-white border-rose-600 shadow-xs'
                                : 'bg-white text-slate-800 border-slate-300 hover:bg-slate-50'
                            }`}
                          >
                            <Wind className="w-4 h-4 mb-1" />
                            <div>With Oxygen</div>
                            <div className={`text-[10px] font-normal ${withOxygen ? 'text-rose-100' : 'text-slate-500'}`}>
                              ALS / Ventilator Ready
                            </div>
                          </button>

                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setWithOxygen(false);
                            }}
                            className={`p-3 rounded-xl border text-left font-bold transition-all cursor-pointer ${
                              !withOxygen
                                ? 'bg-slate-900 text-white border-slate-900 shadow-xs'
                                : 'bg-white text-slate-800 border-slate-300 hover:bg-slate-50'
                            }`}
                          >
                            <Truck className="w-4 h-4 mb-1" />
                            <div>Without Oxygen</div>
                            <div className={`text-[10px] font-normal ${!withOxygen ? 'text-slate-300' : 'text-slate-500'}`}>
                              Basic Life Support (BLS)
                            </div>
                          </button>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Option 2: NO */}
                  <div
                    onClick={() => setNeedAmbulance(false)}
                    className={`p-5 rounded-2xl border-2 cursor-pointer transition-all space-y-3 ${
                      !needAmbulance
                        ? 'border-slate-900 bg-slate-50 ring-2 ring-slate-300 shadow-sm'
                        : 'border-slate-200 hover:border-slate-300 bg-white'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Building2 className="w-5 h-5 text-slate-700" />
                        <h4 className="text-sm font-bold text-slate-900">NO - No Ambulance Needed</h4>
                      </div>
                      <input
                        type="radio"
                        checked={!needAmbulance}
                        onChange={() => setNeedAmbulance(false)}
                        className="text-slate-900 focus:ring-slate-500"
                      />
                    </div>
                    <p className="text-xs text-slate-600 leading-relaxed">
                      Patient is arriving via private car, taxi, or self-transport. The hospital ER portico will be notified to clear the intake ramp.
                    </p>
                    <div className="p-2.5 bg-white rounded-xl border border-slate-200 text-[11px] text-slate-500">
                      Emergency Reception: <strong>{selectedHospitalName} ER Portico Gate 1</strong>
                    </div>
                  </div>
                </div>

                {/* Final Confirmation Action */}
                <div className="pt-4 border-t border-slate-200 flex items-center justify-between gap-3">
                  <button
                    type="button"
                    onClick={() => confirmMultiHoldHospital(selectedHospitalId || '')}
                    className="text-xs text-slate-500 hover:text-slate-700 font-semibold"
                  >
                    Back to Hospital Selection
                  </button>

                  <button
                    type="button"
                    onClick={() => confirmAmbulanceDecision(needAmbulance, withOxygen)}
                    className="px-6 py-3 bg-rose-600 hover:bg-rose-700 text-white font-extrabold text-xs rounded-xl shadow-lg transition-all flex items-center gap-2 cursor-pointer active:scale-95"
                  >
                    <span>
                      {needAmbulance
                        ? `Dispatch Ambulance (${withOxygen ? 'With Oxygen' : 'Without Oxygen'}) & Track`
                        : 'Confirm Direct Arrival at Hospital Portico'}
                    </span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
