import React, { useState } from 'react';
import { useEmergency } from '../context/EmergencyContext';
import { WESTERN_LINE_STATIONS } from '../data/westernLineHospitals';
import { BedType, BloodGroup, InjuryType, Hospital } from '../types';
import {
  Building2,
  MapPin,
  Phone,
  Compass,
  Droplet,
  Activity,
  Bed,
  Wind,
  Flame,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  Clock,
  ArrowRight,
  Truck,
  Stethoscope,
  Filter,
  X,
  Zap,
  Layers,
} from 'lucide-react';

export const BedAvailabilityView: React.FC = () => {
  const {
    hospitals,
    selectedStation,
    setSelectedStation,
    within2KmOnly,
    setWithin2KmOnly,
    patientBloodType,
    setPatientBloodType,
    selectedInjuryType,
    setSelectedInjuryType,
    selectedBedType,
    setSelectedBedType,
    triggerBrowserGps,
    patientGpsAcquired,
    acquiredAddress,
    createBedHoldRequest,
    startMultiHoldSession,
    userSession,
    t,
  } = useEmergency();

  // Modal for Single Hospital Hold
  const [selectedHospitalForHold, setSelectedHospitalForHold] = useState<Hospital | null>(null);
  const [ambulanceChoice, setAmbulanceChoice] = useState<'yes_hospital' | 'yes_any' | 'own_private' | 'not_needed'>(
    'yes_hospital'
  );
  const [withOxygenChoice, setWithOxygenChoice] = useState<boolean>(true);
  const [privateDriverName, setPrivateDriverName] = useState('');
  const [privateVehicleNumber, setPrivateVehicleNumber] = useState('');
  const [privateDriverPhone, setPrivateDriverPhone] = useState('');

  const bloodGroups: (BloodGroup | 'all')[] = ['all', 'O+', 'O-', 'A+', 'A-', 'B+', 'B-', 'AB+', 'AB-'];

  const injuryOptions: { id: InjuryType; label: string; specialist: string }[] = [
    { id: 'blood_loss', label: 'Severe Blood Loss / Hemorrhage', specialist: 'Vascular & Trauma Surgeon' },
    { id: 'road_accident', label: 'Road Traffic Accident (RTA)', specialist: 'Trauma & Orthopedic Surgeon' },
    { id: 'cardiac', label: 'Heart Attack / Acute Cardiac', specialist: 'Interventional Cardiologist' },
    { id: 'burns', label: 'Severe Burns (Specialty Unit)', specialist: 'Plastic & Burns Reconstructive Surgeon' },
    { id: 'neuro_head', label: 'Head Injury / Acute Stroke', specialist: 'Neurosurgeon & Neuro-Intensivist' },
    { id: 'respiratory', label: 'Respiratory Distress / SpO2 Drop', specialist: 'Pulmonologist & Intensivist' },
  ];

  const currentActiveStation = userSession.selectedStation || selectedStation || 'Andheri';

  // REQUIREMENT 1: Hospital Segregation by Location First, then Availability of Everything
  // Helper to extract bed count based on selected bed type
  const getBedCount = (h: Hospital, bType: BedType) => {
    switch (bType) {
      case 'icu':
        return h.beds.icuAvailable;
      case 'trauma':
        return h.beds.traumaAvailable;
      case 'ventilator':
        return h.beds.ventilatorAvailable;
      case 'oxygen':
        return h.beds.oxygenAvailable;
      case 'burns':
        return h.beds.burnsAvailable;
      case 'regular':
      default:
        return h.beds.regularAvailable;
    }
  };

  // Filter hospitals based on user station or 2km criteria
  const baseFiltered = hospitals.filter((h) => {
    if (selectedStation !== 'All Stations (Virar to Churchgate)' && h.station !== selectedStation) {
      return false;
    }
    if (within2KmOnly && h.stationDistanceKm > 2.0) {
      return false;
    }
    return true;
  });

  // Calculate composite rank score: Location proximity FIRST, then availability of everything
  const rankedHospitals = [...baseFiltered].sort((a, b) => {
    const isStationA = a.station === currentActiveStation ? 1 : 0;
    const isStationB = b.station === currentActiveStation ? 1 : 0;

    // 1. Same Station location tier first
    if (isStationA !== isStationB) {
      return isStationB - isStationA;
    }

    // 2. Physical distance proximity (closest first)
    if (Math.abs(a.stationDistanceKm - b.stationDistanceKm) > 0.5) {
      return a.stationDistanceKm - b.stationDistanceKm;
    }

    // 3. Bed availability for requested bed type
    const bedsA = getBedCount(a, selectedBedType);
    const bedsB = getBedCount(b, selectedBedType);
    if (bedsA !== bedsB) {
      return bedsB - bedsA;
    }

    // 4. Patient matched blood bank stock
    if (patientBloodType !== 'all') {
      const bloodA = a.bloodBank[patientBloodType] || 0;
      const bloodB = b.bloodBank[patientBloodType] || 0;
      if (bloodA !== bloodB) return bloodB - bloodA;
    }

    // 5. Data freshness (fresher first)
    return a.lastUpdatedMinutesAgo - b.lastUpdatedMinutesAgo;
  });

  // Segregate into Location Groups:
  // Group A: Same station (Immediate Station Vicinity)
  // Group B: Within 2.5 km (Adjacent Stations)
  // Group C: Wider Network Stations
  const immediateStationGroup = rankedHospitals.filter(
    (h) => h.station === currentActiveStation || h.stationDistanceKm <= 1.5
  );
  const adjacentStationGroup = rankedHospitals.filter(
    (h) => h.station !== currentActiveStation && h.stationDistanceKm > 1.5 && h.stationDistanceKm <= 3.5
  );
  const widerNetworkGroup = rankedHospitals.filter(
    (h) => h.station !== currentActiveStation && h.stationDistanceKm > 3.5
  );

  // Top 3 ranked hospitals for Requirement 2 (Multi-Hospital Hold & Confirm)
  const top3Ranked = rankedHospitals.slice(0, 3);

  const handleOpenHoldModal = (hosp: Hospital) => {
    setSelectedHospitalForHold(hosp);
  };

  const handleConfirmSingleHold = () => {
    if (!selectedHospitalForHold) return;
    createBedHoldRequest({
      hospitalId: selectedHospitalForHold.id,
      bedType: selectedBedType,
      needAmbulance: ambulanceChoice,
      withOxygen: withOxygenChoice,
      privateAmbulanceInfo:
        ambulanceChoice === 'own_private'
          ? {
              driverName: privateDriverName || 'Private Driver',
              vehicleNumber: privateVehicleNumber || 'MH-02-PV-9999',
              driverPhone: privateDriverPhone || '+91 98000 00000',
            }
          : undefined,
    });
    setSelectedHospitalForHold(null);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      {/* Top Filter Toolbar */}
      <div className="bg-white rounded-3xl border border-slate-200 p-5 shadow-xs space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-slate-100 pb-3">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-wider text-rose-700 bg-rose-50 px-2.5 py-0.5 rounded-full">
                Location-First Emergency Triage Radar
              </span>
              <span className="text-xs text-slate-500 font-medium">
                Western Line: Virar to Churchgate
              </span>
            </div>
            <h1 className="text-xl font-extrabold text-slate-900 mt-1">
              Hospitals Segregated by Proximity & Bed/Blood Availability
            </h1>
          </div>

          {/* GPS Quick Detect Button */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={triggerBrowserGps}
              className="px-4 py-2 text-xs font-bold text-slate-800 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors flex items-center gap-1.5 cursor-pointer shadow-2xs"
            >
              <Compass className="w-4 h-4 text-blue-600 animate-spin-slow" />
              {t('detectGps')}
            </button>
          </div>
        </div>

        {patientGpsAcquired && (
          <div className="p-3 rounded-2xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 flex items-center gap-2.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <div>
              <strong>GPS Auto-Located:</strong> {acquiredAddress} · Prioritizing closest facilities to your live coordinates
            </div>
          </div>
        )}

        {/* Primary Filter Rows */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
          {/* 1. Railway Station Selector */}
          <div>
            <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-1">
              Select Western Line Station
            </label>
            <select
              value={selectedStation}
              onChange={(e) => setSelectedStation(e.target.value)}
              className="w-full px-3 py-2 text-xs font-bold text-slate-900 bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:ring-2 focus:ring-rose-500 focus:outline-hidden"
            >
              {WESTERN_LINE_STATIONS.map((station) => (
                <option key={station} value={station}>
                  {station}
                </option>
              ))}
            </select>
          </div>

          {/* 2. Within 2km Range Toggle */}
          <div>
            <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-1">
              Proximity Range
            </label>
            <button
              type="button"
              onClick={() => setWithin2KmOnly(!within2KmOnly)}
              className={`w-full px-3 py-2 text-xs font-bold rounded-xl border transition-all flex items-center justify-between cursor-pointer ${
                within2KmOnly
                  ? 'bg-rose-600 text-white border-rose-600 shadow-2xs'
                  : 'bg-slate-50 text-slate-700 border-slate-300 hover:bg-slate-100'
              }`}
            >
              <span>Within 2 km Range Only</span>
              <span className={`text-[10px] px-2 py-0.5 rounded font-mono ${within2KmOnly ? 'bg-white/20' : 'bg-slate-200'}`}>
                {within2KmOnly ? 'Active' : 'All'}
              </span>
            </button>
          </div>

          {/* 3. Injury Type & Specialist Mapping */}
          <div>
            <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-1">
              Injury / Emergency Condition
            </label>
            <select
              value={selectedInjuryType}
              onChange={(e) => setSelectedInjuryType(e.target.value as InjuryType)}
              className="w-full px-3 py-2 text-xs font-bold text-slate-900 bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:ring-2 focus:ring-rose-500 focus:outline-hidden"
            >
              {injuryOptions.map((opt) => (
                <option key={opt.id} value={opt.id}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          {/* 4. Required Bed Type */}
          <div>
            <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-1">
              Required Bed Type
            </label>
            <select
              value={selectedBedType}
              onChange={(e) => setSelectedBedType(e.target.value as BedType)}
              className="w-full px-3 py-2 text-xs font-bold text-slate-900 bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:ring-2 focus:ring-rose-500 focus:outline-hidden"
            >
              <option value="trauma">Trauma Resuscitation Bay</option>
              <option value="icu">ICU Bed (Intensive Care)</option>
              <option value="ventilator">Ventilator (Life Support)</option>
              <option value="oxygen">Oxygen Bed (HDU)</option>
              <option value="burns">Burns Specialty Bed</option>
              <option value="regular">General Observation Bed</option>
            </select>
          </div>
        </div>

        {/* Patient Blood Group Selection & Hospital Match Highlight */}
        <div className="pt-2 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
              <Droplet className="w-4 h-4 text-rose-600 fill-rose-600" />
              Patient Blood Type Match:
            </span>
            <div className="flex items-center gap-1 flex-wrap">
              {bloodGroups.map((grp) => (
                <button
                  key={grp}
                  type="button"
                  onClick={() => setPatientBloodType(grp)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    patientBloodType === grp
                      ? 'bg-rose-600 text-white shadow-2xs'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  {grp === 'all' ? 'All Groups' : grp}
                </button>
              ))}
            </div>
          </div>

          <div className="text-xs text-slate-500">
            Current Focus: <strong className="text-slate-900">{currentActiveStation} Station</strong> · Sorted by distance first
          </div>
        </div>
      </div>

      {/* REQUIREMENT 2 HERO: REQUEST TOP 3 RANKED HOSPITALS (HOLD & CONFIRM 2-MIN SLA) */}
      {top3Ranked.length >= 3 && (
        <div className="bg-gradient-to-r from-slate-900 via-rose-950 to-slate-900 rounded-3xl p-6 text-white shadow-xl border border-rose-800/40 space-y-4">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/30 text-xs font-bold uppercase tracking-wider">
                <Zap className="w-3.5 h-3.5 fill-rose-400 text-rose-400" />
                Multi-Hospital Hold & Confirm (Top 3 Ranked)
              </div>
              <h2 className="text-lg sm:text-xl font-extrabold text-white tracking-tight">
                Simultaneously Hold Beds Across Top 3 Ranked Hospitals
              </h2>
              <p className="text-xs text-slate-300 max-w-2xl leading-relaxed">
                Send concurrent hold requests to the 3 best-matched hospitals. If all 3 (or any) accept within 2 minutes, you choose the final destination. Ambulance dispatch is prompted once confirmed.
              </p>
            </div>

            <button
              type="button"
              onClick={() => startMultiHoldSession(rankedHospitals, selectedBedType)}
              className="px-6 py-3.5 bg-rose-600 hover:bg-rose-700 text-white font-extrabold text-xs sm:text-sm rounded-2xl shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-95 whitespace-nowrap self-start lg:self-center"
            >
              <ShieldCheck className="w-5 h-5" />
              <span>⚡ Request Top 3 Ranked Hospitals (Hold & Confirm)</span>
            </button>
          </div>

          {/* Preview of the 3 Ranked Hospitals */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-2 border-t border-white/10">
            {top3Ranked.map((hosp, idx) => (
              <div
                key={hosp.id}
                className="p-3.5 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-between text-xs"
              >
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-5 h-5 rounded-full bg-rose-600 text-white font-mono text-[10px] font-bold flex items-center justify-center">
                      #{idx + 1}
                    </span>
                    <span className="font-bold text-white text-xs truncate max-w-[170px] block">
                      {hosp.name}
                    </span>
                  </div>
                  <span className="text-[11px] text-slate-400 mt-0.5 block">
                    {hosp.stationDistanceText} ({hosp.station})
                  </span>
                </div>

                <div className="text-right">
                  <span className="font-mono font-bold text-rose-300 text-xs block">
                    {getBedCount(hosp, selectedBedType)} {selectedBedType.toUpperCase()} Avail
                  </span>
                  <span className="text-[10px] text-emerald-400">
                    O+: {hosp.bloodBank['O+']}u stock
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* REQUIREMENT 1: LOCATION SEGREGATED SECTIONS */}

      {/* Section 1: Immediate Vicinity / Selected Station */}
      {immediateStationGroup.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center gap-2 pb-1 border-b border-slate-200">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-600" />
            <h2 className="text-base font-extrabold text-slate-900">
              Immediate Station Vicinity: {currentActiveStation} Station Area ({immediateStationGroup.length} Hospitals)
            </h2>
            <span className="text-xs font-semibold text-slate-400">· Proximity ≤ 1.5 km</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {immediateStationGroup.map((hospital) => renderHospitalCard(hospital))}
          </div>
        </div>
      )}

      {/* Section 2: Adjacent Stations (Within 3.5 km) */}
      {adjacentStationGroup.length > 0 && (
        <div className="space-y-3 pt-4">
          <div className="flex items-center gap-2 pb-1 border-b border-slate-200">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
            <h2 className="text-base font-extrabold text-slate-900">
              Adjacent Western Line Stations (Within 3.5 km) ({adjacentStationGroup.length} Hospitals)
            </h2>
            <span className="text-xs font-semibold text-slate-400">· Fast Golden-Hour Corridor</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {adjacentStationGroup.map((hospital) => renderHospitalCard(hospital))}
          </div>
        </div>
      )}

      {/* Section 3: Wider Network Stations */}
      {widerNetworkGroup.length > 0 && selectedStation === 'All Stations (Virar to Churchgate)' && (
        <div className="space-y-3 pt-4">
          <div className="flex items-center gap-2 pb-1 border-b border-slate-200">
            <span className="w-2.5 h-2.5 rounded-full bg-slate-400" />
            <h2 className="text-base font-extrabold text-slate-900">
              Greater Western Line Network ({widerNetworkGroup.length} Hospitals)
            </h2>
            <span className="text-xs font-semibold text-slate-400">· Virar to Churchgate</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {widerNetworkGroup.map((hospital) => renderHospitalCard(hospital))}
          </div>
        </div>
      )}

      {/* SINGLE HOSPITAL HOLD MODAL (With Ambulance Oxygen Requirement) */}
      {selectedHospitalForHold && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-rose-100 text-rose-600 flex items-center justify-center">
                  <ShieldCheck className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">
                    Hold Bed (2-Min SLA Confirmation)
                  </h3>
                  <p className="text-xs text-slate-500">
                    {selectedHospitalForHold.name} · {selectedBedType.toUpperCase()} Bay
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedHospitalForHold(null)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4 text-xs">
              <p className="text-slate-700 font-semibold leading-relaxed">
                Before confirming, please specify your emergency ambulance transport requirements:
              </p>

              {/* Choices */}
              <div className="space-y-2.5">
                <label className={`flex items-start gap-3 p-3.5 rounded-2xl border cursor-pointer transition-all ${
                  ambulanceChoice === 'yes_hospital'
                    ? 'border-rose-600 bg-rose-50/70 ring-1 ring-rose-500'
                    : 'border-slate-200 hover:bg-slate-50'
                }`}>
                  <input
                    type="radio"
                    name="ambChoice"
                    checked={ambulanceChoice === 'yes_hospital'}
                    onChange={() => setAmbulanceChoice('yes_hospital')}
                    className="mt-1 text-rose-600 focus:ring-rose-500"
                  />
                  <div className="w-full">
                    <span className="font-bold text-slate-900 block text-xs">
                      Yes, Request Ambulance
                    </span>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      Deploy ambulance from {selectedHospitalForHold.name} directly to your location.
                    </p>

                    {/* Oxygen selection */}
                    {ambulanceChoice === 'yes_hospital' && (
                      <div className="mt-2.5 pt-2.5 border-t border-rose-200 flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => setWithOxygenChoice(true)}
                          className={`px-3 py-1.5 rounded-lg font-bold text-[11px] transition-all cursor-pointer ${
                            withOxygenChoice ? 'bg-rose-600 text-white' : 'bg-white text-slate-700 border border-slate-300'
                          }`}
                        >
                          With Oxygen (ALS)
                        </button>
                        <button
                          type="button"
                          onClick={() => setWithOxygenChoice(false)}
                          className={`px-3 py-1.5 rounded-lg font-bold text-[11px] transition-all cursor-pointer ${
                            !withOxygenChoice ? 'bg-slate-900 text-white' : 'bg-white text-slate-700 border border-slate-300'
                          }`}
                        >
                          Without Oxygen (BLS)
                        </button>
                      </div>
                    )}
                  </div>
                </label>

                <label className={`flex items-start gap-3 p-3.5 rounded-2xl border cursor-pointer transition-all ${
                  ambulanceChoice === 'not_needed'
                    ? 'border-slate-900 bg-slate-50 ring-1 ring-slate-400'
                    : 'border-slate-200 hover:bg-slate-50'
                }`}>
                  <input
                    type="radio"
                    name="ambChoice"
                    checked={ambulanceChoice === 'not_needed'}
                    onChange={() => setAmbulanceChoice('not_needed')}
                    className="mt-1 text-slate-900 focus:ring-slate-500"
                  />
                  <div>
                    <span className="font-bold text-slate-900 block text-xs">
                      No Ambulance Needed (Private / Self-Transport)
                    </span>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      Patient is arriving via private car. The hospital ER gate will be notified.
                    </p>
                  </div>
                </label>
              </div>

              {/* Actions */}
              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setSelectedHospitalForHold(null)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleConfirmSingleHold}
                  className="px-5 py-2.5 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs rounded-xl shadow-md cursor-pointer flex items-center gap-1.5"
                >
                  <span>Lock Bed & Dispatch Request</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  // Helper renderer for hospital card
  function renderHospitalCard(hospital: Hospital) {
    const isSevenHills = hospital.id === 'seven-hills';
    const bloodUnits = patientBloodType !== 'all' ? hospital.bloodBank[patientBloodType] : null;

    const freshness = hospital.lastUpdatedMinutesAgo;
    const freshnessClass =
      freshness <= 5
        ? 'text-emerald-700 bg-emerald-50 border-emerald-200'
        : freshness <= 15
        ? 'text-amber-700 bg-amber-50 border-amber-200'
        : 'text-rose-700 bg-rose-50 border-rose-300 animate-pulse';

    const freshnessLabel =
      freshness <= 5 ? `🟢 Fresh < 5m` : freshness <= 15 ? `🟡 ${freshness}m ago` : `🔴 Stale ${freshness}m`;

    return (
      <div
        key={hospital.id}
        className={`bg-white rounded-3xl border p-5 shadow-xs transition-all space-y-4 ${
          isSevenHills
            ? 'border-rose-400 ring-2 ring-rose-100/80 bg-gradient-to-b from-rose-50/20 to-white'
            : 'border-slate-200 hover:border-slate-300'
        }`}
      >
        {/* Card Header */}
        <div className="flex items-start justify-between gap-3 pb-3 border-b border-slate-100">
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="text-base font-bold text-slate-900">{hospital.name}</h3>
              {isSevenHills && (
                <span className="text-[10px] font-bold text-rose-700 bg-rose-100 px-2 py-0.5 rounded">
                  Recommended Tertiary Hub
                </span>
              )}
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${freshnessClass}`}>
                {freshnessLabel}
              </span>
            </div>

            <p className="text-xs text-slate-500 mt-1 flex items-center gap-1.5 flex-wrap">
              <MapPin className="w-3.5 h-3.5 text-slate-400" />
              <strong className="text-slate-800">{hospital.stationDistanceText}</strong> · Near {hospital.station} Station
            </p>
          </div>

          <a
            href={`tel:${hospital.phone}`}
            className="px-2.5 py-1 text-xs font-bold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-lg flex items-center gap-1 shrink-0"
          >
            <Phone className="w-3 h-3" />
            {hospital.phone}
          </a>
        </div>

        {/* Live Bed Counters */}
        <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 text-center text-xs">
          <div className="p-2 rounded-xl bg-purple-50/70 border border-purple-100">
            <span className="text-[10px] text-purple-700 font-bold block">ICU</span>
            <span className="font-mono text-base font-extrabold text-purple-950">
              {hospital.beds.icuAvailable}
            </span>
          </div>
          <div className="p-2 rounded-xl bg-rose-50/70 border border-rose-100">
            <span className="text-[10px] text-rose-700 font-bold block">Trauma</span>
            <span className="font-mono text-base font-extrabold text-rose-950">
              {hospital.beds.traumaAvailable}
            </span>
          </div>
          <div className="p-2 rounded-xl bg-blue-50/70 border border-blue-100">
            <span className="text-[10px] text-blue-700 font-bold block">Vent</span>
            <span className="font-mono text-base font-extrabold text-blue-950">
              {hospital.beds.ventilatorAvailable}
            </span>
          </div>
          <div className="p-2 rounded-xl bg-emerald-50/70 border border-emerald-100">
            <span className="text-[10px] text-emerald-700 font-bold block">Oxygen</span>
            <span className="font-mono text-base font-extrabold text-emerald-950">
              {hospital.beds.oxygenAvailable}
            </span>
          </div>
          <div className="p-2 rounded-xl bg-amber-50/70 border border-amber-100">
            <span className="text-[10px] text-amber-700 font-bold block">Burns</span>
            <span className="font-mono text-base font-extrabold text-amber-950">
              {hospital.beds.burnsAvailable}
            </span>
          </div>
          <div className="p-2 rounded-xl bg-slate-100 border border-slate-200">
            <span className="text-[10px] text-slate-700 font-bold block">General</span>
            <span className="font-mono text-base font-extrabold text-slate-900">
              {hospital.beds.regularAvailable}
            </span>
          </div>
        </div>

        {/* Matched Blood Stock Alert & Schemes */}
        <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
          <div className="flex items-center gap-2">
            <Droplet className="w-4 h-4 text-rose-600 fill-rose-600 shrink-0" />
            <div>
              {patientBloodType !== 'all' ? (
                <span className="font-medium text-slate-700">
                  {patientBloodType} Stock in Bank:{' '}
                  <strong className="text-rose-700 text-sm font-bold font-mono">
                    {bloodUnits} Units Available
                  </strong>
                </span>
              ) : (
                <span className="font-medium text-slate-700">
                  Blood Bank Stock: O+ ({hospital.bloodBank['O+']}u), B+ ({hospital.bloodBank['B+']}u)
                </span>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2 text-[11px] text-slate-500">
            {hospital.schemes.ayushmanBharat && (
              <span className="font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                PM-JAY Cashless
              </span>
            )}
            <span>Capacity: {hospital.currentLoadPercentage}%</span>
          </div>
        </div>

        {/* On-Duty Doctors Preview */}
        <div className="text-xs text-slate-600">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
            On-Duty Specialists Present:
          </span>
          <div className="flex items-center gap-1.5 flex-wrap">
            {hospital.doctors.slice(0, 3).map((d) => (
              <span
                key={d.id}
                className="px-2 py-0.5 rounded-md bg-white border border-slate-200 text-slate-800 text-[11px] font-medium"
              >
                {d.name} ({d.specialty.split(' ')[0]})
              </span>
            ))}
            {hospital.doctors.length > 3 && (
              <span className="text-[11px] text-slate-400">+{hospital.doctors.length - 3} more</span>
            )}
          </div>
        </div>

        {/* Card Footer Actions */}
        <div className="pt-2 border-t border-slate-100 flex items-center justify-between gap-3">
          <span className="text-[11px] text-slate-500 font-medium">
            2-Minute SLA Guaranteed Hold
          </span>

          <button
            type="button"
            onClick={() => handleOpenHoldModal(hospital)}
            className="px-5 py-2.5 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs rounded-xl shadow-md transition-all flex items-center gap-1.5 cursor-pointer active:scale-95"
          >
            <ShieldCheck className="w-4 h-4" />
            Hold Bed (2-Min SLA)
          </button>
        </div>
      </div>
    );
  }
};
